import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaTrash, FaPlay, FaStop, FaSlidersH, FaLightbulb, FaHandPaper } from 'react-icons/fa';
import AppMgr, { EventType } from '@/managers/appmgr';
import { CustomVarMeta, NetworkTable } from '@/managers/tablemgr';
import { useGridStackWidget } from '../hooks/useGridStackWidget';
import { sendVariableUpdate } from '../utils/xppUtils';
import { startPuppetPassthrough, stopPuppetPassthrough } from '../utils/puppetMode';
import SensorCard from './SensorCard';

/** Variables the puppet passthrough defines on the robot. */
const SERVO_VAR_PATTERN = /^\$servo\.([1-4])$/;
const MOTOR_VAR_PATTERN = /^\$motor\.(left|right|3|4)$/;
const LED_VAR = '$led';
const KEEPALIVE_VAR = '$puppet.keepalive';
const BUTTON_VAR = '$button';
const BOARD_TYPE_VAR = '$board.type';
const STRAIGHT_VAR = '$drivetrain.straight';
const STRAIGHT_EFFORT_VAR = '$drivetrain.straight.effort';
const TURN_VAR = '$drivetrain.turn';
const TURN_EFFORT_VAR = '$drivetrain.turn.effort';
const DRIVE_BUSY_VAR = '$drivetrain.busy';

/** Board type codes reported by the passthrough (XPP has no string type). */
const BOARD_TYPE_NAMES: Record<number, string> = {
  0: 'Beta XRP',
  1: 'XRP',
  2: 'NanoXRP',
};

/** Display order and labels for the motor channels. */
const MOTOR_ORDER: [string, string][] = [
  ['$motor.left', 'Left'],
  ['$motor.right', 'Right'],
  ['$motor.3', 'Motor 3'],
  ['$motor.4', 'Motor 4'],
];

/** A drive magnitude (cm or degrees) is valid when finite and nonzero. */
const isValidDistance = (s: string): boolean => {
  const v = Number(s);
  return isFinite(v) && v !== 0;
};

/** A drive max effort is valid in (0, 1] — 0 would sit still until timeout. */
const isValidEffort = (s: string): boolean => {
  const v = Number(s);
  return isFinite(v) && v > 0 && v <= 1;
};

/** Pacing floor between XPP update rounds while a slider is dragged. */
const SEND_INTERVAL_MS = 30;

/** Keepalive period; the robot stops its motors if the link goes quiet. */
const KEEPALIVE_INTERVAL_MS = 500;

/**
 * Robot control widget for puppet mode.
 *
 * "Start puppet" runs /XRPExamples/puppet_passthrough.py on the robot via the
 * same machinery as the editor's Run button. The robot answers by defining
 * its puppet variables (only the channels the board actually has), which
 * enables the controls: servo angle sliders, motor effort sliders and the
 * LED toggle. Control moves stream XPP variable updates back to the robot,
 * and a periodic keepalive feeds the robot-side motor watchdog.
 */
const PuppetControlWidget: React.FC = () => {
  const { handleDelete } = useGridStackWidget();

  // Puppet variable name → metadata, discovered from NetworkTable VAR_DEFs
  const [varMeta, setVarMeta] = useState<Record<string, CustomVarMeta>>({});
  // Slider/toggle positions (angles in degrees, efforts in percent)
  const [angles, setAngles] = useState<Record<string, number>>({});
  const [efforts, setEfforts] = useState<Record<string, number>>({});
  const [ledOn, setLedOn] = useState(false);
  // User button state pushed by the robot (null until the first update)
  const [buttonPressed, setButtonPressed] = useState<boolean | null>(null);
  // Board type name reported by the robot (null until the first update)
  const [boardType, setBoardType] = useState<string | null>(null);
  // Drivetrain state: straight() blocks the robot's loop, so $drivetrain.busy
  // is the only feedback while a drive runs
  const [driveBusy, setDriveBusy] = useState(false);
  // Blocking-command parameters: distance/degrees plus max effort (0-1)
  const [driveDistance, setDriveDistance] = useState('30');
  const [straightEffort, setStraightEffort] = useState('0.5');
  const [turnDegrees, setTurnDegrees] = useState('90');
  const [turnEffort, setTurnEffort] = useState('0.5');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(false);

  // Self-pacing send pump. While a write is in flight, newer slider values
  // just overwrite the pending slot, so the next send always carries the
  // newest setpoint and intermediate positions are dropped instead of queued.
  // (A fixed-rate sender backlogs on slow links — BLE GATT writes especially —
  // and the actuators then crawl through stale positions long after the drag.)
  const pendingValues = useRef<Record<string, number>>({});
  const pumpRunning = useRef(false);
  const metaRef = useRef(varMeta);
  metaRef.current = varMeta;
  // Set once the robot itself reports a drive in progress; used to clear an
  // optimistic busy state when the Go command never made it to the robot
  const driveConfirmed = useRef(false);

  useEffect(() => {
    const handleData = (data: string) => {
      try {
        const table: NetworkTable = JSON.parse(data);
        const meta = table.__customVarMeta as Record<string, CustomVarMeta> | undefined;
        if (!meta) return;

        const puppetVars: Record<string, CustomVarMeta> = {};
        for (const [name, entry] of Object.entries(meta)) {
          if (
            SERVO_VAR_PATTERN.test(name) ||
            MOTOR_VAR_PATTERN.test(name) ||
            name === LED_VAR ||
            name === KEEPALIVE_VAR ||
            name === BUTTON_VAR ||
            name === BOARD_TYPE_VAR ||
            name === STRAIGHT_VAR ||
            name === STRAIGHT_EFFORT_VAR ||
            name === TURN_VAR ||
            name === TURN_EFFORT_VAR ||
            name === DRIVE_BUSY_VAR
          ) {
            puppetVars[name] = entry;
          }
        }

        // Drive-in-progress flag, pushed by the robot around straight()
        const busyValue = table[DRIVE_BUSY_VAR];
        if (typeof busyValue === 'number') {
          if (busyValue !== 0) driveConfirmed.current = true;
          setDriveBusy(busyValue !== 0);
        }

        // The robot pushes the button state on change (edge interrupt);
        // TableMgr exposes it as a top-level 1/0 value.
        const buttonValue = table[BUTTON_VAR];
        if (typeof buttonValue === 'number') {
          setButtonPressed(buttonValue !== 0);
        }

        // Board type is sent once at passthrough startup.
        const boardValue = table[BOARD_TYPE_VAR];
        if (typeof boardValue === 'number') {
          setBoardType(BOARD_TYPE_NAMES[boardValue] ?? `Unknown (${boardValue})`);
        }

        // Only touch state when the set of puppet definitions changes
        setVarMeta((prev) => {
          const prevKeys = Object.keys(prev).sort().join();
          const nextKeys = Object.keys(puppetVars).sort().join();
          return prevKeys === nextKeys ? prev : puppetVars;
        });
      } catch {
        // ignore parse errors
      }
    };

    AppMgr.getInstance().on(EventType.EVENT_DASHBOARD_DATA, handleData);
    return () => {
    };
  }, []);

  // Keepalive ticker: feeds the robot-side watchdog that stops the motors
  // when the browser goes away (tab closed, cable pulled, BLE drop).
  useEffect(() => {
    const meta = varMeta[KEEPALIVE_VAR];
    if (!meta) return;

    let tick = 0;
    const id = setInterval(() => {
      tick = (tick + 1) % 0x7fffffff;
      void sendVariableUpdate(meta, tick);
    }, KEEPALIVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [varMeta]);

  const queueSend = useCallback((name: string, value: number) => {
    pendingValues.current[name] = value;
    if (pumpRunning.current) return; // pump will pick this value up

    pumpRunning.current = true;
    void (async () => {
      try {
        while (Object.keys(pendingValues.current).length > 0) {
          // Take a snapshot; anything set while we await lands in the next round
          const batch = pendingValues.current;
          pendingValues.current = {};
          for (const [varName, value] of Object.entries(batch)) {
            const meta = metaRef.current[varName];
            if (meta) {
              await sendVariableUpdate(meta, value);
            }
          }
          // Pacing floor so a fast link doesn't spam the robot
          await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
        }
      } finally {
        pumpRunning.current = false;
      }
    })();
  }, []);

  const handleAngleChange = useCallback((name: string, value: number) => {
    setAngles((prev) => ({ ...prev, [name]: value }));
    queueSend(name, value);
  }, [queueSend]);

  const handleEffortChange = useCallback((name: string, percent: number) => {
    setEfforts((prev) => ({ ...prev, [name]: percent }));
    queueSend(name, percent / 100);
  }, [queueSend]);

  const handleLedToggle = useCallback(() => {
    setLedOn((prev) => {
      queueSend(LED_VAR, prev ? 0 : 1);
      return !prev;
    });
  }, [queueSend]);

  const handleMotorsStop = useCallback(() => {
    setEfforts((prev) => {
      const zeroed: Record<string, number> = {};
      for (const key of Object.keys(prev)) zeroed[key] = 0;
      return zeroed;
    });
    for (const [name] of MOTOR_ORDER) {
      if (metaRef.current[name]) {
        queueSend(name, 0);
      }
    }
  }, [queueSend]);

  /**
   * Start a blocking drivetrain command (straight or turn). The effort
   * parameter is written first, then the command trigger — variable writes
   * apply in order on the robot, so the effort is in place before the
   * motion starts. The motion ends with the motors stopped and the robot
   * discards any efforts that arrive mid-motion, so the motor sliders are
   * zeroed to match. Sent directly (not via the pump): discrete commands
   * must never be coalesced away like slider intermediates.
   */
  const startBlockingDrive = useCallback(async (
    commandVar: string, valueStr: string,
    effortVar: string, effortStr: string,
  ) => {
    const commandMeta = metaRef.current[commandVar];
    const effortMeta = metaRef.current[effortVar];
    const value = Number(valueStr);
    const effort = Number(effortStr);
    if (!commandMeta || !isFinite(value) || value === 0) return;
    if (!isFinite(effort) || effort <= 0 || effort > 1) return;

    setEfforts((prev) => {
      const zeroed: Record<string, number> = {};
      for (const key of Object.keys(prev)) zeroed[key] = 0;
      return zeroed;
    });
    setDriveBusy(true); // optimistic; the robot's busy update confirms it
    driveConfirmed.current = false;

    if (effortMeta) {
      await sendVariableUpdate(effortMeta, effort);
    }
    void sendVariableUpdate(commandMeta, value);

    // If the command was lost (e.g. a BLE hiccup) the robot never reports
    // busy — clear the optimistic state instead of leaving the controls
    // disabled forever.
    setTimeout(() => {
      if (!driveConfirmed.current) {
        setDriveBusy(false);
      }
    }, 3000);
  }, []);

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    setStartError(false);
    const ok = await startPuppetPassthrough();
    setIsStarting(false);
    setStartError(!ok);
  }, []);

  const servoNames = Object.keys(varMeta).filter((n) => SERVO_VAR_PATTERN.test(n)).sort();
  const motorEntries = MOTOR_ORDER.filter(([name]) => varMeta[name]);
  const hasLed = LED_VAR in varMeta;
  const hasButton = BUTTON_VAR in varMeta;
  const hasStraight = STRAIGHT_VAR in varMeta;
  const hasTurn = TURN_VAR in varMeta;
  const hasDrive = hasStraight || hasTurn;
  const isLive = servoNames.length > 0 || motorEntries.length > 0 || hasLed || hasButton || hasDrive;

  return (
    <SensorCard
      title="Robot Control"
      icon={<FaSlidersH size={12} />}
      onStart={() => { }}
      onStop={() => { }}
      isConnected={isLive}
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={handleDelete}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
          title="Delete widget"
        >
          <FaTrash size={12} />
        </button>
      </div>

      <div className="flex flex-col w-full h-full p-3 pt-10 gap-3">
        {/* Puppet mode start/stop */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-40"
            title="Run the puppet passthrough program on the XRP"
          >
            <FaPlay size={10} />
            {isStarting ? 'Starting…' : 'Start puppet'}
          </button>
          <button
            onClick={() => stopPuppetPassthrough()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded"
            title="Stop the program on the XRP"
          >
            <FaStop size={10} />
            Stop
          </button>
          {isLive && boardType && (
            <span
              className="ml-auto px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              title="Board type reported by the robot"
            >
              {boardType}
            </span>
          )}
        </div>

        {!isLive ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
            <div className="text-gray-400 text-sm">
              Start puppet mode to control the robot
            </div>
            <div className="text-gray-300 text-xs">
              Runs XRPExamples/puppet_passthrough.py on the robot
              (requires the XRPLib examples to be installed)
            </div>
            {startError && (
              <div className="text-red-400 text-xs mt-1">
                Could not start — check that the XRP is connected
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {/* LED */}
            {hasLed && (
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm text-gray-600 dark:text-gray-300">LED</span>
                <button
                  onClick={handleLedToggle}
                  disabled={driveBusy}
                  className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors duration-150 disabled:opacity-40 ${ledOn
                    ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  title="Toggle the onboard LED"
                >
                  <FaLightbulb size={12} />
                  {ledOn ? 'On' : 'Off'}
                </button>
              </div>
            )}

            {/* User button (read-only; robot pushes changes via edge interrupt) */}
            {hasButton && (
              <div className="flex items-center gap-3">
                <span className="w-16 text-sm text-gray-600 dark:text-gray-300">Button</span>
                <span
                  className={`px-3 py-1 text-sm rounded transition-colors duration-150 ${buttonPressed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                  {buttonPressed === null ? '—' : buttonPressed ? 'Pressed' : 'Released'}
                </span>
              </div>
            )}

            {/* Drivetrain: continuous effort plus the blocking straight/turn
                commands (controls freeze until a blocking motion completes,
                so everything is gated on busy) */}
            {hasDrive && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Drivetrain</span>
                  {driveBusy && (
                    <span className="text-xs text-gray-400">
                      controls paused until the robot arrives
                    </span>
                  )}
                </div>
                {hasStraight && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-sm text-gray-600 dark:text-gray-300">Straight</span>
                    <input
                      type="number"
                      value={driveDistance}
                      onChange={(e) => setDriveDistance(e.target.value)}
                      disabled={driveBusy}
                      step="any"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                      title="Distance in cm (negative drives backward)"
                    />
                    <span className="text-sm text-gray-500">cm</span>
                    <input
                      type="number"
                      value={straightEffort}
                      onChange={(e) => setStraightEffort(e.target.value)}
                      disabled={driveBusy}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                      title="Max effort, 0-1"
                    />
                    <span className="text-sm text-gray-500">effort</span>
                    <button
                      onClick={() => void startBlockingDrive(STRAIGHT_VAR, driveDistance, STRAIGHT_EFFORT_VAR, straightEffort)}
                      disabled={driveBusy || !isValidDistance(driveDistance) || !isValidEffort(straightEffort)}
                      className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-40"
                      title="Drive straight the given distance at the given max effort (robot controls are unavailable while driving)"
                    >
                      Go
                    </button>
                  </div>
                )}
                {hasTurn && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-sm text-gray-600 dark:text-gray-300">Turn</span>
                    <input
                      type="number"
                      value={turnDegrees}
                      onChange={(e) => setTurnDegrees(e.target.value)}
                      disabled={driveBusy}
                      step="any"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                      title="Degrees to turn (positive = counterclockwise)"
                    />
                    <span className="text-sm text-gray-500">°</span>
                    <input
                      type="number"
                      value={turnEffort}
                      onChange={(e) => setTurnEffort(e.target.value)}
                      disabled={driveBusy}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                      title="Max effort, 0-1"
                    />
                    <span className="text-sm text-gray-500">effort</span>
                    <button
                      onClick={() => void startBlockingDrive(TURN_VAR, turnDegrees, TURN_EFFORT_VAR, turnEffort)}
                      disabled={driveBusy || !isValidDistance(turnDegrees) || !isValidEffort(turnEffort)}
                      className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-40"
                      title="Turn in place by the given angle at the given max effort (robot controls are unavailable while turning)"
                    >
                      Go
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Motor efforts */}
            {motorEntries.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-gray-400">Motors</span>
                  <button
                    onClick={handleMotorsStop}
                    disabled={driveBusy}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded disabled:opacity-40"
                    title="Set all motor efforts to zero (cannot interrupt a drive; use Stop above for that)"
                  >
                    <FaHandPaper size={10} />
                    STOP
                  </button>
                </div>
                {motorEntries.map(([name, label]) => {
                  const percent = efforts[name] ?? 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-gray-600 dark:text-gray-300">
                        {label}
                      </span>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        step={5}
                        value={percent}
                        disabled={driveBusy}
                        onChange={(e) => handleEffortChange(name, Number(e.target.value))}
                        className="flex-1 accent-blue-500 disabled:opacity-50"
                      />
                      <span className="w-12 text-right text-sm font-mono text-gray-700 dark:text-gray-200">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Servo angles */}
            {servoNames.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-gray-400">Servos</span>
                {servoNames.map((name) => {
                  const index = name.match(SERVO_VAR_PATTERN)?.[1] ?? '?';
                  const angle = angles[name] ?? 90;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-gray-600 dark:text-gray-300">
                        Servo {index}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={180}
                        step={1}
                        value={angle}
                        disabled={driveBusy}
                        onChange={(e) => handleAngleChange(name, Number(e.target.value))}
                        className="flex-1 accent-blue-500 disabled:opacity-50"
                      />
                      <span className="w-10 text-right text-sm font-mono text-gray-700 dark:text-gray-200">
                        {angle}°
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </SensorCard>
  );
};

export default PuppetControlWidget;

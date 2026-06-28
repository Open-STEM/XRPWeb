"""
XRP Puppet Passthrough

Provides full remote control (motors, servos, drivetrain) and telemetry
streaming to the PuppetPassthrough web app via Bluetooth Low Energy.

start() arms two Timer IRQs and returns immediately — same mechanism as
Dashboard and Gamepad. The REPL and all user programs run normally alongside
it. Control outputs (motors, servos, LED) are only applied while a BLE
central is connected, so there is no impact when the web app is not in use.

Drivetrain straight/turn commands are dispatched via micropython.schedule()
so they execute in the main thread and block user code for their duration,
exactly like a blocking call in user code would. All other control is
non-blocking and transparent to the user program.

Once the user has uploaded XRPLib to the robot, passthrough works on every
subsequent boot with no further action required.
"""

import micropython
from machine import Timer
from XRPLib.defaults import *
from XRPLib.puppet import (Puppet, VAR_TYPE_INT, VAR_TYPE_FLOAT, VAR_TYPE_BOOL,
                            PERM_READ_ONLY, PERM_WRITE_ONLY, PERM_READ_WRITE)


class PuppetPassthrough:

    _DEFAULT_INSTANCE = None

    @classmethod
    def get_default(cls):
        if cls._DEFAULT_INSTANCE is None:
            cls._DEFAULT_INSTANCE = cls()
        return cls._DEFAULT_INSTANCE

    def __init__(self):
        self._left_motor  = left_motor
        self._right_motor = right_motor
        self._motor_3     = motor_three
        # motor_four is only defined on boards that have a 4th motor port
        try:
            self._motor_4 = motor_four
        except NameError:
            self._motor_4 = motor_three

        self._drivetrain  = drivetrain
        self._imu         = imu
        self._rangefinder = rangefinder
        self._reflectance = reflectance
        self._board       = board

        # Detect board type: 0=XRP Beta (no NeoPixel), 1=XRP, 2=NanoXRP
        if 'NanoXRP' in implementation._machine:
            self._board_type = 2
        elif hasattr(Pin.board, 'BOARD_NEOPIXEL'):
            self._board_type = 1
        else:
            self._board_type = 0

        self._led_state       = False
        self._drivetrain_busy = False
        self._resend_pending  = False

        self._motors = [self._left_motor, self._right_motor, self._motor_3, self._motor_4]

        # servo_three / servo_four are only defined on boards that expose those ports
        self._servos = [servo_one, servo_two]
        try:
            self._servos.append(servo_three)
        except NameError:
            self._servos.append(None)
        try:
            self._servos.append(servo_four)
        except NameError:
            self._servos.append(None)

        # Private BLE Puppet — NOT the shared singleton. This keeps the singleton
        # (used by Dashboard/Gamepad in user programs) free to initialise in AUTO
        # mode over USB when the IDE is connected.
        self._puppet = Puppet('BLE')

        # Request a higher ATT MTU so all 16 telemetry variables fit in one
        # BLE notification (~100 bytes). Without this the MTU is 23 bytes
        # (20-byte payload) which would truncate the batched packet.
        # Chrome negotiates automatically; this sets the peripheral's preference.
        try:
            import bluetooth
            bluetooth.BLE().config(mtu=512)
        except Exception:
            pass

        self._register_variables()

        # Defer VAR_DEF resends out of the BLE IRQ to avoid gatts_notify re-entrancy.
        def _on_program_start():
            self._puppet._program_running = True
            self._resend_pending = True
        self._puppet._handle_program_start = _on_program_start

        self._telemetry_timer = Timer(-1)
        self._control_timer   = Timer(-1)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _set_internal(self, name, value):
        """Write a variable value directly without triggering a BLE send."""
        vi = self._puppet._variables[name]
        self._puppet._variables[name] = (vi[0], vi[1], vi[2], value, vi[4], vi[5])

    def _register_variables(self):
        # --- Control variables (browser → robot) ---
        for i in range(4):                                                       # IDs 38-41
            self._puppet.define_variable('$puppet.motor.' + str(i), VAR_TYPE_FLOAT, PERM_WRITE_ONLY)
        for i in range(4):                                                       # IDs 42-45
            self._puppet.define_variable('$puppet.servo.' + str(i), VAR_TYPE_FLOAT, PERM_WRITE_ONLY)
            self._set_internal('$puppet.servo.' + str(i), 90.0)
        self._puppet.define_variable('$puppet.drivetrain.stop',     VAR_TYPE_BOOL,  PERM_WRITE_ONLY)  # ID 46
        self._puppet.define_variable('$puppet.drivetrain.distance', VAR_TYPE_FLOAT, PERM_READ_WRITE)  # ID 47
        self._puppet.define_variable('$puppet.drivetrain.angle',    VAR_TYPE_FLOAT, PERM_READ_WRITE)  # ID 48
        self._puppet.define_variable('$puppet.led',                 VAR_TYPE_BOOL,  PERM_WRITE_ONLY)  # ID 49

        # --- Read-only telemetry (robot → browser) ---
        self._puppet.define_variable('$puppet.board_type', VAR_TYPE_INT,  PERM_READ_ONLY)  # ID 50
        # Encoder names must match _STANDARD_VAR_IDS in puppet.py so they get
        # their pre-assigned IDs (26-29) instead of new custom IDs.
        self._puppet.define_variable('$encoder.left',  VAR_TYPE_INT, PERM_READ_ONLY)  # ID 26
        self._puppet.define_variable('$encoder.right', VAR_TYPE_INT, PERM_READ_ONLY)  # ID 27
        self._puppet.define_variable('$encoder.3',     VAR_TYPE_INT, PERM_READ_ONLY)  # ID 28
        self._puppet.define_variable('$encoder.4',     VAR_TYPE_INT, PERM_READ_ONLY)  # ID 29
        self._puppet.define_variable('$puppet.button', VAR_TYPE_BOOL, PERM_READ_ONLY) # ID 51

        # Standard telemetry vars — pre-seeded IDs 20-25, 34-37; no VAR_DEF sent.
        for name in ('$imu.yaw', '$imu.roll', '$imu.pitch',
                     '$imu.acc_x', '$imu.acc_y', '$imu.acc_z'):
            self._puppet.define_variable(name, VAR_TYPE_FLOAT, PERM_READ_ONLY)
        for name in ('$rangefinder.distance', '$reflectance.left',
                     '$reflectance.right', '$voltage'):
            self._puppet.define_variable(name, VAR_TYPE_FLOAT, PERM_READ_ONLY)

    # ------------------------------------------------------------------
    # Scheduled callbacks — run in main-thread context via micropython.schedule
    # ------------------------------------------------------------------

    def _resend_program_start(self, _=None):
        """Send PROGRAM_START so the browser calls sendInitialValues()."""
        self._puppet.send_program_start()

    def _do_straight(self, dist):
        """Blocking drivetrain straight — preempts user code for its duration."""
        try:
            self._drivetrain.straight(dist, max_effort=0.8, timeout=5.0)
        finally:
            self._set_internal('$puppet.drivetrain.distance', 0.0)
            self._drivetrain_busy = False

    def _do_turn(self, angle):
        """Blocking drivetrain turn — preempts user code for its duration."""
        try:
            self._drivetrain.turn(angle, max_effort=0.5, timeout=5.0)
        finally:
            self._set_internal('$puppet.drivetrain.angle', 0.0)
            self._drivetrain_busy = False

    # ------------------------------------------------------------------
    # Timer IRQ callbacks
    # ------------------------------------------------------------------

    def _update_telemetry(self):
        """
        Fires at telemetry_hz. Reads all sensors and sends one batched
        BLE notification. Each sensor is wrapped individually so a missing
        peripheral (e.g. no rangefinder plugged in) doesn't kill the others.
        Only runs when a BLE central is connected.
        """
        if not self._puppet._transport._connections:
            return

        updated = []

        try:
            self._set_internal('$imu.yaw',   self._imu.get_yaw())
            updated.append('$imu.yaw')
        except Exception: pass
        try:
            self._set_internal('$imu.roll',  self._imu.get_roll())
            updated.append('$imu.roll')
        except Exception: pass
        try:
            self._set_internal('$imu.pitch', self._imu.get_pitch())
            updated.append('$imu.pitch')
        except Exception: pass
        try:
            self._set_internal('$imu.acc_x', self._imu.get_acc_x())
            updated.append('$imu.acc_x')
        except Exception: pass
        try:
            self._set_internal('$imu.acc_y', self._imu.get_acc_y())
            updated.append('$imu.acc_y')
        except Exception: pass
        try:
            self._set_internal('$imu.acc_z', self._imu.get_acc_z())
            updated.append('$imu.acc_z')
        except Exception: pass
        try:
            self._set_internal('$encoder.left',  self._left_motor.get_position_counts())
            updated.append('$encoder.left')
        except Exception: pass
        try:
            self._set_internal('$encoder.right', self._right_motor.get_position_counts())
            updated.append('$encoder.right')
        except Exception: pass
        try:
            self._set_internal('$encoder.3',     self._motor_3.get_position_counts())
            updated.append('$encoder.3')
        except Exception: pass
        try:
            self._set_internal('$encoder.4',     self._motor_4.get_position_counts())
            updated.append('$encoder.4')
        except Exception: pass
        # rangefinder.distance() blocks up to 30ms waiting for the echo pulse.
        # Skipping it during blocking drivetrain commands prevents the IRQ from
        # disrupting the turn/straight PID loop and causing overshoot.
        if not self._drivetrain_busy:
            try:
                self._set_internal('$rangefinder.distance', self._rangefinder.distance())
                updated.append('$rangefinder.distance')
            except Exception: pass
        try:
            self._set_internal('$reflectance.left',  self._reflectance.get_left())
            updated.append('$reflectance.left')
        except Exception: pass
        try:
            self._set_internal('$reflectance.right', self._reflectance.get_right())
            updated.append('$reflectance.right')
        except Exception: pass
        try:
            self._set_internal('$puppet.board_type', self._board_type)
            updated.append('$puppet.board_type')
        except Exception: pass
        try:
            self._set_internal('$puppet.button', self._board.is_button_pressed())
            updated.append('$puppet.button')
        except Exception: pass
        try:
            self._set_internal('$voltage', self._board.get_battery_voltage())
            updated.append('$voltage')
        except Exception: pass

        if updated:
            try:
                self._puppet._send_batched_var_updates(updated)
            except Exception:
                pass

    def _apply_controls(self):
        """
        Fires at control_hz. Applies all control outputs from the web app.

        Drivetrain commands are dispatched via micropython.schedule() so they
        execute in the main thread rather than inside this IRQ, allowing them
        to block without holding the timer.
        """
        if self._resend_pending:
            self._resend_pending = False
            try:
                micropython.schedule(self._resend_program_start, None)
            except Exception:
                pass
            return

        if not self._puppet._transport._connections:
            return

        # While a blocking drivetrain command is running in the main thread,
        # skip direct motor/servo writes so we don't fight its PID loop.
        if not self._drivetrain_busy:
            # Motor efforts (-1.0 to 1.0)
            for i, motor in enumerate(self._motors):
                motor.set_effort(self._puppet.get_variable('$puppet.motor.' + str(i)))

            # Servo angles (0-180°)
            for i, sv in enumerate(self._servos):
                if sv is not None:
                    sv.set_angle(self._puppet.get_variable('$puppet.servo.' + str(i)))

        # LED — track state locally so we only toggle on change
        led = self._puppet.get_variable('$puppet.led')
        if led != self._led_state:
            self._led_state = led
            self._board.led_on() if led else self._board.led_off()

        # Drivetrain stop (immediate, non-blocking)
        if self._puppet.get_variable('$puppet.drivetrain.stop'):
            self._drivetrain.stop()
            self._set_internal('$puppet.drivetrain.stop', False)
            return

        # Drivetrain straight/turn — one command at a time, dispatched to
        # main thread so the blocking PID loop runs outside this IRQ.
        if not self._drivetrain_busy:
            dist = self._puppet.get_variable('$puppet.drivetrain.distance')
            if dist != 0.0:
                self._drivetrain_busy = True
                self._set_internal('$puppet.drivetrain.distance', 0.0)
                try:
                    micropython.schedule(self._do_straight, dist)
                except Exception:
                    self._drivetrain_busy = False
            else:
                angle = self._puppet.get_variable('$puppet.drivetrain.angle')
                if angle != 0.0:
                    self._drivetrain_busy = True
                    self._set_internal('$puppet.drivetrain.angle', 0.0)
                    try:
                        micropython.schedule(self._do_turn, angle)
                    except Exception:
                        self._drivetrain_busy = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self, telemetry_hz=5, control_hz=50):
        """
        Arm the background telemetry and control timers and return immediately.

        The REPL and all user programs continue to run normally. These timers
        fire as IRQs in the background, identical to how Dashboard and Gamepad
        already work.
        """
        self._telemetry_timer.init(
            period=int(1000 / telemetry_hz),
            mode=Timer.PERIODIC,
            callback=lambda t: self._update_telemetry()
        )
        self._control_timer.init(
            period=int(1000 / control_hz),
            mode=Timer.PERIODIC,
            callback=lambda t: self._apply_controls()
        )

    def stop(self):
        """Stop all timers and zero actuators. Reboot to restart."""
        self._control_timer.deinit()
        self._telemetry_timer.deinit()
        self._drivetrain.stop()
        for motor in self._motors:
            motor.set_effort(0.0)
        self._board.led_off()
        self._puppet.send_program_end()
        if self._puppet._transport is not None:
            try:
                self._puppet._transport.clear_data_callback()
            except Exception:
                pass

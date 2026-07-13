import AppMgr from '@/managers/appmgr';
import { CommandToXRPMgr } from '@/managers/commandstoxrpmgr';

/**
 * Puppet mode: run the XRPLib puppet passthrough program on the robot so the
 * dashboard can drive its actuators directly over XPP variable updates.
 *
 * The switch rides the same machinery as the editor's Run button
 * (stopProgram → updateMainFile → executeLines); the passthrough ships with
 * the XRPLib examples, so nothing is uploaded. Once it starts, the robot
 * sends VAR_DEFs for its $servo.N variables — their arrival in the
 * NetworkTable is the confirmation that puppet mode is live.
 */

/** On-robot path of the passthrough program (flashed with the XRPLib examples). */
export const PUPPET_PASSTHROUGH_PATH = '/XRPExamples/puppet_passthrough.py';

/**
 * Start puppet mode on the connected XRP.
 * Returns false when there is no connection or the run machinery is busy;
 * the caller should watch the NetworkTable for $servo.N definitions to know
 * the passthrough is actually up.
 */
export async function startPuppetPassthrough(): Promise<boolean> {
    const connection = AppMgr.getInstance().getConnection();
    if (!connection?.isConnected()) {
        return false;
    }

    const cmdMgr = CommandToXRPMgr.getInstance();

    // Interrupt any running user program (guarded no-op when idle), and give
    // the interrupt/REPL a moment to settle before starting the passthrough.
    cmdMgr.stopProgram();
    await new Promise((resolve) => setTimeout(resolve, 500));

    const lines = await cmdMgr.updateMainFile(PUPPET_PASSTHROUGH_PATH);
    if (!lines) {
        return false; // run machinery busy
    }
    await cmdMgr.executeLines(lines);
    return true;
}

/** Stop puppet mode — identical to pressing STOP on a running program. */
export function stopPuppetPassthrough(): void {
    CommandToXRPMgr.getInstance().stopProgram();
}

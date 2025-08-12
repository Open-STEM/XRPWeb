// ##### joystickmgr.ts #####
// Wraps the joystick procedures into a class

class Joystick {

    // State Arrays
    private joysticksArray: number[] = [
        0.0, // x1
        0.0, // y1
        0.0, // x2
        0.0, // y2
        0,   // bA
        0,   // bB
        0,   // bX
        0,   // bY
        0,   // bL
        0,   // bR
        0,   // tL
        0,   // tR
        0,   // bK
        0,   // sT
        0,   // dU
        0,   // dD
        0,   // dL
        0,   // dR
    ];

    private lastsentArray: number[] = [];

    // Array indexes (readonly as they are constants)
    private readonly x1: number = 0;
    private readonly y1: number = 1;
    private readonly x2: number = 2;
    private readonly y2: number = 3;
    private readonly bA: number = 4;
    private readonly bB: number = 5;
    private readonly bX: number = 6;
    private readonly bY: number = 7;
    private readonly bL: number = 8;
    private readonly bR: number = 9;
    private readonly tL: number = 10;
    private readonly tR: number = 11;
    private readonly bK: number = 12;
    private readonly sT: number = 13;
    private readonly dU: number = 14;
    private readonly dD: number = 15;
    private readonly dL: number = 16;
    private readonly dR: number = 17;


    // Keycodes being used (readonly as they are constants)
    private readonly left1: string = 'KeyA';
    private readonly right1: string = 'KeyD';
    private readonly up1: string = 'KeyW';
    private readonly down1: string = 'KeyS';
    private readonly left2: string = 'KeyJ';
    private readonly right2: string = 'KeyL';
    private readonly up2: string = 'KeyI';
    private readonly down2: string = 'KeyK';
    private readonly buttonA: string = 'Digit1';
    private readonly buttonB: string = 'Digit2';
    private readonly buttonX: string = 'Digit3';
    private readonly buttonY: string = 'Digit4';
    private readonly bumperL: string = 'Digit5';
    private readonly bumperR: string = 'Digit6';
    private readonly triggerL: string = 'Digit7';
    private readonly triggerR: string = 'Digit8';
    private readonly back: string = 'Digit9';
    private readonly start: string = 'Digit0';

    // State Flags and Indices
    private listening: boolean = false;
    private sendPacket: boolean = false; // Controls if sendAPacket actually sends
    private sendingPacket: boolean = false; //don't re-enter to send next if the last one hasn't finished

    private controllerIndex: number = -1; // Use -1 to indicate no controller initially
    private intervalID: number | undefined = undefined; // Using number for browser compatibility

    // Callback for sending data (must be set from outside)
    public writeToDevice: ((data: Uint8Array) => Promise<void>) | undefined = undefined;

    constructor() {
        // Bind the context of 'this' for the interval callback
        this.sendAPacket = this.sendAPacket.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
        this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);

        // Start listening for keyboard/gamepad events immediately
        this.startListening();
    }

    // --- Public Methods ---

    /**
     * Starts sending joystick/keyboard state packets periodically.
     */
    public startJoyPackets(): void {
        this.lastsentArray = this.joysticksArray.slice(); // Initialize last sent state
        this.listening = true; // Ensure listeners are active
        this.sendPacket = true; // Allow packets to be sent
        if (this.intervalID === undefined) {
            this.intervalID = window.setInterval(this.sendAPacket, 60); // Use window.setInterval for browser env
        }
    }

    /**
     * Stops sending joystick/keyboard state packets.
     */
    public stopJoyPackets(): void {
        this.listening = false; // Stop reacting to input events (optional, depends on desired behavior)
        this.sendPacket = false; // Prevent packets from being sent
        if (this.intervalID !== undefined) {
            clearInterval(this.intervalID);
            this.intervalID = undefined;
        }
        // Optionally reset joystick array to zero state
        // this.joysticksArray.fill(0);
        // this.lastsentArray = this.joysticksArray.slice();
    }

    // --- Private Methods ---

    /**
     * Quantizes a float in the range [-1, 1] into an integer from 0 to 255.
     */
    private quantizeFloat(value: number): number {
        // Clamp value to [-1, 1] just in case
        const clampedValue = Math.max(-1, Math.min(1, value));
        // Scale value from [-1,1] to [0,255]
        return Math.round((clampedValue + 1) * 127.5);
    }

    /**
     * Creates a byte array containing only the changed joystick values.
     * Format: [0x55, num_changes, index1, value1, index2, value2, ...]
     */
    private getChangedBytes(current: number[], last: number[], tolerance: number = 0.001): Uint8Array {
        const changes: number[] = [];
        for (let i = 0; i < current.length; i++) {
            // Only consider sending a change if the difference exceeds the tolerance
            if (Math.abs(current[i] - last[i]) > tolerance || i < 4) { //always update for the joystick numbers
                changes.push(i); // byte representing the array index
                changes.push(this.quantizeFloat(current[i])); // byte representing the new value
              }
        }

        const header = [0x55, changes.length];
        const results = new Uint8Array(header.length + changes.length);
        results.set(header);
        results.set(changes, header.length);
        return results;
    }

    /**
     * Periodically called to send the current joystick state if changed.
     */
    private async sendAPacket(): Promise<void> {
        if(this.sendingPacket) return;
        if (this.sendPacket) {
            this.sendingPacket = true;
            // If a gamepad is connected, update the status from it first
            this.updateStatus(); // Reads keyboard state OR gamepad state

            const sending = this.getChangedBytes(this.joysticksArray, this.lastsentArray);

            // Only send if there are actual changes (sending[1] > 0)
            if (sending.length > 2 && sending[1] > 0) {
                 if (this.writeToDevice) {
                    try {
                        await this.writeToDevice(sending);
                        // Update last sent state only after successful send
                        this.lastsentArray = this.joysticksArray.slice();
                    } catch (error) {
                        console.error("Error writing joystick data:", error);
                        // Decide if we should stop sending or retry?
                        // For now, we'll keep trying but won't update lastsentArray
                    }
                 } else {
                     // console.warn("Joystick: writeToDevice callback is not set.");
                     // Silently ignore if no callback is set, or log warning.
                 }
            } else {
                 // No changes detected, update lastsentArray anyway?
                 // It's safer to update it only when data is successfully sent.
                 // If we don't update here, the next packet will compare against the last *sent* state.
                 // Let's update it here to reflect the current actual state as the basis for the *next* comparison.
                 this.lastsentArray = this.joysticksArray.slice();
                 this.sendingPacket = false;
            }
        }
    }

     /**
     * Updates the `joysticksArray` based on which input method is active (gamepad preferred).
     */
    private updateStatus(): void {
        // Prioritize gamepad input if available
        if (this.controllerIndex !== -1) {
            const gamepads = navigator.getGamepads();
            const gamepad = gamepads[this.controllerIndex]; // Can be null

            if (gamepad) {
                // Read axes (ensure enough axes exist)
                this.joysticksArray[this.x1] = gamepad.axes.length > 0 ? gamepad.axes[0] : 0.0;
                this.joysticksArray[this.y1] = gamepad.axes.length > 1 ? gamepad.axes[1] : 0.0;
                this.joysticksArray[this.x2] = gamepad.axes.length > 2 ? gamepad.axes[2] : 0.0;
                this.joysticksArray[this.y2] = gamepad.axes.length > 3 ? gamepad.axes[3] : 0.0;

                //  Read buttons (ensure enough buttons exist)
                this.joysticksArray[this.bA] = gamepad.buttons.length > 0 ? gamepad.buttons[0].value : 0;
                this.joysticksArray[this.bB] = gamepad.buttons.length > 1 ? gamepad.buttons[1].value : 0; 
                this.joysticksArray[this.bX] = gamepad.buttons.length > 2 ? gamepad.buttons[2].value : 0; 
                this.joysticksArray[this.bY] = gamepad.buttons.length > 3 ? gamepad.buttons[3].value : 0; 
                this.joysticksArray[this.bL] = gamepad.buttons.length > 4 ? gamepad.buttons[4].value : 0; 
                this.joysticksArray[this.bR] = gamepad.buttons.length > 5 ? gamepad.buttons[5].value : 0; 
                this.joysticksArray[this.tL] =  gamepad.buttons.length > 6 ?gamepad.buttons[6].value : 0;
                this.joysticksArray[this.tR] =  gamepad.buttons.length > 7 ?gamepad.buttons[7].value : 0;
                this.joysticksArray[this.bK] =  gamepad.buttons.length > 8 ?gamepad.buttons[8].value : 0;
                this.joysticksArray[this.sT] =  gamepad.buttons.length > 9 ?gamepad.buttons[9].value : 0;
                this.joysticksArray[this.dU] =  gamepad.buttons.length > 12 ?gamepad.buttons[12].value : 0;
                this.joysticksArray[this.dD] =  gamepad.buttons.length > 13 ?gamepad.buttons[13].value : 0;
                this.joysticksArray[this.dL] =  gamepad.buttons.length > 14 ?gamepad.buttons[14].value : 0;
                this.joysticksArray[this.dR] =  gamepad.buttons.length > 15 ?gamepad.buttons[15].value : 0;

                // If gamepad is active, we generally ignore keyboard state for this cycle
                // Or, we could potentially merge them if needed (e.g., keyboard buttons + joystick axes)
                return; // Exit early as we got gamepad data
            } else {
                // Gamepad disconnected unexpectedly? Reset index.
                 this.controllerIndex = -1;
            }
        }
        // If no active gamepad, the joysticksArray retains its state from keyboard events
        // (startMovement/stopMovement already updated it).
    }


    /**
     * Sets the state in `joysticksArray` when a key is pressed.
     */
    private startMovement(keyCode: string): void {
        switch (keyCode) {
            case this.left1:  this.joysticksArray[this.x1] = -1.0; break;
            case this.right1: this.joysticksArray[this.x1] = 1.0; break;
            case this.up1:    this.joysticksArray[this.y1] = -1.0; break; // Typically -1 is up for joysticks
            case this.down1:  this.joysticksArray[this.y1] = 1.0; break;  // Typically +1 is down for joysticks
            case this.left2:  this.joysticksArray[this.x2] = -1.0; break;
            case this.right2: this.joysticksArray[this.x2] = 1.0; break;
            case this.up2:    this.joysticksArray[this.y2] = -1.0; break;
            case this.down2:  this.joysticksArray[this.y2] = 1.0; break;
            case this.buttonA: this.joysticksArray[this.bA] = 1; break;
            case this.buttonB: this.joysticksArray[this.bB] = 1; break;
            case this.buttonX: this.joysticksArray[this.bX] = 1; break;
            case this.buttonY: this.joysticksArray[this.bY] = 1; break;
            case this.bumperL: this.joysticksArray[this.bL] = 1; break;
            case this.bumperR: this.joysticksArray[this.bR] = 1; break;
            case this.triggerL: this.joysticksArray[this.tL] = 1; break;
            case this.triggerR: this.joysticksArray[this.tR] = 1; break;
            case this.back: this.joysticksArray[this.bK] = 1; break;
            case this.start: this.joysticksArray[this.sT] = 1; break;
        }
    }

    /**
     * Resets the state in `joysticksArray` when a key is released.
     */
    private stopMovement(keyCode: string): void {
        switch (keyCode) {
            // Reset axis only if the *released* key corresponds to its current direction
            // This prevents releasing 'A' from stopping movement if 'D' is still held.
            case this.left1:  if (this.joysticksArray[this.x1] < 0) this.joysticksArray[this.x1] = 0; break;
            case this.right1: if (this.joysticksArray[this.x1] > 0) this.joysticksArray[this.x1] = 0; break;
            case this.up1:    if (this.joysticksArray[this.y1] < 0) this.joysticksArray[this.y1] = 0; break;
            case this.down1:  if (this.joysticksArray[this.y1] > 0) this.joysticksArray[this.y1] = 0; break;
            case this.left2:  if (this.joysticksArray[this.x2] < 0) this.joysticksArray[this.x2] = 0; break;
            case this.right2: if (this.joysticksArray[this.x2] > 0) this.joysticksArray[this.x2] = 0; break;
            case this.up2:    if (this.joysticksArray[this.y2] < 0) this.joysticksArray[this.y2] = 0; break;
            case this.down2:  if (this.joysticksArray[this.y2] > 0) this.joysticksArray[this.y2] = 0; break;
            // Buttons always reset to 0 on release
            case this.buttonA: this.joysticksArray[this.bA] = 0; break;
            case this.buttonB: this.joysticksArray[this.bB] = 0; break;
            case this.buttonX: this.joysticksArray[this.bX] = 0; break;
            case this.buttonY: this.joysticksArray[this.bY] = 0; break;
            case this.bumperL: this.joysticksArray[this.bL] = 0; break;
            case this.bumperR: this.joysticksArray[this.bR] = 0; break;
            case this.triggerL: this.joysticksArray[this.tL] = 0; break;
            case this.triggerR: this.joysticksArray[this.tR] = 0; break;
            case this.back: this.joysticksArray[this.bK] = 0; break;
            case this.start: this.joysticksArray[this.sT] = 0; break;
        }
    }

    // --- Event Handlers ---

    private handleKeyDown(event: KeyboardEvent): void {
        // Only process if listening and if no gamepad is active (or if mixing is desired)
        if (this.listening && this.controllerIndex === -1) {
            // event.preventDefault(); // Prevent default actions like scrolling if needed
            this.startMovement(event.code);
        }
         // Allow keydown events if listening is false? Or always prevent default? Depends.
    }

    private handleKeyUp(event: KeyboardEvent): void {
        // Only process if listening and if no gamepad is active (or if mixing is desired)
        if (this.listening && this.controllerIndex === -1) {
            // event.preventDefault(); // Prevent default actions if needed
            this.stopMovement(event.code);
        }
    }

     private handleGamepadConnected(event: GamepadEvent): void {
        console.log(
            "Gamepad connected at index %d: %s. %d buttons, %d axes.",
            event.gamepad.index,
            event.gamepad.id,
            event.gamepad.buttons.length,
            event.gamepad.axes.length
          );
        // If we don't have a controller yet, use this one
        if (this.controllerIndex === -1) {
            this.controllerIndex = event.gamepad.index;
            console.log("Using gamepad:", this.controllerIndex);
             // Optionally reset keyboard state when gamepad connects?
             // this.joysticksArray.fill(0);
        }
     }

     private handleGamepadDisconnected(event: GamepadEvent): void {
        console.log(
            "Gamepad disconnected from index %d: %s",
            event.gamepad.index,
            event.gamepad.id
          );
        // If the disconnected gamepad is the one we were using, reset the index
        if (this.controllerIndex === event.gamepad.index) {
            this.controllerIndex = -1;
            console.log("Stopped using gamepad.");
            // Optionally reset joystick state to 0
            this.joysticksArray.fill(0);
            // Ensure the next packet reflects this zero state if needed immediately
             // this.lastsentArray = this.joysticksArray.slice(); // Or let sendAPacket handle it
        }
    }


    /**
     * Sets up global event listeners for keyboard and gamepad input.
     */
    private startListening(): void {
        // Add listeners only once
        document.removeEventListener('keydown', this.handleKeyDown); // Prevent duplicates
        document.addEventListener('keydown', this.handleKeyDown);

        document.removeEventListener('keyup', this.handleKeyUp); // Prevent duplicates
        document.addEventListener('keyup', this.handleKeyUp);

        window.removeEventListener("gamepadconnected", this.handleGamepadConnected); // Prevent duplicates
        window.addEventListener("gamepadconnected", this.handleGamepadConnected);

        window.removeEventListener("gamepaddisconnected", this.handleGamepadDisconnected); // Prevent duplicates
        window.addEventListener("gamepaddisconnected", this.handleGamepadDisconnected);

        console.log("Joystick input listeners attached.");
    }

    /**
     * Removes global event listeners. Call when the instance is no longer needed.
     */
    public dispose(): void {
        this.stopJoyPackets(); // Stop sending packets and clear interval
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener("gamepadconnected", this.handleGamepadConnected);
        window.removeEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
        this.writeToDevice = undefined; // Clear callback reference
        console.log("Joystick input listeners removed.");
    }
}

export default Joystick;

    /*
    javascript
    // Example usage (in another JS/TS file)
    import Joystick from './joystick_wrapper'; // Adjust path if needed

    const myJoystick = new Joystick();

    // Define your function that sends data (must return a Promise)
    async function sendDataToHardware(data) {
        // Replace with your actual implementation (e.g., using Web Serial)
        console.log("Sending:", data);
        // await myDeviceWriter.write(data);
        return Promise.resolve(); // Indicate success
    }

    // Assign the callback
    myJoystick.writeToDevice = sendDataToHardware;

    // Start sending packets
    myJoystick.startJoyPackets();

    // To stop later
    // myJoystick.stopJoyPackets();

    // To clean up listeners when done
    // myJoystick.dispose();
    */
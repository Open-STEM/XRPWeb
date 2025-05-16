// ##### tablemgr.ts #####
// Wraps the table procedures into a class
import logger from "@/utils/logger";
import AppMgr, { EventType } from "./appmgr";

export interface NetworkTable {
    gyro: {
        yaw: number;
        roll: number;
        pitch: number;
    },
    accelerometer: {
        accX: number;
        accY: number;
        accZ: number;
    },
    encoders: {
        encL: number;
        encR: number;
        enc3: number;
        enc4: number;
    },
    current: {
        currL: number;
        currR: number;
        curr3: number;
        curr4: number;
    },
    distance: number;
    reflectance: {
        reflectanceL: number;
        reflectanceR: number;
    },
    voltage: number;
}

class TableMgr {
    protected tableLogger = logger.child({module: 'table'});
    
    // State Arrays
    private tableArray: number[] = [
        0.0, // yaw
        0.0, // roll
        0.0, // pitch
        0.0, // accX
        0.0,   // accY
        0.0,   // accZ
        0.0,   // encL
        0.0,   // encR
        0.0,   // enc3
        0.0,   // enc4
        0.0,   // currentL
        0.0,   // currentR
        0.0,   // current3
        0.0,   // current4
        0.0,   // distance
        0.0,   // reflectanceL
        0.0,   // reflectanceR
        0.0,   // voltage
    ];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
private tableNames: any = {
    "yaw": 0,
    "roll": 1,
    "pitch": 2,
    "accX": 3,
    "accY": 4,
    "accZ": 5,
    "encL": 6,
    "encR": 7,
    "enc3": 8,
    "enc4": 9,
    "currR": 10,
    "currL": 11,
    "curr3": 12,
    "curr4": 13,
    "dist": 14,
    "reflectanceL": 15,
    "reflectanceR": 16,
    "voltage": 17
};

private readonly TypeInt: number = 0;
private readonly TypeFloat: number = 1;

private buffer: Uint8Array = new Uint8Array();

    constructor() {
        // Bind the context of 'this' for the interval callback
        
    }

    // --- Public Methods ---

    /**
     * getValue - get the value of a table entry
     * @returns the network table
     */
    private getTable(): NetworkTable {
        return {
            gyro: {
                yaw: this.tableArray[this.tableNames["yaw"]],
                roll: this.tableArray[this.tableNames["roll"]],
                pitch: this.tableArray[this.tableNames["pitch"]],
            },
            accelerometer: {
                accX: this.tableArray[this.tableNames["accX"]],
                accY: this.tableArray[this.tableNames["accY"]],
                accZ: this.tableArray[this.tableNames["accZ"]],
            },
            encoders: {
                encL: this.tableArray[this.tableNames["encL"]],
                encR: this.tableArray[this.tableNames["encR"]],
                enc3: this.tableArray[this.tableNames["enc3"]],
                enc4: this.tableArray[this.tableNames["enc4"]],
            },
            current: {
                currL: this.tableArray[this.tableNames["currL"]],
                currR: this.tableArray[this.tableNames["currR"]],
                curr3: this.tableArray[this.tableNames["curr3"]],
                curr4: this.tableArray[this.tableNames["curr4"]],
            },
            distance: this.tableArray[this.tableNames["dist"]],
            reflectance: {
                reflectanceL: this.tableArray[this.tableNames["reflectanceL"]],
                reflectanceR: this.tableArray[this.tableNames["reflectanceR"]],
            },
            voltage: this.tableArray[this.tableNames["voltage"]],
        };
    }

    public getValue(name: string): number | null{
        const index = this.tableNames[name];
        if(index)
            return this.tableArray[index];
        else
            return null;
    }

    public readFromDevice(data: Uint8Array){
        // need to handle if this is multiple commands in one array.
        this.buffer = this.concatUint8(this.buffer, data);

        let offset = 0;

        while(offset + 2 <= this.buffer.length){
            if(this.buffer[0] >= 0x45 && this.buffer[0] <= 0x47){
                const lengthField = this.buffer[offset + 1];
                const packetLen = lengthField + 2;
                if(offset + packetLen > this.buffer.length){
                    break; //not enough left must be coming in the next packet
                }
                const chunk = this.buffer.subarray(offset, offset + packetLen);
                if(offset + packetLen == this.buffer.length){
                    this.buffer = new Uint8Array()
                }
                else{
                    this.buffer = this.buffer.subarray(offset + packetLen);
                }
                offset = 0;
                this.processBuffer(chunk);
            }
            
        }

        // this.tableLogger.debug("table data: " + JSON.stringify(this.getTable()));
        AppMgr.getInstance().emit(EventType.EVENT_DASHBOARD_DATA, JSON.stringify(this.getTable()));
    }

     private processBuffer(data: Uint8Array){
        switch(data[0]){
            case 0x45: //new values. assume one value at a time for now
                if(data.length == data[1] + 2){
                    let i = 2;
                    while(i < data.length){
                        if(data[i] == this.TypeInt){
                            this.tableArray[data[i + 1]] = data[i+2];
                            i += 3;
                        }
                        else if (data[i] == this.TypeFloat) {
                            const view =  new DataView(data.buffer, i+2, 4);
                            const val = Math.round(view.getFloat32(0, true) * 1e4) / 1e4;
                            this.tableArray[data[i+1]] = val;
                            i += 6
                        } 
                    }
                }
                break;
            case 0x46: //start dashboard session
                this.tableLogger.info("starting dashboard");
                break;
            case 0x47: { //declare new table entry
                    this.tableLogger.info("new table entry");
                    const newIndex = this.tableArray.push(0.0);
                    //convert the string to the name
                    const newName = "error";
                    this.tableNames[newName] = newIndex + 1;
                    break; 
                }
        }
    }

        /** Helper to concat two Uint8Arrays into a new one */
    private concatUint8(a: Uint8Array, b: Uint8Array): Uint8Array {
        const c = new Uint8Array(a.length + b.length);
        c.set(a, 0);
        c.set(b, a.length);
        return c;
    }
    
}

export default TableMgr;

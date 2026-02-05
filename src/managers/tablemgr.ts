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

// XPP Protocol Constants
private readonly XPP_MSG_TYPE_VAR_DEF: number = 1;
private readonly XPP_MSG_TYPE_VAR_UPDATE: number = 2;
private readonly VAR_TYPE_INT: number = 1;
private readonly VAR_TYPE_FLOAT: number = 2;
private readonly VAR_TYPE_BOOL: number = 3;

// Mapping from XPP variable IDs (20-37) to table array indices
// Standard variables: IMU (20-25), Encoders (26-29), Current (30-33), Other (34-37)
private readonly xppVarIdToTableIndex: Map<number, number> = new Map([
    [20, 0],  // $imu.yaw -> yaw
    [21, 1],  // $imu.roll -> roll
    [22, 2],  // $imu.pitch -> pitch
    [23, 3],  // $imu.acc_x -> accX
    [24, 4],  // $imu.acc_y -> accY
    [25, 5],  // $imu.acc_z -> accZ
    [26, 6],  // $encoder.left -> encL
    [27, 7],  // $encoder.right -> encR
    [28, 8],  // $encoder.3 -> enc3
    [29, 9],  // $encoder.4 -> enc4
    [30, 11], // $current.left -> currL
    [31, 10], // $current.right -> currR
    [32, 12], // $current.3 -> curr3
    [33, 13], // $current.4 -> curr4
    [34, 14], // $rangefinder.distance -> dist
    [35, 15], // $reflectance.left -> reflectanceL
    [36, 16], // $reflectance.right -> reflectanceR
    [37, 17], // $voltage -> voltage
]);

// Map for custom variables (ID >= 38) defined via Variable Definition messages
private customVarIdToTableIndex: Map<number, number> = new Map();

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

    /**
     * Reads XPP packet from device and processes it.
     * Assumes packet is a valid complete XPP packet: [0xAA 0x55] [Type] [Length] [Payload] [0x55 0xAA]
     * @param packet - Complete XPP packet
     */
    public readFromDevice(packet: Uint8Array){
        // Assume valid XPP packet format: [0xAA 0x55] [Type] [Length] [Payload] [0x55 0xAA]
        // Extract type and length (bytes 2 and 3 after start sequence)
        const messageType = packet[2];
        const payloadLength = packet[3];
        
        // Extract payload (between length and end sequence)
        const payload = packet.subarray(4, 4 + payloadLength);

        switch(messageType){
            case this.XPP_MSG_TYPE_VAR_DEF:
                this.processVariableDefinition(payload);
                break;
            case this.XPP_MSG_TYPE_VAR_UPDATE:
                this.processVariableUpdate(payload);
                // Emit dashboard data after processing updates
                AppMgr.getInstance().emit(EventType.EVENT_DASHBOARD_DATA, JSON.stringify(this.getTable()));
                break;
            default:
                // Ignore other message types
                break;
        }
    }

    /**
     * Processes XPP Variable Definition message (Type 1).
     * Payload: name_len(1) name(name_len) type(1) permissions(1) var_id(1)
     */
    private processVariableDefinition(payload: Uint8Array): void {
        if (payload.length < 1) {
            return; // Need at least name_len
        }

        const nameLen = payload[0];
        if (payload.length < 4 + nameLen) {
            return; // Need name_len + name + type + permissions + var_id
        }

        // Extract variable name
        const nameBytes = payload.subarray(1, 1 + nameLen);
        const name = new TextDecoder().decode(nameBytes);
        
        const type = payload[1 + nameLen];
        // const permissions = payload[2 + nameLen]; // Not used currently
        const varId = payload[3 + nameLen];

        // Add to table array
        const newIndex = this.tableArray.length;
        this.tableArray.push(0.0);
        
        // Store mapping
        this.tableNames[name] = newIndex;
        this.customVarIdToTableIndex.set(varId, newIndex);

        this.tableLogger.info(`New variable defined: ${name} (ID: ${varId}, Type: ${type}, Index: ${newIndex})`);
    }

    /**
     * Processes XPP Variable Update message (Type 2).
     * Payload: count(1) [var_id(1) type(1) value(type-dependent)] * count
     */
    private processVariableUpdate(payload: Uint8Array): void {
        if (payload.length < 1) {
            return; // Need at least count
        }

        const count = payload[0];
        let offset = 1;

        for (let i = 0; i < count && offset < payload.length; i++) {
            if (offset + 2 > payload.length) {
                break; // Not enough data for var_id and type
            }

            const varId = payload[offset++];
            const varType = payload[offset++];

            // Find table index for this variable ID
            let tableIndex: number | undefined = this.xppVarIdToTableIndex.get(varId);
            if (tableIndex === undefined) {
                // Check custom variables
                tableIndex = this.customVarIdToTableIndex.get(varId);
            }

            if (tableIndex === undefined) {
                // Unknown variable ID, skip it
                // Skip the value bytes
                if (varType === this.VAR_TYPE_BOOL) {
                    offset += 1; // Bool is 1 byte
                } else {
                    offset += 4; // Float and int are 4 bytes
                }
                continue;
            }

            // Extract value based on type
            if (varType === this.VAR_TYPE_INT) {
                if (offset + 4 > payload.length) {
                    break; // Not enough data
                }
                const view = new DataView(payload.buffer, payload.byteOffset + offset, 4);
                const value = view.getInt32(0, true); // little-endian
                this.tableArray[tableIndex] = value;
                offset += 4;
            } else if (varType === this.VAR_TYPE_FLOAT) {
                if (offset + 4 > payload.length) {
                    break; // Not enough data
                }
                const view = new DataView(payload.buffer, payload.byteOffset + offset, 4);
                const value = view.getFloat32(0, true); // little-endian
                this.tableArray[tableIndex] = value;
                offset += 4;
            } else if (varType === this.VAR_TYPE_BOOL) {
                if (offset >= payload.length) {
                    break; // Not enough data
                }
                const value = payload[offset] !== 0 ? 1 : 0;
                this.tableArray[tableIndex] = value;
                offset += 1;
            } else {
                // Unknown type, assume 4 bytes (int/float size) and skip
                offset += 4;
            }
        }
    }
}

export default TableMgr;

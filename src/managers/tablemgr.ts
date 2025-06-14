// ##### tablemgr.ts #####
// Wraps the table procedures into a class
import logger from "@/utils/logger";

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
    "enc4": 9
};

private readonly TypeInt: number = 0;
private readonly TypeFloat: number = 1;

private buffer: Uint8Array = new Uint8Array();

    constructor() {
        // Bind the context of 'this' for the interval callback
        
    }

    // --- Public Methods ---

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

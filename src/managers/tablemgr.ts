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

    constructor() {
        // Bind the context of 'this' for the interval callback
        
    }

    // --- Public Methods ---

    public getValue(name: string): number | null{
        let index = this.tableNames[name];
        if(index)
            return this.tableArray[index];
        else
            return null;
    }

    public readFromDevice(data: Uint8Array){
        switch(data[0]){
            case 0x45: //new values. assume one value at a time for now
                if(data.length == data[1] + 2){
                    let i = 2;
                    while(i < data.length){
                        if(data[i] == this.TypeInt){
                            this.tableArray[data[i + 1]] = data[i+2];
                            i += 3;
                        }
                        else if (data[i] == this.TypeFloat){
                          const view =  new DataView(data.buffer, i+2, 4);
                          this.tableArray[data[i+1]] = view.getFloat32(0, true)
                          i += 6
                        } 
                    }
                }
                break;
            case 0x46: //start dashboard session
                this.tableLogger.info("starting dashboard");
                break;
            case 0x47: //declare new table entry
                this.tableLogger.info("new table entry");
                let newIndex = this.tableArray.push(0.0);
                //convert the string to the name
                let newName = "error";
                this.tableNames[newName] = newIndex + 1;
                break;
        }

    }
    
    // --- Private Methods ---

    /**
     * Quantizes a float in the range [-1, 1] into an integer from 0 to 255.
     */
    private unQuantizeFloat(value: number): number {
        // Scale value from [-1,1] to [0,255]
        return Math.round((value) / 127.5);
    }
}

export default TableMgr;

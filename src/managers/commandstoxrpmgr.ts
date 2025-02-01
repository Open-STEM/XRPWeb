import { XRPDataMgr } from './xrpdatamgr';

/**
 * CommandsToXRPMgr - manages routines that send commands to the XRP REPL
 **/ 
export class CommandToXRPMgr {

    private static instance: CommandToXRPMgr;

    private xrpDataMgr: XRPDataMgr = XRPDataMgr.getInstance();

    //private DIR_DATA: string[] | undefined;
    //private DIR_STRUCT: any; // TODO: unsure of type
    //private DIR_INDEX: number = 0;
    //private LAST_RUN: string | undefined;

    private PROCESSOR: number | undefined = undefined;

    public BUSY:boolean = false;

    // Set true so most terminal output gets passed to javascript terminal
    private DEBUG_CONSOLE_ON: boolean = true;

    public CommandsToXRPMgr() {
        //constructor
        
        //resetTerminal
        //clearIsRunning
        //batteryVoltage
        //getVersionInfo

        //getOnBoardFSTree
        //deleteFileOrDir
        //renameFile
        //downloadFile
        //buildPath
        //uploadFile
             //uploadFiles
        //getFileContents
        //checkFileExists (do we need this?)

        //updateMainFile
        //executeLines
        //resetBot

    }

    public static getInstance(): CommandToXRPMgr {
        if (!CommandToXRPMgr.instance) {
            CommandToXRPMgr.instance = new CommandToXRPMgr();
        }
        return this.instance;
    }



    /*** Initial utilities  ***/

    async batteryVoltage(): Promise<number> {
        if (this.BUSY == true) {
            return 0;
        }
        this.BUSY = true;

        var vpin = "28";
        if(this.PROCESSOR == 2350){
            vpin = "46";
        }

        var cmd =   "from machine import ADC, Pin\n" +
                    "print(ADC(Pin(" + vpin + ")).read_u16())\n";


        var hiddenLines = await this.xrpDataMgr.writeUtilityCmdRaw(cmd, true, 1);

        await this.xrpDataMgr.getToNormal(3);
        this.BUSY = false;
        const value = parseInt(hiddenLines![0].substring(2)); //get the string after the OK
        return value / (1024 * 64 / 14) //the voltage ADC is 64k (RP2040 ADC is 0-4095 but micropython adjusts it to 0 - 64K) And while the voltage is a max of 11V, the divider comes out close to 14V
    }

    async getVersionInfo(): Promise<(string | undefined)[]> {
        if (this.BUSY == true) {
            return [];
        }
        this.BUSY = true;
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: in getVersionInfo");


        var cmd = "import os\n" +
            "import sys\n" +
            "import machine\n" +

            "print(sys.implementation[1])\n" +
            "print(sys.implementation[2])\n" +
            "try:\n" +
            "    f = open(\"/lib/XRPLib/version.py\", \"r\")\n" +
            "    while True:\n" +
            "        line = f.readline()\n" +
            "        if len(line) == 0:\n" +
            "            print(\"ERROR EOF\")\n" +
            "            break\n" +
            "        if \"__version__ = \" in line:\n" +
            "            print(line.split('\\\'')[1])\n" +
            "            break\n" +
            "except:\n" +
            "    print(\"ERROR EX\")\n" +
            "print(''.join(['{:02x}'.format(b) for b in machine.unique_id()]));";


        var hiddenLines = await this.xrpDataMgr.writeUtilityCmdRaw(cmd, true, 1);

        await this.xrpDataMgr.getToNormal(3);
        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of getVerionINfo");

        if (hiddenLines != undefined) {
            if (hiddenLines[0].substring(2) != "ERROR") {
                if(this.PROCESSOR == undefined){
                    if(hiddenLines[1].includes("RP2350")){
                        this.PROCESSOR = 2350; 
                    }
                    else if(hiddenLines[1].includes("RP2040")){
                        this.PROCESSOR = 2040;
                    }
                }
                return [hiddenLines[0].substring(2), hiddenLines[2], hiddenLines[3], hiddenLines[1]];
            } else {
                console.error("Error getting version information");
                return [];
            }
        }
         return [];
    }


        /*** File Routines  ***/



        /*** Run Program routines  ***/



}
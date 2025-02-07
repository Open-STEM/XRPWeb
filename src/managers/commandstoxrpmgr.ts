/* eslint-disable prefer-const */
import Connection from '@/connections/connection';

/**
 * CommandsToXRPMgr - manages routines that send commands to the XRP REPL
 **/
export class CommandToXRPMgr {
    private static instance: CommandToXRPMgr;
    // private xrpDataMgr: XRPDataMgr = XRPDataMgr.getInstance();
    private connection: Connection | null = null;

    //private DIR_DATA: string[] | undefined;
    //private DIR_STRUCT: any; // TODO: unsure of type
    //private DIR_INDEX: number = 0;
    //private LAST_RUN: string | undefined;

    private PROCESSOR: number | undefined = undefined;

    public BUSY: boolean = false;

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

    public setConnection(connection: Connection) {
        this.connection = connection;
    }

    /*** Initial utilities  ***/

    // if we attached via the cable then make sure we are not trying to output to via the BLE
    async resetTerminal() {
        if (this.BUSY == true) {
            return;
        }
        this.BUSY = true;

        const cmd = "import os\n" +
            "os.dupterm(None)\n";

        await this.connection?.writeUtilityCmdRaw(cmd, true, 1);

        await this.connection?.getToNormal(3);
        this.BUSY = false;
    }

    async clearIsRunning() {
        if (this.BUSY == true) {
            return;
        }
        this.BUSY = true;
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: in clearIsRunning");;


        // Got through and make sure entire path already exists
        const cmd = "import sys\n" +
            "FILE_PATH = '/lib/ble/isrunning'\n" +
            "try:\n" +
            "   with open(FILE_PATH, 'r+b') as file:\n" +
            "      file.write(b'\\x00')\n" +
            "except Exception as err:\n" +
            "    print('Some kind of error clearing is running..' + err)\n";

        await this.connection?.writeUtilityCmdRaw(cmd, true, 1);

        // Get back into normal mode and omit the 3 lines from the normal message,
        // don't want to repeat (assumes already on a normal prompt)
        await this.connection?.getToNormal(3);

        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of clearIsRunning");
    }

    public async batteryVoltage(): Promise<number> {
        if (this.BUSY == true) {
            return 0;
        }
        this.BUSY = true;

        let vpin = '28';
        if (this.PROCESSOR == 2350) {
            vpin = '46';
        }

        const cmd = 'from machine import ADC, Pin\n' + 'print(ADC(Pin(' + vpin + ')).read_u16())\n';

        const hiddenLines = await this.connection?.writeUtilityCmdRaw(cmd, true, 1);

        await this.connection?.getToNormal(3);
        this.BUSY = false;
        const value = parseInt(hiddenLines![0].substring(2)); //get the string after the OK
        return value / ((1024 * 64) / 14); //the voltage ADC is 64k (RP2040 ADC is 0-4095 but micropython adjusts it to 0 - 64K) And while the voltage is a max of 11V, the divider comes out close to 14V
    }

    public async getVersionInfo(): Promise<(string | undefined)[]> {
        if (this.BUSY == true) {
            return [];
        }
        this.BUSY = true;
        if (this.DEBUG_CONSOLE_ON) console.log('fcg: in getVersionInfo');

        const cmd =
            'import os\n' +
            'import sys\n' +
            'import machine\n' +
            'print(sys.implementation[1])\n' +
            'print(sys.implementation[2])\n' +
            'try:\n' +
            '    f = open("/lib/XRPLib/version.py", "r")\n' +
            '    while True:\n' +
            '        line = f.readline()\n' +
            '        if len(line) == 0:\n' +
            '            print("ERROR EOF")\n' +
            '            break\n' +
            '        if "__version__ = " in line:\n' +
            // eslint-disable-next-line no-useless-escape
            "            print(line.split('\\\'')[1])\n" +
            '            break\n' +
            'except:\n' +
            '    print("ERROR EX")\n' +
            "print(''.join(['{:02x}'.format(b) for b in machine.unique_id()]));";

        const hiddenLines = await this.connection?.writeUtilityCmdRaw(cmd, true, 1);

        await this.connection?.getToNormal(3);
        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) console.log('fcg: out of getVerionINfo');

        if (hiddenLines != undefined) {
            if (hiddenLines[0].substring(2) != 'ERROR') {
                if (this.PROCESSOR == undefined) {
                    if (hiddenLines[1].includes('RP2350')) {
                        this.PROCESSOR = 2350;
                    } else if (hiddenLines[1].includes('RP2040')) {
                        this.PROCESSOR = 2040;
                    }
                }
                return [
                    hiddenLines[0].substring(2),
                    hiddenLines[2],
                    hiddenLines[3],
                    hiddenLines[1],
                ];
            } else {
                console.error('Error getting version information');
                return [];
            }
        }
        return [];
    }

    /*** File Routines  ***/

    async getOnBoardFSTree() {
        if (this.BUSY == true) {
            return;
        }
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: in getOnBoardFSTree");

        this.BUSY = true;

        //window.setPercent(1, "Fetching filesystem...");

        const getFilesystemCmd =
            "import os\n" +
            //"import ujson\n" +
            "import gc\n" +
            "outstr = ''\n" +
            "gc.collect()\n" +  //this is needed for the ble it seems like we run out of memory otherwise
            "def walk(top, structure, dir):\n" +
            "    global outstr\n" +
            "    extend = \"\";\n" +
            "    if top != \"\":\n" +
            "        extend = extend + \"/\"\n" +

            "    item_index = 0\n" +
            "    structure[dir] = {}\n" +

            "    for dirent in os.listdir(top):\n" +                        // Loop through and create structure of on-board FS
            "        if(os.stat(top + extend + dirent)[0] == 32768):\n" +   // File
            //"            print(str(count) + ',' + dir + ',' + str(item_index) + ',F,' + dirent)\n" +
            "            outstr = outstr + dir + ',' + str(item_index) + ',F,' + dirent + ';'\n" +
            //"            structure[dir][item_index] = {\"F\": dirent}\n" +
            "            item_index = item_index + 1\n" +
            "        elif(os.stat(top + extend + dirent)[0] == 16384):\n" + // Dir
            //"            print(str(count) + ',' + dir + ',' + str(item_index) + ',D,' + dirent)\n" +
            "            outstr = outstr + dir + ',' + str(item_index) + ',D,' + dirent + ';'\n" +
            //"            structure[dir][item_index] = {\"D\": dirent}\n" +
            "            item_index = item_index + 1\n" +
            "            walk(top + extend + dirent, structure[dir], dirent)\n" +
            "    return structure\n" +
            "struct = {}\n" +
            "walk(\"\", struct, \"\")\n" +
            "print(outstr)\n";
        //"print(walk(\"\", struct, \"\"))\n";
        //"print(ujson.dumps(walk(\"\", struct, \"\")))\n";

        const sizeCmd =
            "a = os.statvfs('/')\n" +
            "print(a[0], a[2], a[3])\n";


        //window.setPercent(25, "Fetching filesystem...");
        const hiddenLines: string[] | undefined = await this.connection?.writeUtilityCmdRaw(getFilesystemCmd + sizeCmd, true, 1);

        if (hiddenLines != undefined) {
            this.changeToJSON(hiddenLines);
            const fsData = JSON.stringify(this.DIR_STRUCT);
            const szData = hiddenLines[1].split(' ');
            console.log("File Data: " +fsData);
            console.log("storage data: ", szData);

            //this.onFSData?.(JSON.stringify(this.DIR_STRUCT), hiddenLines[1].split(' '));
        }

        //window.setPercent(65, "Fetching filesystem...");

        // Get back into normal mode and omit the 3 lines from the normal message,
        // don't want to repeat (assumes already on a normal prompt)
        await this.connection?.getToNormal(3);
        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) console.log("fcg: out of getOnBoardFSTree");
        //window.setPercent(100);
        //window.resetPercentDelay();
    }
    
    private DIR_DATA: string[] = [];
    private DIR_STRUCT = {};
    private DIR_INDEX:number = 0;

    changeToJSON(data: string[]) {
        data[0] = data[0].slice(2);
        this.DIR_DATA = data[0].split(';');
        this.DIR_STRUCT = {};
        this.DIR_INDEX = 0;
        this.DIR_STRUCT = this.dirRoutine("");

    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dirRoutine(dir: string): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dir_struct: any = {};
        dir_struct[dir] = {};
        while (this.DIR_INDEX < (this.DIR_DATA!.length - 1)) {

            const [path, index, type, name] = this.DIR_DATA![this.DIR_INDEX].split(',');
            if (dir === path) {
                this.DIR_INDEX++;
                dir_struct[dir][index] = {}

                if (type == 'F') {
                    dir_struct[dir][index]["F"] = name;
                }
                else {
                    dir_struct[dir][index]["D"] = name;
                    dir_struct[dir] = { ...dir_struct[dir], ...this.dirRoutine(name) };
                }

            }
            else {
                break;
            }
        }
        return dir_struct;
    }

    /*** Run Program routines  ***/
}

import Connection from '@/connections/connection';
import { FolderItem } from '@/utils/types';
import AppMgr, { EventType } from '@/managers/appmgr';
import logger from '@/utils/logger';

declare global {
    interface Window {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<any>;
    }
  }

/**
 * CommandsToXRPMgr - manages routines that send commands to the XRP REPL
 **/
export class CommandToXRPMgr {
    private static instance: CommandToXRPMgr;
    private cmdLogger = logger.child({module: 'command'})
    // private xrpDataMgr: XRPDataMgr = XRPDataMgr.getInstance();
    private connection: Connection | null = null;

    //private DIR_DATA: string[] | undefined;
    //private DIR_STRUCT: any; // TODO: unsure of type
    //private DIR_INDEX: number = 0;
    //private LAST_RUN: string | undefined;

    private PROCESSOR: number | undefined = undefined;
    private lastRun: string | undefined = undefined;

    public BUSY: boolean = false;

    // Set true so most terminal output gets passed to javascript terminal
    private DEBUG_CONSOLE_ON: boolean = true;
    private HAS_MICROPYTHON: boolean = true;

    private latestLibraryVersion: string = "";

    private readonly MP_VERSION = [1, 24, 1]; //TODO: Where do we want to get this from?
    phewList = ["__init__.py","dns.py","logging.py","server.py","template.py"];
    bleList = ["__init__.py","blerepl.py", "ble_uart_peripheral.py", "isrunning"]  //bugbug: ble_uart_peripheral looks for ##XRPSTOP## so we can't update via bluetooth. Could be fixed with a hash operation

    XRPId:string | undefined = undefined;

    constructor(){
        this.getLibVersion();
    }

    /**
     * getLibVersion - get the XRP library version
     */
    async getLibVersion(){
        const response = await fetch("lib/package.json"); // do we need to cache bust? + "?version=" + showChangelogVersion //need an await?
        const responseTxt = await response.text();
        const jresp = JSON.parse(responseTxt);
        const v = jresp.version
        // This should match what is in /lib/XRPLib/version.py as '__version__'
        this.latestLibraryVersion = v.split(".");
    }

    public CommandsToXRPMgr() {
        //constructor
        //resetTerminal
        //clearIsRunning
        //batteryVoltage
        //checkIfNeedUpdate
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

    /**
     * setConnection - set the proper connection for the command to work with
     * @param connection 
     */
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
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: in clearIsRunning");;


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
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: out of clearIsRunning");
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
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug('fcg: in getVersionInfo');

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
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug('fcg: out of getVerionINfo');

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

    async checkIfNeedUpdate():Promise<string | undefined> {
        //This is only called when a new XRP is attached. Reset a few variables.
        this.XRPId = undefined;
        this.lastRun = undefined;

        //if no micropython on the XRP
        if (!this.HAS_MICROPYTHON) {
            this.cmdLogger.debug("no MicroPython");
            //await this.showMicropythonUpdate?.();
            //TODO: Need to ask users if they want to update
            return this.XRPId;
        }

        
        //get version information from the XRP
        const info = await this.getVersionInfo();

        if (info == undefined) {
            return this.XRPId; //this happens if the XRP is rebooting we are under BLE and no other way to stop it.
        }

        this.XRPId = info[2]; //store off the unique ID for this XRP

        info[0] = info[0]!.replace(/[()]/g, "").replace(/,\s/g, "."); //convert to a semantic version
        //if the microPython is out of date
        if (this.isVersionNewer(this.MP_VERSION, info[0]!)) {
            // Need to update MicroPython
            //alert("Need to update Micropython")
            
            //TODO: need to ask user 
            //TODO: only do this if we are on USB
            await this.updateMicroPython();
        }

        //if no library or the library is out of date
        if (Number.isNaN(parseFloat(info[1] as string)) || this.isVersionNewer(this.latestLibraryVersion, info[1] as string)) {
            await this.updateLibrary(info[1] as string);
        }
        return this.XRPId;
    }

    isVersionNewer(v1: string | number[], v2: string) {
          if(typeof v1 == "string"){
              return false;
          }
        const v1parts = v1;
        const v2parts = v2.split('.').map(Number);

        while (v1parts.length < v2parts.length) v1parts.push(0);
        while (v2parts.length < v1parts.length) v2parts.push(0);

        for (let i = 0; i < v1parts.length; ++i) {
            if (v1parts[i] > v2parts[i]) {
                return true;
            } else if (v1parts[i] < v2parts[i]) {
                return false;
            }
        }
        return false;
    }

    async updateLibrary(curVer: string) {
        if (curVer == "ERROR EX") {
            curVer = "None";
        }

        //TODO: ask user
        /*
        var message = "The library files on the XRP are out of date.<br>" +
            "The current version is " + curVer +
            " and the new version is version " + window.latestLibraryVersion[0] + "." + window.latestLibraryVersion[1] + "." + window.latestLibraryVersion[2] + "<br>";

        if (REPL.BLE_DEVICE != undefined) {

            message += "<br>You will need to connect your XRP with a USB cable in order to update XRPLib";
            await alertMessage(message);
            return;
        }
        message += "Click OK to update the XRP to the latest version.";
        let answer = await window.confirmMessage(message);
        if (!answer) {
            return; //they pressed CANCEL
        }

        UIkit.modal(document.getElementById("IDProgressBarParent")).show();
        document.getElementById("IdProgress_TitleText")!.innerText = 'Update in Progress...';
        */

        const response = await fetch("lib/package.json");
        const responseTxt = await response.text();
        const jresp = JSON.parse(responseTxt);
        const urls = jresp.urls;

        //TODO: show percent updated
        //window.setPercent?.(1, "Updating XRPLib...");
        const percent_per = Math.round(99 / (urls.length + this.phewList.length + this.bleList.length + 1));
        let cur_percent = 1 + percent_per;

        await this.deleteFileOrDir("/lib/XRPLib");  //delete all the files first to avoid any confusion.
        //BUGBUG: should we delete the /XRPExamples?
        for (let i = 0; i < urls.length; i++) {
            //window.setPercent?.(cur_percent, "Updating XRPLib..."); TODO: percentage
            //added a version number to ensure that the browser does not cache it.
            const next = urls[i];
            let parts = next[0];
            parts = parts.replace("XRPLib", "lib/XRPLib");
            await this.uploadFile(parts, await this.downloadFile(parts.replace("XRPExamples", "lib/Examples") + "?version=" + this.latestLibraryVersion[2]));
            cur_percent += percent_per;
        }

        //create a version.py file that has the version in it for future checks
        await this.uploadFile("lib/XRPLib/version.py", "__version__ = '" + this.latestLibraryVersion[0] + "." + this.latestLibraryVersion[1] + "." + this.latestLibraryVersion[2] + "'\n");
        cur_percent += percent_per;

        await this.deleteFileOrDir("/lib/ble");  //delete all the files first to avoid any confusion.
        for (let i = 0; i < this.bleList.length; i++) {
            //window.setPercent?.(cur_percent, "Updating XRPLib..."); TODO: show percentage
            //added a version number to ensure that the browser does not cache it.
            await this.uploadFile("lib/ble/" + this.bleList[i], await this.downloadFile("lib/ble/" + this.bleList[i] + "?version=" + this.latestLibraryVersion[2]));
            cur_percent += percent_per;
        }

        await this.deleteFileOrDir("/lib/phew");  //delete all the files first to avoid any confusion.
        for (let i = 0; i < this.phewList.length; i++) {
            //window.setPercent?.(cur_percent, "Updating XRPLib..."); TODO: show percentage
            //added a version number to ensure that the browser does not cache it.
            await this.uploadFile("lib/phew/" + this.phewList[i], await this.downloadFile("lib/phew/" + this.phewList[i] + "?version=" + this.latestLibraryVersion[2]));
            cur_percent += percent_per;
        }

        //needed for this BLE release. Replace the main.py file so that the BLE support will be available.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cur_percent = 100;
        //window.setPercent?.(cur_percent, "Updating XRPLib..."); TODO: show percentage
        await this.uploadFile("/main.py", await this.downloadFile("lib/main.py" + "?version=" + this.latestLibraryVersion[2]));


        //window.resetPercentDelay?.(); TODO:show percentage
        await this.getOnBoardFSTree();
        //UIkit.modal(document.getElementById("IDProgressBarParent")).hide();
    }

    async updateMicroPython() {

        //UIkit.modal(document.getElementById("IDProgressBarParent")).show();
        //document.getElementById("IdProgress_TitleText")!.innerText = 'Update in Progress...';

        if (this.BUSY == true) {
            return;
        }
        this.BUSY = true;

        //window.setPercent?.(1, "Updating MicroPython..."); TODO: show percentage

        if (this.HAS_MICROPYTHON) {
            const cmd = "import machine\n" +
                "machine.bootloader()\n";

            await this.connection?.getToRaw();

            this.connection?.startReaduntil("OK");
            await this.connection?.writeToDevice(cmd + this.connection!.CTRL_CMD_SOFTRESET);
        }

        let writable: FileSystemWritableFileStream;
        //window.setPercent?.(3); TODO: Show percentage
        try {
            //message select the RPI-RP2
            //let dirHandler = await (window as any).showDirectoryPicker({ mode: "readwrite" });
            const dirHandler = await this.showDialogAndPickDirectory();
            const fileHandle = await dirHandler?.getFileHandle("firmware.uf2", { create: true });
            writable = await fileHandle!.createWritable();
        } catch (err) {
            this.cmdLogger.debug(err);
            //UIkit.modal(document.getElementById("IDProgressBarParent")).hide();
            window.alert("Error updating MicroPython. Please try again.");
            this.BUSY = false;
            return;                                                                     // If the user doesn't allow tab to save to opened file, don't edit file
        }

        //window.setPercent?.(35); TODO: show percentage
        let mpver = "firmware2350.uf2"
        if(this.PROCESSOR === 2040){
            mpver = "firmware2040.uf2"
        }
        const data = await (await fetch("micropython/" + mpver)).arrayBuffer();
        //window.setPercent?.(85); TODO: show percentage
        //message to click on Edit Files
        await writable.write(data);
        //at some point after this write the PICO will reboot
        //window.resetPercentDelay?.();
        this.HAS_MICROPYTHON = true;
        try {
            await writable.close();
        }
        catch {
            this.cmdLogger.debug("PICO rebooted before close - this is ok");
        }

        this.BUSY = false;
        // hide modal after installation is complete
        //UIkit.modal(document.getElementById("IDProgressBarParent")).hide();
    }

    async  downloadFile(filePath:string) {
        const response = await fetch(filePath);
    
        if(response.status != 200) {
            throw new Error("Server Error");
        }
        // read response stream as text
        return await response.text();
    }

    //TODO: figure out a way to do this.
    async  showDialogAndPickDirectory(): Promise<FileSystemDirectoryHandle | null> {
        return new Promise((resolve) => {
            // Create a modal dialog
            const modal = document.createElement("div");
            modal.style.position = "fixed";
            modal.style.top = "50%";
            modal.style.left = "50%";
            modal.style.transform = "translate(-50%, -50%)";
            modal.style.padding = "20px";
            modal.style.backgroundColor = "blue";
            modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            modal.style.borderRadius = "8px";
            modal.style.zIndex = "1000";
            modal.innerHTML = "<p>Select directory RPI-RP2</p>";
    
            // Create OK button
            const okButton = document.createElement("button");
            okButton.textContent = "OK";
            okButton.style.marginTop = "10px";
    
            // Append button to modal
            modal.appendChild(okButton);
            document.body.appendChild(modal);
    
            // When OK is clicked, close the modal and open directory picker
            okButton.addEventListener("click", async () => {
                document.body.removeChild(modal); // Remove the modal
    
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const dirHandle = await (window as any).showDirectoryPicker();
                    resolve(dirHandle); // Resolve the promise with the selected directory handle
                } catch (error) {
                    console.error("Error selecting directory:", error);
                    resolve(null); // Resolve with null if an error occurs
                }
            });
        });
    }
    
    /*** File Routines  ***/

    async getOnBoardFSTree() {
        if (this.BUSY == true) {
            return;
        }
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: in getOnBoardFSTree");

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
            const fsData = JSON.stringify(this.treeData);
            const szData = hiddenLines[1].split(' ');
            //console.log("File Data: " +fsData);
            this.cmdLogger.debug("storage data: ", szData);
            AppMgr.getInstance().emit(EventType.EVENT_FILESYS, fsData);

            //this.onFSData?.(JSON.stringify(this.DIR_STRUCT), hiddenLines[1].split(' '));
        }

        //window.setPercent(65, "Fetching filesystem...");

        // Get back into normal mode and omit the 3 lines from the normal message,
        // don't want to repeat (assumes already on a normal prompt)
        await this.connection?.getToNormal(3);
        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: out of getOnBoardFSTree");
        //window.setPercent(100);
        //window.resetPercentDelay();
    }

    private DIR_DATA: string[] = [];
    //private DIR_STRUCT = {};
    private DIR_INDEX:number = 0;

    // Initial tree structure
    treeData: FolderItem[] = [];

    changeToJSON(data: string[]) {
        this.treeData = [
            {
                id: "root",
                name: "/",
                isReadOnly: false,
                path: "/",
                children: []
            }
        ];
        data[0] = data[0].slice(2);
        this.DIR_DATA = data[0].split(';');
        this.DIR_INDEX = 0;
        this.dirRoutine("", "", this.treeData[0].children);
    }

    dirRoutine(dir: string, curPath: string, tree:FolderItem[] | null) {
        let dir_struct: FolderItem;
        while (this.DIR_INDEX < (this.DIR_DATA!.length - 1)) {

            const [path, index, type, name] = this.DIR_DATA![this.DIR_INDEX].split(',');
            if (dir === path) {
                this.DIR_INDEX++;
                
                let newPath = curPath;
                if (curPath === "/"){
                    newPath += path;
                }
                else{
                    newPath +=  "/" + path;
                }

                if (type == 'F') {
                    if( newPath + name != "/main.py"){  //TODO:if we want a setting to show /main.py then here is the location
                        dir_struct={
                            id: path+index,
                            name: name,
                            isReadOnly: false,
                            path: newPath,
                            children: null
                        }
                        tree?.push(dir_struct);  
                    }                  
                }
                else {
                    dir_struct={
                        id: path+index,
                        name: name,
                        isReadOnly: false,
                        path: newPath,
                        children: []
                    }
                    tree?.push(dir_struct);
                    this.dirRoutine(name, newPath, dir_struct.children);
                   // dir_struct[dir] = { ...dir_struct[dir], ...this.dirRoutine(name) };
                }

            }
            else {
                break;
            }
        }
        return; //dir_struct;
    }

    async renameFile(oldPath: string, newName: string) {
        if (oldPath != undefined && newName != undefined && newName != null && newName != "") {
            if (this.BUSY == true) {
                return;
            }
            this.BUSY = true;
            //window.setPercent?.(1, "Renaming file..."); TODO:

            const newPath = oldPath.substring(0, oldPath.lastIndexOf("/") + 1) + newName;
            const cmd = "import uos\n" +
                "exists = 1\n" +
                "try:\n" +
                "   f = open('" + newPath + "', 'r')\n" +
                "   exists = 1\n" +
                "   f.close()\n" +
                "except  OSError:\n" +
                "   exists = 0\n" +
                "if exists == 0:\n" +
                "   uos.rename('" + oldPath + "', '" + newPath + "')\n" +
                "   print('no_rename_error')\n" +
                "else:\n" +
                "   print('rename_error')\n";

            //window.setPercent?.(2); TODO:
            await this.connection?.writeUtilityCmdRaw(cmd, true, 1);
            //window.setPercent?.(55); TODO:

            // Get back into normal mode and omit the 3 lines from the normal message,
            // don't want to repeat (assumes already on a normal prompt)
            await this.connection?.getToNormal(3);
            this.BUSY = false;

            // Make sure to update the filesystem after modifying it
            await this.getOnBoardFSTree();
            //window.setPercent?.(100); TODO:
            //window.resetPercentDelay?.();
        }
    }

    async buildPath(path: string) {
        if (this.BUSY == true) {
            return;
        }
        this.BUSY = true;
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: in buildPath");;


        // Got through and make sure entire path already exists
        const cmd = "import uos\n" +
            "try:\n" +
            "    path = '" + path + "'\n" +
            "    path = path.split('/')\n" +
            "    builtPath = path[0]\n" +
            "    for i in range(1, len(path)+1):\n" +
            "        try:\n" +
            "            uos.mkdir(builtPath)\n" +
            "        except OSError:\n" +
            "            print('Directory already exists, did not make a new folder')\n" +
            "        if i < len(path):\n" +
            "            builtPath = builtPath + '/' + path[i]\n" +
            "except Exception as err:\n" +
            "    print('Some kind of error while building path...' + err)\n";

        await this.connection?.writeUtilityCmdRaw(cmd, true, 1);

        // Get back into normal mode and omit the 3 lines from the normal message,
        // don't want to repeat (assumes already on a normal prompt)
        await this.connection?.getToNormal(3);

        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: out of buildPath");

    }


    async uploadFile(filePath: string, fileContents: string | Uint8Array, usePercent: boolean = false) {
        if (this.BUSY == true) {
            return true;
        }

        const pathToFile = filePath.substring(0, filePath.lastIndexOf('/'));
        await this.buildPath(pathToFile);

        this.BUSY = true;
        //TODO: Show percentage
        //if (usePercent) window.setPercent?.(1, "Saving file...");
        //if (usePercent) window.setPercent?.(2);

        // Convert strings to binary
        let bytes: Uint8Array | undefined = undefined;
        if (typeof fileContents == "string") {
            bytes = new Uint8Array(fileContents.length);
            for (let i = 0; i < fileContents.length; i++) {
                bytes[i] = fileContents.charCodeAt(i);
            }
        } else {
            bytes = fileContents;
        }

        //[TODO] - This should be just the length of what is available. Not just 2MB
        if ( this.PROCESSOR == 2040 && bytes.length >= 2000000) {
            alert("This file is at least 2MB, too large, not uploading");
            return;
        }


        // https://forum.micropython.org/viewtopic.php?t=10659&p=58710
        const writeFileScript = "import micropython\n" +
            "import sys\n" +
            "import time\n" +
            "blocksize = " + this.connection?.XRP_SEND_BLOCK_SIZE + "\n" +
            "micropython.kbd_intr(-1)\n" +
            "time.sleep(0.035)\n" +
            "print('started')\n" +
            "w = open('" + filePath + "','wb')\n" +

            "byte_count_to_read = " + bytes.length + "\n" +
            "read_byte_count = 0\n" +
            "read_buffer = bytearray(blocksize)\n" +
            "specialStartIndex = 0\n" +
            "specialEndIndex = blocksize \n" +
            "if byte_count_to_read > 0:\n" +
            "  while True:\n" +
            "    read_byte_count = read_byte_count + sys.stdin.buffer.readinto(read_buffer, blocksize)\n" +

            //"    if byte_count_to_read == -1:\n" +
            //"        byte_count_to_read = int(read_buffer[0:7].decode('utf-8'))\n" +
            //"        print(byte_count_to_read)\n" +
            // "        sys.stdout.write('EOF')\n" +
            //"        specialIndex = 7\n" +

            "    if read_byte_count >= byte_count_to_read:\n" +
            "        specialEndIndex = blocksize - (read_byte_count - byte_count_to_read)\n" +
            "        read_byte_count = read_byte_count - blocksize + specialEndIndex\n" +

            "    w.write(bytearray(read_buffer[0:specialEndIndex]))\n" +
            //"    specialIndex = 0\n" +
            // "    print(read_byte_count)\n" +
            // "    sys.stdout.write('EOF')\n" +
            //"    print('counts ' + str(read_byte_count) + ' of ' + str(byte_count_to_read))\n" +
            "    if read_byte_count >= byte_count_to_read:\n" +
            "        break\n" +
            //"print('upload file done')\n" +
            "w.close()\n" +

            "micropython.kbd_intr(0x03)\n";



        await this.connection?.writeUtilityCmdRaw(writeFileScript, true, 1, "started");  //we wait until we print started, otherwise we may write a binary ctl character before the micropython.kbd_intr(-1)

        // https://stackoverflow.com/a/1127966
        //var bytesLenStr = "" + bytes.length;
        //while (bytesLenStr.length < 7) {
        //    bytesLenStr = "0" + bytesLenStr;
        //}
        //await this.writeToDevice(bytesLenStr);

        if(usePercent){ /* empty */ }
        //if (usePercent) window.setPercent?.(3); TODO: show percentage

        const numberOfChunks = Math.ceil(bytes.length / this.connection!.XRP_SEND_BLOCK_SIZE);
        let currentPercent = 3;
        const endingPercent = 98;
        const percentStep = (endingPercent - currentPercent) / numberOfChunks;


        let bytesSent = 0;
        for (let b = 0; b < numberOfChunks; b++) {
            let writeDataCMD = bytes.slice(b * this.connection!.XRP_SEND_BLOCK_SIZE, (b + 1) * this.connection!.XRP_SEND_BLOCK_SIZE);

            bytesSent = bytesSent + writeDataCMD.length;

            if (bytesSent == bytes.length && writeDataCMD.length < this.connection!.XRP_SEND_BLOCK_SIZE) {
                const fillerArray = new Uint8Array(this.connection!.XRP_SEND_BLOCK_SIZE - writeDataCMD.length);
                for (let i = 0; i < fillerArray.length; i++) {
                    fillerArray[i] = 255;
                }

                const finalArray = new Uint8Array(writeDataCMD.length + fillerArray.length);
                finalArray.set(writeDataCMD, 0);
                finalArray.set(fillerArray, writeDataCMD.length);
                writeDataCMD = finalArray;
            }

            await this.connection?.writeToDevice(writeDataCMD);

            /*
                        if(this.WRITER != undefined){
                            // this.startReaduntil("EOF");
                            await this.WRITER.write(writeDataCMD);
                            //console.log("Sent file chunk: " + b);
                            // await this.haltUntilRead(0);
                        }else{
                            if(this.DEBUG_CONSOLE_ON) console.log("%cNot writing to device, none connected", "color: red");
                        }
            */

            currentPercent = currentPercent + percentStep;
            //if (usePercent) window.setPercent?.(currentPercent); TODO: show percentage
        }

        // await this.haltUntilRead(1);
        await this.connection?.getToNormal(3);
        //if (usePercent) window.resetPercentDelay?.(); TODO:
        this.BUSY = false;
    }

    async uploadFiles(path: string, fileHandles: FileSystemFileHandle[]) {
        if (this.BUSY == true) {
            return;
        }
        //UIkit.modal(document.getElementById("IDProgressBarParent")).show(); TODO:

        //window.setPercent?.(1, "Saving files...");
        const percent_per = 99 / fileHandles.length;
        let cur_percent = 1 + percent_per;

        for (let i = 0; i < fileHandles.length; i++) {
            //window.setPercent?.(cur_percent);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            cur_percent += percent_per;
            const file = await fileHandles[i].getFile();

            //const bytes = new Uint8Array(await file.arrayBuffer());
            //[TODO] Should we be doing this check? - it seems yes so that .mpy files get binary encoded.
            if (file.name.indexOf(".py") != -1 || file.name.indexOf(".txt") != -1 || file.name.indexOf(".text") != -1 || file.name.indexOf(".cfg") != -1) {
                await this.uploadFile(path + file.name, await file.text(), true);
            } else {
                await this.uploadFile(path + file.name, new Uint8Array(await file.arrayBuffer()), true);
            }
        }

        //window.resetPercentDelay?.(); TODO:
        //UIkit.modal(document.getElementById("IDProgressBarParent")).hide();  TODO:

        await this.getOnBoardFSTree();
    }

    async getFileContents(filePath: string): Promise<number[]> {
        if (this.BUSY == true) {
            return [];
        }
        this.BUSY = true;

        const cmd = "import sys\n" +
            "chunk_size = 200\n" +
            "onboard_file = open('" + filePath + "', 'rb')\n" +
            "while True:\n" +
            "    data = onboard_file.read(chunk_size)\n" +
            "    if not data:\n" +
            "        break\n" +
            "    sys.stdout.buffer.write(data)\n" +
            //"    sys.stdout.write('read more')\n" +
            "onboard_file.close()\n" +
            "sys.stdout.write('###DONE READING FILE###')\n";

        const hiddenLines = await this.connection?.writeUtilityCmdRaw(cmd, true, 1, "###DONE READING FILE###");
        let lines = hiddenLines!.join('\r\n');

        lines = lines.slice(2, lines[0].length - 27);  // Get rid of 'OK' and '###DONE READING FILE###'

        this.BUSY = false;
        await this.connection?.getToNormal(3);
        return Array.from(new TextEncoder().encode(lines));

    }
    

    // Given a path, delete it on XRP
    async deleteFileOrDir(path: string) {
        if (path != undefined) {
            if (this.BUSY == true) {
                return;
            }
            this.BUSY = true;

            //window.setPercent?.(1, "Deleting..."); TODO:
            const cmd = "import os\n" +
                "def rm(d):  # Remove file or tree\n" +
                "   try:\n" +
                "       if os.stat(d)[0] & 0x4000:  # Dir\n" +
                "           for f in os.ilistdir(d):\n" +
                "               if f[0] not in ('.', '..'):\n" +
                "                   rm('/'.join((d, f[0])))  # File or Dir\n" +
                "           os.rmdir(d)\n" +
                "       else:  # File\n" +
                "           os.remove(d)\n" +
                "       print('rm_worked')\n" +
                "   except:\n" +
                "       print('rm_failed')\n" +
                "rm('" + path + "')\n";


            //window.setPercent?.(2); TODO:
            await this.connection?.writeUtilityCmdRaw(cmd, true, 1);
            //window.setPercent?.(55); TODO:

            // Get back into normal mode and omit the 3 lines from the normal message,
            // don't want to repeat (assumes already on a normal prompt)
            await this.connection?.getToNormal(3);
            this.BUSY = false;

            // Make sure to update the filesystem after modifying it
            await this.getOnBoardFSTree();
            //window.setPercent?.(100); TODO:
            //window.resetPercentDelay?.();
        }
    }
    /*** Run Program routines  ***/

    
    async updateMainFile(fileToEx: string): Promise<string> {

        if (this.BUSY == true) {
            return "";
        }
        this.BUSY = true;

        let fileToEx2 = fileToEx;
        if (fileToEx.startsWith('/')) {
            fileToEx2 = fileToEx.slice(1);
        }

        const value = "import os\n" +
            "import sys\n" +
            //"from machine import Pin\n" +
            "import time\n" +
            "FILE_PATH = '/lib/ble/isrunning'\n" +
            "doNothing = False\n" +
            "x = os.dupterm(None, 0)\n" +
            "if(x == None):\n" +
            "   import ble.blerepl\n" +
            "else:\n" +
            "   os.dupterm(x,0)\n" +
            //"button = Pin(22, Pin.IN, Pin.PULL_UP)\n" +
            //"time.sleep(0.1)\n" +
            //"if(button.value() == 0):\n" +
            //"   sys.exit()\n" +
            "try:\n" +
            "   with open(FILE_PATH, 'r+b') as file:\n" +
            "      byte = file.read(1)\n" +
            "      if byte == b'\\x01':\n" +
            "         file.seek(0)\n" +
            "         file.write(b'\\x00')\n" +
            "         doNothing = True\n" +
            "      else:\n" +
            "         file.seek(0)\n" +
            "         file.write(b'\\x01')\n" +
            "   if(not doNothing):\n" +
            "       with open('" + fileToEx + "', mode='r') as exfile:\n" +
            "           code = exfile.read()\n" +
            "       execCode = compile(code, '" + fileToEx2 + "', 'exec')\n" +
            "       exec(execCode)\n" +
            "       with open(FILE_PATH, 'r+b') as file:\n" +
            "           file.write(b'\\x00')\n" +
            "except Exception as e:\n" +
            "   import sys\n" +
            "   sys.print_exception(e)\n" +
            "   with open(FILE_PATH, 'r+b') as file:\n" +
            "      file.write(b'\\x00')\n" +
            "finally:\n" +
            "   import gc\n" +
            "   gc.collect()\n" +
            "   if 'XRPLib.resetbot' in sys.modules:\n" +
            "      del sys.modules['XRPLib.resetbot']\n" +
            "   import XRPLib.resetbot";

        if (this.lastRun == undefined || this.lastRun != fileToEx) {
            await this.uploadFile("//main.py", value, true); //no need to save the main file again if it is the same file to execute.
        }
        this.lastRun = fileToEx;
        this.BUSY = false;

        return value;
    }

    async executeLines(lines: string) {
        if (this.BUSY == true) {
            return;
        }
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: in executeLines");

        this.BUSY = true;
        this.connection?.goCommand(lines);
        this.BUSY = false;
        if (this.DEBUG_CONSOLE_ON) this.cmdLogger.debug("fcg: out of executeLines");

        // Make sure to update the filesystem as there is a small chance that the program saved something like a log file.
        await this.getOnBoardFSTree();
        }
    
}

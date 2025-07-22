import AppMgr, { EventType } from "@/managers/appmgr";
import { FolderItem } from "./types";
import { Constants } from "./constants";

/**
 * fireGoogleUserTree - get a list of Google files in XRPCodes folder and generate a folder tree
 */
export const fireGoogleUserTree = async (username: string) => {
    const driveService = AppMgr.getInstance().driveService;

    await driveService.getFileList(Constants.XRPCODES).then((files) => {
        if (files) {
            const children = files.map((file) => ({
                name: file.name,
                id: file.id,
                fileId: file.id,
                isReadOnly: false, // Assuming all files are writable
                path: Constants.GUSERS_FOLDER + username,
                children: file.mimeType === 'application/vnd.google-apps.folder' ? [] : null
            }));

            // find the XRPCodes's file ID first
            AppMgr.getInstance().driveService.findFolderByName(Constants.XRPCODES).then((fileId) => {
                const gfolderTree: FolderItem = {
                    name: Constants.XRPCODES,
                    id: Constants.XRPCODES,
                    isReadOnly: false,
                    path: Constants.GUSERS_FOLDER + username,
                    children: children,
                    fileId: fileId ?? undefined, // Google Drive file ID not applicable here
                };
                AppMgr.getInstance().emit(
                    EventType.EVENT_FILESYS,
                    JSON.stringify([gfolderTree]),
                );
            })
        }
    });
}

/**
 * getUsernameFromEmail - extract username from email
 * @param email email address
 * @returns username part of the email
 */
export const getUsernameFromEmail = (email: string): string | undefined => {
    if (typeof email !== 'string' || !email.includes('@')) {
        return undefined;
    }
    const atIndex = email.indexOf('@');
    if (atIndex === -1) {
        return undefined;
    }
    return email.substring(0, atIndex);
};
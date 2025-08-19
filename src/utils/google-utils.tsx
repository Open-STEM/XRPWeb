import AppMgr, { EventType } from "@/managers/appmgr";
import { FolderItem } from "./types";
import { Constants } from "./constants";
import { GoogleDriveFile } from "@/services/google-drive";

/**
 * transformGDriveTreeToFolderTree - recursively convert the GoogleDriveFile tree to FolderItem tree
 * @param username - username to be used in XRP Robot path
 * @param driveItem - tree items from Google Drive
 * @returns - A FolderItem structure
 */
const transformGDriveTreeToFolderTree = (username: string, driveItem: GoogleDriveFile): FolderItem => {
    const itemType: 'file' | 'folder' = 
        driveItem.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file';

    const folderItem: FolderItem = {
        name: driveItem.name,
        id: driveItem.id,
        fileId: driveItem.id,
        isReadOnly: false, 
        path: Constants.GUSERS_FOLDER + username,
        children: null
    }

    if (driveItem.children && driveItem.children.length > 0 && itemType === 'folder') {
        folderItem.children = driveItem.children.map(child =>
            transformGDriveTreeToFolderTree(username, child)
        );
    }
    return folderItem;
};

/**
 * fireGoogleUserTree - get a list of Google files in XRPCodes folder and generate a folder tree
 */
export const fireGoogleUserTree = async (username: string) => {
    const driveService = AppMgr.getInstance().driveService;

    await driveService.buildTree(Constants.XRPCODES).then((tree) => {
        if (tree) {
            const folderTree = transformGDriveTreeToFolderTree(username, tree);
            AppMgr.getInstance().emit(EventType.EVENT_FILESYS, JSON.stringify([folderTree]));
        };
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
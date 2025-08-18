import logger from '@/utils/logger';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GoogleDriveFileMetadata {
    id: string;
    name: string;
    mimeType: string;
    // Add other fields you might want, like 'exportLinks' for Google Workspace files
    exportLinks?: { [key: string]: string };
}

interface GoogleDriveFile {
    id: string;
    name: string;
    mimeType: string;
    description?: string;
    starred?: boolean;
    kind: string;
    // Add other fields you might want to retrieve, e.g.:
    webViewLink?: string;
    webContentLink?: string;
    thumbnailLink?: string;
    // createdTime?: string;
    // modifiedTime?: string;
}

/**
 * Google Drive Service class for handling file operations.
 * This class provides methods to login, logout, retrieve file lists,
 * get file content, and find folders by name.
 */
class GoogleDriveService {
    private _accessToken: string | null = null;
    private _driveApiUrl: string = 'https://www.googleapis.com/drive/v3/files';
    private _modeLogger = logger.child({ module: 'googleapi' });

    constructor() {}

    /**
     * Sets the access token for Google Drive operations.
     * @param token The access token to set.
     */
    setAccessToken(token: string) {
        this._accessToken = token;
    }

    /**
     * Creates a new folder in Google Drive.
     *
     * @param folderName The desired name for the new folder.
     * @param parentFolderId (Optional) The ID of the parent folder where the new folder should be created. If not provided, it goes to My Drive root.
     * @returns A Promise that resolves to the created folder's metadata if successful, or null if an error occurs.
     */
    async createFolder(
        folderName: string,
        parentFolderId?: string,
    ): Promise<GoogleDriveFile | null> {
        const createUrl = 'https://www.googleapis.com/drive/v3/files';
        // Always request fields you need, like id, name, mimeType, and webViewLink for folders
        const fieldsToReturn = 'id,name,mimeType,webViewLink';
        const finalUrl = `${createUrl}?fields=${fieldsToReturn}`;

        try {
            const metadata: any = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder', // This is the key!
            };

            if (parentFolderId) {
                metadata.parents = [parentFolderId];
            }

            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this._accessToken}`,
                    'Content-Type': 'application/json', // Send metadata as JSON
                },
                body: JSON.stringify(metadata),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Google Drive API folder creation error: ${response.status} - ${errorData.error.message}`,
                );
            }

            const folderMetadata: GoogleDriveFile = await response.json();
            this._modeLogger.debug(`Folder '${folderName}' created successfully!`);
            this._modeLogger.debug('Created Folder Metadata:', folderMetadata);

            return folderMetadata;
        } catch (error) {
            this._modeLogger.error('Error creating Google Drive folder:', error);
            return null;
        }
    }

    /**
     * getFileList - retrieves the list of files in a specified folder in Google Drive.
     * It searches for the folder by name and returns the files within it.
     * @param folderName The name of the folder to search for in Google Drive.
     * @returns
     */
    async getFileList(folderName: string): Promise<GoogleDriveFile[] | undefined> {
        // Logic to retrieve the list of files from Google Drive
        if (!this._accessToken) {
            throw new Error('Access token is not set. Please authenticate first.');
        }

        let folderId = null;
        try {
            folderId = await this.findFolderByName(folderName);
            if (folderId) {
                this._modeLogger.debug(`Folder found: ${folderId}`);
            } else {
                this._modeLogger.error(`Folder "${folderName}" not found.`);
                return;
            }
        } catch (error) {
            this._modeLogger.error('Error finding folder:', error);
            return;
        }

        const query = `'${folderId}' in parents and trashed = false`;
        const fields = 'files(id, name, mimeType)';
        const url = new URL(this._driveApiUrl);
        url.searchParams.append('q', query);
        url.searchParams.append('fields', fields);

        let files: GoogleDriveFile[] = [];
        await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${this._accessToken}`,
                Accept: 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.files && data.files.length > 0) {
                    console.log('Files:', data.files);
                    files = data.files.map((file: any) => ({
                        kind: file.kind,
                        id: file.id,
                        name: file.name,
                        mimeType: file.mimeType
                    }));
                }
            })
            .catch((error) => {
                this._modeLogger.error('Error fetching files:', error);
            });

        return files;
    }

    /**
     * Downloads a file from Google Drive.
     * For non-Google Workspace files, it downloads the raw content.
     * For Google Workspace files (Docs, Sheets, etc.), it exports them to a specified MIME type.
     *
     * @param fileId The ID of the Google Drive file.
     * @param accessToken The Google Drive API access token.
     * @param downloadFileName (Optional) The name to use when saving the file. Defaults to original file name.
     * @param exportMimeType (Optional) For Google Workspace files, the desired export MIME type (e.g., 'application/pdf').
     * @returns A Promise that resolves to a Blob of the file content, or null if an error occurs.
     */
    async downloadFile(
        fileId: string,
        downloadFileName?: string,
        exportMimeType?: string, // Relevant for Google Workspace docs like Google Sheets, not directly for .py files
    ): Promise<{ blob: Blob; fileName: string; mimeType: string } | null> {
        let driveApiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;

        try {
            // 1. Get file metadata
            const metadataUrl = `${driveApiUrl}?fields=id,name,mimeType,exportLinks`;
            const metadataResponse = await fetch(metadataUrl, {
                method: 'GET',
                headers: { Authorization: `Bearer ${this._accessToken}` },
            });

            if (!metadataResponse.ok) {
                const errorData = await metadataResponse.json();
                throw new Error(
                    `Failed to get file metadata: ${metadataResponse.status} - ${errorData.error.message}`,
                );
            }
            const metadata: GoogleDriveFileMetadata = await metadataResponse.json();
            const fileName = downloadFileName || metadata.name;

            let contentResponse: Response;

            // For a .py file, it will fall into this 'else' block, using alt=media
            if (metadata.mimeType.startsWith('application/vnd.google-apps.') && exportMimeType) {
                // This path is for Google Docs, Sheets, etc., not typical for .py files
                driveApiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(
                    exportMimeType,
                )}`;
                contentResponse = await fetch(driveApiUrl, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${this._accessToken}` },
                });
            } else {
                // This path is for regular files like .py, .txt, .pdf, images etc.
                driveApiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
                contentResponse = await fetch(driveApiUrl, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${this._accessToken}` },
                });
            }

            if (!contentResponse.ok) {
                const errorText = await contentResponse.text();
                throw new Error(
                    `Failed to download file content: ${contentResponse.status} - ${errorText}`,
                );
            }

            const blob = await contentResponse.blob();
            return { blob, fileName, mimeType: metadata.mimeType };
        } catch (error) {
            this._modeLogger.error('Error downloading Google Drive file:', error);
            return null;
        }
    }

    /**
     * Downloads a Python file from Google Drive and stores its content in memory as a string.
     *
     * @param pythonFileId The ID of the Python file in Google Drive.
     * @param accessToken The Google Drive API access token.
     * @returns A Promise resolving to the content of the Python file as a string, or null if an error occurs.
     */
    async getFileContents(pythonFileId: string): Promise<string | null> {
        console.log(`Attempting to download Python file with ID: ${pythonFileId}`);
        try {
            const downloadResult = await this.downloadFile(pythonFileId);

            if (!downloadResult) {
                this._modeLogger.error('Failed to download the Python file.');
                return null;
            }

            const { blob, fileName, mimeType } = downloadResult;

            this._modeLogger.debug(
                `Downloaded file '${fileName}' (MIME type: ${mimeType}). Converting to text...`,
            );

            // Convert the Blob to a string
            const fileContent: string = await blob.text();

            this._modeLogger.debug(`File '${fileName}' content successfully loaded into memory.`);

            return fileContent;
        } catch (error) {
            this._modeLogger.error('Error in getPythonFileContentInMemory:', error);
            return null;
        }
    }

    /**
     * findFolderByName - search Google Drive for the given folderName and return the folder ID
     * @param folderName
     * @param parentFolderId
     * @returns
     */
    async findFolderByName(folderName: string, parentFolderId?: string): Promise<string | null> {
        let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const fields = 'files(id, name, mimeType)';
        if (parentFolderId) {
            query += ` and '${parentFolderId}' in parents`;
        }

        try {
            const url = new URL('https://www.googleapis.com/drive/v3/files');
            url.searchParams.append('q', query);
            url.searchParams.append('fields', fields);
            url.searchParams.append('pageSize', '1'); // Specify the space to search in

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this._accessToken}`,
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Google Drive API error: ${response.status} - ${errorData.error.message}`,
                );
            }

            const data = await response.json();
            if (data.files && data.files.length > 0) {
                return data.files[0].id; // Return the first matching folder ID
            }
            return null; // No folder found
        } catch (error) {
            this._modeLogger.error('Error finding folder:', error);
            throw error; // Re-throw the error for further handling
        }
    }

    /**
     * Uploads a Blob from memory to a specified Google Drive folder.
     *
     * @param fileBlob The Blob object representing the file content.
     * @param fileName The desired name for the file in Google Drive (e.g., "my_script.py").
     * @param mimeType The MIME type of the file (e.g., "text/x-python", "application/pdf").
     * @param parentFolderId (Optional) The ID of the folder where the file should be uploaded. If not provided, it goes to My Drive root.
     * @returns A Promise that resolves to the Google Drive file metadata if successful, or null if an error occurs.
     */
    async uploadFile(
        fileBlob: Blob,
        fileName: string,
        mimeType: string,
        parentFolderId?: string,
    ): Promise<{
        id: string;
        name: string;
        mimeType: string;
        webViewLink?: string;
    } | null> {
        const fieldsToReturn = 'id,name,webViewLink';
        const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${fieldsToReturn}`;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metadata: any = {
                name: fileName,
                mimeType: mimeType,
            };

            if (parentFolderId) {
                metadata.parents = [parentFolderId];
            }

            // Create a FormData object for multipart upload
            const formData = new FormData();

            // Append file metadata as a Blob with 'application/json' type
            formData.append(
                'metadata',
                new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
            );

            // Append the file Blob itself
            formData.append('file', fileBlob);

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this._accessToken}`,
                    // 'Content-Type': 'multipart/related' is set automatically by FormData with boundary
                },
                body: formData, // FormData handles setting the correct Content-Type header
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Google Drive API upload error: ${response.status} - ${errorData.error.message}`,
                );
            }

            const uploadedFileMetadata = await response.json();
            this._modeLogger.debug(`File '${fileName}' uploaded successfully!`);
            this._modeLogger.debug('Uploaded File Metadata:', uploadedFileMetadata);

            return uploadedFileMetadata;
        } catch (error) {
            this._modeLogger.error('Error uploading blob to Google Drive:', error);
            return null;
        }
    }

    /**
     * Uploads a Blob from memory to Google Drive, overwriting an existing file
     * if its ID is provided, or creating a new one otherwise.
     *
     * @param fileBlob The Blob object representing the file content.
     * @param fileName The desired name for the file in Google Drive.
     * @param mimeType The MIME type of the file.
     * @param existingFileId (Optional) The ID of an existing file to overwrite.
     * @param parentFolderId (Optional) The ID of the folder where the file should be uploaded (if creating) or remain (if updating).
     * @returns A Promise that resolves to the Google Drive file metadata with requested fields if successful, or null.
     */
    async upsertFileToGoogleDrive(
        fileBlob: Blob,
        fileName: string,
        mimeType: string,
        existingFileId?: string,
        parentFolderId?: string,
    ): Promise<GoogleDriveFile | null> {
        const fieldsToReturn = 'id,name,mimeType,webViewLink,webContentLink,thumbnailLink';

        let method: 'POST' | 'PATCH' = 'POST';
        try {
            const metadata: any = {
                name: fileName,
                mimeType: mimeType,
            };

            let url: string;

            if (existingFileId) {
                // If fileId is provided, perform an update (overwrite)
                console.log(`Updating existing file with ID: ${existingFileId}`);
                url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=${fieldsToReturn}`;
                method = 'PATCH';
                // For updates, you don't typically include 'parents' in metadata unless you're moving the file.
                // If you are moving a file, you'd use addParents and removeParents query parameters.
                // For simple content overwrite, parents array is usually omitted from the metadata body.
            } else {
                // If no fileId, create a new file
                console.log(`Creating new file named: ${fileName}`);
                url = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${fieldsToReturn}`;
                method = 'POST';
                if (parentFolderId) {
                    metadata.parents = [parentFolderId];
                }
            }

            const formData = new FormData();
            formData.append(
                'metadata',
                new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
            );
            formData.append('file', fileBlob);

            const response = await fetch(url, {
                method: method,
                headers: {
                    Authorization: `Bearer ${this._accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Google Drive API ${method === 'POST' ? 'create' : 'update'} error: ${
                        response.status
                    } - ${errorData.error.message}`,
                );
            }

            const fileMetadata: GoogleDriveFile = await response.json();
            this._modeLogger.debug(
                `File '${fileName}' ${method === 'POST' ? 'created' : 'updated'} successfully.`,
            );
            this._modeLogger.debug('File Metadata:', fileMetadata);

            return fileMetadata;
        } catch (error) {
            this._modeLogger.error(
                `Error ${method === 'POST' ? 'creating' : 'updating'} file:`,
                error,
            );
            return null;
        }
    }

    /**
     * renames a file from Google Drive.
     * @param fileId 
     * @param newName 
     */
    async renameFile(fileId: string, newName: string): Promise<void> {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
        const requestBody = {
            name: newName,
        };

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${this._accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                this._modeLogger.error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const renamedFile = await response.json();
            this._modeLogger.debug(`File renamed successfully to: ${renamedFile.name}`);
        } catch (error) {
            this._modeLogger.error('Failed to rename file:', error);
        }
    }
    
    /**
     * delete a file from Google Drive
     * @param fileId 
     */
    async DeleteFile(fileId: string): Promise<void> {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${this._accessToken}`,
                },
            });

            if (response.ok) {
                this._modeLogger.debug(`File deleted permanently successfully.`);
            } else {
                const errorData = await response.json();
                this._modeLogger.error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

        } catch (error) {
            this._modeLogger.error('Failed to delete file', error);
        }

    }
}

export default GoogleDriveService;

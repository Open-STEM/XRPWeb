import { GeminiClient, UploadedFile } from './gemini-client';
import EditorMgr from '@/managers/editormgr';
import { StorageKeys } from './localstorage';
import { EditorType } from './types';

// Single concatenated documentation file
const COMBINED_DOCS_FILE = 'combined_documentation.md';

/**
 * Loads and uploads the combined documentation file
 */
export class GeminiContextLoader {
    private geminiClient: GeminiClient;
    private uploadedFile: UploadedFile | null = null;
    private isContextLoaded: boolean = false;

    constructor(geminiClient: GeminiClient) {
        this.geminiClient = geminiClient;
    }

    /**
     * Load the combined documentation file content
     */
    async loadCombinedDocs(): Promise<string> {
        try {
            const response = await fetch(`/src/assets/class_docs/${COMBINED_DOCS_FILE}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${COMBINED_DOCS_FILE}: ${response.statusText}`);
            }

            const content = await response.text();
            return content;
        } catch (error) {
            console.warn(`Failed to load ${COMBINED_DOCS_FILE}:`, error);
            return '';
        }
    }

    /**
     * Load and upload the documentation file to Gemini
     */
    async setupContext(): Promise<UploadedFile | null> {
        try {
            if (this.uploadedFile) {
                return this.uploadedFile;
            }

            console.log('Loading combined documentation file...');
            
            const content = await this.loadCombinedDocs();
            
            if (!content) {
                console.warn('No documentation content was loaded');
                this.isContextLoaded = false;
                return null;
            }

            console.log('Uploading documentation to Gemini...');
            this.uploadedFile = await this.geminiClient.uploadMarkdownFile(content, COMBINED_DOCS_FILE);
            this.isContextLoaded = true;
            console.log(`Successfully uploaded documentation file: ${this.uploadedFile.displayName}`);
            return this.uploadedFile;
        } catch (error) {
            console.error('Failed to setup context:', error);
            this.isContextLoaded = false;
            return null;
        }
    }

    /**
     * Get the uploaded context file
     */
    getUploadedFile(): UploadedFile | null {
        return this.uploadedFile;
    }

    /**
     * Clear uploaded context cache
     */
    clearCache(): void {
        this.uploadedFile = null;
        this.isContextLoaded = false;
    }

    /**
     * Check if context is loaded
     */
    hasContextLoaded(): boolean {
        return this.isContextLoaded;
    }

    /**
     * Get context file info
     */
    getContextInfo(): { loaded: boolean; fileName: string | null } {
        return {
            loaded: this.isContextLoaded,
            fileName: this.uploadedFile?.displayName || null
        };
    }

    /**
     * Get current editor content for context
     */
    getCurrentEditorContext(): string {
        const editorMgr = EditorMgr.getInstance();
        const allSessions = editorMgr.getAllEditorSessions();
        const activeEditorId = editorMgr.getActiveEditorId();
        
        if (allSessions.size === 0) {
            return '';
        }

        // Get content from localStorage for all open editors
        const editorStoreJson = localStorage.getItem(StorageKeys.EDITORSTORE);
        if (!editorStoreJson) {
            return '';
        }

        const editorStores = JSON.parse(editorStoreJson);
        const contextSections: string[] = [];

        // Add header with clear explanation
        contextSections.push('The following are the code files currently open in the user\'s development environment:');
        
        for (const session of allSessions.values()) {
            const store = editorStores.find((s: any) => s.id === session.id);
            if (store && store.content) {
                const isActive = session.id === activeEditorId;
                const isBlockly = session.type === EditorType.BLOCKLY;
                
                contextSections.push(
                    `\n### File: ${session.id}${isActive ? ' (CURRENTLY ACTIVE)' : ''}`
                );
                contextSections.push(`**Path:** ${session.path}`);
                contextSections.push(`**Type:** ${isBlockly ? 'Blockly Visual Programming' : 'Python Code'}`);
                
                if (isBlockly) {
                    // For Blockly files, store.content contains the JSON workspace definition
                    contextSections.push('**Description:** This is a visual programming file created with Blockly blocks. The user has dragged and connected visual blocks to create their program logic.');
                    contextSections.push('**Blockly Workspace Structure:**');
                    contextSections.push('```json');
                    try {
                        // Pretty print the JSON for better readability
                        const blocklyJson = JSON.parse(store.content);
                        contextSections.push(JSON.stringify(blocklyJson, null, 2));
                    } catch (e) {
                        // If parsing fails, use raw content
                        contextSections.push(store.content);
                    }
                    contextSections.push('```');
                    
                    // Also try to get the generated Python code if available
                    if (session.content) {
                        contextSections.push('\n**Python Code Generated from Blocks:**');
                        contextSections.push('```python');
                        contextSections.push(session.content);
                        contextSections.push('```');
                    }
                } else {
                    // For Python files, store.content contains the actual Python code
                    contextSections.push('**Description:** This is a Python code file that the user has written or is editing.');
                    contextSections.push('**User\'s Python Code:**');
                    contextSections.push('```python');
                    contextSections.push(store.content);
                    contextSections.push('```');
                }
            }
        }

        return contextSections.join('\n');
    }
}

/**
 * Create a context loader instance
 */
export function createContextLoader(geminiClient: GeminiClient): GeminiContextLoader {
    return new GeminiContextLoader(geminiClient);
} 
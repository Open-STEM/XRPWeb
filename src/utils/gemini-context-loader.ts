import { GeminiClient, UploadedFile } from './gemini-client';

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
}

/**
 * Create a context loader instance
 */
export function createContextLoader(geminiClient: GeminiClient): GeminiContextLoader {
    return new GeminiContextLoader(geminiClient);
} 
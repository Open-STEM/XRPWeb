import { useEffect, useState } from 'react';
import { remark } from 'remark'
import rehype from "remark-rehype"
import rehypeRaw from 'rehype-raw';  // Import rehype-raw for HTML processing
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';  // For sanitization
import stringify from "rehype-stringify"

type changelogProps = {
    /**
     * A function to close the dialog.
     */
    closeDialog: () => void;
}

/**
 * ChangeLogDlg - A component that displays the changelog of the application.
 * @returns ChangeLogDlg
 */
function ChangeLogDlg({closeDialog}: changelogProps) {
    const [markdown, setMarkdown] = useState<string>('');

    useEffect(() => {
        const fetchMarkdown = async () => {
            const response = await fetch('CHANGELOG.txt');
            if (!response.ok) {
                console.error('Failed to fetch changelog:', response.statusText);
                return;
            }
            const text = await response.text();
            // Convert the text to HTML using a markdown parser
            const customSchema = {
                ...defaultSchema,
                tagNames: [...(defaultSchema.tagNames || []), "img", "dev" ],
                attributes: {
                    ...defaultSchema.attributes,
                    img: ["src", "alt", "width", "height", "style"], // Allow img attributes
                    div: ["style"], // Allow div attributes
                },
            };
            const html = await remark()
                .use(rehype, { allowDangerousHtml: true }) // Allow dangerous HTML
                .use(rehypeRaw) // Allow raw HTML
                .use(rehypeSanitize, customSchema) // Sanitize the HTML
                .use(stringify)
                .process(text);
            setMarkdown(html.toString());
        };
        fetchMarkdown();
    }, []);

    return (
      <div id="default-modal" className="overflow-y-auto overflow-x-hidden justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div className="relative w-full max-w-2xl max-h-full">
            <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                {/* Modal header */}
                <div className="flex items-center justify-between md:p-4 border-b rounded-t dark:border-gray-600 border-gray-200">
                    <h3 className="text-2xl font-semibold text-gray-400 dark:text-white">
                        Change Log
                    </h3>
                    <button type="button" onClick={closeDialog} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                    </button>
                </div>
            </div>
            {/* <hr className="w-full border-mountain-mist-600" /> */}
            {/* Modal body */}
            <div className="p-4 prose">
                <div className="prose prose-lg max-[767px]:prose">
                    <div dangerouslySetInnerHTML={{ __html: markdown }} />
                </div>
            </div>
        </div>
      </div>
    )
}

export default ChangeLogDlg
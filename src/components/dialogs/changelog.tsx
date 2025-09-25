import { useEffect, useState } from 'react';
import MarkdownIt from 'markdown-it';

type changelogProps = {
    /**
     * A function to close the dialog.
     */
    closeDialog: () => void;
}

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
});

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
            // Convert the text to HTML using markdown-it
            const html = md.render(text);
            setMarkdown(html);
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
                <div className="prose prose-lg max-[767px]:prose dark:prose-invert
                    prose-headings:font-semibold
                    prose-h1:text-curious-blue-600 prose-h2:text-curious-blue-700 prose-h3:text-curious-blue-800
                    prose-p:text-mountain-mist-800 prose-p:leading-relaxed
                    prose-a:text-curious-blue-600 hover:prose-a:text-curious-blue-700
                    prose-strong:text-mountain-mist-900
                    prose-code:text-curious-blue-700 prose-code:bg-curious-blue-50
                    prose-ul:my-4 prose-ol:my-4
                    prose-li:text-mountain-mist-800">
                    <div dangerouslySetInnerHTML={{ __html: markdown }} />
                </div>
            </div>
        </div>
      </div>
    )
}

export default ChangeLogDlg
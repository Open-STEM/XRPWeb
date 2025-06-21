import { useState } from 'react';
import { GEMINI_MODELS, GeminiModel } from '@/utils/gemini-client';
import { TiArrowSortedDown } from 'react-icons/ti';
import { IoSparkles } from 'react-icons/io5';

interface ModelSelectorProps {
    selectedModel: GeminiModel;
    onModelChange: (model: GeminiModel) => void;
    disabled?: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleModelSelect = (model: GeminiModel) => {
        onModelChange(model);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-mountain-mist-50 dark:hover:bg-mountain-mist-800'
                } bg-white dark:bg-mountain-mist-900 border-mountain-mist-300 dark:border-mountain-mist-600 text-mountain-mist-700 dark:text-mountain-mist-300`}
            >
                <IoSparkles size={16} className="text-curious-blue-600" />
                <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate">{selectedModel.name}</span>
                    <span className="text-xs text-mountain-mist-500 dark:text-mountain-mist-400 truncate">
                        Google Gemini
                    </span>
                </div>
                <TiArrowSortedDown 
                    size={16} 
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-mountain-mist-900 border border-mountain-mist-300 dark:border-mountain-mist-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm">
                    <div className="p-2 bg-white dark:bg-mountain-mist-900">
                        <div className="text-xs font-semibold text-mountain-mist-600 dark:text-mountain-mist-400 px-2 py-1 uppercase tracking-wide bg-mountain-mist-50 dark:bg-mountain-mist-800 rounded">
                            Google Gemini
                        </div>
                        {GEMINI_MODELS.map((model: GeminiModel) => (
                            <button
                                key={model.id}
                                onClick={() => handleModelSelect(model)}
                                className={`w-full text-left px-2 py-2 rounded-md transition-colors bg-white dark:bg-mountain-mist-900 ${
                                    selectedModel.id === model.id
                                        ? 'bg-curious-blue-100 dark:bg-curious-blue-900/30 text-curious-blue-700 dark:text-curious-blue-300 border border-curious-blue-200 dark:border-curious-blue-700'
                                        : 'hover:bg-mountain-mist-50 dark:hover:bg-mountain-mist-800 text-mountain-mist-700 dark:text-mountain-mist-300'
                                }`}
                            >
                                <div className="font-medium text-sm">{model.name}</div>
                                {model.description && (
                                    <div className="text-xs text-mountain-mist-500 dark:text-mountain-mist-400 mt-1">
                                        {model.description}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay to close dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
} 
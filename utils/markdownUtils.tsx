
import React from 'react';

/**
 * A simple markdown-like renderer that converts basic syntax into React elements.
 * Supports:
 * - **bold**
 * - *italics*
 * - - list items
 * - [label](url)
 * - \n (line breaks)
 */
export const renderMarkdown = (
    text: string,
    options: {
        role?: 'user' | 'model',
        onLinkClick?: (url: string) => void,
        renderProductCard?: (productId: string, label: string) => React.ReactNode
    } = {}
) => {
    if (!text) return null;

    // Split by lines first to handle lists and paragraphs
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
        // Handle list items
        if (line.trim().startsWith('- ')) {
            return (
                <li key={lineIdx} className="ml-4 rtl:mr-4 rtl:ml-0 list-disc mb-1">
                    {renderInlineMarkdown(line.trim().substring(2), options)}
                </li>
            );
        }

        // Handle empty lines as spacing
        if (!line.trim()) {
            return <div key={lineIdx} className="h-2" />;
        }

        // Regular paragraph
        return (
            <p key={lineIdx} className="mb-2 last:mb-0">
                {renderInlineMarkdown(line, options)}
            </p>
        );
    });
};

const renderInlineMarkdown = (
    text: string,
    options: {
        role?: 'user' | 'model',
        onLinkClick?: (url: string) => void,
        renderProductCard?: (productId: string, label: string) => React.ReactNode
    }
) => {
    // Regex for bold, italics, and links
    // Order matters: links first, then bold, then italics
    const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return parts.map((part, i) => {
        // Link: [label](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            const [_, label, url] = linkMatch;

            // Special handling for product links if a renderer is provided
            if (url.startsWith('/product/') && options.renderProductCard) {
                const productId = url.split('/').pop() || '';
                return options.renderProductCard(productId, label);
            }

            return (
                <button
                    key={i}
                    onClick={() => options.onLinkClick?.(url)}
                    className={`inline-flex items-center gap-1 underline font-bold mx-0.5 hover:opacity-80 transition-opacity ${options.role === 'user'
                            ? 'text-white decoration-white'
                            : 'text-purple-600 dark:text-purple-400 decoration-purple-600 dark:decoration-purple-400'
                        }`}
                >
                    {label}
                </button>
            );
        }

        // Bold: **text**
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }

        // Italics: *text*
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }

        return part;
    });
};


/**
 * Optimizes a Supabase Storage URL for mobile/web performance.
 * Appends transformation parameters to resize and compress the image.
 * 
 * @param url The original image URL
 * @param width The desired width (default: 800)
 * @param quality The quality (0-100, default: 80)
 * @returns The optimized URL
 */
export const optimizeImage = (url: string, width: number = 800, quality: number = 80): string => {
    if (!url) return '';

    // Optimization: Return base64 images immediately
    if (url.startsWith('data:')) return url;

    // Check if it's a Supabase URL
    if (url.includes('supabase.co/storage/v1/object/public')) {
        // If it already has query params, append, otherwise start query
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
    }

    return url;
};

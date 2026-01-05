
/**
 * Utility functions for search optimization.
 */

// Synonym map for tag generation
const SYNONYMS: Record<string, string[]> = {
    // Brands
    'realme': ['ريلمي', 'رلمي', 'real me'],
    'iphone': ['ايفون', 'أيفون', 'آيفون', 'apple', 'ابل', 'أبل'],
    'samsung': ['سامسونج', 'سامسونغ', 'galaxy', 'جالكسي', 'غالاكسي'],
    'xiaomi': ['شاومي', 'mi', 'redmi', 'ريدمي'],
    'honor': ['هونر', 'honor', 'huawei', 'هواوي'],
    'infinix': ['انفينكس', 'إنفينكس'],
    'tecno': ['تكنو', 'تيكنو'],
    'vivo': ['فيفو'],
    'oppo': ['اوبو', 'أوبو'],

    // Product Types
    'case': ['كفر', 'غطاء', 'حافظة', 'جراب'],
    'screen': ['شاشة', 'لصقة', 'حماية'],
    'charger': ['شاحن', 'كيبل', 'واير'],
    'headphone': ['سماعة', 'هيدفون'],
    'watch': ['ساعة', 'smart watch'],
};

/**
 * Expands a search query by adding synonyms.
 * @param query The original search query.
 * @returns An array of search terms including synonyms.
 */
export const expandSearchQuery = (query: string): string[] => {
    if (!query) return [];

    const lowerQuery = query.toLowerCase().trim();
    const terms = new Set<string>([lowerQuery]);

    // Check for direct matches in synonyms
    Object.entries(SYNONYMS).forEach(([key, values]) => {
        // If query matches the key (e.g., "realme")
        if (key === lowerQuery || lowerQuery.includes(key)) {
            values.forEach(v => terms.add(v));
        }

        // If query matches one of the values (e.g., "ريلمي")
        if (values.some(v => v === lowerQuery || lowerQuery.includes(v))) {
            terms.add(key);
            values.forEach(v => terms.add(v));
        }
    });

    return Array.from(terms);
};

/**
 * Calculates the Levenshtein distance between two strings.
 */
export const levenshteinDistance = (a: string, b: string): number => {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Checks if a text fuzzily matches a query.
 */
export const fuzzyMatch = (text: string, query: string, threshold = 2): boolean => {
    if (!text || !query) return false;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText.includes(lowerQuery)) return true;

    // Split text into words and check distance for each word
    const words = lowerText.split(/\s+/);
    return words.some(word => levenshteinDistance(word, lowerQuery) <= threshold);
};


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

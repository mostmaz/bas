import { Product } from '../types';

export const normalizeColor = (col: string): string | null => {
    if (!col || typeof col !== 'string') return null;
    const trimmed = col.trim();
    if (/^#([0-9A-F]{3}){1,2}$/i.test(trimmed)) return trimmed;
    if (/^[a-zA-Z]+$/.test(trimmed) && trimmed.length > 2) return trimmed;
    return null;
};

export const extractProductColors = (product: Product): string[] => {
    const normalize = normalizeColor;

    // 1. Extract from variants (New System)
    const variantColors = product.variants ? product.variants.map(v => normalize(v.color)).filter(Boolean) : [];

    // 2. Extract from colors array (Legacy System)
    let legacyColors: (string | null)[] = [];
    const pColors = product.colors;

    if (typeof pColors === 'string') {
        try {
            const parsed = JSON.parse(pColors);
            if (Array.isArray(parsed)) legacyColors = parsed.map(normalize);
            else legacyColors = [normalize(parsed)];
        } catch {
            legacyColors = [normalize(pColors)];
        }
    } else if (Array.isArray(pColors)) {
        legacyColors = pColors.flat().map(item => {
            if (typeof item === 'string') {
                if (item.startsWith('[') || item.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(item);
                        if (Array.isArray(parsed)) return parsed.map(normalize);
                        return [normalize(parsed)];
                    } catch { return [normalize(item)]; }
                }
                return [normalize(item)];
            }
            return [];
        }).flat();
    }

    // Cast to string[] after filtering Boolean which ensures no nulls/undefined
    return [...variantColors, ...legacyColors].filter(Boolean) as string[];
};

export const matchesColorFilter = (product: Product, selectedColors: string[]): boolean => {
    if (selectedColors.length === 0) return true;

    const extractedColors = extractProductColors(product);

    return selectedColors.some(filterColor =>
        extractedColors.some(c => c.toLowerCase() === filterColor.toLowerCase())
    );
};

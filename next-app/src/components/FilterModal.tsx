import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useShop } from '@/context/ShopContext';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters: FilterState;
}

export interface FilterState {
    priceRange: [number, number];
    selectedColors: string[];
    selectedBrands: string[];
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, initialFilters }) => {
    const { brands, products } = useShop();
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    // Sync internal state with props when they change (e.g. reset from parent)
    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    // Extract unique colors from products with strict validation
    const availableColors = useMemo(() => {
        return Array.from(new Set(products.flatMap(p => {
            let c = p.colors;
            const normalize = (col: string) => {
                if (!col || typeof col !== 'string') return null;
                const trimmed = col.trim();
                // Check for hex code (3, 6, or 8 digits)
                if (/^#([0-9A-F]{3}){1,2}$/i.test(trimmed)) return trimmed;
                // Check for valid color name (simple check: alphabetic, > 2 chars)
                if (/^[a-zA-Z]+$/.test(trimmed) && trimmed.length > 2) return trimmed;
                return null;
            };

            if (typeof c === 'string') {
                try {
                    const parsed = JSON.parse(c);
                    if (Array.isArray(parsed)) return parsed.map(normalize).filter(Boolean);
                    return [normalize(parsed)].filter(Boolean);
                } catch {
                    return [normalize(c)].filter(Boolean);
                }
            }
            if (Array.isArray(c)) {
                return c.flat().map(item => {
                    if (typeof item === 'string') {
                        if (item.startsWith('[') || item.startsWith('{')) {
                            try {
                                const parsed = JSON.parse(item);
                                if (Array.isArray(parsed)) return parsed.map(normalize).filter(Boolean);
                                return [normalize(parsed)].filter(Boolean);
                            } catch { return [normalize(item)].filter(Boolean); }
                        }
                        return [normalize(item)].filter(Boolean);
                    }
                    return [];
                }).flat();
            }
            return [];
        }).flat())).filter(Boolean) as string[];
    }, [products]);

    if (!isOpen) return null;

    const handleBrandToggle = (brandName: string) => {
        setFilters(prev => ({
            ...prev,
            selectedBrands: prev.selectedBrands.includes(brandName)
                ? prev.selectedBrands.filter(b => b !== brandName)
                : [...prev.selectedBrands, brandName]
        }));
    };

    const handleColorToggle = (color: string) => {
        setFilters(prev => ({
            ...prev,
            selectedColors: prev.selectedColors.includes(color)
                ? prev.selectedColors.filter(c => c !== color)
                : [...prev.selectedColors, color]
        }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-900 w-full sm:w-[400px] sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Filters</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Price Range */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Price Range</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 mb-1 block">Min Price</label>
                                <input
                                    type="number"
                                    value={filters.priceRange[0]}
                                    onChange={(e) => setFilters({ ...filters, priceRange: [Number(e.target.value), filters.priceRange[1]] })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 mb-1 block">Max Price</label>
                                <input
                                    type="number"
                                    value={filters.priceRange[1]}
                                    onChange={(e) => setFilters({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brands */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Brands</h3>
                        <div className="flex flex-wrap gap-2">
                            {brands.map(brand => (
                                <button
                                    key={brand.id}
                                    onClick={() => handleBrandToggle(brand.name)}
                                    className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all border ${filters.selectedBrands.includes(brand.name)
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md border-transparent'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {brand.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Colors */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Colors</h3>
                        <div className="flex flex-wrap gap-3">
                            {availableColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => handleColorToggle(color)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${filters.selectedColors.includes(color) ? 'ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-slate-900' : ''
                                        }`}
                                    style={{ backgroundColor: color, border: '1px solid rgba(0,0,0,0.1)' }}
                                >
                                    {filters.selectedColors.includes(color) && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button
                        onClick={() => setFilters({ priceRange: [0, 1000000], selectedColors: [], selectedBrands: [] })}
                        className="flex-1 py-3.5 rounded-2xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => onApply(filters)}
                        className="flex-[2] py-3.5 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/30 hover:bg-purple-700 active:scale-95 transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

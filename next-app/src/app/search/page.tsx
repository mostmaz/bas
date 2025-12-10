'use client';

import React, { useMemo, useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { ProductCard } from '@/components/ProductCard';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SEARCH_MAPPINGS: Record<string, string[]> = {
    'samsung': ['سامسونج', 'جالكسي', 'galaxy'],
    'سامسونج': ['samsung', 'galaxy', 'جالكسي'],
    'iphone': ['ايفون', 'آيفون', 'apple', 'ابل'],
    'ايفون': ['iphone', 'apple', 'ابل'],
    'آيفون': ['iphone', 'apple', 'ابل'],
    'realme': ['ريلمي'],
    'ريلمي': ['realme'],
    'xiaomi': ['شاومي', 'redmi', 'ريدمي'],
    'شاومي': ['xiaomi', 'redmi', 'ريدمي'],
    'huawei': ['هواوي'],
    'هواوي': ['huawei'],
    'honor': ['هونر'],
    'هونر': ['honor'],
    'infinix': ['انفينكس'],
    'انفينكس': ['infinix'],
    'tecno': ['تكنو'],
    'تكنو': ['tecno'],
    'oppo': ['اوبو'],
    'اوبو': ['oppo'],
    'vivo': ['فيفو'],
    'فيفو': ['vivo'],
    'cover': ['كفر', 'حافظة', 'غلاف', 'case'],
    'كفر': ['cover', 'case'],
    'case': ['كفر', 'حافظة'],
    'screen': ['شاشة', 'حماية'],
    'شاشة': ['screen', 'protector'],
};

const getSearchTermsGroups = (query: string): string[][] => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    const words = lowerQuery.split(/\s+/);
    return words.map(word => {
        const group = new Set<string>();
        group.add(word);
        if (SEARCH_MAPPINGS[word]) {
            SEARCH_MAPPINGS[word].forEach(v => group.add(v));
        }
        return Array.from(group);
    });
};

export default function SearchPage() {
    const { products, t, searchQuery, setSearchQuery } = useShop();
    const router = useRouter();
    const [localInput, setLocalInput] = useState(searchQuery);

    // Sync local input with context
    React.useEffect(() => {
        setLocalInput(searchQuery);
    }, [searchQuery]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalInput(val);
        setSearchQuery(val);
    };

    const clearSearch = () => {
        setLocalInput('');
        setSearchQuery('');
    };

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const termGroups = getSearchTermsGroups(searchQuery);

        return products.filter(p => {
            // Product must match ALL term groups (AND logic)
            return termGroups.every(group => {
                // For this group, product must match AT LEAST ONE term (OR logic within synonyms)
                return group.some(term =>
                    p.name.toLowerCase().includes(term) ||
                    p.description.toLowerCase().includes(term) ||
                    p.category.toLowerCase().includes(term) ||
                    p.brand.toLowerCase().includes(term) ||
                    p.device.toLowerCase().includes(term) ||
                    p.tags?.some(tag => tag.toLowerCase().includes(term))
                );
            });
        });
    }, [products, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('search')}</h1>

                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-4 rtl:pr-4 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 rtl:pr-11 rtl:pl-4 pr-10 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-lg transition-all"
                            placeholder={t('searchPlaceholder')}
                            value={localInput}
                            onChange={handleSearchChange}
                            autoFocus
                        />
                        {localInput && (
                            <button
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-4 rtl:pl-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                {searchQuery.trim() ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                                {t('results')}: <span className="text-purple-600 font-bold">"{searchQuery}"</span>
                            </h2>
                            <span className="text-sm text-slate-500">{filteredProducts.length} {t('items')}</span>
                        </div>

                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4">
                                    <Filter className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('noMatches')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">{t('tryCheckingPhone')}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <SearchIcon className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-lg text-slate-500 dark:text-slate-400">{t('searchPlaceholder')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

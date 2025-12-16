'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Smartphone, Tag, Filter, ChevronDown } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { FilterModal, FilterState } from '@/components/FilterModal';

function FilteredProductsContent() {
    const { products, isProductsLoading, language, t, devices } = useShop();
    const searchParams = useSearchParams();
    const router = useRouter();

    const brandFilter = searchParams.get('brand');
    const deviceFilter = searchParams.get('device');

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(deviceFilter || '');

    // Initialize filters
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [0, 1000000],
        selectedColors: [],
        selectedBrands: []
    });

    // Sync state with URL params
    useEffect(() => {
        setSelectedDevice(deviceFilter || '');
    }, [deviceFilter]);

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            selectedBrands: brandFilter ? [brandFilter] : []
        }));
    }, [brandFilter]);

    const isRTL = language === 'ar';

    const handleFilterApply = (newFilters: FilterState) => {
        setFilters(newFilters);
        setIsFilterOpen(false);

        // Reset device selector if brands are selected in the filter
        if (newFilters.selectedBrands.length > 0) {
            setSelectedDevice('');
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('device');
            newParams.delete('brand');
            router.push(`/filtered-products?${newParams.toString()}`);
        }
    };

    const handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const device = e.target.value;
        setSelectedDevice(device);
        const newParams = new URLSearchParams(searchParams.toString());

        if (device) {
            newParams.set('device', device);
            // Reset brand filters when selecting a device
            setFilters(prev => ({ ...prev, selectedBrands: [] }));
        } else {
            newParams.delete('device');
        }

        // Clear brand filter from URL when selecting a device to avoid conflicts
        newParams.delete('brand');
        router.push(`/filtered-products?${newParams.toString()}`);
    };

    // Optimization: Pre-calculate normalized colors to avoid expensive parsing on every filter change
    const processedProducts = useMemo(() => {
        if (!products) return [];
        return products.map(product => {
            const pColors = product.colors;
            const normalize = (col: string) => {
                if (!col || typeof col !== 'string') return null;
                const trimmed = col.trim();
                if (/^#([0-9A-F]{3}){1,2}$/i.test(trimmed)) return trimmed;
                if (/^[a-zA-Z]+$/.test(trimmed) && trimmed.length > 2) return trimmed;
                return null;
            };

            let extractedColors: string[] = [];
            if (typeof pColors === 'string') {
                try {
                    const parsed = JSON.parse(pColors);
                    if (Array.isArray(parsed)) extractedColors = parsed.map(normalize).filter(Boolean) as string[];
                    else extractedColors = [normalize(parsed)].filter(Boolean) as string[];
                } catch {
                    extractedColors = [normalize(pColors)].filter(Boolean) as string[];
                }
            } else if (Array.isArray(pColors)) {
                extractedColors = pColors.flat().map(item => {
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
                }).flat() as string[];
            }

            return { ...product, _normalizedColors: extractedColors };
        });
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!processedProducts) return [];
        return processedProducts.filter(product => {
            // Device Filter
            const matchesDevice = !selectedDevice || (product.device && product.device.toLowerCase() === selectedDevice.toLowerCase());

            // Advanced Filters (including Brand)
            const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
            const matchesBrand = filters.selectedBrands.length === 0 || filters.selectedBrands.some(b => b.toLowerCase() === (product.brand || '').toLowerCase());

            // Optimized Color Filter using pre-calculated values
            const matchesColor = filters.selectedColors.length === 0 ||
                filters.selectedColors.some(filterColor =>
                    product._normalizedColors.some(c => c.toLowerCase() === filterColor.toLowerCase())
                );

            return matchesDevice && matchesPrice && matchesBrand && matchesColor;
        });
    }, [processedProducts, selectedDevice, filters]);

    const title = brandFilter ? `${brandFilter} Products` : selectedDevice ? `${selectedDevice} Products` : 'Products';

    return (
        <div className="min-h-screen pt-4 pb-24 px-4 bg-white dark:bg-slate-950 transition-colors">
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleFilterApply}
                initialFilters={filters}
            />

            {/* Header */}
            <div className="sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-30 pb-4 pt-2 -mx-4 px-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        {isRTL ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize truncate">
                        {title}
                    </h1>
                </div>

                {/* Filter Controls */}
                <div className="flex gap-3">
                    {/* Device Selector Dropdown */}
                    <div className="flex-1 relative">
                        <select
                            value={selectedDevice}
                            onChange={handleDeviceSelect}
                            className="w-full appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-4 px-6 rounded-2xl shadow-sm border-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-base font-medium cursor-pointer transition-all pr-10 rtl:pl-10 rtl:pr-6"
                        >
                            <option value="">{t('selectDevice')}</option>
                            {devices.map(device => (
                                <option key={device.id} value={device.name}>{device.name}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 rtl:left-4 rtl:right-auto flex items-center pointer-events-none text-slate-400">
                            <ChevronDown className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="bg-purple-600 text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:bg-purple-700 active:scale-95 transition-all relative shrink-0"
                    >
                        <Filter className="h-6 w-6" />
                        {(filters.selectedBrands.length > 0 || filters.selectedColors.length > 0 || filters.priceRange[0] > 0) && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-purple-600 rounded-full"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            {isProductsLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    {selectedDevice ? (
                        <Smartphone className="h-16 w-16 mb-4 text-slate-300" />
                    ) : (
                        <Tag className="h-16 w-16 mb-4 text-slate-300" />
                    )}
                    <p className="text-slate-500 text-lg font-medium">{t('noMatches')}</p>
                </div>
            )}
        </div>
    );
}

export default function FilteredProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>}>
            <FilteredProductsContent />
        </Suspense>
    );
}

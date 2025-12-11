
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Smartphone, Tag, Filter, ChevronDown } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { FilterModal, FilterState } from '../components/FilterModal';

export const FilteredProductsPage: React.FC = () => {
    const { products, isProductsLoading, language, t, devices } = useShop();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const brandFilter = queryParams.get('brand');
    const deviceFilter = queryParams.get('device');

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(deviceFilter || '');
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [0, 1000000],
        selectedColors: [],
        selectedBrands: []
    });

    useEffect(() => {
        if (deviceFilter) {
            setSelectedDevice(deviceFilter);
        }
    }, [deviceFilter]);

    const isRTL = language === 'ar';

    const handleFilterApply = (newFilters: FilterState) => {
        setFilters(newFilters);
        setIsFilterOpen(false);
    };

    const handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const device = e.target.value;
        setSelectedDevice(device);
        // Update URL to reflect change, or just keep local state?
        // If we update URL, it might reload page or just push state.
        // Let's update URL for consistency so sharing link works.
        const newParams = new URLSearchParams(location.search);
        if (device) {
            newParams.set('device', device);
        } else {
            newParams.delete('device');
        }
        navigate({ search: newParams.toString() });
    };

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(product => {
            // Base filters from URL/State
            const matchesBrand = !brandFilter || (product.brand && product.brand.toLowerCase() === brandFilter.toLowerCase());
            const matchesDevice = !selectedDevice || (product.device && product.device.toLowerCase() === selectedDevice.toLowerCase());

            // Advanced Filters
            const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
            // If specific brand is selected in URL, ignore advanced brand filter or AND it?
            // Usually advanced filter overrides or adds to it.
            // If URL has brand, we probably shouldn't allow selecting other brands in advanced filter effectively, 
            // OR we treat URL brand as the "context" and advanced filters as refinement.
            // Let's say if URL brand is set, we ignore advanced brand filter unless it's empty.
            // Actually, if user selects brands in filter, they might want to see those instead or in addition.
            // But for simplicity, let's say URL brand is the primary scope.
            const matchesAdvancedBrand = filters.selectedBrands.length === 0 || filters.selectedBrands.some(b => b.toLowerCase() === (product.brand || '').toLowerCase());

            // Safe Color Filter (copied from Home.tsx)
            const matchesColor = filters.selectedColors.length === 0 || (product.colors && (function () {
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

                return filters.selectedColors.some(filterColor =>
                    extractedColors.some(c => c.toLowerCase() === filterColor.toLowerCase())
                );
            })());

            return matchesBrand && matchesDevice && matchesPrice && matchesAdvancedBrand && matchesColor;
        });
    }, [products, brandFilter, selectedDevice, filters]);

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
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        {isRTL ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize truncate">
                        {title}
                    </h1>
                </div>

                {/* Filter Controls */}
                <div className="flex gap-4">
                    {/* Device Selector Dropdown */}
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Smartphone className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        </div>
                        <div className="relative">
                            <select
                                value={selectedDevice}
                                onChange={handleDeviceSelect}
                                className="block w-full pl-11 pr-10 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
                            >
                                <option value="">{t('selectDevice')}</option>
                                {devices.map(device => (
                                    <option key={device.id} value={device.name}>{device.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 hover:bg-purple-700 active:scale-95 transition-all relative"
                    >
                        <Filter className="h-6 w-6" />
                        {(filters.selectedBrands.length > 0 || filters.selectedColors.length > 0 || filters.priceRange[0] > 0) && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-purple-600 rounded-full"></span>
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
};

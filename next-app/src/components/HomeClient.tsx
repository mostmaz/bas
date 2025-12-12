'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { OffersCarousel } from '@/components/OffersCarousel';
import { LazySection } from '@/components/LazySection';
import { Filter, ChevronDown, LayoutGrid, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { Brand, Product, Order } from '@/types';
import { useRouter } from 'next/navigation';
import { FilterModal, FilterState } from '@/components/FilterModal';

interface HomeClientProps {
    initialProducts: Product[];
    initialOrders: Order[];
    initialBrands: Brand[];
}

export const HomeClient: React.FC<HomeClientProps> = ({
    initialProducts,
    initialOrders,
    initialBrands
}) => {
    // Use context for actions and loading states, but prefer initial data for display if available
    const { products: contextProducts, brands: contextBrands, t, isAppLoading, isProductsLoading, orders: contextOrders } = useShop();
    const router = useRouter();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Use initial data if available (SSR/SSG), otherwise fallback to context (Client-side fetch)
    // We prioritize context data if it's populated and different, but initial render uses props
    const products = contextProducts.length > 0 ? contextProducts : initialProducts;
    const orders = contextOrders.length > 0 ? contextOrders : initialOrders;
    const brands = contextBrands.length > 0 ? contextBrands : initialBrands;

    // We keep local state for the filter modal, but applying it navigates away
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [0, 1000000],
        selectedColors: [],
        selectedBrands: []
    });

    const handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const device = e.target.value;
        if (device && device !== 'All') {
            router.push(`/filtered-products?device=${encodeURIComponent(device)}`);
        }
    };

    const handleBrandSelect = (brandName: string) => {
        if (brandName !== 'All') {
            router.push(`/filtered-products?brand=${encodeURIComponent(brandName)}`);
        }
    };

    const handleFilterApply = (newFilters: FilterState) => {
        setFilters(newFilters);
        setIsFilterOpen(false);
        router.push('/filtered-products');
    };

    // Latest Products (Last 8 items)
    const latestProducts = useMemo(() => {
        return [...products].reverse().slice(0, 8);
    }, [products]);

    // Best Sellers (Calculated by number of sales from orders)
    const bestSellers = useMemo(() => {
        const salesCount: Record<string, number> = {};

        // Calculate sales per product
        orders.forEach(order => {
            order.items.forEach(item => {
                salesCount[item.id] = (salesCount[item.id] || 0) + item.quantity;
            });
        });

        // Sort products by sales count descending
        return [...products]
            .sort((a, b) => {
                const salesA = salesCount[a.id] || 0;
                const salesB = salesCount[b.id] || 0;
                // If sales are equal, fallback to rating
                if (salesB === salesA) return b.rating - a.rating;
                return salesB - salesA;
            })
            .slice(0, 8);
    }, [products, orders]);

    const getBrandImage = (brand: Brand | 'All') => {
        if (brand === 'All') return ''; // Handled by icon now
        return brand.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=random&color=fff&size=200`;
    };

    const displayBrands = useMemo(() => {
        return ['All', ...brands];
    }, [brands]);

    // Unique devices for dropdown
    const uniqueDevices = useMemo(() => {
        const devSet = new Set(products.map(p => p.device).filter(Boolean));
        return Array.from(devSet).sort();
    }, [products]);

    return (
        <div className="min-h-screen pb-24">
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleFilterApply}
                initialFilters={filters}
            />

            {/* Device Selection Bar & Filter Button */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-8">
                <div className="flex gap-3">
                    {/* Device Selector */}
                    <div className="flex-1 relative">
                        <select
                            onChange={handleDeviceSelect}
                            className="w-full appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-4 px-6 rounded-2xl shadow-sm border-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-base font-medium cursor-pointer transition-all pr-10 rtl:pl-10 rtl:pr-6"
                            defaultValue=""
                        >
                            <option value="">{t('selectDevice')}</option>
                            {uniqueDevices.map((device) => (
                                <option key={device} value={device}>{device}</option>
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
                        {(filters.selectedBrands.length > 0 || filters.selectedColors.length > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-purple-600 rounded-full"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Offers Carousel */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <OffersCarousel />
            </div>

            {/* Brand Filter */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {displayBrands.map((brand, index) => {
                        const isAll = typeof brand === 'string';
                        const brandName = isAll ? t('viewAll') : brand.name;
                        const key = isAll ? 'all' : brand.id;

                        return (
                            <button
                                key={key}
                                onClick={() => handleBrandSelect(isAll ? 'All' : (brand as Brand).name)}
                                className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border transition-all whitespace-nowrap bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500`}
                            >
                                <div className={`h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
                                    {isAll ? (
                                        <LayoutGrid className="h-4 w-4" />
                                    ) : (
                                        <img
                                            src={getBrandImage(brand as Brand)}
                                            alt={brandName}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <span className="text-sm font-bold">{brandName}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20 space-y-16">

                {/* Best Sellers Section - Lazy Loaded */}
                {bestSellers.length > 0 && (
                    <LazySection>
                        <section>
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="h-6 w-6 text-amber-500" />
                                    {t('popular')}
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                        {t('trending')}
                                    </span>
                                </h2>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                                {bestSellers.map((product) => (
                                    <div key={product.id} className="min-w-[180px] w-[180px] sm:w-[220px]">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </LazySection>
                )}

                {/* Latest Products Section - Lazy Loaded */}
                {latestProducts.length > 0 && (
                    <LazySection>
                        <section>
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="h-6 w-6 text-purple-600" />
                                    {t('latestDrops')}
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                        {t('new')}
                                    </span>
                                </h2>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                                {latestProducts.map((product) => (
                                    <div key={product.id} className="min-w-[180px] w-[180px] sm:w-[220px]">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </LazySection>
                )}

            </div>
        </div>
    );
}

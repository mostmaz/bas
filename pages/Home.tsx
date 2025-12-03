
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { OffersCarousel } from '../components/OffersCarousel';
import { Filter, ChevronDown, Smartphone, Layers, LayoutGrid, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { Brand } from '../types';

export const Home: React.FC = () => {
  const { products, brands, t, searchQuery, orders, isAppLoading } = useShop();
  const [selectedDevice, setSelectedDevice] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');

  // Lazy Loading State
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Dynamically extract unique devices from products
  const uniqueDevices = useMemo(() => {
    const devices = new Set(products.map(p => p.device).filter(Boolean));
    const sortedDevices = Array.from(devices).sort();
    return ['All', ...sortedDevices];
  }, [products]);

  // Helper to check if any filter is active
  const isFiltered = useMemo(() => {
    return searchQuery !== '' || selectedDevice !== 'All' || selectedBrand !== 'All';
  }, [searchQuery, selectedDevice, selectedBrand]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedDevice, selectedBrand, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchDevice = selectedDevice === 'All' || p.device === selectedDevice;
      const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;

      const lowerQuery = searchQuery.toLowerCase();
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery);

      return matchDevice && matchBrand && matchSearch;
    });
  }, [products, selectedDevice, selectedBrand, searchQuery]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!isFiltered) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [filteredProducts, isFiltered, visibleCount]);

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

  return (
    <div className="min-h-screen">

      {/* Offers Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <OffersCarousel />
      </div>

      {/* Device Selection Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-8">
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-lg border border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-colors">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('selectDevice')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('deviceSubtitle')}</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white py-2 pl-4 pr-10 rtl:pl-10 rtl:pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm font-medium cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-inner"
            >
              {uniqueDevices.map((device) => (
                <option key={device} value={device}>{device}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center px-3 pointer-events-none text-slate-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Brand Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            {t('shopByBrand')}
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {displayBrands.map((brand, index) => {
            const isAll = typeof brand === 'string';
            const isSelected = selectedBrand === (isAll ? 'All' : brand.name);
            const brandName = isAll ? t('viewAll') : brand.name;
            const key = isAll ? 'all' : brand.id;

            return (
              <button
                key={key}
                onClick={() => setSelectedBrand(isAll ? 'All' : (brand as Brand).name)}
                className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border transition-all whitespace-nowrap ${isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg shadow-slate-200/50 dark:shadow-none scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500'
                  }`}
              >
                <div className={`h-8 w-8 rounded-full overflow-hidden flex items-center justify-center ${isSelected ? 'bg-white/20 ring-1 ring-white/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20">
        {isFiltered ? (
          // --- FILTERED RESULTS VIEW ---
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {searchQuery ? `${t('search')}: "${searchQuery}"` : t('filteredResults')}
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{filteredProducts.length} {t('items')}</span>
            </div>

            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Sentinel for Lazy Loading */}
                {visibleCount < filteredProducts.length && (
                  <div ref={loadMoreRef} className="flex justify-center py-8 w-full">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                  <Filter className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{t('noProducts')}</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{t('noProducts')}</p>
                <button
                  onClick={() => { setSelectedDevice('All'); setSelectedBrand('All'); }}
                  className="mt-6 text-purple-600 dark:text-purple-400 font-medium hover:underline"
                >
                  {t('clearFilters')}
                </button>
              </div>
            )}
          </div>
        ) : (
          // --- DEFAULT VIEW (Latest & Best Sellers) ---
          <div className="space-y-16 animate-in fade-in duration-500">

            {/* Latest Products Section */}
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
                {isAppLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))
                ) : (
                  latestProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </section>

            {/* Best Sellers Section */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                  {t('bestSellers')}
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    {t('trending')}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
                {bestSellers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

          </div>
        )}
      </div>

    </div>
  );
};

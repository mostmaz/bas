import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { FilterModal, FilterState } from '../components/FilterModal';
import { OffersCarousel } from '../components/OffersCarousel';
import { OverlayNotification } from '../components/OverlayNotification';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, Smartphone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { useProductFiltering } from '../hooks/useProductFiltering';
import { shuffleArray } from '../utils/arrayUtils';

export const Home: React.FC = () => {
  const { products, devices, brands, isProductsLoading, t, notificationMessage, isBrandsLoading, supabase } = useShop();
  const navigate = useNavigate();
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000000],
    selectedColors: [],
    selectedBrands: []
  });

  const handleBrandSelect = (brandName: string) => {
    if (brandName === 'All') {
      setSelectedBrandFilter('All');
    } else {
      navigate(`/filtered-products?brand=${encodeURIComponent(brandName)}`);
    }
  };

  const handleDeviceSelect = (deviceName: string) => {
    if (deviceName) {
      // Track Device Selection
      if (window.fbq) {
        window.fbq('track', 'Search', {
          search_string: deviceName,
          content_type: 'device'
        });
      }

      // Track Device Selection (Database)
      // Fire and forget - don't await to avoid blocking navigation
      // @ts-ignore
      supabase.rpc('track_visitor_device', { device_name_input: deviceName });

      navigate(`/filtered-products?device=${encodeURIComponent(deviceName)}`);
      setSelectedDevice('');
    }
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterOpen(false);

    // Navigate to filtered products page with the selected filters
    navigate('/filtered-products', { state: { initialFilters: newFilters } });

    // Reset top-bar brand filter when applying advanced filters (though we are navigating away)
    setSelectedBrandFilter('All');
  };

  const displayBrands = [
    { id: 'all', name: "All" },
    ...brands
  ];

  const filteredProducts = useProductFiltering({
    products,
    selectedBrandFilter,
    selectedDevice,
    filters
  });

  const bestSellers = useMemo(() => {
    return [...filteredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  }, [filteredProducts]);

  const latestProducts = useMemo(() => {
    // Shuffle ALL filtered products first, then take 6
    // This ensures a random selection from the entire catalog is shown as "Latest Drop"
    return shuffleArray([...filteredProducts]).slice(0, 6);
  }, [filteredProducts]);

  const popularProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => (b.daily_views || 0) - (a.daily_views || 0)).slice(0, 6);
  }, [filteredProducts]);

  return (
    <div className="pb-24">
      <OverlayNotification />
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleFilterApply}
        initialFilters={filters}
      />

      <Helmet>
        <title>BasCavarat | Premium Mobile Accessories</title>
        <meta name="description" content="Discover premium mobile accessories, cases, and gadgets at BasCavarat." />
      </Helmet>

      {/* Search & Filter Section */}
      <div className="px-6 mt-6 flex gap-4">
        {/* Device Selector Dropdown */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <Smartphone className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
              className="block w-full text-left pl-11 pr-10 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all cursor-pointer"
            >
              {selectedDevice || t('selectDevice')}
            </button>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isDeviceDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isDeviceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDeviceDropdownOpen(false)}
                ></div>
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => { handleDeviceSelect(''); setIsDeviceDropdownOpen(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white font-medium"
                  >
                    {t('selectDevice')}
                  </button>

                  {Object.entries(
                    devices.reduce((acc, device) => {
                      // Find a product with this device to infer the brand
                      const product = products.find(p => p.device === device.name);
                      const brand = product?.brand || 'Other';

                      if (!acc[brand]) acc[brand] = [];
                      acc[brand].push(device);
                      return acc;
                    }, {} as Record<string, typeof devices>)
                  ).sort(([brandA], [brandB]) => brandA.localeCompare(brandB))
                    .map(([brand, brandDevices]) => (
                      <div key={brand}>
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0">
                          {brand}
                        </div>
                        {brandDevices
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(device => (
                            <button
                              key={device.id}
                              onClick={() => { handleDeviceSelect(device.name); setIsDeviceDropdownOpen(false); }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-700 pl-6 rtl:pr-6 rtl:pl-4"
                            >
                              {device.name}
                            </button>
                          ))}
                      </div>
                    ))}
                </div>
              </>
            )}
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

      {/* Banner */}
      <div className="px-6 mt-6">
        <OffersCarousel />
      </div>

      {/* Brands (formerly Categories) */}
      <div className="mt-8 px-6">
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {isBrandsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse flex-shrink-0" />
            ))
          ) : (
            displayBrands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandSelect(brand.name)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all flex-shrink-0 flex items-center gap-2 ${selectedBrandFilter === brand.name
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                {brand.logo && (
                  <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" width={20} height={20} />
                )}
                {brand.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Notification Bar */}
      {notificationMessage && (
        <div className="mt-4 px-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl py-1.5 px-3 text-center">
            <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200" dir="rtl">
              {notificationMessage}
            </p>
          </div>
        </div>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <div className="mt-8 px-6">
          <div className="flex items-center justify-end mb-4 relative">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white pr-4 border-r-4 border-purple-600 rounded-sm">
              {t('bestSellers')}
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {bestSellers.map((product, index) => (
              <div key={product.id} className="min-w-[160px] w-[160px] sm:w-[200px]">
                <ProductCard product={product} priority={index < 4} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Added Section */}
      {latestProducts.length > 0 && (
        <div className="mt-6 px-6">
          <div className="flex items-center justify-end mb-4 relative">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white pr-4 border-r-4 border-emerald-500 rounded-sm">
              {t('latestDrops')}
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {latestProducts.map(product => (
              <div key={product.id} className="min-w-[160px] w-[160px] sm:w-[200px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="mt-8 px-6">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white pr-4 border-r-4 border-indigo-600 rounded-sm">
            {t('popular')}
          </h3>
          <button className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 transition-colors">
            {t('viewAll')}
          </button>
        </div>

        {selectedDevice && filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Smartphone className="h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              {t('noDeviceMatch')}
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {isProductsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[160px] w-[160px] sm:w-[200px]">
                  <ProductSkeleton />
                </div>
              ))
            ) : (
              popularProducts.map(product => (
                <div key={product.id} className="min-w-[160px] w-[160px] sm:w-[200px]">
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

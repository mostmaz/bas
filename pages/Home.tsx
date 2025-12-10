import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { FilterModal, FilterState } from '../components/FilterModal';
import { OffersCarousel } from '../components/OffersCarousel';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, Smartphone } from 'lucide-react';

export const Home: React.FC = () => {
  const { products, devices, brands, isProductsLoading, t } = useShop();
  const navigate = useNavigate();
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000000],
    selectedColors: [],
    selectedBrands: []
  });

  const handleBrandSelect = (brandName: string) => {
    setSelectedBrandFilter(brandName);
    // Reset advanced filters when selecting a top-bar brand
    setFilters({
      priceRange: [0, 1000000],
      selectedColors: [],
      selectedBrands: []
    });
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterOpen(false);
    // Reset top-bar brand filter when applying advanced filters
    setSelectedBrandFilter('All');
  };

  const displayBrands = [
    { id: 'all', name: "All" },
    ...brands
  ];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      // Brand Filter (Top Bar)
      const matchesBrandFilter = selectedBrandFilter === 'All' || (product.brand && product.brand.toLowerCase() === selectedBrandFilter.toLowerCase());

      // Device Filter (from Dropdown)
      const matchesDevice = selectedDevice ? product.device === selectedDevice : true;

      // Advanced Filters
      const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      const matchesBrand = filters.selectedBrands.length === 0 || filters.selectedBrands.some(b => b.toLowerCase() === (product.brand || '').toLowerCase());

      // Safe Color Filter
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

      if (filters.selectedColors.length > 0 && !matchesColor) {
        // console.log(`Filtered out ${product.name} due to color. Product Colors:`, product.colors, "Selected:", filters.selectedColors);
      }

      return matchesBrandFilter && matchesDevice && matchesPrice && matchesBrand && matchesColor;
    });
  }, [products, selectedBrandFilter, selectedDevice, filters]);

  return (
    <div className="pb-24">
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleFilterApply}
        initialFilters={filters}
      />

      {/* Search & Filter Section */}
      <div className="px-6 mt-6 flex gap-4">
        {/* Device Selector Dropdown */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Smartphone className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
          </div>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="block w-full pl-11 pr-10 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all cursor-pointer"
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

      {/* Banner */}
      <div className="px-6 mt-6">
        <OffersCarousel />
      </div>

      {/* Brands (formerly Categories) */}
      <div className="mt-8 px-6">
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {displayBrands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleBrandSelect(brand.name)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all flex items-center gap-2 ${selectedBrandFilter === brand.name
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              {brand.logo && (
                <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" />
              )}
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="mt-4 px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('popular')}</h3>
          <button className="text-sm text-purple-600 dark:text-purple-400 font-medium">{t('viewAll')}</button>
        </div>

        {selectedDevice && filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Smartphone className="h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              {t('noDeviceMatch')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {isProductsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (
              filteredProducts.slice(0, 6).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

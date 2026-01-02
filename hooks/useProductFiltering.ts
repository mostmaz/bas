import { useMemo } from 'react';
import { Product } from '../types';
import { FilterState } from '../components/FilterModal';
import { matchesColorFilter } from '../utils/colorUtils';

interface UseProductFilteringProps {
    products: Product[];
    selectedBrandFilter: string;
    selectedDevice: string;
    filters: FilterState;
}

export const useProductFiltering = ({
    products,
    selectedBrandFilter,
    selectedDevice,
    filters
}: UseProductFilteringProps) => {
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
            const matchesColor = matchesColorFilter(product, filters.selectedColors);

            if (filters.selectedColors.length > 0 && !matchesColor) {
                // Debug log could go here
            }

            // Hidden Filter
            const isVisible = !product.isHidden;

            return matchesBrandFilter && matchesDevice && matchesPrice && matchesBrand && matchesColor && isVisible;
        });
    }, [products, selectedBrandFilter, selectedDevice, filters]);

    return filteredProducts;
};

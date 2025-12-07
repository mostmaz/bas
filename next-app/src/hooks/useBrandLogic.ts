import { useState } from 'react';
import { Brand } from '@/types';
import { INITIAL_BRANDS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export const useBrandLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, initialData?: Brand[]) => {
    const [brands, setBrands] = useState<Brand[]>(() => {
        if (initialData && initialData.length > 0) return initialData;
        return isSupabaseConfigured ? [] : INITIAL_BRANDS;
    });

    const refreshBrands = async () => {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from('brands').select('*');
                if (error) throw error;
                if (data) setBrands(data);
            } catch (error) {
                console.error("Error loading brands:", error);
            }
        }
    };

    const addBrand = async (name: string, logo?: string) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('brands').insert([{ name, logo }]);
            if (error) throw error;
            await refreshBrands();
            addToast('Brand added successfully', 'success');
        } else {
            const newBrand: Brand = { id: Date.now().toString(), name, logo };
            setBrands(prev => [...prev, newBrand]);
            addToast('Brand added locally (Demo)', 'success');
        }
    };

    const deleteBrand = async (id: string) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('brands').delete().eq('id', id);
            if (error) throw error;
            await refreshBrands();
            addToast('Brand deleted', 'success');
        } else {
            setBrands(prev => prev.filter(b => b.id !== id));
            addToast('Brand deleted locally (Demo)', 'success');
        }
    };

    return { brands, setBrands, refreshBrands, addBrand, deleteBrand };
};

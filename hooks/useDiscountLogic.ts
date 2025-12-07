import { useState } from 'react';
import { DiscountCode } from '../types';
import { INITIAL_DISCOUNTS } from '../constants';
import { supabase } from '../services/supabase';

// Helper for discounts mapping (Handles Postgres lowercase column names)
const mapDiscountFromDB = (d: any): DiscountCode => ({
    id: String(d.id),
    code: d.code,
    type: d.type,
    value: d.value,
    minOrderAmount: d.minorderamount !== undefined ? d.minorderamount : (d.minOrderAmount || 0),
    isActive: d.isactive !== undefined ? d.isactive : (d.isActive !== undefined ? d.isActive : true)
});

export const useDiscountLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) => {
    const [discounts, setDiscounts] = useState<DiscountCode[]>(INITIAL_DISCOUNTS);

    const refreshDiscounts = async () => {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from('discounts').select('*');
                if (error) throw error;
                if (data) setDiscounts(data.map(mapDiscountFromDB));
            } catch (error) {
                console.error("Error loading discounts:", error);
            }
        }
    };

    const addDiscount = async (discount: Omit<DiscountCode, 'id'>) => {
        if (isSupabaseConfigured) {
            const dbDiscount = {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                minOrderAmount: discount.minOrderAmount,
                isActive: discount.isActive
            };
            const { error } = await supabase.from('discounts').insert([dbDiscount]);
            if (error) throw error;
            await refreshDiscounts();
            addToast('Discount code added', 'success');
        } else {
            const newDiscount: DiscountCode = { ...discount, id: Date.now().toString() };
            setDiscounts(prev => [...prev, newDiscount]);
            addToast('Discount added locally (Demo)', 'success');
        }
    };

    const deleteDiscount = async (id: string) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('discounts').delete().eq('id', id);
            if (error) throw error;
            await refreshDiscounts();
            addToast('Discount code deleted', 'success');
        } else {
            setDiscounts(prev => prev.filter(d => d.id !== id));
            addToast('Discount deleted locally (Demo)', 'success');
        }
    };

    const toggleDiscountStatus = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('discounts').update({ isactive: newStatus }).eq('id', id);
            if (error) {
                console.error("Error toggling discount:", error);
                addToast('Failed to update status', 'error');
                return;
            }
            setDiscounts(prev => prev.map(d => d.id === id ? { ...d, isActive: newStatus } : d));
            addToast(`Discount ${newStatus ? 'activated' : 'deactivated'}`, 'success');
        } else {
            setDiscounts(prev => prev.map(d => d.id === id ? { ...d, isActive: newStatus } : d));
            addToast(`Discount ${newStatus ? 'activated' : 'deactivated'} (Local)`, 'success');
        }
    };

    return { discounts, setDiscounts, refreshDiscounts, addDiscount, deleteDiscount, toggleDiscountStatus };
};

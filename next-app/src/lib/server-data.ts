import { supabase } from '@/lib/supabase';
import { Product, Brand, CarouselSlide, Device } from '@/types';
import { unstable_cache } from 'next/cache';

// Helper to map Product from DB (reused logic from useProductLogic to ensure consistency)
const mapProductFromDB = (p: any): Product => {
    let images = p.images || (p.image ? [p.image] : []);
    let mainImage = p.image;
    if (images.length > 0 && (!mainImage || mainImage !== images[0])) {
        mainImage = images[0];
    }

    let variants = [];
    if (p.variants) {
        if (typeof p.variants === 'string') {
            try { variants = JSON.parse(p.variants); } catch (e) { console.error("Error parsing variants JSON", e); }
        } else if (Array.isArray(p.variants)) {
            variants = p.variants;
        }
    }

    return {
        ...p,
        image: mainImage,
        images: images,
        colors: p.colors || [],
        variants: variants,
        salePrice: p.sale_price || p.salePrice || undefined,
        sku: p.sku || undefined,
        tags: p.tags || []
    };
};

// Fetch products with caching
export const getCachedProducts = unstable_cache(
    async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Server Fetch Error (Products):", error);
            return [];
        }

        return data ? data.map(mapProductFromDB) : [];
    },
    ['products-cache'],
    { revalidate: 3600, tags: ['products'] }
);

export const getCachedBrands = unstable_cache(
    async () => {
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error("Server Fetch Error (Brands):", error);
            return [];
        }
        return data as Brand[];
    },
    ['brands-cache'],
    { revalidate: 3600, tags: ['brands'] }
);

export const getCachedSlides = unstable_cache(
    async () => {
        const { data, error } = await supabase
            .from('slides')
            .select('*');

        if (error) {
            console.error("Server Fetch Error (Slides):", error);
            return [];
        }
        return data as CarouselSlide[];
    },
    ['slides-cache'],
    { revalidate: 3600, tags: ['slides'] }
);

export const getCachedDevices = unstable_cache(
    async () => {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error("Server Fetch Error (Devices):", error);
            return [];
        }
        return data as Device[];
    },
    ['devices-cache'],
    { revalidate: 3600, tags: ['devices'] }
);

// Helper to map Order from DB
const mapOrderFromDB = (data: any) => ({
    id: data.id,
    customerName: data.customerName || data.customername || 'Unknown',
    phone: data.phone || '',
    city: data.city || '',
    address: data.address || '',
    items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
    totalAmount: Number(data.totalAmount || data.totalamount || 0),
    shippingFee: Number(data.shippingFee || data.shippingfee || 0),
    discountAmount: Number(data.discountAmount || data.discountamount || 0),
    discountCode: data.discountCode || data.discountcode || undefined,
    orderNumber: data.orderNumber || data.ordernumber || '',
    status: data.status || 'Processing',
    date: Number(data.date || Date.now()),
});

export const getCachedOrders = unstable_cache(
    async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error("Server Fetch Error (Orders):", error);
            return [];
        }
        return data ? data.map(mapOrderFromDB) : [];
    },
    ['orders-cache'],
    { revalidate: 3600, tags: ['orders'] }
);

export const getCachedProduct = unstable_cache(
    async (id: string) => {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        return data ? mapProductFromDB(data) : null;
    },
    ['product-details'],
    { revalidate: 3600, tags: ['products'] }
);

export const getCachedRelatedProducts = unstable_cache(
    async (device: string, excludeId: string) => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('device', device)
            .neq('id', excludeId)
            .limit(6);
        return data ? data.map(mapProductFromDB) : [];
    },
    ['related-products'],
    { revalidate: 3600, tags: ['products'] }
);

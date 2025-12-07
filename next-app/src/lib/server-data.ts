import { supabase } from '@/lib/supabase';
import { Product, Brand, CarouselSlide, Device } from '@/types';

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
        sku: p.sku || undefined
    };
};

// Fetch products without caching (data is too large for Next.js cache limit)
export async function getCachedProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Server Fetch Error (Products):", error);
        return [];
    }

    return data ? data.map(mapProductFromDB) : [];
}

export async function getCachedBrands() {
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Server Fetch Error (Brands):", error);
        return [];
    }
    return data as Brand[];
}

export async function getCachedSlides() {
    const { data, error } = await supabase
        .from('slides')
        .select('*');

    if (error) {
        console.error("Server Fetch Error (Slides):", error);
        return [];
    }
    return data as CarouselSlide[];
}

export async function getCachedDevices() {
    const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Server Fetch Error (Devices):", error);
        return [];
    }
    return data as Device[];
}

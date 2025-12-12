import { useState } from 'react';
import { Product, ProductVariant } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

// Helper to map Product from DB with multiple images support
const mapProductFromDB = (p: any): Product => {
    // If images array exists in DB, use it. Otherwise, fallback to single image or empty array.
    let images = p.images || (p.image ? [p.image] : []);

    // Ensure the primary 'image' property is set for backward compatibility
    // If 'images' array has items, use the first one. Else use the legacy 'image' field.
    let mainImage = p.image;
    if (images.length > 0 && (!mainImage || mainImage !== images[0])) {
        mainImage = images[0];
    }

    // Handle variants JSONB safely
    let variants: ProductVariant[] = [];
    if (Object.prototype.hasOwnProperty.call(p, 'variants') && p.variants) {
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

export const useProductLogic = (
    isSupabaseConfigured: boolean,
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
    setIsAppLoading: (loading: boolean) => void,
    initialProducts?: Product[]
) => {
    const [products, setProducts] = useState<Product[]>(() => {
        if (initialProducts && initialProducts.length > 0) return initialProducts;
        return isSupabaseConfigured ? [] : INITIAL_PRODUCTS;
    });

    const [isProductsLoading, setIsProductsLoading] = useState(false);

    const refreshProducts = async (silent = false) => {
        if (!silent) setIsAppLoading(true);
        setIsProductsLoading(true);

        // 1. Try to load from Local Storage first for instant UI
        try {
            const cached = localStorage.getItem('products_cache');
            if (cached) {
                // Check if cache contains heavy base64 data
                if (cached.includes('data:image')) {
                    console.warn("Clearing cache due to heavy base64 data");
                    localStorage.removeItem('products_cache');
                } else {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setProducts(parsed);
                        // If we have cache, we can stop the global loader immediately to show content
                        if (!silent) setIsAppLoading(false);
                    }
                }
            }
        } catch (e) {
            console.error("Cache read error", e);
        }

        if (isSupabaseConfigured) {
            try {
                // 2. Fetch fresh data from Supabase
                // Optimization: Select specific fields if description/variants are huge, 
                // but for now we keep '*' to ensure details page works without refetch.
                // We can optimize 'variants' if it's a huge JSONB.
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;


                if (data && data.length > 0) {
                    const mappedProducts = data.map(mapProductFromDB);
                    setProducts(mappedProducts);

                    // 3. Update Cache (strip base64 images to avoid quota errors)
                    try {
                        // Filter out base64 images before caching
                        const cacheableProducts = mappedProducts.map(p => ({
                            ...p,
                            image: p.image?.startsWith('data:image') ? '' : p.image,
                            images: p.images?.filter((img: string) => !img?.startsWith('data:image')) || [],
                            variants: p.variants?.map(v => ({
                                ...v,
                                image: v.image?.startsWith('data:image') ? '' : v.image
                            })) || []
                        }));
                        localStorage.setItem('products_cache', JSON.stringify(cacheableProducts));
                    } catch (e) {
                        // Silently ignore quota errors - server-side data is already loaded
                        console.warn('Failed to cache products:', e);
                    }
                } else {
                    // Connected but empty - Do NOT show demo data
                    setProducts([]);
                    addToast("Database connected but empty. Add products in Admin Dashboard.", "info");
                }
            } catch (err: any) {
                console.error("Fetch Error:", err);
                // If fetch fails, we might still have data from cache, so don't wipe it unless necessary.
                // Only fallback to demo data if we have NOTHING.
                if (products.length === 0) {
                    try {
                        const { data, error: fallbackError } = await supabase.from('products').select('*');
                        if (fallbackError) throw fallbackError;
                        if (data && data.length > 0) {
                            const mapped = data.map(mapProductFromDB);
                            setProducts(mapped);
                            // Filter out base64 images before caching
                            try {
                                const cacheableProducts = mapped.map(p => ({
                                    ...p,
                                    image: p.image?.startsWith('data:image') ? '' : p.image,
                                    images: p.images?.filter((img: string) => !img?.startsWith('data:image')) || [],
                                    variants: p.variants?.map(v => ({
                                        ...v,
                                        image: v.image?.startsWith('data:image') ? '' : v.image
                                    })) || []
                                }));
                                localStorage.setItem('products_cache', JSON.stringify(cacheableProducts));
                            } catch (e) {
                                console.warn('Failed to cache products (fallback):', e);
                            }
                        } else {
                            setProducts([]);
                            addToast("Database connected but empty (Fallback).", "info");
                        }
                    } catch (fallbackErr: any) {
                        console.error("Fallback Fetch Error:", fallbackErr);
                        // Only use demo data if we really have nothing
                        const cached = localStorage.getItem('products_cache');
                        if (!cached) {
                            addToast(`Connection Failed: ${fallbackErr.message || 'Check internet or API keys'}`, 'error');
                            setProducts(INITIAL_PRODUCTS);
                        }
                    }
                }
            }
        }
        setIsProductsLoading(false);
        if (!silent) setIsAppLoading(false);
    };

    const addProduct = async (product: Omit<Product, 'id' | 'rating'> & { id?: string, rating?: number }) => {
        if (isSupabaseConfigured) {
            const dbProduct = {
                name: product.name,
                price: product.price,
                description: product.description,
                category: product.category,
                image: product.image,
                brand: product.brand,
                device: product.device,
                stock: product.stock,
                images: product.images,
                colors: product.colors,
                variants: product.variants,
                sale_price: product.salePrice,
                sku: product.sku,
                tags: product.tags
            };

            const { error } = await supabase.from('products').insert([dbProduct]);

            if (error) {
                const lowerMsg = (error.message || '').toLowerCase();
                // Check for schema mismatch errors
                if (error.code === '42703' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku') || lowerMsg.includes('tags')) {
                    console.warn("Schema mismatch detected during add: column missing. Retrying insert without advanced fields.");
                    addToast("Warning: Database Schema Outdated. Added without complex data.", 'warning');

                    const { images, colors, variants, sale_price, sku, tags, ...legacyProduct } = dbProduct;
                    const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };

                    const { error: retryError } = await supabase.from('products').insert([safeProduct]);
                    if (retryError) {
                        console.error("Retry Add Error:", retryError);
                        throw retryError;
                    }
                } else {
                    console.error("Add Error:", error);
                    throw error;
                }
            }
            await refreshProducts();
            addToast('Product added successfully', 'success');
        } else {
            const newProduct: Product = {
                ...product,
                id: product.id || Date.now().toString(),
                rating: product.rating || 0
            };
            setProducts(prev => [...prev, newProduct]);
            addToast('Product added locally (Demo)', 'success');
        }
    };

    const updateProduct = async (product: Product) => {
        if (isSupabaseConfigured) {
            const dbProduct = {
                name: product.name,
                price: product.price,
                description: product.description,
                category: product.category,
                image: product.image,
                brand: product.brand,
                device: product.device,
                stock: product.stock,
                images: product.images,
                colors: product.colors,
                variants: product.variants,
                sale_price: product.salePrice,
                sku: product.sku,
                tags: product.tags
            };

            const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);

            if (error) {
                const lowerMsg = (error.message || '').toLowerCase();
                if (error.code === '42703' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku') || lowerMsg.includes('tags')) {
                    console.warn("Schema mismatch detected: column missing. Retrying update without advanced fields.");
                    addToast("Warning: Database Schema Outdated. Updated without complex data.", 'warning');

                    const { images, colors, variants, sale_price, sku, tags, ...legacyProduct } = dbProduct;
                    const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };

                    const { error: retryError } = await supabase.from('products').update(safeProduct).eq('id', product.id);
                    if (retryError) {
                        console.error("Retry Update Error:", retryError);
                        throw retryError;
                    }
                } else {
                    console.error("Update Error:", error);
                    throw error;
                }
            }
            await refreshProducts();
            addToast('Product updated successfully', 'success');
        } else {
            setProducts(prev => prev.map(p => p.id === product.id ? product : p));
            addToast('Product updated locally (Demo)', 'success');
        }
    };

    const deleteProduct = async (id: string) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
                console.error(error);
                addToast('Failed to delete product', 'error');
                return;
            }
            await refreshProducts();
            addToast('Product deleted', 'success');
        } else {
            setProducts(prev => prev.filter(p => p.id !== id));
            addToast('Product deleted locally (Demo)', 'success');
        }
    };

    return { products, setProducts, refreshProducts, addProduct, updateProduct, deleteProduct, isProductsLoading };
};

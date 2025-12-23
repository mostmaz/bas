import { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
import { supabase } from '../services/supabase';

// Helper to map Product from DB with multiple images support
const mapProductFromDB = (p: any): Product => {
    // 1. Handle Images
    // Prioritize 'images' array from DB. If missing or empty, fallback to 'image' field wrapped in array.
    let images: string[] = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
        images = p.images;
    } else if (p.image) {
        images = [p.image];
    }

    // Ensure main 'image' property is set. Use 'image' from DB, or first item of 'images'.
    let mainImage = p.image;
    if (!mainImage && images.length > 0) {
        mainImage = images[0];
    }

    // 2. Handle Variants
    let variants: ProductVariant[] = [];
    if (p.variants) {
        if (typeof p.variants === 'string') {
            try {
                const parsed = JSON.parse(p.variants);
                if (Array.isArray(parsed)) variants = parsed;
            } catch (e) {
                console.error("Error parsing variants JSON for product", p.id, e);
            }
        } else if (Array.isArray(p.variants)) {
            variants = p.variants;
        }
    }

    // 3. Handle Colors
    // Ensure colors is an array of strings
    let colors: string[] = [];
    if (p.colors) {
        if (Array.isArray(p.colors)) {
            colors = p.colors;
        } else if (typeof p.colors === 'string') {
            try {
                const parsed = JSON.parse(p.colors);
                if (Array.isArray(parsed)) colors = parsed;
                else colors = [p.colors];
            } catch {
                colors = [p.colors];
            }
        }
    }

    return {
        ...p,
        image: mainImage || '', // Ensure it's never undefined/null if possible
        images: images,
        colors: colors,
        variants: variants,
        salePrice: p.sale_price !== undefined ? p.sale_price : (p.salePrice !== undefined ? p.salePrice : undefined),
        sku: p.sku || undefined,
        isHidden: p.isHidden || p.ishidden || false,
        giftProductId: p.gift_product_id || p.giftProductId || undefined,
        bonusMessage: p.bonus_message || p.bonusMessage || undefined
    };
};

export const useProductLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, setIsAppLoading: (loading: boolean) => void) => {
    const [products, setProducts] = useState<Product[]>(() => isSupabaseConfigured ? [] : INITIAL_PRODUCTS);

    const [isProductsLoading, setIsProductsLoading] = useState(false);

    const refreshProducts = async (silent = false) => {
        if (!silent) setIsAppLoading(true);
        setIsProductsLoading(true);

        // 1. Try to load from Local Storage first for instant UI
        try {
            const cached = localStorage.getItem('products_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setProducts(parsed);
                    // If we have cache, we can stop the global loader immediately to show content
                    if (!silent) setIsAppLoading(false);
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

                    // 3. Update Cache
                    try {
                        localStorage.setItem('products_cache', JSON.stringify(mappedProducts));
                    } catch (e) {
                        console.error("Cache write error", e);
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
                            localStorage.setItem('products_cache', JSON.stringify(mapped));
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
                ishidden: product.isHidden, // Lowercase key for Postgres
                gift_product_id: product.giftProductId || null,
                bonus_message: product.bonusMessage || null
            };

            const { error } = await supabase.from('products').insert([dbProduct]);

            if (error) {
                const lowerMsg = (error.message || '').toLowerCase();
                // Check for schema mismatch errors
                if (error.code === '42703' || error.code === 'PGRST204' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku') || lowerMsg.includes('ishidden') || lowerMsg.includes('gift_product_id') || lowerMsg.includes('bonus_message')) {
                    console.warn("Schema mismatch detected during add: column missing. Retrying insert without advanced fields.");
                    console.error("Schema Error Details:", error);
                    addToast("Warning: Database Schema Outdated. Added without complex data.", 'warning');

                    // Destructure ishidden (lowercase)
                    const { images, colors, variants, sale_price, sku, ishidden, gift_product_id, bonus_message, ...legacyProduct } = dbProduct;
                    const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };

                    const { error: retryError } = await supabase.from('products').insert([safeProduct]);
                    if (retryError) {
                        console.error("Retry Add Error:", retryError);
                        throw retryError; // Throw to caller
                    }
                } else {
                    console.error("Add Error:", error);
                    throw error; // Throw to caller
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
                ishidden: product.isHidden, // Lowercase key for Postgres
                gift_product_id: product.giftProductId || null,
                bonus_message: product.bonusMessage || null
            };

            const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);

            if (error) {
                const lowerMsg = (error.message || '').toLowerCase();
                if (error.code === '42703' || error.code === 'PGRST204' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku') || lowerMsg.includes('ishidden') || lowerMsg.includes('gift_product_id') || lowerMsg.includes('bonus_message')) {
                    console.warn("Schema mismatch detected: column missing. Retrying update without advanced fields.");
                    console.error("Schema Error Details:", error);
                    addToast("Warning: Database Schema Outdated. Updated without complex data.", 'warning');

                    // Destructure ishidden (lowercase)
                    const { images, colors, variants, sale_price, sku, ishidden, gift_product_id, bonus_message, ...legacyProduct } = dbProduct;
                    const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };

                    const { error: retryError } = await supabase.from('products').update(safeProduct).eq('id', product.id);
                    if (retryError) {
                        console.error("Retry Update Error:", retryError);
                        throw retryError; // Throw to caller
                    }
                } else {
                    console.error("Update Error:", error);
                    throw error; // Throw to caller
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

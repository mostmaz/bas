import { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
import { supabase } from '../services/supabase';

// Helper to map Product from DB with multiple images support
const mapProductFromDB = (p: any): Product => {
    // 1. Handle Images
    let images: string[] = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
        images = p.images;
    } else if (p.image) {
        images = [p.image];
    }

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
        image: mainImage || '',
        images: images,
        colors: colors,
        variants: variants,
        salePrice: p.sale_price !== undefined ? p.sale_price : (p.salePrice !== undefined ? p.salePrice : undefined),
        sku: p.sku || undefined,
        isHidden: p.isHidden || p.ishidden || false,
        giftProductId: p.gift_product_id || p.giftProductId || undefined,
        bonusMessage: p.bonus_message || p.bonusMessage || undefined,
        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? (() => {
            try {
                return JSON.parse(p.tags);
            } catch (e) {
                return [];
            }
        })() : []),
        views: p.views || 0,
        daily_views: p.daily_views || 0,
        giftIcon: p.gift_icon || undefined
    };
};

export const useProductLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, setIsAppLoading: (loading: boolean) => void) => {
    const [products, setProducts] = useState<Product[]>(() => isSupabaseConfigured ? [] : INITIAL_PRODUCTS);
    const [isProductsLoading, setIsProductsLoading] = useState(false);

    const refreshProducts = async (silent = false) => {
        // Only show full app loader if we don't have cache and it's not a silent refresh
        const hasCache = !!localStorage.getItem('products_cache');
        if (!silent && !hasCache) setIsAppLoading(true);

        setIsProductsLoading(true);

        try {
            const cached = localStorage.getItem('products_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setProducts(parsed);
                    // If we have cache, we don't need to block the UI
                    if (!silent) setIsAppLoading(false);
                }
            }
        } catch (e) {
            console.error("Cache read error", e);
        }

        if (isSupabaseConfigured) {
            try {
                // Optimization: Exclude 'description' from list view fetch to reduce payload size
                // Description is fetched on-demand in ProductDetails or ProductForm
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, price, sale_price, image, images, variants, category, brand, device, stock, rating, colors, sku, ishidden, created_at, tags, views, daily_views, gift_icon, bonus_message')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    const mappedProducts = data.map(mapProductFromDB);
                    setProducts(mappedProducts);
                    try {
                        localStorage.setItem('products_cache', JSON.stringify(mappedProducts));
                    } catch (e) {
                        console.error("Cache write error", e);
                    }
                } else {
                    setProducts([]);
                }
            } catch (err: any) {
                console.error("Fetch Error:", err);
                if (products.length === 0) {
                    const cached = localStorage.getItem('products_cache');
                    if (!cached) {
                        setProducts(INITIAL_PRODUCTS);
                    }
                }
            }
        }
        setIsProductsLoading(false);
        if (!silent) setIsAppLoading(false);
    };

    const fetchProductDetails = async (id: string) => {
        if (!isSupabaseConfigured) return;
        try {
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (error) throw error;
            if (data) {
                const fullProduct = mapProductFromDB(data);
                setProducts(prev => {
                    const updated = prev.map(p => p.id === id ? fullProduct : p);
                    try {
                        localStorage.setItem('products_cache', JSON.stringify(updated));
                    } catch (e) {
                        console.error("Cache update error", e);
                    }
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
        }
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
                ishidden: product.isHidden,
                gift_product_id: product.giftProductId || null,
                bonus_message: product.bonusMessage || null,
                tags: product.tags || [],
                gift_icon: product.giftIcon || null
            };

            const { error } = await supabase.from('products').insert([dbProduct]);
            if (error) {
                console.error("Add Error:", error);
                throw error;
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

    const updateProduct = async (product: Product, silent = false) => {
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
                ishidden: product.isHidden,
                gift_product_id: product.giftProductId || null,
                bonus_message: product.bonusMessage || null,
                tags: product.tags || [],
                gift_icon: product.giftIcon || null
            };

            const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);
            if (error) {
                console.error("Update Error:", error);
                throw error;
            }
            setProducts(prev => prev.map(p => p.id === product.id ? product : p));
            if (!silent) addToast('Product updated successfully', 'success');
        } else {
            setProducts(prev => prev.map(p => p.id === product.id ? product : p));
            if (!silent) addToast('Product updated locally (Demo)', 'success');
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
            setProducts(prev => prev.filter(p => p.id !== id));
            addToast('Product deleted', 'success');
        } else {
            setProducts(prev => prev.filter(p => p.id !== id));
            addToast('Product deleted locally (Demo)', 'success');
        }
    };

    return { products, setProducts, refreshProducts, fetchProductDetails, addProduct, updateProduct, deleteProduct, isProductsLoading };
};

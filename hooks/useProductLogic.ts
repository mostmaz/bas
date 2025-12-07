import { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
import { supabase } from '../services/supabase';

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
        sku: p.sku || undefined
    };
};

export const useProductLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, setIsAppLoading: (loading: boolean) => void) => {
    const [products, setProducts] = useState<Product[]>(() => isSupabaseConfigured ? [] : INITIAL_PRODUCTS);

    const refreshProducts = async (silent = false) => {
        if (!silent) setIsAppLoading(true);
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setProducts(data.map(mapProductFromDB));
                } else {
                    // Connected but empty - Do NOT show demo data
                    setProducts([]);
                    addToast("Database connected but empty. Add products in Admin Dashboard.", "info");
                }
            } catch (err: any) {
                console.error("Fetch Error:", err);
                try {
                    const { data, error: fallbackError } = await supabase.from('products').select('*');
                    if (fallbackError) throw fallbackError;
                    if (data && data.length > 0) {
                        setProducts(data.map(mapProductFromDB));
                    } else {
                        setProducts([]);
                        addToast("Database connected but empty (Fallback).", "info");
                    }
                } catch (fallbackErr: any) {
                    console.error("Fallback Fetch Error:", fallbackErr);
                    addToast(`Connection Failed: ${fallbackErr.message || 'Check internet or API keys'}`, 'error');
                    setProducts(INITIAL_PRODUCTS);
                }
            }
        }
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
                sku: product.sku
            };

            const { error } = await supabase.from('products').insert([dbProduct]);
            if (error) {
                console.error(error);
                addToast('Failed to add product', 'error');
                return;
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
                sku: product.sku
            };

            const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);

            if (error) {
                const lowerMsg = (error.message || '').toLowerCase();
                if (error.code === '42703' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku')) {
                    console.warn("Schema mismatch detected: column missing. Retrying update without advanced fields.");
                    addToast("Warning: Database Schema Outdated. Updated without complex data.", 'warning');

                    const { images, colors, variants, sale_price, sku, ...legacyProduct } = dbProduct;
                    const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };

                    const { error: retryError } = await supabase.from('products').update(safeProduct).eq('id', product.id);
                    if (retryError) {
                        console.error(retryError);
                        addToast('Failed to update product', 'error');
                        return;
                    }
                } else {
                    console.error(error);
                    addToast('Failed to update product', 'error');
                    return;
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

    return { products, setProducts, refreshProducts, addProduct, updateProduct, deleteProduct };
};

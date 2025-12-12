import React from 'react';
import { supabase } from '@/lib/supabase';
import { ProductDetailsClient } from '@/components/ProductDetailsClient';
import { Product, ProductVariant } from '@/types';
import { Metadata } from 'next';

// Helper to map product data
const mapProductFromDB = (p: any): Product => {
    let images = p.images || (p.image ? [p.image] : []);
    let mainImage = p.image;
    if (images.length > 0 && (!mainImage || mainImage !== images[0])) {
        mainImage = images[0];
    }

    let variants: ProductVariant[] = [];
    if (p.variants) {
        if (typeof p.variants === 'string') {
            try { variants = JSON.parse(p.variants); } catch (e) { }
        } else if (Array.isArray(p.variants)) {
            variants = p.variants;
        }
    }

    return {
        ...p,
        image: mainImage,
        images,
        variants,
        salePrice: p.sale_price || p.salePrice,
        colors: p.colors || [],
        tags: p.tags || []
    };
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (!data) return { title: 'Product Not Found | BasCavarat' };

    return {
        title: `${data.name} | BasCavarat`,
        description: data.description?.substring(0, 160) || `Buy ${data.name} at BasCavarat`,
        openGraph: {
            title: data.name,
            description: data.description?.substring(0, 160),
            images: [data.image || ''],
        }
    };
}

export async function generateStaticParams() {
    // Pre-render the first 20 products for performance
    const { data } = await supabase.from('products').select('id').limit(20);
    return (data || []).map((p) => ({
        id: p.id.toString(),
    }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: productData } = await supabase.from('products').select('*').eq('id', id).single();

    if (!productData) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Product Not Found</h2>
            </div>
        );
    }

    const product = mapProductFromDB(productData);

    // Fetch related products (same device)
    const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .eq('device', product.device)
        .neq('id', product.id)
        .limit(6);

    const relatedProducts = (relatedData || []).map(mapProductFromDB);

    return <ProductDetailsClient product={product} relatedProducts={relatedProducts} />;
}

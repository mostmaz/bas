import React from 'react';
import { supabase } from '@/lib/supabase';
import { ProductDetailsClient } from '@/components/ProductDetailsClient';
import { Metadata } from 'next';
import { getCachedProduct, getCachedRelatedProducts } from '@/lib/server-data';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await getCachedProduct(id);

    if (!product) return { title: 'Product Not Found | BasCavarat' };

    return {
        title: `${product.name} | BasCavarat`,
        description: product.description?.substring(0, 160) || `Buy ${product.name} at BasCavarat`,
        openGraph: {
            title: product.name,
            description: product.description?.substring(0, 160),
            images: [product.image || ''],
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
    const product = await getCachedProduct(id);

    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Product Not Found</h2>
            </div>
        );
    }

    // Fetch related products (same device)
    const relatedProducts = await getCachedRelatedProducts(product.device, product.id);

    return <ProductDetailsClient product={product} relatedProducts={relatedProducts} />;
}

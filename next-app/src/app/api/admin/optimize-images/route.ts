import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

// Helper to process a single image URL
async function processImage(url: string): Promise<string | null> {
    try {
        // Only process Supabase images that aren't already WebP
        if (!url.includes('supabase.co') || url.endsWith('.webp')) {
            return null;
        }

        console.log(`Processing: ${url}`);

        // Download image
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Optimize
        const optimizedBuffer = await sharp(buffer)
            .resize(1920, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({ quality: 80 })
            .toBuffer();

        // Upload new image
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `optimized-${timestamp}-${randomString}.webp`;

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, optimizedBuffer, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error(`Error processing ${url}:`, error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Fetch products that might need optimization
        // We can't easily filter by "not ends with .webp" in Supabase API efficiently without raw SQL or client-side filtering
        // So we fetch all and filter in code. 
        // For a large DB, this should be paginated.
        const { data: products, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

        let processedCount = 0;
        const limit = 5; // Process max 5 per request to avoid timeout

        for (const product of products) {
            if (processedCount >= limit) break;

            let updated = false;
            const updates: any = {};

            // 1. Optimize Main Image
            const newMainImage = await processImage(product.image);
            if (newMainImage) {
                updates.image = newMainImage;
                updated = true;
            }

            // 2. Optimize Variant Images
            if (product.variants && Array.isArray(product.variants)) {
                const newVariants = [...product.variants];
                let variantsUpdated = false;

                for (let i = 0; i < newVariants.length; i++) {
                    const v = newVariants[i];
                    if (v.image) {
                        const newVImage = await processImage(v.image);
                        if (newVImage) {
                            newVariants[i] = { ...v, image: newVImage };
                            variantsUpdated = true;
                        }
                    }
                }

                if (variantsUpdated) {
                    updates.variants = newVariants;
                    updated = true;
                }
            }

            // 3. Update Product in DB
            if (updated) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(updates)
                    .eq('id', product.id);

                if (updateError) {
                    console.error(`Failed to update product ${product.id}`, updateError);
                } else {
                    processedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            message: processedCount === 0 ? "No images needed optimization" : `Optimized ${processedCount} products`
        });

    } catch (error: any) {
        console.error('Optimization error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

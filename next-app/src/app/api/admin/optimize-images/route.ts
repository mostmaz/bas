import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

// Helper to process a single image URL or Base64 string
async function processImage(url: string | null | undefined): Promise<string | null> {
    if (!url) return null;

    try {
        let buffer: Buffer;

        // Check for Base64
        if (url.startsWith('data:image')) {
            console.log('Processing Base64 Image...');
            const base64Data = url.split(',')[1];
            if (!base64Data) return null;
            buffer = Buffer.from(base64Data, 'base64');
        }
        // Check for Supabase URL (that isn't already WebP)
        else if (url.includes('supabase.co') && !url.endsWith('.webp')) {
            console.log(`Processing URL: ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }
        // Skip others (already optimized or external)
        else {
            return null;
        }

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
        console.error(`Error processing image:`, error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Fetch products
        const { data: products, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

        let processedCount = 0;
        const limit = 10; // Process max 10 per request

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

            // 2. Optimize Images Array
            if (product.images && Array.isArray(product.images)) {
                const newImages = [...product.images];
                let imagesUpdated = false;
                for (let i = 0; i < newImages.length; i++) {
                    const newImg = await processImage(newImages[i]);
                    if (newImg) {
                        newImages[i] = newImg;
                        imagesUpdated = true;
                    }
                }
                if (imagesUpdated) {
                    updates.images = newImages;
                    updated = true;
                }
            }

            // 3. Optimize Variant Images
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

            // 4. Update Product in DB
            if (updated) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(updates)
                    .eq('id', product.id);

                if (updateError) {
                    console.error(`Failed to update product ${product.id}`, updateError);
                } else {
                    processedCount++;
                    console.log(`Optimized product ${product.id}`);
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

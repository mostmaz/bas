
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://drehfajljdtaeqgsaccl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWhmYWpsamR0YWVxZ3NhY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDk0NjYsImV4cCI6MjA3OTEyNTQ2Nn0.X7i1MjbquBA0PHZBp7Ze_QCR98D8uwRt16dfky0Iovg';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadBase64ToSupabase(base64: string, prefix: string) {
    try {
        const res = await fetch(base64);
        const buffer = await res.buffer();
        const contentType = base64.split(';')[0].split(':')[1] || 'image/jpeg';
        const extension = contentType.split('/')[1] || 'jpg';
        const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filename, buffer, { contentType, upsert: false });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filename);

        return publicUrl;
    } catch (error) {
        console.error('Upload failed:', error);
        return null;
    }
}

async function fixImages() {
    console.log('Fetching products...');
    const { data: products, error } = await supabase.from('products').select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products. Scanning for base64 images...`);

    for (const product of products) {
        let needsUpdate = false;
        const updatedData: any = {};

        // Check main image
        if (product.image && product.image.startsWith('data:image')) {
            console.log(`Fixing main image for product: ${product.name} (${product.id})`);
            const url = await uploadBase64ToSupabase(product.image, 'prod_main');
            if (url) {
                updatedData.image = url;
                needsUpdate = true;
            }
        }

        // Check gallery images
        if (product.images && Array.isArray(product.images)) {
            const newImages = [...product.images];
            let galleryNeedsUpdate = false;
            for (let i = 0; i < newImages.length; i++) {
                if (newImages[i] && newImages[i].startsWith('data:image')) {
                    console.log(`Fixing gallery image ${i + 1} for product: ${product.name}`);
                    const url = await uploadBase64ToSupabase(newImages[i], 'prod_gallery');
                    if (url) {
                        newImages[i] = url;
                        galleryNeedsUpdate = true;
                    }
                }
            }
            if (galleryNeedsUpdate) {
                updatedData.images = newImages;
                needsUpdate = true;
            }
        }

        // Check variants
        if (product.variants && Array.isArray(product.variants)) {
            const newVariants = [...product.variants];
            let variantsNeedUpdate = false;
            for (let i = 0; i < newVariants.length; i++) {
                if (newVariants[i].image && newVariants[i].image.startsWith('data:image')) {
                    console.log(`Fixing variant image for product: ${product.name}`);
                    const url = await uploadBase64ToSupabase(newVariants[i].image, 'prod_variant');
                    if (url) {
                        newVariants[i].image = url;
                        variantsNeedUpdate = true;
                    }
                }
            }
            if (variantsNeedUpdate) {
                updatedData.variants = newVariants;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('products')
                .update(updatedData)
                .eq('id', product.id);

            if (updateError) {
                console.error(`Failed to update product ${product.id}:`, updateError);
            } else {
                console.log(`Successfully updated product ${product.id}`);
            }
        }
    }

    console.log('Finished scanning products.');

    // Also scan brands
    console.log('Scanning brands...');
    const { data: brands } = await supabase.from('brands').select('*');
    if (brands) {
        for (const brand of brands) {
            if (brand.logo && brand.logo.startsWith('data:image')) {
                console.log(`Fixing logo for brand: ${brand.name}`);
                const url = await uploadBase64ToSupabase(brand.logo, 'brand_logo');
                if (url) {
                    await supabase.from('brands').update({ logo: url }).eq('id', brand.id);
                }
            }
        }
    }

    // Also scan slides
    console.log('Scanning slides...');
    const { data: slides } = await supabase.from('slides').select('*');
    if (slides) {
        for (const slide of slides) {
            if (slide.image && slide.image.startsWith('data:image')) {
                console.log(`Fixing image for slide: ${slide.id}`);
                const url = await uploadBase64ToSupabase(slide.image, 'slide_img');
                if (url) {
                    await supabase.from('slides').update({ image: url }).eq('id', slide.id);
                }
            }
        }
    }

    console.log('Migration complete!');
}

fixImages();

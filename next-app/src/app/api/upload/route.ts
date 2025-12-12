import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Optimize image with Sharp
        // 1. Resize to max width 1920px (prevents huge 4k/8k uploads)
        // 2. Convert to WebP (better compression)
        // 3. Set quality to 80% (good balance)
        const optimizedBuffer = await sharp(buffer)
            .resize(1920, null, {
                withoutEnlargement: true, // Don't upscale small images
                fit: 'inside'
            })
            .webp({ quality: 80 })
            .toBuffer();

        // Generate unique filename with .webp extension
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}-${randomString}.webp`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, optimizedBuffer, {
                contentType: 'image/webp',
                cacheControl: '31536000', // Cache for 1 year (immutable)
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl }, { status: 200 });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        // Extract filename from URL
        const fileName = url.split('/').pop();
        if (!fileName) {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Delete from Supabase Storage
        const { error } = await supabase.storage
            .from('product-images')
            .remove([fileName]);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

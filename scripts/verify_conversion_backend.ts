
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drehfajljdtaeqgsaccl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWhmYWpsamR0YWVxZ3NhY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDk0NjYsImV4cCI6MjA3OTEyNTQ2Nn0.X7i1MjbquBA0PHZBp7Ze_QCR98D8uwRt16dfky0Iovg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
    console.log('Fetching test product...');
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('name', 'TEST_BASE64_CONVERSION_PRODUCT')
        .single();

    if (error || !product) {
        console.error('Test product not found:', error);
        return;
    }

    if (!product.image.startsWith('data:image')) {
        console.log('Product image is already a URL:', product.image);
        return;
    }

    console.log('Found base64 image. Converting...');

    // Simulate conversion
    try {
        // In Node, we can't easily use fetch(base64).blob() without polyfills sometimes, 
        // but let's try standard fetch if available, or just upload a buffer.
        // For this test, we'll just upload a dummy buffer to prove upload works.

        const buffer = Buffer.from(product.image.split(',')[1], 'base64');
        const filename = `test_conversion_${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filename, buffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filename);

        const publicUrl = urlData.publicUrl;
        console.log('Uploaded to:', publicUrl);

        const { error: updateError } = await supabase
            .from('products')
            .update({ image: publicUrl })
            .eq('id', product.id);

        if (updateError) throw updateError;

        console.log('Database updated successfully.');

    } catch (e) {
        console.error('Conversion failed:', e);
        process.exit(1);
    }
}

verify();


import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drehfajljdtaeqgsaccl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWhmYWpsamR0YWVxZ3NhY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDk0NjYsImV4cCI6MjA3OTEyNTQ2Nn0.X7i1MjbquBA0PHZBp7Ze_QCR98D8uwRt16dfky0Iovg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_PRODUCT = {
    name: 'TEST_BASE64_CONVERSION_PRODUCT',
    description: 'This is a temporary product to test base64 conversion.',
    price: 999,
    category: 'Test',
    // Small 1x1 red pixel base64 image
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=75',
    stock: 1,
    ishidden: true
};

async function setup() {
    console.log('Inserting test product...');
    const { data, error } = await supabase
        .from('products')
        .insert(TEST_PRODUCT)
        .select()
        .single();

    if (error) {
        console.error('Error inserting test product:', error);
        process.exit(1);
    }

    console.log('Test product inserted:', data.id);
}

setup();

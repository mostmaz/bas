
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drehfajljdtaeqgsaccl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWhmYWpsamR0YWVxZ3NhY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDk0NjYsImV4cCI6MjA3OTEyNTQ2Nn0.X7i1MjbquBA0PHZBp7Ze_QCR98D8uwRt16dfky0Iovg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanup() {
    console.log('Cleaning up test product...');
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('name', 'TEST_BASE64_CONVERSION_PRODUCT');

    if (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }

    console.log('Test product deleted.');
}

cleanup();

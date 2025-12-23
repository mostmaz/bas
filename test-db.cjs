
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://drehfajljdtaeqgsaccl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWhmYWpsamR0YWVxZ3NhY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDk0NjYsImV4cCI6MjA3OTEyNTQ2Nn0.X7i1MjbquBA0PHZBp7Ze_QCR98D8uwRt16dfky0Iovg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDB() {
    console.log("Testing Database Connection...");

    // 1. Test Select All Advanced Columns (LOWERCASE ishidden)
    console.log("\n1. Testing SELECT all advanced columns (using 'ishidden')...");
    const { data, error: selectError } = await supabase
        .from('products')
        .select('images, colors, variants, sale_price, sku, ishidden, gift_product_id, bonus_message')
        .limit(1);

    if (selectError) {
        console.error("❌ SELECT Failed:", selectError);
    } else {
        console.log("✅ SELECT Success.");
    }

    // 2. Test Update All Advanced Columns (LOWERCASE ishidden)
    console.log("\n2. Testing UPDATE all advanced columns (using 'ishidden')...");
    const payload = {
        images: ['test.jpg'],
        colors: ['#000'],
        variants: [{ id: '1', color: '#000', stock: 1 }],
        sale_price: 100,
        sku: 'TEST-SKU',
        ishidden: true, // Lowercase
        gift_product_id: 'test_gift',
        bonus_message: 'test_msg'
    };

    const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID

    if (updateError) {
        console.error("❌ UPDATE Failed:", updateError);
    } else {
        console.log("✅ UPDATE Success.");
    }
}

testDB();

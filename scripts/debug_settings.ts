
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log('Checking store_settings table...');
    const { data, error } = await supabase.from('store_settings').select('*');

    if (error) {
        console.error('Error fetching settings:', error);
        return;
    }

    console.log(`Found ${data.length} row(s) in store_settings:`);
    console.log(JSON.stringify(data, null, 2));

    if (data.length > 1) {
        console.warn('WARNING: Multiple rows found! This is likely the cause of the issue.');
    } else if (data.length === 0) {
        console.warn('WARNING: No rows found. App will use defaults until first save.');
    } else {
        console.log('Table state looks healthy (1 row).');
    }
}

checkSettings();

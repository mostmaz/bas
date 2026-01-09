
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Use the same keys as in the other scripts
const SUPABASE_URL = 'https://drehfajljdtaeqgsaccl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWhmYWpsamR0YWVxZ3NhY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDk0NjYsImV4cCI6MjA3OTEyNTQ2Nn0.X7i1MjbquBA0PHZBp7Ze_QCR98D8uwRt16dfky0Iovg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateCacheControl() {
    console.log('Starting cache update for existing images...');

    let count = 0;
    let errors = 0;

    try {
        // 1. List all files in the bucket
        // Note: limit is 100 by default, we might need pagination if there are many files
        // For now, let's try to fetch a large batch
        const { data: files, error: listError } = await supabase
            .storage
            .from('product-images')
            .list('', { limit: 1000, offset: 0 });

        if (listError) {
            console.error('Error listing files:', listError);
            return;
        }

        if (!files || files.length === 0) {
            console.log('No files found in product-images bucket.');
            return;
        }

        console.log(`Found ${files.length} files. Processing...`);

        for (const file of files) {
            // Skip folders or placeholder files if any
            if (file.name === '.emptyFolderPlaceholder') continue;

            console.log(`Processing ${file.name}...`);

            try {
                // 2. Download the file
                const { data: fileData, error: downloadError } = await supabase
                    .storage
                    .from('product-images')
                    .download(file.name);

                if (downloadError) {
                    console.error(`  Failed to download ${file.name}:`, downloadError);
                    errors++;
                    continue;
                }

                // 3. Re-upload with new Cache-Control
                const { error: updateError } = await supabase
                    .storage
                    .from('product-images')
                    .update(file.name, fileData, {
                        cacheControl: '31536000', // 1 year
                        upsert: true,
                        contentType: file.metadata?.mimetype || 'image/jpeg'
                    });

                if (updateError) {
                    console.error(`  Failed to update ${file.name}:`, updateError);
                    errors++;
                } else {
                    console.log(`  Updated ${file.name}`);
                    count++;
                }

            } catch (e) {
                console.error(`  Exception processing ${file.name}:`, e);
                errors++;
            }
        }

        console.log('------------------------------------------------');
        console.log(`Finished! Updated: ${count}, Errors: ${errors}`);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

updateCacheControl();

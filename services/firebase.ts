/**
 * FIREBASE DEPRECATED
 * 
 * This application has migrated to Supabase for database and real-time functionality.
 * Please refer to services/supabase.ts for configuration.
 * 
 * If you wish to revert to Firebase:
 * 1. Restore the previous content of this file.
 * 2. Update index.html to include Firebase in the import map.
 * 3. Update context/ShopContext.tsx to use Firebase SDK instead of Supabase client.
 */

const isConfigured = false;
const db = null;

export { db, isConfigured };

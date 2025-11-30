import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// For a real app, use your actual project URL and Anon Key from process.env
const rawUrl = process.env.SUPABASE_URL || 'https://drehfajljdtaeqgsaccl.supabase.co';
const rawKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZWhmYWpsamR0YWVxZ3NhY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDk0NjYsImV4cCI6MjA3OTEyNTQ2Nn0.X7i1MjbquBA0PHZBp7Ze_QCR98D8uwRt16dfky0Iovg';

const SUPABASE_URL = rawUrl.trim();
const SUPABASE_ANON_KEY = rawKey.trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if properly configured to enable Online Mode
export const isSupabaseConfigured = 
  SUPABASE_URL !== 'https://placeholder-project.supabase.co' && 
  SUPABASE_ANON_KEY !== 'placeholder-key';

console.log(`Supabase Service Status: ${isSupabaseConfigured ? 'Online' : 'Offline (Demo Mode)'}`);
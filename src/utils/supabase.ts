import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Key from environment or use the provided production project defaults
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://egzeyuivpzuhphaozarz.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TUPDyAOKm4OYnhHWkKAOug__9kcVMqu';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client initialized with URL:', supabaseUrl);

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Key from environment or use the provided production project defaults
const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://egzeyuivpzuhphaozarz.supabase.co';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TUPDyAOKm4OYnhHWkKAOug__9kcVMqu';

const supabaseUrl = rawUrl.replace(/^SUPABASE_URL\s+/, '').trim();
const supabaseAnonKey = rawKey.replace(/^SUPABASE_ANON_KEY\s+/, '').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client initialized with URL:', supabaseUrl);

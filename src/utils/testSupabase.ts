import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_ANON_KEY || '';

const cleanUrl = rawUrl.replace(/^SUPABASE_URL\s+/, '').trim();
const cleanKey = rawKey.replace(/^SUPABASE_ANON_KEY\s+/, '').trim();

console.log('Sanitized Supabase URL:', cleanUrl);
console.log('Sanitized Supabase Anon Key:', cleanKey ? '(present)' : '(missing)');

if (!cleanUrl || !cleanKey) {
  console.error('Error: Clean URL or Key is missing!');
  process.exit(1);
}

const supabase = createClient(cleanUrl, cleanKey);

async function test() {
  try {
    const { data, error } = await supabase.from('companies').select('*').limit(1);
    if (error) {
      console.log('Query finished with error (this is expected if tables are not yet created):', error.message);
    } else {
      console.log('Successfully connected and queried companies table! Data:', data);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

test();

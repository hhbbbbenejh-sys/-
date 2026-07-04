import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_ANON_KEY || '';

const cleanUrl = rawUrl.replace(/^SUPABASE_URL\s+/, '').trim();
const cleanKey = rawKey.replace(/^SUPABASE_ANON_KEY\s+/, '').trim();

const supabase = createClient(cleanUrl, cleanKey);

async function testTables() {
  try {
    const { data: dbData, error: dbError } = await supabase.from('erp_databases').select('*').limit(1);
    console.log('erp_databases:', { hasTable: !dbError, error: dbError?.message, data: dbData });

    const { data: recData, error: recError } = await supabase.from('erp_company_records').select('*').limit(1);
    console.log('erp_company_records:', { hasTable: !recError, error: recError?.message, data: recData });
  } catch (err: any) {
    console.error('Exception:', err.message || err);
  }
}

testTables();

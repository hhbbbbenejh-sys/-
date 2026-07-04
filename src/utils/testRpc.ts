import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_ANON_KEY || '';

const cleanUrl = rawUrl.replace(/^SUPABASE_URL\s+/, '').trim();
const cleanKey = rawKey.replace(/^SUPABASE_ANON_KEY\s+/, '').trim();

const supabase = createClient(cleanUrl, cleanKey);

async function testRpcs() {
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql_query', 'query_sql', 'exec_query', 'run_query'];
  for (const rpcName of rpcs) {
    try {
      console.log(`Testing RPC: ${rpcName}...`);
      const { data, error } = await supabase.rpc(rpcName, { sql: 'SELECT 1;' });
      if (!error) {
        console.log(`👉 Success with ${rpcName}! Data:`, data);
        return;
      } else {
        console.log(`❌ Error with ${rpcName}:`, error.message);
      }
    } catch (err: any) {
      console.log(`❌ Exception with ${rpcName}:`, err.message || err);
    }
  }
}

testRpcs();

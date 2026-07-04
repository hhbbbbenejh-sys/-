import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_ANON_KEY || '';

const cleanUrl = rawUrl.replace(/^SUPABASE_URL\s+/, '').trim();
const cleanKey = rawKey.replace(/^SUPABASE_ANON_KEY\s+/, '').trim();

if (!cleanUrl || !cleanKey) {
  console.error('Error: Clean URL or Key is missing from the environment!');
  process.exit(1);
}

const supabase = createClient(cleanUrl, cleanKey);

const TABLES_TO_TEST = [
  'companies',
  'branches',
  'users',
  'roles',
  'permissions',
  'customers',
  'suppliers',
  'categories',
  'units',
  'products',
  'warehouses',
  'inventory_movements',
  'sales_invoices',
  'sales_invoice_items',
  'purchase_invoices',
  'purchase_invoice_items',
  'accounts',
  'journal_entries',
  'journal_entry_details',
  'treasury',
  'banks',
  'employees',
  'hr',
  'settings',
  'audit_logs',
  'attachments',
  'notifications',
  'print_templates',
  'erp_databases',
  'erp_company_records'
];

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING SYSTEM DATABASE TESTS FOR CLOUD ERP');
  console.log(`📡 URL: ${cleanUrl}`);
  console.log('==================================================\n');

  let successCount = 0;
  let failCount = 0;

  for (const tableName of TABLES_TO_TEST) {
    try {
      const { error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error && error.message.includes('Could not find the table')) {
        console.log(`❌ Table [${tableName}] : NOT FOUND (Missing in Schema Cache)`);
        failCount++;
      } else if (error) {
        console.log(`⚠️ Table [${tableName}] : EXISTS BUT RETURNED ERROR: ${error.message}`);
        successCount++;
      } else {
        console.log(`✅ Table [${tableName}] : EXISTS AND ACCESSIBLE`);
        successCount++;
      }
    } catch (err: any) {
      console.log(`❌ Table [${tableName}] : EXCEPTION: ${err.message || err}`);
      failCount++;
    }
  }

  console.log('\n==================================================');
  console.log(`📊 TEST RESULTS: ${successCount} / ${TABLES_TO_TEST.length} Tables are Available`);
  if (failCount > 0) {
    console.log(`💡 Note: ${failCount} tables are currently not created in Supabase yet.`);
    console.log('To provision them, apply the migration SQL file in the Supabase SQL Editor:');
    console.log('Location: /supabase/migrations/20260704000000_erp_schema.sql');
  } else {
    console.log('🎉 All tables have been created and are successfully accessible!');
  }
  console.log('==================================================');
}

runTests();

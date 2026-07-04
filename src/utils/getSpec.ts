import dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_ANON_KEY || '';

const cleanUrl = rawUrl.replace(/^SUPABASE_URL\s+/, '').trim();
const cleanKey = rawKey.replace(/^SUPABASE_ANON_KEY\s+/, '').trim();

async function getSpec() {
  try {
    const url = `${cleanUrl}/rest/v1/`;
    console.log('Fetching spec from:', url);
    const res = await fetch(url, {
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`
      }
    });
    if (!res.ok) {
      console.error('Failed to fetch spec:', res.status, res.statusText);
      const text = await res.text();
      console.error('Response:', text);
      return;
    }
    const data = await res.json() as any;
    console.log('OpenAPI Spec fetched successfully!');
    console.log('Paths:', Object.keys(data.paths || {}));
    console.log('Definitions:', Object.keys(data.definitions || {}));
  } catch (err: any) {
    console.error('Error fetching OpenAPI spec:', err.message || err);
  }
}

getSpec();

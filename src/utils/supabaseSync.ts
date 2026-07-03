import { supabase } from './supabase';

export interface Company {
  id: string;
  name: string;
  description: string;
  version: string;
  created_at?: string;
}

export interface CompanyRecord {
  id: string;
  company_id: string;
  module: string;
  record_id: string;
  data: any;
  updated_at?: string;
}

// Fallback checking to see if Supabase is reachable and has tables configured
let isSupabaseActive = true;

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('erp_databases').select('id').limit(1);
    if (error) {
      console.warn('Supabase database check returned error, falling back to server disk storage:', error.message);
      isSupabaseActive = false;
      return false;
    }
    isSupabaseActive = true;
    return true;
  } catch (err) {
    console.warn('Supabase is not reachable, falling back to server disk storage:', err);
    isSupabaseActive = false;
    return false;
  }
}

/**
 * Fetch list of companies/databases
 */
export async function fetchDatabases(): Promise<Company[]> {
  try {
    if (isSupabaseActive) {
      const { data, error } = await supabase
        .from('erp_databases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Company[];
      }
    }
  } catch (err) {
    console.error('Error fetching from Supabase, falling back:', err);
  }

  // Fallback to Express backend
  try {
    const res = await fetch('/api/databases');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Backend list databases failed:', err);
  }

  // Fallback to localStorage
  const saved = localStorage.getItem('erp_databases');
  return saved ? JSON.parse(saved) : [];
}

/**
 * Create a new company database
 */
export async function createDatabase(name: string, description: string): Promise<Company> {
  const newCompany: Company = {
    id: `db-${Date.now()}`,
    name,
    description,
    version: '12.0.1'
  };

  try {
    if (isSupabaseActive) {
      const { error } = await supabase
        .from('erp_databases')
        .insert([{ 
          id: newCompany.id, 
          name: newCompany.name, 
          description: newCompany.description, 
          version: newCompany.version 
        }]);

      if (!error) {
        return newCompany;
      } else {
        console.warn('Supabase DB create error:', error.message);
      }
    }
  } catch (err) {
    console.error('Error creating company in Supabase:', err);
  }

  // Fallback to Express backend
  try {
    const res = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Backend database create failed:', err);
  }

  return newCompany;
}

/**
 * Delete a company database
 */
export async function deleteDatabase(id: string): Promise<boolean> {
  try {
    if (isSupabaseActive) {
      // Delete all company records
      await supabase.from('erp_company_records').delete().eq('company_id', id);
      const { error } = await supabase.from('erp_databases').delete().eq('id', id);
      if (!error) return true;
    }
  } catch (err) {
    console.error('Error deleting company from Supabase:', err);
  }

  // Fallback to Express backend
  try {
    const res = await fetch(`/api/databases/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('Backend database delete failed:', err);
  }

  return false;
}

/**
 * Fetch all data records for a specific company
 */
export async function fetchCompanyData(companyId: string): Promise<any> {
  try {
    if (isSupabaseActive) {
      const { data, error } = await supabase
        .from('erp_company_records')
        .select('*')
        .eq('company_id', companyId);

      if (!error && data) {
        // Group raw flat records back into their structured module states
        const result: any = {
          branches: [],
          warehouses: [],
          costCenters: [],
          currencies: [],
          accounts: [],
          customers: [],
          itemGroups: [],
          items: [],
          journalEntries: [],
          invoices: [],
          tasks: [],
          alerts: [],
          users: [],
          loginLogs: [],
          manufacturing: [],
          templates: [],
          settings: {}
        };

        data.forEach((row: any) => {
          const mod = row.module;
          const recordData = row.data;
          
          if (mod === 'settings') {
            result.settings = recordData;
          } else if (result[mod]) {
            result[mod].push(recordData);
          }
        });

        return result;
      } else {
        console.warn('Failed to fetch from Supabase erp_company_records, trying server:', error?.message);
      }
    }
  } catch (err) {
    console.error('Error in fetchCompanyData from Supabase:', err);
  }

  // Fallback to Express backend
  try {
    const res = await fetch(`/api/data/${companyId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Backend company fetch failed:', err);
  }

  return null;
}

/**
 * Save/Upsert a record for a specific module
 */
export async function saveCompanyRecord(companyId: string, module: string, record: any): Promise<boolean> {
  const recordId = record.id || 'settings';
  const rowId = `${companyId}_${module}_${recordId}`;

  try {
    if (isSupabaseActive) {
      const { error } = await supabase
        .from('erp_company_records')
        .upsert({
          id: rowId,
          company_id: companyId,
          module: module,
          record_id: recordId,
          data: record,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        return true;
      } else {
        console.warn('Supabase upsert failed:', error.message);
      }
    }
  } catch (err) {
    console.error('Error saving company record to Supabase:', err);
  }

  // Fallback to Express backend
  try {
    const res = await fetch(`/api/data/${companyId}/${module}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return res.ok;
  } catch (err) {
    console.error('Backend save module failed:', err);
  }

  return false;
}

/**
 * Delete a company record from a module
 */
export async function deleteCompanyRecord(companyId: string, module: string, recordId: string): Promise<boolean> {
  const rowId = `${companyId}_${module}_${recordId}`;

  try {
    if (isSupabaseActive) {
      const { error } = await supabase
        .from('erp_company_records')
        .delete()
        .eq('id', rowId);

      if (!error) return true;
    }
  } catch (err) {
    console.error('Error deleting record from Supabase:', err);
  }

  // Fallback to Express backend
  try {
    const res = await fetch(`/api/data/${companyId}/${module}/${recordId}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('Backend delete record failed:', err);
  }

  return false;
}

/**
 * Subscribe to Real-Time postgres changes in Supabase for a company
 */
export function subscribeToCompanyChanges(companyId: string, onUpdate: (payload: any) => void) {
  if (!isSupabaseActive) return null;

  try {
    const subscription = supabase
      .channel(`realtime:company_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'erp_company_records',
          filter: `company_id=eq.${companyId}`
        },
        (payload: any) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return subscription;
  } catch (err) {
    console.error('Failed to subscribe to realtime Supabase channel:', err);
    return null;
  }
}

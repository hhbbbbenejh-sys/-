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
          units: [],
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

        // 1. Fetch directly from customers table
        try {
          const { data: realCustomers, error: rcError } = await supabase
            .from('customers')
            .select('*')
            .eq('company_id', companyId);

          if (!rcError && realCustomers) {
            const mappedCustomers = realCustomers.map(row => ({
              id: row.id,
              name: row.name,
              phone: row.phone || '',
              address: row.address || '',
              balance: Number(row.balance) || 0,
              accountId: 'acc-112001',
              type: 'customer' as const
            }));

            const nonCustomerTypeRecords = result.customers.filter((c: any) => c.type !== 'customer');
            result.customers = [...nonCustomerTypeRecords, ...mappedCustomers];
          }
        } catch (rcErr) {
          console.error('Error fetching real customers:', rcErr);
        }

        // 2. Fetch directly from suppliers table
        try {
          const { data: realSuppliers, error: rsError } = await supabase
            .from('suppliers')
            .select('*')
            .eq('company_id', companyId);

          if (!rsError && realSuppliers) {
            const mappedSuppliers = realSuppliers.map(row => ({
              id: row.id,
              name: row.name,
              phone: row.phone || '',
              address: row.address || '',
              balance: Number(row.balance) || 0,
              accountId: 'acc-211001',
              type: 'supplier' as const
            }));

            const nonSupplierTypeRecords = result.customers.filter((c: any) => c.type !== 'supplier');
            result.customers = [...nonSupplierTypeRecords, ...mappedSuppliers];
          }
        } catch (rsErr) {
          console.error('Error fetching real suppliers:', rsErr);
        }

        // 3. Fetch directly from branches table
        try {
          const { data: realBranches, error: rbError } = await supabase
            .from('branches')
            .select('*')
            .eq('company_id', companyId);

          if (!rbError && realBranches && realBranches.length > 0) {
            result.branches = realBranches.map(row => ({
              id: row.id,
              name: row.name,
              code: row.code
            }));
          }
        } catch (rbErr) {
          console.error('Error fetching real branches:', rbErr);
        }

        // 4. Fetch directly from warehouses table
        try {
          const { data: realWarehouses, error: rwError } = await supabase
            .from('warehouses')
            .select('*')
            .eq('company_id', companyId);

          if (!rwError && realWarehouses) {
            result.warehouses = realWarehouses.map(row => ({
              id: row.id,
              name: row.name,
              branchId: row.location && row.location.startsWith('branchId:') ? row.location.replace('branchId:', '') : 'br-default'
            }));
          }
        } catch (rwErr) {
          console.error('Error fetching real warehouses:', rwErr);
        }

        // 5. Fetch directly from accounts table
        try {
          const { data: realAccounts, error: raError } = await supabase
            .from('accounts')
            .select('*')
            .eq('company_id', companyId)
            .order('code', { ascending: true });

          if (!raError && realAccounts && realAccounts.length > 0) {
            result.accounts = realAccounts.map(row => ({
              id: row.id,
              code: row.code,
              name: row.name,
              type: row.type as any,
              parentId: row.parent_id,
              balance: Number(row.balance) || 0,
              finalAccount: row.final_account as any
            }));
          }
        } catch (raErr) {
          console.error('Error fetching real accounts:', raErr);
        }

        // 6. Fetch directly from categories table (itemGroups)
        try {
          const { data: realCategories, error: rcatError } = await supabase
            .from('categories')
            .select('*')
            .eq('company_id', companyId);

          if (!rcatError && realCategories) {
            result.itemGroups = realCategories.map(row => ({
              id: row.id,
              name: row.name,
              parentId: row.parent_id
            }));
          }
        } catch (rcatErr) {
          console.error('Error fetching real categories:', rcatErr);
        }

        // 7. Fetch directly from products table (items)
        try {
          const { data: realProducts, error: rpError } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId);

          if (!rpError && realProducts) {
            result.items = realProducts.map(row => ({
              id: row.id,
              code: row.code,
              barcode: row.barcode,
              name: row.name,
              groupId: row.category_id,
              unit: 'حبة',
              purchasePrice: Number(row.purchase_price) || 0,
              salePrice: Number(row.sale_price) || 0,
              initialStock: Number(row.initial_stock) || 0,
              currentStock: Number(row.current_stock) || 0,
              minLimit: Number(row.min_limit) || 0,
              maxLimit: Number(row.max_limit) || 0,
              notes: row.notes || '',
              image: row.image || ''
            }));
          }
        } catch (rpErr) {
          console.error('Error fetching real products:', rpErr);
        }

        // 8. Fetch directly from units table
        try {
          const { data: realUnits, error: runError } = await supabase
            .from('units')
            .select('*')
            .eq('company_id', companyId);

          if (!runError && realUnits) {
            result.units = realUnits.map(row => ({
              id: row.id,
              name: row.name
            }));
          }
        } catch (runErr) {
          console.error('Error fetching real units:', runErr);
        }

        // 9. Fetch directly from journal_entries and details
        try {
          const { data: realJournalEntries, error: rjeError } = await supabase
            .from('journal_entries')
            .select(`
              *,
              journal_entry_details (*)
            `)
            .eq('company_id', companyId);

          if (!rjeError && realJournalEntries && realJournalEntries.length > 0) {
            result.journalEntries = realJournalEntries.map(row => ({
              id: row.id,
              entryNo: row.entry_no,
              date: row.date,
              description: row.description || '',
              posted: row.posted,
              rows: (row.journal_entry_details || []).map((detail: any) => ({
                accountId: detail.account_id,
                debit: Number(detail.debit) || 0,
                credit: Number(detail.credit) || 0,
                notes: detail.notes || ''
              }))
            }));
          }
        } catch (rjeErr) {
          console.error('Error fetching real journal entries:', rjeErr);
        }

        // 10. Fetch sales & purchase invoices
        try {
          const { data: salesData } = await supabase
            .from('sales_invoices')
            .select(`
              *,
              sales_invoice_items (*)
            `)
            .eq('company_id', companyId);
          
          const mappedSales = (salesData || []).map(row => ({
            id: row.id,
            invoiceNo: row.invoice_no,
            type: 'sale' as const,
            date: row.date,
            description: row.description || '',
            branchId: row.branch_id,
            customerId: row.customer_id,
            currencyId: 'cur-1',
            exchangeRate: 1.0,
            paymentMethod: row.payment_method as any,
            warehouseId: row.warehouse_id,
            cashAccountId: 'acc-111001',
            itemsAccountId: 'acc-411001',
            debitCostCenterId: 'cc-1',
            creditCostCenterId: 'cc-2',
            posted: row.posted,
            entryCreated: true,
            items: (row.sales_invoice_items || []).map((item: any) => ({
              id: item.id,
              itemId: item.product_id,
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unit_price) || 0,
              unit: 'حبة',
              notes: item.notes || '',
              total: Number(item.total) || 0
            })),
            discount: Number(row.discount) || 0,
            addition: 0,
            taxPercent: 15,
            expenses: 0,
            netAmount: Number(row.net_amount) || 0,
            paidAmount: Number(row.paid_amount) || 0,
            salesRepId: 'rep-1',
            notes: '',
            auditLogs: [`تم الجلب من قاعدة البيانات سحابياً`]
          }));

          const { data: purchaseData } = await supabase
            .from('purchase_invoices')
            .select(`
              *,
              purchase_invoice_items (*)
            `)
            .eq('company_id', companyId);

          const mappedPurchases = (purchaseData || []).map(row => ({
            id: row.id,
            invoiceNo: row.invoice_no,
            type: 'purchase' as const,
            date: row.date,
            description: row.description || '',
            branchId: row.branch_id,
            customerId: row.supplier_id,
            currencyId: 'cur-1',
            exchangeRate: 1.0,
            paymentMethod: row.payment_method as any,
            warehouseId: row.warehouse_id,
            cashAccountId: 'acc-111001',
            itemsAccountId: 'acc-411001',
            debitCostCenterId: 'cc-1',
            creditCostCenterId: 'cc-2',
            posted: row.posted,
            entryCreated: true,
            items: (row.purchase_invoice_items || []).map((item: any) => ({
              id: item.id,
              itemId: item.product_id,
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unit_price) || 0,
              unit: 'حبة',
              notes: item.notes || '',
              total: Number(item.total) || 0
            })),
            discount: Number(row.discount) || 0,
            addition: 0,
            taxPercent: 15,
            expenses: 0,
            netAmount: Number(row.net_amount) || 0,
            paidAmount: Number(row.paid_amount) || 0,
            salesRepId: 'rep-1',
            notes: '',
            auditLogs: [`تم الجلب من قاعدة البيانات سحابياً`]
          }));

          result.invoices = [...mappedSales, ...mappedPurchases];
        } catch (invErr) {
          console.error('Error fetching real invoices:', invErr);
        }

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
        // Direct table syncing for fully integrated database experience
        if (module === 'customers') {
          try {
            if (record.type === 'customer') {
              await supabase
                .from('customers')
                .upsert({
                  id: record.id,
                  company_id: companyId,
                  name: record.name,
                  phone: record.phone || null,
                  address: record.address || null,
                  balance: Number(record.balance) || 0
                });
            } else if (record.type === 'supplier') {
              await supabase
                .from('suppliers')
                .upsert({
                  id: record.id,
                  company_id: companyId,
                  name: record.name,
                  phone: record.phone || null,
                  address: record.address || null,
                  balance: Number(record.balance) || 0
                });
            }
          } catch (custErr) {
            console.error('Error syncing to real customers/suppliers table:', custErr);
          }
        }

        if (module === 'branches') {
          try {
            await supabase
              .from('branches')
              .upsert({
                id: record.id,
                company_id: companyId,
                name: record.name,
                code: record.code
              });
          } catch (brErr) {
            console.error('Error syncing to real branches table:', brErr);
          }
        }

        if (module === 'warehouses') {
          try {
            await supabase
              .from('warehouses')
              .upsert({
                id: record.id,
                company_id: companyId,
                name: record.name,
                location: record.branchId ? `branchId:${record.branchId}` : null
              });
          } catch (whErr) {
            console.error('Error syncing to real warehouses table:', whErr);
          }
        }

        if (module === 'accounts') {
          try {
            await supabase
              .from('accounts')
              .upsert({
                id: record.id,
                company_id: companyId,
                code: record.code,
                name: record.name,
                type: record.type,
                parent_id: record.parentId || null,
                balance: Number(record.balance) || 0,
                final_account: record.finalAccount || 'balance_sheet'
              });
          } catch (acErr) {
            console.error('Error syncing to real accounts table:', acErr);
          }
        }

        if (module === 'itemGroups') {
          try {
            await supabase
              .from('categories')
              .upsert({
                id: record.id,
                company_id: companyId,
                name: record.name,
                parent_id: record.parentId || null
              });
          } catch (cgErr) {
            console.error('Error syncing category to real table:', cgErr);
          }
        }

        if (module === 'items') {
          try {
            await supabase
              .from('products')
              .upsert({
                id: record.id,
                company_id: companyId,
                category_id: record.groupId || null,
                code: record.code,
                barcode: record.barcode,
                name: record.name,
                purchase_price: Number(record.purchasePrice) || 0,
                sale_price: Number(record.salePrice) || 0,
                initial_stock: Number(record.initialStock) || 0,
                current_stock: Number(record.currentStock) || Number(record.initialStock) || 0,
                min_limit: Number(record.minLimit) || 0,
                max_limit: Number(record.maxLimit) || 0,
                notes: record.notes || null,
                image: record.image || null
              });
          } catch (pErr) {
            console.error('Error syncing product to real table:', pErr);
          }
        }

        if (module === 'units') {
          try {
            await supabase
              .from('units')
              .upsert({
                id: record.id,
                company_id: companyId,
                name: record.name
              });
          } catch (unErr) {
            console.error('Error syncing unit to real table:', unErr);
          }
        }

        if (module === 'journalEntries') {
          try {
            await supabase
              .from('journal_entries')
              .upsert({
                id: record.id,
                company_id: companyId,
                entry_no: record.entryNo,
                date: record.date,
                description: record.description || null,
                posted: record.posted ?? true
              });
            
            // Delete existing details
            await supabase
              .from('journal_entry_details')
              .delete()
              .eq('entry_id', record.id);

            // Insert new details
            const detailRows = (record.rows || []).map((row: any, idx: number) => ({
              id: `${record.id}_${idx}`,
              company_id: companyId,
              entry_id: record.id,
              account_id: row.accountId,
              debit: Number(row.debit) || 0,
              credit: Number(row.credit) || 0,
              notes: row.notes || null
            }));

            if (detailRows.length > 0) {
              await supabase
                .from('journal_entry_details')
                .insert(detailRows);
            }
          } catch (jeErr) {
            console.error('Error syncing journal entry to real tables:', jeErr);
          }
        }

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

      if (!error) {
        if (module === 'customers') {
          try {
            await supabase
              .from('customers')
              .delete()
              .eq('id', recordId);
            await supabase
              .from('suppliers')
              .delete()
              .eq('id', recordId);
          } catch (custErr) {
            console.error('Error deleting from real customers table:', custErr);
          }
        }

        if (module === 'branches') {
          try {
            await supabase
              .from('branches')
              .delete()
              .eq('id', recordId);
          } catch (brErr) {
            console.error('Error deleting from real branches table:', brErr);
          }
        }

        if (module === 'warehouses') {
          try {
            await supabase
              .from('warehouses')
              .delete()
              .eq('id', recordId);
          } catch (whErr) {
            console.error('Error deleting from real warehouses table:', whErr);
          }
        }

        if (module === 'accounts') {
          try {
            await supabase
              .from('accounts')
              .delete()
              .eq('id', recordId);
          } catch (acErr) {
            console.error('Error deleting account:', acErr);
          }
        }

        if (module === 'itemGroups') {
          try {
            await supabase
              .from('categories')
              .delete()
              .eq('id', recordId);
          } catch (cgErr) {
            console.error('Error deleting category:', cgErr);
          }
        }

        if (module === 'items') {
          try {
            await supabase
              .from('products')
              .delete()
              .eq('id', recordId);
          } catch (pErr) {
            console.error('Error deleting product:', pErr);
          }
        }

        if (module === 'units') {
          try {
            await supabase
              .from('units')
              .delete()
              .eq('id', recordId);
          } catch (unErr) {
            console.error('Error deleting unit:', unErr);
          }
        }

        if (module === 'journalEntries') {
          try {
            await supabase
              .from('journal_entries')
              .delete()
              .eq('id', recordId);
          } catch (jeErr) {
            console.error('Error deleting journal entry:', jeErr);
          }
        }

        return true;
      }
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

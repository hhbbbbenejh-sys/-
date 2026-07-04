import React, { useState, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { 
  Users, Plus, Check, Trash2, Edit3, Search, X, Loader2, Phone, MapPin, DollarSign 
} from 'lucide-react';
import { Customer } from '../../types/erp';

interface CustomersWindowProps {
  windowId: string;
  onClose: () => void;
}

export const CustomersWindow: React.FC<CustomersWindowProps> = ({ windowId, onClose }) => {
  const { 
    customers, 
    addCustomer, 
    deleteCustomer, 
    setCustomers,
    connectedDbId, 
    showToast 
  } = useErp();

  // Form states
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<number>(0);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Fetch all customers directly from Supabase customers table
  const fetchCustomersFromDb = useCallback(async (query = '') => {
    if (!connectedDbId) return;
    setLoading(true);

    try {
      // Direct query to Supabase customers table
      let supabaseQuery = supabase
        .from('customers')
        .select('*')
        .eq('company_id', connectedDbId);

      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
      }

      const { data, error } = await supabaseQuery.order('created_at', { ascending: false });

      if (error) {
        // Table may not exist or permission denied
        console.warn('Supabase customers table query error:', error.message);
        setIsUsingSupabase(false);
        
        // Fall back to context state
        const filtered = customers.filter(c => 
          c.name.toLowerCase().includes(query.toLowerCase()) || 
          (c.phone && c.phone.includes(query))
        );
        setDbCustomers(filtered);
      } else {
        setIsUsingSupabase(true);
        const mapped: Customer[] = (data || []).map(row => ({
          id: row.id,
          name: row.name,
          phone: row.phone || '',
          address: row.address || '',
          balance: Number(row.balance) || 0,
          accountId: 'acc-112001', // Local asset accounts reference
          type: 'customer'
        }));
        setDbCustomers(mapped);

        // Keep local context synced with real DB (only if doing a full, non-filtered fetch)
        if (!query.trim()) {
          setCustomers(prev => {
            const nonDbCustomers = prev.filter(c => c.type !== 'customer');
            return [...nonDbCustomers, ...mapped];
          });
        }
      }
    } catch (err: any) {
      console.error('Exception fetching customers:', err);
      setIsUsingSupabase(false);
      // Fall back
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        (c.phone && c.phone.includes(query))
      );
      setDbCustomers(filtered);
    } finally {
      setLoading(false);
    }
  }, [connectedDbId, customers, setCustomers]);

  // Initial load
  useEffect(() => {
    fetchCustomersFromDb();
  }, [connectedDbId]);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomersFromDb(searchQuery);
  };

  // Real-time search as user types
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomersFromDb(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Reset form to "New" state
  const handleNew = () => {
    setSelectedId(null);
    setName('');
    setPhone('');
    AddressAndBalanceReset();
  };

  const AddressAndBalanceReset = () => {
    setAddress('');
    setBalance(0);
  };

  // Edit action
  const handleEdit = (cust: Customer) => {
    setSelectedId(cust.id);
    setName(cust.name);
    setPhone(cust.phone || '');
    setAddress(cust.address || '');
    setBalance(cust.balance || 0);
  };

  // Validate inputs
  const validateForm = (): boolean => {
    if (!name.trim()) {
      showToast('يرجى إدخال اسم العميل بالكامل.', 'warning');
      return false;
    }
    if (name.trim().length < 3) {
      showToast('يجب أن يحتوي اسم العميل على 3 أحروف على الأقل.', 'warning');
      return false;
    }
    if (phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      showToast('يرجى إدخال رقم هاتف صحيح أو تركه فارغاً.', 'warning');
      return false;
    }
    return true;
  };

  // Save / Update customer
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!connectedDbId) {
      showToast('عذراً، يجب أن تكون متصلاً بقاعدة بيانات نشطة لحفظ العميل.', 'error');
      return;
    }

    setSaving(true);
    const customerId = selectedId || `cust-${Date.now()}`;
    const newCust: Customer = {
      id: customerId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      balance: Number(balance) || 0,
      accountId: 'acc-112001',
      type: 'customer'
    };

    try {
      // 1. Save directly to Supabase customers table
      const { error } = await supabase
        .from('customers')
        .upsert({
          id: customerId,
          company_id: connectedDbId,
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          balance: Number(balance) || 0
        });

      if (error) {
        throw new Error(error.message);
      }

      // 2. Also save to company records fallback for redundancy
      addCustomer(newCust);

      showToast(
        selectedId 
          ? `تم تحديث بيانات العميل "${name}" بنجاح في قاعدة البيانات.` 
          : `تم إضافة العميل الجديد "${name}" بنجاح لقاعدة البيانات الحقيقية.`, 
        'success'
      );

      // Refresh list
      fetchCustomersFromDb(searchQuery);
      handleNew();
    } catch (err: any) {
      console.error('Save customer error:', err);
      
      // Fallback
      addCustomer(newCust);
      showToast(`تم الحفظ في مخزن المزامنة المحلي كنسخة احتياطية: ${err.message || err}`, 'info');
      fetchCustomersFromDb(searchQuery);
      handleNew();
    } finally {
      setSaving(false);
    }
  };

  // Delete customer
  const handleDelete = async (cust: Customer) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف العميل "${cust.name}" نهائياً من قاعدة البيانات؟`)) {
      return;
    }

    try {
      // 1. Delete directly from Supabase customers table
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', cust.id);

      if (error) {
        throw new Error(error.message);
      }

      // 2. Remove from local states
      deleteCustomer(cust.id);

      showToast(`تم حذف العميل "${cust.name}" بنجاح ومزامنته سحابياً.`, 'success');
      
      if (selectedId === cust.id) {
        handleNew();
      }
      fetchCustomersFromDb(searchQuery);
    } catch (err: any) {
      console.error('Delete customer error:', err);
      
      // Fallback delete
      deleteCustomer(cust.id);
      showToast(`تم إزالة العميل من الذاكرة المحلية والمخزن الاحتياطي.`, 'success');
      if (selectedId === cust.id) {
        handleNew();
      }
      fetchCustomersFromDb(searchQuery);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      
      {/* Sub header showing connection status */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>إدارة وتدقيق بطاقات العملاء المباشرة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isUsingSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span>{isUsingSupabase ? 'قاعدة بيانات Supabase نشطة (حقيقي)' : 'وضع المزامنة الاحتياطي نشط'}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Right Panel: Customers List (Master) */}
        <div className="w-[60%] border-l border-slate-300 flex flex-col overflow-hidden bg-white">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 pr-8 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>تحديث</span>
            </button>
          </form>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-bold">جاري تحميل بيانات العملاء...</span>
              </div>
            ) : dbCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center space-y-1">
                <Users className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-500">لا يوجد عملاء حالياً</span>
                <span className="text-[10px] text-slate-400">ابدأ بإدخال عميل جديد وحفظه في النظام من النموذج الأيمن.</span>
              </div>
            ) : (
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">اسم العميل بالكامل</th>
                    <th className="p-3">الهاتف والجوال</th>
                    <th className="p-3">العنوان الجغرافي</th>
                    <th className="p-3 text-left">الرصيد المالي</th>
                    <th className="p-3 text-center w-[90px]">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbCustomers.map(cust => (
                    <tr 
                      key={cust.id} 
                      className={`hover:bg-blue-50/40 transition-colors ${selectedId === cust.id ? 'bg-blue-50/70 font-semibold' : ''}`}
                    >
                      <td className="p-3 font-bold text-slate-800">{cust.name}</td>
                      <td className="p-3 font-mono text-slate-600">{cust.phone || '—'}</td>
                      <td className="p-3 text-slate-500 max-w-[150px] truncate">{cust.address || '—'}</td>
                      <td className="p-3 font-mono text-left text-blue-700 font-bold">
                        {(cust.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(cust)}
                            title="تعديل"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust)}
                            title="حذف"
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t text-[10px] text-slate-400 font-bold flex justify-between">
            <span>إجمالي العملاء: {dbCustomers.length} عميل</span>
            <span>طرق الدفع: حسابات آجلة ونقدية مدمجة</span>
          </div>
        </div>

        {/* Left Panel: Create / Edit Form (Detail) */}
        <div className="w-[40%] flex flex-col justify-between bg-slate-50/50">
          <form onSubmit={handleSave} className="p-5 space-y-4 flex-1 overflow-y-auto">
            
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{selectedId ? 'تعديل وتحديث بيانات العميل' : 'إدخال بطاقة عميل جديد'}</span>
              </h4>

              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">اسم العميل / المؤسسة بالكامل: *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: شركة النخبة للتوريدات المحدودة"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Client Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">رقم الهاتف أو الجوال:</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="مثال: 0501234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 pl-8 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none text-left"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Client Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">العنوان والفرع الجغرافي الرئيسي:</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="مثال: الرياض - طريق الملك فهد - مبنى 40"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 pl-8 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Opening Balance */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">الرصيد المالي الابتدائي (رصيد افتتاحي):</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={balance || ''}
                    onChange={e => setBalance(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 pl-8 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none text-left"
                  />
                  <span className="text-[10px] text-slate-400 absolute left-2.5 top-2">ر.س</span>
                </div>
              </div>
            </div>

            {/* Hint Notice */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md text-[10.5px] leading-relaxed text-blue-800">
              * متاح للمبيعات المباشرة والآجلة: بمجرد حفظ هذا العميل، ستجده متاحاً للاختيار الفوري في شاشة فواتير المبيعات، مرتجعات المبيعات، ومصممي التقارير وكشوفات الحساب.
            </div>

          </form>

          {/* Form Actions footer */}
          <div className="p-4 border-t border-slate-200 bg-white flex justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={handleNew}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-3.5 py-1.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>جديد</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-3.5 py-1.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs px-4 py-1.5 rounded font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>حفظ البيانات</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

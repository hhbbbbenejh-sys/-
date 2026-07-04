import React, { useState, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { 
  Landmark, Wallet, Plus, Trash2, Edit3, Check, X, Search, Loader2, Database, DollarSign, Building
} from 'lucide-react';

interface TreasuryBanksWindowProps {
  windowId: string;
  onClose: () => void;
}

export const TreasuryBanksWindow: React.FC<TreasuryBanksWindowProps> = ({ onClose }) => {
  const { connectedDbId, showToast, branches } = useErp();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'treasury' | 'banks'>('treasury');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Loading
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lists
  const [treasuries, setTreasuries] = useState<any[]>([]);
  const [banksList, setBanksList] = useState<any[]>([]);

  // Form states for Treasuries
  const [tName, setTName] = useState('');
  const [tBranchId, setTBranchId] = useState('');
  const [tBalance, setTBalance] = useState<number>(0);
  const [editingTId, setEditingTId] = useState<string | null>(null);

  // Form states for Banks
  const [bName, setBName] = useState('');
  const [bAccountNo, setBAccountNo] = useState('');
  const [bBalance, setBBalance] = useState<number>(0);
  const [editingBId, setEditingBId] = useState<string | null>(null);

  // Fetch treasuries & banks
  const fetchData = useCallback(async () => {
    if (!connectedDbId) return;
    setLoading(true);

    try {
      const treasuriesResponse = await supabase
        .from('treasury')
        .select('*')
        .eq('company_id', connectedDbId);

      const banksResponse = await supabase
        .from('banks')
        .select('*')
        .eq('company_id', connectedDbId);

      if (treasuriesResponse.error) throw treasuriesResponse.error;
      if (banksResponse.error) throw banksResponse.error;

      setTreasuries(treasuriesResponse.data || []);
      setBanksList(banksResponse.data || []);
    } catch (err: any) {
      console.error('Error fetching treasury/banks:', err);
      showToast(`خطأ أثناء تحميل البيانات: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [connectedDbId]);

  useEffect(() => {
    fetchData();
    if (branches.length > 0 && !tBranchId) {
      setTBranchId(branches[0].id);
    }
  }, [connectedDbId, branches]);

  // Handle Treasury Save/Update
  const handleSaveTreasury = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) {
      showToast('يرجى تحديد اسم الخزينة.', 'warning');
      return;
    }
    if (!tBranchId) {
      showToast('يرجى تحديد الفرع الإداري التابع له الخزينة.', 'warning');
      return;
    }
    if (tBalance < 0) {
      showToast('لا يمكن للرصيد الافتتاحي أن يكون سالباً.', 'warning');
      return;
    }

    setSaving(true);
    const targetId = editingTId || `tr-${Date.now()}`;
    const record = {
      id: targetId,
      company_id: connectedDbId,
      branch_id: tBranchId,
      name: tName.trim(),
      balance: Number(tBalance) || 0
    };

    try {
      const { error } = await supabase
        .from('treasury')
        .upsert(record);

      if (error) throw error;

      showToast(editingTId ? 'تم تحديث بيانات الخزينة بنجاح.' : 'تم إضافة الخزينة النقدية الجديدة بنجاح.', 'success');
      setTName('');
      setTBalance(0);
      setEditingTId(null);
      fetchData();
    } catch (err: any) {
      console.error('Error saving treasury:', err);
      showToast(`فشل حفظ الخزينة: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Bank Save/Update
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) {
      showToast('يرجى كتابة اسم البنك بالكامل.', 'warning');
      return;
    }
    if (!bAccountNo.trim()) {
      showToast('يرجى إدخال رقم الحساب البنكي / الآيبان (IBAN).', 'warning');
      return;
    }
    if (bBalance < 0) {
      showToast('لا يمكن للرصيد الافتتاحي أن يكون سالباً.', 'warning');
      return;
    }

    setSaving(true);
    const targetId = editingBId || `bnk-${Date.now()}`;
    const record = {
      id: targetId,
      company_id: connectedDbId,
      name: bName.trim(),
      account_no: bAccountNo.trim(),
      balance: Number(bBalance) || 0
    };

    try {
      const { error } = await supabase
        .from('banks')
        .upsert(record);

      if (error) throw error;

      showToast(editingBId ? 'تم تحديث بيانات الحساب البنكي.' : 'تم تسجيل الحساب البنكي الجديد بنجاح.', 'success');
      setBName('');
      setBAccountNo('');
      setBBalance(0);
      setEditingBId(null);
      fetchData();
    } catch (err: any) {
      console.error('Error saving bank:', err);
      showToast(`فشل حفظ البنك: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Treasury
  const handleDeleteTreasury = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف الصندوق/الخزينة "${name}" نهائياً من الدفاتر؟`)) return;

    try {
      const { error } = await supabase
        .from('treasury')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast(`تم حذف الخزينة "${name}" ومزامنتها بنجاح.`, 'success');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting treasury:', err);
      showToast(`فشل حذف الخزينة: ${err.message}`, 'error');
    }
  };

  // Delete Bank
  const handleDeleteBank = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إزالة الحساب البنكي "${name}" نهائياً؟`)) return;

    try {
      const { error } = await supabase
        .from('banks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast(`تم حذف الحساب البنكي "${name}" بنجاح.`, 'success');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting bank:', err);
      showToast(`فشل حذف الحساب البنكي: ${err.message}`, 'error');
    }
  };

  // Filters
  const filteredTreasuries = treasuries.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBanks = banksList.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.account_no.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      
      {/* Database sync bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-blue-600" />
          <span>إدارة الخزائن النقدية والمحافظ البنكية</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>مزامنة Supabase نشطة (خزائن وبنوك حقيقية)</span>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="bg-white border-b border-slate-200 px-4 flex gap-4 shrink-0">
        <button
          onClick={() => { setActiveSubTab('treasury'); setSearchTerm(''); }}
          className={`py-2 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'treasury' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>الخزائن والصناديق النقدية ({treasuries.length})</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('banks'); setSearchTerm(''); }}
          className={`py-2 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'banks' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>الحسابات والمحافظ البنكية ({banksList.length})</span>
        </button>
      </div>

      <div className="p-4 flex-1 flex gap-4 overflow-hidden">
        {/* Left Side: List view & search */}
        <div className="w-2/3 flex flex-col h-full bg-white border rounded-lg p-3 overflow-hidden shadow-xs">
          <div className="relative shrink-0 mb-3">
            <Search className="absolute right-3 top-2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={activeSubTab === 'treasury' ? 'ابحث باسم الخزينة النقدية...' : 'ابحث باسم البنك أو رقم الحساب...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pr-9 pl-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-100 rounded-md">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs font-bold">جاري تحميل البيانات...</span>
              </div>
            ) : activeSubTab === 'treasury' ? (
              filteredTreasuries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-xs">
                  لا توجد صناديق نقدية معرفة حالياً.
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 font-bold">
                      <th className="px-3 py-2">اسم الخزينة / الصندوق</th>
                      <th className="px-3 py-2">الفرع الإداري</th>
                      <th className="px-3 py-2 text-left">الرصيد الدفتري الحالي</th>
                      <th className="px-3 py-2 w-16 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTreasuries.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-700">{t.name}</td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {branches.find(b => b.id === t.branch_id)?.name || 'الفرع الرئيسي'}
                        </td>
                        <td className="px-3 py-2.5 text-left font-mono font-extrabold text-blue-700">
                          {Number(t.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingTId(t.id);
                                setTName(t.name);
                                setTBranchId(t.branch_id);
                                setTBalance(Number(t.balance));
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTreasury(t.id, t.name)}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              filteredBanks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-xs">
                  لا توجد حسابات بنكية مسجلة حالياً.
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 font-bold">
                      <th className="px-3 py-2">اسم البنك / المصرف</th>
                      <th className="px-3 py-2">رقم الحساب / الآيبان</th>
                      <th className="px-3 py-2 text-left">الرصيد الدفتري الحالي</th>
                      <th className="px-3 py-2 w-16 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBanks.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-700">{b.name}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-500">{b.account_no}</td>
                        <td className="px-3 py-2.5 text-left font-mono font-extrabold text-emerald-700">
                          {Number(b.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingBId(b.id);
                                setBName(b.name);
                                setBAccountNo(b.account_no);
                                setBBalance(Number(b.balance));
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBank(b.id, b.name)}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

        {/* Right Side: Form details */}
        <div className="w-1/3 bg-white border rounded-lg p-4 shadow-xs h-fit space-y-3.5">
          {activeSubTab === 'treasury' ? (
            <>
              <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1 border-b pb-1.5 shrink-0">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>{editingTId ? 'تعديل بيانات الخزينة النقدية' : 'إضافة خزينة نقدية جديدة'}</span>
              </h4>

              <form onSubmit={handleSaveTreasury} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">اسم الخزينة / الصندوق: *</label>
                  <input 
                    type="text" 
                    required
                    value={tName}
                    onChange={e => setTName(e.target.value)}
                    placeholder="e.g. صندوق المبيعات الرئيسي"
                    className="w-full text-xs p-2 bg-slate-50 border rounded font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">الفرع الإداري التابع له: *</label>
                  <select 
                    value={tBranchId}
                    onChange={e => setTBranchId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border rounded font-bold focus:outline-none"
                  >
                    <option value="">-- اختر فرع --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono">الرصيد الافتتاحي (ر.س):</label>
                  <input 
                    type="number" 
                    value={tBalance || ''}
                    disabled={!!editingTId}
                    onChange={e => setTBalance(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-slate-50 border rounded font-mono font-bold text-left disabled:bg-slate-100"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{editingTId ? 'حفظ التعديلات' : 'إنشاء الخزينة النقدية'}</span>
                </button>

                {editingTId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingTId(null);
                      setTName('');
                      setTBalance(0);
                    }}
                    className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition-all"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </form>
            </>
          ) : (
            <>
              <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1 border-b pb-1.5 shrink-0">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>{editingBId ? 'تعديل الحساب البنكي' : 'إضافة حساب بنكي جديد'}</span>
              </h4>

              <form onSubmit={handleSaveBank} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">اسم المصرف / البنك: *</label>
                  <input 
                    type="text" 
                    required
                    value={bName}
                    onChange={e => setBName(e.target.value)}
                    placeholder="e.g. مصرف الراجحي"
                    className="w-full text-xs p-2 bg-slate-50 border rounded font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">رقم الحساب أو الآيبان (IBAN): *</label>
                  <input 
                    type="text" 
                    required
                    value={bAccountNo}
                    onChange={e => setBAccountNo(e.target.value)}
                    placeholder="SAxxxxxxxxxxxxxxxxxxxx"
                    className="w-full text-xs p-2 bg-slate-50 border rounded font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">الرصيد الافتتاحي (ر.س):</label>
                  <input 
                    type="number" 
                    value={bBalance || ''}
                    disabled={!!editingBId}
                    onChange={e => setBBalance(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-slate-50 border rounded font-mono font-bold text-left disabled:bg-slate-100"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{editingBId ? 'حفظ التعديلات' : 'تسجيل الحساب البنكي'}</span>
                </button>

                {editingBId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingBId(null);
                      setBName('');
                      setBAccountNo('');
                      setBBalance(0);
                    }}
                    className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition-all"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer close */}
      <div className="p-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
        <button 
          onClick={onClose}
          className="px-5 py-1.5 bg-slate-800 text-white font-bold text-xs rounded transition-colors cursor-pointer"
        >
          إغلاق النافذة
        </button>
      </div>

    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { Landmark, Search, Folder, FolderOpen, FileText, Plus, Edit3, Trash2, Loader2, Database } from 'lucide-react';
import { Account } from '../../types/erp';

export const ChartOfAccountsWindow: React.FC<{ windowId: string; onClose: () => void }> = ({ onClose }) => {
  const { accounts, setAccounts, openWindow, connectedDbId, showToast } = useErp();
  const [searchTerm, setSearchTerm] = useState('');

  // UI Status
  const [loading, setLoading] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Expand states for roots
  const [expandedCats, setExpandedCats] = useState<{ [key: string]: boolean }>({
    assets: true,
    liabilities: true,
    equity: true,
    revenues: true,
    expenses: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const categories = [
    { key: 'assets', label: 'الأصول والموجودات (1)', color: 'text-blue-600 font-bold' },
    { key: 'liabilities', label: 'الالتزامات والخصوم (2)', color: 'text-red-600 font-bold' },
    { key: 'equity', label: 'حقوق الملكية ورأس المال (3)', color: 'text-purple-600 font-bold' },
    { key: 'revenues', label: 'الإيرادات والمبيعات (4)', color: 'text-emerald-600 font-bold' },
    { key: 'expenses', label: 'المصاريف والمشتريات (5)', color: 'text-amber-600 font-bold' },
  ];

  // Fetch accounts directly from Supabase
  const fetchAccounts = useCallback(async () => {
    if (!connectedDbId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', connectedDbId)
        .order('code', { ascending: true });

      if (error) throw error;

      setIsUsingSupabase(true);

      const mapped: Account[] = (data || []).map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type as any,
        parentId: row.parent_id,
        balance: Number(row.balance) || 0,
        finalAccount: row.final_account as any
      }));

      setAccounts(mapped);
    } catch (err: any) {
      console.warn('Supabase accounts query failed, falling back to offline context:', err.message);
      setIsUsingSupabase(false);
    } finally {
      setLoading(false);
    }
  }, [connectedDbId, setAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [connectedDbId]);

  // Delete Account
  const handleDeleteAccount = async (id: string, code: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف الحساب المالي "${name}" (${code}) نهائياً؟`)) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== id));
      showToast(`تم حذف الحساب المالي "${name}" بنجاح ومزامنة شجرة الحسابات.`, 'success');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      showToast(`فشل حذف الحساب المالي: ${err.message}`, 'error');
    }
  };

  // Filter accounts locally based on search
  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.code.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      
      {/* Top connection status bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-blue-600" />
          <span>شجرة الحسابات والدليل المحاسبي المنظم</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isUsingSupabase ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span>{isUsingSupabase ? 'مزامنة Supabase نشطة' : 'وضع المزامنة الاحتياطي'}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Top search & refresh */}
        <div className="space-y-3 shrink-0 mb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="ابحث برقم الحساب أو اسم الحساب المالي..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md pr-9 pl-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <button
              onClick={fetchAccounts}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 font-bold text-xs rounded transition-all cursor-pointer"
            >
              تحديث الدليل
            </button>

            <button 
              onClick={() => openWindow('account_card', 'بطاقة حساب جديدة')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Main Tree Panel */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white p-3 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1.5">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-bold">جاري تحميل شجرة الحسابات...</span>
            </div>
          ) : (
            categories.map(cat => {
              const catAccounts = filteredAccounts.filter(acc => acc.type === cat.key);
              const isExpanded = expandedCats[cat.key];

              return (
                <div key={cat.key} className="space-y-1">
                  <button 
                    onClick={() => toggleCategory(cat.key)}
                    className="w-full text-right p-1.5 hover:bg-slate-50 rounded flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    {isExpanded ? (
                      <FolderOpen className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                    ) : (
                      <Folder className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    )}
                    <span className={`text-xs ${cat.color}`}>{cat.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono mr-auto font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                      {catAccounts.length} حساب
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="pr-4 border-r border-dashed border-slate-200 space-y-1.5 pt-0.5 pb-2.5">
                      {catAccounts.length === 0 ? (
                        <span className="text-[10.5px] text-slate-400 block pr-6 italic">لا يوجد حسابات مطابقة</span>
                      ) : (
                        catAccounts.map(acc => (
                          <div 
                            key={acc.id}
                            className="group/acc flex items-center justify-between p-1.5 hover:bg-blue-50/30 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-500 text-xs font-semibold">{acc.code}</span>
                              <span className="text-xs font-bold text-slate-700">{acc.name}</span>
                              {acc.parentId && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded-xs font-semibold">حساب فرعي</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-[11.5px] text-slate-800 text-left bg-slate-50 border px-2 py-0.5 rounded-sm min-w-[100px]">
                                {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[9.5px] text-slate-400">ر.س</span>
                              </span>
                              
                              <div className="invisible group-hover/acc:visible flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => openWindow('account_card', 'تعديل الحساب المالي', { accountId: acc.id })}
                                  title="تعديل الحساب"
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAccount(acc.id, acc.code, acc.name)}
                                  title="حذف الحساب"
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded transition-all cursor-pointer"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { Landmark, Plus, Check, X, FileText, BarChart3, Loader2 } from 'lucide-react';
import { Account } from '../../types/erp';

interface AccountCardWindowProps {
  windowId: string;
  onClose: () => void;
  accountId?: string; // For edit mode
}

export const AccountCardWindow: React.FC<AccountCardWindowProps> = ({ windowId, onClose, accountId }) => {
  const { accounts, setAccounts, addAccount, connectedDbId, showToast } = useErp();

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'assets' | 'liabilities' | 'equity' | 'revenues' | 'expenses'>('assets');
  const [parentId, setParentId] = useState<string>('');
  const [finalAccount, setFinalAccount] = useState<'balance_sheet' | 'income_statement' | 'trading'>('balance_sheet');
  const [initialBalance, setInitialBalance] = useState<number>(0);

  // UI Status
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load account if in EDIT mode
  useEffect(() => {
    async function loadAccount() {
      if (!accountId || !connectedDbId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (!error && data) {
          setCode(data.code || '');
          setName(data.name || '');
          setType(data.type as any);
          setParentId(data.parent_id || '');
          setFinalAccount(data.final_account as any);
          setInitialBalance(Number(data.balance) || 0);
        }
      } catch (err) {
        console.error('Error loading account details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAccount();
  }, [accountId, connectedDbId]);

  const validateForm = (): boolean => {
    if (!code.trim()) {
      showToast('يرجى كتابة رقم الحساب (الترميز المالي).', 'warning');
      return false;
    }
    if (!name.trim()) {
      showToast('يرجى كتابة اسم الحساب بالكامل.', 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!connectedDbId) {
      showToast('يجب الاتصال بقاعدة البيانات لحفظ الحسابات المزدوجة.', 'error');
      return;
    }

    setSaving(true);
    const targetId = accountId || `acc-${Date.now()}`;

    // Verify duplicate codes (only for new accounts)
    if (!accountId) {
      const codeExists = accounts.some(acc => acc.code === code.trim());
      if (codeExists) {
        showToast(`رقم الحساب "${code}" معرف مسبقاً لحساب آخر. يرجى اختيار رمز حساب فريد.`, 'error');
        setSaving(false);
        return;
      }
    }

    const accountRecord = {
      id: targetId,
      company_id: connectedDbId,
      code: code.trim(),
      name: name.trim(),
      type,
      parent_id: parentId || null,
      balance: Number(initialBalance) || 0,
      final_account: finalAccount
    };

    try {
      const { error } = await supabase
        .from('accounts')
        .upsert(accountRecord);

      if (error) throw error;

      const mappedAccount: Account = {
        id: targetId,
        code: code.trim(),
        name: name.trim(),
        type,
        parentId: parentId || null,
        balance: Number(initialBalance),
        finalAccount
      };

      if (accountId) {
        setAccounts(prev => prev.map(acc => acc.id === accountId ? mappedAccount : acc));
      } else {
        addAccount(mappedAccount);
      }

      showToast(
        accountId 
          ? `تم تحديث الحساب المالي "${name}" بنجاح.` 
          : `تم إنشاء كرت الحساب المالي الجديد "${name}" وحفظه سحابياً.`, 
        'success'
      );

      onClose();
    } catch (err: any) {
      console.error('Error saving account:', err);
      showToast(`فشل حفظ بطاقة الحساب: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-xs font-bold">جاري تحميل بطاقة الحساب...</span>
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span>{accountId ? 'تعديل معلومات الحساب المالي' : 'المعلومات الأساسية للحساب المالي'}</span>
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Account Code */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">رقم الحساب (الترميز المالي): *</label>
              <input 
                type="text" 
                required
                placeholder="مثال: 111005"
                value={code}
                disabled={!!accountId} // Disable editing code in edit mode to prevent breaking transactions
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            {/* Account Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">اسم الحساب (عربي): *</label>
              <input 
                type="text" 
                required
                placeholder="مثال: صندوق فرع جدة الفرعي"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">تصنيف الحساب:</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
              >
                <option value="assets">الأصول (Assets)</option>
                <option value="liabilities">الالتزامات (Liabilities)</option>
                <option value="equity">حقوق الملكية (Equity)</option>
                <option value="revenues">الإيرادات (Revenues)</option>
                <option value="expenses">المصاريف (Expenses)</option>
              </select>
            </div>

            {/* Parent Account */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">تابع للحساب الرئيسي (الأب):</label>
              <select 
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">حساب رئيسي مستقل (جذر)</option>
                {accounts.filter(acc => acc.id !== accountId).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Final Account */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">نوع الإغلاق والتقرير الختامي:</label>
              <select 
                value={finalAccount}
                onChange={e => setFinalAccount(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
              >
                <option value="balance_sheet">الميزانية العمومية (Balance Sheet)</option>
                <option value="income_statement">بيان الدخل والأرباح (Income Statement)</option>
                <option value="trading">حساب المتاجرة ومخزون المبيعات (Trading)</option>
              </select>
            </div>

            {/* Initial Balance */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">الرصيد الافتتاحي المقيد:</label>
              <input 
                type="number" 
                placeholder="0"
                value={initialBalance || ''}
                disabled={!!accountId} // Prevent editing balance directly here in edit mode
                onChange={e => setInitialBalance(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none text-left disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Informative notice */}
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md text-[11px] leading-relaxed text-blue-800">
          * ترحيل محاسبي تلقائي: بمجرد إدراج هذا الحساب وتخصيص رصيده، سيقوم البرنامج بإدراجه في ميزان المراجعة وتوليد قيد يومية تلقائي مرحل بقيمة الرصيد المذكور.
        </div>
      </form>

      <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 shrink-0">
        <button 
          type="button" 
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          إلغاء الأمر
        </button>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>{accountId ? 'تحديث بطاقة الحساب' : 'حفظ بطاقة الحساب (F2)'}</span>
        </button>
      </div>
    </div>
  );
};

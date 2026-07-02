import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Landmark, Plus, Check, X, FileText, BarChart3 } from 'lucide-react';
import { Account } from '../../types/erp';

export const AccountCardWindow: React.FC<{ windowId: string; onClose: () => void }> = ({ windowId, onClose }) => {
  const { accounts, addAccount, showToast } = useErp();

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'assets' | 'liabilities' | 'equity' | 'revenues' | 'expenses'>('assets');
  const [parentId, setParentId] = useState<string>('');
  const [finalAccount, setFinalAccount] = useState<'balance_sheet' | 'income_statement' | 'trading'>('balance_sheet');
  const [initialBalance, setInitialBalance] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      showToast('يرجى كتابة رمز الحساب واسمه بالكامل.', 'warning');
      return;
    }

    // Check if code already exists
    const codeExists = accounts.some(acc => acc.code === code);
    if (codeExists) {
      showToast(`رقم الحساب "${code}" معرف مسبقاً لحساب آخر. يرجى اختيار رمز حساب فريد.`, 'error');
      return;
    }

    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      code,
      name,
      type,
      parentId: parentId || null,
      balance: initialBalance,
      finalAccount,
    };

    addAccount(newAccount);
    showToast(`تم بنجاح حفظ بطاقة الحساب: ${name} (${code}) وإضافته لدليل الحسابات.`, 'success');
    
    // Reset or close
    setCode('');
    setName('');
    setInitialBalance(0);
  };

  return (
    <div className="p-5 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none">
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs space-y-4">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span>المعلومات الأساسية للحساب المالي</span>
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
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                {accounts.map(acc => (
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
                onChange={e => setInitialBalance(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none text-left"
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
          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-xs font-bold transition-colors cursor-pointer"
        >
          إلغاء الأمر
        </button>
        <button 
          onClick={handleSubmit}
          className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Check className="w-4 h-4" />
          <span>حفظ بطاقة الحساب (F2)</span>
        </button>
      </div>
    </div>
  );
};

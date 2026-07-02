import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { FileText, Plus, Trash2, Check, X, Printer, AlertCircle } from 'lucide-react';
import { JournalEntry, JournalEntryRow } from '../../types/erp';

export const JournalEntryWindow: React.FC<{ isOpening?: boolean; windowId: string; onClose: () => void }> = ({ isOpening = false, onClose }) => {
  const { accounts, costCenters, addJournalEntry, showToast } = useErp();

  const [entryNo, setEntryNo] = useState(() => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  });
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(isOpening ? 'القيد الافتتاحي للعام المالي الجديد' : 'قيد تسوية يومي');
  
  const [rows, setRows] = useState<JournalEntryRow[]>([
    { accountId: accounts[0]?.id || '', debit: 0, credit: 0, costCenterId: null, notes: '' },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 0, costCenterId: null, notes: '' },
  ]);

  const handleAddRow = () => {
    setRows(prev => [...prev, { accountId: accounts[0]?.id || '', debit: 0, credit: 0, costCenterId: null, notes: '' }]);
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 2) {
      showToast('يجب أن يحتوي القيد المالي على سطرين على الأقل (مدين ودائن).', 'warning');
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof JournalEntryRow, value: any) => {
    setRows(prev => prev.map((row, i) => {
      if (i === index) {
        const updatedRow = { ...row, [field]: value };
        // Adjust credit if debit is set and vice versa to help user balance (optional, but keep manual)
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSave = () => {
    // Totals calculations
    const sumDebit = rows.reduce((acc, r) => acc + Number(r.debit), 0);
    const sumCredit = rows.reduce((acc, r) => acc + Number(r.credit), 0);

    if (sumDebit !== sumCredit) {
      showToast(`خطأ في توازن القيد! المدين: ${sumDebit} ر.س | الدائن: ${sumCredit} ر.س | الفرق: ${Math.abs(sumDebit - sumCredit)} ر.س`, 'error');
      return;
    }

    if (sumDebit === 0) {
      showToast('لا يمكن حفظ قيد مالي بقيمة صفرية.', 'warning');
      return;
    }

    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      entryNo,
      date,
      description,
      posted: true,
      rows: rows.map(r => ({
        ...r,
        debit: Number(r.debit),
        credit: Number(r.credit)
      }))
    };

    addJournalEntry(newEntry);
    showToast(`تم بنجاح حفظ وترحيل سند قيد يومية رقم ${entryNo} للدفتر العام المالي.`, 'success');
    onClose();
  };

  const sumDebit = rows.reduce((acc, r) => acc + Number(r.debit), 0);
  const sumCredit = rows.reduce((acc, r) => acc + Number(r.credit), 0);
  const difference = Math.abs(sumDebit - sumCredit);

  return (
    <div className="p-4 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none">
      
      {/* Header Info */}
      <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs space-y-3 shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">رقم السند:</label>
            <input 
              type="text" 
              required
              value={entryNo}
              onChange={e => setEntryNo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">تاريخ القيد:</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="space-y-1 col-span-1">
            <label className="text-[11px] font-bold text-slate-500">نوع المستند:</label>
            <div className="p-1.5 bg-blue-50 text-blue-700 font-bold border rounded text-xs text-center">
              {isOpening ? 'قيد افتتاحي متوازن' : 'سند قيد عام'}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500">البيان والشرح العام:</label>
          <input 
            type="text" 
            placeholder="مثال: تسوية عهدة موظفين أو دفع فواتير شهرية"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Rows */}
      <div className="flex-1 overflow-y-auto border border-slate-300 rounded-lg bg-white my-3 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto min-h-[160px]">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-300 text-slate-700 font-bold sticky top-0 z-10">
                <th className="px-3 py-2">الحساب المالي</th>
                <th className="px-3 py-2 w-28">مدين (Debit)</th>
                <th className="px-3 py-2 w-28">دائن (Credit)</th>
                <th className="px-3 py-2 w-44">مركز الكلفة</th>
                <th className="px-3 py-2">ملاحظات البند</th>
                <th className="px-3 py-2 w-10 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  {/* Account Select */}
                  <td className="px-2 py-1.5">
                    <select
                      value={row.accountId}
                      onChange={e => handleRowChange(idx, 'accountId', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Debit */}
                  <td className="px-2 py-1.5">
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={row.debit || ''}
                      onChange={e => handleRowChange(idx, 'debit', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Credit */}
                  <td className="px-2 py-1.5">
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={row.credit || ''}
                      onChange={e => handleRowChange(idx, 'credit', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Cost Center */}
                  <td className="px-2 py-1.5">
                    <select
                      value={row.costCenterId || ''}
                      onChange={e => handleRowChange(idx, 'costCenterId', e.target.value || null)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">(بدون مركز كلفة)</option>
                      {costCenters.map(cc => (
                        <option key={cc.id} value={cc.id}>
                          {cc.code} - {cc.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Notes */}
                  <td className="px-2 py-1.5">
                    <input 
                      type="text"
                      placeholder="شرح البند..."
                      value={row.notes}
                      onChange={e => handleRowChange(idx, 'notes', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Delete Button */}
                  <td className="px-2 py-1.5 text-center">
                    <button 
                      onClick={() => handleDeleteRow(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Balance warning bar */}
        <div className="bg-slate-100 border-t border-slate-200 p-3.5 flex items-center justify-between text-xs shrink-0 font-bold">
          <button 
            onClick={handleAddRow}
            className="px-3 py-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سطر قيد جديد</span>
          </button>

          <div className="flex gap-6 items-center">
            <span>إجمالي المدين: <strong className="text-blue-700 font-mono text-sm">{sumDebit.toLocaleString()}</strong> ر.س</span>
            <span>إجمالي الدائن: <strong className="text-amber-700 font-mono text-sm">{sumCredit.toLocaleString()}</strong> ر.س</span>
            
            {difference !== 0 ? (
              <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-100 animate-pulse">
                <AlertCircle className="w-4 h-4" />
                <span>غير متوازن! الفرق: {difference.toLocaleString()} ر.س</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200">
                <Check className="w-4 h-4 stroke-[3px]" />
                <span>القيد متوازن وسليم</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
        <button 
          onClick={() => {
            if (confirm('هل ترغب في طباعة مسودة هذا القيد؟')) {
              showToast('جاري إرسال سند القيد للطباعة الفورية على ملف PDF.', 'info');
            }
          }}
          className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة السند</span>
        </button>
        <button 
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-xs font-bold text-slate-700 transition-all cursor-pointer"
        >
          إلغاء الأمر
        </button>
        <button 
          onClick={handleSave}
          className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Check className="w-4 h-4" />
          <span>حفظ وترحيل القيد (F2)</span>
        </button>
      </div>

    </div>
  );
};

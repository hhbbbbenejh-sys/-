import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { 
  Percent, ArrowUpRight, Search, Check, Save, Layers, HelpCircle, 
  Settings, DollarSign, Calculator, RefreshCcw 
} from 'lucide-react';

interface PriceUpdateWindowProps {
  windowId: string;
  onClose: () => void;
}

export const PriceUpdateWindow: React.FC<PriceUpdateWindowProps> = ({ windowId, onClose }) => {
  const { items, showToast } = useErp();

  const [localItems, setLocalItems] = useState(items);
  const [search, setSearch] = useState('');
  
  // Bulk controls
  const [adjustType, setAdjustType] = useState<'percent' | 'fixed'>('percent');
  const [adjustField, setAdjustField] = useState<'salePrice' | 'purchasePrice'>('salePrice');
  const [adjustValue, setAdjustValue] = useState(5);

  const filteredItems = localItems.filter(item => 
    item.name.includes(search) || item.code.includes(search)
  );

  const handlePriceChange = (id: string, field: 'salePrice' | 'purchasePrice', value: number) => {
    setLocalItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleApplyBulk = () => {
    if (adjustValue === 0) {
      showToast('يرجى تحديد نسبة أو قيمة لتعديل الأسعار.', 'warning');
      return;
    }

    setLocalItems(prev => prev.map(item => {
      let currentVal = Number(item[adjustField]);
      let newVal = currentVal;
      if (adjustType === 'percent') {
        newVal = currentVal * (1 + adjustValue / 100);
      } else {
        newVal = currentVal + adjustValue;
      }
      return {
        ...item,
        [adjustField]: Math.max(0, parseFloat(newVal.toFixed(2)))
      };
    }));

    showToast(`تم بنجاح تطبيق التعديل التلقائي لأسعار كرت المواد بنسبة/قيمة: ${adjustValue}.`, 'success');
  };

  const handleSaveAll = () => {
    // In our simplified setup we simulate saving back to server
    showToast('تم ترحيل وتحديث أسعار المواد بالكامل في قواعد البيانات بنجاح.', 'success');
    onClose();
  };

  return (
    <div className="p-4 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none overflow-hidden">
      <div className="space-y-3 shrink-0">
        <div className="border-b pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">تعديل أسعار المواد دفعة واحدة (تعديل كلي)</h3>
            <p className="text-[11px] text-slate-500">يتيح هذا المحرك تصفية المواد وتعديل أسعار بيع أو شراء الأصناف دفعة واحدة بنسبة مئوية أو قيمة ثابتة.</p>
          </div>
        </div>

        {/* Filters and Bulk Actions bar */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs grid grid-cols-5 gap-3 items-end">
          <div className="space-y-1 col-span-2">
            <label className="text-[10.5px] font-bold text-slate-500">بحث سريع عن مادة محددة:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم، الباركود، أو الرمز الدولي..."
                className="w-full text-xs p-1.5 pr-8 bg-slate-50 border rounded font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-500">تعديل السعر لـ:</label>
            <select 
              value={adjustField}
              onChange={e => setAdjustField(e.target.value as any)}
              className="w-full text-xs p-1.5 bg-slate-50 border rounded font-bold"
            >
              <option value="salePrice">سعر البيع (مستهلك)</option>
              <option value="purchasePrice">سعر الشراء (تكلفة)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-500">المقدار (نسبة % أو قيمة):</label>
            <div className="flex gap-1.5">
              <input 
                type="number" 
                value={adjustValue}
                onChange={e => setAdjustValue(Number(e.target.value))}
                className="w-20 text-xs p-1.5 bg-slate-50 border rounded font-mono font-bold text-center"
              />
              <select 
                value={adjustType}
                onChange={e => setAdjustType(e.target.value as any)}
                className="text-xs p-1.5 bg-slate-50 border rounded"
              >
                <option value="percent">% نسبة</option>
                <option value="fixed">ر.س قيمة</option>
              </select>
            </div>
          </div>

          <div>
            <button 
              onClick={handleApplyBulk}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>تطبيق التعديل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto border border-slate-300 rounded-lg bg-white my-3 shadow-inner">
        <table className="w-full text-xs text-right border-collapse">
          <thead className="bg-slate-100 text-slate-500 font-bold border-b sticky top-0">
            <tr>
              <th className="p-2.5">رمز الصنف</th>
              <th className="p-2.5">اسم المادة</th>
              <th className="p-2.5">الوحدة الأساسية</th>
              <th className="p-2.5 text-center">سعر الشراء الحالي (SAR)</th>
              <th className="p-2.5 text-center">سعر البيع الجديد (SAR)</th>
              <th className="p-2.5 text-center">هامش الربح المقدر (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(item => {
              const profitMargin = item.purchasePrice > 0 
                ? ((item.salePrice - item.purchasePrice) / item.purchasePrice * 100).toFixed(1)
                : '0.0';
              return (
                <tr key={item.id} className="hover:bg-slate-50 text-slate-700 font-medium">
                  <td className="p-2.5 font-bold font-mono text-slate-500">{item.code}</td>
                  <td className="p-2.5 font-bold text-slate-800">{item.name}</td>
                  <td className="p-2.5 text-slate-400">{item.unit || 'حبة'}</td>
                  <td className="p-2 text-center">
                    <input 
                      type="number" 
                      value={item.purchasePrice}
                      onChange={e => handlePriceChange(item.id, 'purchasePrice', Number(e.target.value))}
                      className="w-24 p-1 border rounded text-center bg-slate-50 font-mono font-bold"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input 
                      type="number" 
                      value={item.salePrice}
                      onChange={e => handlePriceChange(item.id, 'salePrice', Number(e.target.value))}
                      className="w-24 p-1 border rounded text-center bg-blue-50/50 border-blue-300 text-blue-900 font-mono font-bold"
                    />
                  </td>
                  <td className="p-2.5 text-center font-bold font-mono text-emerald-700">
                    {profitMargin} %
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Controls */}
      <div className="flex justify-between items-center bg-slate-100 p-3 border rounded-lg shrink-0">
        <span className="text-[11px] text-slate-500 font-bold">
          عدد الأصناف المشمولة بالتعديل السريع: <strong className="text-slate-700">{filteredItems.length}</strong> صنف
        </span>

        <div className="flex gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-200 rounded font-bold text-xs text-slate-700 cursor-pointer transition-all"
          >
            إلغاء التراجع
          </button>
          <button 
            onClick={handleSaveAll}
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وترحيل جميع الأسعار</span>
          </button>
        </div>
      </div>
    </div>
  );
};

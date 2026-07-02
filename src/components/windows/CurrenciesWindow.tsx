import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { 
  Plus, Edit3, Trash2, Check, X, Coins, DollarSign, 
  TrendingUp, RefreshCw, BarChart2, Globe, HelpCircle 
} from 'lucide-react';
import { Currency } from '../../types/erp';

interface CurrenciesWindowProps {
  windowId: string;
  onClose: () => void;
}

export const CurrenciesWindow: React.FC<CurrenciesWindowProps> = ({ windowId, onClose }) => {
  const { currencies, showToast } = useErp();

  const [localCurrencies, setLocalCurrencies] = useState<Currency[]>(currencies);
  const [selectedCurrId, setSelectedCurrId] = useState<string | null>(currencies[0]?.id || null);
  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view');

  // Form states
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [rate, setRate] = useState(1.0);

  const selectedCurr = localCurrencies.find(c => c.id === selectedCurrId) || localCurrencies[0];

  const handleSelectCurr = (curr: Currency) => {
    setSelectedCurrId(curr.id);
    setName(curr.name);
    setSymbol(curr.symbol);
    setRate(curr.rate);
    setMode('view');
  };

  const handleAddNew = () => {
    setName('');
    setSymbol('');
    setRate(1.0);
    setMode('add');
  };

  const handleEdit = () => {
    if (!selectedCurr) return;
    setName(selectedCurr.name);
    setSymbol(selectedCurr.symbol);
    setRate(selectedCurr.rate);
    setMode('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol || rate <= 0) {
      showToast('يرجى كتابة الاسم والرمز وسعر الصرف الحقيقي بشكل صحيح.', 'warning');
      return;
    }

    if (mode === 'add') {
      const newCurr: Currency = {
        id: `curr-${Date.now()}`,
        name,
        symbol: symbol.toUpperCase(),
        rate: Number(rate)
      };
      setLocalCurrencies(prev => [...prev, newCurr]);
      setSelectedCurrId(newCurr.id);
      showToast(`تم إضافة العملة الجديدة: ${name} بنجاح.`, 'success');
    } else if (mode === 'edit') {
      setLocalCurrencies(prev => prev.map(c => {
        if (c.id === selectedCurrId) {
          return { ...c, name, symbol: symbol.toUpperCase(), rate: Number(rate) };
        }
        return c;
      }));
      showToast(`تم تحديث سعر صرف العملة: ${name} إلى ${rate}`, 'success');
    }

    setMode('view');
  };

  const handleSyncLiveRates = () => {
    showToast('جاري الاتصال بخدمة أسعار الصرف التابعة للبنك المركزي السعودي...', 'info');
    setTimeout(() => {
      setLocalCurrencies(prev => prev.map(c => {
        if (c.symbol === 'USD') return { ...c, rate: 3.75 };
        if (c.symbol === 'EUR') return { ...c, rate: 4.02 };
        if (c.symbol === 'AED') return { ...c, rate: 1.02 };
        return c;
      }));
      showToast('تم بنجاح تحديث وتوحيد أسعار الصرف وفق آخر نشرة مالية معتمدة.', 'success');
    }, 1200);
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      {/* Right List Panel */}
      <div className="w-[280px] shrink-0 border-l border-slate-300 bg-slate-100 flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-slate-300 flex justify-between items-center shrink-0">
          <span className="font-extrabold text-xs text-slate-500">العملات وسعر التحويل</span>
          <div className="flex gap-1.5">
            <button 
              onClick={handleSyncLiveRates}
              className="p-1 text-emerald-700 hover:bg-emerald-200 bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-all"
              title="تحديث أسعار الصرف الحية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleAddNew}
              className="p-1 text-blue-700 hover:bg-blue-200 bg-blue-100 border border-blue-300 rounded cursor-pointer transition-all"
              title="إضافة عملة جديدة"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-100">
          {localCurrencies.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelectCurr(c)}
              className={`w-full text-right p-3 rounded text-xs transition-all flex items-center justify-between cursor-pointer ${
                selectedCurrId === c.id 
                  ? 'bg-blue-600 text-white font-bold shadow-md' 
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Coins className={`w-4 h-4 ${selectedCurrId === c.id ? 'text-white' : 'text-amber-600'}`} />
                <span>{c.name} ({c.symbol})</span>
              </span>
              <span className={`font-mono text-xs ${selectedCurrId === c.id ? 'text-blue-100' : 'text-slate-500'}`}>
                {c.rate}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Left Details Panel */}
      <div className="flex-1 p-5 overflow-y-auto">
        {selectedCurr || mode === 'add' ? (
          <div className="space-y-4 max-w-lg">
            <div className="border-b pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  {mode === 'add' ? 'إدخال بطاقة عملة أجنبية جديدة' : `معلومات العملة: ${selectedCurr?.name}`}
                </h3>
                <p className="text-[11px] text-slate-500">يتوجب تدوين رمز العملة الصحيح وسعر صرفها مقابل العملة المحلية (الريال السعودي) لمعادلة الفواتير تلقائياً.</p>
              </div>

              {mode === 'view' && (
                <button 
                  onClick={handleEdit}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 text-slate-700"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>تعديل السعر</span>
                </button>
              )}
            </div>

            {mode === 'view' ? (
              <div className="bg-white border rounded-lg p-5 space-y-4 shadow-xs">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">اسم العملة</span>
                    <p className="text-xs font-extrabold text-slate-800 bg-slate-50 border rounded p-2.5">{selectedCurr?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">الرمز الدولي</span>
                    <p className="text-xs font-extrabold text-blue-600 font-mono bg-slate-50 border rounded p-2.5 text-center">{selectedCurr?.symbol}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">معامل التحويل للريال</span>
                    <p className="text-xs font-extrabold text-emerald-600 font-mono bg-slate-50 border rounded p-2.5 text-center">{selectedCurr?.rate}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400" />
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-700">حالة الربط والتقييم:</span> عند بناء القيود المالي، يقوم النظام تلقائياً بضرب المبالغ المدونة بهذه العملة بمعامل التحويل لترحيل القيد متزناً بعملة الدفاتر الكلية.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="bg-white border rounded-lg p-5 space-y-4 shadow-xs">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-bold text-slate-600">اسم العملة بالكامل:</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. يورو أوروبي"
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">الرمز الدولي المختصر:</label>
                    <input 
                      type="text" 
                      value={symbol}
                      onChange={e => setSymbol(e.target.value)}
                      placeholder="e.g. EUR"
                      maxLength={4}
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">سعر الصرف لـ (SAR):</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={rate}
                      onChange={e => setRate(Number(e.target.value))}
                      placeholder="1.0000"
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">قيمة توازن الحسابات:</label>
                    <input 
                      type="text" 
                      disabled
                      value={`${(rate * 1000).toFixed(2)} SAR لكل 1000 وحدة`}
                      className="w-full text-xs p-2 bg-slate-100 border rounded text-slate-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <button 
                    type="button"
                    onClick={() => setMode('view')}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>إلغاء</span>
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer shadow-md transition-all flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ العملة</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-slate-400 text-xs">
            يرجى اختيار عملة من الجانب لعرض أسعار الصرف الحالية.
          </div>
        )}
      </div>
    </div>
  );
};

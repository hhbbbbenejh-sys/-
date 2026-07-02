import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Layers, MapPin, Warehouse, Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import { Branch, Warehouse as ErpWarehouse } from '../../types/erp';

export const BranchTreeWindow: React.FC<{ windowId: string; onClose: () => void }> = ({ onClose }) => {
  const { branches, warehouses, addBranch, addWarehouse } = useErp();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branches[0]?.id || null);
  const [selectedWhId, setSelectedWhId] = useState<string | null>(null);

  // Forms
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');

  const [showAddWh, setShowAddWh] = useState(false);
  const [whName, setWhName] = useState('');

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !branchCode) return;
    const newBranch: Branch = {
      id: `br-${Date.now()}`,
      name: branchName,
      code: branchCode,
    };
    addBranch(newBranch);
    setBranchName('');
    setBranchCode('');
    setShowAddBranch(false);
    setSelectedBranchId(newBranch.id);
  };

  const handleCreateWh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !selectedBranchId) return;
    const newWh: ErpWarehouse = {
      id: `wh-${Date.now()}`,
      name: whName,
      branchId: selectedBranchId,
    };
    addWarehouse(newWh);
    setWhName('');
    setShowAddWh(false);
    setSelectedWhId(newWh.id);
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 divide-x divide-x-reverse divide-slate-300 select-none">
      
      {/* Left panel: Tree View */}
      <div className="w-1/2 p-4 flex flex-col h-full overflow-y-auto space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <span className="font-bold text-xs text-slate-500">هيكل شجرة الفروع والمستودعات</span>
          <button 
            onClick={() => setShowAddBranch(true)}
            className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors cursor-pointer"
            title="إضافة فرع جديد"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {branches.map(br => (
            <div key={br.id} className="space-y-1">
              <button 
                onClick={() => {
                  setSelectedBranchId(br.id);
                  setSelectedWhId(null);
                }}
                className={`w-full text-right p-2 rounded flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  selectedBranchId === br.id && !selectedWhId
                    ? 'bg-blue-100 text-blue-900 font-bold border-r-4 border-blue-600'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{br.name} (رمز: {br.code})</span>
                </span>
              </button>

              {/* Warehouses inside this branch */}
              <div className="pr-6 space-y-1">
                {warehouses.filter(wh => wh.branchId === br.id).map(wh => (
                  <button 
                    key={wh.id}
                    onClick={() => {
                      setSelectedBranchId(br.id);
                      setSelectedWhId(wh.id);
                    }}
                    className={`w-full text-right p-1.5 rounded flex items-center text-xs transition-colors cursor-pointer ${
                      selectedWhId === wh.id
                        ? 'bg-emerald-100 text-emerald-900 font-bold border-r-4 border-emerald-600'
                        : 'hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5 text-emerald-600 mr-1 ml-1.5" />
                    <span>{wh.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: Details & Creators */}
      <div className="w-1/2 p-4 h-full bg-white overflow-y-auto flex flex-col justify-between">
        
        {/* ADD BRANCH FORM */}
        {showAddBranch ? (
          <form onSubmit={handleCreateBranch} className="space-y-3.5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-md animate-window-open">
            <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>إضافة فرع جديد للمجموعة</span>
            </h4>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">اسم الفرع:</label>
              <input 
                type="text" 
                required
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">رمز الفرع (ترميز محاسبي):</label>
              <input 
                type="text" 
                required
                placeholder="مثال: 03"
                value={branchCode}
                onChange={e => setBranchCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddBranch(false)}
                className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                إضافة الفرع
              </button>
            </div>
          </form>
        ) : showAddWh ? (
          /* ADD WAREHOUSE FORM */
          <form onSubmit={handleCreateWh} className="space-y-3.5 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-md animate-window-open">
            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <Warehouse className="w-4 h-4" />
              <span>إضافة مستودع صرف جديد</span>
            </h4>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">المستودع تابع للفرع:</label>
              <div className="p-1.5 bg-slate-100 border text-xs font-bold text-slate-700 rounded">
                {branches.find(b => b.id === selectedBranchId)?.name || 'غير محدد'}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">اسم المستودع:</label>
              <input 
                type="text" 
                required
                value={whName}
                onChange={e => setWhName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddWh(false)}
                className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                إضافة المستودع
              </button>
            </div>
          </form>
        ) : (
          /* DETAIL CARD VIEW */
          <div className="flex-1 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-1.5">بطاقة معلومات التفاصيل</h3>

            {selectedWhId ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">بطاقة مستودع</span>
                </div>
                <div className="text-xs space-y-1.5">
                  <p>اسم المستودع: <strong>{warehouses.find(w => w.id === selectedWhId)?.name}</strong></p>
                  <p>الفرع الإداري: <strong>{branches.find(b => b.id === selectedBranchId)?.name}</strong></p>
                  <p>سعر المبيعات الافتراضي: <strong>سعر التجزئة والجمهور</strong></p>
                </div>
              </div>
            ) : selectedBranchId ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">بطاقة الفرع الإداري</span>
                </div>
                <div className="text-xs space-y-1.5">
                  <p>اسم الفرع: <strong>{branches.find(b => b.id === selectedBranchId)?.name}</strong></p>
                  <p>ترميز الحسابات: <strong>{branches.find(b => b.id === selectedBranchId)?.code}</strong></p>
                  <p>المدينة: <strong>المملكة العربية السعودية</strong></p>
                </div>

                <button 
                  onClick={() => setShowAddWh(true)}
                  className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold text-xs rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مستودع لهذا الفرع</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">اختر فرع أو مستودع لعرض معلوماته وتعديلها.</p>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

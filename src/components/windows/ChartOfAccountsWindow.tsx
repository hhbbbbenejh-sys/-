import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Landmark, Search, Folder, FolderOpen, FileText, Plus, DollarSign } from 'lucide-react';
import { Account } from '../../types/erp';

export const ChartOfAccountsWindow: React.FC<{ windowId: string; onClose: () => void }> = ({ onClose }) => {
  const { accounts, openWindow } = useErp();
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredAccounts = accounts.filter(acc => 
    acc.name.includes(searchTerm) || acc.code.includes(searchTerm)
  );

  return (
    <div className="p-4 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none">
      
      {/* Top search */}
      <div className="space-y-3 shrink-0">
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
            onClick={() => openWindow('account_card', 'بطاقة حساب جديدة')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب</span>
          </button>
        </div>
      </div>

      {/* Main Tree Panel */}
      <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white my-3 p-3 space-y-2.5">
        {categories.map(cat => {
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
                        className="flex items-center justify-between p-1.5 hover:bg-blue-50/30 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-500 text-xs font-semibold">{acc.code}</span>
                          <span className="text-xs font-bold text-slate-700">{acc.name}</span>
                          {acc.parentId && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded-xs font-semibold">حساب فرعي</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11.5px] text-slate-800 text-left bg-slate-50 border px-2 py-0.5 rounded-sm min-w-[100px]">
                            {acc.balance.toLocaleString()} <span className="text-[9.5px] text-slate-400">ر.س</span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
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
  );
};

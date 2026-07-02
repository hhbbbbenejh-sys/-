import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Folder, FolderOpen, Package, Search, Plus, Trash2, Check, X, Tag } from 'lucide-react';
import { ItemGroup } from '../../types/erp';

export const ItemTreeWindow: React.FC<{ windowId: string; onClose: () => void }> = ({ onClose }) => {
  const { itemGroups, items, addItemGroup, openWindow } = useErp();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(itemGroups[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Group State
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: ItemGroup = {
      id: `ig-${Date.now()}`,
      name: newGroupName,
      parentId: null,
    };

    addItemGroup(newGroup);
    setNewGroupName('');
    setShowAddGroup(false);
    setSelectedGroupId(newGroup.id);
  };

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.includes(searchTerm) || it.code.includes(searchTerm);
    if (selectedGroupId) {
      return matchesSearch && it.groupId === selectedGroupId;
    }
    return matchesSearch;
  });

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 divide-x divide-x-reverse divide-slate-300 select-none">
      
      {/* Left panel: Groups folder tree list */}
      <div className="w-2/5 p-4 flex flex-col h-full bg-slate-100 overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-slate-300 mb-3">
          <span className="font-bold text-xs text-slate-500">مجموعات وفئات المواد</span>
          <button 
            onClick={() => setShowAddGroup(true)}
            className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors cursor-pointer"
            title="إضافة مجموعة مواد جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showAddGroup && (
          <form onSubmit={handleAddGroup} className="bg-white border p-3 rounded-lg space-y-2.5 mb-3.5 animate-window-open shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 block">إنشاء مجموعة جديدة:</span>
            <input 
              type="text" 
              required
              placeholder="مثال: قطع غيار وفلاتر"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-1 pt-1">
              <button 
                type="button" 
                onClick={() => setShowAddGroup(false)}
                className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {/* Option for ALL materials */}
          <button
            onClick={() => setSelectedGroupId(null)}
            className={`w-full text-right p-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
              selectedGroupId === null 
                ? 'bg-blue-600 font-bold text-white shadow-md shadow-blue-500/15'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FolderOpen className="w-4.5 h-4.5 shrink-0" />
              <span>كافة المواد والمستودعات</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedGroupId === null ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {items.length}
            </span>
          </button>

          {itemGroups.map(ig => {
            const isSelected = selectedGroupId === ig.id;
            const count = items.filter(it => it.groupId === ig.id).length;

            return (
              <button
                key={ig.id}
                onClick={() => setSelectedGroupId(ig.id)}
                className={`w-full text-right p-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-600 font-bold text-white shadow-md shadow-blue-500/15'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isSelected ? (
                    <FolderOpen className="w-4.5 h-4.5 shrink-0 text-amber-300" />
                  ) : (
                    <Folder className="w-4.5 h-4.5 shrink-0 text-amber-500" />
                  )}
                  <span>{ig.name}</span>
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel: Material list grids */}
      <div className="w-3/5 p-4 flex flex-col h-full bg-white overflow-hidden">
        
        {/* Search bar & quick actions */}
        <div className="flex gap-2 mb-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="ابحث برمز الصنف، الاسم، أو الباركود الدولي..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pr-9 pl-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={() => openWindow('item_card', 'بطاقة مادة جديدة')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>كرت مادة</span>
          </button>
        </div>

        {/* Grid List */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                <th className="px-3 py-2 w-16">الرمز</th>
                <th className="px-3 py-2">الوصف والاسم العربي</th>
                <th className="px-3 py-2 w-20 text-center">الوحدة</th>
                <th className="px-3 py-2 w-24 text-left">سعر المستهلك</th>
                <th className="px-3 py-2 w-20 text-center">المخزون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-bold">
                    لا يوجد أصناف معرفة ضمن هذه المجموعة مطابقة لخيارات البحث.
                  </td>
                </tr>
              ) : (
                filteredItems.map(it => (
                  <tr key={it.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-500 font-semibold">{it.code}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-700">{it.name}</div>
                      {it.notes && <div className="text-[10px] text-slate-400">{it.notes}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{it.unit}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-left text-blue-700">
                      {it.salePrice.toLocaleString()} <span className="text-[9.5px] text-slate-400">ر.س</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10.5px] ${
                        it.currentStock <= it.minLimit 
                          ? 'bg-red-100 text-red-700 animate-pulse' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {it.currentStock}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom stats summary */}
        <div className="pt-3 border-t mt-3 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <span>إجمالي الأصناف المعروضة: <strong>{filteredItems.length} صنف</strong></span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded transition-all cursor-pointer"
          >
            إغلاق المجلد
          </button>
        </div>

      </div>
    </div>
  );
};

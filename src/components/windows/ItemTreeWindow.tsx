import React, { useState, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { 
  Folder, FolderOpen, Package, Search, Plus, Trash2, Edit3, Check, X, Loader2, Database
} from 'lucide-react';
import { Item, ItemGroup } from '../../types/erp';

interface ItemTreeWindowProps {
  windowId: string;
  onClose: () => void;
}

export const ItemTreeWindow: React.FC<ItemTreeWindowProps> = ({ onClose }) => {
  const { 
    itemGroups, 
    setItemGroups,
    items, 
    setItems,
    addItemGroup, 
    openWindow, 
    connectedDbId, 
    showToast 
  } = useErp();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI and database status states
  const [loading, setLoading] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Add Group State
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  // Fetch groups and products from Supabase
  const fetchDataFromDb = useCallback(async () => {
    if (!connectedDbId) return;
    setLoading(true);

    try {
      // 1. Fetch categories
      const categoriesResponse = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', connectedDbId);

      // 2. Fetch products
      const productsResponse = await supabase
        .from('products')
        .select('*')
        .eq('company_id', connectedDbId);

      if (categoriesResponse.error || productsResponse.error) {
        throw new Error(categoriesResponse.error?.message || productsResponse.error?.message);
      }

      setIsUsingSupabase(true);

      // Map Categories
      const mappedGroups: ItemGroup[] = (categoriesResponse.data || []).map(row => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id
      }));
      setItemGroups(mappedGroups);

      // Map Products
      const mappedItems: Item[] = (productsResponse.data || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        barcode: row.barcode,
        name: row.name,
        groupId: row.category_id,
        unit: 'حبة', // default
        purchasePrice: Number(row.purchase_price) || 0,
        salePrice: Number(row.sale_price) || 0,
        initialStock: Number(row.initial_stock) || 0,
        currentStock: Number(row.current_stock) || 0,
        minLimit: Number(row.min_limit) || 0,
        maxLimit: Number(row.max_limit) || 0,
        notes: row.notes || '',
        image: row.image || ''
      }));
      setItems(mappedItems);

    } catch (err: any) {
      console.warn('Supabase query error for inventory, using fallback context data:', err.message);
      setIsUsingSupabase(false);
    } finally {
      setLoading(false);
    }
  }, [connectedDbId, setItemGroups, setItems]);

  // Initial load
  useEffect(() => {
    fetchDataFromDb();
  }, [connectedDbId]);

  // Add Category (Group)
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast('يرجى كتابة اسم المجموعة الجديدة.', 'warning');
      return;
    }
    if (!connectedDbId) {
      showToast('يجب الاتصال بقاعدة بيانات نشطة لحفظ المجموعة.', 'error');
      return;
    }

    const newId = `ig-${Date.now()}`;
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          id: newId,
          company_id: connectedDbId,
          name: newGroupName.trim(),
          parent_id: null
        }]);

      if (error) throw error;

      const newGroup: ItemGroup = {
        id: newId,
        name: newGroupName.trim(),
        parentId: null,
      };

      addItemGroup(newGroup);
      setNewGroupName('');
      setShowAddGroup(false);
      setSelectedGroupId(newGroup.id);
      showToast(`تم حفظ مجموعة المواد "${newGroupName}" سحابياً بنجاح.`, 'success');
    } catch (err: any) {
      console.error('Error adding category:', err);
      showToast(`فشل حفظ المجموعة: ${err.message}`, 'error');
    }
  };

  // Edit Category Name
  const handleSaveEditGroup = async (id: string) => {
    if (!editGroupName.trim()) return;
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editGroupName.trim() })
        .eq('id', id);

      if (error) throw error;

      setItemGroups(prev => prev.map(g => g.id === id ? { ...g, name: editGroupName.trim() } : g));
      setEditingGroupId(null);
      setEditGroupName('');
      showToast('تم تحديث اسم المجموعة بنجاح.', 'success');
    } catch (err: any) {
      console.error('Error updating category:', err);
      showToast(`فشل تحديث المجموعة: ${err.message}`, 'error');
    }
  };

  // Delete Category
  const handleDeleteGroup = async (id: string, name: string) => {
    const hasItems = items.some(it => it.groupId === id);
    if (hasItems) {
      showToast('لا يمكن حذف هذه المجموعة لأنها تحتوي على أصناف مسجلة.', 'warning');
      return;
    }

    if (!confirm(`هل أنت متأكد من رغبتك في حذف مجموعة المواد "${name}" نهائياً؟`)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItemGroups(prev => prev.filter(g => g.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
      showToast('تم إزالة المجموعة ومزامنتها بنجاح.', 'success');
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showToast(`فشل الحذف: ${err.message}`, 'error');
    }
  };

  // Delete Product Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف الصنف "${name}" نهائياً من المستودعات؟`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(it => it.id !== id));
      showToast(`تم حذف بطاقة الصنف "${name}" بنجاح ومزامنة التغيير.`, 'success');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast(`فشل حذف بطاقة الصنف: ${err.message}`, 'error');
    }
  };

  // Filter products locally as user searches
  const filteredItems = items.filter(it => {
    const matchesSearch = 
      it.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      it.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (it.barcode && it.barcode.includes(searchTerm));
    
    if (selectedGroupId) {
      return matchesSearch && it.groupId === selectedGroupId;
    }
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      
      {/* Top Database connection bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>شجرة الأصناف والمجموعات النشطة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isUsingSupabase ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span>{isUsingSupabase ? 'مزامنة Supabase نشطة (أصناف حقيقية)' : 'وضع المزامنة الاحتياطي'}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Groups folder tree list */}
        <div className="w-[30%] p-4 flex flex-col h-full bg-slate-100/60 overflow-y-auto border-l border-slate-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-300 mb-3 shrink-0">
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
            <form onSubmit={handleAddGroup} className="bg-white border p-3 rounded-lg space-y-2.5 mb-3.5 animate-window-open shadow-xs shrink-0">
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
              const isEditing = editingGroupId === ig.id;
              const count = items.filter(it => it.groupId === ig.id).length;

              return (
                <div key={ig.id} className="group/item flex items-center justify-between gap-1">
                  {isEditing ? (
                    <div className="flex-1 flex gap-1 p-1 bg-white border rounded">
                      <input 
                        type="text"
                        value={editGroupName}
                        onChange={e => setEditGroupName(e.target.value)}
                        className="flex-1 text-xs px-1 focus:outline-none"
                      />
                      <button onClick={() => handleSaveEditGroup(ig.id)} className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingGroupId(null)} className="text-slate-400 hover:bg-slate-100 p-0.5 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedGroupId(ig.id)}
                      className={`flex-1 text-right p-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-600 font-bold text-white shadow-md'
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
                  )}

                  {!isEditing && (
                    <div className="hidden group-hover/item:flex items-center gap-0.5 shrink-0">
                      <button 
                        onClick={() => { setEditingGroupId(ig.id); setEditGroupName(ig.name); }}
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded"
                        title="تعديل اسم المجموعة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(ig.id, ig.name)}
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-red-600 rounded"
                        title="حذف المجموعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: Material list grids */}
        <div className="w-[70%] p-4 flex flex-col h-full bg-white overflow-hidden">
          
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
              onClick={fetchDataFromDb}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded border border-slate-200 transition-all cursor-pointer"
            >
              تحديث البيانات
            </button>

            <button 
              onClick={() => openWindow('item_card', 'بطاقة مادة جديدة')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>كرت مادة جديد</span>
            </button>
          </div>

          {/* Grid List */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-bold">جاري تحميل بطاقات المواد...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center space-y-1">
                <Package className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-500">لا يوجد أصناف متوفرة</span>
                <span className="text-[10px] text-slate-400">سجل أصناف جديدة بمجموعات المستودع التابعة لها.</span>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <th className="px-3 py-2 w-16">الرمز</th>
                    <th className="px-3 py-2">الوصف والاسم العربي</th>
                    <th className="px-3 py-2 w-20 text-center">الوحدة</th>
                    <th className="px-3 py-2 w-24 text-left">سعر البيع</th>
                    <th className="px-3 py-2 w-20 text-center">المخزون</th>
                    <th className="px-3 py-2 w-20 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(it => (
                    <tr key={it.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-slate-500 font-semibold">{it.code}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-700">{it.name}</div>
                        {it.notes && <div className="text-[10px] text-slate-400">{it.notes}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-500">{it.unit}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-left text-blue-700">
                        {it.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[9.5px] text-slate-400">ر.س</span>
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
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openWindow('item_card', 'تعديل كرت المادة', { itemId: it.id })}
                            title="تعديل"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(it.id, it.name)}
                            title="حذف المادة"
                            className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
    </div>
  );
};

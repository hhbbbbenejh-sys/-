import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { Package, Plus, Check, X, Tag, Loader2, ListOrdered } from 'lucide-react';
import { Item, ItemGroup } from '../../types/erp';

interface ItemCardWindowProps {
  windowId: string;
  onClose: () => void;
  itemId?: string; // Optional for edit mode
}

export const ItemCardWindow: React.FC<ItemCardWindowProps> = ({ windowId, onClose, itemId }) => {
  const { 
    itemGroups, 
    setItemGroups,
    addItem, 
    setItems,
    connectedDbId, 
    showToast 
  } = useErp();

  // Form states
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [unit, setUnit] = useState('حبة');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minLimit, setMinLimit] = useState<number>(5);
  const [maxLimit, setMaxLimit] = useState<number>(100);
  const [notes, setNotes] = useState('');

  // UI States
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbCategories, setDbCategories] = useState<ItemGroup[]>([]);

  // Fetch categories from DB to make sure we are fully synchronized
  useEffect(() => {
    async function fetchCategories() {
      if (!connectedDbId) return;
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('company_id', connectedDbId);
        
        if (!error && data) {
          const mapped: ItemGroup[] = data.map(row => ({
            id: row.id,
            name: row.name,
            parentId: row.parent_id
          }));
          setDbCategories(mapped);
          setItemGroups(mapped);
          if (mapped.length > 0 && !groupId) {
            setGroupId(mapped[0].id);
          }
        } else {
          setDbCategories(itemGroups);
          if (itemGroups.length > 0 && !groupId) {
            setGroupId(itemGroups[0].id);
          }
        }
      } catch (err) {
        setDbCategories(itemGroups);
        if (itemGroups.length > 0 && !groupId) {
          setGroupId(itemGroups[0].id);
        }
      }
    }

    fetchCategories();
  }, [connectedDbId, itemGroups, setItemGroups]);

  // Load item if in EDIT mode
  useEffect(() => {
    async function loadItem() {
      if (!itemId || !connectedDbId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', itemId)
          .single();

        if (!error && data) {
          setCode(data.code || '');
          setBarcode(data.barcode || '');
          setName(data.name || '');
          setGroupId(data.category_id || '');
          setPurchasePrice(Number(data.purchase_price) || 0);
          setSalePrice(Number(data.sale_price) || 0);
          setInitialStock(Number(data.initial_stock) || 0);
          setMinLimit(Number(data.min_limit) || 0);
          setMaxLimit(Number(data.max_limit) || 0);
          setNotes(data.notes || '');
        }
      } catch (err) {
        console.error('Error loading item details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [itemId, connectedDbId]);

  const validateForm = (): boolean => {
    if (!code.trim()) {
      showToast('يرجى تحديد رمز الصنف (الترقيم الداخلي).', 'warning');
      return false;
    }
    if (!name.trim()) {
      showToast('يرجى إدخال اسم الصنف بالكامل.', 'warning');
      return false;
    }
    if (purchasePrice < 0 || salePrice < 0) {
      showToast('لا يمكن لأسعار البيع أو الشراء أن تكون سالبة.', 'warning');
      return false;
    }
    if (minLimit < 0 || maxLimit < 0) {
      showToast('لا يمكن لحدود التخزين أن تكون سالبة.', 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!connectedDbId) {
      showToast('يجب الاتصال بقاعدة البيانات لحفظ الأصناف.', 'error');
      return;
    }

    setSaving(true);
    const targetItemId = itemId || `it-${Date.now()}`;
    const generatedBarcode = barcode.trim() || Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const productRecord = {
      id: targetItemId,
      company_id: connectedDbId,
      category_id: groupId || null,
      code: code.trim(),
      barcode: generatedBarcode,
      name: name.trim(),
      purchase_price: Number(purchasePrice) || 0,
      sale_price: Number(salePrice) || 0,
      initial_stock: Number(initialStock) || 0,
      current_stock: Number(initialStock) || 0,
      min_limit: Number(minLimit) || 0,
      max_limit: Number(maxLimit) || 0,
      notes: notes.trim() || null,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    };

    try {
      // Save directly to products table in Supabase
      const { error } = await supabase
        .from('products')
        .upsert(productRecord);

      if (error) {
        throw new Error(error.message);
      }

      // Also update local React state
      const mappedItem: Item = {
        id: targetItemId,
        code: code.trim(),
        barcode: generatedBarcode,
        name: name.trim(),
        groupId: groupId || null,
        unit,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        initialStock: Number(initialStock),
        currentStock: Number(initialStock),
        minLimit: Number(minLimit),
        maxLimit: Number(maxLimit),
        notes: notes.trim(),
        image: productRecord.image
      };

      if (itemId) {
        setItems(prev => prev.map(it => it.id === itemId ? mappedItem : it));
      } else {
        addItem(mappedItem);
      }

      showToast(
        itemId 
          ? `تم تحديث بطاقة الصنف "${name}" بنجاح في قاعدة البيانات.` 
          : `تم تسجيل الصنف الجديد "${name}" وحفظه سحابياً بنجاح.`, 
        'success'
      );

      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast(`فشل حفظ بطاقة الصنف: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-xs font-bold">جاري تحميل بيانات الصنف...</span>
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        
        {/* Main Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span>{itemId ? 'تعديل بيانات بطاقة الصنف / المادة' : 'البيانات الأساسية لبطاقة الصنف / المادة'}</span>
          </h4>

          <div className="grid grid-cols-3 gap-3">
            {/* Item Code */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">رمز المادة (الترقيم الداخلي): *</label>
              <input 
                type="text" 
                required
                placeholder="مثال: 1006"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Barcode */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">الباركود الدولي (Barcode):</label>
              <input 
                type="text" 
                placeholder="توليد تلقائي إن ترك فارغاً"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Measuring Unit */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">وحدة القياس الرئيسية:</label>
              <select 
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="حبة">حبة (Piece)</option>
                <option value="كرتونة">كرتونة (Box)</option>
                <option value="طقم">طقم (Set)</option>
                <option value="متر">متر (Meter)</option>
                <option value="كغ">كيلوغرام (Kg)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Item Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">اسم المادة (الوصف المطبوع بالفواتير): *</label>
              <input 
                type="text" 
                required
                placeholder="مثال: مكنسة كهربائية هيتاشي برميل 2100 واط"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Group */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">المجموعة / الفئة التابعة لها:</label>
              <select 
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">-- اختر مجموعة --</option>
                {dbCategories.map(ig => (
                  <option key={ig.id} value={ig.id}>
                    {ig.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>معايير التسعير والتحكم بالمخزون</span>
          </h4>

          <div className="grid grid-cols-3 gap-3">
            {/* Purchase Price */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">سعر الشراء الافتراضي:</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={purchasePrice || ''}
                onChange={e => setPurchasePrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none text-left"
              />
            </div>

            {/* Sale Price */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">سعر المستهلك / البيع:</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={salePrice || ''}
                onChange={e => setSalePrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none text-left"
              />
            </div>

            {/* Initial Stock */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">الرصيد الابتدائي بالكرت:</label>
              <input 
                type="number" 
                placeholder="0"
                value={initialStock || ''}
                disabled={!!itemId} // Disable editing initial stock in edit mode
                onChange={e => setInitialStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none text-left disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Min Limit */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">الحد الأدنى للمخزون (إنذار الطلب):</label>
              <input 
                type="number" 
                value={minLimit}
                onChange={e => setMinLimit(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none text-left"
              />
            </div>

            {/* Max Limit */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">الحد الأقصى (الاستيعاب المستودعي):</label>
              <input 
                type="number" 
                value={maxLimit}
                onChange={e => setMaxLimit(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none text-left"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">ملاحظات فنية أو إضافية للمستودع:</label>
            <input 
              type="text" 
              placeholder="مثال: يرجى تخزين المادة بعيداً عن الرطوبة العالية..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
          <span>{itemId ? 'تحديث كرت الصنف' : 'حفظ كرت الصنف'}</span>
        </button>
      </div>
    </div>
  );
};

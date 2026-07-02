import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Package, Plus, Check, X, Tag, ShoppingBag, BarChart3, Image as ImageIcon } from 'lucide-react';
import { Item } from '../../types/erp';

export const ItemCardWindow: React.FC<{ windowId: string; onClose: () => void }> = ({ onClose }) => {
  const { itemGroups, addItem, showToast } = useErp();

  // Form states
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(itemGroups[0]?.id || '');
  const [unit, setUnit] = useState('حبة');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minLimit, setMinLimit] = useState<number>(5);
  const [maxLimit, setMaxLimit] = useState<number>(100);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      showToast('يرجى تحديد رمز المادة واسمها بالكامل لحفظ كرت الصنف.', 'warning');
      return;
    }

    const newItem: Item = {
      id: `it-${Date.now()}`,
      code,
      barcode: barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      name,
      groupId: groupId || null,
      unit,
      purchasePrice,
      salePrice,
      initialStock,
      currentStock: initialStock, // default
      minLimit,
      maxLimit,
      notes,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=120&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // placeholder
    };

    addItem(newItem);
    showToast(`تم بنجاح حفظ وتخزين بطاقة المادة: ${name} وتحديث مستودع التخزين الخاص بها.`, 'success');
    
    // Reset or close
    setCode('');
    setBarcode('');
    setName('');
    setPurchasePrice(0);
    setSalePrice(0);
    setInitialStock(0);
    setNotes('');
  };

  return (
    <div className="p-5 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none">
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
        
        {/* Main Section */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs space-y-4">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span>البيانات الأساسية لبطاقة الصنف / المادة</span>
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
                {itemGroups.map(ig => (
                  <option key={ig.id} value={ig.id}>
                    {ig.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Card */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs space-y-4">
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
                onChange={e => setInitialStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none text-left"
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
          className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Check className="w-4 h-4" />
          <span>حفظ كرت الصنف (F2)</span>
        </button>
      </div>
    </div>
  );
};

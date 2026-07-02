import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { 
  FileText, Plus, Trash2, Check, X, Printer, Image as ImageIcon, 
  Paperclip, Navigation, ArrowLeft, ArrowRight, Search, Barcode, HelpCircle 
} from 'lucide-react';
import { Invoice, InvoiceGridRow, InvoiceType, Item } from '../../types/erp';

interface InvoiceWindowProps {
  invoiceType?: InvoiceType;
  invoiceId?: string; // Optional if loading an existing one
  windowId: string;
  onClose: () => void;
}

export const InvoiceWindow: React.FC<InvoiceWindowProps> = ({ invoiceType = 'sale', invoiceId, windowId, onClose }) => {
  const { 
    branches, 
    warehouses, 
    costCenters, 
    currencies, 
    accounts, 
    customers, 
    items, 
    invoices, 
    addInvoice, 
    deleteInvoice,
    showToast
  } = useErp();

  // Load existing invoice or init new one
  const isEditing = !!invoiceId;
  const existingInv = isEditing ? invoices.find(inv => inv.id === invoiceId) : null;

  // Header State
  const [invoiceNo, setInvoiceNo] = useState(() => {
    if (existingInv) return existingInv.invoiceNo;
    const prefix = invoiceType.toUpperCase().substring(0, 3);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${rand}`;
  });
  const [date, setDate] = useState(() => existingInv ? existingInv.date : new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(() => existingInv ? existingInv.description : '');
  const [branchId, setBranchId] = useState(() => existingInv ? existingInv.branchId : branches[0]?.id || '');
  const [customerId, setCustomerId] = useState(() => existingInv ? existingInv.customerId : customers[0]?.id || '');
  const [currencyId, setCurrencyId] = useState(() => existingInv ? existingInv.currencyId : currencies[0]?.id || '');
  const [exchangeRate, setExchangeRate] = useState(() => existingInv ? existingInv.exchangeRate : 1.0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'bank'>(() => existingInv ? existingInv.paymentMethod : 'cash');
  const [warehouseId, setWarehouseId] = useState(() => existingInv ? existingInv.warehouseId : warehouses[0]?.id || '');
  
  // Accounts linking
  const [cashAccountId, setCashAccountId] = useState(() => existingInv ? existingInv.cashAccountId : 'acc-111001'); // Default cash
  const [itemsAccountId, setItemsAccountId] = useState(() => existingInv ? existingInv.itemsAccountId : 'acc-411001'); // Default sales revenue
  const [debitCostCenterId, setDebitCostCenterId] = useState(() => existingInv ? existingInv.debitCostCenterId : 'cc-1');
  const [creditCostCenterId, setCreditCostCenterId] = useState(() => existingInv ? existingInv.creditCostCenterId : 'cc-2');

  const [posted, setPosted] = useState(() => existingInv ? existingInv.posted : true);
  const [entryCreated, setEntryCreated] = useState(() => existingInv ? existingInv.entryCreated : true);

  // Grid State
  const [gridRows, setGridRows] = useState<InvoiceGridRow[]>(() => {
    if (existingInv) return existingInv.items;
    return [
      { id: 'grid-row-1', itemId: items[0]?.id || '', quantity: 1, unitPrice: items[0]?.salePrice || 0, unit: items[0]?.unit || 'حبة', notes: '', total: items[0]?.salePrice || 0 }
    ];
  });

  // Selected item detail for side panel
  const [selectedGridRowId, setSelectedGridRowId] = useState<string>('grid-row-1');

  // Totals input adjustments
  const [discount, setDiscount] = useState(() => existingInv ? existingInv.discount : 0);
  const [addition, setAddition] = useState(() => existingInv ? existingInv.addition : 0);
  const [taxPercent, setTaxPercent] = useState(() => existingInv ? existingInv.taxPercent : 15); // 15% VAT default
  const [expenses, setExpenses] = useState(() => existingInv ? existingInv.expenses : 0);
  const [paidAmount, setPaidAmount] = useState(() => existingInv ? existingInv.paidAmount : 0);
  const [salesRepId, setSalesRepId] = useState(() => existingInv ? existingInv.salesRepId : 'rep-1');
  const [originalInvoiceRef, setOriginalInvoiceRef] = useState(() => existingInv ? existingInv.originalInvoiceRef || '' : '');
  const [notes, setNotes] = useState(() => existingInv ? existingInv.notes : '');

  // Barcode quick input
  const [barcodeInput, setBarcodeInput] = useState('');

  // Auto set exchange rate based on currency selection
  useEffect(() => {
    const selectedCurr = currencies.find(c => c.id === currencyId);
    if (selectedCurr) {
      setExchangeRate(selectedCurr.rate);
    }
  }, [currencyId, currencies]);

  // Adjust account types based on invoice types
  useEffect(() => {
    if (invoiceType === 'purchase') {
      setCashAccountId('acc-111002'); // Bank or Cash
      setItemsAccountId('acc-511001'); // Purchase expense account
    } else {
      setCashAccountId('acc-111001'); // Cash account
      setItemsAccountId('acc-411001'); // Revenue account
    }
  }, [invoiceType]);

  // Calculations
  const totalItemCount = gridRows.length;
  const totalQuantitiesSum = gridRows.reduce((acc, r) => acc + Number(r.quantity), 0);
  const subtotal = gridRows.reduce((acc, r) => acc + Number(r.total), 0);
  const taxAmount = (subtotal - discount + addition) * (taxPercent / 100);
  const netAmount = subtotal - discount + addition + taxAmount + expenses;

  // Active grid row item definition
  const activeGridRow = gridRows.find(r => r.id === selectedGridRowId) || gridRows[0];
  const activeItem = items.find(it => it.id === activeGridRow?.itemId);

  const handleAddRow = () => {
    const newId = `grid-row-${Date.now()}`;
    setGridRows(prev => [
      ...prev,
      { id: newId, itemId: items[0]?.id || '', quantity: 1, unitPrice: invoiceType.includes('purchase') ? items[0]?.purchasePrice : items[0]?.salePrice, unit: items[0]?.unit || 'حبة', notes: '', total: invoiceType.includes('purchase') ? items[0]?.purchasePrice : items[0]?.salePrice }
    ]);
    setSelectedGridRowId(newId);
  };

  const handleDeleteRow = (id: string) => {
    if (gridRows.length <= 1) {
      showToast('يجب أن تحتوي الفاتورة على بند مادة واحد على الأقل.', 'warning');
      return;
    }
    setGridRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof InvoiceGridRow, value: any) => {
    setGridRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'itemId') {
          const matchedItem = items.find(it => it.id === value);
          if (matchedItem) {
            updatedRow.unitPrice = invoiceType.includes('purchase') ? matchedItem.purchasePrice : matchedItem.salePrice;
            updatedRow.unit = matchedItem.unit;
          }
        }
        // compute total
        updatedRow.total = Number(updatedRow.quantity) * Number(updatedRow.unitPrice);
        return updatedRow;
      }
      return row;
    }));
  };

  // Barcode lookup
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedItem = items.find(it => it.barcode === barcodeInput || it.code === barcodeInput);
    if (!matchedItem) {
      showToast(`عذراً، لم يتم العثور على صنف بالباركود أو الرمز: "${barcodeInput}" في مستودعات النظام.`, 'error');
      setBarcodeInput('');
      return;
    }

    // Add to grid or increment existing qty
    const existingRowIdx = gridRows.findIndex(r => r.itemId === matchedItem.id);
    if (existingRowIdx !== -1) {
      const row = gridRows[existingRowIdx];
      handleRowChange(row.id, 'quantity', row.quantity + 1);
    } else {
      const newId = `grid-row-${Date.now()}`;
      setGridRows(prev => [
        ...prev,
        {
          id: newId,
          itemId: matchedItem.id,
          quantity: 1,
          unitPrice: invoiceType.includes('purchase') ? matchedItem.purchasePrice : matchedItem.salePrice,
          unit: matchedItem.unit,
          notes: 'إضافة سريعة بالباركود',
          total: invoiceType.includes('purchase') ? matchedItem.purchasePrice : matchedItem.salePrice
        }
      ]);
      setSelectedGridRowId(newId);
    }

    setBarcodeInput('');
  };

  // Save invoice action
  const handleSave = () => {
    if (!invoiceNo) {
      showToast('يرجى تحديد رقم الفاتورة.', 'warning');
      return;
    }

    const savedInvoice: Invoice = {
      id: isEditing ? invoiceId! : `inv-${Date.now()}`,
      invoiceNo,
      type: invoiceType as InvoiceType,
      date,
      description,
      branchId,
      customerId,
      currencyId,
      exchangeRate,
      paymentMethod,
      warehouseId,
      cashAccountId,
      itemsAccountId,
      debitCostCenterId,
      creditCostCenterId,
      posted,
      entryCreated,
      paidAmount: Number(paidAmount),
      salesRepId,
      notes,
      originalInvoiceRef,
      items: gridRows,
      discount,
      addition,
      taxPercent,
      expenses,
      netAmount,
    };

    addInvoice(savedInvoice);
    showToast(`تم بنجاح حفظ وترحيل فاتورة ${getInvoiceTitle()} رقم ${invoiceNo}. تم تعديل أرصدة المخزون بالكامل وترحيل القيد اليومي التلقائي.`, 'success');
    onClose();
  };

  const getInvoiceTitle = () => {
    switch (invoiceType) {
      case 'purchase': return 'فاتورة شراء';
      case 'sale': return 'فاتورة مبيعات ومستهلك';
      case 'purchase_return': return 'مردود مشتريات للمورد';
      case 'sale_return': return 'مردود مبيعات من عميل';
      case 'inward': return 'إدخال مستودعي صادر';
      case 'outward': return 'إخراج مستودعي وارد';
      case 'opening_stock': return 'بضاعة أول المدة التقديرية';
      case 'closing_stock': return 'بضاعة آخر المدة المقدرة';
      case 'transfer_entry': return 'مناقلة مخزنية بقيد مالي';
      case 'transfer_no_entry': return 'مناقلة مخزنية بلا أثر مالي';
      default: return 'فاتورة مستودع';
    }
  };

  return (
    <div className="p-4 bg-slate-100 h-full flex flex-col justify-between text-slate-800 select-none overflow-hidden">
      
      {/* Top action bar (Ribbon controls) */}
      <div className="bg-slate-200 border border-slate-300 p-2 rounded-lg flex items-center justify-between shadow-xs mb-3 shrink-0">
        <div className="flex gap-1.5 text-xs">
          <button 
            onClick={() => {
              setInvoiceNo(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
              setGridRows([{ id: 'grid-row-new', itemId: items[0]?.id || '', quantity: 1, unitPrice: items[0]?.salePrice || 0, unit: items[0]?.unit || 'حبة', notes: '', total: items[0]?.salePrice || 0 }]);
              showToast('تم تهيئة الشاشة لبناء فاتورة جديدة بالكامل.', 'info');
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer transition-all"
          >
            جديد
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>حفظ (F2)</span>
          </button>
          <button 
            onClick={() => {
              if (confirm('هل أنت متأكد من حذف هذه الفاتورة وكافة حركاتها المحاسبية؟')) {
                if (isEditing) {
                  deleteInvoice(invoiceId!);
                  showToast('تم حذف الفاتورة وإلغاء قيودها تلقائياً.', 'success');
                  onClose();
                } else {
                  onClose();
                }
              }
            }}
            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-bold cursor-pointer transition-all"
          >
            حذف
          </button>
          <button 
            onClick={() => showToast('تم نسخ بيانات البنود الحالية إلى الحافظة.', 'info')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer transition-all"
          >
            نسخ
          </button>
          <button 
            onClick={() => showToast('تم لصق بيانات البنود المنسوخة بنجاح.', 'success')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer transition-all"
          >
            لصق
          </button>

          <div className="w-[1px] h-6 bg-slate-300 self-center mx-1" />

          <button 
            onClick={() => showToast('تم إرسال الفاتورة لخط طابعة الفواتير الحرارية بنجاح.', 'success')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer transition-all flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>طباعة</span>
          </button>
          <button 
            onClick={() => showToast('معاينة ما قبل الطباعة نشطة الآن.', 'info')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer transition-all"
          >
            معاينة
          </button>
          <button 
            onClick={() => showToast('يرجى سحب وإسقاط المرفقات لإقرانها بالفاتورة.', 'info')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition-all flex items-center gap-1"
            title="إرفاق ملفات وصور"
          >
            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
            <span>إرفاق</span>
          </button>
        </div>

        {/* Barcode Quick Form in header */}
        <form onSubmit={handleBarcodeSubmit} className="flex gap-1 items-center">
          <div className="relative flex items-center bg-white border border-slate-300 rounded px-2 py-0.5 max-w-[220px]">
            <Barcode className="w-4 h-4 text-slate-400 ml-1.5" />
            <input 
              type="text"
              placeholder="امسح الباركود أو ادخل كود..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none font-mono"
            />
          </div>
          <button 
            type="submit" 
            className="p-1 bg-slate-700 hover:bg-slate-800 text-white rounded cursor-pointer text-xs"
            title="أدخل المادة"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Main Grid Content Area split horizontally */}
      <div className="flex-1 flex gap-4 min-h-[220px] overflow-hidden">
        
        {/* Left main Invoice details, header fields and items table */}
        <div className="flex-1 bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs overflow-hidden flex flex-col space-y-3">
          
          {/* Invoice Header Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 shrink-0 text-[11px] bg-slate-50 p-2.5 rounded-md border">
            {/* Inv Number */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">رقم الفاتورة:</span>
              <input 
                type="text" 
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                className="w-full bg-white border rounded p-1 text-[11px] font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Date */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">تاريخ المعاملة:</span>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white border rounded p-1 text-[11px] font-mono focus:outline-none"
              />
            </div>

            {/* Branch */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">الفرع النشط:</span>
              <select 
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full bg-white border rounded p-1"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Customer/Supplier */}
            <div className="space-y-0.5 col-span-2">
              <span className="font-bold text-slate-500">
                {invoiceType.includes('purchase') ? 'المورد / جهة الشراء:' : 'العميل المستهلك / الذمة:'}
              </span>
              <select 
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full bg-white border rounded p-1 font-bold text-blue-700"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Warehouse */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">مستودع الصرف:</span>
              <select 
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full bg-white border rounded p-1"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">العملة:</span>
              <select 
                value={currencyId}
                onChange={e => setCurrencyId(e.target.value)}
                className="w-full bg-white border rounded p-1"
              >
                {currencies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Exchange rate */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">سعر الصرف:</span>
              <input 
                type="number" 
                value={exchangeRate}
                onChange={e => setExchangeRate(Number(e.target.value))}
                className="w-full bg-white border rounded p-1 text-left font-mono"
              />
            </div>

            {/* Payment method */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">طريقة الدفع:</span>
              <select 
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full bg-white border rounded p-1 font-bold"
              >
                <option value="cash">نقدي (الصندوق)</option>
                <option value="credit">ذمم مدينة (آجل)</option>
                <option value="bank">شبكة (البنك الأهلي)</option>
              </select>
            </div>

            {/* Cost Centers */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">مركز كلفة مدين:</span>
              <select 
                value={debitCostCenterId}
                onChange={e => setDebitCostCenterId(e.target.value)}
                className="w-full bg-white border rounded p-1"
              >
                {costCenters.map(cc => (
                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                ))}
              </select>
            </div>

            {/* Accounts linking */}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500">حساب النقد:</span>
              <select 
                value={cashAccountId}
                onChange={e => setCashAccountId(e.target.value)}
                className="w-full bg-white border rounded p-1 font-mono text-[10px]"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>

            {/* General statement description */}
            <div className="space-y-0.5 col-span-2">
              <span className="font-bold text-slate-500">البيان والشرح التوضيحي:</span>
              <input 
                type="text" 
                placeholder="بيان الفاتورة الإجمالي..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white border rounded p-1 text-[11px] focus:outline-none"
              />
            </div>
          </div>

          {/* Grid Table for Item Entries */}
          <div className="flex-1 border rounded-lg overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-200 border-b border-slate-300 text-slate-700 font-bold sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1.5 w-10 text-center">#</th>
                  <th className="px-3 py-1.5">المادة والمستودع</th>
                  <th className="px-3 py-1.5 w-24 text-center">الكمية</th>
                  <th className="px-3 py-1.5 w-20 text-center">الوحدة</th>
                  <th className="px-3 py-1.5 w-28 text-left">سعر الإفرادي</th>
                  <th className="px-3 py-1.5 w-28 text-left">الإجمالي الفرعي</th>
                  <th className="px-3 py-1.5">ملاحظات</th>
                  <th className="px-2 py-1.5 w-10 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gridRows.map((row, idx) => (
                  <tr 
                    key={row.id} 
                    onClick={() => setSelectedGridRowId(row.id)}
                    className={`hover:bg-blue-50/20 transition-colors ${selectedGridRowId === row.id ? 'bg-blue-50/50 border-y border-blue-200' : ''}`}
                  >
                    {/* Index */}
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    
                    {/* Item selector */}
                    <td className="px-2 py-1.5">
                      <select
                        value={row.itemId}
                        onChange={e => handleRowChange(row.id, 'itemId', e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold text-slate-800 focus:ring-0 focus:outline-none"
                      >
                        {items.map(it => (
                          <option key={it.id} value={it.id}>{it.code} - {it.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="px-2 py-1.5 text-center">
                      <input 
                        type="number"
                        value={row.quantity}
                        onChange={e => handleRowChange(row.id, 'quantity', Number(e.target.value))}
                        className="w-16 bg-slate-50 border rounded text-xs px-2 py-0.5 text-center font-mono font-bold focus:outline-none"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-2 py-1.5 text-center text-slate-500 font-bold">{row.unit}</td>

                    {/* Unit Price */}
                    <td className="px-2 py-1.5">
                      <input 
                        type="number"
                        value={row.unitPrice}
                        onChange={e => handleRowChange(row.id, 'unitPrice', Number(e.target.value))}
                        className="w-24 bg-slate-50 border rounded text-xs px-2 py-0.5 text-left font-mono font-bold focus:outline-none"
                      />
                    </td>

                    {/* Total sub */}
                    <td className="px-3 py-1.5 font-mono font-bold text-left text-slate-800 text-[12px]">
                      {row.total.toLocaleString()} ر.س
                    </td>

                    {/* Row Notes */}
                    <td className="px-2 py-1.5">
                      <input 
                        type="text"
                        placeholder="خصم ترويجي أو شروط..."
                        value={row.notes}
                        onChange={e => handleRowChange(row.id, 'notes', e.target.value)}
                        className="w-full bg-transparent border-none text-xs focus:ring-0 focus:outline-none"
                      />
                    </td>

                    {/* Row delete */}
                    <td className="px-2 py-1.5 text-center">
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            onClick={handleAddRow}
            className="w-full py-1.5 border border-dashed border-slate-300 rounded hover:border-blue-500 hover:text-blue-600 text-slate-500 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف مادة آخر للجدول</span>
          </button>
        </div>

        {/* Right sidebar: Item info card and calculations */}
        <div className="w-[280px] shrink-0 flex flex-col space-y-4">
          
          {/* Active Item Details */}
          {activeItem ? (
            <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs flex flex-col items-center text-center space-y-2 shrink-0">
              <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded self-start">
                معلومات البند المالي الحالي
              </span>
              <img 
                src={activeItem.image} 
                alt={activeItem.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-contain rounded border border-slate-200 p-1 bg-slate-50 shrink-0"
              />
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-xs text-slate-800 truncate max-w-[240px]">{activeItem.name}</h5>
                <p className="text-[10.5px] text-slate-400 font-mono">الباركود: {activeItem.barcode}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10.5px] w-full text-right pt-1.5 border-t border-slate-100">
                <span>سعر الجمهور: <strong className="font-mono text-blue-700 font-bold">{activeItem.salePrice} ر.س</strong></span>
                <span>سعر المشتري: <strong className="font-mono text-slate-600 font-bold">{activeItem.purchasePrice} ر.س</strong></span>
                <span>المخزون المتوفر: <strong className="font-mono text-emerald-700 font-bold">{activeItem.currentStock} {activeItem.unit}</strong></span>
                <span>الحد الأدنى للطلب: <strong className="font-mono text-red-600 font-bold">{activeItem.minLimit} {activeItem.unit}</strong></span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-xs text-center text-slate-400 text-xs py-14">
              <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
              <span>يرجى اختيار مادة لعرض بطاقتها الفنية هنا.</span>
            </div>
          )}

          {/* Totals Section */}
          <div className="flex-1 bg-slate-800 text-white rounded-lg p-4 shadow-md flex flex-col justify-between select-none">
            <h4 className="text-xs font-bold text-slate-300 border-b border-slate-700 pb-2 flex items-center justify-between">
              <span>ملخص حسابات الصافي</span>
              <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded font-mono font-bold text-blue-400">{getInvoiceTitle()}</span>
            </h4>

            {/* Fields input */}
            <div className="space-y-2 text-[11px] font-bold text-slate-300 pt-3">
              <div className="flex justify-between items-center">
                <span>عدد البنود / المواد:</span>
                <span className="font-mono text-slate-100">{totalItemCount} بند / {totalQuantitiesSum} حبة</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-700/50 pt-2">
                <span>الإجمالي قبل الخصم:</span>
                <span className="font-mono text-slate-100 text-xs">{subtotal.toLocaleString()} ر.س</span>
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center">
                <span>قيمة حسم الفاتورة:</span>
                <input 
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-20 bg-slate-700 text-white rounded px-1 text-center font-mono text-[11px] focus:outline-none"
                />
              </div>

              {/* Addition */}
              <div className="flex justify-between items-center">
                <span>إضافات عامة:</span>
                <input 
                  type="number"
                  value={addition}
                  onChange={e => setAddition(Number(e.target.value))}
                  className="w-20 bg-slate-700 text-white rounded px-1 text-center font-mono text-[11px] focus:outline-none"
                />
              </div>

              {/* VAT tax */}
              <div className="flex justify-between items-center">
                <span>الضريبة المضافة (%):</span>
                <input 
                  type="number"
                  value={taxPercent}
                  onChange={e => setTaxPercent(Number(e.target.value))}
                  className="w-20 bg-slate-700 text-white rounded px-1 text-center font-mono text-[11px] focus:outline-none"
                />
              </div>

              {/* Expenses */}
              <div className="flex justify-between items-center">
                <span>أجور شحن وتوصيل:</span>
                <input 
                  type="number"
                  value={expenses}
                  onChange={e => setExpenses(Number(e.target.value))}
                  className="w-20 bg-slate-700 text-white rounded px-1 text-center font-mono text-[11px] focus:outline-none"
                />
              </div>
            </div>

            {/* Total Net Amount */}
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 flex flex-col items-center justify-center space-y-0.5 shadow-inner mt-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">الصافي الكلي المطلوب</span>
              <span className="text-xl font-mono font-black text-green-400">
                {netAmount.toLocaleString()} <span className="text-xs">ر.س</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Payment info & navigation buttons */}
      <div className="bg-white border border-slate-300 p-3 rounded-lg flex items-center justify-between text-xs font-bold shadow-xs mt-3 shrink-0">
        <div className="flex gap-4 items-center flex-1">
          {/* Paid amount */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">الدفعة المسددة:</span>
            <input 
              type="number" 
              placeholder="0.00"
              value={paidAmount || ''}
              onChange={e => setPaidAmount(Number(e.target.value))}
              className="w-24 bg-slate-50 border rounded p-1 text-xs font-mono font-bold text-green-700"
            />
          </div>

          {/* Sales rep */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">مندوب المبيعات:</span>
            <select 
              value={salesRepId}
              onChange={e => setSalesRepId(e.target.value)}
              className="bg-slate-50 border rounded p-1 text-xs"
            >
              <option value="rep-1">محمد العتيبي</option>
              <option value="rep-2">أحمد الشمري</option>
              <option value="rep-3">خالد عسيري</option>
            </select>
          </div>

          {/* Original invoice link */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">أصل الفاتورة (المرجع):</span>
            <input 
              type="text" 
              placeholder="رقم الفاتورة الأصلية..."
              value={originalInvoiceRef}
              onChange={e => setOriginalInvoiceRef(e.target.value)}
              className="w-32 bg-slate-50 border rounded p-1 text-xs font-mono"
            />
          </div>
        </div>

        {/* Navigation / Navigation buttons first, prev, next, last */}
        <div className="flex gap-1">
          <button 
            onClick={() => showToast('أنت بالفعل تشاهد أول فاتورة مسجلة في الدفاتر.', 'info')}
            className="p-1.5 hover:bg-slate-100 rounded border cursor-pointer" 
            title="الفاتورة الأولى"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => showToast('جاري تحميل الفاتورة السابقة من قواعد البيانات...', 'info')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded font-bold cursor-pointer text-xs"
          >
            السابق
          </button>
          <button 
            onClick={() => showToast('جاري تحميل الفاتورة التالية من قواعد البيانات...', 'info')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded font-bold cursor-pointer text-xs"
          >
            التالي
          </button>
          <button 
            onClick={() => showToast('أنت بالفعل تشاهد الفاتورة الأخيرة المسجلة.', 'info')}
            className="p-1.5 hover:bg-slate-100 rounded border cursor-pointer" 
            title="الفاتورة الأخيرة"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded font-bold cursor-pointer text-xs"
          >
            خروج
          </button>
        </div>
      </div>

    </div>
  );
};

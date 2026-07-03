import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { PrintDesigner } from './PrintDesigner';
import { 
  FileText, Plus, Trash2, Check, X, Printer, Image as ImageIcon, Settings,
  Paperclip, Navigation, ArrowLeft, ArrowRight, Search, Barcode, HelpCircle,
  Copy, RotateCcw, RotateCw, Heart, RefreshCw, Mail, FileSpreadsheet, FileDown,
  Info, History, Edit3, CheckCircle, Upload, Eye, Download, Calendar, DollarSign,
  Briefcase, Warehouse, MapPin, AlertTriangle
} from 'lucide-react';
import { Invoice, InvoiceGridRow, InvoiceType, Item, PrintTemplate } from '../../types/erp';

interface InvoiceWindowProps {
  invoiceType?: InvoiceType;
  invoiceId?: string; // Optional if loading an existing one
  windowId: string;
  onClose: () => void;
}

export const InvoiceWindow: React.FC<InvoiceWindowProps> = ({ 
  invoiceType = 'sale', 
  invoiceId, 
  windowId, 
  onClose 
}) => {
  const { 
    connectedDbId,
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
    showToast,
    favorites,
    toggleFavorite,
    templates
  } = useErp();

  // Navigation and active record tracking
  const typeInvoices = invoices.filter(inv => inv.type === invoiceType);
  const [currentId, setCurrentId] = useState<string | null>(invoiceId || null);
  const isEditing = !!currentId;

  // Header and grid state variables
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'bank'>('cash');
  const [warehouseId, setWarehouseId] = useState('');
  const [cashAccountId, setCashAccountId] = useState('acc-111001');
  const [itemsAccountId, setItemsAccountId] = useState('acc-411001');
  const [debitCostCenterId, setDebitCostCenterId] = useState('cc-1');
  const [creditCostCenterId, setCreditCostCenterId] = useState('cc-2');
  const [posted, setPosted] = useState(true);
  const [entryCreated, setEntryCreated] = useState(true);

  // Items Grid state
  const [gridRows, setGridRows] = useState<InvoiceGridRow[]>([]);
  const [selectedGridRowId, setSelectedGridRowId] = useState<string>('');

  // Adjustments & Totals
  const [discount, setDiscount] = useState(0);
  const [addition, setAddition] = useState(0);
  const [taxPercent, setTaxPercent] = useState(15);
  const [expenses, setExpenses] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [salesRepId, setSalesRepId] = useState('rep-1');
  const [originalInvoiceRef, setOriginalInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');

  // Additional rich features
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [stickyNotes, setStickyNotes] = useState('');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  
  // Barcode Input
  const [barcodeInput, setBarcodeInput] = useState('');

  // Modals & Popovers States
  const [isGearMenuOpen, setIsGearMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Email form state
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Undo / Redo history tracking state
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [blockHistoryPush, setBlockHistoryPush] = useState(false);

  // Load selected invoice values
  useEffect(() => {
    const inv = invoices.find(i => i.id === currentId);
    if (inv) {
      setInvoiceNo(inv.invoiceNo);
      setDate(inv.date);
      setDescription(inv.description || '');
      setBranchId(inv.branchId || branches[0]?.id || '');
      setCustomerId(inv.customerId || customers[0]?.id || '');
      setCurrencyId(inv.currencyId || currencies[0]?.id || '');
      setExchangeRate(inv.exchangeRate || 1.0);
      setPaymentMethod(inv.paymentMethod || 'cash');
      setWarehouseId(inv.warehouseId || warehouses[0]?.id || '');
      setCashAccountId(inv.cashAccountId || 'acc-111001');
      setItemsAccountId(inv.itemsAccountId || 'acc-411001');
      setDebitCostCenterId(inv.debitCostCenterId || 'cc-1');
      setCreditCostCenterId(inv.creditCostCenterId || 'cc-2');
      setPosted(inv.posted !== undefined ? inv.posted : true);
      setEntryCreated(inv.entryCreated !== undefined ? inv.entryCreated : true);
      setGridRows(inv.items || []);
      setDiscount(inv.discount || 0);
      setAddition(inv.addition || 0);
      setTaxPercent(inv.taxPercent || 15);
      setExpenses(inv.expenses || 0);
      setPaidAmount(inv.paidAmount || 0);
      setSalesRepId(inv.salesRepId || 'rep-1');
      setOriginalInvoiceRef(inv.originalInvoiceRef || '');
      setNotes(inv.notes || '');
      setAttachments(inv.attachments || []);
      setStickyNotes(inv.stickyNotes || '');
      setAuditLogs(inv.auditLogs || [`تم فتح وتصفح الفاتورة الرقمية في ${new Date().toLocaleTimeString('ar-SA')}`]);
      
      if (inv.items && inv.items.length > 0) {
        setSelectedGridRowId(inv.items[0].id);
      }
    } else {
      // Clear for a brand new invoice
      handleResetNewInvoice();
    }
  }, [currentId, invoices]);

  // Handle auto-exchange rate
  useEffect(() => {
    const curr = currencies.find(c => c.id === currencyId);
    if (curr) {
      setExchangeRate(curr.rate);
    }
  }, [currencyId, currencies]);

  // Default accounts setup depending on invoice type
  useEffect(() => {
    if (!isEditing) {
      if (invoiceType === 'purchase' || invoiceType === 'purchase_return') {
        setCashAccountId('acc-111002'); // Bank or Purchase cache
        setItemsAccountId('acc-511001'); // Purchase expense
      } else {
        setCashAccountId('acc-111001'); // Cash account
        setItemsAccountId('acc-411001'); // Revenue account
      }
    }
  }, [invoiceType, isEditing]);

  // Push history on major state change for undo/redo
  useEffect(() => {
    if (blockHistoryPush || !invoiceNo) return;
    
    const timer = setTimeout(() => {
      const stateSnapshot = {
        invoiceNo, date, description, branchId, customerId, currencyId,
        exchangeRate, paymentMethod, warehouseId, cashAccountId, itemsAccountId,
        debitCostCenterId, creditCostCenterId, posted, entryCreated,
        gridRows: JSON.parse(JSON.stringify(gridRows)),
        discount, addition, taxPercent, expenses, paidAmount, salesRepId,
        originalInvoiceRef, notes, attachments, stickyNotes
      };

      setHistory(prev => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, stateSnapshot];
      });
      setHistoryIndex(prev => prev + 1);
    }, 500); // debounced state push to avoid micro-lag

    return () => clearTimeout(timer);
  }, [
    gridRows, discount, addition, taxPercent, expenses, paidAmount, 
    notes, stickyNotes, customerId, warehouseId, paymentMethod
  ]);

  // Undo operation
  const handleUndo = () => {
    if (historyIndex > 0) {
      setBlockHistoryPush(true);
      const prevIdx = historyIndex - 1;
      const snapshot = history[prevIdx];
      
      setGridRows(snapshot.gridRows);
      setDiscount(snapshot.discount);
      setAddition(snapshot.addition);
      setTaxPercent(snapshot.taxPercent);
      setExpenses(snapshot.expenses);
      setPaidAmount(snapshot.paidAmount);
      setNotes(snapshot.notes);
      setStickyNotes(snapshot.stickyNotes);
      setCustomerId(snapshot.customerId);
      setWarehouseId(snapshot.warehouseId);
      setPaymentMethod(snapshot.paymentMethod);
      
      setHistoryIndex(prevIdx);
      showToast('تم التراجع خطوة للخلف بنجاح.', 'info');
      setTimeout(() => setBlockHistoryPush(false), 200);
    } else {
      showToast('لا يوجد المزيد من العمليات للتراجع عنها.', 'warning');
    }
  };

  // Redo operation
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setBlockHistoryPush(true);
      const nextIdx = historyIndex + 1;
      const snapshot = history[nextIdx];
      
      setGridRows(snapshot.gridRows);
      setDiscount(snapshot.discount);
      setAddition(snapshot.addition);
      setTaxPercent(snapshot.taxPercent);
      setExpenses(snapshot.expenses);
      setPaidAmount(snapshot.paidAmount);
      setNotes(snapshot.notes);
      setStickyNotes(snapshot.stickyNotes);
      setCustomerId(snapshot.customerId);
      setWarehouseId(snapshot.warehouseId);
      setPaymentMethod(snapshot.paymentMethod);
      
      setHistoryIndex(nextIdx);
      showToast('تم إعادة تطبيق التعديل.', 'info');
      setTimeout(() => setBlockHistoryPush(false), 200);
    } else {
      showToast('أنت بالفعل تشاهد التعديل الأحدث.', 'warning');
    }
  };

  // Calculations
  const totalItemCount = gridRows.length;
  const totalQuantitiesSum = gridRows.reduce((acc, r) => acc + Number(r.quantity || 0), 0);
  const subtotal = gridRows.reduce((acc, r) => acc + Number(r.total || 0), 0);
  const taxAmount = (subtotal - discount + addition) * (taxPercent / 100);
  const netAmount = subtotal - discount + addition + taxAmount + expenses;

  // Active Grid Row element
  const activeGridRow = gridRows.find(r => r.id === selectedGridRowId) || gridRows[0];
  const activeItem = items.find(it => it.id === activeGridRow?.itemId);

  // Clear states for new creation
  const handleResetNewInvoice = () => {
    const prefix = invoiceType.toUpperCase().substring(0, 3);
    const rand = Math.floor(1000 + Math.random() * 9000);
    
    setBlockHistoryPush(true);
    setInvoiceNo(`${prefix}-${rand}`);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setBranchId(branches[0]?.id || '');
    setCustomerId(customers[0]?.id || '');
    setCurrencyId(currencies[0]?.id || '');
    setExchangeRate(1.0);
    setPaymentMethod('cash');
    setWarehouseId(warehouses[0]?.id || '');
    setDiscount(0);
    setAddition(0);
    setTaxPercent(15);
    setExpenses(0);
    setPaidAmount(0);
    setOriginalInvoiceRef('');
    setNotes('');
    setAttachments([]);
    setStickyNotes('');
    setAuditLogs([`تأسيس وبناء مسودة فاتورة مبيعات جديدة في ${new Date().toLocaleTimeString('ar-SA')}`]);
    
    const initialRowId = `row-${Date.now()}`;
    const initialRows = [
      { id: initialRowId, itemId: items[0]?.id || '', quantity: 1, unitPrice: items[0]?.salePrice || 0, unit: items[0]?.unit || 'حبة', notes: '', total: items[0]?.salePrice || 0 }
    ];
    setGridRows(initialRows);
    setSelectedGridRowId(initialRowId);
    
    setHistory([]);
    setHistoryIndex(-1);
    setCurrentId(null);
    setTimeout(() => setBlockHistoryPush(false), 300);
  };

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
        updatedRow.total = Number(updatedRow.quantity || 0) * Number(updatedRow.unitPrice || 0);
        return updatedRow;
      }
      return row;
    }));
  };

  // Barcode rapid lookup
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedItem = items.find(it => it.barcode === barcodeInput || it.code === barcodeInput);
    if (!matchedItem) {
      showToast(`عذراً، لم يتم العثور على صنف بالباركود أو الرمز: "${barcodeInput}"`, 'error');
      setBarcodeInput('');
      return;
    }

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
    showToast(`تمت إضافة صنف بالباركود: ${matchedItem.name}`, 'success');
  };

  // Save invoice action
  const handleSave = () => {
    if (!invoiceNo) {
      showToast('يرجى تحديد رقم الفاتورة أولاً.', 'warning');
      return;
    }

    const currentLogs = [...auditLogs, `تم إجراء حفظ وتخزين للبيانات المالية في ${new Date().toLocaleString('ar-SA')}`];
    setAuditLogs(currentLogs);

    const savedInvoice: Invoice = {
      id: currentId || `inv-${Date.now()}`,
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
      attachments,
      stickyNotes,
      auditLogs: currentLogs
    };

    addInvoice(savedInvoice);
    setCurrentId(savedInvoice.id);
    showToast(`تم بنجاح حفظ وترحيل فاتورة ${getInvoiceTitle()} رقم ${invoiceNo}. تم ترحيل القيود تلقائياً وتعديل الأرصدة.`, 'success');
  };

  // Delete invoice action
  const handleDelete = () => {
    if (!isEditing) {
      showToast('الفاتورة الحالية مسودة غير مخزنة بالحاسب المالي.', 'warning');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف فاتورة ${getInvoiceTitle()} رقم ${invoiceNo} نهائياً؟ سيتم إلغاء القيود وإرجاع المخزون.`)) {
      deleteInvoice(currentId!);
      showToast('تم حذف الفاتورة وإلغاء حركاتها بنجاح من قاعدة البيانات.', 'success');
      handleResetNewInvoice();
    }
  };

  // Copy items grid content
  const handleCopy = () => {
    const copiedItemsJson = JSON.stringify(gridRows);
    localStorage.setItem('erp_copied_invoice_items', copiedItemsJson);
    showToast(`تم نسخ بنود المواد (${gridRows.length} بند) للحافظة المحاسبية.`, 'info');
  };

  // Paste copied items
  const handlePasteItems = () => {
    const copied = localStorage.getItem('erp_copied_invoice_items');
    if (copied) {
      try {
        const parsed = JSON.parse(copied);
        if (Array.isArray(parsed)) {
          setGridRows(parsed.map(item => ({ ...item, id: `row-pasted-${Math.random()}` })));
          showToast('تم لصق ومطابقة بنود المواد المنسوخة بنجاح.', 'success');
        }
      } catch (err) {
        showToast('فشل تطبيق المواد المنسوخة.', 'error');
      }
    } else {
      showToast('الحافظة المحاسبية فارغة. انسخ مواد أولاً.', 'warning');
    }
  };

  // Upload attachment base64 simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !connectedDbId) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      showToast('جاري تشفير ورفع المستند للخادم...', 'info');
      try {
        const res = await fetch(`/api/data/${connectedDbId}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileContent: base64 })
        });
        if (res.ok) {
          const data = await res.json();
          setAttachments(prev => [...prev, { name: file.name, url: data.fileUrl }]);
          showToast(`تم رفع وحفظ المرفق "${file.name}" بنجاح على مخدم الشركة.`, 'success');
        } else {
          showToast('فشل الرفع للمخدم.', 'error');
        }
      } catch (err) {
        showToast('خطأ بالرفع السحابي للمرفقات.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Email simulation
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) {
      showToast('يرجى إدخال عنوان البريد الإلكتروني للمستلم.', 'warning');
      return;
    }
    setIsSendingEmail(true);
    showToast('جاري الاتصال بخادم البريد الصادر SMTP وتشفير الفاتورة الرقمية...', 'info');
    setTimeout(() => {
      setIsSendingEmail(false);
      setIsEmailOpen(false);
      showToast(`تم إرسال الفاتورة رقم ${invoiceNo} للبريد ${emailAddress} بنجاح!`, 'success');
    }, 1500);
  };

  // Direct mock export download
  const handleExportFile = (format: 'pdf' | 'excel' | 'word') => {
    showToast(`جاري تصدير الفاتورة ومواءمة التنسيق لـ ${format.toUpperCase()}...`, 'info');
    setTimeout(() => {
      const content = `الفاتورة الضريبية رقم: ${invoiceNo}\nالصافي: ${netAmount.toLocaleString()} ريال\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceNo}_Export.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'csv' : 'doc'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`تم حفظ وتنزيل ملف التصدير بنجاح.`, 'success');
    }, 800);
  };

  // Record sequential navigation
  const handleNavigate = (action: 'first' | 'prev' | 'next' | 'last') => {
    if (typeInvoices.length === 0) {
      showToast('لا يوجد فواتير مسجلة في هذا الدفتر المالي.', 'warning');
      return;
    }

    const currentIdx = typeInvoices.findIndex(inv => inv.id === currentId);
    let targetIdx = 0;

    switch (action) {
      case 'first':
        targetIdx = 0;
        break;
      case 'last':
        targetIdx = typeInvoices.length - 1;
        break;
      case 'prev':
        targetIdx = Math.max(0, currentIdx - 1);
        if (currentIdx === 0) {
          showToast('أنت بالفعل تشاهد الفاتورة الأولى المسجلة.', 'info');
          return;
        }
        break;
      case 'next':
        targetIdx = Math.min(typeInvoices.length - 1, currentIdx + 1);
        if (currentIdx === typeInvoices.length - 1 || currentIdx === -1) {
          showToast('أنت تشاهد الفاتورة الأخيرة المخزنة.', 'info');
          return;
        }
        break;
    }

    const targetInv = typeInvoices[targetIdx];
    setCurrentId(targetInv.id);
    showToast(`تحميل السند المالي رقم ${targetInv.invoiceNo}`, 'success');
  };

  const getRecordNumLabel = () => {
    if (!isEditing) return 'فاتورة جديدة';
    const currentIdx = typeInvoices.findIndex(inv => inv.id === currentId);
    return `${currentIdx + 1} من ${typeInvoices.length}`;
  };

  const isFavorite = favorites.includes(`invoice-${invoiceType}-${invoiceNo}`);
  const handleToggleFavorite = () => {
    toggleFavorite(`invoice-${invoiceType}-${invoiceNo}`);
    showToast(isFavorite ? 'تمت الإزالة من المفضلة لسرعة التصفح.' : 'تم الإدراج في مفضلة السندات لسرعة الوصول.', 'success');
  };

  const getInvoiceTitle = () => {
    switch (invoiceType) {
      case 'purchase': return 'فاتورة شراء مستودعي';
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

  const getThemeColorClass = () => {
    switch (invoiceType) {
      case 'sale': return 'emerald';
      case 'purchase': return 'rose';
      case 'sale_return': return 'teal';
      case 'purchase_return': return 'orange';
      default: return 'blue';
    }
  };

  const activeThemeClass = getThemeColorClass();

  // Search filtered invoices
  const filteredInvoicesList = typeInvoices.filter(inv => {
    const custName = customers.find(c => c.id === inv.customerId)?.name || '';
    return inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
           custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (inv.date && inv.date.includes(searchQuery));
  });

  // Direct print mock trigger
  const handleDirectPrintTrigger = () => {
    showToast('جاري تجميع الهيكل الرسومي وإرساله لملقم الطابعة الافتراضي...', 'info');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  return (
    <div className="p-3 bg-slate-100 h-full flex flex-col justify-between text-slate-800 select-none overflow-hidden relative" dir="rtl">
      
      {/* Top Header info area */}
      <div className="bg-white border border-slate-300 p-2 rounded-lg flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${activeThemeClass}-100 text-${activeThemeClass}-700 rounded-lg`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 flex items-center gap-2">
              {getInvoiceTitle()}
              <span className={`text-[10px] bg-${activeThemeClass}-100 text-${activeThemeClass}-800 px-2 py-0.5 rounded-full font-bold uppercase`}>
                {invoiceType}
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold">نظام الميزان المحاسبي المحترف لإدارة المبيعات والمستودعات</p>
          </div>
        </div>

        {/* Barcode input area */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
          <Barcode className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باركود الصنف أو رمزه المحاسبي..."
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-56 font-mono font-bold"
          />
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* Main Form Working Space */}
      <div className="flex-1 overflow-y-auto py-2.5 space-y-2.5">
        
        {/* Header fields grid */}
        <div className="grid grid-cols-12 gap-2.5 bg-white border border-slate-300 p-3 rounded-lg shadow-xs">
          
          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">رقم الفاتورة المالي</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-mono font-black text-slate-950 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">التاريخ والوقت الرقمي</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">الفرع المالي المسؤول</label>
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-800"
            >
              {branches.map(br => <option key={br.id} value={br.id}>{br.name}</option>)}
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">الحساب المالي (العميل/المورد)</label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-bold"
            >
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">مستودع الصرف أو التوريد</label>
            <select
              value={warehouseId}
              onChange={e => setWarehouseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-bold"
            >
              {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">العملة وصرف النقد</label>
            <div className="flex gap-1.5">
              <select
                value={currencyId}
                onChange={e => setCurrencyId(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-800"
              >
                {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
              </select>
              <input
                type="number"
                value={exchangeRate}
                disabled
                className="w-16 bg-slate-100 border border-slate-300 rounded p-1.5 text-xs font-mono text-center text-slate-500"
              />
            </div>
          </div>

          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">طريقة سداد قيمة الفاتورة</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-bold"
            >
              <option value="cash">نقدي (صندوق الفروع مباشرة)</option>
              <option value="credit">ذمم وآجل (على كشف الحساب)</option>
              <option value="bank">شبكة وبنك (إيداع الحسابات)</option>
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-[10px] font-black text-slate-500 mb-1">البيان والشرح العام للسند</label>
            <input
              type="text"
              placeholder="اكتب شرحاً موجزاً لحفظه في دفتر اليومية التلقائي..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-800"
            />
          </div>

        </div>

        {/* Central working area: split to Grid (Left) and Item card / helper (Right) */}
        <div className="grid grid-cols-12 gap-3 h-[240px] items-stretch">
          
          {/* Left items grid */}
          <div className="col-span-9 bg-white border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between shadow-xs overflow-hidden">
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded">
              <table className="w-full text-xs font-bold divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 text-slate-500">
                  <tr>
                    <th className="py-1 px-1.5 text-center w-8">#</th>
                    <th className="py-1 px-1.5 text-right">اسم المادة المحاسبية</th>
                    <th className="py-1 px-1.5 text-center w-16">الوحدة</th>
                    <th className="py-1 px-1.5 text-center w-20">الكمية</th>
                    <th className="py-1 px-1.5 text-center w-24">سعر الوحدة</th>
                    <th className="py-1 px-1.5 text-center w-16">الخصم</th>
                    <th className="py-1 px-1.5 text-center w-24">الإجمالي</th>
                    <th className="py-1 px-1.5 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {gridRows.map((row, index) => {
                    return (
                      <tr 
                        key={row.id} 
                        onClick={() => setSelectedGridRowId(row.id)}
                        className={`hover:bg-slate-50 cursor-pointer ${selectedGridRowId === row.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="py-1 px-1.5 text-center font-mono text-[10px] text-slate-400">{index + 1}</td>
                        <td className="py-1 px-1.5">
                          <select
                            value={row.itemId}
                            onChange={e => handleRowChange(row.id, 'itemId', e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-xs font-bold"
                          >
                            {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                          </select>
                        </td>
                        <td className="py-1 px-1.5 text-center text-slate-500">{row.unit}</td>
                        <td className="py-1 px-1.5">
                          <input
                            type="number"
                            value={row.quantity || ''}
                            onChange={e => handleRowChange(row.id, 'quantity', Number(e.target.value))}
                            className="w-full bg-slate-50 border rounded px-1 py-0.5 text-center font-mono text-xs"
                          />
                        </td>
                        <td className="py-1 px-1.5">
                          <input
                            type="number"
                            value={row.unitPrice || ''}
                            onChange={e => handleRowChange(row.id, 'unitPrice', Number(e.target.value))}
                            className="w-full bg-slate-50 border rounded px-1 py-0.5 text-center font-mono text-xs"
                          />
                        </td>
                        <td className="py-1 px-1.5 text-center text-slate-400 font-mono">-</td>
                        <td className="py-1 px-1.5 text-center font-mono text-slate-900 font-black">
                          {row.total?.toLocaleString() || '0.00'}
                        </td>
                        <td className="py-1 px-1.5 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRow(row.id); }}
                            className="p-1 text-slate-300 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick grid controls */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 shrink-0 text-[10px] font-bold">
              <div className="flex gap-2">
                <button
                  onClick={handleAddRow}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border rounded flex items-center gap-1 cursor-pointer text-slate-700"
                >
                  <Plus className="w-3 h-3" /> إضافة بند مادة جديد
                </button>
                <button
                  onClick={handlePasteItems}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border rounded flex items-center gap-1 cursor-pointer text-slate-600"
                >
                  <Copy className="w-3 h-3" /> تطبيق البنود المنسوخة
                </button>
              </div>
              <div className="flex gap-4 text-slate-400 font-bold">
                <span>إجمالي عدد المواد: <span className="text-slate-700 font-mono">{totalItemCount}</span></span>
                <span>مجموع الكميات والقطع: <span className="text-slate-700 font-mono">{totalQuantitiesSum}</span></span>
              </div>
            </div>
          </div>

          {/* Right sidebar info panel */}
          <div className="col-span-3 bg-slate-800 text-slate-100 rounded-lg p-3 flex flex-col justify-between shadow-md">
            {activeItem ? (
              <div className="space-y-2.5">
                <div className="border-b border-slate-700 pb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">بطاقة المادة النشطة</span>
                  <h4 className="text-xs font-black text-white truncate" title={activeItem.name}>{activeItem.name}</h4>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex justify-between font-mono">
                    <span>رمز المادة:</span>
                    <span className="font-bold text-white">{activeItem.code}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>الباركود الدولي:</span>
                    <span className="font-bold text-white">{activeItem.barcode || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between font-mono border-t border-slate-700/50 pt-1">
                    <span>الرصيد الفعلي بالمستودع:</span>
                    <span className={`font-black ${activeItem.currentStock < 5 ? 'text-rose-400' : 'text-green-400'}`}>
                      {activeItem.currentStock} {activeItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>آخر سعر شراء مالي:</span>
                    <span className="font-bold text-white">{activeItem.purchasePrice} ر.س</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>سعر البيع المعتمد:</span>
                    <span className="font-bold text-white">{activeItem.salePrice} ر.س</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 flex flex-col gap-1 items-center justify-center">
                <HelpCircle className="w-10 h-10 text-slate-600 mb-1" />
                <span className="text-[10px] font-bold">حدد أحد السطور لعرض بطاقته المخزنية هنا</span>
              </div>
            )}

            {/* Calculations summaries inside dark board */}
            <div className="border-t border-slate-700 pt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>المجموع المبدئي:</span>
                <span className="font-mono text-white">{subtotal.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>الضريبة (%{taxPercent}):</span>
                <span className="font-mono text-white">{taxAmount.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300 border-t border-slate-700 pt-1 font-bold">
                <span>الصافي الكلي:</span>
                <span className="font-mono text-green-400 text-sm font-black">{netAmount.toLocaleString()} ر.س</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Payment info Adjustments */}
        <div className="bg-white border border-slate-300 p-3 rounded-lg flex items-center justify-between text-xs font-bold shadow-xs">
          <div className="flex gap-4 items-center flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">الدفعة المسددة:</span>
              <input 
                type="number" 
                placeholder="0.00"
                value={paidAmount || ''}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-24 bg-slate-50 border rounded p-1 text-xs font-mono font-bold text-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">مندوب المبيعات:</span>
              <select 
                value={salesRepId}
                onChange={e => setSalesRepId(e.target.value)}
                className="bg-slate-50 border rounded p-1 text-xs text-slate-800"
              >
                <option value="rep-1">محمد العتيبي</option>
                <option value="rep-2">أحمد الشمري</option>
                <option value="rep-3">خالد عسيري</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">أصل الفاتورة (المرجع):</span>
              <input 
                type="text" 
                placeholder="رقم الفاتورة الأصلية..."
                value={originalInvoiceRef}
                onChange={e => setOriginalInvoiceRef(e.target.value)}
                className="w-32 bg-slate-50 border rounded p-1 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 border-r border-slate-300 pr-4">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">حسم:</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-16 bg-slate-50 border rounded p-1 text-center font-mono font-bold"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">إضافي:</span>
                <input
                  type="number"
                  value={addition || ''}
                  onChange={e => setAddition(Number(e.target.value))}
                  className="w-16 bg-slate-50 border rounded p-1 text-center font-mono font-bold"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">شحن:</span>
                <input
                  type="number"
                  value={expenses || ''}
                  onChange={e => setExpenses(Number(e.target.value))}
                  className="w-16 bg-slate-50 border rounded p-1 text-center font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 
        ##############################################################
        AlMezan.NET STYLE COMPREHENSIVE ENTERPRISE TOOLBAR
        ##############################################################
      */}
      <div className="bg-slate-200 border border-slate-300 p-2 rounded-lg flex items-center justify-between text-xs font-bold shadow-sm shrink-0">
        
        {/* Core operation actions */}
        <div className="flex gap-1">
          <button 
            onClick={handleResetNewInvoice}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer flex items-center gap-1 text-slate-700"
            title="إنشاء سند جديد"
          >
            <Plus className="w-3.5 h-3.5" /> جديد
          </button>
          <button 
            onClick={handleSave}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer flex items-center gap-1 shadow-xs"
            title="حفظ وترحيل السند المالي"
          >
            <Check className="w-3.5 h-3.5" /> حفظ
          </button>
          <button 
            onClick={handleDelete}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-bold cursor-pointer flex items-center gap-1"
            title="حذف هذا السند نهائياً"
          >
            <Trash2 className="w-3.5 h-3.5" /> حذف
          </button>
          <button 
            onClick={handleCopy}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer flex items-center gap-1"
            title="نسخ بنود المواد"
          >
            <Copy className="w-3.5 h-3.5" /> نسخ
          </button>
          <button 
            onClick={() => setIsAttachmentsOpen(true)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer flex items-center gap-1"
            title="المستندات المرفقة للمسح الضوئي"
          >
            <Paperclip className="w-3.5 h-3.5" /> المرفقات ({attachments.length})
          </button>
          
          {/* Print & Gear Actions */}
          <div className="flex items-center gap-0 bg-white border border-slate-300 rounded-lg overflow-hidden">
            <button 
              onClick={() => setIsPreviewOpen(true)}
              className="px-2.5 py-1.5 hover:bg-slate-50 border-l border-slate-200 font-bold cursor-pointer flex items-center gap-1 text-slate-700"
              title="معاينة الطباعة الافتراضية للعميل"
            >
              <Eye className="w-3.5 h-3.5" /> معاينة
            </button>
            <button 
              onClick={handleDirectPrintTrigger}
              className="px-2.5 py-1.5 hover:bg-slate-50 border-l border-slate-200 font-bold cursor-pointer flex items-center gap-1 text-slate-700"
              title="طباعة فورية"
            >
              <Printer className="w-3.5 h-3.5" /> طباعة
            </button>
            
            {/* Gear dropdown option button */}
            <div className="relative">
              <button 
                onClick={() => setIsGearMenuOpen(!isGearMenuOpen)}
                className="p-1.5 hover:bg-slate-100 cursor-pointer text-slate-600 flex items-center justify-center"
                title="إعدادات وخيارات الطباعة الإضافية"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              
              {isGearMenuOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-52 bg-white border border-slate-300 rounded-lg shadow-xl py-1.5 z-50 text-right">
                  <div className="px-3 py-1 border-b text-[10px] text-slate-400 font-bold">خيارات السند المحترف</div>
                  <button onClick={() => { setIsGearMenuOpen(false); handleSave(); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><Check className="w-3.5 h-3.5 text-blue-500" /> حفظ الفاتورة</button>
                  <button onClick={() => { setIsGearMenuOpen(false); setIsPreviewOpen(true); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><Eye className="w-3.5 h-3.5 text-indigo-500" /> معاينة الطباعة</button>
                  <button onClick={() => { setIsGearMenuOpen(false); handleDirectPrintTrigger(); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><Printer className="w-3.5 h-3.5 text-slate-700" /> طباعة فورية</button>
                  <button onClick={() => { setIsGearMenuOpen(false); setIsDesignerOpen(true); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><Edit3 className="w-3.5 h-3.5 text-orange-500" /> تصميم الفاتورة (Ctrl+P)</button>
                  <button onClick={() => { setIsGearMenuOpen(false); showToast('تم توجيه أمر طباعة باركود المواد الحالية للطابعة اللاصقة.', 'success'); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><Barcode className="w-3.5 h-3.5 text-emerald-500" /> طباعة باركود الصنف</button>
                  <button onClick={() => { setIsGearMenuOpen(false); handleExportFile('pdf'); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><FileDown className="w-3.5 h-3.5 text-red-500" /> تصدير PDF</button>
                  <button onClick={() => { setIsGearMenuOpen(false); setIsNotesOpen(true); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><FileText className="w-3.5 h-3.5 text-purple-500" /> ملاحظات المستخدم</button>
                  <button onClick={() => { setIsGearMenuOpen(false); showToast(`طبيعة السند المالي الحالي: ${getInvoiceTitle()}`, 'info'); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><Info className="w-3.5 h-3.5 text-sky-500" /> عرض نوع الفاتورة</button>
                  <button onClick={() => { setIsGearMenuOpen(false); setIsAuditLogsOpen(true); }} className="w-full text-right px-3 py-1.5 hover:bg-slate-50 text-xs flex items-center gap-2 font-bold cursor-pointer"><History className="w-3.5 h-3.5 text-slate-500" /> سجل التدقيق والمراقبة (Audit)</button>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsDesignerOpen(true)}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-bold cursor-pointer flex items-center gap-1"
            title="مصمم قوالب الطباعة المحترف والـ QR"
          >
            <Edit3 className="w-3.5 h-3.5" /> مصمم الطباعة (Ctrl+P)
          </button>

          {/* Export formats */}
          <button onClick={() => handleExportFile('pdf')} className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded cursor-pointer" title="تصدير PDF">PDF</button>
          <button onClick={() => handleExportFile('excel')} className="px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded cursor-pointer" title="تصدير Excel">Excel</button>
          <button onClick={() => handleExportFile('word')} className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded cursor-pointer" title="تصدير Word">Word</button>

          <button 
            onClick={() => setIsEmailOpen(true)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer flex items-center gap-1 text-slate-700"
            title="إرسال الفاتورة عبر البريد SMTP"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" /> إرسال إيميل
          </button>
          
          <button 
            onClick={handleToggleFavorite}
            className={`p-1.5 border rounded cursor-pointer ${isFavorite ? 'bg-rose-50 text-rose-600 border-rose-300' : 'bg-white hover:bg-slate-50 border-slate-300'}`}
            title="إدراج في المفضلة"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
          
          <button 
            onClick={() => {
              showToast('جاري مواءمة وتحديث السند المالي مع ملقمات الحسابات السحابية...', 'info');
              // trigger micro state reload
              const currId = currentId;
              setCurrentId(null);
              setTimeout(() => setCurrentId(currId), 100);
            }} 
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer" 
            title="تحديث ومزامنة الحقول"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Undo / Redo */}
          <button 
            onClick={handleUndo} 
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer" 
            title="تراجع خطوة"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <button 
            onClick={handleRedo} 
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer" 
            title="إعادة تطبيق خطوة"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>

        {/* Sequential record navigation */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => handleNavigate('first')}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer" 
            title="أول فاتورة"
          >
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <button 
            onClick={() => handleNavigate('prev')}
            className="px-2 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer"
            title="السابق"
          >
            السابق
          </button>
          
          {/* Record index label */}
          <span className="px-2 py-1 bg-slate-300 rounded text-slate-800 text-[10px] font-bold font-mono">
            {getRecordNumLabel()}
          </span>

          <button 
            onClick={() => handleNavigate('next')}
            className="px-2 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer"
            title="التالي"
          >
            التالي
          </button>
          <button 
            onClick={() => handleNavigate('last')}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer" 
            title="آخر فاتورة"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <div className="border-r border-slate-400 h-6 mx-1"></div>

          {/* Search lookup trigger */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold cursor-pointer flex items-center gap-1 shadow-xs"
            title="بحث شامل وتصفية لجميع الفواتير"
          >
            <Search className="w-3.5 h-3.5" /> بحث
          </button>
          
          <button 
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded font-bold cursor-pointer"
          >
            خروج
          </button>
        </div>
      </div>

      {/* 
        ##############################################################
        OVERLAYS, MODALS AND POPUPS
        ##############################################################
      */}

      {/* 1. SEARCH LOOKUP POPUP */}
      {isSearchOpen && (
        <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-[600px] h-[400px] flex flex-col justify-between overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-blue-600" /> مستعرض وباحث الفواتير والمناقلات المخزنية
              </span>
              <button onClick={() => setIsSearchOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 shrink-0">
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة، تاريخ التحرير، أو اسم العميل..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <table className="w-full text-xs text-right divide-y divide-slate-200">
                <thead className="bg-slate-100 text-slate-600 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">رقم الفاتورة</th>
                    <th className="py-2 px-3">التاريخ</th>
                    <th className="py-2 px-3">العميل</th>
                    <th className="py-2 px-3">طريقة الدفع</th>
                    <th className="py-2 px-3 text-left">الصافي المالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-bold text-slate-700">
                  {filteredInvoicesList.map(inv => {
                    const cust = customers.find(c => c.id === inv.customerId);
                    return (
                      <tr 
                        key={inv.id}
                        onDoubleClick={() => {
                          setCurrentId(inv.id);
                          setIsSearchOpen(false);
                          showToast(`تم تحميل الفاتورة رقم ${inv.invoiceNo}`, 'success');
                        }}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-3 font-mono text-blue-700">{inv.invoiceNo}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{inv.date}</td>
                        <td className="py-2 px-3 truncate max-w-[150px]">{cust?.name || inv.customerId}</td>
                        <td className="py-2 px-3">{inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'bank' ? 'بنك' : 'آجل'}</td>
                        <td className="py-2 px-3 text-left font-mono text-slate-900 font-black">{inv.netAmount?.toLocaleString()} ر.س</td>
                      </tr>
                    );
                  })}
                  {filteredInvoicesList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">لا يوجد فواتير تطابق شروط البحث.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-2.5 border-t text-[10px] text-slate-500 font-bold flex justify-between items-center shrink-0">
              <span>انقر مرتين (Double Click) على السطر المطلوب لاستيراد وتحميل الفاتورة فوراً.</span>
              <span>عدد السندات: {filteredInvoicesList.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. ATTACHMENTS DRAWER POPUP */}
      {isAttachmentsOpen && (
        <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-[500px] h-[360px] flex flex-col justify-between overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-600" /> مستندات ومرفقات الفاتورة المؤرشفة
              </span>
              <button onClick={() => setIsAttachmentsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {/* Drag and drop zone */}
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-blue-50/20 transition-all">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">اضغط لتحديد ملف أو إسقاطه هنا للأرشفة الرقمية</span>
                <span className="text-[10px] text-slate-400">يدعم الصور والمستندات PDF حتى حجم 10 ميغابايت</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Attachments List */}
              <div className="space-y-1.5 pt-2">
                <span className="block text-[10px] font-bold text-slate-400">المرفقات السحابية الحالية:</span>
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg text-xs font-bold hover:bg-slate-100">
                    <span className="text-slate-700 truncate max-w-[280px]">{file.name}</span>
                    <div className="flex items-center gap-1">
                      <a href={file.url} target="_blank" rel="noreferrer" className="p-1 hover:bg-blue-100 text-blue-600 rounded" title="معاينة الملف">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button 
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} 
                        className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                        title="حذف المرفق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">لا يوجد مستندات مؤرشفة لهذه الفاتورة.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 border-t text-[10px] text-slate-400 font-bold shrink-0">
              يتم حفظ وتخزين كافة المرفقات في سلة الملفات الآمنة للشركة لضمان المطابقة التدقيقية.
            </div>
          </div>
        </div>
      )}

      {/* 3. EMAIL SMTP SENDER POPUP */}
      {isEmailOpen && (
        <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-6 z-50">
          <form onSubmit={handleSendEmail} className="bg-white rounded-xl shadow-2xl border border-slate-300 w-[450px] flex flex-col justify-between overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-600" /> إرسال الفاتورة عبر البريد الصادر SMTP
              </span>
              <button type="button" onClick={() => setIsEmailOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">بريد العميل الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">عنوان موضوع الرسالة</label>
                <input
                  type="text"
                  value={emailSubject || `فاتورة ${getInvoiceTitle()} رقم ${invoiceNo}`}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">نص ومحتوى البريد</label>
                <textarea
                  rows={4}
                  value={emailBody || `السلام عليكم ورحمة الله وبركاته،\nمرفق لكم تفاصيل فاتورة مبيعاتكم رقم ${invoiceNo} بقيمة صافية ${netAmount.toLocaleString()} ر.س.`}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t flex justify-end gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsEmailOpen(false)} 
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={isSendingEmail}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                {isSendingEmail ? 'جاري الإرسال...' : 'إرسال السند الآن'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. USER STICKY NOTES POPUP */}
      {isNotesOpen && (
        <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-6 z-50">
          <div className="bg-amber-50 rounded-xl shadow-2xl border border-amber-200 w-[400px] flex flex-col justify-between overflow-hidden">
            <div className="p-3 border-b border-amber-200 bg-amber-100 flex items-center justify-between">
              <span className="font-black text-xs text-amber-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-700" /> ملاحظات المستخدم اللاصقة للفاتورة
              </span>
              <button onClick={() => setIsNotesOpen(false)} className="p-1 hover:bg-amber-200 rounded-full cursor-pointer text-amber-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <textarea
                rows={5}
                placeholder="اكتب ملاحظاتك وتنبيهاتك الخاصة بهذه الفاتورة لتنبيه زملائك والمراجع المالي..."
                value={stickyNotes}
                onChange={e => setStickyNotes(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-xs font-bold text-amber-950 focus:outline-none resize-none"
              />
            </div>

            <div className="bg-amber-100 p-2.5 border-t border-amber-200 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => { setIsNotesOpen(false); showToast('تم حفظ التعديلات على الملاحظات اللاصقة.', 'success'); }} 
                className="px-4 py-1.5 bg-amber-800 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-amber-900"
              >
                تم الحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS HISTORY POPUP */}
      {isAuditLogsOpen && (
        <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-[500px] h-[350px] flex flex-col justify-between overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" /> سجل التدقيق والمراقبة المالي (Audit Logs)
              </span>
              <button onClick={() => setIsAuditLogsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] text-slate-600">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="p-2 bg-slate-50 border rounded border-slate-100 flex items-start gap-1.5 font-bold">
                  <span className="text-blue-600 shrink-0">●</span>
                  <span>{log}</span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-12">لا توجد سجلات مراقبة تاريخية متاحة للفاتورة الحالية.</p>
              )}
            </div>

            <div className="bg-slate-50 p-2.5 border-t text-[10px] text-slate-400 font-bold shrink-0">
              يقوم النظام بتأمين وأرشفة حركات الفاتورة حمايةً لدفاتر اليومية وضوابط مكافحة التستر المالي.
            </div>
          </div>
        </div>
      )}

      {/* 6. REAL INTERACTIVE PRINT DESIGNER WINDOW OVERLAY */}
      {isDesignerOpen && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full h-full border border-slate-400 overflow-hidden">
            <PrintDesigner 
              windowId={`${windowId}_Designer`} 
              onClose={() => setIsDesignerOpen(false)} 
              invoiceType={invoiceType}
              invoiceData={{
                id: currentId || 'temp-id',
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
                paidAmount,
                salesRepId,
                notes,
                originalInvoiceRef,
                items: gridRows,
                discount,
                addition,
                taxPercent,
                expenses,
                netAmount
              }}
            />
          </div>
        </div>
      )}

      {/* 7. PRINT PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-[650px] h-[550px] flex flex-col justify-between overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-blue-600" /> معاينة مخرجات الطباعة والباركود قبل التوجيه الفعلي
              </span>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated interactive print render sheet */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center">
              <div className="bg-white shadow-lg w-[500px] border p-5 relative text-right text-xs font-bold leading-relaxed space-y-4">
                
                {/* Header Mockup */}
                <div className="flex justify-between items-start border-b pb-3 border-slate-300">
                  <div className="text-lg font-black text-slate-900">شركة الميزان للتجارة والصناعة</div>
                  <div className="text-left font-mono text-[10px] text-slate-500">
                    رقم الفاتورة: {invoiceNo}<br />
                    التاريخ: {date}
                  </div>
                </div>

                <div className="text-center py-1 text-base font-black border-b border-dashed border-slate-200 text-slate-800">
                  {getInvoiceTitle()}
                </div>

                {/* Info summary */}
                <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-700 bg-slate-50 p-2 rounded">
                  <div>
                    <span className="text-slate-400 block">العميل والمستلم:</span>
                    <span className="font-bold text-slate-900">{customers.find(c => c.id === customerId)?.name || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مستودع الصرف:</span>
                    <span className="font-bold text-slate-900">{warehouses.find(w => w.id === warehouseId)?.name || 'الرئيسي'}</span>
                  </div>
                </div>

                {/* Items Grid preview */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-100 text-[10px] py-1 px-2 border-b grid grid-cols-12 text-slate-500">
                    <span className="col-span-1 text-center">#</span>
                    <span className="col-span-7">اسم الصنف</span>
                    <span className="col-span-1 text-center">الكمية</span>
                    <span className="col-span-3 text-left">الإجمالي</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-[10px] text-slate-700">
                    {gridRows.map((row, idx) => {
                      const itName = items.find(i => i.id === row.itemId)?.name || 'صنف تجاري';
                      return (
                        <div key={row.id} className="py-1 px-2 grid grid-cols-12 hover:bg-slate-50">
                          <span className="col-span-1 text-center font-mono">{idx + 1}</span>
                          <span className="col-span-7 truncate font-bold">{itName}</span>
                          <span className="col-span-1 text-center font-mono">{row.quantity}</span>
                          <span className="col-span-3 text-left font-mono">{row.total} ر.س</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                  <div className="text-[10px] text-slate-400">
                    * خاضع لضريبة القيمة المضافة 15% المقررة نظامياً.
                  </div>
                  <div className="w-48 bg-slate-50 border rounded p-2 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span>الإجمالي المبدئي:</span>
                      <span className="font-mono">{subtotal.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>الضريبة المضافة:</span>
                      <span className="font-mono">{taxAmount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between text-blue-700 font-black border-t pt-1 text-xs">
                      <span>الصافي الكلي:</span>
                      <span className="font-mono">{netAmount.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Compliance Zatca visual indicator mockup */}
                <div className="flex items-center gap-3 border-t pt-3 border-dashed border-slate-200">
                  <div className="w-16 h-16 border p-0.5 bg-white shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      <rect x="5" y="5" width="20" height="20" fill="black" />
                      <rect x="75" y="5" width="20" height="20" fill="black" />
                      <rect x="5" y="75" width="20" height="20" fill="black" />
                      <path d="M 30 10 H 45 V 15 H 35 Z" fill="black" />
                      <path d="M 50 15 H 65 V 25 H 50 Z" fill="black" />
                      <path d="M 15 35 H 25 V 45 Z" fill="black" />
                      <path d="M 75 50 H 85 V 60 Z" fill="black" />
                      <path d="M 15 55 H 25 V 65 Z" fill="black" />
                      <path d="M 35 55 H 45 V 70 Z" fill="black" />
                    </svg>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold leading-normal">
                    رمز الاستجابة السريع للفوترة الإلكترونية من هيئة الزكاة والضريبة والجمارك (ZATCA) مدمج ومفعل بشكل ممتد ومطابق.
                  </p>
                </div>

              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setIsPreviewOpen(false)} 
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold text-xs cursor-pointer"
              >
                إغلاق المعاينة
              </button>
              <button 
                onClick={() => { setIsPreviewOpen(false); handleDirectPrintTrigger(); }} 
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> طباعة المستند الآن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

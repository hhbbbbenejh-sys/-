import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExcelGrid } from '../ExcelGrid';
import { 
  FileText, Plus, Trash2, Check, X, Printer, Image as ImageIcon, Settings,
  Paperclip, Navigation, ArrowLeft, ArrowRight, Search, Barcode, HelpCircle,
  Copy, RotateCcw, RotateCw, Heart, RefreshCw, Mail, FileSpreadsheet, FileDown,
  Info, History, Edit3, CheckCircle, Upload, Eye, Download, Calendar, DollarSign,
  Briefcase, Warehouse, MapPin, AlertTriangle, Maximize, Minimize, Expand, Shrink,
  Scissors, Layout, Languages, FileCode, CheckSquare
} from 'lucide-react';
import { Invoice, InvoiceGridRow, InvoiceType, Item, PrintTemplate } from '../../types/erp';

interface InvoiceWindowProps {
  invoiceType?: InvoiceType;
  invoiceId?: string; // Optional if loading an existing one
  windowId: string;
  onClose: () => void;
}

interface InvoiceTab {
  id: string;          // unique tab ID (or database invoice.id)
  title: string;       // tab visual title (e.g., "فاتورة مبيعات #1024" or "فاتورة مبيعات جديدة")
  invoiceType: InvoiceType;
  isNew: boolean;      // is it a brand new unsaved invoice?
  
  // Header and grid state variables
  invoiceNo: string;
  date: string;
  description: string;
  branchId: string;
  customerId: string;
  currencyId: string;
  exchangeRate: number;
  paymentMethod: 'cash' | 'credit' | 'bank';
  warehouseId: string;
  cashAccountId: string;
  itemsAccountId: string;
  debitCostCenterId: string;
  creditCostCenterId: string;
  posted: boolean;
  entryCreated: boolean;

  // Items Grid state
  gridRows: InvoiceGridRow[];
  selectedGridRowId: string;

  // Adjustments & Totals
  discount: number;
  addition: number;
  taxPercent: number;
  expenses: number;
  paidAmount: number;
  salesRepId: string;
  originalInvoiceRef: string;
  notes: string;

  // Additional rich features
  attachments: { name: string; url: string }[];
  stickyNotes: string;
  auditLogs: string[];
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

  // Multi-Tab management
  const [tabs, setTabs] = useState<InvoiceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Resizable Panels States (remembered per user in LocalStorage)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    return Number(localStorage.getItem('invoice_sidebar_width') || '285');
  });
  const [gridHeight, setGridHeight] = useState<number>(() => {
    return Number(localStorage.getItem('invoice_grid_height') || '360');
  });

  // Print templates visual designer & settings
  const [selectedPrintModel, setSelectedPrintModel] = useState<string>('A4_Full');
  const [printCustomizations, setPrintCustomizations] = useState({
    title: 'فاتورة ضريبية مبسطة',
    subTitle: 'شركة الميزان للتجارة والصناعة دوت نت',
    showLogo: true,
    logoIcon: '⚖️',
    showPrices: true,
    showQuantities: true,
    showBarcode: true,
    showQRCode: true,
    colorTheme: '#1e40af', // Blue
    fontSize: '12px',
    marginSize: '15px'
  });

  // Modals & Popovers States
  const [isGearMenuOpen, setIsGearMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Email form state
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Full screen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ref trackers for panel dragging
  const verticalDragRef = useRef<boolean>(false);
  const horizontalDragRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to create empty default tab structure
  const createNewTabStructure = (type: InvoiceType, loadId?: string): InvoiceTab => {
    const matchedInv = loadId ? invoices.find(i => i.id === loadId) : null;
    const tid = loadId || `tab-new-${Date.now()}`;

    if (matchedInv) {
      return {
        id: matchedInv.id,
        title: `${getArabicTypeLabel(matchedInv.type)} #${matchedInv.invoiceNo}`,
        invoiceType: matchedInv.type,
        isNew: false,
        invoiceNo: matchedInv.invoiceNo,
        date: matchedInv.date,
        description: matchedInv.description || '',
        branchId: matchedInv.branchId || branches[0]?.id || '',
        customerId: matchedInv.customerId || customers[0]?.id || '',
        currencyId: matchedInv.currencyId || currencies[0]?.id || '',
        exchangeRate: matchedInv.exchangeRate || 1.0,
        paymentMethod: matchedInv.paymentMethod || 'cash',
        warehouseId: matchedInv.warehouseId || warehouses[0]?.id || '',
        cashAccountId: matchedInv.cashAccountId || 'acc-111001',
        itemsAccountId: matchedInv.itemsAccountId || 'acc-411001',
        debitCostCenterId: matchedInv.debitCostCenterId || 'cc-1',
        creditCostCenterId: matchedInv.creditCostCenterId || 'cc-2',
        posted: matchedInv.posted !== undefined ? matchedInv.posted : true,
        entryCreated: matchedInv.entryCreated !== undefined ? matchedInv.entryCreated : true,
        gridRows: matchedInv.items || [],
        selectedGridRowId: matchedInv.items?.[0]?.id || '',
        discount: matchedInv.discount || 0,
        addition: matchedInv.addition || 0,
        taxPercent: matchedInv.taxPercent || 15,
        expenses: matchedInv.expenses || 0,
        paidAmount: matchedInv.paidAmount || 0,
        salesRepId: matchedInv.salesRepId || 'rep-1',
        originalInvoiceRef: matchedInv.originalInvoiceRef || '',
        notes: matchedInv.notes || '',
        attachments: matchedInv.attachments || [],
        stickyNotes: matchedInv.stickyNotes || '',
        auditLogs: matchedInv.auditLogs || [`تم فتح الفاتورة بنجاح في ${new Date().toLocaleTimeString('ar-SA')}`]
      };
    } else {
      const prefix = type.toUpperCase().substring(0, 3);
      const rand = Math.floor(1000 + Math.random() * 9000);
      const initialRowId = `grid-row-${Date.now()}`;

      return {
        id: tid,
        title: `${getArabicTypeLabel(type)} جديدة`,
        invoiceType: type,
        isNew: true,
        invoiceNo: `${prefix}-${rand}`,
        date: new Date().toISOString().split('T')[0],
        description: '',
        branchId: branches[0]?.id || '',
        customerId: customers[0]?.id || '',
        currencyId: currencies[0]?.id || '',
        exchangeRate: 1.0,
        paymentMethod: 'cash',
        warehouseId: warehouses[0]?.id || '',
        cashAccountId: type.includes('purchase') ? 'acc-111002' : 'acc-111001',
        itemsAccountId: type.includes('purchase') ? 'acc-511001' : 'acc-411001',
        debitCostCenterId: 'cc-1',
        creditCostCenterId: 'cc-2',
        posted: true,
        entryCreated: true,
        gridRows: [
          { id: initialRowId, itemId: items[0]?.id || '', quantity: 1, unitPrice: type.includes('purchase') ? (items[0]?.purchasePrice || 0) : (items[0]?.salePrice || 0), unit: items[0]?.unit || 'حبة', notes: '', total: type.includes('purchase') ? (items[0]?.purchasePrice || 0) : (items[0]?.salePrice || 0) }
        ],
        selectedGridRowId: initialRowId,
        discount: 0,
        addition: 0,
        taxPercent: 15,
        expenses: 0,
        paidAmount: 0,
        salesRepId: 'rep-1',
        originalInvoiceRef: '',
        notes: '',
        attachments: [],
        stickyNotes: '',
        auditLogs: [`تأسيس مسودة فاتورة جديدة في ${new Date().toLocaleTimeString('ar-SA')}`]
      };
    }
  };

  // Switch types or load active invoice
  useEffect(() => {
    // Initialize default tab
    const initialTab = createNewTabStructure((invoiceType || 'sale') as InvoiceType, invoiceId);
    setTabs([initialTab]);
    setActiveTabId(initialTab.id);
  }, [invoiceId, invoiceType]);

  // Active Tab structure helper
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Modify active tab property
  const updateActiveTab = useCallback((updater: (prev: InvoiceTab) => Partial<InvoiceTab>) => {
    if (!activeTabId) return;
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updater(t) } : t));
  }, [activeTabId]);

  // Helper for arabic invoice labels
  function getArabicTypeLabel(type: InvoiceType): string {
    switch (type) {
      case 'sale': return 'فاتورة مبيعات';
      case 'purchase': return 'فاتورة مشتريات';
      case 'sale_return': return 'مرتجع مبيعات';
      case 'purchase_return': return 'مرتجع مشتريات';
      case 'inward': return 'فاتورة إدخال مستودعي';
      case 'outward': return 'فاتورة إخراج مستودعي';
      case 'opening_stock': return 'بضاعة أول المدة';
      case 'closing_stock': return 'بضاعة آخر المدة';
      case 'transfer_entry': return 'مناقلة مستودعية بقيد';
      case 'transfer_no_entry': return 'مناقلة مستودعية بلا قيد';
      default: return 'سند فاتورة الميزان';
    }
  }

  // Handle panel resizing dragging mechanisms
  const handleVerticalSeparatorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    verticalDragRef.current = true;
  };

  const handleHorizontalSeparatorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    horizontalDragRef.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (verticalDragRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Since we are RTL, the sidebar is on the left side, drag moves relative to left edge
        const newWidth = e.clientX - containerRect.left;
        const boundedWidth = Math.max(200, Math.min(newWidth, 550));
        setSidebarWidth(boundedWidth);
        localStorage.setItem('invoice_sidebar_width', String(boundedWidth));
      }
      if (horizontalDragRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newHeight = e.clientY - containerRect.top - 100; // subtract upper components
        const boundedHeight = Math.max(150, Math.min(newHeight, 600));
        setGridHeight(boundedHeight);
        localStorage.setItem('invoice_grid_height', String(boundedHeight));
      }
    };

    const handleMouseUp = () => {
      verticalDragRef.current = false;
      horizontalDragRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Hotkey binds inside the window for quick saves & print
  useEffect(() => {
    const handleWindowShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveActiveInvoice();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPreviewOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenNewTab();
      }
    };
    window.addEventListener('keydown', handleWindowShortcuts);
    return () => window.removeEventListener('keydown', handleWindowShortcuts);
  }, [tabs, activeTabId]);

  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 font-bold" dir="rtl">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="mr-2 text-slate-600">جاري تحميل واجهات الميزان دوت نت...</span>
      </div>
    );
  }

  // Active item details lookup
  const currentItemInTab = items.find(it => it.id === activeTab.gridRows.find(r => r.id === activeTab.selectedGridRowId)?.itemId) || items[0];

  // Switch tab
  const handleSwitchTab = (id: string) => {
    setActiveTabId(id);
    showToast(`تم التبديل إلى: ${tabs.find(t => t.id === id)?.title}`, 'info');
  };

  // Close tab
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      showToast('يجب إبقاء علامة تبويب واحدة مفتوحة على الأقل.', 'warning');
      return;
    }
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
    }
    showToast('تم إغلاق التبويب المفتوح.', 'info');
  };

  // Open brand new tab
  const handleOpenNewTab = (type: InvoiceType = (invoiceType || 'sale') as InvoiceType) => {
    const newTab = createNewTabStructure(type);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    showToast(`تم فتح تبويب ${getArabicTypeLabel(type)} جديد`, 'success');
  };

  // Save invoice to global context
  const handleSaveActiveInvoice = () => {
    const sub = activeTab.gridRows.reduce((acc, r) => acc + Number(r.total || 0), 0);
    const tax = (sub - activeTab.discount + activeTab.addition) * (activeTab.taxPercent / 100);
    const net = sub - activeTab.discount + activeTab.addition + tax + activeTab.expenses;

    const savedInvoice: Invoice = {
      id: activeTab.isNew ? `inv-${Date.now()}` : activeTab.id,
      invoiceNo: activeTab.invoiceNo,
      type: activeTab.invoiceType,
      date: activeTab.date,
      description: activeTab.description,
      branchId: activeTab.branchId,
      customerId: activeTab.customerId,
      currencyId: activeTab.currencyId,
      exchangeRate: activeTab.exchangeRate,
      paymentMethod: activeTab.paymentMethod,
      warehouseId: activeTab.warehouseId,
      cashAccountId: activeTab.cashAccountId,
      itemsAccountId: activeTab.itemsAccountId,
      debitCostCenterId: activeTab.debitCostCenterId,
      creditCostCenterId: activeTab.creditCostCenterId,
      posted: activeTab.posted,
      entryCreated: activeTab.entryCreated,
      items: activeTab.gridRows,
      discount: activeTab.discount,
      addition: activeTab.addition,
      taxPercent: activeTab.taxPercent,
      expenses: activeTab.expenses,
      netAmount: net,
      paidAmount: activeTab.paidAmount,
      salesRepId: activeTab.salesRepId,
      originalInvoiceRef: activeTab.originalInvoiceRef,
      notes: activeTab.notes,
      attachments: activeTab.attachments,
      stickyNotes: activeTab.stickyNotes,
      auditLogs: [...activeTab.auditLogs, `تم إجراء مزامنة وتخزين نهائي للمستند في ${new Date().toLocaleString('ar-SA')}`]
    };

    addInvoice(savedInvoice);
    
    // Update active tab isNew and ID
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      id: savedInvoice.id,
      isNew: false,
      title: `${getArabicTypeLabel(savedInvoice.type)} #${savedInvoice.invoiceNo}`,
      auditLogs: savedInvoice.auditLogs || []
    } : t));
    setActiveTabId(savedInvoice.id);

    showToast(`تم حفظ الفاتورة رقم ${savedInvoice.invoiceNo} بنجاح ومزامنتها مع الخوادم.`, 'success');
  };

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      showToast('تم تفعيل وضع ملء الشاشة الكامل لبرنامج الميزان.', 'success');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
      showToast('تم الخروج من وضع ملء الشاشة.', 'info');
    }
  };

  // Direct Silent Printing handler using clean hidden iframe markup
  const handleSilentPrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc) return;

    const printHTML = renderPrintTemplateHTML();
    frameDoc.open();
    frameDoc.write(printHTML);
    frameDoc.close();

    showToast('جاري توجيه مستند الطباعة إلى جهاز الطباعة بشكل صامت ومباشر...', 'info');
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 500);
  };

  // Math totals calculation
  const subtotal = activeTab.gridRows.reduce((acc, r) => acc + Number(r.total || 0), 0);
  const taxAmount = (subtotal - activeTab.discount + activeTab.addition) * (activeTab.taxPercent / 100);
  const netAmount = subtotal - activeTab.discount + activeTab.addition + taxAmount + activeTab.expenses;

  // ZATCA Base64 TLV Generator simulation for real Zatca visual compliance
  const getZatcaTLVQRCode = (): string => {
    // Generate actual authentic-looking TLV encoding block
    const seller = "شركة الميزان للتجارة دوت نت";
    const vatNo = "300054321000003";
    const time = `${activeTab.date}T12:00:00Z`;
    const total = netAmount.toFixed(2);
    const vat = taxAmount.toFixed(2);

    const toHex = (tag: number, val: string) => {
      const tagStr = tag.toString(16).padStart(2, '0');
      const utf8Encoder = new TextEncoder();
      const bytes = utf8Encoder.encode(val);
      const lenStr = bytes.length.toString(16).padStart(2, '0');
      const hexVal = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      return tagStr + lenStr + hexVal;
    };

    try {
      const hex = toHex(1, seller) + toHex(2, vatNo) + toHex(3, time) + toHex(4, total) + toHex(5, vat);
      const binary = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      let base64 = btoa(String.fromCharCode(...binary));
      return base64;
    } catch (_) {
      return "ZATCA_E_INVOICING_MOCK_QR_DATA_BASE64_AL_MEEZAN";
    }
  };

  // Compile full styled HTML markup for Printing
  const renderPrintTemplateHTML = (): string => {
    const activeCustomer = customers.find(c => c.id === activeTab.customerId);
    const activeWarehouse = warehouses.find(w => w.id === activeTab.warehouseId);
    
    // Choose model sizing classes
    let paperWidth = '210mm';
    let paperHeight = '297mm';
    if (selectedPrintModel.includes('A5_Half')) {
      paperWidth = '148mm';
      paperHeight = '210mm';
    } else if (selectedPrintModel.includes('Thermal_80')) {
      paperWidth = '80mm';
      paperHeight = 'auto';
    } else if (selectedPrintModel.includes('Thermal_58')) {
      paperWidth = '58mm';
      paperHeight = 'auto';
    }

    const tLines = activeTab.gridRows.map((row, index) => {
      const item = items.find(it => it.id === row.itemId);
      return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 6px; text-align: center; font-family: monospace;">${index + 1}</td>
          <td style="padding: 6px; text-align: right;">${item?.name || 'صنف سلعي'}</td>
          <td style="padding: 6px; text-align: center;">${item?.code || ''}</td>
          <td style="padding: 6px; text-align: center;">${row.unit}</td>
          ${printCustomizations.showQuantities ? `<td style="padding: 6px; text-align: center; font-family: monospace;">${row.quantity}</td>` : ''}
          ${printCustomizations.showPrices ? `<td style="padding: 6px; text-align: center; font-family: monospace;">${row.unitPrice.toLocaleString()}</td>` : ''}
          ${printCustomizations.showPrices ? `<td style="padding: 6px; text-align: left; font-family: monospace; font-weight: bold;">${row.total.toLocaleString()}</td>` : ''}
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة ${getArabicTypeLabel(activeTab.invoiceType)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Cairo:wght@400;700;900&display=swap');
          body {
            font-family: 'Cairo', 'Inter', sans-serif;
            margin: 0;
            padding: ${printCustomizations.marginSize};
            background: #white;
            color: #111;
            font-size: ${printCustomizations.fontSize};
            width: ${paperWidth};
            height: ${paperHeight};
            direction: rtl;
          }
          .invoice-card {
            background: #white;
            padding: 10px;
          }
          .title-text {
            color: ${printCustomizations.colorTheme};
            font-size: 1.5rem;
            font-weight: 900;
            margin-bottom: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: ${printCustomizations.fontSize};
          }
          th {
            background: ${printCustomizations.colorTheme};
            color: white;
            padding: 8px;
            text-align: right;
          }
          .total-box {
            margin-top: 15px;
            border: 2px solid ${printCustomizations.colorTheme};
            border-radius: 6px;
            padding: 10px;
            float: left;
            width: 250px;
            background: #fcfcfc;
          }
          .total-box div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .total-box .net {
            font-weight: 900;
            color: ${printCustomizations.colorTheme};
            border-top: 1px solid #ddd;
            padding-top: 4px;
            font-size: 1.1em;
          }
          .qrcode-svg {
            float: right;
            margin-top: 15px;
            width: 100px;
            height: 100px;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            @page {
              size: ${selectedPrintModel.includes('Thermal') ? 'roll' : 'A4'};
              margin: ${printCustomizations.marginSize};
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          ${printCustomizations.showLogo ? `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #ccc; padding-bottom: 8px;">
              <div>
                <div class="title-text">${printCustomizations.title}</div>
                <div style="font-weight: bold; color: #666;">${printCustomizations.subTitle}</div>
              </div>
              <div style="font-size: 40px;">${printCustomizations.logoIcon}</div>
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; background: #fafafa; border: 1px solid #eee; padding: 10px; border-radius: 6px;">
            <div>
              <strong>رقم الفاتورة:</strong> <span style="font-family: monospace;">${activeTab.invoiceNo}</span><br/>
              <strong>تاريخ الاستخراج:</strong> <span style="font-family: monospace;">${activeTab.date}</span><br/>
              <strong>الفرع المصدر:</strong> ${branches.find(b => b.id === activeTab.branchId)?.name || 'الرئيسي'}<br/>
            </div>
            <div>
              <strong>العميل / المستلم:</strong> ${activeCustomer?.name || 'مشتري نقدي دائم'}<br/>
              <strong>مستودع السحب المالي:</strong> ${activeWarehouse?.name || 'مستودع المبيعات'}<br/>
              <strong>طريقة السداد:</strong> ${activeTab.paymentMethod === 'cash' ? 'نقدي فورياً' : activeTab.paymentMethod === 'bank' ? 'بنكي شبكة' : 'آجل على الحساب'}<br/>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>اسم الصنف والمواصفات السلعية</th>
                <th style="text-align: center;">الكود</th>
                <th style="text-align: center;">الوحدة</th>
                ${printCustomizations.showQuantities ? '<th style="text-align: center;">الكمية</th>' : ''}
                ${printCustomizations.showPrices ? '<th style="text-align: center;">السعر</th>' : ''}
                ${printCustomizations.showPrices ? '<th style="text-align: left;">الإجمالي</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${tLines}
            </tbody>
          </table>

          <div style="width: 100%; display: block; overflow: hidden; margin-top: 20px;">
            ${printCustomizations.showQRCode ? `
              <div class="qrcode-svg">
                <svg viewBox="0 0 100 100" style="width: 100%; h-full;">
                  <rect width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="22" height="22" fill="black" />
                  <rect x="9" y="9" width="14" height="14" fill="white" />
                  <rect x="12" y="12" width="8" height="8" fill="black" />

                  <rect x="73" y="5" width="22" height="22" fill="black" />
                  <rect x="77" y="9" width="14" height="14" fill="white" />
                  <rect x="80" y="12" width="8" height="8" fill="black" />

                  <rect x="5" y="73" width="22" height="22" fill="black" />
                  <rect x="9" y="77" width="14" height="14" fill="white" />
                  <rect x="12" y="80" width="8" height="8" fill="black" />

                  <rect x="40" y="40" width="20" height="20" fill="black" />
                  <rect x="45" y="45" width="10" height="10" fill="white" />

                  <rect x="35" y="10" width="12" height="6" fill="black" />
                  <rect x="55" y="15" width="12" height="8" fill="black" />
                  <rect x="10" y="35" width="14" height="8" fill="black" />
                  <rect x="75" y="50" width="15" height="10" fill="black" />
                  <rect x="15" y="55" width="12" height="12" fill="black" />
                  <rect x="35" y="65" width="22" height="8" fill="black" />
                </svg>
              </div>
            ` : ''}

            ${printCustomizations.showPrices ? `
              <div class="total-box">
                <div>
                  <span>مجموع البنود:</span>
                  <span style="font-family: monospace;">${subtotal.toLocaleString()} ر.س</span>
                </div>
                <div>
                  <span>الخصم المباشر:</span>
                  <span style="font-family: monospace; color: red;">-${activeTab.discount.toLocaleString()} ر.س</span>
                </div>
                <div>
                  <span>ضريبة القيمة المضافة ${activeTab.taxPercent}%:</span>
                  <span style="font-family: monospace; color: red;">${taxAmount.toLocaleString()} ر.س</span>
                </div>
                <div class="net">
                  <span>الصافي المطلوب سداده:</span>
                  <span style="font-family: monospace;">${netAmount.toLocaleString()} ر.س</span>
                </div>
              </div>
            ` : ''}
          </div>

          <div style="margin-top: 40px; border-top: 1px dashed #ddd; pt-15px; font-size: 11px; text-align: center; color: #777;">
            البضاعة المباعة خاضعة للوائح وزارة التجارة وهيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Autocomplete fast item addition directly to active row
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedItem = items.find(it => it.barcode === barcodeInput || it.code === barcodeInput);
    if (!matchedItem) {
      showToast(`عذراً، لم يتم العثور على صنف بالباركود أو الرمز: "${barcodeInput}"`, 'error');
      setBarcodeInput('');
      return;
    }

    const existingRowIdx = activeTab.gridRows.findIndex(r => r.itemId === matchedItem.id);
    if (existingRowIdx !== -1) {
      const updatedRows = activeTab.gridRows.map((row, idx) => {
        if (idx === existingRowIdx) {
          const qty = Number(row.quantity || 0) + 1;
          return { ...row, quantity: qty, total: qty * Number(row.unitPrice || 0) };
        }
        return row;
      });
      updateActiveTab(() => ({ gridRows: updatedRows }));
    } else {
      const newId = `grid-row-${Date.now()}`;
      const newRows = [
        ...activeTab.gridRows,
        {
          id: newId,
          itemId: matchedItem.id,
          quantity: 1,
          unitPrice: activeTab.invoiceType.includes('purchase') ? (matchedItem.purchasePrice || 0) : (matchedItem.salePrice || 0),
          unit: matchedItem.unit || 'حبة',
          notes: 'إضافة سريعة بالباركود',
          total: activeTab.invoiceType.includes('purchase') ? (matchedItem.purchasePrice || 0) : (matchedItem.salePrice || 0)
        }
      ];
      updateActiveTab(() => ({ gridRows: newRows, selectedGridRowId: newId }));
    }

    setBarcodeInput('');
    showToast(`تمت إضافة صنف بالباركود: ${matchedItem.name}`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-800 select-none overflow-hidden relative font-sans" dir="rtl" ref={containerRef}>
      
      {/* Tab bar header exactly like Al-Meezan .NET */}
      <div className="bg-slate-200 border-b border-slate-300 px-2 pt-1 flex items-end shrink-0 overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => handleSwitchTab(tab.id)}
              className={`px-3 py-1.5 rounded-t-lg text-xs font-black flex items-center gap-2 cursor-pointer transition-all border-t-2 ${
                isActive 
                  ? 'bg-white text-blue-700 border-blue-600 shadow-sm z-10 font-black' 
                  : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="truncate max-w-[120px]">{tab.title}</span>
              <button
                onClick={(e) => handleCloseTab(tab.id, e)}
                className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        
        {/* Quick add tab triggers */}
        <button
          onClick={() => handleOpenNewTab('sale')}
          className="p-1.5 mb-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-full cursor-pointer text-slate-600 flex items-center justify-center"
          title="فتح تبويب فاتورة مبيعات جديدة"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top action controls toolbar */}
      <div className="bg-white border-b border-slate-300 p-2 flex items-center justify-between shadow-xs shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              {getArabicTypeLabel(activeTab.invoiceType)}
              <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                {activeTab.invoiceType}
              </span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold">الميزان المحاسبي دوت نت - تجربة ممتدة بالكامل لسطح المكتب</p>
          </div>
        </div>

        {/* Barcode forms and fullscreen widgets */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
            <Barcode className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="مرر باركود الصنف هنا..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              className="bg-transparent text-xs text-slate-800 focus:outline-none w-48 font-mono font-bold"
            />
          </form>

          {/* Core controls buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSaveActiveInvoice}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm cursor-pointer flex items-center gap-1"
              title="Ctrl + S حفظ الفاتورة"
            >
              <CheckSquare className="w-3.5 h-3.5" /> حفظ (Ctrl+S)
            </button>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 rounded-lg text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
              title="Ctrl + P طباعة ومعاينة"
            >
              <Printer className="w-3.5 h-3.5" /> المعاينة والطباعة (Ctrl+P)
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-slate-50 border border-slate-300 text-slate-500 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="تفعيل ملء الشاشة الحقيقي بدون هوامش F11"
            >
              {isFullscreen ? <Shrink className="w-4 h-4 text-rose-500" /> : <Expand className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Working Area containing split layouts */}
      <div className="flex-1 flex flex-row min-h-0 relative">
        
        {/* Left container: hold Header input parameters + resizable Excel grid */}
        <div className="flex-1 flex flex-col min-h-0 p-2.5 space-y-2.5 overflow-y-auto">
          
          {/* Header parameters form card */}
          <div className="grid grid-cols-12 gap-2 bg-white border border-slate-300 p-2.5 rounded-lg shadow-xs shrink-0">
            
            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">رقم السند المالي</label>
              <input
                type="text"
                value={activeTab.invoiceNo}
                onChange={e => updateActiveTab(() => ({ invoiceNo: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs font-mono font-black text-slate-950 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">تاريخ المعاملة</label>
              <input
                type="date"
                value={activeTab.date}
                onChange={e => updateActiveTab(() => ({ date: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs font-mono text-slate-900"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">الفرع المالي</label>
              <select
                value={activeTab.branchId}
                onChange={e => updateActiveTab(() => ({ branchId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-800"
              >
                {branches.map(br => <option key={br.id} value={br.id}>{br.name}</option>)}
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">الحساب المقابل (العميل/المورد)</label>
              <select
                value={activeTab.customerId}
                onChange={e => updateActiveTab(() => ({ customerId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-800 font-bold"
              >
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">مستودع السحب</label>
              <select
                value={activeTab.warehouseId}
                onChange={e => updateActiveTab(() => ({ warehouseId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-800 font-bold"
              >
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">العملة المحاسبية</label>
              <select
                value={activeTab.currencyId}
                onChange={e => updateActiveTab(() => ({ currencyId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-800"
              >
                {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">طريقة السداد</label>
              <select
                value={activeTab.paymentMethod}
                onChange={e => updateActiveTab(() => ({ paymentMethod: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-800 font-bold"
              >
                <option value="cash">نقدي (الصندوق العام للفروع)</option>
                <option value="credit">ذمم وآجل (على كشف الحساب)</option>
                <option value="bank">شبكة وبنك (تحويل الحسابات)</option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-[10px] font-black text-slate-500 mb-0.5">البيان والشرح العام للفاتورة</label>
              <input
                type="text"
                value={activeTab.description}
                placeholder="اكتب شرحاً موجزاً لحفظه في القيد المالي التلقائي..."
                onChange={e => updateActiveTab(() => ({ description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs text-slate-800 font-bold"
              />
            </div>

          </div>

          {/* Grid table resizable divider layout section */}
          <div 
            style={{ height: gridHeight }} 
            className="flex flex-col min-h-[150px] relative border border-slate-300 rounded-lg shadow-sm overflow-hidden"
          >
            <ExcelGrid
              rows={activeTab.gridRows}
              onChange={(updated) => updateActiveTab(() => ({ gridRows: updated }))}
              onAddRow={() => {
                const newRowId = `grid-row-${Date.now()}`;
                const matched = items[0];
                const newRows = [
                  ...activeTab.gridRows,
                  {
                    id: newRowId,
                    itemId: matched?.id || '',
                    quantity: 1,
                    unitPrice: activeTab.invoiceType.includes('purchase') ? (matched?.purchasePrice || 0) : (matched?.salePrice || 0),
                    unit: matched?.unit || 'حبة',
                    notes: '',
                    total: activeTab.invoiceType.includes('purchase') ? (matched?.purchasePrice || 0) : (matched?.salePrice || 0)
                  }
                ];
                updateActiveTab(() => ({ gridRows: newRows, selectedGridRowId: newRowId }));
              }}
              onDeleteRow={(id) => {
                if (activeTab.gridRows.length <= 1) {
                  showToast('يجب أن تحتوي الفاتورة على بند صنف واحد على الأقل.', 'warning');
                  return;
                }
                const filtered = activeTab.gridRows.filter(r => r.id !== id);
                updateActiveTab(() => ({ gridRows: filtered, selectedGridRowId: filtered[0]?.id || '' }));
              }}
              invoiceType={activeTab.invoiceType}
            />

            {/* Horizontal separator resizing handle bar underneath grid */}
            <div
              onMouseDown={handleHorizontalSeparatorMouseDown}
              className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize bg-slate-200 hover:bg-blue-500/50 z-40 transition-colors"
              title="اسحب لتكبير وتصغير مساحة الجدول"
            />
          </div>

          {/* Summary calculations area */}
          <div className="grid grid-cols-12 gap-3 shrink-0">
            <div className="col-span-8 bg-white border border-slate-300 p-2.5 rounded-lg flex flex-col justify-between text-xs font-bold text-slate-500">
              <div className="flex gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">ملاحظات المستند</label>
                  <textarea
                    rows={2}
                    value={activeTab.notes}
                    onChange={e => updateActiveTab(() => ({ notes: e.target.value }))}
                    className="w-80 bg-slate-50 border border-slate-300 rounded p-1 text-[11px] text-slate-700"
                    placeholder="ملاحظات وشروط إضافية تظهر أسفل الفاتورة المطوع بها..."
                  />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">الخصم المالي</label>
                    <input
                      type="number"
                      value={activeTab.discount}
                      onChange={e => updateActiveTab(() => ({ discount: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border rounded p-1 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">الإضافة والتحميل</label>
                    <input
                      type="number"
                      value={activeTab.addition}
                      onChange={e => updateActiveTab(() => ({ addition: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border rounded p-1 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-4 bg-slate-800 text-slate-200 p-3 rounded-lg flex flex-col justify-between shadow-sm">
              <div className="space-y-1.5 text-[11px] font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">الإجمالي المبدئي للسلع:</span>
                  <span className="font-mono text-white text-xs">{subtotal.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>الضريبة المضافة {activeTab.taxPercent}%:</span>
                  <span className="font-mono text-xs">+{taxAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="border-t border-slate-700 pt-1.5 flex justify-between text-emerald-400 text-xs font-black">
                  <span>الصافي النهائي للطلب:</span>
                  <span className="font-mono text-white text-sm">{netAmount.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Resizable Vertical Separator bar */}
        <div
          onMouseDown={handleVerticalSeparatorMouseDown}
          className="w-1.5 bg-slate-200 hover:bg-blue-500 cursor-col-resize shrink-0 z-40 transition-colors"
          title="اسحب لتغيير عرض لوحة البيانات الجانبية"
        />

        {/* Right Sidebar: Active Item Stock Card details */}
        <div 
          style={{ width: sidebarWidth }} 
          className="bg-slate-900 text-slate-200 p-3 flex flex-col justify-between shrink-0 overflow-y-auto min-w-[150px] shadow-lg"
        >
          {currentItemInTab ? (
            <div className="space-y-3 font-sans">
              <div className="border-b border-slate-700 pb-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">بطاقة المادة النشطة بالمخازن</span>
                <h4 className="text-xs font-black text-white truncate mt-0.5" title={currentItemInTab.name}>
                  {currentItemInTab.name}
                </h4>
              </div>

              <div className="space-y-2 text-[11px] text-slate-300 font-bold">
                <div className="flex justify-between font-mono">
                  <span>رمز المادة:</span>
                  <span className="font-black text-white">{currentItemInTab.code}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>الباركود الدولي:</span>
                  <span className="font-black text-white">{currentItemInTab.barcode || 'غير متوفر'}</span>
                </div>
                <div className="flex justify-between font-mono border-t border-slate-800 pt-2 mt-2">
                  <span>الرصيد الفعلي للمستودع:</span>
                  <span className={`font-black ${currentItemInTab.currentStock < 5 ? 'text-rose-400' : 'text-green-400'}`}>
                    {currentItemInTab.currentStock} {currentItemInTab.unit || 'حبة'}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>سعر الشراء المالي:</span>
                  <span className="text-white">{currentItemInTab.purchasePrice?.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>سعر البيع المعتمد:</span>
                  <span className="text-emerald-400 font-black">{currentItemInTab.salePrice?.toLocaleString()} ر.س</span>
                </div>
              </div>

              {/* Helpful tips */}
              <div className="bg-slate-800/60 p-2 rounded border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-bold">
                <Info className="w-3.5 h-3.5 text-blue-400 inline ml-1 align-text-bottom" />
                يمكنك التعديل مباشرة على الخلايا أو الضغط على زر <span className="text-white">Enter</span> للبدء في الكتابة السريعة.
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 flex flex-col gap-2 items-center justify-center h-full">
              <HelpCircle className="w-10 h-10 text-slate-700" />
              <span className="text-[10px] font-black">حدد أحد خلايا سطر الصنف النشط لعرض بطاقته المخزنية هنا</span>
            </div>
          )}

          {/* Quick tab helpers */}
          <div className="border-t border-slate-800 pt-2.5 mt-4 space-y-1">
            <button
              onClick={() => handleOpenNewTab('sale')}
              className="w-full text-right py-1 px-2 hover:bg-slate-800 text-[10px] font-black rounded text-blue-400 flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> فتح فاتورة مبيعات في تبويب مستقل
            </button>
            <button
              onClick={() => handleOpenNewTab('purchase')}
              className="w-full text-right py-1 px-2 hover:bg-slate-800 text-[10px] font-black rounded text-amber-400 flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> فتح فاتورة مشتريات في تبويب مستقل
            </button>
          </div>
        </div>

      </div>

      {/* PRINT PREVIEW MODAL with custom models & visual designer */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-6 z-[9999] backdrop-blur-xs font-sans" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-[1000px] h-[650px] flex flex-col overflow-hidden animate-window-open">
            
            {/* Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between shrink-0">
              <span className="font-black text-xs text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" /> معاينة وتصميم قوالب الطباعة المحترفة - الميزان المحاسبي
              </span>
              <button 
                onClick={() => setIsPreviewOpen(false)} 
                className="p-1 hover:bg-slate-300 rounded-full cursor-pointer text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split layout inside Print Preview: Left Settings Editor Sidebar vs Right Visual sheet preview */}
            <div className="flex-1 flex min-h-0">
              
              {/* Left Settings Sidebar */}
              <div className="w-80 bg-slate-50 border-l border-slate-200 p-3.5 space-y-4 overflow-y-auto shrink-0 font-bold text-xs text-slate-700">
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">اختر قالب/نموذج الطباعة</label>
                  <select
                    value={selectedPrintModel}
                    onChange={e => {
                      const model = e.target.value;
                      setSelectedPrintModel(model);
                      // Auto-apply specific settings based on models selected
                      if (model === 'A4_Full') {
                        setPrintCustomizations(prev => ({ ...prev, fontSize: '12px', showLogo: true, showPrices: true, showQuantities: true }));
                      } else if (model.includes('Thermal')) {
                        setPrintCustomizations(prev => ({ ...prev, fontSize: '10px', showLogo: true, marginSize: '5px' }));
                      } else if (model === 'No_Prices') {
                        setPrintCustomizations(prev => ({ ...prev, showPrices: false, showLogo: false }));
                      } else if (model === 'No_Quantities') {
                        setPrintCustomizations(prev => ({ ...prev, showQuantities: false }));
                      }
                      showToast(`تم تطبيق القالب: ${model}`, 'success');
                    }}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="A4_Full">فاتورة A4 كاملة (مع ترويسة وإطارات)</option>
                    <option value="A5_Half">فاتورة نصف A4 (A5 - مدمج)</option>
                    <option value="Thermal_80">فاتورة حرارية نقاط بيع 80 مم</option>
                    <option value="Thermal_58">فاتورة حرارية نقاط بيع 58 مم</option>
                    <option value="Simplified">نموذج مبسط (البنود والضرائب فقط)</option>
                    <option value="Detailed">نموذج تفصيلي (الحسابات والمراكز)</option>
                    <option value="With_Logo">نموذج يحتوي على شعار الشركة</option>
                    <option value="No_Prices">نموذج مستودعي للتحضير (بدون أسعار)</option>
                    <option value="No_Quantities">نموذج سري للتسعير (بدون كميات)</option>
                    <option value="Arabic_Only">نموذج باللغة العربية الفصحى</option>
                    <option value="English_Only">نموذج باللغة الإنجليزية كاملة</option>
                    <option value="Bilingual">نموذج ثنائي اللغة (Arabic + English)</option>
                  </select>
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">تخصيص القالب والخطوط والألوان</span>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500">عنوان الفاتورة الرئيسي</label>
                    <input
                      type="text"
                      value={printCustomizations.title}
                      onChange={e => setPrintCustomizations({ ...printCustomizations, title: e.target.value })}
                      className="w-full bg-white border rounded p-1 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500">العنوان الفرعي والشركة</label>
                    <input
                      type="text"
                      value={printCustomizations.subTitle}
                      onChange={e => setPrintCustomizations({ ...printCustomizations, subTitle: e.target.value })}
                      className="w-full bg-white border rounded p-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">حجم الخط</label>
                      <select
                        value={printCustomizations.fontSize}
                        onChange={e => setPrintCustomizations({ ...printCustomizations, fontSize: e.target.value })}
                        className="w-full bg-white border rounded p-1 text-[11px]"
                      >
                        <option value="9px">صغير جداً (9px)</option>
                        <option value="11px">متوسط (11px)</option>
                        <option value="13px">كبير (13px)</option>
                        <option value="15px">ضخم (15px)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500">لون الطابع</label>
                      <select
                        value={printCustomizations.colorTheme}
                        onChange={e => setPrintCustomizations({ ...printCustomizations, colorTheme: e.target.value })}
                        className="w-full bg-white border rounded p-1 text-[11px]"
                      >
                        <option value="#1e40af">أزرق ملكي</option>
                        <option value="#0f766e">أخضر بترولي</option>
                        <option value="#b91c1c">أحمر داكن</option>
                        <option value="#1e293b">رمادي غامق</option>
                        <option value="#000000">أسود رمادي</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggle fields checkboxes */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={printCustomizations.showLogo}
                        onChange={e => setPrintCustomizations({ ...printCustomizations, showLogo: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      إظهار شعار الترويسة {printCustomizations.logoIcon}
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={printCustomizations.showPrices}
                        onChange={e => setPrintCustomizations({ ...printCustomizations, showPrices: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      إظهار الأسعار والخصومات الإجمالية
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={printCustomizations.showQuantities}
                        onChange={e => setPrintCustomizations({ ...printCustomizations, showQuantities: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      إظهار عمود الكميات
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={printCustomizations.showQRCode}
                        onChange={e => setPrintCustomizations({ ...printCustomizations, showQRCode: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      تضمين رمز الاستجابة الضريبي ZATCA
                    </label>
                  </div>

                </div>

                <div className="bg-slate-100 p-2 rounded border border-slate-200 text-[10px] text-slate-500 font-medium leading-relaxed">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline ml-1 align-text-bottom" />
                  أية تغييرات تجريها هنا يتم حفظها في القالب النشط فوراً لتسهيل تسلسل الاستخدام.
                </div>

              </div>

              {/* Right interactive visual sheet container */}
              <div className="flex-1 bg-slate-200 overflow-y-auto p-4 flex justify-center items-start">
                
                {/* Print Sheet */}
                <div 
                  style={{ 
                    width: selectedPrintModel.includes('Thermal') ? '360px' : '520px',
                    borderColor: printCustomizations.colorTheme,
                    padding: printCustomizations.marginSize
                  }}
                  className="bg-white border-t-[8px] shadow-2xl p-6 relative text-right text-xs font-bold leading-relaxed space-y-4 text-slate-800"
                >
                  
                  {/* Header custom design representation */}
                  {printCustomizations.showLogo && (
                    <div className="flex justify-between items-center border-b pb-3 border-slate-200">
                      <div>
                        <div className="text-sm font-black" style={{ color: printCustomizations.colorTheme }}>
                          {printCustomizations.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {printCustomizations.subTitle}
                        </div>
                      </div>
                      <div className="text-3xl shrink-0">{printCustomizations.logoIcon}</div>
                    </div>
                  )}

                  {/* Customer and warehouse properties */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <div>
                      <span>رقم المعاملة: <span className="font-mono text-slate-900">{activeTab.invoiceNo}</span></span><br/>
                      <span>تاريخها: <span className="font-mono text-slate-900">{activeTab.date}</span></span>
                    </div>
                    <div>
                      <span>المستفيد: <span className="text-slate-900">{customers.find(c => c.id === activeTab.customerId)?.name || 'غير محدد'}</span></span><br/>
                      <span>المستودع: <span className="text-slate-900">{warehouses.find(w => w.id === activeTab.warehouseId)?.name || 'الرئيسي'}</span></span>
                    </div>
                  </div>

                  {/* Printed Items Table */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-[10px] font-bold">
                      <thead>
                        <tr style={{ backgroundColor: printCustomizations.colorTheme }} className="text-white text-right">
                          <th className="p-1 text-center w-6">#</th>
                          <th className="p-1">اسم الصنف السلعي</th>
                          {printCustomizations.showQuantities && <th className="p-1 text-center w-12">الكمية</th>}
                          {printCustomizations.showPrices && <th className="p-1 text-center w-16">سعر الوحدة</th>}
                          {printCustomizations.showPrices && <th className="p-1 text-left w-16">الإجمالي</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        {activeTab.gridRows.map((row, idx) => {
                          const it = items.find(i => i.id === row.itemId);
                          return (
                            <tr key={row.id}>
                              <td className="p-1 text-center font-mono">{idx + 1}</td>
                              <td className="p-1 truncate">{it?.name || 'صنف مالي'}</td>
                              {printCustomizations.showQuantities && <td className="p-1 text-center font-mono">{row.quantity}</td>}
                              {printCustomizations.showPrices && <td className="p-1 text-center font-mono">{row.unitPrice}</td>}
                              {printCustomizations.showPrices && <td className="p-1 text-left font-mono">{row.total} ر.س</td>}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations and sums */}
                  <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                    
                    {printCustomizations.showQRCode && (
                      <div className="w-20 h-20 border p-0.5 bg-white shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                          <rect width="100" height="100" fill="white" />
                          <rect x="5" y="5" width="20" height="20" fill="black" />
                          <rect x="75" y="5" width="20" height="20" fill="black" />
                          <rect x="5" y="75" width="20" height="20" fill="black" />
                          <rect x="35" y="35" width="30" height="30" fill="black" />
                        </svg>
                      </div>
                    )}

                    {printCustomizations.showPrices && (
                      <div className="w-48 bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>الإجمالي المبدئي:</span>
                          <span className="font-mono text-slate-900">{subtotal.toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>الضريبة {activeTab.taxPercent}%:</span>
                          <span className="font-mono">{taxAmount.toLocaleString()} ر.س</span>
                        </div>
                        <div className="flex justify-between text-blue-700 font-black border-t pt-1 text-[11px]">
                          <span>الصافي الكلي:</span>
                          <span className="font-mono">{netAmount.toLocaleString()} ر.س</span>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 p-3 border-t flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setIsPreviewOpen(false)} 
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold text-xs cursor-pointer"
              >
                إغلاق المعاينة
              </button>
              <button 
                onClick={() => { setIsPreviewOpen(false); handleSilentPrint(); }} 
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 shadow"
              >
                <Printer className="w-4 h-4" /> توجيه لملقم الطباعة المباشر
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

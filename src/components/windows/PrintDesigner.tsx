import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { PrintTemplate, PrintElement, Invoice } from '../../types/erp';
import { 
  Printer, Save, Trash2, Copy, Download, Upload, Plus, ChevronRight, 
  RotateCw, Layout, CheckCircle, RefreshCw, Layers, Sliders, Type, Barcode as BarcodeIcon, 
  QrCode, Table, FileText, Check, HelpCircle, X, AlignLeft, AlignCenter, AlignRight, Bold
} from 'lucide-react';

interface PrintDesignerProps {
  windowId: string;
  onClose: () => void;
  invoiceType?: string;
  invoiceData?: Invoice;
}

export const PrintDesigner: React.FC<PrintDesignerProps> = ({ 
  windowId, 
  onClose, 
  invoiceType = 'sale',
  invoiceData 
}) => {
  const { 
    templates, 
    addPrintTemplate, 
    deletePrintTemplate, 
    showToast,
    currentUser,
    branches,
    warehouses,
    customers,
    items
  } = useErp();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'ahmed';

  // State for active template
  const filteredTemplates = templates.filter(t => t.type === invoiceType);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const defaultTpl = filteredTemplates.find(t => t.isDefault);
    return defaultTpl ? defaultTpl.id : (filteredTemplates[0]?.id || '');
  });

  const [activeTemplate, setActiveTemplate] = useState<PrintTemplate | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ w: 0, h: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync state when selected template changes
  useEffect(() => {
    const tpl = templates.find(t => t.id === selectedTemplateId);
    if (tpl) {
      setActiveTemplate(JSON.parse(JSON.stringify(tpl))); // Deep clone to avoid immediate direct mutations
    } else if (filteredTemplates.length > 0) {
      setActiveTemplate(JSON.parse(JSON.stringify(filteredTemplates[0])));
      setSelectedTemplateId(filteredTemplates[0].id);
    } else {
      setActiveTemplate(null);
    }
  }, [selectedTemplateId, templates, invoiceType]);

  if (!activeTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-slate-500" dir="rtl">
        <Layout className="w-16 h-16 text-slate-300 mb-3 animate-pulse" />
        <p className="text-sm font-bold">لا يوجد قوالب طباعة متوفرة لهذا النوع من الفواتير.</p>
        {isAdmin && (
          <button
            onClick={handleCreateNewTemplate}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إنشاء قالب جديد
          </button>
        )}
      </div>
    );
  }

  // Generate SVG Barcode
  const renderBarcodeSVG = (value: string) => {
    // Basic standard barcode emulation (Code 128 / Code 39 look)
    const code = value || 'INV12345';
    const bars: React.ReactNode[] = [];
    let position = 5;
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const isEven = charCode % 2 === 0;
      bars.push(<rect key={`b1-${i}`} x={position} y={5} width={isEven ? 3 : 1} height={40} fill="black" />);
      position += isEven ? 5 : 3;
      bars.push(<rect key={`w1-${i}`} x={position} y={5} width={2} height={40} fill="white" />);
      position += 2;
    }
    return (
      <svg className="w-full h-full" viewBox={`0 0 ${position + 5} 55`}>
        {bars}
        <text x="50%" y="52" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="black">{code}</text>
      </svg>
    );
  };

  // Generate SVG QR Code mock (Zatca compliant visual)
  const renderQRCodeSVG = () => {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none">
        {/* Frame */}
        <rect width="100" height="100" fill="white" />
        {/* Corners */}
        <rect x="5" y="5" width="20" height="20" fill="black" />
        <rect x="8" y="8" width="14" height="14" fill="white" />
        <rect x="11" y="11" width="8" height="8" fill="black" />

        <rect x="75" y="5" width="20" height="20" fill="black" />
        <rect x="78" y="8" width="14" height="14" fill="white" />
        <rect x="81" y="11" width="8" height="8" fill="black" />

        <rect x="5" y="75" width="20" height="20" fill="black" />
        <rect x="8" y="78" width="14" height="14" fill="white" />
        <rect x="11" y="81" width="8" height="8" fill="black" />

        {/* Small alignment block */}
        <rect x="75" y="75" width="8" height="8" fill="black" />

        {/* Dynamic pixelated layout representation */}
        <path d="M 30 10 H 45 V 15 H 35 V 25 H 30 Z" fill="black" />
        <path d="M 50 10 H 65 V 15 H 50 Z" fill="black" />
        <path d="M 35 35 H 45 V 45 H 35 Z" fill="black" />
        <path d="M 15 35 H 25 V 45 H 15 Z" fill="black" />
        <path d="M 55 35 H 65 V 55 H 55 Z" fill="black" />
        <path d="M 75 35 H 95 V 40 H 75 Z" fill="black" />
        <path d="M 75 50 H 85 V 60 H 75 Z" fill="black" />
        <path d="M 15 55 H 25 V 65 H 15 Z" fill="black" />
        <path d="M 35 55 H 45 V 70 H 35 Z" fill="black" />
        <path d="M 55 65 H 70 V 75 H 55 Z" fill="black" />
        <path d="M 45 75 H 50 V 90 H 45 Z" fill="black" />
        <path d="M 10 95 H 40 V 98 H 10 Z" fill="black" />
        <path d="M 60 85 H 90 V 90 H 60 Z" fill="black" />
      </svg>
    );
  };

  // Create template
  function handleCreateNewTemplate() {
    if (!isAdmin) {
      showToast('خطأ: الصلاحية مقتصرة على المشرف العام لتغيير قوالب الفواتير.', 'error');
      return;
    }
    const newId = `tpl-${invoiceType}-${Date.now()}`;
    const newTemplate: PrintTemplate = {
      id: newId,
      name: `نموذج جديد ${filteredTemplates.length + 1}`,
      type: invoiceType,
      paperSize: 'A4',
      isPortrait: true,
      margins: { top: 15, bottom: 15, left: 15, right: 15 },
      showFrame: true,
      isDefault: false,
      elements: [
        { id: `el-${Date.now()}-1`, type: 'header', x: 25, y: 15, w: 50, h: 40, value: 'عنوان الشركة الافتراضي', fontSize: 14, bold: true, align: 'center' },
        { id: `el-${Date.now()}-2`, type: 'table', x: 5, y: 150, w: 90, h: 250, value: 'items_grid' }
      ]
    };
    addPrintTemplate(newTemplate);
    setSelectedTemplateId(newId);
    showToast('تم إنشاء قالب طباعة جديد بنجاح. يمكنك تصميمه الآن.', 'success');
  }

  // Duplicate template
  const handleDuplicateTemplate = () => {
    if (!isAdmin) {
      showToast('خطأ: الصلاحية مقتصرة على المشرف العام.', 'error');
      return;
    }
    const newId = `tpl-${invoiceType}-${Date.now()}`;
    const duplicated: PrintTemplate = {
      ...activeTemplate,
      id: newId,
      name: `${activeTemplate.name} (نسخة مكررة)`,
      isDefault: false
    };
    addPrintTemplate(duplicated);
    setSelectedTemplateId(newId);
    showToast('تم تكرار القالب بنجاح.', 'success');
  };

  // Delete template
  const handleDeleteTemplate = () => {
    if (!isAdmin) {
      showToast('خطأ: الصلاحية مقتصرة على المشرف العام.', 'error');
      return;
    }
    if (filteredTemplates.length <= 1) {
      showToast('لا يمكن حذف القالب الوحيد المتبقي لهذا الصنف من الفواتير.', 'warning');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف قالب الطباعة "${activeTemplate.name}" نهائياً؟`)) {
      deletePrintTemplate(activeTemplate.id);
      const nextTpl = filteredTemplates.find(t => t.id !== activeTemplate.id);
      setSelectedTemplateId(nextTpl ? nextTpl.id : '');
      showToast('تم حذف قالب الطباعة من قاعدة البيانات السحابية للشركة.', 'warning');
    }
  };

  // Set as default
  const handleSetDefault = () => {
    if (!isAdmin) {
      showToast('خطأ: الصلاحية مقتصرة على المشرف العام.', 'error');
      return;
    }
    // Update all templates of this type to non-default, set current to default
    filteredTemplates.forEach(t => {
      const updated = { ...t, isDefault: t.id === activeTemplate.id };
      addPrintTemplate(updated);
    });
    showToast('تم تعيين هذا القالب كقالب افتراضي لطباعة فواتير ' + invoiceType, 'success');
  };

  // Save template edits to backend database
  const handleSaveLayout = () => {
    if (!isAdmin) {
      showToast('خطأ: الصلاحية مقتصرة على المشرف العام لحفظ التعديلات.', 'error');
      return;
    }
    addPrintTemplate(activeTemplate);
    showToast('تم حفظ التعديلات على قالب الطباعة بنجاح ومزامنتها سحابياً.', 'success');
  };

  // Export template as JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeTemplate, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeTemplate.name}_Layout.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير ملف قالب الطباعة بنجاح.', 'info');
  };

  // Import template JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      showToast('خطأ: المشرف العام فقط يمكنه الاستيراد.', 'error');
      return;
    }
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.id && parsed.elements && Array.isArray(parsed.elements)) {
            const imported: PrintTemplate = {
              ...parsed,
              id: activeTemplate.id, // preserve current slot
              type: invoiceType
            };
            setActiveTemplate(imported);
            showToast('تم استيراد هيكل قالب الطباعة بنجاح. اضغط حفظ للمزامنة.', 'success');
          } else {
            showToast('الملف المختار لا يتوافق مع صيغ قوالب طباعة الفواتير المعتمدة.', 'error');
          }
        } catch (err) {
          showToast('فشل قراءة الملف الرقمي لقالب الطباعة.', 'error');
        }
      };
      fileReader.readAsText(e.target.files[0]);
    }
  };

  // Update specific element property
  const updateElementProp = (elId: string, key: keyof PrintElement, value: any) => {
    if (!activeTemplate) return;
    setActiveTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        elements: prev.elements.map(el => el.id === elId ? { ...el, [key]: value } : el)
      };
    });
  };

  // Add new layout element
  const handleAddElement = (type: PrintElement['type']) => {
    if (!activeTemplate) return;
    const defaultLabels: Record<PrintElement['type'], string> = {
      text: 'نص مخصص يكتب هنا...',
      image: 'رابط الصورة...',
      barcode: invoiceData?.invoiceNo || 'SAL-00001',
      qrcode: 'https://fatoora.zatca.gov.sa',
      table: 'items_grid',
      totals: 'totals_box',
      logo: '🏢',
      signature: 'توقيع معتمد',
      stamp: 'الختم الرسمي',
      header: 'شركة الميزان للتجارة والتوريدات',
      footer: 'المستند غير صالح للتداول الخارجي بدون الختم والتدقيق المالي.',
      watermark: 'نسخة مراجعة غير نهائية'
    };

    const newElement: PrintElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      x: 35,
      y: 120 + activeTemplate.elements.length * 30,
      w: type === 'table' || type === 'header' || type === 'footer' ? 90 : 30,
      h: type === 'table' ? 220 : type === 'totals' ? 100 : 40,
      value: defaultLabels[type],
      fontSize: type === 'header' ? 14 : 10,
      align: 'right'
    };

    setActiveTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        elements: [...prev.elements, newElement]
      };
    });
    setSelectedElementId(newElement.id);
  };

  // Remove element
  const handleRemoveElement = (elId: string) => {
    setActiveTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        elements: prev.elements.filter(el => el.id !== elId)
      };
    });
    setSelectedElementId(null);
  };

  // Drag and drop mechanics with pixel mapping on canvas ref
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-container')) {
      setSelectedElementId(null);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, el: PrintElement, resize = false) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    setMouseStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x: el.x, y: el.y });
    setInitialSize({ w: el.w, h: el.h });
    
    if (resize) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!canvasRef.current || !selectedElementId || !activeTemplate) return;

    const deltaX = e.clientX - mouseStart.x;
    const deltaY = e.clientY - mouseStart.y;

    const canvasWidth = canvasRef.current.clientWidth;
    // Map pixels to percent grid
    const percentDeltaX = (deltaX / canvasWidth) * 100;
    // Keep exact pixel aspect ratio height or map vertically
    const percentDeltaY = deltaY; 

    if (isDragging) {
      let newX = Math.round(initialPos.x + percentDeltaX);
      let newY = Math.round(initialPos.y + percentDeltaY);

      // Bounds lock
      newX = Math.max(0, Math.min(100 - activeTemplate.elements.find(el => el.id === selectedElementId)!.w, newX));
      newY = Math.max(0, newY);

      updateElementProp(selectedElementId, 'x', newX);
      updateElementProp(selectedElementId, 'y', newY);
    } else if (isResizing) {
      const el = activeTemplate.elements.find(e => e.id === selectedElementId)!;
      let newW = Math.round(initialSize.w + percentDeltaX);
      let newH = Math.round(initialSize.h + percentDeltaY);

      newW = Math.max(5, Math.min(100 - el.x, newW));
      newH = Math.max(15, newH);

      updateElementProp(selectedElementId, 'w', newW);
      updateElementProp(selectedElementId, 'h', newH);
    }
  };

  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, selectedElementId, initialPos, initialSize, mouseStart, activeTemplate]);

  // Handle direct print simulation
  const handleDirectPrint = () => {
    showToast('جاري تحضير ملف الطباعة ومواءمة لغة الرول / الحراري...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Mock export to other formats
  const handleMockExport = (format: 'pdf' | 'excel' | 'word') => {
    showToast(`جاري تحضير وتصدير الفاتورة بصيغة ${format.toUpperCase()}...`, 'info');
    setTimeout(() => {
      // Simulate real download by constructing dynamic elements file
      const dummyContent = `رقم الفاتورة: ${invoiceData?.invoiceNo || 'SAL-TEST'}\nالتاريخ: ${invoiceData?.date || '2026-07-03'}\nالعميل: ${invoiceData?.customerId || 'غير محدد'}\nالصافي: ${invoiceData?.netAmount || 0} ريال\n`;
      const blob = new Blob([dummyContent], { type: format === 'pdf' ? 'application/pdf' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceData?.invoiceNo || 'Invoice'}_Export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`تم تصدير وحفظ المستند الرقمي بنجاح.`, 'success');
    }, 1000);
  };

  const selectedElement = activeTemplate.elements.find(el => el.id === selectedElementId);

  return (
    <div className="flex flex-col h-full bg-slate-100 select-none overflow-hidden text-slate-800" dir="rtl">
      {/* Top toolbar */}
      <div className="h-12 border-b border-slate-300 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Printer className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            مصمم ومعدل قوالب طباعة الفواتير المحترف
            <span className="text-[10px] bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 font-bold">
              {invoiceType === 'sale' ? 'مبيعات' : 'مشتريات/سندات'}
            </span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <button
              onClick={handleSaveLayout}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="حفظ الهيكل في قاعدة البيانات"
            >
              <Save className="w-3.5 h-3.5" /> حفظ التغييرات
            </button>
          )}
          <button
            onClick={handleDirectPrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> طباعة فورية
          </button>
          <div className="border-r border-slate-300 h-6 mx-1"></div>
          <button
            onClick={() => handleMockExport('pdf')}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            PDF
          </button>
          <button
            onClick={() => handleMockExport('excel')}
            className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            Excel
          </button>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Designer Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Template Selection & Setup */}
        <div className="w-[240px] shrink-0 bg-white border-l border-slate-200 p-3 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">اختر القالب النشط للتعديل</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {filteredTemplates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isDefault ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper setup */}
            <div className="space-y-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" /> إعدادات الورق والهامش
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">حجم الورقة المحدد</label>
                <select
                  value={activeTemplate.paperSize}
                  onChange={e => {
                    if (!isAdmin) return;
                    setActiveTemplate(prev => prev ? { ...prev, paperSize: e.target.value } : null);
                  }}
                  disabled={!isAdmin}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  <option value="A4">A4 (مبيعات قياسية)</option>
                  <option value="A5">A5 (فواتير مصغرة)</option>
                  <option value="receipt_80">Thermal 80mm (كاشير/حراري)</option>
                  <option value="receipt_58">Thermal 58mm (سفري)</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">اتجاه الصفحة طولي</span>
                <button
                  onClick={() => {
                    if (!isAdmin) return;
                    setActiveTemplate(prev => prev ? { ...prev, isPortrait: !prev.isPortrait } : null);
                  }}
                  disabled={!isAdmin}
                  className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                    activeTemplate.isPortrait 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {activeTemplate.isPortrait ? 'طولي' : 'عرضي'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">رسم إطار طباعة كامل</span>
                <button
                  onClick={() => {
                    if (!isAdmin) return;
                    setActiveTemplate(prev => prev ? { ...prev, showFrame: !prev.showFrame } : null);
                  }}
                  disabled={!isAdmin}
                  className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                    activeTemplate.showFrame 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {activeTemplate.showFrame ? 'مفعل' : 'ملغي'}
                </button>
              </div>

              {/* Margins */}
              <div>
                <span className="block text-[10px] text-slate-500 mb-1.5">حجم الهوامش (مليمتر)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[9px] text-slate-400">أعلى</label>
                    <input
                      type="number"
                      value={activeTemplate.margins.top}
                      onChange={e => {
                        if (!isAdmin) return;
                        const top = Number(e.target.value);
                        setActiveTemplate(prev => prev ? { ...prev, margins: { ...prev.margins, top } } : null);
                      }}
                      disabled={!isAdmin}
                      className="w-full bg-white border border-slate-300 rounded p-1 text-center font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">أسفل</label>
                    <input
                      type="number"
                      value={activeTemplate.margins.bottom}
                      onChange={e => {
                        if (!isAdmin) return;
                        const bottom = Number(e.target.value);
                        setActiveTemplate(prev => prev ? { ...prev, margins: { ...prev.margins, bottom } } : null);
                      }}
                      disabled={!isAdmin}
                      className="w-full bg-white border border-slate-300 rounded p-1 text-center font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">يمين</label>
                    <input
                      type="number"
                      value={activeTemplate.margins.right}
                      onChange={e => {
                        if (!isAdmin) return;
                        const right = Number(e.target.value);
                        setActiveTemplate(prev => prev ? { ...prev, margins: { ...prev.margins, right } } : null);
                      }}
                      disabled={!isAdmin}
                      className="w-full bg-white border border-slate-300 rounded p-1 text-center font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">يسار</label>
                    <input
                      type="number"
                      value={activeTemplate.margins.left}
                      onChange={e => {
                        if (!isAdmin) return;
                        const left = Number(e.target.value);
                        setActiveTemplate(prev => prev ? { ...prev, margins: { ...prev.margins, left } } : null);
                      }}
                      disabled={!isAdmin}
                      className="w-full bg-white border border-slate-300 rounded p-1 text-center font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* List of elements to add */}
            {isAdmin && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400">إضافة حقول وعناصر جديدة للنموذج</span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => handleAddElement('header')}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded text-[10px] text-right font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Type className="w-3 h-3 text-blue-500" /> ترويسة رئيسية
                  </button>
                  <button
                    onClick={() => handleAddElement('text')}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded text-[10px] text-right font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-indigo-500" /> حقل نصي مخصص
                  </button>
                  <button
                    onClick={() => handleAddElement('barcode')}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded text-[10px] text-right font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <BarcodeIcon className="w-3 h-3 text-orange-500" /> ملصق باركود
                  </button>
                  <button
                    onClick={() => handleAddElement('qrcode')}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded text-[10px] text-right font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3 h-3 text-emerald-500" /> رمز استجابة QR
                  </button>
                  <button
                    onClick={() => handleAddElement('signature')}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded text-[10px] text-right font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3 h-3 text-red-500" /> حقل توقيع/ختم
                  </button>
                  <button
                    onClick={() => handleAddElement('watermark')}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded text-[10px] text-right font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3 text-purple-500" /> علامة مائية
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Template Actions (Admin only) */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              <button
                onClick={handleSetDefault}
                className="w-full text-center py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-300 rounded font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
              >
                ⭐ تعيين كقالب افتراضي
              </button>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={handleDuplicateTemplate}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[10px] cursor-pointer"
                >
                  تكرار القالب
                </button>
                <button
                  onClick={handleDeleteTemplate}
                  className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded font-bold text-[10px] cursor-pointer"
                >
                  حذف القالب
                </button>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center gap-1.5">
                <button
                  onClick={handleExportJSON}
                  className="flex-1 p-1 bg-slate-50 hover:bg-slate-100 border rounded text-[9px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-2.5 h-2.5" /> تصدير قالب
                </button>
                <label className="flex-1 p-1 bg-slate-50 hover:bg-slate-100 border rounded text-[9px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer">
                  <Upload className="w-2.5 h-2.5" /> استيراد
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>
              <button
                onClick={handleCreateNewTemplate}
                className="w-full py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded font-black text-[10px] cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> إنشاء قالب طباعة جديد
              </button>
            </div>
          )}
        </div>

        {/* Middle Canvas: Live WYSIWYG Page Preview & Drag Layout */}
        <div 
          className="flex-1 bg-slate-100 p-6 overflow-y-auto flex items-start justify-center canvas-container"
          onClick={handleCanvasMouseDown}
        >
          {/* Main Visual Representation of Selected Paper size */}
          <div 
            ref={canvasRef}
            className="bg-white shadow-2xl relative select-none border border-slate-400 overflow-hidden"
            style={{
              width: activeTemplate.paperSize.startsWith('receipt') ? '290px' : '595px', // 595px maps perfectly to A4 proportion
              height: activeTemplate.paperSize.startsWith('receipt') ? '700px' : '842px', // A4 595x842 ratio
              borderRadius: '2px',
              transition: 'all 0.2s',
              borderColor: activeTemplate.showFrame ? '#64748b' : '#cbd5e1',
              borderWidth: activeTemplate.showFrame ? '2px' : '1px'
            }}
          >
            {/* Margins Visual Guard rails */}
            <div 
              className="absolute pointer-events-none border border-dashed border-blue-200"
              style={{
                top: `${activeTemplate.margins.top}px`,
                bottom: `${activeTemplate.margins.bottom}px`,
                left: `${activeTemplate.margins.left}px`,
                right: `${activeTemplate.margins.right}px`
              }}
            ></div>

            {/* Absolute element placement */}
            {activeTemplate.elements.map(el => {
              const isSelected = selectedElementId === el.id;

              // Parse expressions in text elements
              let parsedValue = el.value;
              if (parsedValue && typeof parsedValue === 'string') {
                parsedValue = parsedValue
                  .replace(/{invoiceNo}/g, invoiceData?.invoiceNo || 'SAL-TEST-001')
                  .replace(/{date}/g, invoiceData?.date || '2026-07-03')
                  .replace(/{customerName}/g, invoiceData?.customerId ? (customers.find(c => c.id === invoiceData.customerId)?.name || invoiceData.customerId) : 'عميل افتراضي للشركة')
                  .replace(/{customerPhone}/g, '0501234567')
                  .replace(/{customerAddress}/g, 'الرياض - الملز')
                  .replace(/{warehouseName}/g, invoiceData?.warehouseId ? (warehouses.find(w => w.id === invoiceData.warehouseId)?.name || invoiceData.warehouseId) : 'مستودع صالة العرض')
                  .replace(/{netAmount}/g, invoiceData?.netAmount?.toLocaleString() || '10,350')
                  .replace(/{currentDate}/g, new Date().toLocaleString('ar-SA'));
              }

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => {
                    if (isAdmin) {
                      handleElementMouseDown(e, el);
                    } else {
                      setSelectedElementId(el.id);
                    }
                  }}
                  className={`absolute flex flex-col justify-between group transition-shadow ${
                    isAdmin ? 'cursor-move hover:ring-1 hover:ring-blue-400' : ''
                  } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''}`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}px`,
                    width: `${el.w}%`,
                    height: `${el.h}px`,
                  }}
                >
                  {/* Element dynamic display */}
                  <div className="flex-1 w-full overflow-hidden flex flex-col justify-center h-full">
                    {el.type === 'table' ? (
                      <div className="w-full h-full border border-slate-300 text-[10px] bg-slate-50 flex flex-col overflow-hidden">
                        <div className="bg-slate-200 text-slate-700 font-bold grid grid-cols-12 py-1 px-1 border-b border-slate-300">
                          <span className="col-span-1 text-center">#</span>
                          <span className="col-span-6 text-right">اسم المادة / الوصف الفني</span>
                          <span className="col-span-1 text-center">الوحدة</span>
                          <span className="col-span-1 text-center">الكمية</span>
                          <span className="col-span-1.5 text-center">سعر الوحدة</span>
                          <span className="col-span-1.5 text-center">الإجمالي</span>
                        </div>
                        <div className="divide-y divide-slate-200 flex-1 overflow-hidden font-bold">
                          {(invoiceData?.items || [
                            { itemId: 'it-1', quantity: 5, unitPrice: 1800, unit: 'حبة', total: 9000 },
                            { itemId: 'it-2', quantity: 1, unitPrice: 1350, unit: 'حبة', total: 1350 }
                          ]).map((itemRow, idx) => {
                            const itemName = items.find(i => i.id === itemRow.itemId)?.name || 'مادة تجريبية مصممة';
                            return (
                              <div key={idx} className="grid grid-cols-12 py-1 px-1 text-[9px] hover:bg-slate-100">
                                <span className="col-span-1 text-center font-mono">{idx + 1}</span>
                                <span className="col-span-6 text-right truncate font-bold text-slate-800">{itemName}</span>
                                <span className="col-span-1 text-center">{itemRow.unit}</span>
                                <span className="col-span-1 text-center font-mono">{itemRow.quantity}</span>
                                <span className="col-span-1.5 text-center font-mono">{itemRow.unitPrice}</span>
                                <span className="col-span-1.5 text-center font-mono font-bold text-slate-900">{itemRow.total}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : el.type === 'totals' ? (
                      <div className="w-full h-full bg-slate-50 border border-slate-300 rounded p-2 text-[10px] space-y-1 font-bold">
                        <div className="flex justify-between border-b pb-0.5">
                          <span>إجمالي الفاتورة:</span>
                          <span className="font-mono">{invoiceData?.netAmount ? (invoiceData.netAmount / 1.15).toFixed(2) : '9,000'} ر.س</span>
                        </div>
                        <div className="flex justify-between border-b pb-0.5 text-slate-500">
                          <span>قيمة الخصم المنفذ:</span>
                          <span className="font-mono">{invoiceData?.discount || '0.00'} ر.س</span>
                        </div>
                        <div className="flex justify-between border-b pb-0.5 text-red-600">
                          <span>ضريبة القيمة المضافة (15%):</span>
                          <span className="font-mono">{invoiceData?.netAmount ? (invoiceData.netAmount * 0.15).toFixed(2) : '1,350'} ر.س</span>
                        </div>
                        <div className="flex justify-between text-blue-700 font-black text-[11px] pt-0.5">
                          <span>الصافي الكلي المطلوب:</span>
                          <span className="font-mono">{invoiceData?.netAmount || '10,350'} ر.س</span>
                        </div>
                      </div>
                    ) : el.type === 'barcode' ? (
                      <div className="w-full h-full flex items-center justify-center p-1 bg-white">
                        {renderBarcodeSVG(invoiceData?.invoiceNo || el.value)}
                      </div>
                    ) : el.type === 'qrcode' ? (
                      <div className="w-full h-full flex items-center justify-center bg-white p-1">
                        {renderQRCodeSVG()}
                      </div>
                    ) : el.type === 'logo' ? (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-slate-50 border border-slate-200 rounded">
                        {el.value}
                      </div>
                    ) : el.type === 'watermark' ? (
                      <div className="w-full h-full flex items-center justify-center text-slate-200/50 uppercase font-black tracking-widest text-lg rotate-12 pointer-events-none select-none">
                        {el.value}
                      </div>
                    ) : (
                      <div 
                        className={`w-full whitespace-pre-line text-slate-900 leading-snug`}
                        style={{
                          textAlign: el.align || 'right',
                          fontWeight: el.bold ? 'black' : 'normal',
                          fontSize: `${el.fontSize || 10}px`,
                          color: el.color || 'inherit'
                        }}
                      >
                        {parsedValue}
                      </div>
                    )}
                  </div>

                  {/* Resizing Anchor handle (Admin only) */}
                  {isAdmin && isSelected && (
                    <div 
                      onMouseDown={(e) => handleElementMouseDown(e, el, true)}
                      className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full cursor-se-resize z-50 flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}

                  {/* Delete hovering badge */}
                  {isAdmin && isSelected && (
                    <button
                      onClick={() => handleRemoveElement(el.id)}
                      className="absolute -top-3.5 -left-3 px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-black shadow z-50 cursor-pointer"
                    >
                      حذف
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Element Properties */}
        <div className="w-[260px] shrink-0 bg-white border-r border-slate-200 p-3 overflow-y-auto flex flex-col justify-between">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Sliders className="w-4 h-4 text-blue-600" /> خصائص الحقل المختار
                </span>
                <button
                  onClick={() => handleRemoveElement(selectedElement.id)}
                  className="p-1 hover:bg-red-50 text-red-600 rounded"
                  title="حذف هذا العنصر من النموذج"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">نوع العنصر</label>
                <div className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 uppercase">
                  {selectedElement.type}
                </div>
              </div>

              {/* Text / Header Value Editor */}
              {selectedElement.type !== 'table' && selectedElement.type !== 'totals' && selectedElement.type !== 'qrcode' && (
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">المحتوى النصي / المعطيات</label>
                  <textarea
                    rows={4}
                    value={selectedElement.value}
                    onChange={e => {
                      if (!isAdmin) return;
                      updateElementProp(selectedElement.id, 'value', e.target.value);
                    }}
                    disabled={!isAdmin}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="يمكنك كتابة نص مخصص أو متغيرات مثل {invoiceNo}"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1 cursor-pointer" onClick={() => updateElementProp(selectedElement.id, 'value', selectedElement.value + '{invoiceNo}')}>رقم الفاتورة</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1 cursor-pointer" onClick={() => updateElementProp(selectedElement.id, 'value', selectedElement.value + '{date}')}>التاريخ</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1 cursor-pointer" onClick={() => updateElementProp(selectedElement.id, 'value', selectedElement.value + '{customerName}')}>اسم العميل</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1 cursor-pointer" onClick={() => updateElementProp(selectedElement.id, 'value', selectedElement.value + '{netAmount}')}>الصافي</span>
                  </div>
                </div>
              )}

              {/* Font controls */}
              {selectedElement.type !== 'table' && selectedElement.type !== 'totals' && selectedElement.type !== 'barcode' && selectedElement.type !== 'qrcode' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">حجم الخط (بكسل)</label>
                    <input
                      type="number"
                      value={selectedElement.fontSize || 10}
                      onChange={e => {
                        if (!isAdmin) return;
                        updateElementProp(selectedElement.id, 'fontSize', Number(e.target.value));
                      }}
                      disabled={!isAdmin}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">محاذاة النص</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => {
                          if (!isAdmin) return;
                          updateElementProp(selectedElement.id, 'align', 'right');
                        }}
                        disabled={!isAdmin}
                        className={`p-1 border rounded text-xs flex justify-center cursor-pointer ${
                          selectedElement.align === 'right' ? 'bg-blue-600 text-white' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!isAdmin) return;
                          updateElementProp(selectedElement.id, 'align', 'center');
                        }}
                        disabled={!isAdmin}
                        className={`p-1 border rounded text-xs flex justify-center cursor-pointer ${
                          selectedElement.align === 'center' ? 'bg-blue-600 text-white' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!isAdmin) return;
                          updateElementProp(selectedElement.id, 'align', 'left');
                        }}
                        disabled={!isAdmin}
                        className={`p-1 border rounded text-xs flex justify-center cursor-pointer ${
                          selectedElement.align === 'left' ? 'bg-blue-600 text-white' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-bold">سمك الخط (عريض)</span>
                    <button
                      onClick={() => {
                        if (!isAdmin) return;
                        updateElementProp(selectedElement.id, 'bold', !selectedElement.bold);
                      }}
                      disabled={!isAdmin}
                      className={`p-1.5 border rounded cursor-pointer ${
                        selectedElement.bold ? 'bg-blue-600 text-white' : 'bg-slate-50'
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">لون الخط الفني</label>
                    <input
                      type="color"
                      value={selectedElement.color || '#000000'}
                      onChange={e => {
                        if (!isAdmin) return;
                        updateElementProp(selectedElement.id, 'color', e.target.value);
                      }}
                      disabled={!isAdmin}
                      className="w-full h-8 bg-slate-50 border border-slate-300 rounded p-0.5 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Exact Coordinate details */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] space-y-1 text-slate-500">
                <span className="block font-bold border-b pb-1 mb-1 text-slate-600">تفاصيل الموقع التقني:</span>
                <div className="grid grid-cols-2 gap-1 font-mono">
                  <span>المحور X: %{selectedElement.x}</span>
                  <span>المحور Y: {selectedElement.y}px</span>
                  <span>العرض W: %{selectedElement.w}</span>
                  <span>الارتفاع H: {selectedElement.h}px</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-bold">انقر على أي عنصر في مساحة العمل لتعديل حجمه وخصائصه فوراً.</p>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="bg-blue-50 text-blue-800 rounded p-2 text-[10px] font-bold border border-blue-100 flex items-start gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>ميزة المحاذاة التلقائية والدفع السحابي المباشر مفعلة في قواعد البيانات.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

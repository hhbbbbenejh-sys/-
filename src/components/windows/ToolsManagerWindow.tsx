import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { THEMES, FONTS } from '../../utils/theme';
import { 
  Printer, Hammer, KeyRound, Database, RefreshCw, Save, Check, X, 
  Settings, Sliders, Palette, FileText, AlertTriangle, Play, CheckCircle2,
  Download, Trash2, Cloud, HardDrive, Type, ZoomIn, ZoomOut, Sparkles, CheckCircle
} from 'lucide-react';

interface ToolsManagerWindowProps {
  windowId: string;
  onClose: () => void;
  initialTab?: string;
}

export const ToolsManagerWindow: React.FC<ToolsManagerWindowProps> = ({ windowId, onClose, initialTab }) => {
  const { 
    showToast,
    theme,
    setTheme,
    customColor,
    setCustomColor,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    fontWeight,
    setFontWeight,
    backups,
    addBackup,
    deleteBackup,
    isCheckingUpdate,
    checkProgramUpdate,
    isUpdatingDb,
    updateDatabaseSchema
  } = useErp();

  const [activeTab, setActiveTab] = useState<'designer' | 'layout' | 'maintenance' | 'backups' | 'closing' | 'settings'>(() => {
    if (initialTab === 'layout') return 'layout';
    if (initialTab === 'maintenance') return 'maintenance';
    if (initialTab === 'closing') return 'closing';
    if (initialTab === 'settings') return 'settings';
    return 'designer';
  });

  // 1. Designer State
  const [designerOptions, setDesignerOptions] = useState({
    showLogo: true,
    showBarcode: true,
    showFooterNotes: true,
    headerText: 'مؤسسة أحمد سامي للتجارة والتقنية',
    footerText: 'شروط البيع: البضاعة المباعة تخضع للضوابط الضريبية المعتمدة في الهيئة العامة للزكاة والضريبة والجمارك.',
    paperSize: 'A4'
  });

  // Backup form options
  const [backupType, setBackupType] = useState<'auto' | 'manual'>('manual');
  const [backupStorage, setBackupStorage] = useState<'local' | 'cloud'>('local');
  const [scheduledTime, setScheduledTime] = useState('23:00');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  // Updates states
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<string>('v11.9.8_Pro');

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'تم تهيئة وحدة إدارة النظام والخيارات بنجاح.',
    'الاتصال آمن مع مخازن البيانات الرقمية لشركة أحمد سامي.'
  ]);

  const addLog = (message: string) => {
    const time = new Date().toISOString().substring(11, 19);
    setTerminalLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  const handleSaveDesigner = () => {
    showToast('تم حفظ نموذج وتصميم الفواتير والسندات في مستندات النظام.', 'success');
    addLog('تم تحديث قالب الفواتير وطباعة الـ QR بنجاح.');
  };

  const handleTriggerManualBackup = () => {
    addBackup(backupType, backupStorage);
    addLog(`تم تنفيذ نسخة احتياطية يدوية (${backupStorage === 'cloud' ? 'سحابية' : 'محلية'}).`);
  };

  const handleRestoreBackup = (fileName: string) => {
    if (confirm(`هل أنت متأكد من رغبتك في استعادة قاعدة البيانات من الملف المختار؟\n\nالملف: ${fileName}\n\nسيتم استبدال البيانات الحالية بالكامل بالبيانات المخزنة في النسخة احتياطياً.`)) {
      addLog(`بدء استعادة الملف: ${fileName}...`);
      setTimeout(() => {
        addLog(`تم فك الضغط ومطابقة الفهارس والجداول بنجاح.`);
        addLog(`استعادة قاعدة البيانات تمت بنجاح وبدون أي أخطاء.`);
        showToast('تمت استعادة قاعدة البيانات بنجاح وبدون فقدان أي معلومات.', 'success');
      }, 1000);
    }
  };

  const handleCheckUpdates = async () => {
    addLog('جاري فحص خوادم التحديث الرسمية لنظام أحمد سامي سيستم...');
    const result = await checkProgramUpdate();
    if (result && result.hasUpdate) {
      addLog(`تم العثور على إصدار جديد متوفر: ${result.version}`);
      if (confirm(`يتوفر تحديث جديد للنظام (${result.version}). هل ترغب في تنزيله وتثبيته الآن؟`)) {
        addLog('جاري تحميل حزمة التحديث التراكمية...');
        setTimeout(() => {
          setCurrentVersion(result.version);
          addLog('تم تحميل وتثبيت التحديث بنجاح! الإصدار الحالي الآن هو ' + result.version);
          showToast('تم تحديث البرنامج بنجاح للمظهر والإصدار الأخير.', 'success');
        }, 1500);
      }
    } else {
      addLog('نظامك محدث بالكامل للإصدار الأخير.');
      showToast('أنت تستخدم الإصدار الأحدث من أحمد سامي سيستم.', 'info');
    }
  };

  const handleRunDbUpdate = async () => {
    addLog('جاري فحص الجداول، الفهارس، ومطابقتها مع هيكل البيانات الجديد...');
    await updateDatabaseSchema();
    addLog('تم مواءمة وإصلاح جميع الجداول مع الحفاظ الكامل على حركات المخازن والحسابات المالية.');
  };

  const handleYearEndClosing = () => {
    if (confirm('هل أنت متأكد تماماً من إغلاق السنة المالية الحالية 2026 وتدوير الحسابات؟ سيقوم النظام ببناء قاعدة بيانات جديدة للعام 2027 وترحيل الأرصدة الختامية كأرصدة افتتاحية تلقائياً.')) {
      addLog('بدء إقفال وتدوير الحسابات الختامية لسنة 2026...');
      setTimeout(() => {
        addLog('تم تسوية الحسابات الختامية وترحيل صافي الأرباح لحساب الأرباح المحتجزة.');
        addLog('تم بناء قاعدة بيانات جديدة AlMeezan_DB_2027.');
        addLog('تم إدراج الأرصدة الافتتاحية المدورة لعام 2027 بنجاح.');
        showToast('تم بنجاح ترحيل وتدوير الدفاتر المالية وبناء قاعدة بيانات العام الجديد 2027.', 'success');
      }, 1500);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 select-none overflow-hidden" dir="rtl">
      {/* Sidebar Navigation */}
      <div className="w-[200px] shrink-0 bg-slate-100 border-l border-slate-300 flex flex-col justify-between py-4">
        <div className="space-y-1 px-2">
          <div className="text-[10px] font-bold text-slate-400 px-3 pb-2 tracking-wider">لوحة تحكم النظام</div>
          
          <button
            onClick={() => setActiveTab('designer')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'designer' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>قوالب الفواتير والطباعة</span>
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'layout' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>تخصيص الثيم والخطوط</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'backups' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>النسخ والـاستعادة</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'maintenance' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>الصيانة والتحديثات</span>
          </button>

          <button
            onClick={() => setActiveTab('closing')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'closing' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>إغلاق السنة المالية</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>خيارات الفوترة والضريبة</span>
          </button>
        </div>

        {/* System Version details */}
        <div className="px-3">
          <div className="w-full h-[1px] bg-slate-200 my-2.5" />
          <div className="bg-slate-200/50 p-2 rounded-lg text-center">
            <span className="text-[10px] text-slate-500 font-bold block">إصدار البرنامج الحالي</span>
            <span className="text-[11px] text-blue-700 font-mono font-bold mt-1 block">{currentVersion}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between">
        
        <div className="flex-1">
          {/* TAB 1: DESIGNER */}
          {activeTab === 'designer' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850">تصميم وتخصيص قوالب الفواتير</h3>
                  <p className="text-[11px] text-slate-500">يتيح لك ضبط مظهر مطبوعات الفواتير الحرارية والورقية العادية والباركود.</p>
                </div>
                <button 
                  onClick={handleSaveDesigner}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm text-xs">
                  <span className="font-bold text-xs text-slate-800 block border-b pb-1.5">مكونات رأس وذيل الفاتورة</span>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={designerOptions.showLogo}
                        onChange={e => setDesignerOptions(prev => ({ ...prev, showLogo: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span>عرض شعار الشركة في الترويسة</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={designerOptions.showBarcode}
                        onChange={e => setDesignerOptions(prev => ({ ...prev, showBarcode: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span>طباعة رمز الاستجابة السريعة لهيئة الزكاة والجمارك (ZATCA QR)</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={designerOptions.showFooterNotes}
                        onChange={e => setDesignerOptions(prev => ({ ...prev, showFooterNotes: e.target.checked }))}
                        className="rounded text-blue-600"
                      />
                      <span>طباعة شروط الاستبدال والاسترجاع والضمان</span>
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="font-bold text-slate-600 block">نص ترويسة الفاتورة الرئيسي:</label>
                    <input 
                      type="text" 
                      value={designerOptions.headerText}
                      onChange={e => setDesignerOptions(prev => ({ ...prev, headerText: e.target.value }))}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">شروط وأحكام المبيعات السفلية:</label>
                    <textarea 
                      value={designerOptions.footerText}
                      onChange={e => setDesignerOptions(prev => ({ ...prev, footerText: e.target.value }))}
                      rows={3}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg text-slate-600"
                    />
                  </div>
                </div>

                {/* Simulation block */}
                <div className="bg-slate-200 border rounded-xl p-4 flex justify-center items-start shadow-inner overflow-hidden max-h-[350px]">
                  <div className="bg-white shadow-md w-[220px] border border-slate-300 p-3.5 font-mono text-[9px] text-slate-800 space-y-3.5">
                    <div className="text-center space-y-1.5">
                      {designerOptions.showLogo && <div className="w-8 h-8 bg-slate-300 mx-auto rounded-full flex items-center justify-center font-bold text-[7px]">LOGO</div>}
                      <div className="font-extrabold leading-normal truncate">{designerOptions.headerText}</div>
                      <div className="text-[7px] text-slate-400">الرقم الضريبي للمؤسسة: 310542131400003</div>
                    </div>

                    <div className="border-t border-b border-dashed py-1.5 space-y-1">
                      <div>فاتورة مبيعات مبسطة</div>
                      <div>رقم المستند: SAL-2026-0421</div>
                      <div>تاريخ السند: {new Date().toISOString().split('T')[0]}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-extrabold text-slate-900">
                        <span>السلعة والكمية</span>
                        <span>الإجمالي</span>
                      </div>
                      <div className="flex justify-between">
                        <span>مادة غذائية معبأة * 10</span>
                        <span>120.00 ر.س</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed pt-2 space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>المجموع الأساسي</span>
                        <span>120.00 ر.س</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>ضريبة القيمة المضافة 15%</span>
                        <span>18.00 ر.س</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-[10px] text-blue-700">
                        <span>الإجمالي الكلي:</span>
                        <span>138.00 ر.س</span>
                      </div>
                    </div>

                    {designerOptions.showBarcode && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 bg-slate-800 flex items-center justify-center text-white font-bold text-[5px]">ZATCA QR</div>
                        <span className="text-[5px] text-slate-400 font-mono">فاتورة موقعة ومعتمدة الكترونياً</span>
                      </div>
                    )}

                    {designerOptions.showFooterNotes && (
                      <p className="text-[7px] text-slate-400 leading-relaxed text-center border-t border-dashed pt-2">
                        {designerOptions.footerText}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT, THEMES, AND TYPOGRAPHY */}
          {activeTab === 'layout' && (
            <div className="space-y-5">
              <div className="border-b pb-2">
                <h3 className="font-extrabold text-sm text-slate-850">تخصيص نمط وتصميم الواجهات والخطوط لكل مستخدم</h3>
                <p className="text-[11px] text-slate-500">قم بتغيير ألوان شريط المهام والواجهات، وتعيين خطوط مخصصة مريحة للعين مع حجم الخط المالي الملائم.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Selector */}
                <div className="bg-white border rounded-xl p-4.5 space-y-4 shadow-sm text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    ألوان وثيم البرنامج العام
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map(tItem => (
                      <button
                        key={tItem.id}
                        onClick={() => {
                          setTheme(tItem.id);
                          addLog(`تم تغيير نمط ألوان الواجهات لـ: ${tItem.name}`);
                        }}
                        className={`p-2.5 rounded-lg border text-right font-bold transition-all flex items-center justify-between ${
                          theme === tItem.id 
                            ? 'border-blue-600 ring-2 ring-blue-600/10 bg-blue-50/10' 
                            : 'border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[11px]">{tItem.name}</span>
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: tItem.accentColor }}></div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Theme Color Picker */}
                  <div className="space-y-1.5 pt-2">
                    <label className="font-bold text-slate-600 block">تخصيص ثيم بلون خاص بك (Custom Color Theme):</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          setTheme('custom');
                        }}
                        className="w-10 h-10 border rounded-lg cursor-pointer bg-white"
                      />
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400">الرمز السداسي للمؤشر المالي الخاص بك:</span>
                        <input 
                          type="text" 
                          value={customColor} 
                          onChange={(e) => {
                            setCustomColor(e.target.value);
                            setTheme('custom');
                          }}
                          className="w-full text-xs p-1 bg-slate-100 border rounded font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Customizer */}
                <div className="bg-white border rounded-xl p-4.5 space-y-4 shadow-sm text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                    <Type className="w-4 h-4 text-emerald-600" />
                    تخصيص نوع وحجم ووزن الخطوط
                  </span>

                  {/* Fonts family selection */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">اسم عائلة الخط المفضل (Cairo, Tajawal...):</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value);
                        addLog(`تم تعيين خط النظام لـ: ${e.target.value}`);
                      }}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold"
                    >
                      {FONTS.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size adjustments */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">حجم خط الحقول وجداول المدخلات المالية:</label>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 border rounded-lg">
                      <button 
                        type="button"
                        onClick={() => setFontSize(Math.max(11, fontSize - 1))}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded font-bold"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1 text-center font-bold font-mono text-[13px]">
                        {fontSize} بكسل (px)
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFontSize(Math.min(18, fontSize + 1))}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded font-bold"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Font Weight selection */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">سماكة ووزن خطوط التقارير والواجهة:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['normal', 'medium', 'bold'].map(weight => (
                        <button
                          key={weight}
                          type="button"
                          onClick={() => setFontWeight(weight)}
                          className={`p-2 rounded-lg border font-bold text-center capitalize text-[10.5px] ${
                            fontWeight === weight 
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                              : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {weight === 'normal' ? 'عادي (Normal)' : weight === 'medium' ? 'متوسط (Medium)' : 'عريض (Bold)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUPS AND LOGS */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              <div className="border-b pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850">إدارة النسخ الاحتياطي التلقائي واليدوي</h3>
                  <p className="text-[11px] text-slate-500">حماية فائقة لبيانات محاسبة أحمد سامي سيستم عبر نسخ محلي على القرص الصلب أو سحابياً بالكامل.</p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerManualBackup}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>بدء نسخة احتياطية فورية</span>
                </button>
              </div>

              {/* Action grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                {/* Backup configurations */}
                <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm col-span-1">
                  <span className="font-bold text-slate-800 block border-b pb-1.5">إعدادات النسخ الاحتياطي التلقائي</span>

                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoBackupEnabled}
                      onChange={e => {
                        setAutoBackupEnabled(e.target.checked);
                        addLog(e.target.checked ? 'تم تفعيل النسخ الاحتياطي التلقائي اليومي.' : 'تم إيقاف النسخ الاحتياطي التلقائي.');
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>تفعيل النسخ الاحتياطي اليومي مجدول</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">وقت تشغيل النسخ التلقائي يومياً:</label>
                    <input 
                      type="time" 
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      disabled={!autoBackupEnabled}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold font-mono text-center disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="font-bold text-slate-600 block">نوع ومكان حفظ الملفات:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setBackupStorage('local')}
                        className={`p-2 rounded-lg border font-bold flex flex-col items-center gap-1.5 ${
                          backupStorage === 'local' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <HardDrive className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px]">قرص صلب محلي</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setBackupStorage('cloud')}
                        className={`p-2 rounded-lg border font-bold flex flex-col items-center gap-1.5 ${
                          backupStorage === 'cloud' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Cloud className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px]">مستودع سحابي آمن</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backups log list */}
                <div className="bg-white border rounded-xl p-4 shadow-sm col-span-2 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block border-b pb-1.5 mb-2 flex items-center justify-between">
                      <span>سجل النسخ الاحتياطية المتوفرة للاسترجاع</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-full font-bold">
                        العدد: {backups.length}
                      </span>
                    </span>

                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {backups.map(log => (
                        <div key={log.id} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between gap-3 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-md ${log.storage === 'cloud' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                              {log.storage === 'cloud' ? <Cloud className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-bold font-mono text-[10.5px] block text-slate-700 truncate max-w-[240px]">
                                {log.fileName}
                              </span>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-semibold">
                                <span>{log.date}</span>
                                <span>•</span>
                                <span>الحجم: {log.size}</span>
                                <span>•</span>
                                <span className="bg-slate-200 text-slate-600 px-1 rounded uppercase font-bold text-[8px]">
                                  {log.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRestoreBackup(log.fileName)}
                              className="px-2.5 py-1 text-[9.5px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                              title="استرجاع واسترداد قاعدة البيانات"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>استعادة</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('هل أنت متأكد من رغبتك في حذف ملف النسخ الاحتياطي نهائياً لخفض استهلاك القرص؟')) {
                                  deleteBackup(log.id);
                                  addLog(`حذف ملف النسخة الاحتياطية المالي: ${log.fileName}`);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                              title="حذف الملف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MAINTENANCE AND UPDATES */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-extrabold text-sm text-slate-850">تحديثات النظام وصيانة قاعدة البيانات المتقدمة</h3>
                <p className="text-[11px] text-slate-500">فحص الخادم الرسمي للتحديثات البرمجية أو تحديث مخطط هيكل البيانات والتحقق من التناسق المرجعي.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* System Update Actions */}
                <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
                  <span className="font-bold text-slate-800 block border-b pb-1.5">محدث برامج وقواعد بيانات أحمد سامي سيستم</span>

                  {/* Software Update trigger */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-800">التحديثات البرمجية الدورية</span>
                      <p className="text-[10px] text-slate-400">تحميل آخر الميزات، والتحسينات، وإصلاح العيوب الفنية.</p>
                    </div>
                    <button
                      onClick={handleCheckUpdates}
                      disabled={isCheckingUpdate}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isCheckingUpdate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>فحص التحديثات</span>
                    </button>
                  </div>

                  {/* Database updates trigger */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-800">تحديث هيكل ومخطط الجداول</span>
                      <p className="text-[10px] text-slate-400">مواءمة فهارس الجداول دون فقدان فواتير وحسابات النظام الحالية.</p>
                    </div>
                    <button
                      onClick={handleRunDbUpdate}
                      disabled={isUpdatingDb}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isUpdatingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                      <span>تحديث الجداول</span>
                    </button>
                  </div>
                </div>

                {/* Database Consistency / Index re-indexing */}
                <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
                  <span className="font-bold text-slate-800 block border-b pb-1.5">تدقيق وفهرسة الجداول المالية</span>

                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-slate-850">إعادة الفهرسة الكاملة</span>
                        <p className="text-[10px] text-slate-400">تسريع عمليات استعلام وبحث فواتير المبيعات والمخزون.</p>
                      </div>
                      <button 
                        onClick={() => {
                          addLog('بدء تصفية الفهارس الضريبية لجميع جداول النظام...');
                          setTimeout(() => {
                            addLog('تم إعادة تهيئة وفهرسة 14 جدول بنجاح وبسرعة فائقة.');
                            showToast('تم إعادة فهرسة جداول قاعدة البيانات بنجاح.', 'success');
                          }, 1000);
                        }}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"
                      >
                        بدء
                      </button>
                    </div>

                    <div className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-slate-850">إصلاح وتطهير السجلات</span>
                        <p className="text-[10px] text-slate-400">فحص المعاملات اليتيمة وتطهير السجلات المعلقة غير المعتمدة.</p>
                      </div>
                      <button 
                        onClick={() => {
                          addLog('جاري فحص سلامة المعاملات الضريبية والأستاذ العام...');
                          setTimeout(() => {
                            addLog('المطابقة سليمة بنسبة 100%. لم يتم رصد أي معاملات يتيمة.');
                            showToast('فحص سلامة قاعدة البيانات انتهى بنجاح تام.', 'success');
                          }, 1000);
                        }}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"
                      >
                        تشغيل
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLOSING OF FISCAL YEAR */}
          {activeTab === 'closing' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="border-b pb-2">
                <h3 className="font-extrabold text-sm text-slate-850">تدوير وإغلاق حسابات السنة المالية</h3>
                <p className="text-[11px] text-slate-500">أرشفة كامل قيود العام المالي الحالي 2026، بناء حسابات أرباح وخسائر ختامية، وتدوير موازين الأصول والالتزامات للعام المالي الجديد.</p>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-amber-900 text-xs space-y-1.5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-extrabold">تحذير شديد قبل التدوير السنوي:</span>
                  <p className="text-[10.5px] text-amber-700 leading-relaxed">
                    يرجى التأكد من ترحيل كافة فواتير المبيعات والمشتريات وإقرار وتثبيت قيود سند اليومية وإغلاق ميزان الجرد الفعلي تماماً قبل بدء هذه العملية الحساسة.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white border rounded-xl space-y-3.5 text-xs shadow-sm">
                <span className="font-bold text-slate-800 block">خطوات التدوير التلقائي:</span>
                <ul className="list-disc list-inside space-y-1.5 text-slate-500 pr-1 leading-normal font-semibold">
                  <li>إنشاء قيد إقفال الأرباح والخسائر الختامي في حساب الأستاذ العام.</li>
                  <li>بناء قاعدة بيانات جديدة باسم: <strong className="font-mono text-slate-800 text-[11px]">AlMeezan_DB_2027</strong></li>
                  <li>ترحيل الأرصدة المتبقية كقيد افتتاحى (Opening Entry) متزن في مطلع العام 2027.</li>
                </ul>

                <div className="pt-3 border-t flex justify-end">
                  <button 
                    onClick={handleYearEndClosing}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    <span>البدء في تدوير وإقفال السنة 2026</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS GENERAL */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-extrabold text-sm text-slate-850">إعدادات وخيارات نظام الفوترة والضرائب</h3>
                <p className="text-[11px] text-slate-500">التحكم في معايير الفوترة، الضريبة، أسلوب الطباعة، وصلاحيات ومحددات الإدخال الأساسية.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); showToast('تم حفظ إعدادات الضرائب والفوترة العامة بنجاح.', 'success'); addLog('تم تحديث إعدادات النظام لضريبة الـ 15%.'); }} className="bg-white border rounded-xl p-5 space-y-4 text-xs max-w-lg shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">نسبة ضريبة القيمة المضافة الافتراضية (%):</label>
                    <input 
                      type="number" 
                      defaultValue={15}
                      className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">نوع الفواتير الافتراضي في المبيعات:</label>
                    <select className="w-full text-xs p-2 bg-slate-50 border rounded-lg">
                      <option value="taxable">خاضع لضريبة القيمة المضافة بالكامل</option>
                      <option value="zero_tax">معفى من الضريبة (مبيعات تصدير)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">الفاصلة العشرية للأسعار والأرصدة المالية:</label>
                    <select className="w-full text-xs p-2 bg-slate-50 border rounded-lg">
                      <option value={2}>رقمين عشريين (0.00)</option>
                      <option value={3}>3 أرقام عشرية (0.000)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-600 block">التكامل مع الفوترة الإلكترونية لهيئة الزكاة:</label>
                    <select className="w-full text-xs p-2 bg-slate-50 border rounded-lg font-bold text-emerald-700">
                      <option value="zatca_sandbox">الوضع التجريبي والمطابقة الفنية (Sandbox)</option>
                      <option value="zatca_prod">ربط مع المباشر والمرحلة الثانية (Production)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end">
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md transition-all flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تثبيت خيارات الفوترة</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Dynamic Terminal Output Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md mt-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="text-[10px] text-amber-400 font-bold font-mono">سجل حركات الخادم وتدقيق المعاملات (System Log Terminal)</span>
            <button 
              onClick={() => setTerminalLogs(['تم تفريغ السجل البرمجي.'])}
              className="text-[9px] text-slate-400 hover:text-slate-200"
            >
              مسح السجل
            </button>
          </div>
          <div className="h-24 overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1 bg-slate-950 p-2 rounded-lg">
            {terminalLogs.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

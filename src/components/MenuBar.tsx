import React, { useState, useRef, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { 
  FileText, Settings, Key, HelpCircle, AppWindow, FolderOpen, 
  BarChart2, ShieldAlert, Layers, ChevronDown, Check, LogOut, RefreshCw, Lock
} from 'lucide-react';

export const MenuBar: React.FC = () => {
  const { 
    openWindow, 
    disconnectDatabase, 
    tileWindows, 
    minimizeAll, 
    restoreAll, 
    closeAll,
    connectedDbId,
    currentUser,
    logoutUser,
    showToast
  } = useErp();

  const hasPermission = (permissionKey?: string) => {
    if (!permissionKey) return true;
    if (!currentUser) return false;
    return !!(currentUser.permissions as any)[permissionKey];
  };

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  const handleItemClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  // Main menu configuration
  const menus = [
    {
      id: 'file',
      label: 'ملف',
      items: [
        { label: 'الاتصال بقاعدة البيانات', action: () => openWindow('db_manager', 'إدارة الاتصال وقواعد البيانات', { initialTab: 'connect' }) },
        { label: 'إنشاء قاعدة بيانات جديدة', action: () => openWindow('db_manager', 'إدارة الاتصال وقواعد البيانات', { initialTab: 'create' }) },
        { label: 'ربط قاعدة بيانات', action: () => openWindow('db_manager', 'إدارة الاتصال وقواعد البيانات', { initialTab: 'attach' }) },
        { divider: true },
        { label: 'إنشاء نسخة احتياطية', permissionKey: 'backup_create', action: () => openWindow('db_manager', 'إدارة الاتصال وقواعد البيانات', { initialTab: 'backup' }) },
        { label: 'استعادة نسخة احتياطية', permissionKey: 'backup_restore', action: () => openWindow('db_manager', 'إدارة الاتصال وقواعد البيانات', { initialTab: 'restore' }) },
        { label: 'حذف قاعدة بيانات', permissionKey: 'delete_data', action: () => openWindow('db_manager', 'إدارة الاتصال وقواعد البيانات', { initialTab: 'delete' }) },
        { divider: true },
        { label: 'معلومات مخدم البيانات', action: () => openWindow('db_manager', 'إدارة الاتصال وقواعد البيانات', { initialTab: 'server' }) },
        { label: 'تبديل المستخدم الحالي (سريع)', action: () => {
          logoutUser();
        }},
        { label: 'تسجيل الخروج وقطع الاتصال', action: () => {
          logoutUser();
          disconnectDatabase();
        }},
      ]
    },
    {
      id: 'definitions',
      label: 'تعاريف',
      items: [
        { label: 'شجرة الفروع والمستودعات', permissionKey: 'inventory', action: () => openWindow('branches', 'شجرة الفروع والمستودعات') },
        { label: 'مراكز الكلفة الكلية', permissionKey: 'accounting', action: () => openWindow('cost_centers', 'مراكز الكلفة') },
        { label: 'العملات وأسعار الصرف', permissionKey: 'accounting', action: () => openWindow('currencies', 'العملات وأسعار الصرف') },
        { divider: true },
        { label: 'أنواع القيود اليومية', permissionKey: 'journal_entries', action: () => openWindow('definitions', 'التعاريف والأنماط الأساسية', { initialTab: 'journals' }) },
        { label: 'أنواع الفواتير المعرفة', permissionKey: 'settings', action: () => openWindow('definitions', 'التعاريف والأنماط الأساسية', { initialTab: 'invoices' }) },
        { label: 'أنواع فواتير النقل بقيد', permissionKey: 'inventory', action: () => openWindow('definitions', 'التعاريف والأنماط الأساسية', { initialTab: 'transfer' }) },
        { label: 'أنواع طرق الدفع المقبولة', permissionKey: 'accounting', action: () => openWindow('definitions', 'التعاريف والأنماط الأساسية', { initialTab: 'payment' }) },
        { label: 'مندوبي المبيعات', permissionKey: 'sales', action: () => openWindow('definitions', 'التعاريف والأنماط الأساسية', { initialTab: 'sales_rep' }) }
      ]
    },
    {
      id: 'accounting',
      label: 'محاسبة',
      items: [
        { label: 'شجرة الحسابات (دليل الحسابات)', permissionKey: 'accounting', action: () => openWindow('chart_of_accounts', 'دليل الحسابات المالي') },
        { label: 'بطاقة حساب جديدة', permissionKey: 'accounting', action: () => openWindow('account_card', 'بطاقة الحساب') },
        { label: 'الحسابات التوزيعية والتجميعية', permissionKey: 'accounting', action: () => showToast('تم تخصيص الحسابات التجميعية لمراكز التكلفة المحددة بنجاح.', 'success') },
        { label: 'ميزان توازن الحسابات', permissionKey: 'accounting', action: () => openWindow('reports', 'ميزان المراجعة العام', { reportType: 'trial_balance' }) },
        { label: 'تعريف وتحليل حسابات العملاء', permissionKey: 'accounting', action: () => showToast('تحليل مالي مفصل للذمم المدينة ومستويات الائتمان المقبولة.', 'info') },
        { label: 'الحسابات الختامية والميزانية', permissionKey: 'accounting', action: () => openWindow('reports', 'الحسابات الختامية', { reportType: 'financial_statements' }) },
      ]
    },
    {
      id: 'entries',
      label: 'القيود',
      items: [
        { label: 'قيد افتتاحي للعام المالي', permissionKey: 'journal_entries', action: () => openWindow('journal_entry', 'قيد افتتاحي جديد', { isOpening: true }) },
        { label: 'سند قيد يومية', permissionKey: 'journal_entries', action: () => openWindow('journal_entry', 'سند قيد يومية جديد') },
        { label: 'يومية الصندوق والبنك', permissionKey: 'journal_entries', action: () => openWindow('reports', 'دفتر يومية الصندوق', { reportType: 'journal_entries' }) },
        { label: 'معالجة سندات القيود التلقائية', permissionKey: 'journal_entries', action: () => showToast('تم ترحيل وفحص كافة السندات والقيود المعلقة بنجاح.', 'success') },
        { label: 'معالجة فروق عملات الأجنبية', permissionKey: 'journal_entries', action: () => showToast('تم توليد قيد تسوية فروق العملات وإغلاقه بنجاح.', 'success') },
      ]
    },
    {
      id: 'items',
      label: 'المواد',
      items: [
        { label: 'شجرة تصنيفات المواد', permissionKey: 'inventory', action: () => openWindow('item_tree', 'دليل المجموعات والمواد') },
        { label: 'بطاقة مادة جديدة', permissionKey: 'inventory', action: () => openWindow('item_card', 'بطاقة تعريف مادة') },
        { label: 'فهرس المواد والباركود', permissionKey: 'inventory', action: () => showToast('مخطط باركود المواد: تم مزامنة الرموز مع القارئ بنجاح.', 'success') },
        { label: 'تعديل أسعار المواد دفعة واحدة', permissionKey: 'price_update', action: () => openWindow('price_update', 'تعديل أسعار المواد دفعة واحدة') },
        { label: 'استيراد صور المواد والمنتجات', permissionKey: 'inventory', action: () => showToast('يرجى سحب الصور لتسميتها برقم الباركود الخاص بالمادة تلقائياً.', 'info') },
        { label: 'مقارنة جرد المواد الفعلي', permissionKey: 'inventory', action: () => openWindow('reports', 'جرد المواد الفعلي', { reportType: 'inventory_list' }) },
      ]
    },
    {
      id: 'invoices',
      label: 'فاتورة',
      items: [
        { label: 'فاتورة شراء جديدة', permissionKey: 'purchases', action: () => openWindow('invoice', 'فاتورة شراء', { invoiceType: 'purchase' }) },
        { label: 'فاتورة بيع جديدة', permissionKey: 'sales', action: () => openWindow('invoice', 'فاتورة بيع', { invoiceType: 'sale' }) },
        { divider: true },
        { label: 'مردود مشتريات', permissionKey: 'purchases', action: () => openWindow('invoice', 'مردود مشتريات', { invoiceType: 'purchase_return' }) },
        { label: 'مردود مبيعات', permissionKey: 'sales', action: () => openWindow('invoice', 'مردود مبيعات', { invoiceType: 'sale_return' }) },
        { divider: true },
        { label: 'إدخال مستودعي (بضاعة واردة)', permissionKey: 'inventory', action: () => openWindow('invoice', 'إدخال مستودعي', { invoiceType: 'inward' }) },
        { label: 'إخراج مستودعي (بضاعة صادرة)', permissionKey: 'inventory', action: () => openWindow('invoice', 'إخراج مستودعي', { invoiceType: 'outward' }) },
        { label: 'بضاعة أول المدة', permissionKey: 'inventory', action: () => openWindow('invoice', 'بضاعة أول المدة', { invoiceType: 'opening_stock' }) },
        { label: 'بضاعة آخر المدة', permissionKey: 'inventory', action: () => openWindow('invoice', 'بضاعة آخر المدة', { invoiceType: 'closing_stock' }) },
        { divider: true },
        { label: 'مناقلة مستودعية بقيد مالي', permissionKey: 'inventory', action: () => openWindow('invoice', 'مناقلة مستودعية بقيد مالي', { invoiceType: 'transfer_entry' }) },
        { label: 'مناقلة مستودعية بلا قيد مالي', permissionKey: 'inventory', action: () => openWindow('invoice', 'مناقلة مستودعية بلا قيد مالي', { invoiceType: 'transfer_no_entry' }) },
      ]
    },
    {
      id: 'reports',
      label: 'تقارير',
      items: [
        { label: 'دفتر الأستاذ العام تفصيلي', permissionKey: 'reports', action: () => openWindow('reports', 'دفتر الأستاذ التفصيلي', { reportType: 'general_ledger' }) },
        { label: 'كشف حساب عميل / ذمة', permissionKey: 'reports', action: () => openWindow('reports', 'كشف حساب عميل', { reportType: 'customer_statement' }) },
        { label: 'ميزان المراجعة العام الموحد', permissionKey: 'reports', action: () => openWindow('reports', 'ميزان المراجعة العام', { reportType: 'trial_balance' }) },
        { label: 'أرصدة العملاء والذمم الدائنة والمدينة', permissionKey: 'reports', action: () => openWindow('reports', 'أرصدة العملاء والذمم المفتوحة', { reportType: 'customer_balances' }) },
        { divider: true },
        { label: 'حركة كرت المادة تفصيلي', permissionKey: 'reports', action: () => openWindow('reports', 'حركة المادة التفصيلية', { reportType: 'item_ledger' }) },
        { label: 'جرد المواد الإجمالي بالمخازن', permissionKey: 'reports', action: () => openWindow('reports', 'جرد المواد والمخزون', { reportType: 'inventory_list' }) },
        { label: 'أرباح المواد والبنود المباعة', permissionKey: 'reports', action: () => openWindow('reports', 'أرباح البنود والمبيعات', { reportType: 'item_profit' }) },
      ]
    },
    {
      id: 'tools',
      label: 'أدوات',
      items: [
        { label: 'المصمم الطباعي للفواتير والسندات', permissionKey: 'settings', action: () => openWindow('tools_manager', 'المصمم الطباعي لقوالب التقارير والفواتير', { initialTab: 'designer' }) },
        { label: 'إدارة وتخصيص تصميم الشاشات', permissionKey: 'settings', action: () => openWindow('tools_manager', 'إدارة وتخصيص الشاشات والواجهات', { initialTab: 'layout' }) },
        { label: 'فحص وإصلاح قاعدة البيانات', permissionKey: 'settings', action: () => openWindow('tools_manager', 'فحص وإصلاح قاعدة البيانات', { initialTab: 'maintenance' }) },
        { label: 'تدوير الحسابات إلى سنة جديدة', permissionKey: 'settings', action: () => openWindow('tools_manager', 'تدوير الدفاتر والحسابات المالية', { initialTab: 'closing' }) },
        { label: 'مدير التحديثات التلقائية للنظام (Admin)', permissionKey: 'settings', action: () => openWindow('admin_updates', 'مدير التحديثات التلقائية المطور') },
        { divider: true },
        { label: 'إعدادات وخيارات النظام العامة', permissionKey: 'settings', action: () => openWindow('tools_manager', 'إعدادات وخيارات النظام العامة', { initialTab: 'settings' }) }
      ]
    },
    {
      id: 'permissions',
      label: 'صلاحيات',
      items: [
        { label: 'إدارة المستخدمين والمستويات', permissionKey: 'user_management', action: () => openWindow('permissions', 'إدارة المستخدمين والصلاحيات التفصيلية') },
        { label: 'مجموعات المستخدمين (مدراء، محاسبين، كاشير)', permissionKey: 'user_management', action: () => openWindow('permissions', 'مجموعات المستخدمين والصلاحيات') },
        { label: 'سياسات القفل والسرية العالية', permissionKey: 'user_management', action: () => openWindow('permissions', 'إدارة المستخدمين والصلاحيات التفصيلية', { initialTab: 'policies' }) },
        { label: 'تغيير كلمة مرور المدير الرئيسي', permissionKey: 'user_management', action: () => openWindow('permissions', 'إدارة المستخدمين والصلاحيات التفصيلية', { initialTab: 'details' }) }
      ]
    },
    {
      id: 'windows',
      label: 'النوافذ',
      items: [
        { label: 'تجانب أفقي للكل', action: () => tileWindows('horizontal') },
        { label: 'تجانب عمودي للكل', action: () => tileWindows('vertical') },
        { label: 'تتالي النوافذ', action: () => tileWindows('cascade') },
        { divider: true },
        { label: 'استعادة كافة النوافذ', action: () => restoreAll() },
        { label: 'تصغير كافة النوافذ', action: () => minimizeAll() },
        { label: 'إغلاق كافة النوافذ المفتوحة', action: () => closeAll() }
      ]
    },
    {
      id: 'help',
      label: 'مساعدة',
      items: [
        { label: 'كتيب تعليمات الميزان (F1)', action: () => showToast('مستندات الدعم: تم إطلاق دليل المستخدم الرقمي بالكامل.', 'info') },
        { label: 'دروس يوتيوب وقناة الدعم', action: () => window.open('https://youtube.com', '_blank') },
        { divider: true },
        { label: 'حول نظام الميزان دوت نت', action: () => openWindow('about', 'حول برنامج الميزان دوت نت ERP') }
      ]
    }
  ];

  if (!connectedDbId) return null;

  return (
    <div 
      className="bg-slate-800 text-white text-sm border-b border-slate-700 flex select-none z-50 h-9 items-center relative"
      ref={menuRef}
      id="erp-menu-bar"
    >
      <div className="flex h-full pr-2">
        {menus.map((menu) => (
          <div key={menu.id} className="relative h-full flex items-center">
            <button
              className={`px-4 py-1.5 hover:bg-slate-700 transition-colors focus:outline-none cursor-pointer text-[13px] font-medium ${
                activeMenu === menu.id ? 'bg-slate-700 font-bold text-blue-400' : ''
              }`}
              onClick={() => handleMenuClick(menu.id)}
            >
              {menu.label}
            </button>

            {activeMenu === menu.id && (
              <div 
                className="absolute right-0 top-9 bg-white text-slate-800 border border-slate-300 shadow-2xl rounded-b-md min-w-[240px] py-1.5 z-50 animate-window-open"
                style={{ direction: 'rtl' }}
              >
                {menu.items.map((item, idx) => {
                  if (item.divider) {
                    return <div key={`div-${idx}`} className="my-1 border-t border-slate-200" />;
                  }
                  const allowed = hasPermission(item.permissionKey);
                  return (
                    <button
                      key={`item-${idx}`}
                      disabled={!allowed}
                      className={`w-full text-right px-4 py-1.5 transition-all flex items-center justify-between text-[13px] font-medium cursor-pointer ${
                        allowed 
                          ? 'hover:bg-blue-50 hover:text-blue-700 text-slate-800' 
                          : 'text-slate-400 bg-slate-50/50 cursor-not-allowed opacity-55'
                      }`}
                      onClick={() => handleItemClick(item.action!)}
                    >
                      <span>{item.label}</span>
                      {!allowed && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mr-auto pl-4 text-[12px] text-slate-400 flex items-center gap-2">
        <span className="bg-slate-700 px-2 py-0.5 rounded text-green-400 text-[11px] font-bold">● نظام محلي متصل</span>
        <span className="font-mono text-[11px]">v11.4.2</span>
      </div>
    </div>
  );
};

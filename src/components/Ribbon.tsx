import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { 
  User, BookOpen, FileSpreadsheet, Package, Layers, TrendingUp, 
  UserCheck, Shield, FileText, LayoutGrid, Calendar, HelpCircle, 
  DollarSign, BarChart3, PlusCircle, ShoppingCart, Percent, Settings2, Lock, Sparkles
} from 'lucide-react';

export const Ribbon: React.FC = () => {
  const { openWindow, connectedDbId, currentUser, showToast } = useErp();
  const [activeTab, setActiveTab] = useState<'accounting' | 'inventory' | 'sales' | 'system'>('accounting');

  const hasPermission = (permissionKey?: string) => {
    if (!permissionKey) return true;
    if (!currentUser) return false;
    return !!(currentUser.permissions as any)[permissionKey];
  };

  if (!connectedDbId) return null;

  return (
    <div className="bg-slate-50 border-b border-slate-300 shadow-sm flex flex-col select-none z-40" id="erp-ribbon">
      {/* Ribbon Tabs Header */}
      <div className="flex bg-slate-200 border-b border-slate-300 pr-2 pt-1 gap-1">
        <button
          onClick={() => setActiveTab('accounting')}
          className={`px-5 py-1.5 text-[13px] font-bold rounded-t-md transition-all border-x border-t cursor-pointer ${
            activeTab === 'accounting'
              ? 'bg-slate-50 border-slate-300 text-blue-700 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]'
              : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-300 hover:text-slate-800'
          }`}
        >
          المحاسبة والقيود
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-1.5 text-[13px] font-bold rounded-t-md transition-all border-x border-t cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-slate-50 border-slate-300 text-blue-700 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]'
              : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-300 hover:text-slate-800'
          }`}
        >
          بطاقات ومخازن المواد
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-1.5 text-[13px] font-bold rounded-t-md transition-all border-x border-t cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-slate-50 border-slate-300 text-blue-700 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]'
              : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-300 hover:text-slate-800'
          }`}
        >
          حركة الفواتير والمبيعات
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-5 py-1.5 text-[13px] font-bold rounded-t-md transition-all border-x border-t cursor-pointer ${
            activeTab === 'system'
              ? 'bg-slate-50 border-slate-300 text-blue-700 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]'
              : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-300 hover:text-slate-800'
          }`}
        >
          أدوات النظام والصلاحيات
        </button>
      </div>

      {/* Ribbon Panels */}
      <div className="p-2.5 flex items-center gap-2 overflow-x-auto min-h-[92px] bg-slate-50">
        
        {/* ACCOUNTING PANEL */}
        {activeTab === 'accounting' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => openWindow('account_card', 'بطاقة الحساب')}
              disabled={!hasPermission('accounting')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('accounting')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <PlusCircle className="w-5 h-5" />
                {!hasPermission('accounting') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">بطاقة حساب</span>
            </button>

            <button
              onClick={() => openWindow('chart_of_accounts', 'دليل الحسابات المالي')}
              disabled={!hasPermission('accounting')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('accounting')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <BookOpen className="w-5 h-5" />
                {!hasPermission('accounting') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">الحسابات</span>
            </button>

            <button
              onClick={() => openWindow('journal_entry', 'سند قيد يومية جديد')}
              disabled={!hasPermission('journal_entries')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('journal_entries')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-amber-100 text-amber-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <FileText className="w-5 h-5" />
                {!hasPermission('journal_entries') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">سند القيد</span>
            </button>

            <div className="w-[1px] h-12 bg-slate-200 self-center mx-2" />

            <button
              onClick={() => openWindow('reports', 'دفتر الأستاذ التفصيلي', { reportType: 'general_ledger' })}
              disabled={!hasPermission('reports')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('reports')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-sky-100 text-sky-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <FileSpreadsheet className="w-5 h-5" />
                {!hasPermission('reports') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">دفتر الأستاذ</span>
            </button>

            <button
              onClick={() => openWindow('reports', 'كشف حساب عميل', { reportType: 'customer_statement' })}
              disabled={!hasPermission('reports')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('reports')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <User className="w-5 h-5" />
                {!hasPermission('reports') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">كشف العميل</span>
            </button>

            <button
              onClick={() => openWindow('reports', 'ميزان المراجعة العام', { reportType: 'trial_balance' })}
              disabled={!hasPermission('reports')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('reports')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-violet-100 text-violet-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <BarChart3 className="w-5 h-5" />
                {!hasPermission('reports') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">ميزان المراجعة</span>
            </button>
          </div>
        )}

        {/* INVENTORY PANEL */}
        {activeTab === 'inventory' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => openWindow('item_card', 'بطاقة تعريف مادة')}
              disabled={!hasPermission('inventory')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('inventory')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-amber-100 text-amber-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <PlusCircle className="w-5 h-5" />
                {!hasPermission('inventory') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">كرت مادة</span>
            </button>

            <button
              onClick={() => openWindow('item_tree', 'دليل المجموعات والمواد')}
              disabled={!hasPermission('inventory')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('inventory')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <Package className="w-5 h-5" />
                {!hasPermission('inventory') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">المواد</span>
            </button>

            <button
              onClick={() => openWindow('branches', 'شجرة الفروع والمستودعات')}
              disabled={!hasPermission('inventory')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('inventory')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-orange-100 text-orange-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <Layers className="w-5 h-5" />
                {!hasPermission('inventory') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">المستودعات</span>
            </button>

            <div className="w-[1px] h-12 bg-slate-200 self-center mx-2" />

            <button
              onClick={() => openWindow('reports', 'حركة المادة التفصيلية', { reportType: 'item_ledger' })}
              disabled={!hasPermission('reports')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('reports')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <TrendingUp className="w-5 h-5" />
                {!hasPermission('reports') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">حركة مادة</span>
            </button>

            <button
              onClick={() => openWindow('reports', 'جرد المواد والمخزون', { reportType: 'inventory_list' })}
              disabled={!hasPermission('reports')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('reports')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <LayoutGrid className="w-5 h-5" />
                {!hasPermission('reports') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">جرد المواد</span>
            </button>
          </div>
        )}

        {/* SALES & INVOICES PANEL */}
        {activeTab === 'sales' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => openWindow('invoice', 'فاتورة مبيعات', { invoiceType: 'sale' })}
              disabled={!hasPermission('sales')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('sales')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <TrendingUp className="w-5 h-5" />
                {!hasPermission('sales') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">فاتورة بيع</span>
            </button>

            <button
              onClick={() => openWindow('invoice', 'فاتورة شراء', { invoiceType: 'purchase' })}
              disabled={!hasPermission('purchases')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('purchases')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <ShoppingCart className="w-5 h-5" />
                {!hasPermission('purchases') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">فاتورة شراء</span>
            </button>

            <div className="w-[1px] h-12 bg-slate-200 self-center mx-2" />

            <button
              onClick={() => openWindow('invoice', 'مردود مبيعات', { invoiceType: 'sale_return' })}
              disabled={!hasPermission('sales')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('sales')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-rose-100 text-rose-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <Percent className="w-5 h-5" />
                {!hasPermission('sales') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">مرتجع مبيعات</span>
            </button>

            <button
              onClick={() => openWindow('invoice', 'مردود مشتريات', { invoiceType: 'purchase_return' })}
              disabled={!hasPermission('purchases')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('purchases')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-pink-100 text-pink-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <Percent className="w-5 h-5" />
                {!hasPermission('purchases') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">مرتجع مشتريات</span>
            </button>
          </div>
        )}

        {/* SYSTEM PANEL */}
        {activeTab === 'system' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => openWindow('permissions', 'إدارة المستخدمين والصلاحيات التفصيلية')}
              disabled={!hasPermission('user_management')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('user_management')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-red-100 text-red-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <UserCheck className="w-5 h-5" />
                {!hasPermission('user_management') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">إدارة الصلاحيات</span>
            </button>

            <button
              onClick={() => openWindow('currencies', 'العملات وأسعار الصرف')}
              disabled={!hasPermission('accounting')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('accounting')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-violet-100 text-violet-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <DollarSign className="w-5 h-5" />
                {!hasPermission('accounting') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">أسعار الصرف</span>
            </button>

            <button
              onClick={() => openWindow('tools_manager', 'فحص وإصلاح قاعدة البيانات', { initialTab: 'maintenance' })}
              disabled={!hasPermission('settings')}
              className={`flex flex-col items-center justify-center p-1.5 rounded border border-transparent min-w-[70px] group transition-all ${
                hasPermission('settings')
                  ? 'hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg group-hover:scale-105 transition-transform shadow-xs relative">
                <Settings2 className="w-5 h-5" />
                {!hasPermission('settings') && <Lock className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md" />}
              </div>
              <span className="text-[11.5px] font-bold text-slate-700 mt-1">صيانة الداتا</span>
            </button>
          </div>
        )}

        {/* PERSISTENT AI ASSISTANT QUICK LAUNCHER */}
        <div className="flex items-center gap-1.5 border-r pr-3 border-slate-300 mr-auto">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}
            className="flex flex-col items-center justify-center p-1.5 rounded border border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all min-w-[70px] group cursor-pointer shadow-xs animate-pulse"
          >
            <div className="bg-gradient-to-tr from-purple-700 to-indigo-600 text-white p-2 rounded-lg group-hover:scale-105 transition-transform shadow-md relative">
              <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </div>
            <span className="text-[11px] font-extrabold text-purple-800 mt-1">المساعد الذكي</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { 
  Bell, CheckSquare, RefreshCw, X, Minimize2, Maximize2, 
  DollarSign, TrendingUp, AlertTriangle, HelpCircle, ArrowLeftRight,
  ChevronUp, ChevronDown, Package, Users, Receipt, Landmark, Plus, Clock
} from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
}

export const Dashboard: React.FC = () => {
  const { 
    invoices, 
    accounts, 
    items, 
    customers, 
    tasks, 
    setTasks, 
    alerts, 
    setAlerts, 
    openWindow,
    showToast,
    addTask,
    deleteTask
  } = useErp();

  // Widget visibility state
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'general', title: 'المعلومات العامة والملخص', isOpen: true, isMinimized: false },
    { id: 'alerts', title: 'التحذيرات والتنبيهات', isOpen: true, isMinimized: false },
    { id: 'tasks', title: 'قائمة المهام اليومية', isOpen: true, isMinimized: false },
    { id: 'currencies', title: 'أسعار صرف العملات والتحويل', isOpen: true, isMinimized: false },
    { id: 'prayers', title: 'أوقات الصلاة والتقويم', isOpen: true, isMinimized: false },
    { id: 'reminders', title: 'مفكرة التذكير الذاتية', isOpen: true, isMinimized: false },
    { id: 'shortcuts', title: 'الاختصارات والوصول السريع', isOpen: true, isMinimized: false },
    { id: 'items_widget', title: 'حالة المخزون والمواد', isOpen: true, isMinimized: false },
  ]);

  // Task state
  const [newTaskText, setNewTaskText] = useState('');
  
  // Currency Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(100);
  const [calcFrom, setCalcFrom] = useState('SAR');
  const [calcTo, setCalcTo] = useState('USD');
  const [calcResult, setCalcResult] = useState<number>(0);

  // Reminders state
  const [reminders, setReminders] = useState<{ id: string; text: string; time: string }[]>([
    { id: 'rem-1', text: 'حضور اجتماع ترحيل الأرباح والخسائر للربع الثاني', time: '12:30 م' },
    { id: 'rem-2', text: 'التحقق من توازن ميزان المراجعة قبل إرسال التقارير', time: '03:45 م' },
  ]);
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');

  // Prayer times simulation
  const prayerTimes = {
    Fajr: '04:02 ص',
    Sunrise: '05:32 ص',
    Dhuhr: '12:08 م',
    Asr: '03:32 م',
    Maghrib: '06:44 م',
    Isha: '08:14 م'
  };

  // Live timer for prayer time countdown
  const [nextPrayer, setNextPrayer] = useState({ name: 'العصر', time: '03:32 م' });

  useEffect(() => {
    // Perform currency conversions
    const rates: { [key: string]: number } = { SAR: 1.0, USD: 3.75, JOD: 5.29 };
    const amountInBase = calcAmount * (rates[calcFrom] || 1);
    const converted = amountInBase / (rates[calcTo] || 1);
    setCalcResult(Number(converted.toFixed(2)));
  }, [calcAmount, calcFrom, calcTo]);

  // Widget control actions
  const toggleMinimize = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  };

  const closeWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
  };

  const openWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isOpen: true, isMinimized: false } : w));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const nextWidgets = [...widgets];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < widgets.length) {
      const temp = nextWidgets[index];
      nextWidgets[index] = nextWidgets[targetIdx];
      nextWidgets[targetIdx] = temp;
      setWidgets(nextWidgets);
    }
  };

  // Add handlers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskText,
      done: false,
      date: new Date().toISOString().split('T')[0],
    };
    addTask(newTask);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      addTask({ ...task, done: !task.done });
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    const newRem = {
      id: `rem-${Date.now()}`,
      text: newReminderText,
      time: newReminderTime || '05:00 م',
    };
    setReminders(prev => [...prev, newRem]);
    setNewReminderText('');
    setNewReminderTime('');
  };

  // Compute stats
  const totalSalesValue = invoices.filter(i => i.type === 'sale').reduce((acc, inv) => acc + inv.netAmount, 0);
  const totalPurchasesValue = invoices.filter(i => i.type === 'purchase').reduce((acc, inv) => acc + inv.netAmount, 0);
  const totalStockValue = items.reduce((acc, it) => acc + (it.currentStock * it.purchasePrice), 0);
  const totalCustomersCount = customers.filter(c => c.type === 'customer' || c.type === 'both').length;
  const totalSuppliersCount = customers.filter(c => c.type === 'supplier' || c.type === 'both').length;
  
  // Calculate dynamic Vault & Bank Balance
  const vaultAndBankAccounts = accounts.filter(acc => acc.id === 'acc-111001' || acc.id === 'acc-111002');
  const totalVaultValue = vaultAndBankAccounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <div className="w-full h-full p-4 overflow-y-auto space-y-5 bg-slate-50 relative select-none">
      
      {/* 6 Real-time KPI Commercial Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5" id="dashboard-commercial-kpis">
        {/* Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-blue-500"></div>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-blue-500" />
            <span>إجمالي المبيعات</span>
          </span>
          <div className="mt-2.5">
            <div className="text-[15px] font-extrabold text-slate-800 font-mono text-left truncate">
              {totalSalesValue.toLocaleString()}
            </div>
            <span className="text-[9px] text-blue-600 font-bold block mt-0.5">ر.س (ريال سعودي)</span>
          </div>
        </div>

        {/* Purchases */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500"></div>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>إجمالي المشتريات</span>
          </span>
          <div className="mt-2.5">
            <div className="text-[15px] font-extrabold text-slate-800 font-mono text-left truncate">
              {totalPurchasesValue.toLocaleString()}
            </div>
            <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">ر.س (شامل الضريبة)</span>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1.5 w-full bg-amber-500"></div>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span>تقييم المخازن</span>
          </span>
          <div className="mt-2.5">
            <div className="text-[15px] font-extrabold text-slate-800 font-mono text-left truncate">
              {totalStockValue.toLocaleString()}
            </div>
            <span className="text-[9px] text-amber-600 font-bold block mt-0.5">تكلفة شراء المواد</span>
          </div>
        </div>

        {/* Customers */}
        <div 
          onClick={() => openWindow('customers', 'شاشة إدارة بطاقات العملاء المباشرة')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 h-1.5 w-full bg-purple-500"></div>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <span>العملاء النشطين</span>
          </span>
          <div className="mt-2.5">
            <div className="text-[15px] font-extrabold text-slate-800 font-mono text-left truncate">
              {totalCustomersCount}
            </div>
            <span className="text-[9px] text-purple-600 font-bold block mt-0.5">ذمم مدينة بالكامل</span>
          </div>
        </div>

        {/* Suppliers */}
        <div 
          onClick={() => openWindow('suppliers', 'شاشة إدارة بطاقات الموردين المباشرة')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 h-1.5 w-full bg-rose-500"></div>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-rose-500" />
            <span>الموردين المعتمدين</span>
          </span>
          <div className="mt-2.5">
            <div className="text-[15px] font-extrabold text-slate-800 font-mono text-left truncate">
              {totalSuppliersCount}
            </div>
            <span className="text-[9px] text-rose-600 font-bold block mt-0.5">ذمم دائنة والتزامات</span>
          </div>
        </div>

        {/* Cash vault (الخزينة) */}
        <div 
          onClick={() => openWindow('treasury_banks', 'إدارة الخزائن والحسابات البنكية')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 h-1.5 w-full bg-blue-600"></div>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-blue-600" />
            <span>الخزينة والبنك</span>
          </span>
          <div className="mt-2.5">
            <div className="text-[15px] font-extrabold text-blue-700 font-mono text-left truncate">
              {totalVaultValue.toLocaleString()}
            </div>
            <span className="text-[9px] text-blue-600 font-bold block mt-0.5">السيولة النقدية المتوفرة</span>
          </div>
        </div>
      </div>
      
      {/* Closed widgets recovery bar */}
      {widgets.some(w => !w.isOpen) && (
        <div className="bg-slate-200 border border-slate-300 p-2 rounded-lg flex flex-wrap gap-2 items-center text-xs">
          <span className="font-bold text-slate-700">الأدوات المخفية:</span>
          {widgets.filter(w => !w.isOpen).map(w => (
            <button 
              key={w.id} 
              onClick={() => openWidget(w.id)}
              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>{w.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid of Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map((widget, index) => {
          if (!widget.isOpen) return null;

          return (
            <div 
              key={widget.id} 
              className={`bg-white rounded-lg border border-slate-300 shadow-xs flex flex-col overflow-hidden transition-all duration-200 ${
                widget.isMinimized ? 'h-[44px]' : 'h-[280px]'
              }`}
            >
              {/* Widget Header */}
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between select-none shrink-0">
                <span className="font-bold text-[13px] text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-xs"></span>
                  {widget.title}
                </span>

                <div className="flex items-center gap-1.5 text-slate-400">
                  {/* Move actions */}
                  <button 
                    onClick={() => moveWidget(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="تحريك لأعلى"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => moveWidget(index, 'down')}
                    disabled={index === widgets.length - 1}
                    className="p-0.5 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="تحريك لأسفل"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-3 bg-slate-300 mx-1" />

                  {/* Refresh */}
                  <button 
                    onClick={() => {
                      showToast(`تم تحديث أداة: ${widget.title}`, 'info');
                    }}
                    className="p-0.5 hover:text-blue-600 cursor-pointer"
                    title="تحديث البيانات"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Minimize */}
                  <button 
                    onClick={() => toggleMinimize(widget.id)}
                    className="p-0.5 hover:text-slate-700 cursor-pointer"
                    title={widget.isMinimized ? 'توسيع' : 'تصغير'}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Close */}
                  <button 
                    onClick={() => closeWidget(widget.id)}
                    className="p-0.5 hover:text-red-600 cursor-pointer"
                    title="إغلاق الأداة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Widget Body */}
              {!widget.isMinimized && (
                <div className="p-3.5 flex-1 overflow-y-auto text-xs text-slate-700">
                  
                  {/* GENERAL STATS WIDGET */}
                  {widget.id === 'general' && (
                    <div className="grid grid-cols-2 gap-2.5 h-full">
                      <div className="bg-blue-50/50 p-2.5 rounded border border-blue-100 flex flex-col justify-between">
                        <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-blue-500" />
                          <span>إجمالي الفواتير</span>
                        </span>
                        <div className="text-[15px] font-bold text-blue-900 font-mono text-left">
                          {(totalSalesValue + totalPurchasesValue).toLocaleString()} <span className="text-[10px]">ر.س</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100 flex flex-col justify-between">
                        <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-emerald-500" />
                          <span>قيمة المخزون</span>
                        </span>
                        <div className="text-[15px] font-bold text-emerald-900 font-mono text-left">
                          {totalStockValue.toLocaleString()} <span className="text-[10px]">ر.س</span>
                        </div>
                      </div>

                      <div className="bg-amber-50/50 p-2.5 rounded border border-amber-100 flex flex-col justify-between">
                        <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-500" />
                          <span>العملاء والذمم</span>
                        </span>
                        <div className="text-[15px] font-bold text-amber-900 font-mono text-left">
                          {customers.length} <span className="text-[10px]">حسابات</span>
                        </div>
                      </div>

                      <div className="bg-purple-50/50 p-2.5 rounded border border-purple-100 flex flex-col justify-between">
                        <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 text-purple-500" />
                          <span>المواد المعرفة</span>
                        </span>
                        <div className="text-[15px] font-bold text-purple-900 font-mono text-left">
                          {items.length} <span className="text-[10px]">كرت مادة</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ALERTS WIDGET */}
                  {widget.id === 'alerts' && (
                    <div className="space-y-2 h-full">
                      {alerts.map(alt => (
                        <div 
                          key={alt.id} 
                          className={`p-2 rounded border flex items-start gap-2 ${
                            alt.type === 'danger' 
                              ? 'bg-red-50 border-red-200 text-red-900' 
                              : alt.type === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-[11px] leading-relaxed font-semibold">{alt.message}</p>
                            <span className="text-[9.5px] opacity-75 block font-mono">{alt.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TASKS WIDGET */}
                  {widget.id === 'tasks' && (
                    <div className="flex flex-col h-full space-y-2">
                      <form onSubmit={handleAddTask} className="flex gap-1.5 shrink-0">
                        <input 
                          type="text"
                          placeholder="أضف مهمة محاسبية جديدة..."
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          className="flex-1 border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                        <button 
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 cursor-pointer transition-colors"
                        >
                          إضافة
                        </button>
                      </form>

                      <div className="flex-1 overflow-y-auto space-y-1.5">
                        {tasks.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100/50 transition-colors">
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                              <input 
                                type="checkbox" 
                                checked={t.done}
                                onChange={() => handleToggleTask(t.id)}
                                className="accent-blue-600 w-3.5 h-3.5"
                              />
                              <span className={`text-[11px] font-semibold leading-relaxed ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {t.title}
                              </span>
                            </label>
                            <button 
                              onClick={() => handleDeleteTask(t.id)}
                              className="text-slate-400 hover:text-red-600 text-[10px] p-0.5 cursor-pointer"
                              title="حذف المهمة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CURRENCIES WIDGET */}
                  {widget.id === 'currencies' && (
                    <div className="space-y-3 h-full flex flex-col">
                      {/* Currency calculator */}
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-md space-y-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            value={calcAmount}
                            onChange={(e) => setCalcAmount(Number(e.target.value))}
                            className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-mono focus:outline-none"
                          />
                          <select 
                            value={calcFrom} 
                            onChange={(e) => setCalcFrom(e.target.value)}
                            className="text-[11px] bg-white border border-slate-300 rounded p-0.5 font-bold"
                          >
                            <option value="SAR">ريال (SAR)</option>
                            <option value="USD">دولار (USD)</option>
                            <option value="JOD">دينار (JOD)</option>
                          </select>
                          <ArrowLeftRight className="w-3 h-3 text-slate-400" />
                          <select 
                            value={calcTo} 
                            onChange={(e) => setCalcTo(e.target.value)}
                            className="text-[11px] bg-white border border-slate-300 rounded p-0.5 font-bold"
                          >
                            <option value="USD">دولار (USD)</option>
                            <option value="SAR">ريال (SAR)</option>
                            <option value="JOD">دينار (JOD)</option>
                          </select>
                        </div>
                        <div className="text-center font-mono font-bold text-blue-700 bg-blue-50/50 py-1.5 rounded border border-blue-100">
                          {calcResult} {calcTo === 'USD' ? '$' : calcTo === 'SAR' ? 'ر.س' : 'د.أ'}
                        </div>
                      </div>

                      {/* Currency Exchange Rates List */}
                      <div className="flex-1 space-y-1 overflow-y-auto">
                        <div className="flex justify-between border-b pb-1 font-bold text-slate-400 text-[10px]">
                          <span>العملة والرمز</span>
                          <span>سعر الصرف الرئيسي</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>1 دولار أمريكي (USD)</span>
                          <span className="font-mono font-bold text-slate-800">3.75 ر.س</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>1 دينار أردني (JOD)</span>
                          <span className="font-mono font-bold text-slate-800">5.29 ر.س</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRAYERS WIDGET */}
                  {widget.id === 'prayers' && (
                    <div className="space-y-2 h-full flex flex-col justify-between">
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded p-2 text-center">
                        <div className="text-[11px] font-bold flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>الآذان القادم: {nextPrayer.name}</span>
                        </div>
                        <div className="text-[16px] font-bold font-mono text-emerald-800 mt-1">
                          باقي {nextPrayer.time}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center flex-1 pt-1.5">
                        <div className="bg-slate-50 border border-slate-200 p-1 rounded">
                          <span className="text-[10px] text-slate-400 block">الفجر</span>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">{prayerTimes.Fajr}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-1 rounded">
                          <span className="text-[10px] text-slate-400 block">الظهر</span>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">{prayerTimes.Dhuhr}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-1 rounded">
                          <span className="text-[10px] text-slate-400 block">العصر</span>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">{prayerTimes.Asr}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-1 rounded">
                          <span className="text-[10px] text-slate-400 block">المغرب</span>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">{prayerTimes.Maghrib}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-1 rounded">
                          <span className="text-[10px] text-slate-400 block">العشاء</span>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">{prayerTimes.Isha}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-1 rounded flex flex-col justify-center items-center">
                          <span className="text-[9px] text-slate-400">الرياض</span>
                          <span className="font-bold text-emerald-600 text-[10px]">مواقيت</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REMINDERS WIDGET */}
                  {widget.id === 'reminders' && (
                    <div className="flex flex-col h-full space-y-2">
                      <form onSubmit={handleAddReminder} className="flex gap-1 shrink-0">
                        <input 
                          type="text"
                          required
                          placeholder="مذكرة سريعة..."
                          value={newReminderText}
                          onChange={(e) => setNewReminderText(e.target.value)}
                          className="flex-1 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                        <input 
                          type="text"
                          placeholder="05:00 م"
                          value={newReminderTime}
                          onChange={(e) => setNewReminderTime(e.target.value)}
                          className="w-16 border border-slate-300 rounded px-1 py-0.5 text-[11px] text-center bg-white"
                        />
                        <button 
                          type="submit"
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded px-2 py-0.5 text-[11px] cursor-pointer"
                        >
                          حفظ
                        </button>
                      </form>

                      <div className="flex-1 overflow-y-auto space-y-1.5">
                        {reminders.map(rem => (
                          <div key={rem.id} className="p-2 bg-amber-50/50 border border-amber-200 rounded space-y-1">
                            <div className="flex justify-between items-start">
                              <p className="text-[11px] font-bold text-slate-800 leading-relaxed">{rem.text}</p>
                              <button 
                                onClick={() => setReminders(prev => prev.filter(r => r.id !== rem.id))}
                                className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[9.5px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.5 rounded-sm font-mono inline-block">
                              تنبيه: {rem.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SHORTCUTS WIDGET */}
                  {widget.id === 'shortcuts' && (
                    <div className="grid grid-cols-2 gap-2 h-full">
                      <button 
                        onClick={() => openWindow('invoice', 'فاتورة مبيعات جديدة', { invoiceType: 'sale' })}
                        className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/10 rounded flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group"
                      >
                        <Receipt className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-[11.5px]">فاتورة مبيعات</span>
                      </button>

                      <button 
                        onClick={() => openWindow('journal_entry', 'سند قيد جديد')}
                        className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/10 rounded flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group"
                      >
                        <CheckSquare className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-[11.5px]">سند قيد يومية</span>
                      </button>

                      <button 
                        onClick={() => openWindow('chart_of_accounts', 'دليل الحسابات المالي')}
                        className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/10 rounded flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group"
                      >
                        <Landmark className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-[11.5px]">دليل الحسابات</span>
                      </button>

                      <button 
                        onClick={() => openWindow('reports', 'ميزان المراجعة العام', { reportType: 'trial_balance' })}
                        className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/10 rounded flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group"
                      >
                        <TrendingUp className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700 text-[11.5px]">ميزان المراجعة</span>
                      </button>
                    </div>
                  )}

                  {/* ITEMS STOCK WIDGET */}
                  {widget.id === 'items_widget' && (
                    <div className="space-y-2 h-full flex flex-col justify-between">
                      <div className="flex justify-between border-b pb-1 font-bold text-slate-400 text-[10px] shrink-0">
                        <span>اسم المادة والرمز</span>
                        <span>الرصيد الفعلي الحالي</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1.5">
                        {items.slice(0, 4).map(it => (
                          <div key={it.id} className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-100">
                            <span className="text-[11px] text-slate-700 font-medium truncate max-w-[150px]">{it.name}</span>
                            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10.5px] ${
                              it.currentStock <= it.minLimit 
                                ? 'bg-red-100 text-red-700 animate-pulse' 
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {it.currentStock} {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => openWindow('reports', 'جرد المواد والمخزون', { reportType: 'inventory_list' })}
                        className="w-full text-center py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded text-[11px] transition-all cursor-pointer block shrink-0"
                      >
                        عرض جرد المستودعات بالكامل
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

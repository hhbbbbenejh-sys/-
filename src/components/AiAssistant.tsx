import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, Send, Bot, User, RefreshCw, BarChart2, FileText, 
  Play, Download, Search, Mic, ArrowLeftRight, AlertTriangle, Check, HelpCircle
} from 'lucide-react';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  action?: {
    type: string;
    windowId: string;
    title?: string;
    params?: any;
  } | null;
  chart?: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: Array<{ name: string; value: number }>;
  } | null;
  report?: {
    title: string;
    headers: string[];
    rows: string[][];
  } | null;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ isOpen, onClose }) => {
  const { connectedDbId, openWindow, showToast } = useErp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Pre-defined Quick Commands (Arabic & English)
  const quickCommands = [
    { text: 'كم مبيعات اليوم؟', icon: '💰' },
    { text: 'ما الأصناف التي قاربت على النفاد؟', icon: '⚠️' },
    { text: 'افتح فاتورة مبيعات جديدة', icon: '📝' },
    { text: 'اقترح طلب شراء للمخازن', icon: '📥' },
    { text: 'هل توجد أخطاء محاسبية بالقيود؟', icon: '🔍' },
    { text: 'ما أكثر عميل شراءً هذا الشهر؟', icon: '👤' },
  ];

  // Initialize with a friendly greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'مرحباً بك! أنا مساعد الميزان الذكي المدمج في نظام الـ ERP الخاص بك. يمكنني مساعدتك في قراءة وتحليل الحسابات والمخازن، توليد التقارير والرسوم البيانية التفاعلية، وتنفيذ الأوامر المباشرة داخل النظام بذكاء ومرونة. كيف يمكنني مساعدتك اليوم؟',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Action Triggering (MDI Window Management)
  const handleActionClick = (action: any) => {
    if (!action) return;
    
    // Map windowIds to standard titles
    let title = action.title || 'شاشة النظام';
    if (action.windowId === 'customers') title = 'إدارة ملفات العملاء';
    if (action.windowId === 'suppliers') title = 'إدارة ملفات الموردين';
    if (action.windowId === 'chart_of_accounts') title = 'شجرة الحسابات والدليل المالي';
    if (action.windowId === 'hr_employees') title = 'شؤون الموظفين والموارد البشرية';
    if (action.windowId === 'journal_entry') title = 'سند قيد يومي جديد';
    
    if (action.windowId === 'invoice') {
      const type = action.params?.invoiceType || 'sale';
      if (type === 'sale') title = 'فاتورة مبيعات ذكية';
      if (type === 'purchase') title = 'فاتورة مشتريات جديدة';
      if (type === 'sale_return') title = 'مرتجع مبيعات';
      if (type === 'purchase_return') title = 'مرتجع مشتريات';
    }

    if (action.windowId === 'reports') {
      const type = action.params?.reportType || 'general_ledger';
      if (type === 'general_ledger') title = 'تقرير كشف الأستاذ العام';
      if (type === 'trial_balance') title = 'تقرير ميزان المراجعة المالي';
      if (type === 'inventory_list') title = 'تقرير جرد المواد والمستودعات';
      if (type === 'customer_balances') title = 'تقرير أرصدة ومطابقات العملاء';
      if (type === 'item_profit') title = 'تقرير تحليل أرباح المواد والسلع';
    }

    try {
      openWindow(action.windowId, title, action.params || {});
      showToast('success', `تم فتح [${title}] بنجاح عبر المساعد الذكي.`);
    } catch (e) {
      showToast('error', 'عذراً، فشل فتح الشاشة المطلوبة.');
    }
  };

  // Export Report to CSV with proper Arabic encoding (UTF-8 BOM)
  const handleExportCSV = (report: any) => {
    if (!report) return;
    const { title, headers, rows } = report;
    
    // Arabic Excel needs BOM to display characters properly
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_المساعد_${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'تم تصدير ملف التقرير بتنسيق Excel/CSV بنجاح.');
  };

  // Send Message to backend
  const handleSend = async (textToSend: string) => {
    const prompt = textToSend.trim();
    if (!prompt) return;

    // Add User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Simulated loading thoughts
    const steps = [
      'جاري قراءة وتلخيص الحسابات والمخازن الحالية...',
      'جاري تجميع مبيعات اليوم وتحليل الفواتير...',
      'جاري معالجة طلبك بواسطة Gemini AI...',
      'جاري هيكلة التقرير وتصميم الرسم البياني المطلوبة...'
    ];
    let stepIdx = 0;
    setThinkingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setThinkingStep(steps[stepIdx]);
    }, 2200);

    try {
      const response = await fetch(`/api/ai/${connectedDbId || 'db-main'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: prompt,
          history: messages.slice(-10).map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `خطأ برقم ${response.status}`);
      }

      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.responseText || 'لم أتمكن من صياغة إجابة مناسبة.',
        timestamp: new Date(),
        action: data.action || null,
        chart: data.chart || null,
        report: data.report || null
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      clearInterval(interval);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ عذراً، فشل المساعد الذكي في الاستجابة: ${err.message}. يرجى التحقق من توفر مفتاح Gemini API وتطابق التكوين.`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render highly responsive, pixel-perfect SVG charts
  const renderChart = (chart: any) => {
    if (!chart || !chart.data || chart.data.length === 0) return null;

    const values = chart.data.map((d: any) => Number(d.value) || 0);
    const maxVal = Math.max(...values, 1);
    const chartType = chart.type || 'bar';

    if (chartType === 'bar') {
      // Premium Horizontal Bar Chart
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-3 text-white font-sans shadow-inner overflow-hidden">
          <div className="flex items-center gap-2 mb-3.5 border-b border-slate-800 pb-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <h5 className="text-[12px] font-extrabold text-slate-200">{chart.title}</h5>
          </div>
          <div className="space-y-3 text-[11px]">
            {chart.data.map((item: any, idx: number) => {
              const val = Number(item.value) || 0;
              const pct = Math.min(100, Math.round((val / maxVal) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-medium text-slate-400">
                    <span className="truncate max-w-[200px]">{item.name}</span>
                    <span className="font-mono text-purple-300 font-bold">{val.toLocaleString()} ر.س</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (chartType === 'line') {
      // Dynamic Responsive Line Chart with elegant curves
      const width = 360;
      const height = 140;
      const padding = 25;
      const points = chart.data.map((item: any, idx: number) => {
        const val = Number(item.value) || 0;
        const x = padding + (idx * (width - padding * 2)) / Math.max(chart.data.length - 1, 1);
        const y = height - padding - (val * (height - padding * 2)) / maxVal;
        return { x, y, name: item.name, value: val };
      });

      const polylinePoints = points.map((p: any) => `${p.x},${p.y}`).join(' ');

      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-3 text-white font-sans shadow-inner overflow-hidden">
          <div className="flex items-center gap-2 mb-3.5 border-b border-slate-800 pb-2">
            <BarChart2 className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h5 className="text-[12px] font-extrabold text-slate-200">{chart.title}</h5>
          </div>
          <div className="relative w-full flex justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[140px]">
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

              {/* Curve Line */}
              {points.length > 1 && (
                <motion.polyline
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                  initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              )}

              {/* Data Node Points */}
              {points.map((p: any, idx: number) => (
                <g key={idx}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4.5" 
                    fill="#6366f1" 
                    stroke="#ffffff" 
                    strokeWidth="1.5"
                    className="hover:r-6 cursor-pointer transition-all" 
                  />
                </g>
              ))}

              {/* Gradients */}
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Legend Table */}
          <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-2 text-center leading-relaxed">
            {chart.data.slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} className="truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 ml-1" />
                <span className="font-bold text-slate-300">{item.name}:</span> <span className="font-mono text-purple-300 font-extrabold">{Number(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (chartType === 'pie') {
      // Stacked Color Donut Bar - Perfect for compact vertical panels
      const total = values.reduce((sum: number, v: number) => sum + v, 0);
      const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-3 text-white font-sans shadow-inner overflow-hidden">
          <div className="flex items-center gap-2 mb-3.5 border-b border-slate-800 pb-2">
            <BarChart2 className="w-4 h-4 text-pink-400" />
            <h5 className="text-[12px] font-extrabold text-slate-200">{chart.title}</h5>
          </div>
          <div className="w-full bg-slate-800 h-4 rounded-full flex overflow-hidden border border-slate-700/50 mb-4">
            {chart.data.map((item: any, idx: number) => {
              const val = Number(item.value) || 0;
              const pct = total > 0 ? (val / total) * 100 : 0;
              if (pct < 1) return null;
              return (
                <div 
                  key={idx} 
                  style={{ width: `${pct}%` }} 
                  className={`${colors[idx % colors.length]} h-full first:rounded-r-full last:rounded-l-full relative group transition-all duration-300 hover:brightness-110`}
                  title={`${item.name}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="space-y-1.5 text-[10.5px]">
            {chart.data.map((item: any, idx: number) => {
              const val = Number(item.value) || 0;
              const pct = total > 0 ? (val / total) * 100 : 0;
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="truncate max-w-[200px]">{item.name}</span>
                  </div>
                  <div className="flex gap-2 font-mono">
                    <span className="text-pink-300 font-bold">{val.toLocaleString()} ر.س</span>
                    <span className="text-slate-500">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  // Render Interactive, Searchable and Downloadable Reports
  const ReportContainer: React.FC<{ report: any }> = ({ report }) => {
    const [searchQuery, setSearchQuery] = useState('');
    if (!report) return null;

    const filteredRows = searchQuery.trim() === ''
      ? report.rows
      : report.rows.filter((row: string[]) => 
          row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase()))
        );

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 my-3 shadow-md flex flex-col font-sans overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
            <h5 className="text-[12.5px] font-black text-slate-800">{report.title}</h5>
          </div>
          <button 
            onClick={() => handleExportCSV(report)}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-md border border-emerald-200/50 transition-all cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>تصدير Excel</span>
          </button>
        </div>

        {/* Report Search Bar */}
        <div className="relative mb-3 flex items-center">
          <Search className="absolute right-2.5 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث وتصفية سريعة داخل الجدول..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-[11px] text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            dir="rtl"
          />
        </div>

        {/* Responsive Horizontal Scroll Grid Table */}
        <div className="w-full overflow-x-auto max-h-[180px] overflow-y-auto border border-slate-100 rounded-lg shadow-inner">
          <table className="w-full border-collapse text-[10.5px] text-right" dir="rtl">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold sticky top-0 z-10">
              <tr>
                {report.headers.map((h: string, idx: number) => (
                  <th key={idx} className="p-2 border-r first:border-r-0 border-slate-200 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {filteredRows.length > 0 ? (
                filteredRows.map((row: string[], rowIdx: number) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/30">
                    {row.map((cell: string, cellIdx: number) => (
                      <td key={cellIdx} className="p-2 border-r first:border-r-0 border-slate-100 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={report.headers.length} className="p-6 text-center text-slate-400 font-bold">لا توجد نتائج مطابقة لبحثك.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blurring effect over Desktop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-[200] cursor-pointer"
          />

          {/* AI Assistant Sliding Side-Drawer Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed top-0 bottom-0 left-0 md:left-auto md:right-0 w-full md:w-[480px] bg-slate-50 border-r md:border-l border-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.15)] z-[201] flex flex-col select-none overflow-hidden"
            dir="rtl"
          >
            {/* Elegant Indigo/Slate Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-4 py-3.5 flex items-center justify-between border-b border-indigo-900 shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-1.5 rounded-xl shadow-lg shadow-indigo-500/10 relative">
                  <Sparkles className="w-4.5 h-4.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white animate-ping" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-black tracking-wide">مساعد الميزان الذكي</h4>
                  <p className="text-[10px] text-slate-400 font-sans tracking-wider font-semibold">ALMEEZAN ERP AI ASSISTANT • ONLINE</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق اللوحة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Conversation Logs Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 scrollbar-thin">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-2.5 max-w-[90%] ${
                    msg.sender === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'
                  }`}
                >
                  {/* Sender Icon/Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white border-blue-700' 
                      : 'bg-gradient-to-tr from-purple-800 to-indigo-900 text-white border-indigo-950'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-purple-200" />}
                  </div>

                  {/* Message Bubble Block */}
                  <div className="space-y-2">
                    <div className={`p-3.5 rounded-2xl text-[12px] leading-relaxed font-sans shadow-xs whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none border border-blue-700 shadow-md font-bold'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 font-semibold'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Report Render Card */}
                    {msg.report && <ReportContainer report={msg.report} />}

                    {/* Chart Render Card */}
                    {msg.chart && renderChart(msg.chart)}

                    {/* Suggested ERP System Action Card (Deep Integration Point) */}
                    {msg.action && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Play className="w-4.5 h-4.5 text-purple-600 animate-bounce" />
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-extrabold">أمر تشغيل نظامي مقترح</div>
                            <div className="text-[11.5px] font-black text-purple-950">فتح شاشة {msg.action.title || 'المطلوبة'}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleActionClick(msg.action)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10.5px] px-3.5 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <span>تنفيذ الأمر الآن</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}

              {/* AI Thinking/Processing Indicator Block */}
              {isLoading && (
                <div className="flex gap-2.5 ml-auto max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-800 to-indigo-900 text-white border border-indigo-950 flex items-center justify-center shrink-0 shadow-xs animate-spin">
                    <Sparkles className="w-4 h-4 text-purple-200" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-none shadow-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce delay-200" />
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce delay-300" />
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-extrabold font-sans animate-pulse">{thinkingStep}</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Commands Suggesters Drawer */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto shrink-0 select-none scrollbar-none">
              {quickCommands.map((qc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qc.text)}
                  disabled={isLoading}
                  className="flex items-center gap-1 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 text-[10.5px] font-bold text-slate-600 px-3 py-1.5 rounded-full shadow-2xs hover:shadow-xs transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{qc.icon}</span>
                  <span>{qc.text}</span>
                </button>
              ))}
            </div>

            {/* Smart Input Bar Dock */}
            <div className="bg-white p-3 border-t border-slate-200 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2"
              >
                {/* Voice typing placeholder button */}
                <button 
                  type="button"
                  onClick={() => showToast('info', 'تمكين الكتابة الصوتية والتعرف على النبرة قيد الترقية.')}
                  className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-purple-50 hover:text-purple-600 border border-slate-200/50 transition-colors cursor-pointer shrink-0"
                  title="التعرف الصوتي"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input 
                  type="text"
                  placeholder="اسألني أي شيء أو وجه لي أمراً مباشراً باللغة العربية..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[11.5px] text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-all font-sans font-medium"
                  dir="rtl"
                />

                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-xl bg-purple-600 text-white border border-purple-700 hover:bg-purple-700 hover:shadow shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0"
                  title="إرسال"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

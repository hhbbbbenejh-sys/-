import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { 
  Plus, RotateCcw, AlertTriangle, ShieldCheck, History, Info, Sparkles, Server, Cpu
} from 'lucide-react';

interface AdminUpdatesWindowProps {
  windowId: string;
  onClose: () => void;
}

export function AdminUpdatesWindow({ windowId, onClose }: AdminUpdatesWindowProps) {
  const { 
    currentVersion, 
    publishNewVersion, 
    rollbackLatestVersion,
    checkProgramUpdate 
  } = useErp();

  const [version, setVersion] = useState('12.0.1');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [size, setSize] = useState('3.2 MB');
  const [isMandatory, setIsMandatory] = useState(false);
  const [notes, setNotes] = useState('تحديث أمني عاجل ومعالجة فواتير المبيعات وتحسين واجهة تسجيل الدخول.');
  const [changelog, setChangelog] = useState(
    '1. تحسين واجهة تسجيل الدخول بالكامل وتطوير التصميم الاحترافي لـ AlMezan.NET\n' +
    '2. إخفاء كلمات المرور الافتراضية وحسابات العرض التجريبي تماماً\n' +
    '3. تفعيل الاتصال المباشر بقنوات النقل ومزامنة قواعد البيانات التاريخية\n' +
    '4. معالجة حساب أرباح المواد في التقارير الختامية للميزانية العامة'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [updateHistory, setUpdateHistory] = useState<any[]>([]);

  // Fetch all published updates from the server
  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/updates/check?currentVersion=9.9.9`);
      if (res.ok) {
        const data = await res.json();
        setUpdateHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching updates history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim()) return;

    setIsLoading(true);
    const success = await publishNewVersion(version, notes, changelog, size, isMandatory);
    setIsLoading(false);

    if (success) {
      loadHistory();
      // Set default inputs for next potential version
      const parts = version.split('.');
      if (parts.length === 3) {
        const patch = parseInt(parts[2], 10);
        if (!isNaN(patch)) {
          setVersion(`${parts[0]}.${parts[1]}.${patch + 1}`);
        }
      }
    }
  };

  const handleRollback = async () => {
    if (confirm('هل أنت متأكد من رغبتك في التراجع عن آخر تحديث؟ سيؤدي هذا إلى خفض رقم الإصدار النشط وإعادة العملاء للإصدار الذي قبله فوراً.')) {
      setIsLoading(true);
      const success = await rollbackLatestVersion();
      setIsLoading(false);
      if (success) {
        loadHistory();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans" dir="rtl">
      {/* Title Panel */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between shadow-inner shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-extrabold text-[14px]">مدير التحديثات التلقائية المطور (Admin Update Manager)</h3>
            <p className="text-[10px] text-slate-300">أداة المطورين لنشر الإصدارات والترقيات والتحكم في دورة حياة التطبيق.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded">
            الإصدار النشط للعملاء: <span className="font-mono font-bold text-amber-400">{currentVersion}</span>
          </span>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: Publish Form */}
        <form onSubmit={handlePublish} className="w-[450px] bg-white border-l border-slate-200 p-5 flex flex-col space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 select-none">
            <Plus className="w-4 h-4 text-blue-600" />
            <h4 className="font-extrabold text-[12.5px] text-slate-800">نشر وإصدار ترقية برمجية جديدة</h4>
          </div>

          {/* Version Inputs Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">رقم الإصدار (Version):</label>
              <input 
                type="text" 
                value={version}
                onChange={e => setVersion(e.target.value)}
                required
                placeholder="مثال: 12.0.2"
                className="w-full text-[12px] px-3 py-1.5 border border-slate-200 rounded focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">حجم ملف التحديث:</label>
              <input 
                type="text" 
                value={size}
                onChange={e => setSize(e.target.value)}
                required
                placeholder="مثال: 3.5 MB"
                className="w-full text-[12px] px-3 py-1.5 border border-slate-200 rounded focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">تاريخ الإصدار والاعتماد:</label>
            <input 
              type="date" 
              value={releaseDate}
              onChange={e => setReleaseDate(e.target.value)}
              required
              className="w-full text-[12px] px-3 py-1.5 border border-slate-200 rounded focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>

          {/* Mandatory Checkbox */}
          <div className="bg-amber-50/50 border border-amber-200/60 p-3 rounded space-y-2 select-none">
            <div className="flex items-start gap-2">
              <input 
                type="checkbox" 
                id="isMandatoryCheck"
                checked={isMandatory}
                onChange={e => setIsMandatory(e.target.checked)}
                className="mt-1 cursor-pointer"
              />
              <label htmlFor="isMandatoryCheck" className="text-[12px] font-extrabold text-slate-800 cursor-pointer">
                فرض هذا التحديث كـ (تحديث إجباري)
              </label>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed pr-5">
              عند التفعيل، لن يتمكن أي مستخدم من تشغيل نظام ERP أو تخطي التحديث؛ سيتم إجبار الجميع على التحديث فوراً في شاشتهم عند أول اتصال.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">ملاحظات التحديث القصيرة (Release Notes):</label>
            <textarea 
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
              placeholder="وصف مختصر للتعديلات الهامة..."
              className="w-full text-[12px] px-3 py-1.5 border border-slate-200 rounded focus:border-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-1 flex-1 flex flex-col min-h-[120px]">
            <label className="text-[11px] font-bold text-slate-500">سجل التغييرات التفصيلي (Changelog):</label>
            <textarea 
              value={changelog}
              onChange={e => setChangelog(e.target.value)}
              required
              placeholder="اكتب التغييرات التفصيلية كل منها في سطر..."
              className="w-full flex-1 text-[11px] font-mono p-3 border border-slate-200 rounded focus:border-blue-500 focus:outline-none leading-relaxed whitespace-pre"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-xs py-2 rounded transition-colors shadow hover:shadow-md cursor-pointer text-center"
          >
            {isLoading ? 'جاري الاتصال والاعتماد...' : 'نشر واعتماد الإصدار المحدث الآن'}
          </button>
        </form>

        {/* Right Side: History and Admin Actions */}
        <div className="flex-1 bg-slate-50 p-5 flex flex-col space-y-4 overflow-y-auto">
          {/* Stability Tools Alert */}
          <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-start gap-3 select-none">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h5 className="text-[12.5px] font-extrabold text-slate-800">إدارة استقرار النظام وتراجع الطوارئ (Rollback)</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                في حال حدوث عطل غير متوقع في ملفات التحديث المنشور، يمكنك استخدام أداة التراجع أدناه فوراً لإرجاع العملاء للنسخة المستقرة السابقة مع الحفاظ الكامل على قواعد البيانات.
              </p>
              <button 
                type="button"
                onClick={handleRollback}
                disabled={isLoading || updateHistory.length <= 1}
                className="bg-red-50 hover:bg-red-100 disabled:bg-slate-100 border border-red-200 disabled:border-slate-200 text-red-700 disabled:text-slate-400 font-extrabold text-[11px] px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إجراء تراجع واسترجاع النسخة السابقة</span>
              </button>
            </div>
          </div>

          {/* Timeline of Updates */}
          <div className="flex flex-col space-y-3 flex-1 min-h-0">
            <div className="flex items-center gap-2 select-none">
              <History className="w-4 h-4 text-slate-700" />
              <h4 className="font-extrabold text-[12.5px] text-slate-800">سجل التحديثات المنشورة وتاريخ الاعتماد</h4>
            </div>

            <div className="space-y-3 pr-1">
              {updateHistory.map((upd, idx) => {
                const isCurrent = upd.version === currentVersion;
                return (
                  <div 
                    key={upd.id} 
                    className={`bg-white border rounded p-4 shadow-sm relative transition-all ${
                      isCurrent 
                        ? 'border-emerald-500 shadow-md bg-emerald-50/5' 
                        : 'border-slate-200'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9.5px] font-black px-2 py-0.5 rounded flex items-center gap-1 select-none">
                        <ShieldCheck className="w-3 h-3" />
                        <span>الإصدار النشط حالياً</span>
                      </span>
                    )}

                    <div className="flex items-center gap-2 select-none">
                      <span className="font-mono text-[13.5px] font-black text-slate-900">
                        v{upd.version}
                      </span>
                      {upd.isMandatory ? (
                        <span className="bg-red-100 text-red-800 border border-red-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded">
                          إجباري حرج
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9.5px] px-1.5 py-0.5 rounded">
                          تحديث اختياري
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-4 select-none">
                      <span>تاريخ النشر: {upd.releaseDate}</span>
                      <span>حجم الملف: {upd.size}</span>
                    </div>

                    <p className="text-[12px] text-slate-600 font-semibold mt-2 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                      {upd.notes}
                    </p>

                    <div className="mt-3.5 space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 select-none">سجل التغييرات الكامل:</div>
                      <pre className="bg-slate-900 text-slate-200 p-3 rounded text-[10px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
                        {upd.changelog}
                      </pre>
                    </div>
                  </div>
                );
              })}

              {updateHistory.length === 0 && (
                <div className="bg-slate-100 border border-slate-200 rounded p-6 text-center text-[12px] text-slate-500 select-none">
                  جاري جلب سجل الإصدارات من المخدم...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

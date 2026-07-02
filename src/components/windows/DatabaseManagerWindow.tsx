import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { 
  Database, Plus, HardDrive, RefreshCw, Trash2, Check, 
  Terminal, FileText, Settings, ShieldAlert, Cpu, Network, Lock, HelpCircle 
} from 'lucide-react';

interface DatabaseManagerWindowProps {
  windowId: string;
  onClose: () => void;
  initialTab?: string;
}

export const DatabaseManagerWindow: React.FC<DatabaseManagerWindowProps> = ({ windowId, onClose, initialTab }) => {
  const { 
    databases, 
    connectedDbId, 
    connectDatabase, 
    createDatabase, 
    deleteDatabase, 
    showToast 
  } = useErp();

  const [activeTab, setActiveTab] = useState<'connect' | 'create' | 'backup' | 'info'>(() => {
    if (initialTab === 'create') return 'create';
    if (initialTab === 'backup' || initialTab === 'restore') return 'backup';
    if (initialTab === 'info') return 'info';
    return 'connect';
  });

  // State for creating DB
  const [newDbName, setNewDbName] = useState('');
  const [newDbDesc, setNewDbDesc] = useState('قاعدة بيانات مخصصة للشركة العامة');
  const [primaryCurrency, setPrimaryCurrency] = useState('SAR');

  // State for Backup
  const [backups, setBackups] = useState([
    { id: 'b1', name: 'AlMeezan_Full_AutoBackup_2026_06_30.bak', size: '14.2 MB', date: '2026-06-30 02:00:00', type: 'تلقائي' },
    { id: 'b2', name: 'AlMeezan_BeforeTaxAudit_2026_06_15.bak', size: '12.8 MB', date: '2026-06-15 14:22:10', type: 'يدوي' },
  ]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleConnect = (id: string) => {
    connectDatabase(id);
    showToast('تم الاتصال بنجاح بقاعدة البيانات المختارة وتنزيل الصلاحيات.', 'success');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) {
      showToast('يرجى إدخال اسم قاعدة البيانات الجديدة.', 'warning');
      return;
    }
    const createdId = createDatabase(newDbName, newDbDesc);
    showToast(`تم بنجاح إنشاء قاعدة البيانات: ${newDbName}. يمكنك الآن الانتقال إليها.`, 'success');
    setNewDbName('');
    setActiveTab('connect');
  };

  const handleDeleteDb = (id: string, name: string) => {
    if (id === connectedDbId) {
      showToast('لا يمكن حذف قاعدة البيانات المتصل بها حالياً. قم بقطع الاتصال أو الانتقال لغيرها أولاً.', 'error');
      return;
    }
    if (confirm(`تحذير شديد: هل أنت متأكد من حذف قاعدة البيانات "${name}" بكافة حركاتها وقيودها نهائياً؟ لا يمكن استرجاع البيانات المفقودة.`)) {
      deleteDatabase(id);
      showToast(`تم بنجاح تدمير وحذف قاعدة البيانات "${name}" من مخدم البيانات SQL.`, 'success');
    }
  };

  const handleTakeBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const activeDb = databases.find(d => d.id === connectedDbId) || { name: 'AlMeezanDB' };
      const newBackup = {
        id: `b-${Date.now()}`,
        name: `${activeDb.name}_ManualBackup_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}_${Math.floor(100+Math.random()*900)}.bak`,
        size: '14.8 MB',
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'يدوي'
      };
      setBackups(prev => [newBackup, ...prev]);
      setIsBackingUp(false);
      showToast('تم ترحيل وبناء النسخة الاحتياطية المضغوطة بالكامل بنجاح.', 'success');
    }, 1500);
  };

  const handleRestoreBackup = (backupName: string) => {
    if (confirm(`هل ترغب فعلاً في استعادة النسخة الاحتياطية "${backupName}"؟ سيؤدي ذلك لاستبدال البيانات الحالية بالكامل بالبيانات المؤرشفة.`)) {
      setIsRestoring(true);
      setTimeout(() => {
        setIsRestoring(false);
        showToast('تم إنعاش الدفاتر واستعادة النسخة الاحتياطية والتحقق من سلامة الجداول بنجاح.', 'success');
      }, 2000);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      {/* Side Tabs Navigation */}
      <div className="w-[180px] shrink-0 bg-slate-100 border-l border-slate-300 flex flex-col justify-between py-4">
        <div className="space-y-1 px-2">
          <div className="text-[10px] font-bold text-slate-400 px-3 pb-2 tracking-wider">لوحة تحكم قواعد البيانات</div>
          
          <button
            onClick={() => setActiveTab('connect')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'connect' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>الاتصال والربط</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إنشاء قاعدة جديدة</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'backup' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>النسخ الاحتياطي</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'info' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>معلومات المخدم</span>
          </button>
        </div>

        <div className="px-3 text-center space-y-1">
          <div className="w-full h-[1px] bg-slate-200 my-2" />
          <span className="text-[10px] text-slate-400 font-mono block">Meezan SQL v12.1</span>
          <span className="text-[9px] text-emerald-600 font-extrabold flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>متصل وآمن</span>
          </span>
        </div>
      </div>

      {/* Tab Area Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'connect' && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">قواعد البيانات المتاحة على المخدم</h3>
              <p className="text-[11px] text-slate-500">اختر قاعدة البيانات الخاصة بشركتك للبدء في ترحيل المستندات والقيود والبحث فيها.</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {databases.map(db => {
                const isCurrent = db.id === connectedDbId;
                return (
                  <div 
                    key={db.id} 
                    className={`p-3.5 border rounded-lg transition-all shadow-xs flex flex-col justify-between ${
                      isCurrent 
                        ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-300' 
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                          <Database className={`w-4 h-4 ${isCurrent ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                          {db.name}
                        </span>
                        {isCurrent ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>متصلة حالياً</span>
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">جاهزة</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{db.description}</p>
                      <div className="flex gap-2 mt-3 text-[10px] text-slate-400 font-mono">
                        <span>إصدار الهيكل: {db.version}</span>
                        <span>•</span>
                        <span>مخدم: (local)\SQL_EXPRESS</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-100">
                      {isCurrent ? (
                        <button 
                          disabled
                          className="px-3 py-1 bg-slate-200 text-slate-400 rounded text-xs font-bold"
                        >
                          الحالية
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleDeleteDb(db.id, db.name)}
                            className="p-1.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-all cursor-pointer"
                            title="حذف وحذف قواعد البيانات بالكامل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleConnect(db.id)}
                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer shadow-xs transition-all"
                          >
                            اتصال بالبيانات
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-4 max-w-md">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">إنشاء قاعدة بيانات جديدة بالكامل</h3>
              <p className="text-[11px] text-slate-500">سيقوم محرك الميزان ببناء الجداول الأساسية، دليل الحسابات الافتراضي، وشجرة فروع خالية.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">اسم قاعدة البيانات (SQL DB Name):</label>
                <input 
                  type="text" 
                  value={newDbName}
                  onChange={e => setNewDbName(e.target.value)}
                  placeholder="AlMeezan_DB_2026"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">الوصف / اسم المنشأة والمؤسسة:</label>
                <input 
                  type="text" 
                  value={newDbDesc}
                  onChange={e => setNewDbDesc(e.target.value)}
                  placeholder="شركة الميزان للتجارة العامة والصناعة"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">العملة الافتراضية:</label>
                  <select 
                    value={primaryCurrency}
                    onChange={e => setPrimaryCurrency(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded"
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">رمز الدفاتر المالية:</label>
                  <input 
                    type="text" 
                    disabled 
                    value="ACC-2026-MAIN"
                    className="w-full text-xs p-2 bg-slate-100 border border-slate-200 rounded text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800 leading-relaxed">
                <strong>ملاحظة هامة:</strong> بعد الضغط على إنشاء، سيتم تفعيل وتجهيز دليل حسابات تجريبي متوازن لتسهيل عملية البدء الفوري دون تضييع الوقت.
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  إنشاء وتهيئة الجداول
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">إدارة النسخ الاحتياطي والأرشفة</h3>
                <p className="text-[11px] text-slate-500">حماية الدفاتر المالية وسجلات المستودعات من خلال النسخ الاحتياطي الفوري والآمن.</p>
              </div>
              <button 
                onClick={handleTakeBackup}
                disabled={isBackingUp}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {isBackingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                <span>إنشاء نسخة احتياطية فورية</span>
              </button>
            </div>

            {isRestoring && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-3 text-amber-950 animate-pulse text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                <div>
                  <span className="font-bold">جاري استعادة النسخة الاحتياطية...</span>
                  <p className="text-[11px] text-amber-700">الرجاء عدم إغلاق البرنامج لحين إعادة تعيين وترتيب الجداول والموازين المحاسبية بالكامل.</p>
                </div>
              </div>
            )}

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="p-3 bg-slate-100 text-slate-500 text-[11px] font-bold border-b grid grid-cols-4">
                <span>اسم الملف الاحتياطي</span>
                <span>الحجم الكلي</span>
                <span>تاريخ الأرشفة</span>
                <span className="text-left">العمليات المتوفرة</span>
              </div>

              <div className="divide-y divide-slate-100">
                {backups.map(b => (
                  <div key={b.id} className="p-3 grid grid-cols-4 text-xs items-center hover:bg-slate-50">
                    <span className="font-mono text-[11px] text-slate-800 font-bold truncate pr-1" title={b.name}>{b.name}</span>
                    <span className="font-mono text-slate-500">{b.size}</span>
                    <span className="font-mono text-slate-500">{b.date}</span>
                    <div className="flex gap-2 justify-end text-left pl-1">
                      <button 
                        onClick={() => handleRestoreBackup(b.name)}
                        disabled={isRestoring}
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded cursor-pointer transition-all"
                      >
                        استعادة الدفاتر
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">بيانات ومعلومات مخدم نظام الميزان</h3>
              <p className="text-[11px] text-slate-500">مراقبة أداء المخدم الداخلي، حالة الاتصال بالشبكة، وتفاصيل محرك المزامنة السحابي.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-white border rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">مخدم قاعدة البيانات</span>
                <p className="text-xs font-extrabold text-slate-800">(local)\SQL_EXPRESS_MEEZAN</p>
                <div className="text-[10px] text-slate-400 font-mono">Microsoft SQL Server 2022</div>
              </div>

              <div className="p-3.5 bg-white border rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">بروتوكول الشبكة</span>
                <p className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                  <Network className="w-4 h-4" />
                  <span>TCP/IP (محلي مشفر)</span>
                </p>
                <div className="text-[10px] text-slate-400 font-mono">Port: 1433 (Secure Ingress)</div>
              </div>

              <div className="p-3.5 bg-white border rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">السرية وحماية التشفير</span>
                <p className="text-xs font-extrabold text-blue-600 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>AES-256 Bit SSL/TLS</span>
                </p>
                <div className="text-[10px] text-slate-400 font-mono">حماية كاملة من تسرب الفواتير</div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-500" />
                سجل النشاط ومزامنة مخدم البيانات الفوري
              </span>

              <div className="bg-slate-950 p-3 rounded font-mono text-[10px] text-slate-300 space-y-1 shadow-inner h-32 overflow-y-auto">
                <p className="text-slate-400">[2026-07-02 08:31:02] Initializing Meezan SQL Engine Core...</p>
                <p className="text-slate-400">[2026-07-02 08:31:04] Mounting databases list from registry config.</p>
                <p className="text-emerald-400">[2026-07-02 08:31:05] Database AlMeezanDB loaded successfully (Version 12.00.412).</p>
                <p className="text-blue-400">[2026-07-02 08:31:10] SyncEngine: Local replica is in perfect state with production server.</p>
                <p className="text-slate-400">[2026-07-02 08:52:00] Audit log: Admin connected from workstation "WORKSTATION-MAIN".</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

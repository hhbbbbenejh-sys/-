import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { Database, Server, Plus, RefreshCw, Check, X, ShieldAlert, KeyRound } from 'lucide-react';

interface DatabaseModalProps {
  isMdiMode?: boolean;
  onCloseMdi?: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isMdiMode = false, onCloseMdi }) => {
  const { 
    databases, 
    connectedDbId, 
    connectDatabase, 
    createDatabase, 
    deleteDatabase, 
    saveSettingsNoShow, 
    setSaveSettingsNoShow,
    showToast
  } = useErp();

  const [selectedServer, setSelectedServer] = useState('(local)');
  const [selectedDbId, setSelectedDbId] = useState(databases[0]?.id || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newDbDesc, setNewDbDesc] = useState('');

  // Refresh list handler
  const handleRefresh = () => {
    // Simulated refresh
    const audio = new Audio();
    // play soft sound or just flash
    showToast('تم تحديث قائمة قواعد البيانات المتوفرة على المخدم بنجاح.', 'success');
  };

  // Keyboard shortcut F4 for refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleConnect = () => {
    if (!selectedDbId) {
      showToast('يرجى تحديد قاعدة بيانات للاتصال بها.', 'warning');
      return;
    }
    connectDatabase(selectedDbId);
    if (isMdiMode && onCloseMdi) {
      onCloseMdi();
    }
  };

  const handleCreateDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    const newId = await createDatabase(newDbName, newDbDesc || 'قاعدة بيانات جديدة منشأة مخصصة');
    setSelectedDbId(newId);
    setShowCreateForm(false);
    setNewDbName('');
    setNewDbDesc('');
  };

  const selectedDb = databases.find(db => db.id === selectedDbId);

  return (
    <div className={`${isMdiMode ? 'w-full h-full bg-slate-50 p-4' : 'fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-[100]'} select-none`}>
      <div className={`bg-white rounded-lg border border-slate-300 shadow-2xl overflow-hidden flex flex-col ${isMdiMode ? 'w-full h-full border-none' : 'w-[580px] max-w-full'}`}>
        
        {/* Header (Hidden in MDI mode because MDI provides its own window header) */}
        {!isMdiMode && (
          <div className="bg-slate-800 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-base">الاتصال بقاعدة بيانات - نظام الميزان ERP</h2>
            </div>
            <div className="text-[11px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
              v11.4.2
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Server Config Group */}
          <div className="grid grid-cols-3 gap-3 items-center bg-slate-50 p-3 rounded-md border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 text-[13px] font-bold">
              <Server className="w-4 h-4 text-slate-500" />
              <span>مخدم البيانات:</span>
            </div>
            <div className="col-span-2">
              <select 
                value={selectedServer} 
                onChange={(e) => setSelectedServer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              >
                <option value="(local)">(local) - محرك الميزان المدمج</option>
                <option value="192.168.1.100">192.168.1.100 (الخادم الرئيسي)</option>
                <option value="cloud-run-postgresql">Cloud SQL (خادم السحاب)</option>
              </select>
            </div>
          </div>

          {/* Database List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-bold text-slate-700">قواعد البيانات المتوفرة على المخدم:</label>
              <button 
                onClick={handleRefresh}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                title="اضغط لتحديث القائمة أو اختصار F4"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تحديث قائمة القواعد (F4)</span>
              </button>
            </div>

            <div className="border border-slate-300 rounded-md overflow-hidden bg-slate-50 min-h-[140px] max-h-[180px] overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-300 text-slate-700 font-bold">
                    <th className="px-3 py-2 w-10 text-center">اختيار</th>
                    <th className="px-3 py-2">اسم قاعدة البيانات</th>
                    <th className="px-3 py-2">الوصف والفرع</th>
                    <th className="px-3 py-2 text-center w-20">الإصدار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {databases.map((db) => (
                    <tr 
                      key={db.id} 
                      onClick={() => setSelectedDbId(db.id)}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedDbId === db.id ? 'bg-blue-50 font-bold text-blue-900' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input 
                          type="radio" 
                          name="selected_db"
                          checked={selectedDbId === db.id}
                          onChange={() => setSelectedDbId(db.id)}
                          className="accent-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono">{db.name}</td>
                      <td className="px-3 py-2 text-slate-500">{db.description}</td>
                      <td className="px-3 py-2 text-center text-slate-500 font-mono">{db.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected DB Details Card */}
          {selectedDb && (
            <div className="bg-blue-50/40 border border-blue-100 rounded-md p-3 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>اسم الداتا: <strong className="text-slate-800 font-mono">{selectedDb.name}</strong></span>
                <span>الإصدار المطلوب: <strong className="text-slate-800 font-mono">{selectedDb.version}</strong></span>
              </div>
              <p className="text-slate-500 text-[11.5px]">{selectedDb.description}</p>
            </div>
          )}

          {/* Create New DB Section */}
          {showCreateForm ? (
            <form onSubmit={handleCreateDb} className="bg-amber-50/50 border border-amber-200 p-4 rounded-md space-y-3 animate-window-open">
              <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span>إنشاء قاعدة بيانات جديدة بالكامل</span>
              </h4>
              <div className="grid grid-cols-3 gap-3 items-center">
                <span className="text-xs font-bold text-slate-600">اسم قاعدة البيانات:</span>
                <input 
                  type="text"
                  required
                  placeholder="مثال: AlMeezan_Branch_2"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  className="col-span-2 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 items-center">
                <span className="text-xs font-bold text-slate-600">الوصف / الاستخدام:</span>
                <input 
                  type="text"
                  placeholder="مثال: داتا فرع المستودعات والمبيعات"
                  value={newDbDesc}
                  onChange={(e) => setNewDbDesc(e.target.value)}
                  className="col-span-2 bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all cursor-pointer"
                >
                  إنشاء وربط
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2 border border-dashed border-slate-300 rounded-md hover:border-blue-500 text-slate-600 hover:text-blue-600 hover:bg-blue-50/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء قاعدة بيانات جديدة على المخدم الحالي</span>
            </button>
          )}

          {/* Option: Save Settings */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input 
              type="checkbox" 
              id="save_connect_settings"
              checked={saveSettingsNoShow}
              onChange={(e) => setSaveSettingsNoShow(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="save_connect_settings" className="text-xs text-slate-600 font-medium cursor-pointer">
              حفظ إعدادات الاتصال وعدم إظهار هذه النافذة تلقائياً عند تشغيل البرنامج.
            </label>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-slate-100 px-4 py-3.5 border-t border-slate-200 flex justify-end gap-2.5">
          {isMdiMode && onCloseMdi && (
            <button
              onClick={onCloseMdi}
              className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>إلغاء الأمر</span>
            </button>
          )}
          {!isMdiMode && (
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من رغبتك في إغلاق نظام الميزان؟')) {
                  showToast('تم الخروج من النظام.', 'info');
                }
              }}
              className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>إغلاق البرنامج</span>
            </button>
          )}
          <button
            onClick={handleConnect}
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
          >
            <Check className="w-4 h-4" />
            <span>اتصال بقاعدة البيانات</span>
          </button>
        </div>

      </div>
    </div>
  );
};

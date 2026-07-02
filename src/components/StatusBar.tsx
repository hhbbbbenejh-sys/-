import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { Database, User, MapPin, Warehouse, RefreshCw, Calendar, Clock } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { connectedDbId, databases, currentUser } = useErp();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ar-SA', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!connectedDbId) return null;

  const currentDb = databases.find(db => db.id === connectedDbId);
  const dbName = currentDb ? currentDb.name : 'AlMeezan_DB';

  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div 
      className="bg-slate-800 text-slate-300 text-xs border-t border-slate-700 h-8 flex items-center justify-between px-3 select-none z-50 shrink-0 font-medium"
      id="erp-status-bar"
    >
      <div className="flex items-center gap-5">
        {/* DB */}
        <div className="flex items-center gap-1.5 text-blue-400">
          <Database className="w-3.5 h-3.5" />
          <span>قاعدة البيانات:</span>
          <span className="font-mono font-bold text-slate-100">{dbName}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* User */}
        <div className="flex items-center gap-1.5 text-amber-400">
          <User className="w-3.5 h-3.5" />
          <span>المستخدم الحركي:</span>
          <span className="font-bold text-slate-100">{currentUser ? `${currentUser.fullName} (${currentUser.jobTitle})` : 'غير مسجل الدخول'}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* Branch */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>الفرع النشط:</span>
          <span className="font-bold text-slate-100">الفرع الرئيسي (الرياض)</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* Warehouse */}
        <div className="flex items-center gap-1.5 text-sky-400">
          <Warehouse className="w-3.5 h-3.5" />
          <span>مستودع الصرف:</span>
          <span className="font-bold text-slate-100">مستودع صالة العرض</span>
        </div>
      </div>

      <div className="flex items-center gap-5 text-slate-400">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-blue-400">
          <Database className="w-3.5 h-3.5" />
          <span>الإصدار:</span>
          <span className="font-mono font-bold text-slate-100 bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600">v12.0.1_Enterprise</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        <div className="flex items-center gap-1 text-green-400 animate-pulse">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          <span>مزامنة مباشرة نشطة</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{today}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-slate-100 font-mono font-bold bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

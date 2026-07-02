import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { Shield, Eye, EyeOff, Lock, User, RefreshCw, X, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const { connectedDbId, databases, loginUser, disconnectDatabase } = useErp();
  
  const activeDb = databases.find(db => db.id === connectedDbId);
  const savedUsername = connectedDbId ? localStorage.getItem(`erp_saved_username_${connectedDbId}`) || '' : '';

  const [username, setUsername] = useState(savedUsername);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!savedUsername);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If username is auto-filled, focus on password field automatically
    if (savedUsername && passwordRef.current) {
      passwordRef.current.focus();
    } else if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [savedUsername]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم.');
      return;
    }
    if (!password) {
      setError('يرجى إدخال كلمة المرور.');
      return;
    }

    const result = loginUser(username, password, remember);
    if (!result.success) {
      setError(result.error || 'خطأ في عملية تسجيل الدخول.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[200] font-sans" dir="rtl">
      <div 
        id="almeezan-login-window"
        className="bg-white border-2 border-slate-700 w-[420px] rounded-lg shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Title Bar (Classic AlMeezan Blue/Slate styling) */}
        <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700 select-none">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="font-extrabold text-[12.5px] tracking-wide">تسجيل دخول المستخدم - الميزان .NET</span>
          </div>
          <button 
            onClick={disconnectDatabase}
            className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
            title="إلغاء الأمر"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Logo and Brand Panel */}
        <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-b border-slate-200 select-none">
          {/* Mock AlMeezan Scale Logo */}
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-sky-500 rounded-full flex items-center justify-center shadow-lg text-white font-extrabold text-xl relative mb-3">
            ⚖️
          </div>
          <h1 className="text-[17px] font-extrabold text-slate-800 tracking-tight">نظام الميزان دوت نت</h1>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">حلول المحاسبة والمستودعات والتخطيط المتكاملة (ERP)</p>
          {activeDb && (
            <div className="mt-2 text-[10.5px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded font-bold border border-blue-200">
              قاعدة البيانات النشطة: <span className="font-mono">{activeDb.name}</span>
            </div>
          )}
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 p-3 rounded text-[12px] text-red-800 flex items-start gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold">فشل الدخول: </span>
                {error}
              </div>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-[12px] font-extrabold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>اسم المستخدم:</span>
            </label>
            <div className="relative">
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم الحساب (مثال: admin)"
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-medium text-slate-800 text-right"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[12px] font-extrabold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>كلمة المرور:</span>
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة مرور الحساب"
                className="w-full bg-white border border-slate-300 rounded pl-10 pr-3 py-1.5 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-mono text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Save Username and Helpers */}
          <div className="flex items-center justify-between pt-1 select-none">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors text-[12px] font-bold">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span>حفظ اسم المستخدم</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium font-mono">الافتراضي: admin / 12345</span>
          </div>

          {/* Form Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            {/* Login button */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-4 rounded text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-lg active:scale-[0.98]"
            >
              <span>تسجيل دخول</span>
            </button>
            
            {/* Cancel/Exit button */}
            <button
              type="button"
              onClick={disconnectDatabase}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold py-2 px-4 rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>إلغاء الأمر</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

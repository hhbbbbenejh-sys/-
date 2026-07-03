import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { 
  Shield, Eye, EyeOff, Lock, User, RefreshCw, X, AlertTriangle, Globe, Database
} from 'lucide-react';

export const Login: React.FC = () => {
  const { connectedDbId, databases, loginUser, disconnectDatabase, currentVersion, theme, language, setLanguage } = useErp();
  
  const activeDb = databases.find(db => db.id === connectedDbId);
  const savedUsername = connectedDbId ? localStorage.getItem(`erp_saved_username_${connectedDbId}`) || '' : '';

  const [username, setUsername] = useState(savedUsername);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!savedUsername);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (savedUsername && passwordRef.current) {
      passwordRef.current.focus();
    } else if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [savedUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم للموظف.');
      return;
    }
    if (!password) {
      setError('يرجى إدخال كلمة مرور الحساب المعتمد.');
      return;
    }

    setIsLoading(true);
    // Simulate slight authentic desktop loading verification
    await new Promise(resolve => setTimeout(resolve, 850));
    
    const result = await loginUser(username, password, remember);
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.error || 'اسم المستخدم أو كلمة المرور غير مطابقة للفرع.');
    }
  };

  const handleForgotPassword = () => {
    alert('يرجى مراجعة إدارة تقنية المعلومات بالشركة لإعادة تعيين كلمة مرور الموظف.');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[200] transition-colors duration-500 overflow-y-auto p-4 select-none ${
      isDark 
        ? 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black' 
        : 'bg-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-slate-200'
    }`} dir="rtl">
      
      {/* Background Decorative Shapes */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[12000ms]" />

      {/* Main Responsive Card Container */}
      <div 
        id="almeezan-login-window"
        className={`w-full max-w-[480px] rounded-2xl shadow-2xl border transition-all duration-300 scale-100 opacity-100 animate-window-open ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 backdrop-blur-xl' 
            : 'bg-white/95 border-slate-200/80 backdrop-blur-xl'
        }`}
      >
        {/* Title Bar (Classic AlMeezan Desktop Frame Style) */}
        <div className={`px-5 py-3.5 flex items-center justify-between border-b rounded-t-2xl ${
          isDark 
            ? 'bg-slate-850 border-slate-800 text-slate-200' 
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="font-extrabold text-[12.5px] tracking-tight">نظام الأمان والتحقق الموحد - الميزان .NET</span>
          </div>
          <button 
            onClick={disconnectDatabase}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title="إلغاء اتصال قاعدة البيانات"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand & Scale Logo Section */}
        <div className={`p-8 text-center flex flex-col items-center border-b ${
          isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          {/* Animated scale container */}
          <div className="relative group select-none">
            <div className="absolute inset-0 bg-blue-600/25 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative w-16 h-16 bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-450 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-2xl mb-4 transform hover:scale-105 transition-all duration-300">
              ⚖️
            </div>
          </div>
          <h1 className={`text-[19px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            الميزان دوت نت <span className="text-blue-500 font-medium">AlMezan.NET</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-1.5 font-bold tracking-wide">
            مؤسسة الميزان للأنظمة البرمجية المبتكرة
          </p>

          {activeDb && (
            <div className={`mt-3 text-[11px] px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 shadow-sm ${
              isDark 
                ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' 
                : 'bg-blue-50 text-blue-850 border-blue-100'
            }`}>
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>قاعدة البيانات:</span>
              <span className="font-mono font-black">{activeDb.name}</span>
            </div>
          )}
        </div>

        {/* Input Form Area */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border-r-4 border-red-500 p-3.5 rounded-lg text-[12px] text-red-700 dark:text-red-400 flex items-start gap-2.5 animate-bounce">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <span className="font-extrabold">خطأ في التحقق: </span>
                {error}
              </div>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className={`text-[12px] font-extrabold flex items-center gap-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <User className="w-4 h-4 text-blue-500" />
              <span>اسم المستخدم للموظف:</span>
            </label>
            <div className="relative">
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم الحساب المعتمد ببطاقة الصلاحيات"
                className={`w-full rounded-xl py-2.5 px-4 text-[13px] font-bold transition-all border outline-none text-right ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[12px] font-extrabold flex items-center gap-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Lock className="w-4 h-4 text-blue-500" />
                <span>كلمة مرور الحساب:</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-500 hover:text-blue-600 font-extrabold text-[11px] transition-colors cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl py-2.5 pl-12 pr-4 text-[13px] transition-all border outline-none font-mono text-left ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15' 
                    : 'bg-slate-50 border-slate-200 text-slate-850 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between pt-1 select-none">
            <label className={`flex items-center gap-2.5 cursor-pointer text-[12px] font-extrabold ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <span>حفظ الحساب على هذا الجهاز</span>
            </label>
            
            {/* Language Selection Toggle */}
            <button
              type="button"
              onClick={() => {
                setLanguage(language === 'ar' ? 'en' : 'ar');
              }}
              className="text-[11px] font-extrabold text-slate-450 hover:text-blue-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
            </button>
          </div>

          {/* Form Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Shield className="w-4 h-4 text-sky-200" />
              )}
              <span>تسجيل الدخول للنظام</span>
            </button>
            
            {/* Cancel/Exit button */}
            <button
              type="button"
              onClick={disconnectDatabase}
              className={`font-black py-2.5 px-4 rounded-xl text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
              <span>إلغاء الاتصال</span>
            </button>
          </div>
        </form>

        {/* Footer / System Meta Details */}
        <div className={`px-8 py-4.5 rounded-b-2xl border-t text-center text-[11px] font-bold select-none ${
          isDark 
            ? 'bg-slate-900/60 border-slate-800 text-slate-500' 
            : 'bg-slate-50 text-slate-450 border-slate-100'
        }`}>
          <div className="flex justify-between items-center">
            <span>برنامج الميزان لإدارة موارد المؤسسات ERP</span>
            <span className="font-mono text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">v{currentVersion}_Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
};

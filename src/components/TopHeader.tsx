import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { translations, LanguageCode, LANGUAGES } from '../utils/translations';
import { THEMES } from '../utils/theme';
import { 
  Clock, Calendar, Search, User, Moon, Sun, Star, Bell, Globe, 
  ChevronDown, Check, Trash2, Database, ShieldAlert, Pin, Laptop, Settings, Calculator
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { 
    currentUser, 
    language, 
    setLanguage, 
    theme, 
    toggleDarkMode, 
    favorites, 
    toggleFavorite,
    notifications, 
    markNotificationRead, 
    clearNotifications,
    openWindow,
    connectedDbId,
    databases
  } = useErp();

  // Time state
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Dropdown states
  const [langOpen, setLangOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for closing on outside click
  const langRef = useRef<HTMLDivElement>(null);
  const favRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Translation helper
  const t = (key: string): string => {
    const dict = translations[key];
    if (!dict) return key;
    return dict[language as LanguageCode] || dict['ar'] || key;
  };

  // Clock updating
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Localized Time string (12-hour format with seconds)
      const locale = language === 'ar' ? 'ar-EG' : 'en-US';
      setCurrentTime(now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));

      // Localized Date string
      setCurrentDate(now.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setLangOpen(false);
      if (favRef.current && !favRef.current.contains(event.target as Node)) setFavOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search filter list
  const searchItems = [
    { type: 'sale_invoice', title: t('salesInvoice'), tags: ['فاتورة', 'مبيعات', 'بيع', 'نقدي', 'آجل', 'فاتورة مبيعات', 'invoice', 'sales'] },
    { type: 'purchase_invoice', title: t('purchaseInvoice'), tags: ['فاتورة', 'مشتريات', 'شراء', 'توريد', 'invoice', 'purchases'] },
    { type: 'sale_return', title: t('salesReturn'), tags: ['مرتجع', 'مبيعات', 'مردود', 'return', 'sales return'] },
    { type: 'purchase_return', title: t('purchaseReturn'), tags: ['مرتجع', 'مشتريات', 'مردود', 'return', 'purchase return'] },
    { type: 'chart_of_accounts', title: t('chartOfAccounts'), tags: ['دليل', 'شجرة', 'حسابات', 'أستاذ', 'شجرة الحسابات', 'chart of accounts', 'ledger'] },
    { type: 'account_card', title: t('accountCard'), tags: ['حساب', 'بطاقة', 'جديد', 'تعريف', 'account card'] },
    { type: 'journal_entry', title: t('journalEntry'), tags: ['سند', 'قيد', 'يومية', 'تسوية', 'journal entry', 'voucher'] },
    { type: 'opening_entry', title: t('openingEntry'), tags: ['قيد', 'افتتاحي', 'ميزانية', 'أول المدة', 'opening balance'] },
    { type: 'item_tree', title: t('itemTree'), tags: ['مواد', 'أصناف', 'مجموعات', 'مخزون', 'شجرة الأصناف', 'items', 'inventory'] },
    { type: 'item_card', title: t('itemCard'), tags: ['مادة', 'صنف', 'بطاقة', 'جديد', 'منتج', 'item card', 'product'] },
    { type: 'price_update', title: t('priceUpdate'), tags: ['أسعار', 'تعديل', 'تحديث', 'تغيير', 'فواتير', 'prices', 'price update'] },
    { type: 'tools_manager', title: t('backupsHistory'), tags: ['نسخ', 'احتياطي', 'صيانة', 'إصلاح', 'سجل', 'backup', 'restore'] },
    { type: 'calculator', title: 'الآلة الحاسبة المحاسبية', tags: ['حاسبة', 'الة حاسبة', 'رياضيات', 'حساب', 'جمع', 'طرح', 'ضرب', 'قسمة', 'calculator', 'calc'] },
    { type: 'about', title: t('about'), tags: ['برنامج', 'حول', 'ترخيص', 'إصدار', 'about', 'version'] }
  ];

  const filteredSearch = searchQuery.trim() === '' ? [] : searchItems.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.tags.some(tag => tag.toLowerCase().includes(q))
    );
  });

  const handleSearchResultClick = (type: string, title: string) => {
    openWindow(type, title);
    setSearchQuery('');
    setSearchFocused(false);
  };

  const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      id="erp-top-header"
      className={`${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-slate-900 text-slate-100'} border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-800'} shadow-md px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 z-50 transition-all duration-300`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Right/Left: Brand and Company Details */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-lg shadow-inner ring-2 ring-amber-400/30 flex items-center justify-center">
          <Database className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-wider text-amber-400 flex items-center gap-1">
            {t('appName')}
            <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded uppercase font-mono tracking-tight font-bold">
              ENT PRO
            </span>
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <span>{t('companyName')}</span>
            <span className="text-slate-600">|</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700 font-mono">
              2026
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Live Interactive Search Engine */}
      <div className="flex-1 max-w-xl mx-0 md:mx-4 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder={t('searchPlaceholder')}
            className={`w-full text-xs font-medium pr-10 pl-4 py-2 rounded-lg bg-slate-800/80 border text-slate-200 placeholder-slate-400 outline-none transition-all ${
              searchFocused 
                ? 'border-amber-400 ring-2 ring-amber-400/20 bg-slate-800 shadow-[0_0_15px_rgba(251,191,36,0.1)]' 
                : 'border-slate-700 hover:border-slate-600'
            }`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Live Search Results */}
        {searchFocused && (searchQuery.trim() !== '') && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[999] p-1 animate-window-open max-h-64 overflow-y-auto">
            {filteredSearch.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <div className="px-2.5 py-1 text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                  نتائج بحث الشاشات والعمليات ({filteredSearch.length})
                </div>
                {filteredSearch.map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleSearchResultClick(item.type, item.title)}
                    className="w-full text-right px-3 py-2 text-xs font-semibold rounded hover:bg-slate-700 text-slate-100 flex items-center justify-between transition-colors"
                  >
                    <span>{item.title}</span>
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700">
                      فتح النافذة
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-bold">
                لا توجد نتائج مطابقة لمصطلح البحث. جرب كتابة "فاتورة" أو "مادة" أو "حساب".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Left: Metadata, Actions, Clock */}
      <div className="flex items-center justify-end gap-3 shrink-0">
        
        {/* Large Digital Clock & Date */}
        <div className="hidden lg:flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-1 shadow-inner font-sans">
          <div className="p-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[14px] font-extrabold text-amber-300 tracking-wider">
              {currentTime || '00:00:00'}
            </span>
            <span className="text-[9px] text-slate-400 font-bold tracking-tight">
              {currentDate || 'اليوم'}
            </span>
          </div>
        </div>

        {/* User Badging */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/50 border border-slate-800 rounded-lg px-2.5 py-1">
            <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100 leading-none">
                {currentUser.fullName}
              </span>
              <span className="text-[9px] text-amber-400 font-medium mt-0.5">
                {currentUser.jobTitle}
              </span>
            </div>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse border border-slate-900"></span>
          </div>
        )}

        {/* Action Widgets */}
        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-1.5">
          
          {/* Favorites Dropdown */}
          <div className="relative" ref={favRef}>
            <button
              onClick={() => setFavOpen(!favOpen)}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 transition-all"
              title={t('favorites_menu')}
            >
              <Star className="w-4 h-4" />
            </button>
            {favOpen && (
              <div className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[999] p-1 animate-window-open`}>
                <div className="px-2.5 py-1.5 border-b border-slate-700 text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>الوصول السريع للمفضلة</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1 max-h-60 overflow-y-auto">
                  {favorites.length === 0 ? (
                    <div className="p-3 text-center text-[10px] text-slate-400">
                      قائمة المفضلة فارغة حالياً. يمكنك تفضيل الشاشات.
                    </div>
                  ) : (
                    favorites.map(favType => {
                      const match = searchItems.find(item => item.type === favType);
                      if (!match) return null;
                      return (
                        <button
                          key={favType}
                          onClick={() => {
                            openWindow(favType, match.title);
                            setFavOpen(false);
                          }}
                          className="w-full text-right px-2.5 py-1.5 text-xs font-semibold rounded hover:bg-slate-700 text-slate-100 flex items-center gap-2"
                        >
                          <Pin className="w-3 h-3 text-amber-400 rotate-45" />
                          <span className="truncate">{match.title}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Trigger */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all relative"
              title={t('notificationsCenter')}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[999] p-1.5 animate-window-open`}>
                <div className="px-2.5 py-1.5 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] text-slate-200 font-bold flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-400" />
                    الإشعارات الواردة
                  </span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-0.5 font-bold"
                    >
                      <Trash2 className="w-3 h-3" />
                      مسح الكل
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 mt-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      لا توجد إشعارات أو تنبيهات جديدة.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-2 rounded cursor-pointer transition-colors border ${
                          notif.read 
                            ? 'bg-slate-800/30 border-slate-800 text-slate-400' 
                            : 'bg-slate-750 border-slate-700 text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold block truncate pr-1">
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-300 mt-1 leading-normal">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Languages Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1"
              title="تغيير لغة النظام"
            >
              <Globe className="w-4 h-4" />
              <span className="text-[9px] font-extrabold uppercase text-slate-400">
                {language}
              </span>
            </button>
            {langOpen && (
              <div className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[999] p-1 animate-window-open`}>
                <div className="px-2.5 py-1.5 border-b border-slate-700 text-[10px] text-slate-400 font-bold">
                  اختيار اللغة / Select Language
                </div>
                <div className="flex flex-col gap-0.5 mt-1 max-h-60 overflow-y-auto">
                  {LANGUAGES.map(langItem => (
                    <button
                      key={langItem.code}
                      onClick={() => {
                        setLanguage(langItem.code);
                        setLangOpen(false);
                      }}
                      className="w-full text-right px-2.5 py-1.5 text-xs font-semibold rounded hover:bg-slate-700 text-slate-100 flex items-center justify-between"
                    >
                      <span>{langItem.nativeName}</span>
                      {language === langItem.code && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Calculator Trigger */}
          <button
            onClick={() => openWindow('calculator', 'الآلة الحاسبة المحاسبية')}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition-all"
            title="الآلة الحاسبة المحاسبية"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {/* Dark Mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition-all"
            title="تفعيل الوضع المضيء / المظلم"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

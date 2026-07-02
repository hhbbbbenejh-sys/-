export type ThemeType = 'blue' | 'green' | 'dark' | 'light' | 'gray' | 'custom';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  nameAr: string;
  primaryBg: string;
  primaryText: string;
  headerBg: string;
  statusBarBg: string;
  workspaceBg: string;
  cardBg: string;
  textMuted: string;
  accentColor: string;
  borderClass: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'blue',
    name: 'Classic Blue',
    nameAr: 'الأزرق الكلاسيكي المعتمد',
    primaryBg: 'bg-blue-600',
    primaryText: 'text-blue-600',
    headerBg: 'bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900',
    statusBarBg: 'bg-slate-900',
    workspaceBg: 'bg-slate-100',
    cardBg: 'bg-white',
    textMuted: 'text-slate-500',
    accentColor: '#2563eb',
    borderClass: 'border-blue-600'
  },
  {
    id: 'green',
    name: 'Modern Emerald',
    nameAr: 'الأخضر الزمردي الحديث',
    primaryBg: 'bg-emerald-600',
    primaryText: 'text-emerald-600',
    headerBg: 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900',
    statusBarBg: 'bg-slate-950',
    workspaceBg: 'bg-slate-50',
    cardBg: 'bg-white',
    textMuted: 'text-slate-500',
    accentColor: '#059669',
    borderClass: 'border-emerald-600'
  },
  {
    id: 'dark',
    name: 'Enterprise Charcoal',
    nameAr: 'الوضع الليلي الفاخر (داكن)',
    primaryBg: 'bg-zinc-800',
    primaryText: 'text-zinc-100',
    headerBg: 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-neutral-950',
    statusBarBg: 'bg-neutral-950',
    workspaceBg: 'bg-zinc-950',
    cardBg: 'bg-zinc-900',
    textMuted: 'text-zinc-400',
    accentColor: '#3f3f46',
    borderClass: 'border-zinc-700'
  },
  {
    id: 'light',
    name: 'Clean Slate',
    nameAr: 'الملف الأبيض الناصع (فاتح)',
    primaryBg: 'bg-slate-200',
    primaryText: 'text-slate-800',
    headerBg: 'bg-gradient-to-r from-slate-100 to-slate-200',
    statusBarBg: 'bg-slate-300',
    workspaceBg: 'bg-slate-100',
    cardBg: 'bg-white',
    textMuted: 'text-slate-600',
    accentColor: '#64748b',
    borderClass: 'border-slate-300'
  },
  {
    id: 'gray',
    name: 'Industrial Silver',
    nameAr: 'الرمادي المعدني الصناعي',
    primaryBg: 'bg-gray-600',
    primaryText: 'text-gray-600',
    headerBg: 'bg-gradient-to-r from-gray-800 via-gray-700 to-slate-800',
    statusBarBg: 'bg-gray-900',
    workspaceBg: 'bg-slate-100',
    cardBg: 'bg-white',
    textMuted: 'text-slate-500',
    accentColor: '#4b5563',
    borderClass: 'border-gray-600'
  },
  {
    id: 'custom',
    name: 'Custom Palette',
    nameAr: 'لوحة الألوان المخصصة',
    primaryBg: 'bg-blue-600',
    primaryText: 'text-blue-600',
    headerBg: 'bg-gradient-to-r from-slate-900 to-slate-800',
    statusBarBg: 'bg-slate-950',
    workspaceBg: 'bg-slate-100',
    cardBg: 'bg-white',
    textMuted: 'text-slate-500',
    accentColor: '#3b82f6',
    borderClass: 'border-blue-500'
  }
];

export const FONTS = [
  { id: 'Cairo', name: 'خط القاهرة (Cairo)' },
  { id: 'Tajawal', name: 'خط تجول (Tajawal)' },
  { id: 'Almarai', name: 'خط المراعي (Almarai)' },
  { id: 'Inter', name: 'خط إنتر العالمي (Inter)' },
  { id: 'JetBrains Mono', name: 'خط البرمجة الأحادي (JetBrains Mono)' },
  { id: 'Space Grotesk', name: 'خط سبايس غروتك (Space Grotesk)' }
];

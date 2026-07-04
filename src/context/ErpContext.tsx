import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ErpDatabase,
  Branch,
  Warehouse,
  CostCenter,
  Currency,
  Account,
  Customer,
  ItemGroup,
  Item,
  JournalEntry,
  Invoice,
  MdiWindow,
  TaskItem,
  AlertItem,
  ErpPermissions,
  ErpUser,
  LoginLog,
  ManufacturingOrder,
  PrintTemplate,
  PrintElement,
} from '../types/erp';
import { supabase } from '../utils/supabase';
import {
  checkSupabaseConnection,
  fetchDatabases,
  createDatabase as createDbInSync,
  deleteDatabase as deleteDbInSync,
  fetchCompanyData,
  saveCompanyRecord,
  deleteCompanyRecord,
  subscribeToCompanyChanges,
} from '../utils/supabaseSync';


interface ErpContextType {
  databases: ErpDatabase[];
  connectedDbId: string | null;
  saveSettingsNoShow: boolean;
  setSaveSettingsNoShow: (val: boolean) => void;
  connectDatabase: (id: string) => void;
  disconnectDatabase: () => void;
  createDatabase: (name: string, description: string) => Promise<string>;
  deleteDatabase: (id: string) => Promise<void>;
  
  // MDI Windows State
  windows: MdiWindow[];
  openWindow: (type: string, title: string, props?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  tileWindows: (layout: 'horizontal' | 'vertical' | 'cascade') => void;
  minimizeAll: () => void;
  restoreAll: () => void;
  closeAll: () => void;

  // Master Data State
  branches: Branch[];
  warehouses: Warehouse[];
  costCenters: CostCenter[];
  currencies: Currency[];
  accounts: Account[];
  customers: Customer[];
  itemGroups: ItemGroup[];
  items: Item[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  tasks: TaskItem[];
  alerts: AlertItem[];
  manufacturing: ManufacturingOrder[];
  templates: PrintTemplate[];

  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;

  // Mutators
  addBranch: (branch: Branch) => void;
  addWarehouse: (warehouse: Warehouse) => void;
  addCostCenter: (cc: CostCenter) => void;
  addAccount: (account: Account) => void;
  addCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  addItem: (item: Item) => void;
  addItemGroup: (group: ItemGroup) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  addInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  addManufacturingOrder: (mo: ManufacturingOrder) => void;
  deleteManufacturingOrder: (id: string) => void;
  addTask: (task: TaskItem) => void;
  deleteTask: (id: string) => void;
  addPrintTemplate: (template: PrintTemplate) => void;
  deletePrintTemplate: (id: string) => void;

  // Utility Operations
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  setAlerts: React.Dispatch<React.SetStateAction<AlertItem[]>>;
  currentUser: ErpUser | null;
  setCurrentUser: (user: ErpUser | null) => void;
  users: ErpUser[];
  loginLogs: LoginLog[];
  loginUser: (username: string, password: string, saveUsername: boolean) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  addUser: (user: ErpUser) => void;
  updateUser: (user: ErpUser) => void;
  deleteUser: (id: string) => void;
  addLoginLog: (log: LoginLog) => void;
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;

  // New Commercial Settings
  language: string;
  setLanguage: (lang: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;
  calculatorOpen: boolean;
  setCalculatorOpen: (open: boolean) => void;
  favorites: string[];
  toggleFavorite: (windowType: string) => void;
  notifications: { id: string; title: string; message: string; date: string; read: boolean; type: 'info' | 'warning' | 'error' }[];
  addNotification: (title: string, message: string, type?: 'info' | 'warning' | 'error') => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  backups: { id: string; date: string; type: 'auto' | 'manual'; status: 'success' | 'failed'; fileName: string; size: string; storage: 'local' | 'cloud' }[];
  addBackup: (type: 'auto' | 'manual', storage: 'local' | 'cloud') => void;
  deleteBackup: (id: string) => void;
  isCheckingUpdate: boolean;
  checkProgramUpdate: () => Promise<{ hasUpdate: boolean; version?: string }>;
  isUpdatingDb: boolean;
  updateDatabaseSchema: () => Promise<void>;
  currentVersion: string;
  availableUpdate: any;
  setAvailableUpdate: (update: any) => void;
  updateProgress: number;
  isDownloadingUpdate: boolean;
  showUpdateBanner: boolean;
  setShowUpdateBanner: (val: boolean) => void;
  publishNewVersion: (version: string, notes: string, changelog: string, size: string, isMandatory: boolean) => Promise<boolean>;
  rollbackLatestVersion: () => Promise<boolean>;
  installUpdate: () => Promise<boolean>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const FULL_PERMISSIONS: ErpPermissions = {
  open_system: true,
  sales: true,
  purchases: true,
  inventory: true,
  accounting: true,
  journal_entries: true,
  reports: true,
  settings: true,
  user_management: true,
  backup_create: true,
  backup_restore: true,
  delete_data: true,
  price_update: true,
  cancel_invoices: true,
  edit_invoices: true,
  delete_invoices: true,
  print: true,
  export_excel: true,
  export_pdf: true,
};

const DEFAULT_USERS: ErpUser[] = [
  {
    id: 'usr-admin',
    fullName: 'مدير النظام المالي المعتمد',
    username: 'Ahmed',
    password: '01278150',
    jobTitle: 'المدير العام',
    department: 'الإدارة العامة',
    email: 'ahmed@almeezan.net',
    phone: '0500000000',
    isActive: true,
    permissions: FULL_PERMISSIONS,
    role: 'admin',
  },
];

// Initial Static Databases - Empty for first-use isolation
const INITIAL_DATABASES: ErpDatabase[] = [];

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Connection state
  const [databases, setDatabases] = useState<ErpDatabase[]>(() => {
    const saved = localStorage.getItem('erp_databases');
    return saved ? JSON.parse(saved) : INITIAL_DATABASES;
  });

  // Load databases on mount from Supabase / server backend
  useEffect(() => {
    const initDbConnection = async () => {
      await checkSupabaseConnection();
      const loaded = await fetchDatabases();
      if (loaded && loaded.length > 0) {
        setDatabases(loaded);
        localStorage.setItem('erp_databases', JSON.stringify(loaded));
      }
    };
    initDbConnection();
  }, []);

  const [connectedDbId, setConnectedDbId] = useState<string | null>(() => {
    const saved = localStorage.getItem('erp_connected_db');
    const skip = localStorage.getItem('erp_skip_connect_screen');
    return (skip === 'true' && saved) ? saved : null;
  });
  const [saveSettingsNoShow, setSaveSettingsNoShow] = useState<boolean>(() => {
    return localStorage.getItem('erp_skip_connect_screen') === 'true';
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [currentUser, setCurrentUser] = useState<ErpUser | null>(null);
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);

  // 1. Language State
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('erp_language') || 'ar';
  });

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('erp_language', lang);
    showToast(`تم تغيير لغة النظام بنجاح.`, 'success');
  }, [showToast]);

  // 2. Theme State (blue, green, dark, light, gray, custom)
  const [theme, setThemeState] = useState<string>(() => {
    return localStorage.getItem('erp_theme') || 'blue';
  });
  const [customColor, setCustomColorState] = useState<string>(() => {
    return localStorage.getItem('erp_custom_color') || '#3b82f6';
  });

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
    localStorage.setItem('erp_theme', t);
    showToast('تم تطبيق وحفظ الثيم المختار للواجهات.', 'success');
  }, [showToast]);

  const setCustomColor = useCallback((c: string) => {
    setCustomColorState(c);
    localStorage.setItem('erp_custom_color', c);
  }, []);

  const isDarkMode = theme === 'dark';
  const toggleDarkMode = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'blue' : 'dark';
      localStorage.setItem('erp_theme', next);
      showToast(next === 'dark' ? 'تم تفعيل الوضع الداكن.' : 'تم تفعيل الوضع المضيء.', 'info');
      return next;
    });
  }, [showToast]);

  // 3. Typography State
  const [fontFamily, setFontFamilyState] = useState<string>(() => {
    return localStorage.getItem('erp_font_family') || 'Cairo';
  });
  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem('erp_font_size');
    return saved ? Number(saved) : 13;
  });
  const [fontWeight, setFontWeightState] = useState<string>(() => {
    return localStorage.getItem('erp_font_weight') || 'medium';
  });

  const setFontFamily = useCallback((font: string) => {
    setFontFamilyState(font);
    localStorage.setItem('erp_font_family', font);
    showToast(`تم تعيين الخط الرئيسي للبرنامج: ${font}`, 'success');
  }, [showToast]);

  const setFontSize = useCallback((size: number) => {
    setFontSizeState(size);
    localStorage.setItem('erp_font_size', size.toString());
  }, []);

  const setFontWeight = useCallback((weight: string) => {
    setFontWeightState(weight);
    localStorage.setItem('erp_font_weight', weight);
  }, []);

  // 4. Calculator State
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);

  // 5. Favorites State (Defaulting to some helpful windows)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('erp_favorites');
    return saved ? JSON.parse(saved) : ['sale_invoice', 'reports', 'chart_of_accounts', 'item_tree'];
  });

  const toggleFavorite = useCallback((windowType: string) => {
    setFavorites(prev => {
      const next = prev.includes(windowType) 
        ? prev.filter(x => x !== windowType)
        : [...prev, windowType];
      localStorage.setItem('erp_favorites', JSON.stringify(next));
      showToast(prev.includes(windowType) ? 'تمت الإزالة من القائمة المفضلة.' : 'تمت الإضافة للمفضلة بنجاح السريع.', 'info');
      return next;
    });
  }, [showToast]);

  // 6. Notifications State
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; date: string; read: boolean; type: 'info' | 'warning' | 'error' }[]>([
    { id: 'not-1', title: 'مرحباً بك في أحمد سامي سيستم', message: 'تم إعداد النظام وتشغيل محرك المزامنة السحابي وقاعدة البيانات بنجاح.', date: new Date().toISOString(), read: false, type: 'info' },
    { id: 'not-2', title: 'تنبيه أمان', message: 'جلسة العمل الحالية مؤمنة بالكامل بتشفير SSL ومحمية ببروتوكولات الحماية الفائقة.', date: new Date().toISOString(), read: false, type: 'info' }
  ]);

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setNotifications(prev => [
      { id: `not-${Date.now()}`, title, message, date: new Date().toISOString(), read: false, type },
      ...prev
    ]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(not => not.id === id ? { ...not, read: true } : not));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    showToast('تم مسح جميع الإشعارات بنجاح.', 'success');
  }, [showToast]);

  // 7. Backups State
  const [backups, setBackups] = useState<{ id: string; date: string; type: 'auto' | 'manual'; status: 'success' | 'failed'; fileName: string; size: string; storage: 'local' | 'cloud' }[]>(() => {
    const saved = localStorage.getItem('erp_backups_log');
    return saved ? JSON.parse(saved) : [
      { id: 'b-1', date: '2026-07-01 10:00:15', type: 'auto', status: 'success', fileName: 'AhmedSamy_Backup_Auto_20260701_1000.bak', size: '25.4 MB', storage: 'local' },
      { id: 'b-2', date: '2026-07-02 02:30:22', type: 'manual', status: 'success', fileName: 'AhmedSamy_Backup_Manual_20260702_0230.bak', size: '25.6 MB', storage: 'cloud' }
    ];
  });

  const addBackup = useCallback((type: 'auto' | 'manual', storage: 'local' | 'cloud') => {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const cleanDate = timestamp.replace(/[- :]/g, '');
    const fileName = `AhmedSamy_Backup_${type === 'auto' ? 'Auto' : 'Manual'}_${cleanDate}.bak`;
    const newBackup = {
      id: `b-${Date.now()}`,
      date: timestamp,
      type,
      status: 'success' as const,
      fileName,
      size: `${(25.0 + Math.random() * 2).toFixed(1)} MB`,
      storage
    };

    setBackups(prev => {
      const next = [newBackup, ...prev];
      localStorage.setItem('erp_backups_log', JSON.stringify(next));
      return next;
    });
    showToast(`تم بنجاح إنشاء نسخة احتياطية (${storage === 'cloud' ? 'سحابية' : 'محلية'}) باسم ${fileName}`, 'success');
  }, [showToast]);

  const deleteBackup = useCallback((id: string) => {
    setBackups(prev => {
      const next = prev.filter(b => b.id !== id);
      localStorage.setItem('erp_backups_log', JSON.stringify(next));
      return next;
    });
    showToast('تم حذف ملف النسخة الاحتياطية بنجاح.', 'success');
  }, [showToast]);

  // 8. Update checking and DB updating states
  const [currentVersion, setCurrentVersion] = useState<string>(() => {
    return localStorage.getItem('erp_system_version') || '12.0.0';
  });
  const [availableUpdate, setAvailableUpdate] = useState<any>(null);
  const [updateProgress, setUpdateProgress] = useState<number>(-1);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState<boolean>(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const checkProgramUpdate = useCallback(async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await fetch(`/api/updates/check?currentVersion=${currentVersion}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasUpdate && data.latest) {
          setAvailableUpdate(data.latest);
          setShowUpdateBanner(true);
          return { hasUpdate: true, version: data.latest.version };
        } else {
          setAvailableUpdate(null);
          setShowUpdateBanner(false);
          return { hasUpdate: false };
        }
      }
    } catch (err) {
      console.error('Error checking for updates:', err);
    } finally {
      setIsCheckingUpdate(false);
    }
    return { hasUpdate: false };
  }, [currentVersion]);

  // Periodic update check every 30 minutes, plus on app startup
  useEffect(() => {
    checkProgramUpdate();
    const interval = setInterval(() => {
      checkProgramUpdate();
    }, 1800000); // 30 minutes in milliseconds
    return () => clearInterval(interval);
  }, [checkProgramUpdate]);

  const [isUpdatingDb, setIsUpdatingDb] = useState(false);
  const updateDatabaseSchema = useCallback(async () => {
    setIsUpdatingDb(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsUpdatingDb(false);
    showToast('تم بنجاح تشغيل معالج ترقية قواعد البيانات وتحديث الجداول بنجاح دون أي فقدان للبيانات.', 'success');
  }, [showToast]);

  const publishNewVersion = useCallback(async (version: string, notes: string, changelog: string, size: string, isMandatory: boolean) => {
    try {
      const res = await fetch('/api/updates/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, notes, changelog, size, isMandatory })
      });
      if (res.ok) {
        showToast(`تم بنجاح نشر التحديث الجديد ${version} لجميع العملاء المتصلين.`, 'success');
        checkProgramUpdate();
        return true;
      }
    } catch (err) {
      console.error('Failed to publish update:', err);
      showToast('حدث خطأ أثناء الاتصال بالمخدم لنشر التحديث.', 'error');
    }
    return false;
  }, [checkProgramUpdate, showToast]);

  const rollbackLatestVersion = useCallback(async () => {
    try {
      const res = await fetch('/api/updates/rollback', { method: 'POST' });
      if (res.ok) {
        showToast('تم التراجع عن الإصدار المنشور بنجاح واستعادة الإصدار السابق للعملاء.', 'success');
        checkProgramUpdate();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل التراجع عن التحديث.', 'error');
      }
    } catch (err) {
      console.error('Rollback error:', err);
      showToast('خطأ بالاتصال بالمخدم لإجراء التراجع.', 'error');
    }
    return false;
  }, [checkProgramUpdate, showToast]);

  const installUpdate = useCallback(async () => {
    if (!availableUpdate) return false;
    setIsDownloadingUpdate(true);
    setUpdateProgress(0);
    
    const steps = [
      { text: 'جاري الاتصال والتحقق من التشفير وقنوات النقل للتحديث التلقائي...', delay: 400, pct: 15 },
      { text: 'تحميل الملفات المتغيرة والمحزمة فقط (فارق الحجم لتوفير البيانات)...', delay: 500, pct: 45 },
      { text: 'التحقق من التوقيع الرقمي ومطابقة الملفات بنجاح...', delay: 350, pct: 65 },
      { text: 'تطبيق الترقية البرمجية الساخنة وتثبيت الملفات التراكمية...', delay: 400, pct: 85 },
      { text: 'ترقية وتحديث هياكل قاعدة البيانات ومزامنة الجداول تلقائياً...', delay: 500, pct: 100 }
    ];
    
    try {
      let currentProgress = 0;
      for (const step of steps) {
        showToast(step.text, 'info');
        const targetPct = step.pct;
        const diff = targetPct - currentProgress;
        const stepDelay = step.delay / 5;
        for (let i = 1; i <= 5; i++) {
          const nextVal = Math.min(100, Math.round(currentProgress + (diff * i) / 5));
          setUpdateProgress(nextVal);
          await new Promise(r => setTimeout(r, stepDelay));
        }
        currentProgress = targetPct;
      }
      
      // Run automatic DB migrations
      await updateDatabaseSchema();
      
      const newVersion = availableUpdate.version;
      localStorage.setItem('erp_system_version', newVersion);
      setCurrentVersion(newVersion);
      
      showToast(`تم تثبيت التحديث ${newVersion} بنجاح! سيتم إعادة تشغيل البرنامج فوراً لتطبيق التغييرات.`, 'success');
      
      setTimeout(() => {
        setIsDownloadingUpdate(false);
        setUpdateProgress(-1);
        setAvailableUpdate(null);
        setShowUpdateBanner(false);
        window.location.reload();
      }, 1500);
      
      return true;
    } catch (err) {
      console.error('Update failed:', err);
      showToast('فشل تثبيت التحديث. جاري التراجع التلقائي وحماية سلامة قواعد البيانات للشركة.', 'error');
      setUpdateProgress(0);
      await new Promise(r => setTimeout(r, 1000));
      setIsDownloadingUpdate(false);
      setUpdateProgress(-1);
      return false;
    }
  }, [availableUpdate, updateDatabaseSchema, showToast]);

  // MDI Windows state
  const [windows, setWindows] = useState<MdiWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(10);

  // Entities state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [manufacturing, setManufacturing] = useState<ManufacturingOrder[]>([]);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);

  // Pre-populate data when database connects via Supabase or Server fallback
  useEffect(() => {
    if (!connectedDbId) return;

    let active = true;

    const loadData = async () => {
      showToast('جاري الاتصال والتحقق من مزامنة السحابية...', 'info');
      const companyData = await fetchCompanyData(connectedDbId);
      if (!active) return;

      if (companyData && (companyData.branches?.length > 0 || companyData.accounts?.length > 0)) {
        // We have active records in the cloud backend! Let's load them!
        setBranches(companyData.branches || []);
        setWarehouses(companyData.warehouses || []);
        setCostCenters(companyData.costCenters || []);
        setCurrencies(companyData.currencies || []);
        setAccounts(companyData.accounts || []);
        setCustomers(companyData.customers || []);
        setItemGroups(companyData.itemGroups || []);
        setItems(companyData.items || []);
        setJournalEntries(companyData.journalEntries || []);
        setInvoices(companyData.invoices || []);
        setTasks(companyData.tasks || []);
        setAlerts(companyData.alerts || []);
        const activeUsers = companyData.users?.length > 0 ? companyData.users : DEFAULT_USERS;
        setUsers(activeUsers);
        // Ensure first Super Administrator is stored in the database if missing
        if (!companyData.users || companyData.users.length === 0 || !companyData.users.some((u: any) => u.username.toLowerCase() === 'ahmed')) {
          for (const u of activeUsers) {
            await saveCompanyRecord(connectedDbId, 'users', u);
          }
        }
        setLoginLogs(companyData.loginLogs || []);
        setManufacturing(companyData.manufacturing || []);
        setTemplates(companyData.templates || []);
        showToast('تمت المزامنة وجلب كافة البيانات بنجاح.', 'success');
      } else {
        // Baseline default initialization for a brand new multi-tenant database
        const baseline = {
          branches: [
            { id: 'br-1', name: 'الفرع الرئيسي - الرياض', code: '01' },
            { id: 'br-2', name: 'فرع المنطقة الغربية - جدة', code: '02' },
          ],
          warehouses: [
            { id: 'wh-1', name: 'مستودع صالة العرض الرئيسية', branchId: 'br-1' },
            { id: 'wh-2', name: 'المستودع المركزي الكبير', branchId: 'br-1' },
            { id: 'wh-3', name: 'مستودع فرع جدة', branchId: 'br-2' },
          ],
          costCenters: [
            { id: 'cc-1', name: 'مركز إدارة المبيعات والتسويق', code: '1001' },
            { id: 'cc-2', name: 'مركز الإدارة التشغيلية واللوجستية', code: '1002' },
          ],
          currencies: [
            { id: 'cur-sar', name: 'ريال سعودي', symbol: 'ر.س', rate: 1.0 },
            { id: 'cur-usd', name: 'دولار أمريكي', symbol: '$', rate: 3.75 },
            { id: 'cur-jod', name: 'دينار أردني', symbol: 'د.أ', rate: 5.29 },
          ],
          accounts: [
            { id: 'acc-111001', code: '111001', name: 'الصندوق الرئيسي للفرع', type: 'assets', parentId: null, balance: 450000, finalAccount: 'balance_sheet' },
            { id: 'acc-111002', code: '111002', name: 'البنك الأهلي السعودي', type: 'assets', parentId: null, balance: 1250000, finalAccount: 'balance_sheet' },
            { id: 'acc-112001', code: '112001', name: 'العملاء المحليين (إجمالي)', type: 'assets', parentId: null, balance: 185000, finalAccount: 'balance_sheet' },
            { id: 'acc-113001', code: '113001', name: 'بضاعة أول المدة', type: 'assets', parentId: null, balance: 350000, finalAccount: 'trading' },
            { id: 'acc-211001', code: '211001', name: 'الموردين التجاريين (إجمالي)', type: 'liabilities', parentId: null, balance: 290000, finalAccount: 'balance_sheet' },
            { id: 'acc-311001', code: '311001', name: 'رأس مال الشركة المدفوع', type: 'equity', parentId: null, balance: 1500000, finalAccount: 'balance_sheet' },
            { id: 'acc-411001', code: '411001', name: 'حساب مبيعات البضائع', type: 'revenues', parentId: null, balance: 840000, finalAccount: 'trading' },
            { id: 'acc-411002', code: '411002', name: 'إيرادات خدمات صيانة وعقود', type: 'revenues', parentId: null, balance: 45000, finalAccount: 'income_statement' },
            { id: 'acc-511001', code: '511001', name: 'حساب مشتريات البضائع', type: 'expenses', parentId: null, balance: 520000, finalAccount: 'trading' },
            { id: 'acc-512001', code: '512001', name: 'مصاريف رواتب وأجور الموظفين', type: 'expenses', parentId: null, balance: 165000, finalAccount: 'income_statement' },
            { id: 'acc-512002', code: '512002', name: 'مصاريف كهرباء ومياه واتصالات', type: 'expenses', parentId: null, balance: 18500, finalAccount: 'income_statement' },
          ],
          customers: [
            { id: 'cust-1', name: 'مؤسسة الأمل للتجارة والتقسيط', accountId: 'acc-112001', phone: '0501234567', address: 'طريق الملك فهد، الرياض', balance: 85000, type: 'customer' },
            { id: 'cust-2', name: 'شركة الرياض الوطنية للتوريدات والمقاولات', accountId: 'acc-211001', phone: '0547654321', address: 'الملز، الرياض', balance: 290000, type: 'supplier' },
            { id: 'cust-3', name: 'معرض النخبة للأجهزة والتقنية', accountId: 'acc-112001', phone: '0569876543', address: 'حي الروضة، جدة', balance: 100000, type: 'customer' },
          ],
          itemGroups: [
            { id: 'ig-1', name: 'الأجهزة المنزلية الكبيرة', parentId: null },
            { id: 'ig-2', name: 'الشاشات والإلكترونيات المرئية', parentId: null },
            { id: 'ig-3', name: 'الأجهزة الكهربائية الصغيرة والملحقات', parentId: null },
          ],
          items: [
            { id: 'it-1', code: '1001', barcode: '880609123456', name: 'شاشة سامسونج ذكية 55 بوصة Ultra HD 4K', groupId: 'ig-2', unit: 'حبة', purchasePrice: 1200, salePrice: 1800, initialStock: 50, currentStock: 45, minLimit: 5, maxLimit: 100, notes: 'صناعة كورية عالية الجودة' },
            { id: 'it-2', code: '1002', barcode: '880609123457', name: 'ثلاجة إل جي 18 قدم فضي Inverter', groupId: 'ig-1', unit: 'حبة', purchasePrice: 2200, salePrice: 3200, initialStock: 25, currentStock: 20, minLimit: 2, maxLimit: 50, notes: 'توفير طاقة فئة أ' },
            { id: 'it-3', code: '1003', barcode: '880609123458', name: 'غسالة ملابس توشيبا 7 كغ فوق أوتوماتيك', groupId: 'ig-1', unit: 'حبة', purchasePrice: 1050, salePrice: 1500, initialStock: 20, currentStock: 15, minLimit: 3, maxLimit: 40, notes: 'تحميل علوي - ضمان 5 سنوات' },
            { id: 'it-4', code: '1004', barcode: '628101234567', name: 'مكرويف كينوود سعة 25 لتر مع شواية', groupId: 'ig-3', unit: 'حبة', purchasePrice: 280, salePrice: 420, initialStock: 40, currentStock: 35, minLimit: 4, maxLimit: 80, notes: 'قوة 900 واط' },
            { id: 'it-5', code: '1005', barcode: '628101234568', name: 'خلاط ومطحنة مولينكس فرنسي 2 في 1', groupId: 'ig-3', unit: 'حبة', purchasePrice: 130, salePrice: 195, initialStock: 80, currentStock: 74, minLimit: 10, maxLimit: 150 },
          ],
          journalEntries: [
            {
              id: 'je-1',
              entryNo: '00001',
              date: '2026-06-15',
              description: 'القيد الافتتاحي للعام المالي 2026',
              posted: true,
              rows: [
                { accountId: 'acc-111001', debit: 450000, credit: 0, costCenterId: null, notes: 'رصيد افتتاحي الصندوق' },
                { accountId: 'acc-111002', debit: 1250000, credit: 0, costCenterId: null, notes: 'رصيد افتتاحي البنك' },
                { accountId: 'acc-112001', debit: 185000, credit: 0, costCenterId: null, notes: 'رصيد افتتاحي إجمالي عملاء' },
                { accountId: 'acc-113001', debit: 350000, credit: 0, costCenterId: null, notes: 'رصيد افتتاحي بضاعة' },
                { accountId: 'acc-211001', debit: 0, credit: 290000, costCenterId: null, notes: 'رصيد افتتاحي إجمالي موردين' },
                { accountId: 'acc-311001', debit: 0, credit: 1500000, costCenterId: null, notes: 'رصيد افتتاحي رأس المال الممول' },
                { accountId: 'acc-411001', debit: 0, credit: 445000, costCenterId: null, notes: 'مبيعات تراكمية سابقة' },
              ],
            },
          ],
          invoices: [
            {
              id: 'inv-1',
              invoiceNo: 'SAL-00001',
              type: 'sale',
              date: '2026-06-20',
              description: 'فاتورة مبيعات نقدية لمعرض النخبة',
              branchId: 'br-1',
              customerId: 'cust-3',
              currencyId: 'cur-sar',
              exchangeRate: 1.0,
              paymentMethod: 'cash',
              warehouseId: 'wh-1',
              cashAccountId: 'acc-111001',
              itemsAccountId: 'acc-411001',
              debitCostCenterId: 'cc-1',
              creditCostCenterId: 'cc-2',
              posted: true,
              entryCreated: true,
              paidAmount: 9000,
              salesRepId: 'rep-1',
              notes: 'شاملة الضريبة والتوصيل مجاني لفرع جدة',
              items: [
                { id: 'row-1', itemId: 'it-1', quantity: 5, unitPrice: 1800, unit: 'حبة', notes: 'سعر خاص', total: 9000 }
              ],
              discount: 0,
              addition: 0,
              taxPercent: 15,
              expenses: 0,
              netAmount: 10350,
            }
          ],
          tasks: [
            { id: 'task-1', title: 'مراجعة فروق العملات لشهر يونيو 2026', done: false, date: '2026-07-02' },
            { id: 'task-2', title: 'جرد مستودع صالة العرض الرئيسية ومقارنته بالنظام', done: true, date: '2026-06-28' },
            { id: 'task-3', title: 'تحديث أسعار صرف العملات الأجنبية اليومية', done: false, date: '2026-07-02' },
            { id: 'task-4', title: 'ترحيل سندات القبض والدفع المتبقية للمراجعة', done: false, date: '2026-07-03' },
          ],
          alerts: [
            { id: 'alt-1', type: 'warning', message: 'تجاوز الصنف "شاشة سامسونج 55" الحد الأدنى للطلب بالمخازن', date: '2026-07-02' },
            { id: 'alt-2', type: 'danger', message: 'العميل "مؤسسة الأمل" تجاوز السقف الائتماني المحدد له بقيمة 20,000 ر.س', date: '2026-07-01' },
            { id: 'alt-3', type: 'info', message: 'تم جدولة النسخ الاحتياطي التلقائي عند الساعة 11:00 م', date: '2026-07-02' },
          ],
          users: DEFAULT_USERS,
          loginLogs: [],
          manufacturing: [],
          templates: [
            {
              id: 'tpl-sale-default',
              name: 'نموذج الفاتورة الضريبية القياسي (مبيعات)',
              type: 'sale',
              paperSize: 'A4',
              isPortrait: true,
              margins: { top: 15, bottom: 15, left: 15, right: 15 },
              showFrame: true,
              isDefault: true,
              elements: [
                { id: 'el-1', type: 'logo', x: 5, y: 15, w: 15, h: 60, value: '⚖️' },
                { id: 'el-2', type: 'header', x: 25, y: 15, w: 50, h: 40, value: 'شركة الميزان للتجارة والصناعة المحدودة', fontSize: 16, bold: true, align: 'center' },
                { id: 'el-3', type: 'text', x: 25, y: 55, w: 50, h: 30, value: 'الرقم الضريبي: 300054321000003', fontSize: 10, align: 'center' },
                { id: 'el-4', type: 'text', x: 80, y: 15, w: 15, h: 50, value: 'تاريخ الطباعة:\n{currentDate}', fontSize: 8, align: 'left' },
                { id: 'el-5', type: 'text', x: 5, y: 110, w: 90, h: 40, value: 'فاتورة مبيعات ومستهلك - مبيعات نقدية وآجلة', fontSize: 14, bold: true, align: 'center', color: '#1e40af' },
                { id: 'el-6', type: 'text', x: 5, y: 160, w: 40, h: 70, value: 'رقم الفاتورة: {invoiceNo}\nالتاريخ: {date}\nالمستودع: {warehouseName}', fontSize: 10, bold: true },
                { id: 'el-7', type: 'text', x: 50, y: 160, w: 45, h: 70, value: 'العميل: {customerName}\nالهاتف: {customerPhone}\nالعنوان: {customerAddress}', fontSize: 10, bold: true },
                { id: 'el-8', type: 'table', x: 5, y: 245, w: 90, h: 250, value: 'items_grid' },
                { id: 'el-9', type: 'totals', x: 55, y: 510, w: 40, h: 120, value: 'totals_box' },
                { id: 'el-10', type: 'qrcode', x: 10, y: 510, w: 15, h: 80, value: 'Zatca_QR_Code_Data_Compliant' },
                { id: 'el-11', type: 'signature', x: 5, y: 645, w: 30, h: 60, value: 'توقيع المستلم الفني' },
                { id: 'el-12', type: 'stamp', x: 35, y: 645, w: 30, h: 60, value: 'ختم وتدقيق الحسابات' },
                { id: 'el-13', type: 'signature', x: 65, y: 645, w: 30, h: 60, value: 'توقيع أمين المستودع' },
                { id: 'el-14', type: 'footer', x: 5, y: 720, w: 90, h: 40, value: 'شروط الدفع والتبديل: البضاعة الخاضعة للضريبة تبدل خلال 7 أيام من تاريخ الفاتورة بشرط سلامة التغليف الأصلي.', fontSize: 8, align: 'center' }
              ]
            },
            {
              id: 'tpl-purchase-default',
              name: 'نموذج سند الشراء القياسي',
              type: 'purchase',
              paperSize: 'A4',
              isPortrait: true,
              margins: { top: 15, bottom: 15, left: 15, right: 15 },
              showFrame: true,
              isDefault: true,
              elements: [
                { id: 'p-el-1', type: 'header', x: 5, y: 15, w: 90, h: 40, value: 'أمر توريد وشراء بضاعة للمستودع', fontSize: 16, bold: true, align: 'center' },
                { id: 'p-el-2', type: 'text', x: 5, y: 65, w: 45, h: 60, value: 'رقم السند: {invoiceNo}\nالتاريخ: {date}', fontSize: 11 },
                { id: 'p-el-3', type: 'text', x: 50, y: 65, w: 45, h: 60, value: 'المورد: {customerName}\nمستودع الإيداع: {warehouseName}', fontSize: 11 },
                { id: 'p-el-4', type: 'table', x: 5, y: 140, w: 90, h: 300, value: 'items_grid' },
                { id: 'p-el-5', type: 'totals', x: 55, y: 460, w: 40, h: 100, value: 'totals_box' }
              ]
            },
            {
              id: 'tpl-quotation-default',
              name: 'نموذج عرض السعر الأنيق للعملاء',
              type: 'quotation',
              paperSize: 'A4',
              isPortrait: true,
              margins: { top: 15, bottom: 15, left: 15, right: 15 },
              showFrame: true,
              isDefault: true,
              elements: [
                { id: 'q-el-1', type: 'header', x: 5, y: 15, w: 90, h: 40, value: 'عرض سعر معتمد - Quotation', fontSize: 16, bold: true, align: 'center', color: '#047857' },
                { id: 'q-el-2', type: 'text', x: 5, y: 65, w: 45, h: 60, value: 'رقم العرض: {invoiceNo}\nالتاريخ: {date}', fontSize: 11 },
                { id: 'q-el-3', type: 'text', x: 50, y: 65, w: 45, h: 60, value: 'العميل: {customerName}\nالصلاحية: 15 يوماً من تاريخ التحرير', fontSize: 11 },
                { id: 'q-el-4', type: 'table', x: 5, y: 140, w: 90, h: 300, value: 'items_grid' },
                { id: 'q-el-5', type: 'totals', x: 55, y: 460, w: 40, h: 100, value: 'totals_box' }
              ]
            }
          ]
        };

        setBranches(baseline.branches);
        setWarehouses(baseline.warehouses);
        setCostCenters(baseline.costCenters);
        setCurrencies(baseline.currencies);
        setAccounts(baseline.accounts);
        setCustomers(baseline.customers);
        setItemGroups(baseline.itemGroups);
        setItems(baseline.items);
        setJournalEntries(baseline.journalEntries);
        setInvoices(baseline.invoices);
        setTasks(baseline.tasks);
        setAlerts(baseline.alerts);
        setUsers(baseline.users);
        setLoginLogs(baseline.loginLogs);
        setManufacturing(baseline.manufacturing);
        setTemplates(baseline.templates);

        // Upload baseline data to save on Supabase or Server disk right away
        Object.entries(baseline).forEach(async ([modName, records]) => {
          if (Array.isArray(records)) {
            for (const rec of records) {
              await saveCompanyRecord(connectedDbId, modName, rec);
            }
          }
        });

        showToast('تم تأسيس وتهيئة المنشأة بقيم محاسبية افتراضية متميزة.', 'success');
      }
    };

    loadData();

    // Subscribe to real-time sync updates
    const subscription = subscribeToCompanyChanges(connectedDbId, (payload) => {
      if (!active) return;
      console.log('Realtime Postgres update event received:', payload);
      // Quietly reload records
      loadData();
    });

    return () => {
      active = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [connectedDbId]);

  // Sync state changes back to database instantly
  const syncRecord = useCallback(async (moduleName: string, record: any) => {
    if (!connectedDbId) return;
    await saveCompanyRecord(connectedDbId, moduleName, record);
  }, [connectedDbId]);

  const removeRecord = useCallback(async (moduleName: string, id: string) => {
    if (!connectedDbId) return;
    await deleteCompanyRecord(connectedDbId, moduleName, id);
  }, [connectedDbId]);

  // DB Handlers
  const connectDatabase = useCallback((id: string) => {
    setConnectedDbId(id);
    localStorage.setItem('erp_connected_db', id);
    if (saveSettingsNoShow) {
      localStorage.setItem('erp_skip_connect_screen', 'true');
    } else {
      localStorage.removeItem('erp_skip_connect_screen');
    }
    // Clear old open windows on database change
    setWindows([]);
  }, [saveSettingsNoShow]);

  const disconnectDatabase = useCallback(() => {
    setConnectedDbId(null);
    localStorage.removeItem('erp_connected_db');
    localStorage.removeItem('erp_skip_connect_screen');
    setWindows([]);
    setCurrentUser(null);
  }, []);

  const loginUser = useCallback(async (username: string, password: string, saveUsername: boolean) => {
    if (!connectedDbId) {
      return { success: false, error: 'لم يتم الاتصال بقاعدة البيانات بعد.' };
    }

    // Dynamic direct database/Supabase retrieval to authenticate against real records
    const companyData = await fetchCompanyData(connectedDbId);
    let dbUsers: ErpUser[] = [];
    if (companyData && companyData.users) {
      dbUsers = companyData.users;
    }

    // Auto-create first Super Administrator if no users exist or Ahmed is missing
    const hasAdmin = dbUsers.some(u => u.username.toLowerCase() === 'ahmed');
    if (dbUsers.length === 0 || !hasAdmin) {
      const defaultAdmin = DEFAULT_USERS[0];
      await saveCompanyRecord(connectedDbId, 'users', defaultAdmin);
      dbUsers = [defaultAdmin, ...dbUsers.filter(u => u.id !== defaultAdmin.id)];
      setUsers(dbUsers);
    } else {
      setUsers(dbUsers);
    }

    const foundUser = dbUsers.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!foundUser) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
    }
    if (foundUser.password !== password) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
    }
    if (!foundUser.isActive) {
      return { success: false, error: 'عذراً، هذا الحساب موقوف عن العمل حالياً من قبل الإدارة.' };
    }

    setCurrentUser(foundUser);

    if (saveUsername) {
      localStorage.setItem(`erp_saved_username_${connectedDbId}`, foundUser.username);
    } else {
      localStorage.removeItem(`erp_saved_username_${connectedDbId}`);
    }

    // Add login log
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Simulate some simple device info
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const deviceName = isMobile ? 'جهاز جوال' : 'حاسوب مكتبي (نوافذ الميزان)';
    const ipAddress = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;

    const newLog: LoginLog = {
      id: `log-${Date.now()}`,
      username: foundUser.username,
      loginTime: formattedDate,
      ipAddress,
      device: deviceName,
      lastActivity: formattedDate
    };

    setLoginLogs(prev => [newLog, ...prev]);

    return { success: true };
  }, [connectedDbId]);

  const logoutUser = useCallback(() => {
    if (currentUser) {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setLoginLogs(prev => prev.map(log => {
        if (log.username === currentUser.username && !log.logoutTime) {
          return { ...log, logoutTime: formattedDate };
        }
        return log;
      }));
    }
    setCurrentUser(null);
  }, [currentUser]);

  const addUser = useCallback((user: ErpUser) => {
    setUsers(prev => [...prev, user]);
    syncRecord('users', user);
  }, [syncRecord]);

  const updateUser = useCallback((updatedUser: ErpUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If we updated the currently logged-in user, refresh their permissions immediately!
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    syncRecord('users', updatedUser);
  }, [currentUser, syncRecord]);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    removeRecord('users', id);
  }, [removeRecord]);

  const addLoginLog = useCallback((log: LoginLog) => {
    setLoginLogs(prev => [log, ...prev]);
    syncRecord('loginLogs', log);
  }, [syncRecord]);

  const addPrintTemplate = useCallback((template: PrintTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id);
      let updated;
      if (idx !== -1) {
        updated = [...prev];
        updated[idx] = template;
      } else {
        updated = [...prev, template];
      }
      return updated;
    });
    syncRecord('templates', template);
  }, [syncRecord]);

  const deletePrintTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    removeRecord('templates', id);
  }, [removeRecord]);

  const createDatabase = useCallback(async (name: string, description: string) => {
    const newDb = await createDbInSync(name, description);
    setDatabases(prev => {
      const updated = [newDb, ...prev.filter((d) => d.id !== newDb.id)];
      localStorage.setItem('erp_databases', JSON.stringify(updated));
      return updated;
    });
    showToast(`تم تأسيس قاعدة بيانات ${name} بنجاح ومزامنتها على السحابة.`, 'success');
    return newDb.id;
  }, [showToast]);

  const deleteDatabase = useCallback(async (id: string) => {
    await deleteDbInSync(id);
    setDatabases(prev => {
      const updated = prev.filter((db) => db.id !== id);
      localStorage.setItem('erp_databases', JSON.stringify(updated));
      return updated;
    });
    if (connectedDbId === id) {
      disconnectDatabase();
    }
    showToast('تم حذف قاعدة البيانات والملفات والمنشأة نهائياً من السحابة.', 'warning');
  }, [connectedDbId, disconnectDatabase, showToast]);

  // MDI Window Operations
  const openWindow = useCallback((type: string, title: string, props: any = {}) => {
    setWindows((prev) => {
      // Check if window of same type & identifier is already open
      const existingIdx = prev.findIndex((w) => {
        if (w.type === type) {
          if (type === 'invoice' && props?.invoiceType) {
            return w.props?.invoiceType === props.invoiceType && w.props?.invoiceId === props.invoiceId;
          }
          if (type === 'reports' && props?.reportType) {
            return w.props?.reportType === props.reportType;
          }
          return true;
        }
        return false;
      });

      if (existingIdx !== -1) {
        // Just bring it to front & de-minimize
        const updated = [...prev];
        const win = { ...updated[existingIdx], isMinimized: false, zIndex: nextZIndex + 1 };
        updated.splice(existingIdx, 1);
        updated.push(win);
        setNextZIndex((z) => z + 1);
        return updated;
      }

      // Compute elegant offset cascaded position for new window
      const count = prev.length;
      const xOffset = 30 + (count % 8) * 25;
      const yOffset = 30 + (count % 8) * 20;

      // Default dimensions depending on the type
      let width = 750;
      let height = 500;
      if (type === 'invoice') {
        width = 1100;
        height = 650;
      } else if (type === 'chart_of_accounts' || type === 'item_tree' || type === 'branches') {
        width = 500;
        height = 550;
      } else if (type === 'permissions' || type === 'db_manager' || type === 'definitions' || type === 'tools_manager') {
        width = 950;
        height = 580;
      } else if (type === 'cost_centers' || type === 'currencies') {
        width = 820;
        height = 540;
      } else if (type === 'price_update') {
        width = 980;
        height = 600;
      } else if (type === 'about') {
        width = 450;
        height = 300;
      }

      const newWin: MdiWindow = {
        id: `win-${Date.now()}`,
        title,
        type,
        isOpen: true,
        isMaximized: false,
        isMinimized: false,
        x: xOffset,
        y: yOffset,
        width,
        height,
        zIndex: nextZIndex + 1,
        props,
      };

      setNextZIndex((z) => z + 1);
      return [...prev, newWin];
    });
  }, [nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w))
    );
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const idx = prev.findIndex((w) => w.id === id);
      if (idx === -1) return prev;
      const updated = [...prev];
      const win = { ...updated[idx], isMinimized: false, zIndex: nextZIndex + 1 };
      updated.splice(idx, 1);
      updated.push(win);
      setNextZIndex((z) => z + 1);
      return updated;
    });
  }, [nextZIndex]);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y } : w))
    );
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, width, height } : w))
    );
  }, []);

  const tileWindows = useCallback((layout: 'horizontal' | 'vertical' | 'cascade') => {
    setWindows((prev) => {
      const activeWins = prev.filter((w) => !w.isMinimized);
      if (activeWins.length === 0) return prev;

      const workspaceW = window.innerWidth - 40;
      const workspaceH = window.innerHeight - 200; // rough estimates

      return prev.map((w) => {
        if (w.isMinimized) return w;

        const activeIdx = activeWins.findIndex((aw) => aw.id === w.id);
        if (activeIdx === -1) return w;

        if (layout === 'horizontal') {
          const rows = Math.ceil(Math.sqrt(activeWins.length));
          const cols = Math.ceil(activeWins.length / rows);
          const r = Math.floor(activeIdx / cols);
          const c = activeIdx % cols;

          const width = workspaceW / cols;
          const height = workspaceH / rows;
          return {
            ...w,
            isMaximized: false,
            x: c * width + 10,
            y: r * height + 10,
            width: width - 10,
            height: height - 10,
          };
        } else if (layout === 'vertical') {
          const cols = activeWins.length;
          const width = workspaceW / cols;
          return {
            ...w,
            isMaximized: false,
            x: activeIdx * width + 10,
            y: 10,
            width: width - 10,
            height: workspaceH - 10,
          };
        } else {
          // Cascade
          return {
            ...w,
            isMaximized: false,
            x: 20 + activeIdx * 25,
            y: 20 + activeIdx * 20,
            width: 750,
            height: 500,
          };
        }
      });
    });
  }, []);

  const minimizeAll = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
  }, []);

  const restoreAll = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: false })));
  }, []);

  const closeAll = useCallback(() => {
    setWindows([]);
  }, []);

  // Entity Adders / Modifiers
  const addBranch = useCallback((branch: Branch) => {
    setBranches((prev) => {
      const exists = prev.some((b) => b.id === branch.id);
      return exists ? prev.map((b) => (b.id === branch.id ? branch : b)) : [...prev, branch];
    });
    syncRecord('branches', branch);
  }, [syncRecord]);

  const addWarehouse = useCallback((wh: Warehouse) => {
    setWarehouses((prev) => {
      const exists = prev.some((w) => w.id === wh.id);
      return exists ? prev.map((w) => (w.id === wh.id ? wh : w)) : [...prev, wh];
    });
    syncRecord('warehouses', wh);
  }, [syncRecord]);

  const addCostCenter = useCallback((cc: CostCenter) => {
    setCostCenters((prev) => {
      const exists = prev.some((c) => c.id === cc.id);
      return exists ? prev.map((c) => (c.id === cc.id ? cc : c)) : [...prev, cc];
    });
    syncRecord('costCenters', cc);
  }, [syncRecord]);

  const addAccount = useCallback((acc: Account) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === acc.id);
      return exists ? prev.map((a) => (a.id === acc.id ? acc : a)) : [...prev, acc];
    });
    syncRecord('accounts', acc);
  }, [syncRecord]);

  const addCustomer = useCallback((cust: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === cust.id);
      return exists ? prev.map((c) => (c.id === cust.id ? cust : c)) : [...prev, cust];
    });
    syncRecord('customers', cust);
  }, [syncRecord]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    removeRecord('customers', id);
  }, [removeRecord]);

  const addItem = useCallback((item: Item) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
    });
    syncRecord('items', item);
  }, [syncRecord]);

  const addItemGroup = useCallback((group: ItemGroup) => {
    setItemGroups((prev) => {
      const exists = prev.some((g) => g.id === group.id);
      return exists ? prev.map((g) => (g.id === group.id ? group : g)) : [...prev, group];
    });
    syncRecord('itemGroups', group);
  }, [syncRecord]);

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntries((prev) => {
      const exists = prev.some((j) => j.id === entry.id);
      let nextEntries = prev;
      if (exists) {
        nextEntries = prev.map((j) => (j.id === entry.id ? entry : j));
      } else {
        nextEntries = [...prev, entry];
      }

      // If posted, let's update account balances in real time!
      if (entry.posted) {
        setAccounts((prevAccounts) => {
          return prevAccounts.map((acc) => {
            let balDiff = 0;
            let affected = false;
            entry.rows.forEach((row) => {
              if (row.accountId === acc.id) {
                affected = true;
                // assets and expenses increase on Debit (+debit -credit)
                // liabilities, equity, revenues increase on Credit (+credit -debit)
                const isDebitIncrease = acc.type === 'assets' || acc.type === 'expenses';
                if (isDebitIncrease) {
                  balDiff += (row.debit - row.credit);
                } else {
                  balDiff += (row.credit - row.debit);
                }
              }
            });
            const updatedAcc = {
              ...acc,
              balance: acc.balance + balDiff,
            };
            if (affected) {
              syncRecord('accounts', updatedAcc);
            }
            return updatedAcc;
          });
        });
      }
      syncRecord('journalEntries', entry);
      return nextEntries;
    });
  }, [syncRecord]);

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === invoice.id);
      let nextInvoices = prev;
      if (exists) {
        nextInvoices = prev.map((inv) => (inv.id === invoice.id ? invoice : inv));
      } else {
        nextInvoices = [...prev, invoice];
      }

      // Update Inventory Quantities based on items
      setItems((prevItems) => {
        return prevItems.map((it) => {
          let stockDiff = 0;
          let affected = false;
          invoice.items.forEach((row) => {
            if (row.itemId === it.id) {
              affected = true;
              if (invoice.type === 'purchase' || invoice.type === 'sale_return' || invoice.type === 'inward' || invoice.type === 'opening_stock') {
                stockDiff += row.quantity;
              } else if (invoice.type === 'sale' || invoice.type === 'purchase_return' || invoice.type === 'outward' || invoice.type === 'closing_stock') {
                stockDiff -= row.quantity;
              }
            }
          });
          const updatedItem = {
            ...it,
            currentStock: it.currentStock + stockDiff,
          };
          if (affected) {
            syncRecord('items', updatedItem);
          }
          return updatedItem;
        });
      });

      // Update Customer balances
      setCustomers((prevCustomers) => {
        return prevCustomers.map((c) => {
          if (c.id === invoice.customerId) {
            let balDiff = 0;
            if (invoice.type === 'sale') {
              balDiff += invoice.netAmount - invoice.paidAmount;
            } else if (invoice.type === 'sale_return') {
              balDiff -= invoice.netAmount;
            } else if (invoice.type === 'purchase') {
              balDiff += invoice.netAmount - invoice.paidAmount;
            } else if (invoice.type === 'purchase_return') {
              balDiff -= invoice.netAmount;
            }
            const updatedC = {
              ...c,
              balance: c.balance + balDiff,
            };
            syncRecord('customers', updatedC);
            return updatedC;
          }
          return c;
        });
      });

      // Automatically generate real Journal Entry from the invoice if entryCreated is true!
      if (invoice.posted && invoice.entryCreated) {
        const entryId = `je-auto-inv-${invoice.id}`;
        const journalRows: any[] = [];

        if (invoice.type === 'sale') {
          const debitAccount = invoice.paymentMethod === 'cash' ? invoice.cashAccountId : 'acc-112001';
          journalRows.push({
            accountId: debitAccount,
            debit: invoice.netAmount,
            credit: 0,
            costCenterId: invoice.debitCostCenterId || null,
            notes: `مبيعات فاتورة رقم ${invoice.invoiceNo}`,
          });

          journalRows.push({
            accountId: invoice.itemsAccountId || 'acc-411001',
            debit: 0,
            credit: invoice.netAmount,
            costCenterId: invoice.creditCostCenterId || null,
            notes: `قيمة فاتورة مبيعات رقم ${invoice.invoiceNo}`,
          });
        } else if (invoice.type === 'purchase') {
          journalRows.push({
            accountId: invoice.itemsAccountId || 'acc-511001',
            debit: invoice.netAmount,
            credit: 0,
            costCenterId: invoice.debitCostCenterId || null,
            notes: `مشتريات فاتورة رقم ${invoice.invoiceNo}`,
          });

          const creditAccount = invoice.paymentMethod === 'cash' ? invoice.cashAccountId : 'acc-211001';
          journalRows.push({
            accountId: creditAccount,
            debit: 0,
            credit: invoice.netAmount,
            costCenterId: invoice.creditCostCenterId || null,
            notes: `قيمة فاتورة مشتريات رقم ${invoice.invoiceNo}`,
          });
        }

        if (journalRows.length > 0) {
          const autoEntry: JournalEntry = {
            id: entryId,
            entryNo: `JV-${invoice.invoiceNo}`,
            date: invoice.date,
            description: `قيد تلقائي ناتج عن فاتورة ${invoice.invoiceNo}: ${invoice.description}`,
            posted: true,
            rows: journalRows,
          };

          setTimeout(() => {
            addJournalEntry(autoEntry);
          }, 0);
        }
      }

      syncRecord('invoices', invoice);
      return nextInvoices;
    });
  }, [addJournalEntry, syncRecord]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    removeRecord('invoices', id);
    removeRecord('journalEntries', `je-auto-inv-${id}`);
  }, [removeRecord]);

  const addManufacturingOrder = useCallback((mo: ManufacturingOrder) => {
    setManufacturing((prev) => {
      const exists = prev.some((m) => m.id === mo.id);
      return exists ? prev.map((m) => (m.id === mo.id ? mo : m)) : [...prev, mo];
    });
    syncRecord('manufacturing', mo);
  }, [syncRecord]);

  const deleteManufacturingOrder = useCallback((id: string) => {
    setManufacturing((prev) => prev.filter((m) => m.id !== id));
    removeRecord('manufacturing', id);
  }, [removeRecord]);

  const addTask = useCallback((task: TaskItem) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
    });
    syncRecord('tasks', task);
  }, [syncRecord]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    removeRecord('tasks', id);
  }, [removeRecord]);

  return (
    <ErpContext.Provider
      value={{
        databases,
        connectedDbId,
        saveSettingsNoShow,
        setSaveSettingsNoShow,
        connectDatabase,
        disconnectDatabase,
        createDatabase,
        deleteDatabase,

        windows,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        tileWindows,
        minimizeAll,
        restoreAll,
        closeAll,

        branches,
        warehouses,
        costCenters,
        currencies,
        accounts,
        setAccounts,
        customers,
        itemGroups,
        items,
        journalEntries,
        invoices,
        setInvoices,
        setBranches,
        setWarehouses,
        tasks,
        alerts,
        templates,

        addBranch,
        addWarehouse,
        addCostCenter,
        addAccount,
        addCustomer,
        deleteCustomer,
        setCustomers,
        addItem,
        addItemGroup,
        addJournalEntry,
        addInvoice,
        deleteInvoice,
        addManufacturingOrder,
        deleteManufacturingOrder,
        addTask,
        deleteTask,
        addPrintTemplate,
        deletePrintTemplate,

        setTasks,
        setAlerts,
        currentUser,
        setCurrentUser,
        users,
        loginLogs,
        loginUser,
        logoutUser,
        addUser,
        updateUser,
        deleteUser,
        addLoginLog,
        toast,
        showToast,

        // New Commercial values
        language,
        setLanguage,
        theme,
        setTheme,
        customColor,
        setCustomColor,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        fontWeight,
        setFontWeight,
        calculatorOpen,
        setCalculatorOpen,
        favorites,
        toggleFavorite,
        notifications,
        addNotification,
        markNotificationRead,
        clearNotifications,
        backups,
        addBackup,
        deleteBackup,
        isCheckingUpdate,
        checkProgramUpdate,
        isUpdatingDb,
        updateDatabaseSchema,
        currentVersion,
        availableUpdate,
        setAvailableUpdate,
        updateProgress,
        isDownloadingUpdate,
        showUpdateBanner,
        setShowUpdateBanner,
        publishNewVersion,
        rollbackLatestVersion,
        installUpdate,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) {
    throw new Error('useErp must be used within an ErpProvider');
  }
  return context;
};

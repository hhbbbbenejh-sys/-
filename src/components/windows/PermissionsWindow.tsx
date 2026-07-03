import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { ErpUser, ErpPermissions } from '../../types/erp';
import { 
  Users, User, Shield, Check, X, KeyRound, Lock, Search, 
  UserPlus, Edit3, Trash2, CheckCircle2, AlertTriangle, HelpCircle, 
  History, Eye, EyeOff, Building, Mail, Phone, Activity
} from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    title: 'الوصول الأساسي والعمليات العامة',
    permissions: [
      { key: 'open_system', label: 'فتح وتشغيل النظام المالي' },
      { key: 'settings', label: 'خيارات النظام وصيانة الداتا' },
      { key: 'user_management', label: 'إدارة المستخدمين ومنح الصلاحيات' },
      { key: 'backup_create', label: 'إنشاء النسخ الاحتياطية' },
      { key: 'backup_restore', label: 'استعادة النسخ الاحتياطية' },
      { key: 'delete_data', label: 'حذف البيانات وقاعدة البيانات' },
    ]
  },
  {
    title: 'المبيعات والمشتريات والفواتير',
    permissions: [
      { key: 'sales', label: 'عمليات الفواتير والمبيعات' },
      { key: 'purchases', label: 'عمليات المشتريات والموردين' },
      { key: 'invoice_edit', label: 'تعديل الفواتير المصدرة' },
      { key: 'invoice_delete', label: 'حذف الفواتير نهائياً' },
      { key: 'cancel_invoices', label: 'إلغاء الفواتير وتعليقها' },
    ]
  },
  {
    title: 'المستودعات والحسابات المالية',
    permissions: [
      { key: 'inventory', label: 'المستودعات وجرد المواد' },
      { key: 'price_update', label: 'تحديث أسعار المواد والخدمات' },
      { key: 'accounting', label: 'دليل الحسابات والعمليات المصرفية' },
      { key: 'journal_entries', label: 'سندات القيود اليومية والتسويات' },
    ]
  },
  {
    title: 'التقارير والمخرجات',
    permissions: [
      { key: 'reports', label: 'استعراض التقارير المالية والإدارية' },
      { key: 'print', label: 'تصميم وطباعة المستندات والتقارير' },
      { key: 'export_excel', label: 'تصدير البيانات إلى Excel' },
      { key: 'export_pdf', label: 'تصدير التقارير بصيغة PDF' },
    ]
  }
];

const INITIAL_PERMISSIONS: ErpPermissions = {
  open_system: true,
  sales: false,
  purchases: false,
  inventory: false,
  accounting: false,
  journal_entries: false,
  reports: false,
  settings: false,
  user_management: false,
  backup_create: false,
  backup_restore: false,
  delete_data: false,
  price_update: false,
  cancel_invoices: false,
  edit_invoices: false,
  delete_invoices: false,
  print: true,
  export_excel: false,
  export_pdf: false
};

export const PermissionsWindow: React.FC<{ windowId: string; initialTab?: string; onClose: () => void }> = ({ onClose, initialTab }) => {
  const { users, currentUser, loginLogs, addUser, updateUser, deleteUser, showToast } = useErp();

  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || 'usr-admin');
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'policies'>(() => {
    if (initialTab === 'policies') return 'policies';
    if (initialTab === 'logs') return 'logs';
    return 'details';
  });

  // Mode States: 'view' | 'edit' | 'create'
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');

  // Password visibility
  const [showPass, setShowPass] = useState(false);

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<ErpPermissions>(INITIAL_PERMISSIONS);

  const [formError, setFormError] = useState<string | null>(null);

  // Find selected user from store
  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];

  // Load user data to form
  const loadUserToForm = (user: ErpUser) => {
    if (!user) return;
    setFullName(user.fullName);
    setUsername(user.username);
    setPassword(user.password || '*****');
    setConfirmPassword(user.password || '*****');
    setJobTitle(user.jobTitle);
    setDepartment(user.department);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setIsActive(user.isActive);
    setPermissions(user.permissions);
    setFormError(null);
  };

  // Sync state on change
  React.useEffect(() => {
    if (mode === 'view' && selectedUser) {
      loadUserToForm(selectedUser);
    }
  }, [selectedUserId, selectedUser, mode]);

  // Search filter
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.jobTitle.toLowerCase().includes(term) ||
      u.department.toLowerCase().includes(term)
    );
  });

  // Handle clicking a user from the list
  const handleSelectUser = (id: string) => {
    if (mode !== 'view') {
      if (!confirm('لديك تعديلات غير محفوظة. هل تريد التراجع والانتقال؟')) {
        return;
      }
    }
    setSelectedUserId(id);
    setMode('view');
  };

  // Switch to Create Mode
  const handleNew = () => {
    setMode('create');
    setFullName('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setJobTitle('محاسب');
    setDepartment('المالية');
    setEmail('');
    setPhone('');
    setIsActive(true);
    setPermissions(INITIAL_PERMISSIONS);
    setFormError(null);
  };

  // Switch to Edit Mode
  const handleEdit = () => {
    if (!selectedUser) return;
    setMode('edit');
    setConfirmPassword(selectedUser.password || '');
    setPassword(selectedUser.password || '');
    setFormError(null);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!fullName.trim()) return setFormError('يرجى إدخال الاسم الكامل للمستخدم');
    if (!username.trim()) return setFormError('يرجى إدخال اسم المستخدم الفريد');
    if (['admin', 'ahmed'].includes(username.trim().toLowerCase()) && mode === 'create') {
      return setFormError('لا يمكن تكرار اسم المستخدم الرئيسي المحمي (admin / Ahmed)');
    }
    if (!password.trim()) return setFormError('يرجى كتابة كلمة مرور صالحة');
    if (password !== confirmPassword) {
      return setFormError('تنبيه: كلمتا المرور غير متطابقتين، يرجى إعادة التحقق');
    }

    if (mode === 'create') {
      const newUser: ErpUser = {
        id: `user-${Date.now()}`,
        fullName,
        username: username.trim(),
        password,
        jobTitle,
        department,
        email,
        phone,
        isActive,
        permissions
      };
      addUser(newUser);
      showToast(`تم تسجيل مستخدم جديد بنجاح: ${fullName}`, 'success');
      setSelectedUserId(newUser.id);
      setMode('view');
    } else if (mode === 'edit') {
      const updated: ErpUser = {
        ...selectedUser,
        fullName,
        username: ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()) ? selectedUser.username : username.trim(), // Keep admin username locked
        password,
        jobTitle,
        department,
        email,
        phone,
        isActive: ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()) ? true : isActive, // admin remains active always
        permissions
      };
      updateUser(updated);
      showToast(`تم تعديل بيانات وصلاحيات المستخدم بنجاح: ${fullName}`, 'success');
      setMode('view');
    }
  };

  // Handle Delete
  const handleDelete = () => {
    if (!selectedUser) return;
    if (['admin', 'ahmed'].includes(selectedUser.username.toLowerCase())) {
      showToast('لا يمكن حذف المستخدم الرئيسي الخاص بالنظام لحماية قواعد البيانات.', 'error');
      return;
    }
    if (currentUser && currentUser.id === selectedUser.id) {
      showToast('لا يمكن حذف حسابك الشخصي الجاري تسجيل الدخول به حالياً.', 'warning');
      return;
    }

    if (confirm(`هل أنت متأكد تماماً من رغبتك في حذف المستخدم [ ${selectedUser.fullName} ] نهائياً؟`)) {
      deleteUser(selectedUser.id);
      showToast('تم حذف المستخدم بنجاح.', 'success');
      setMode('view');
      const remaining = users.filter(u => u.id !== selectedUser.id);
      if (remaining.length > 0) {
        setSelectedUserId(remaining[0].id);
      }
    }
  };

  // Handle Checkbox Toggle
  const handleTogglePermission = (key: keyof ErpPermissions) => {
    if (mode === 'view') return;
    if (selectedUser && ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()) && mode === 'edit') {
      showToast('صلاحيات مدير النظام ثابتة وتعتبر صلاحيات كاملة دوماً.', 'info');
      return;
    }
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Set All Permissions Active/Inactive
  const toggleAllPermissions = (enable: boolean) => {
    if (mode === 'view') return;
    if (selectedUser && ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()) && mode === 'edit') return;
    
    const updated = { ...permissions };
    Object.keys(updated).forEach(k => {
      (updated as any)[k] = enable;
    });
    setPermissions(updated);
  };

  // Filter login logs for selected user
  const userLogs = loginLogs
    .filter(log => log.username.toLowerCase() === selectedUser?.username.toLowerCase())
    .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());

  return (
    <div className="flex h-full bg-slate-100 text-slate-800 select-none overflow-hidden" id="user-management-win">
      
      {/* Left List Pane */}
      <div className="w-1/3 border-l border-slate-300 flex flex-col h-full bg-slate-200">
        
        {/* Search header */}
        <div className="p-3 bg-slate-300/60 border-b border-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Users className="w-5 h-5 text-blue-700" />
            <span className="font-extrabold text-sm">المستخدمين وإدارة الوصول</span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الوظيفة أو القسم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-right pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Users scrollable area */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1">
              <AlertTriangle className="w-6 h-6 mx-auto text-slate-400" />
              <p>لا يوجد نتائج مطابقة للبحث</p>
            </div>
          ) : (
            filteredUsers.map(u => {
              const isSelected = u.id === selectedUserId;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  className={`w-full text-right p-3 rounded border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white border-slate-300/80 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-extrabold text-xs flex items-center gap-1.5">
                      <User className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                      <span>{u.fullName}</span>
                      {['admin', 'ahmed'].includes(u.username.toLowerCase()) && (
                        <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.2 rounded font-bold">مدير</span>
                      )}
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <span className={isSelected ? 'text-blue-100' : 'text-slate-500'}>{u.jobTitle}</span>
                      <span className={isSelected ? 'text-blue-200' : 'text-slate-400'}>| {u.department}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      u.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-500 line-through'
                    }`}>
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                    {currentUser && currentUser.id === u.id && (
                      <span className={`text-[8px] border px-1 rounded font-mono ${
                        isSelected ? 'border-white text-white' : 'border-blue-300 text-blue-600'
                      }`}>
                        الحالي
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Action button in footer of list */}
        <div className="p-3 border-t border-slate-300 bg-slate-300/40">
          <button 
            onClick={handleNew}
            disabled={mode !== 'view'}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Right Content Pane */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        
        {/* Selected User Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <span>{mode === 'create' ? 'إنشاء حساب مستخدم جديد' : `بيانات وصلاحيات: ${fullName}`}</span>
              {selectedUser && ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()) && mode === 'edit' && (
                <span className="text-xs text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200">المدير العام لديه كامل الصلاحيات تلقائياً</span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'create' ? 'أدخل البيانات وعين الصلاحيات لإنشاء مستخدم مالي جديد' : `اسم المستخدم بالنظام: @${selectedUser?.username}`}
            </p>
          </div>

          {/* Details / Logs Tab Selector */}
          {mode === 'view' && (
            <div className="flex bg-slate-200 p-0.5 rounded border border-slate-300">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                  activeTab === 'details' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الصلاحيات والملف
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                  activeTab === 'logs' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سجل الدخول والمراقبة
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                  activeTab === 'policies' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سياسات القفل والسرية
              </button>
            </div>
          )}
        </div>

        {/* Main interactive area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {activeTab === 'policies' && mode === 'view' ? (
            /* Security Policies Pane */
            <div className="space-y-4">
              <div className="border-b pb-2">
                <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-500" />
                  سياسات القفل والأمان والسرية العالية بالمنشأة
                </span>
                <p className="text-[11px] text-slate-400 mt-1">قم بتثبيت قواعد الأمان العام للتحقق من كلمات مرور المحاسبين والمدراء وحماية قواعد البيانات.</p>
              </div>

              <div className="bg-white border rounded-lg p-5 space-y-4 shadow-xs text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">الحد الأقصى لمحاولات الدخول الخاطئة:</label>
                    <select className="w-full text-xs p-2 bg-slate-50 border rounded font-mono font-bold">
                      <option value="3">3 محاولات خاطئة (مستحسن)</option>
                      <option value="5">5 محاولات خاطئة</option>
                      <option value="0">بلا قيد (غير آمن)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">مهلة انتهاء الجلسة عند خمول الموظف:</label>
                    <select className="w-full text-xs p-2 bg-slate-50 border rounded font-bold">
                      <option value="15">15 دقيقة (أمان عالي)</option>
                      <option value="30">30 دقيقة</option>
                      <option value="60">ساعة كاملة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">الحد الأدنى لطول كلمة المرور:</label>
                    <input type="number" defaultValue={8} className="w-full text-xs p-2 bg-slate-50 border rounded font-mono font-bold" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">التحقق الثنائي للمستخدمين (2FA):</label>
                    <select className="w-full text-xs p-2 bg-slate-50 border rounded">
                      <option value="sms">رسائل SMS للتحقق على الجوال</option>
                      <option value="app">تطبيق Google Authenticator</option>
                      <option value="none">تعطيل التحقق الثنائي</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded leading-relaxed text-[11px] flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تنبيه: تطبيق هذه السياسة سيؤدي لفرض كلمات مرور معقدة على جميع المستخدمين وإرسال تنبيهات بريدية دورية للمدير العام.</span>
                </div>

                <div className="pt-3 border-t flex justify-end">
                  <button 
                    type="button"
                    onClick={() => showToast('تم تحديث سياسات القفل والسرية العالية بنجاح دائم.', 'success')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all shadow-xs cursor-pointer"
                  >
                    تطبيق السياسة الأمنية
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'logs' && mode === 'view' ? (
            /* User Logs Pane */
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  سجل الدخول والخروج الخاص بالمستند
                </span>
                <span className="text-[11px] text-slate-400 font-mono">العدد الإجمالي: {userLogs.length}</span>
              </div>

              {userLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border rounded text-xs text-slate-400 font-bold space-y-1">
                  <Activity className="w-6 h-6 mx-auto text-slate-300" />
                  <p>لا توجد جلسات عمل مسجلة لهذا الحساب حالياً.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-bold">وقت تسجيل الدخول</th>
                        <th className="p-2.5 font-bold">وقت تسجيل الخروج</th>
                        <th className="p-2.5 font-bold">عنوان الـ IP</th>
                        <th className="p-2.5 font-bold">الجهاز ونظام التشغيل</th>
                        <th className="p-2.5 font-bold">آخر نشاط مسجل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-slate-800 font-medium font-mono">{log.loginTime}</td>
                          <td className="p-2.5 text-slate-500 font-mono">{log.logoutTime || <span className="text-green-600 font-bold font-sans">نشط حالياً</span>}</td>
                          <td className="p-2.5 text-slate-600 font-mono">{log.ipAddress}</td>
                          <td className="p-2.5 text-slate-500">{log.device}</td>
                          <td className="p-2.5 text-slate-400 font-mono">{log.lastActivity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Details & Permissions Tab (Form + Checkboxes) */
            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Form errors */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Core Info Fields */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5 border-b pb-1.5">
                  <User className="w-4 h-4" />
                  بطاقة معلومات الحساب والموظف
                </span>

                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">الاسم الكامل للموظف <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      disabled={mode === 'view'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: أحمد الشمري"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-right"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">اسم المستخدم للدخول <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      disabled={mode === 'view' || (mode === 'edit' && selectedUser && ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()))}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: a_shammari"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-left font-mono"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1 relative">
                    <label className="font-bold text-slate-600 block">كلمة المرور الحالية/الجديدة <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type={showPass ? 'text' : 'password'}
                        disabled={mode === 'view'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-3 pl-10 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-left font-mono"
                      />
                      {mode !== 'view' && (
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                    <input 
                      type={showPass ? 'text' : 'password'}
                      disabled={mode === 'view'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-left font-mono"
                    />
                  </div>

                  {/* Job Title */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">المسمى الوظيفي</label>
                    <input 
                      type="text" 
                      disabled={mode === 'view'}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-right"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">القسم الإداري</label>
                    <input 
                      type="text" 
                      disabled={mode === 'view'}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-right"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      البريد الإلكتروني (اختياري)
                    </label>
                    <input 
                      type="email" 
                      disabled={mode === 'view'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@almeezan.com"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-left font-mono"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      رقم الهاتف الجوال (اختياري)
                    </label>
                    <input 
                      type="text" 
                      disabled={mode === 'view'}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxx"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium text-left font-mono"
                    />
                  </div>
                </div>

                {/* Account Status Checkbox */}
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      disabled={mode === 'view' || (selectedUser && ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()))}
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs font-extrabold text-slate-700">تنشيط حساب المستخدم بشكل كامل للاتصال بقاعدة البيانات</span>
                  </label>
                </div>
              </div>

              {/* Permissions Detailed Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    مصفوفة منح الصلاحيات والأمان التفصيلية
                  </span>

                  {mode !== 'view' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(true)}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        تحديد الكل
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(false)}
                        className="text-[10px] text-slate-500 hover:underline font-bold"
                      >
                        إلغاء تحديد الكل
                      </button>
                    </div>
                  )}
                </div>

                {/* Permissions Grid Groups */}
                <div className="grid grid-cols-2 gap-4">
                  {PERMISSION_GROUPS.map((grp, gIdx) => (
                    <div key={gIdx} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block border-b pb-1">{grp.title}</span>
                      <div className="space-y-1.5">
                        {grp.permissions.map(perm => {
                          // Determine if permission checked
                          const isChecked = selectedUser && ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase()) ? true : !!permissions[perm.key as keyof ErpPermissions];
                          return (
                            <label 
                              key={perm.key}
                              onClick={() => handleTogglePermission(perm.key as keyof ErpPermissions)}
                              className={`flex items-center justify-between p-2 rounded text-xs select-none ${
                                mode === 'view' 
                                  ? 'cursor-default' 
                                  : 'cursor-pointer hover:bg-slate-200/50'
                              } ${
                                isChecked 
                                  ? 'bg-blue-50/20 text-slate-800' 
                                  : 'text-slate-400'
                              }`}
                            >
                              <span className="font-medium">{perm.label}</span>
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                isChecked 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-slate-300 text-transparent'
                              }`}>
                                <Check className="w-3 h-3 stroke-[3px]" />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Actions Bottom Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          
          {/* Delete User Button */}
          {mode === 'view' ? (
            <button
              onClick={handleDelete}
              disabled={!selectedUser || ['admin', 'ahmed'].includes(selectedUser.username.toLowerCase())}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-700 rounded border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف المستخدم</span>
            </button>
          ) : (
            <div />
          )}

          {/* Edit/Save/Cancel controls */}
          <div className="flex gap-2.5">
            {mode === 'view' ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer transition-all"
                >
                  إغلاق النافذة
                </button>
                <button
                  onClick={handleEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-blue-600/10"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل الصلاحيات</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('view');
                    if (selectedUser) {
                      loadUserToForm(selectedUser);
                    }
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer transition-all"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-600/15"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ وإقرار البيانات</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

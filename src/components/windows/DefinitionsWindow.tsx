import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { 
  FileText, Plus, Edit3, Trash2, Check, X, CreditCard, 
  UserSquare2, Layers, Percent, MapPin, Briefcase, DollarSign 
} from 'lucide-react';

interface DefinitionsWindowProps {
  windowId: string;
  onClose: () => void;
  initialTab?: string;
}

export const DefinitionsWindow: React.FC<DefinitionsWindowProps> = ({ windowId, onClose, initialTab }) => {
  const { showToast } = useErp();

  const [activeTab, setActiveTab] = useState<'journal_types' | 'invoice_types' | 'payment_methods' | 'sales_reps'>(() => {
    if (initialTab === 'invoice_types') return 'invoice_types';
    if (initialTab === 'payment_methods') return 'payment_methods';
    if (initialTab === 'sales_reps') return 'sales_reps';
    return 'journal_types';
  });

  // 1. Journal Entry Types State
  const [journalTypes, setJournalTypes] = useState([
    { id: 'jt-1', code: 'JV', name: 'سند قيد تسوية عام', autoNo: true, description: 'سند تسوية حسابات الدفتر العام' },
    { id: 'jt-2', code: 'OP', name: 'قيد افتتاحي للميزانية', autoNo: true, description: 'قيد البداية السنوية للأرصدة' },
    { id: 'jt-3', code: 'FX', name: 'معالجة فروق العملات', autoNo: false, description: 'قيد لضبط فروق أسعار الصرف' },
  ]);
  const [newJtCode, setNewJtCode] = useState('');
  const [newJtName, setNewJtName] = useState('');
  const [newJtDesc, setNewJtDesc] = useState('');

  // 2. Invoice Types / Templates State
  const [invoiceTemplates, setInvoiceTemplates] = useState([
    { id: 'it-1', code: 'SAL', name: 'فاتورة مبيعات نقدية وآجلة', defaultPay: 'cash', active: true },
    { id: 'it-2', code: 'PUR', name: 'فاتورة مشتريات بضائع', defaultPay: 'credit', active: true },
    { id: 'it-3', code: 'SRET', name: 'مرتجع المبيعات من العملاء', defaultPay: 'cash', active: true },
  ]);

  // 3. Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'pm-1', name: 'صندوق النقد الرئيسي', type: 'نقد', accountCode: '111001', active: true },
    { id: 'pm-2', name: 'حساب بنك الراجحي الرئيسي', type: 'بنك', accountCode: '111002', active: true },
    { id: 'pm-3', name: 'بوابة مدى والشبكة السعودية', type: 'بطاقة', accountCode: '111003', active: true },
  ]);
  const [newPmName, setNewPmName] = useState('');
  const [newPmType, setNewPmType] = useState('نقد');
  const [newPmAcc, setNewPmAcc] = useState('111001');

  // 4. Sales Reps State
  const [salesReps, setSalesReps] = useState([
    { id: 'rep-1', code: 'REP-001', name: 'محمد عبد الله العتيبي', phone: '0501234567', commission: 2.5, target: 50000 },
    { id: 'rep-2', code: 'REP-002', name: 'أحمد محمود اليماني', phone: '0559876543', commission: 3.0, target: 60000 },
    { id: 'rep-3', code: 'REP-003', name: 'خالد وليد المطيري', phone: '0544567890', commission: 2.0, target: 40000 },
  ]);
  const [newRepName, setNewRepName] = useState('');
  const [newRepPhone, setNewRepPhone] = useState('');
  const [newRepComm, setNewRepComm] = useState(2.0);
  const [newRepTarget, setNewRepTarget] = useState(50000);

  const handleAddJournalType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJtCode || !newJtName) {
      showToast('يرجى كتابة رمز ونوع القيد المالي الجديد.', 'warning');
      return;
    }
    const newType = {
      id: `jt-${Date.now()}`,
      code: newJtCode.toUpperCase(),
      name: newJtName,
      autoNo: true,
      description: newJtDesc || 'نوع قيد معرف من قبل المستخدم'
    };
    setJournalTypes(prev => [...prev, newType]);
    setNewJtCode('');
    setNewJtName('');
    setNewJtDesc('');
    showToast(`تم بنجاح تسجيل رمز القيد الجديد "${newType.code}".`, 'success');
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmName || !newPmAcc) {
      showToast('يرجى تحديد اسم الحساب وطريقة الدفع.', 'warning');
      return;
    }
    const newPm = {
      id: `pm-${Date.now()}`,
      name: newPmName,
      type: newPmType,
      accountCode: newPmAcc,
      active: true
    };
    setPaymentMethods(prev => [...prev, newPm]);
    setNewPmName('');
    showToast(`تم بنجاح تفعيل حساب السداد والتحصيل: ${newPm.name}`, 'success');
  };

  const handleAddSalesRep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepName) {
      showToast('يرجى كتابة اسم مندوب المبيعات بالكامل.', 'warning');
      return;
    }
    const newRep = {
      id: `rep-${Date.now()}`,
      code: `REP-00${salesReps.length + 1}`,
      name: newRepName,
      phone: newRepPhone || 'بدون هاتف',
      commission: Number(newRepComm),
      target: Number(newRepTarget)
    };
    setSalesReps(prev => [...prev, newRep]);
    setNewRepName('');
    setNewRepPhone('');
    showToast(`تم تسجيل المندوب ${newRep.name} بنجاح وإعطائه الرمز ${newRep.code}`, 'success');
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      {/* Sidebar navigation */}
      <div className="w-[180px] shrink-0 bg-slate-100 border-l border-slate-300 flex flex-col justify-between py-4">
        <div className="space-y-1 px-2">
          <div className="text-[10px] font-bold text-slate-400 px-3 pb-2 tracking-wider">التعاريف والثوابت العامة</div>
          
          <button
            onClick={() => setActiveTab('journal_types')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'journal_types' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>أنواع القيود اليومية</span>
          </button>

          <button
            onClick={() => setActiveTab('invoice_types')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'invoice_types' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>أنواع الفواتير المعرفة</span>
          </button>

          <button
            onClick={() => setActiveTab('payment_methods')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'payment_methods' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>طرق الدفع والتحصيل</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_reps')}
            className={`w-full text-right px-3 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sales_reps' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <UserSquare2 className="w-3.5 h-3.5" />
            <span>مندوبي المبيعات</span>
          </button>
        </div>

        <div className="px-3 text-center">
          <div className="w-full h-[1px] bg-slate-200 my-2" />
          <span className="text-[10px] text-slate-400 font-mono block">التحقق من التناسق المالي نشط</span>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'journal_types' && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">تعريف وترقيم أنواع القيود اليومية</h3>
              <p className="text-[11px] text-slate-500">يتيح الميزان تصنيف القيود المالي لتبسيط مراجعة حركة الدفاتر وترحيل الموازين بشكل دوري.</p>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="p-2.5">الرمز المختصر</th>
                      <th className="p-2.5">اسم نوع السند المالي</th>
                      <th className="p-2.5">الترقيم التلقائي</th>
                      <th className="p-2.5">الشرح والتفصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journalTypes.map(jt => (
                      <tr key={jt.id} className="hover:bg-slate-50 text-slate-700">
                        <td className="p-2.5 font-bold font-mono text-blue-600">{jt.code}</td>
                        <td className="p-2.5 font-bold">{jt.name}</td>
                        <td className="p-2.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            تلقائي نشط
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400">{jt.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add form */}
              <div className="bg-white border rounded-lg p-4 space-y-3 shadow-xs">
                <span className="font-bold text-xs text-slate-800 block">إضافة نوع قيد جديد</span>
                <form onSubmit={handleAddJournalType} className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">الرمز الفرعي (JV, FX, OP):</label>
                    <input 
                      type="text" 
                      value={newJtCode}
                      onChange={e => setNewJtCode(e.target.value)}
                      placeholder="e.g. TR"
                      maxLength={4}
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">الاسم العربي الكامل:</label>
                    <input 
                      type="text" 
                      value={newJtName}
                      onChange={e => setNewJtName(e.target.value)}
                      placeholder="قيد تسوية التحويلات"
                      className="w-full text-xs p-2 bg-slate-50 border rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">وصف الاستخدام:</label>
                    <input 
                      type="text" 
                      value={newJtDesc}
                      onChange={e => setNewJtDesc(e.target.value)}
                      placeholder="لضبط عمليات نقل الصناديق"
                      className="w-full text-xs p-2 bg-slate-50 border rounded"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-all cursor-pointer shadow-xs"
                  >
                    حفظ وترخيص الرمز
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice_types' && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">تخصيص وإعداد أنواع الفواتير والمستندات</h3>
              <p className="text-[11px] text-slate-500">عرض الفواتير المفعلة وصلاحياتها ونظام الدفع المرتبط بها في قواعد بيانات المبيعات والمشتريات.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {invoiceTemplates.map(it => (
                <div key={it.id} className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-blue-600" />
                  <div className="pt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-extrabold text-blue-700">{it.code}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">نشط تجارياً</span>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-800 mt-2">{it.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">توليد القيود التلقائية: مفعل دائم للأرصدة والمخازن</p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                    <span>طريقة الدفع التلقائي:</span>
                    <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{it.defaultPay === 'cash' ? 'نقدي فوري' : 'آجل على حساب العميل'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payment_methods' && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">تعريف طرق دفع وتحصيل الأموال بالمستندات</h3>
              <p className="text-[11px] text-slate-500">تخصيص صناديق الكاش، الحسابات البنكية، والمحافظ لتوجيه القيود التلقائية لدفاتر اليومية الصحيحة.</p>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="p-2.5">اسم طريقة الدفع والتسديد</th>
                      <th className="p-2.5">نوع الحساب المالي</th>
                      <th className="p-2.5">حساب الربط بالدفتر العام</th>
                      <th className="p-2.5">الحالة بالأنظمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentMethods.map(pm => (
                      <tr key={pm.id} className="hover:bg-slate-50 text-slate-700">
                        <td className="p-2.5 font-bold flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                          <span>{pm.name}</span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-600">{pm.type}</td>
                        <td className="p-2.5 font-mono text-slate-500 font-bold">{pm.accountCode} - أصول متداولة</td>
                        <td className="p-2.5">
                          <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                            مفعل بالنقاط
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Payment Form */}
              <div className="bg-white border rounded-lg p-4 space-y-3 shadow-xs">
                <span className="font-bold text-xs text-slate-800 block">ربط طريقة دفع جديدة</span>
                <form onSubmit={handleAddPaymentMethod} className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">اسم وسيلة السداد / البنك:</label>
                    <input 
                      type="text" 
                      value={newPmName}
                      onChange={e => setNewPmName(e.target.value)}
                      placeholder="e.g. بنك البلاد الرئيسي"
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">النوع العام:</label>
                    <select 
                      value={newPmType}
                      onChange={e => setNewPmType(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border rounded"
                    >
                      <option value="نقد">نقد (صندوق مالي)</option>
                      <option value="بنك">حساب بنكي جاري</option>
                      <option value="بطاقة">بطاقة مبيعات / مدى</option>
                      <option value="شيك">شيكات ورقية مؤجلة</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">رقم الحساب المرتبط بدليل الحسابات:</label>
                    <input 
                      type="text" 
                      value={newPmAcc}
                      onChange={e => setNewPmAcc(e.target.value)}
                      placeholder="111004"
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-mono"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-all cursor-pointer shadow-xs"
                  >
                    تأكيد وربط الحساب
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales_reps' && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-800">دليل وبيانات منسوبي ومندوبي المبيعات</h3>
              <p className="text-[11px] text-slate-500">تخصيص نسب العمولات، الأهداف البيعية (Target)، ومطابقة الفواتير مع المندوبين لحساب الحوافز تلقائياً.</p>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-500 font-bold border-b">
                    <tr>
                      <th className="p-2.5">رمز المندوب</th>
                      <th className="p-2.5">اسم المندوب بالكامل</th>
                      <th className="p-2.5">رقم الهاتف الجوال</th>
                      <th className="p-2.5">النسبة (%)</th>
                      <th className="p-2.5">هدف البيع (SAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesReps.map(rep => (
                      <tr key={rep.id} className="hover:bg-slate-50 text-slate-700">
                        <td className="p-2.5 font-bold font-mono text-slate-500">{rep.code}</td>
                        <td className="p-2.5 font-bold text-slate-800">{rep.name}</td>
                        <td className="p-2.5 font-mono text-slate-500">{rep.phone}</td>
                        <td className="p-2.5 font-bold text-emerald-700 flex items-center gap-0.5">
                          <Percent className="w-3 h-3" />
                          <span>{rep.commission} %</span>
                        </td>
                        <td className="p-2.5 font-bold font-mono">{rep.target.toLocaleString()} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Representative Form */}
              <div className="bg-white border rounded-lg p-4 space-y-3 shadow-xs">
                <span className="font-bold text-xs text-slate-800 block">تسجيل مندوب مبيعات جديد</span>
                <form onSubmit={handleAddSalesRep} className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">الاسم الثلاثي للموظف / المندوب:</label>
                    <input 
                      type="text" 
                      value={newRepName}
                      onChange={e => setNewRepName(e.target.value)}
                      placeholder="e.g. سليمان فهد الدوسري"
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">رقم الهاتف الجوال:</label>
                    <input 
                      type="text" 
                      value={newRepPhone}
                      onChange={e => setNewRepPhone(e.target.value)}
                      placeholder="05xxxxxxx"
                      className="w-full text-xs p-2 bg-slate-50 border rounded font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">نسبة العمولات (%):</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={newRepComm}
                        onChange={e => setNewRepComm(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-slate-50 border rounded font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">التارغت (Target):</label>
                      <input 
                        type="number" 
                        value={newRepTarget}
                        onChange={e => setNewRepTarget(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-slate-50 border rounded font-bold font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-all cursor-pointer shadow-xs"
                  >
                    حفظ وإقرار البيانات
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

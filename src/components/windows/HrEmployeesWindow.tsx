import React, { useState, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { 
  Users, UserPlus, Trash2, Edit, Save, Plus, X, Search, Briefcase, 
  MapPin, DollarSign, Calendar, FileText, Activity, AlertCircle 
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  code: string;
  job_title: string;
  department: string;
  salary: number;
}

interface HrAction {
  id: string;
  employee_id: string;
  action_type: string;
  details: string;
  date: string;
}

interface HrEmployeesWindowProps {
  windowId: string;
  onClose: () => void;
}

export const HrEmployeesWindow: React.FC<HrEmployeesWindowProps> = ({ windowId, onClose }) => {
  const { connectedDbId, showToast } = useErp();

  // State managers
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrActions, setHrActions] = useState<HrAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Form fields
  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [empJobTitle, setEmpJobTitle] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empSalary, setEmpSalary] = useState(0);

  // HR Action log fields
  const [actionType, setActionType] = useState('hiring');
  const [actionDetails, setActionDetails] = useState('');
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingAction, setIsAddingAction] = useState(false);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    if (!connectedDbId) return;
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', connectedDbId)
        .order('name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      showToast(`خطأ في جلب بيانات الموظفين: ${err.message}`, 'error');
    }
  }, [connectedDbId]);

  // Fetch HR actions for selected employee
  const fetchHrActions = useCallback(async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('hr')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (error) throw error;
      setHrActions(data || []);
    } catch (err: any) {
      console.error('Error fetching HR actions:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Handle employee click
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsEditing(false);
    setIsNew(false);
    setIsAddingAction(false);
    fetchHrActions(emp.id);

    // Populate form fields
    setEmpName(emp.name);
    setEmpCode(emp.code);
    setEmpJobTitle(emp.job_title || '');
    setEmpDept(emp.department || '');
    setEmpSalary(emp.salary || 0);
  };

  // Handle new employee click
  const handleNewClick = () => {
    setIsNew(true);
    setIsEditing(true);
    setSelectedEmployee(null);
    setHrActions([]);

    // Reset fields
    setEmpName('');
    setEmpCode(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setEmpJobTitle('');
    setEmpDept('');
    setEmpSalary(2500);
  };

  // Validate employee inputs
  const validateEmployee = (): boolean => {
    if (!empName.trim() || empName.trim().length < 3) {
      showToast('يجب إدخال اسم الموظف كاملاً (3 أحرف على الأقل).', 'warning');
      return false;
    }
    if (!empCode.trim()) {
      showToast('يجب إدخال كود الموظف التعريفي.', 'warning');
      return false;
    }
    if (empSalary < 0) {
      showToast('يجب ألا يكون الراتب قيمة سالبة.', 'warning');
      return false;
    }
    return true;
  };

  // Save/Update employee
  const handleSaveEmployee = async () => {
    if (!validateEmployee() || !connectedDbId) return;

    const empId = isNew ? `emp-${Date.now()}` : selectedEmployee?.id;
    if (!empId) return;

    try {
      const { error } = await supabase
        .from('employees')
        .upsert({
          id: empId,
          company_id: connectedDbId,
          name: empName.trim(),
          code: empCode.trim(),
          job_title: empJobTitle.trim() || null,
          department: empDept.trim() || null,
          salary: Number(empSalary)
        });

      if (error) throw error;

      showToast(isNew ? 'تم إضافة بطاقة موظف جديد بنجاح.' : 'تم تعديل بيانات الموظف بنجاح.', 'success');
      
      // Reload and re-select
      await fetchEmployees();
      setIsEditing(false);
      setIsNew(false);
      
      const updatedEmp: Employee = {
        id: empId,
        name: empName.trim(),
        code: empCode.trim(),
        job_title: empJobTitle.trim(),
        department: empDept.trim(),
        salary: Number(empSalary)
      };
      setSelectedEmployee(updatedEmp);
      fetchHrActions(empId);
    } catch (err: any) {
      console.error('Error saving employee:', err);
      showToast(`خطأ أثناء الحفظ: ${err.message}`, 'error');
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف بطاقة هذا الموظف؟ سيتم حذف كافة السجلات والعمليات المرتبطة به.')) return;
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('تم حذف الموظف من النظام بنجاح.', 'success');
      setSelectedEmployee(null);
      setIsEditing(false);
      setIsNew(false);
      fetchEmployees();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      showToast(`فشل في حذف الموظف: ${err.message}`, 'error');
    }
  };

  // Save HR Action
  const handleAddHrAction = async () => {
    if (!selectedEmployee || !connectedDbId) return;
    if (!actionDetails.trim()) {
      showToast('يرجى إدخال تفاصيل الإجراء الوظيفي.', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('hr')
        .insert({
          id: `hr-${Date.now()}`,
          company_id: connectedDbId,
          employee_id: selectedEmployee.id,
          action_type: actionType,
          details: actionDetails.trim(),
          date: actionDate
        });

      if (error) throw error;

      showToast('تم تسجيل الإجراء الإداري للموظف بنجاح.', 'success');
      setIsAddingAction(false);
      setActionDetails('');
      fetchHrActions(selectedEmployee.id);
    } catch (err: any) {
      console.error('Error saving HR action:', err);
      showToast(`فشل إضافة الإجراء: ${err.message}`, 'error');
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 select-none text-right font-sans" dir="rtl">
      {/* Window Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-100 border-b border-slate-300">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-black text-slate-800">إدارة الموارد البشرية وشؤون الموظفين</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Left Side: Employees List */}
        <div className="w-1/3 border-l border-slate-300 flex flex-col min-h-0 bg-white">
          <div className="p-2 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن موظف، كود، أو قسم..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pr-8 pl-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <button
                onClick={handleNewClick}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="إضافة موظف جديد"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>جديد</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-bold">
                لا يوجد موظفين مسجلين حالياً.
              </div>
            ) : (
              filteredEmployees.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`p-2.5 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    selectedEmployee?.id === emp.id ? 'bg-blue-50/70 border-r-4 border-blue-600' : ''
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{emp.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{emp.job_title || 'بدون مسمى وظيفي'}</span>
                      <span className="text-slate-300">|</span>
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{emp.department || 'بدون قسم'}</span>
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                      {emp.code}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Detail & Action logs */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
          {selectedEmployee || isNew ? (
            <>
              {/* Employee Information Card */}
              <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{isNew ? 'تعريف موظف جديد' : 'بيانات الموظف التفصيلية'}</span>
                  </h3>
                  {!isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                        title="تعديل البيانات"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(selectedEmployee!.id)}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                        title="حذف الموظف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleSaveEmployee}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ</span>
                      </button>
                      {!isNew && (
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-bold"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">الاسم الكامل للموظف:</label>
                    <input
                      type="text"
                      value={empName}
                      disabled={!isEditing}
                      onChange={e => setEmpName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">الكود التعريفي (البطاقة):</label>
                    <input
                      type="text"
                      value={empCode}
                      disabled={!isEditing}
                      onChange={e => setEmpCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">المسمى الوظيفي:</label>
                    <input
                      type="text"
                      value={empJobTitle}
                      disabled={!isEditing}
                      onChange={e => setEmpJobTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">القسم / الإدارة التابع لها:</label>
                    <input
                      type="text"
                      value={empDept}
                      disabled={!isEditing}
                      onChange={e => setEmpDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">الراتب الشهري الأساسي:</label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                      <input
                        type="number"
                        value={empSalary}
                        disabled={!isEditing}
                        onChange={e => setEmpSalary(Number(e.target.value))}
                        className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HR Actions Log Section */}
              {!isNew && selectedEmployee && (
                <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>سجل الإجراءات الوظيفية والقرارات الإدارية</span>
                    </h3>
                    {!isAddingAction ? (
                      <button
                        onClick={() => setIsAddingAction(true)}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>تسجيل إجراء</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsAddingAction(false)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>

                  {/* Add HR Action Panel */}
                  {isAddingAction && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع الإجراء:</label>
                          <select
                            value={actionType}
                            onChange={e => setActionType(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="hiring">قرار تعيين جديد</option>
                            <option value="salary_increase">زيادة وتعديل الراتب</option>
                            <option value="evaluation">تقييم أداء سنوي/دوري</option>
                            <option value="warning">إنذار / لفت نظر</option>
                            <option value="promotion">ترقية وتعديل مسمى</option>
                            <option value="termination">إنهاء خدمات</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">تاريخ الإجراء:</label>
                          <input
                            type="date"
                            value={actionDate}
                            onChange={e => setActionDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">تفاصيل القرار والبيان:</label>
                          <textarea
                            rows={2}
                            value={actionDetails}
                            onChange={e => setActionDetails(e.target.value)}
                            placeholder="اكتب هنا كافة تفاصيل القرار، أسبابه والمبالغ إن وجدت..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={handleAddHrAction}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                        >
                          تسجيل الإجراء نهائياً
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions History List */}
                  <div className="space-y-2">
                    {hrActions.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-slate-300" />
                        <span>لا يوجد إجراءات إدارية مسجلة لهذا الموظف بعد.</span>
                      </div>
                    ) : (
                      hrActions.map(act => (
                        <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                          <div className="p-1.5 bg-white border border-slate-200 rounded-lg shrink-0">
                            <Activity className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-slate-800">
                                {act.action_type === 'hiring' && 'قرار تعيين جديد'}
                                {act.action_type === 'salary_increase' && 'زيادة وتعديل الراتب'}
                                {act.action_type === 'evaluation' && 'تقييم أداء سنوي/دوري'}
                                {act.action_type === 'warning' && 'إنذار / لفت نظر'}
                                {act.action_type === 'promotion' && 'ترقية وتعديل مسمى'}
                                {act.action_type === 'termination' && 'إنهاء خدمات'}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {act.date}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold mt-1 leading-relaxed">
                              {act.details}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <Users className="w-12 h-12 text-slate-300 stroke-1" />
              <h3 className="text-xs font-black text-slate-600">بوابة الموارد البشرية وشؤون الموظفين</h3>
              <p className="text-[11px] text-slate-400 font-bold max-w-sm">
                يرجى تحديد موظف من القائمة اليمنى لاستعراض وتعديل بياناته الوظيفية، أو النقر على "جديد" لإضافة موظف جديد وتعيينه.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

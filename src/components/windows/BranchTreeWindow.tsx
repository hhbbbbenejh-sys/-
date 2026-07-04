import React, { useState, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { supabase } from '../../utils/supabase';
import { Layers, MapPin, Warehouse, Plus, Edit3, Trash2, Check, X, Loader2, Database } from 'lucide-react';
import { Branch, Warehouse as ErpWarehouse } from '../../types/erp';

export const BranchTreeWindow: React.FC<{ windowId: string; onClose: () => void }> = ({ onClose }) => {
  const { 
    branches, 
    setBranches,
    warehouses, 
    setWarehouses,
    addBranch, 
    addWarehouse,
    connectedDbId,
    showToast 
  } = useErp();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branches[0]?.id || null);
  const [selectedWhId, setSelectedWhId] = useState<string | null>(null);

  // Loading & Database status
  const [loading, setLoading] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Forms states
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');

  const [showAddWh, setShowAddWh] = useState(false);
  const [whName, setWhName] = useState('');

  // Editing states
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchCode, setEditBranchCode] = useState('');

  const [editingWhId, setEditingWhId] = useState<string | null>(null);
  const [editWhName, setEditWhName] = useState('');

  // Fetch branches and warehouses from DB
  const fetchData = useCallback(async () => {
    if (!connectedDbId) return;
    setLoading(true);

    try {
      // Fetch Branches
      const { data: bData, error: bError } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', connectedDbId);

      // Fetch Warehouses
      const { data: wData, error: wError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('company_id', connectedDbId);

      if (bError || wError) {
        throw new Error(bError?.message || wError?.message);
      }

      setIsUsingSupabase(true);

      // Map branches
      const mappedBranches: Branch[] = (bData || []).map(row => ({
        id: row.id,
        name: row.name,
        code: row.code
      }));
      setBranches(mappedBranches);
      if (mappedBranches.length > 0 && !selectedBranchId) {
        setSelectedBranchId(mappedBranches[0].id);
      }

      // Map warehouses (use location for branchId backup)
      const mappedWarehouses: ErpWarehouse[] = (wData || []).map(row => {
        let bId = mappedBranches[0]?.id || 'br-default';
        if (row.location && row.location.startsWith('branchId:')) {
          bId = row.location.replace('branchId:', '');
        }
        return {
          id: row.id,
          name: row.name,
          branchId: bId
        };
      });
      setWarehouses(mappedWarehouses);

    } catch (err: any) {
      console.warn('Database connection failed, falling back to local simulation context:', err.message);
      setIsUsingSupabase(false);
    } finally {
      setLoading(false);
    }
  }, [connectedDbId, setBranches, setWarehouses]);

  useEffect(() => {
    fetchData();
  }, [connectedDbId]);

  // Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim()) {
      showToast('يرجى تعبئة كافة الحقول لحفظ الفرع الجديد.', 'warning');
      return;
    }
    if (!connectedDbId) {
      showToast('يجب الاتصال بقاعدة البيانات لحفظ الفروع.', 'error');
      return;
    }

    const newId = `br-${Date.now()}`;
    const branchRecord = {
      id: newId,
      company_id: connectedDbId,
      code: branchCode.trim(),
      name: branchName.trim()
    };

    try {
      const { error } = await supabase
        .from('branches')
        .insert([branchRecord]);

      if (error) throw error;

      const newBranch: Branch = {
        id: newId,
        name: branchName.trim(),
        code: branchCode.trim(),
      };

      addBranch(newBranch);
      setBranchName('');
      setBranchCode('');
      setShowAddBranch(false);
      setSelectedBranchId(newBranch.id);
      showToast(`تم تسجيل فرع إداري جديد "${branchName}" بنجاح ومزامنته سحابياً.`, 'success');
    } catch (err: any) {
      console.error('Error adding branch:', err);
      showToast(`فشل إضافة الفرع: ${err.message}`, 'error');
    }
  };

  // Edit/Update Branch
  const handleUpdateBranch = async (id: string) => {
    if (!editBranchName.trim() || !editBranchCode.trim()) return;

    try {
      const { error } = await supabase
        .from('branches')
        .update({
          name: editBranchName.trim(),
          code: editBranchCode.trim()
        })
        .eq('id', id);

      if (error) throw error;

      setBranches(prev => prev.map(b => b.id === id ? { ...b, name: editBranchName.trim(), code: editBranchCode.trim() } : b));
      setEditingBranchId(null);
      showToast('تم تحديث بيانات الفرع الإداري بنجاح.', 'success');
    } catch (err: any) {
      console.error('Error updating branch:', err);
      showToast(`فشل التحديث: ${err.message}`, 'error');
    }
  };

  // Delete Branch
  const handleDeleteBranch = async (id: string, name: string) => {
    const hasWarehouses = warehouses.some(wh => wh.branchId === id);
    if (hasWarehouses) {
      showToast('لا يمكن حذف هذا الفرع لوجود مستودعات تابعة له.', 'warning');
      return;
    }

    if (!confirm(`هل أنت متأكد من رغبتك في حذف الفرع الإداري "${name}" نهائياً؟`)) return;

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBranches(prev => prev.filter(b => b.id !== id));
      if (selectedBranchId === id) {
        setSelectedBranchId(null);
      }
      showToast('تم حذف الفرع الإداري ومزامنته بنجاح.', 'success');
    } catch (err: any) {
      console.error('Error deleting branch:', err);
      showToast(`فشل الحذف: ${err.message}`, 'error');
    }
  };

  // Create Warehouse (Store)
  const handleCreateWh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !selectedBranchId) {
      showToast('يرجى كتابة اسم المستودع الجديد.', 'warning');
      return;
    }

    const newId = `wh-${Date.now()}`;
    const whRecord = {
      id: newId,
      company_id: connectedDbId,
      code: `WH-${Date.now().toString().slice(-4)}`,
      name: whName.trim(),
      location: `branchId:${selectedBranchId}`, // Store branchId association inside location
      is_active: true
    };

    try {
      const { error } = await supabase
        .from('warehouses')
        .insert([whRecord]);

      if (error) throw error;

      const newWh: ErpWarehouse = {
        id: newId,
        name: whName.trim(),
        branchId: selectedBranchId,
      };

      addWarehouse(newWh);
      setWhName('');
      setShowAddWh(false);
      setSelectedWhId(newWh.id);
      showToast(`تم تسجيل مستودع تخزين جديد "${whName}" وربطه بالفرع بنجاح.`, 'success');
    } catch (err: any) {
      console.error('Error adding warehouse:', err);
      showToast(`فشل إضافة المستودع: ${err.message}`, 'error');
    }
  };

  // Edit/Update Warehouse Name
  const handleUpdateWarehouse = async (id: string) => {
    if (!editWhName.trim()) return;

    try {
      const { error } = await supabase
        .from('warehouses')
        .update({ name: editWhName.trim() })
        .eq('id', id);

      if (error) throw error;

      setWarehouses(prev => prev.map(w => w.id === id ? { ...w, name: editWhName.trim() } : w));
      setEditingWhId(null);
      showToast('تم تحديث اسم مستودع التخزين بنجاح.', 'success');
    } catch (err: any) {
      console.error('Error updating warehouse:', err);
      showToast(`فشل التحديث: ${err.message}`, 'error');
    }
  };

  // Delete Warehouse
  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف مستودع الصرف "${name}" نهائياً؟`)) return;

    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWarehouses(prev => prev.filter(w => w.id !== id));
      if (selectedWhId === id) {
        setSelectedWhId(null);
      }
      showToast('تم إزالة مستودع التخزين ومزامنته بنجاح.', 'success');
    } catch (err: any) {
      console.error('Error deleting warehouse:', err);
      showToast(`فشل الحذف: ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      
      {/* DB Sync Indicator bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-bold shrink-0">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>إدارة الفروع والمستودعات الإدارية</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isUsingSupabase ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span>{isUsingSupabase ? 'مزامنة Supabase نشطة (فروع ومستودعات حقيقية)' : 'وضع المزامنة الاحتياطي'}</span>
        </div>
      </div>

      <div className="flex-1 flex divide-x divide-x-reverse divide-slate-300 overflow-hidden">
        {/* Left panel: Tree View */}
        <div className="w-1/2 p-4 flex flex-col h-full overflow-y-auto space-y-3 bg-slate-100/50">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 shrink-0">
            <span className="font-bold text-xs text-slate-500">هيكل شجرة الفروع والمستودعات</span>
            <button 
              onClick={() => {
                setShowAddBranch(true);
                setShowAddWh(false);
              }}
              className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors cursor-pointer"
              title="إضافة فرع جديد"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-1.5">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-[11px]">جاري تحميل الهيكل التنظيمي...</span>
              </div>
            ) : branches.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-xs font-bold">
                لا يوجد فروع إدارية معرفة حالياً.
              </div>
            ) : (
              branches.map(br => {
                const isSelected = selectedBranchId === br.id && !selectedWhId;
                const isEditing = editingBranchId === br.id;

                return (
                  <div key={br.id} className="space-y-1 group/branch">
                    <div className="flex items-center justify-between gap-1">
                      {isEditing ? (
                        <div className="flex-1 flex gap-1 p-1 bg-white border rounded">
                          <input 
                            type="text"
                            value={editBranchName}
                            onChange={e => setEditBranchName(e.target.value)}
                            className="flex-1 text-xs px-1 focus:outline-none"
                            placeholder="اسم الفرع"
                          />
                          <input 
                            type="text"
                            value={editBranchCode}
                            onChange={e => setEditBranchCode(e.target.value)}
                            className="w-12 text-xs px-1 focus:outline-none text-center font-mono"
                            placeholder="الرمز"
                          />
                          <button onClick={() => handleUpdateBranch(br.id)} className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingBranchId(null)} className="text-slate-400 hover:bg-slate-100 p-0.5 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedBranchId(br.id);
                            setSelectedWhId(null);
                          }}
                          className={`flex-1 text-right p-2 rounded flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-100 text-blue-900 font-bold border-r-4 border-blue-600 shadow-sm'
                              : 'hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>{br.name} (رمز: {br.code})</span>
                          </span>
                        </button>
                      )}

                      {!isEditing && (
                        <div className="hidden group-hover/branch:flex items-center gap-0.5">
                          <button 
                            onClick={() => {
                              setEditingBranchId(br.id);
                              setEditBranchName(br.name);
                              setEditBranchCode(br.code);
                            }}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-200"
                            title="تعديل الفرع"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBranch(br.id, br.name)}
                            className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-slate-200"
                            title="حذف الفرع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Warehouses inside this branch */}
                    <div className="pr-6 space-y-1">
                      {warehouses.filter(wh => wh.branchId === br.id).map(wh => {
                        const isWhSelected = selectedWhId === wh.id;
                        const isWhEditing = editingWhId === wh.id;

                        return (
                          <div key={wh.id} className="group/wh flex items-center justify-between gap-1">
                            {isWhEditing ? (
                              <div className="flex-1 flex gap-1 p-1 bg-white border rounded">
                                <input 
                                  type="text"
                                  value={editWhName}
                                  onChange={e => setEditWhName(e.target.value)}
                                  className="flex-1 text-xs px-1 focus:outline-none"
                                />
                                <button onClick={() => handleUpdateWarehouse(wh.id)} className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingWhId(null)} className="text-slate-400 hover:bg-slate-100 p-0.5 rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedBranchId(br.id);
                                  setSelectedWhId(wh.id);
                                }}
                                className={`flex-1 text-right p-1.5 rounded flex items-center text-xs transition-colors cursor-pointer ${
                                  isWhSelected
                                    ? 'bg-emerald-100 text-emerald-900 font-bold border-r-4 border-emerald-600 shadow-sm'
                                    : 'hover:bg-slate-200 text-slate-600'
                                }`}
                              >
                                <Warehouse className="w-3.5 h-3.5 text-emerald-600 mr-1 ml-1.5" />
                                <span>{wh.name}</span>
                              </button>
                            )}

                            {!isWhEditing && (
                              <div className="hidden group-hover/wh:flex items-center gap-0.5 shrink-0">
                                <button 
                                  onClick={() => {
                                    setEditingWhId(wh.id);
                                    setEditWhName(wh.name);
                                  }}
                                  className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-200"
                                  title="تعديل المستودع"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                                  className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-slate-200"
                                  title="حذف المستودع"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel: Details & Creators */}
        <div className="w-1/2 p-4 h-full bg-white overflow-y-auto flex flex-col justify-between">
          
          {/* ADD BRANCH FORM */}
          {showAddBranch ? (
            <form onSubmit={handleCreateBranch} className="space-y-3.5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-md animate-window-open shrink-0">
              <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>إضافة فرع جديد للمجموعة</span>
              </h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">اسم الفرع:</label>
                <input 
                  type="text" 
                  required
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">رمز الفرع (ترميز محاسبي):</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: 03"
                  value={branchCode}
                  onChange={e => setBranchCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddBranch(false)}
                  className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  إضافة الفرع
                </button>
              </div>
            </form>
          ) : showAddWh ? (
            /* ADD WAREHOUSE FORM */
            <form onSubmit={handleCreateWh} className="space-y-3.5 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-md animate-window-open shrink-0">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <Warehouse className="w-4 h-4" />
                <span>إضافة مستودع صرف جديد</span>
              </h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">المستودع تابع للفرع:</label>
                <div className="p-1.5 bg-slate-100 border text-xs font-bold text-slate-700 rounded">
                  {branches.find(b => b.id === selectedBranchId)?.name || 'غير محدد'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">اسم المستودع الجديد:</label>
                <input 
                  type="text" 
                  required
                  value={whName}
                  onChange={e => setWhName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddWh(false)}
                  className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  إضافة المستودع
                </button>
              </div>
            </form>
          ) : (
            /* DETAIL CARD VIEW */
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider border-b pb-1.5">بطاقة معلومات التفاصيل</h3>

              {selectedWhId ? (
                <div className="space-y-3 p-3 bg-slate-50 border rounded-lg animate-window-open">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">بطاقة مستودع</span>
                  </div>
                  <div className="text-xs space-y-2 text-slate-600">
                    <p>اسم المستودع: <strong className="text-slate-800">{warehouses.find(w => w.id === selectedWhId)?.name}</strong></p>
                    <p>الفرع الإداري: <strong className="text-slate-800">{branches.find(b => b.id === selectedBranchId)?.name}</strong></p>
                    <p>نوع السعر التلقائي: <strong>سعر التجزئة المعتمد</strong></p>
                    <p>طريقة الجرد: <strong className="text-blue-700">مستمر دائم (Live Sync)</strong></p>
                  </div>
                </div>
              ) : selectedBranchId ? (
                <div className="space-y-3 p-3 bg-slate-50 border rounded-lg animate-window-open">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">بطاقة الفرع الإداري</span>
                  </div>
                  <div className="text-xs space-y-2 text-slate-600 mb-4">
                    <p>اسم الفرع: <strong className="text-slate-800">{branches.find(b => b.id === selectedBranchId)?.name}</strong></p>
                    <p>ترميز الحسابات: <strong className="text-slate-800 font-mono">{branches.find(b => b.id === selectedBranchId)?.code}</strong></p>
                    <p>المدينة والبلد: <strong className="text-slate-800">المملكة العربية السعودية</strong></p>
                  </div>

                  <button 
                    onClick={() => {
                      setShowAddWh(true);
                      setShowAddBranch(false);
                    }}
                    className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold text-xs rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة مستودع لهذا الفرع</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-10 font-bold">اختر فرع أو مستودع من القائمة لعرض وتعديل بطاقته.</p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center shrink-0">
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold cursor-pointer"
            >
              تحديث
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { HelpCircle, Info, Landmark } from 'lucide-react';

export const AboutWindow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="p-6 bg-slate-50 h-full flex flex-col items-center justify-center text-center space-y-4 select-none">
      <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg">
        <Landmark className="w-12 h-12" />
      </div>
      
      <div className="space-y-1">
        <h3 className="font-extrabold text-lg text-slate-800">برنامج الميزان دوت نت لخدمة الحسابات والمستودعات ERP</h3>
        <p className="text-xs text-slate-500 font-bold font-mono">الجيل الحادي عشر - الإصدار v11.4.2</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-4 w-full text-right text-xs leading-relaxed text-slate-600 space-y-2">
        <div className="flex justify-between border-b pb-1.5">
          <span>الترخيص والشركة:</span>
          <strong className="text-slate-800">مؤسسة الميزان للبرمجيات والمحاسبة</strong>
        </div>
        <div className="flex justify-between border-b pb-1.5">
          <span>الرقم التسلسلي النشط:</span>
          <strong className="text-blue-600 font-mono">ALM-2026-99X88-PRO</strong>
        </div>
        <div className="flex justify-between">
          <span>تاريخ التحديث الأخير:</span>
          <strong className="text-slate-800 font-mono">2026-07-02</strong>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">جميع الحقوق محفوظة لمطوري الميزان © {new Date().getFullYear()}</p>
      
      <button 
        onClick={onClose}
        className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded transition-all cursor-pointer"
      >
        موافق
      </button>
    </div>
  );
};

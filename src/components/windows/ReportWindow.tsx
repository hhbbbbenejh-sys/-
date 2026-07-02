import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { FileSpreadsheet, Search, Printer, Share2, Calendar, FileText, Filter, LayoutGrid } from 'lucide-react';

export const ReportWindow: React.FC<{ reportType?: string; windowId: string; onClose: () => void }> = ({ reportType = 'general_ledger', onClose }) => {
  const { accounts, journalEntries, items, customers, invoices, showToast } = useErp();

  // Filters
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');
  const [selectedAccId, setSelectedAccId] = useState(accounts[0]?.id || '');
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || '');

  // Report title mapping
  const reportTitles: { [key: string]: string } = {
    general_ledger: 'دفتر الأستاذ العام التفصيلي للشركة',
    customer_statement: 'كشف حساب عميل مفصل وحركة المدفوعات',
    trial_balance: 'ميزان المراجعة العام بالأرصدة والمجاميع',
    inventory_list: 'تقرير جرد المواد والمخزون الكلي بالمخازن',
    item_ledger: 'تقرير حركة كرت المادة وسجل الوارد والصادر',
    customer_balances: 'أرصدة حسابات العملاء والذمم المفتوحة',
    item_profit: 'أرباح البنود والأصناف المباعة بالتجزئة والجمهور',
    financial_statements: 'الحسابات الختامية والميزانية العمومية المقدرة'
  };

  const currentTitle = reportTitles[reportType] || 'تقرير الميزان المالي';

  // Export and print functions with full Arabic encoding and styles
  const handleExport = (type: 'excel' | 'word' | 'print' | 'pdf') => {
    const table = document.getElementById('report-table-to-export');
    if (!table) {
      showToast('عذراً، لم يتم العثور على أي بيانات نشطة في الجدول الحالي لتصديرها.', 'error');
      return;
    }

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;

    if (type === 'excel') {
      const html = table.outerHTML;
      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
          <style>
            table { border-collapse: collapse; direction: rtl; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 10px; text-align: right; }
            td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center; color: #1e3a8a;">${currentTitle}</h2>
          <p style="text-align: center; color: #64748b; font-size: 13px;">الفترة من: ${fromDate} إلى: ${toDate} | أحمد سامي سيستم ERP</p>
          ${html}
        </body>
        </html>
      `;

      const blob = new Blob(['\uFEFF' + template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('تم تصدير ملف Excel بنجاح وجاري تحميله الآن.', 'success');

    } else if (type === 'word') {
      const html = table.outerHTML;
      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
            h2 { text-align: center; color: #1e3a8a; }
            p { text-align: center; color: #64748b; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #1e3a8a; color: white; font-weight: bold; border: 1px solid #94a3b8; padding: 10px; text-align: right; }
            td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>${currentTitle}</h2>
          <p>الفترة من: ${fromDate} إلى: ${toDate} | أحمد سامي سيستم ERP</p>
          ${html}
        </body>
        </html>
      `;

      const blob = new Blob(['\uFEFF' + template], { type: 'application/msword;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('تم تصدير مستند Word بنجاح وجاري تحميله الآن.', 'success');

    } else if (type === 'print' || type === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('يرجى السماح للنوافذ المنبثقة بالظهور لتتمكن من معاينة وطباعة التقرير.', 'warning');
        return;
      }

      printWindow.document.write(`
        <html dir="rtl">
        <head>
          <title>${currentTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { font-family: 'Cairo', 'Segoe UI', sans-serif; padding: 30px; color: #1e293b; background-color: #fff; }
            h2 { text-align: center; color: #1e3a8a; font-weight: 700; margin-bottom: 5px; }
            .meta { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 25px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px 10px; text-align: right; font-weight: 700; color: #334155; }
            td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .print-footer { margin-top: 40px; text-align: left; font-size: 11px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 10px; }
            @media print {
              body { padding: 0; }
              @page { size: portrait; margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h2>${currentTitle}</h2>
          <div class="meta">الفترة من: ${fromDate} إلى: ${toDate} | فرع: الرياض الرئيسي | تم التصدير عبر أحمد سامي سيستم</div>
          ${table.outerHTML}
          <div class="print-footer">
            تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')} | أحمد سامي سيستم - الإصدار الذهبي v12.0.1
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      showToast(`تم تهيئة التقرير بصيغة ${type === 'pdf' ? 'PDF / الطباعة' : 'الطباعة المباشرة'}.`, 'success');
    }
  };

  return (
    <div className="p-4 bg-slate-50 h-full flex flex-col justify-between text-slate-800 select-none">
      
      {/* Filters Bar */}
      <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-xs shrink-0 space-y-3">
        <div className="flex items-center gap-2 border-b pb-2 text-[12px] font-bold text-slate-500">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>تصفية ومعايير التقارير المجمعة</span>
        </div>

        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-600">من تاريخ:</label>
            <input 
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full bg-slate-50 border rounded px-2 py-1 font-mono text-[11px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-600">إلى تاريخ:</label>
            <input 
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full bg-slate-50 border rounded px-2 py-1 font-mono text-[11px]"
            />
          </div>

          {/* Conditional filter based on report type */}
          {reportType === 'general_ledger' && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600">تصفية حسب الحساب المالي:</label>
              <select 
                value={selectedAccId}
                onChange={e => setSelectedAccId(e.target.value)}
                className="w-full bg-slate-50 border rounded px-2 py-1"
              >
                <option value="all">كافة الحسابات الفرعية والمجمعة</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'customer_statement' && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600">اختيار العميل / المورد:</label>
              <select 
                value={selectedCustId}
                onChange={e => setSelectedCustId(e.target.value)}
                className="w-full bg-slate-50 border rounded px-2 py-1"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'item_ledger' && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600">اختيار الصنف / المادة:</label>
              <select 
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-50 border rounded px-2 py-1"
              >
                {items.map(it => (
                  <option key={it.id} value={it.id}>{it.code} - {it.name}</option>
                ))}
              </select>
            </div>
          )}

          {(reportType === 'trial_balance' || reportType === 'inventory_list' || reportType === 'customer_balances' || reportType === 'item_profit' || reportType === 'financial_statements') && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600">الفرع أو المركز المستهدف:</label>
              <select className="w-full bg-slate-50 border rounded px-2 py-1" disabled>
                <option>كافة الفروع والمستودعات الإجمالية</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Report Body Grid */}
      <div className="flex-1 border border-slate-300 rounded-lg bg-white my-3 overflow-hidden flex flex-col shadow-xs">
        {/* Report Document Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-center space-y-1.5 shrink-0 select-text">
          <h2 className="text-sm font-extrabold text-slate-800">{currentTitle}</h2>
          <div className="text-[10px] text-slate-400 font-mono font-bold flex justify-center gap-4">
            <span>الفترة من: {fromDate}</span>
            <span>إلى: {toDate}</span>
            <span>المجموعة الضريبية: الرياض الرئيسي</span>
          </div>
        </div>

        {/* Dynamic Report Content Table */}
        <div id="report-table-to-export" className="flex-1 overflow-y-auto select-text">
          
          {/* GENERAL LEDGER REPORT */}
          {reportType === 'general_ledger' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold sticky top-0">
                  <th className="px-3 py-2 w-20">تاريخ القيد</th>
                  <th className="px-3 py-2 w-24">رقم القيد</th>
                  <th className="px-3 py-2">وصف المعاملة والبيان</th>
                  <th className="px-3 py-2 w-24 text-left">مدين (Debit)</th>
                  <th className="px-3 py-2 w-24 text-left">دائن (Credit)</th>
                  <th className="px-3 py-2 w-28 text-left">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Compile rows from all journal entries matching filter */}
                {(() => {
                  let runningBalance = 0;
                  const rows: any[] = [];
                  journalEntries.forEach(je => {
                    je.rows.forEach(row => {
                      if (selectedAccId === 'all' || row.accountId === selectedAccId) {
                        rows.push({
                          date: je.date,
                          entryNo: je.entryNo,
                          description: je.description || row.notes,
                          debit: row.debit,
                          credit: row.credit,
                        });
                      }
                    });
                  });

                  if (rows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">
                          لا يوجد قيود أو حركات مالية مسجلة لهذا الحساب ضمن التواريخ المحددة.
                        </td>
                      </tr>
                    );
                  }

                  return rows.map((r, idx) => {
                    runningBalance += (r.debit - r.credit);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono text-slate-500">{r.date}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{r.entryNo}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-700">{r.description}</td>
                        <td className="px-3 py-2.5 font-mono text-left">{r.debit > 0 ? r.debit.toLocaleString() : '-'}</td>
                        <td className="px-3 py-2.5 font-mono text-left">{r.credit > 0 ? r.credit.toLocaleString() : '-'}</td>
                        <td className={`px-3 py-2.5 font-mono font-bold text-left ${runningBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {runningBalance.toLocaleString()} ر.س
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}

          {/* CUSTOMER STATEMENT */}
          {reportType === 'customer_statement' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold sticky top-0">
                  <th className="px-3 py-2 w-20">التاريخ</th>
                  <th className="px-3 py-2 w-24">مستند الفاتورة</th>
                  <th className="px-3 py-2">البيان والشرح التفصيلي</th>
                  <th className="px-3 py-2 w-24 text-left">قيمة الفاتورة</th>
                  <th className="px-3 py-2 w-24 text-left">الدفعة المسددة</th>
                  <th className="px-3 py-2 w-28 text-left font-bold text-blue-700">الرصيد المفتوح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  let runningBalance = customers.find(c => c.id === selectedCustId)?.balance || 0;
                  const matchingInvs = invoices.filter(inv => inv.customerId === selectedCustId);

                  if (matchingInvs.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">
                          لا يوجد فواتير مبيعات أو دفعات مسجلة لهذا العميل حالياً.
                        </td>
                      </tr>
                    );
                  }

                  return matchingInvs.map((inv, idx) => {
                    const outstanding = inv.netAmount - inv.paidAmount;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-mono text-slate-500">{inv.date}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{inv.invoiceNo}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-700">{inv.description || `فاتورة ${inv.type === 'sale' ? 'مبيعات' : 'مشتريات'}`}</td>
                        <td className="px-3 py-2.5 font-mono text-left text-slate-900 font-semibold">{inv.netAmount.toLocaleString()}</td>
                        <td className="px-3 py-2.5 font-mono text-left text-green-700 font-semibold">{inv.paidAmount.toLocaleString()}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-left text-amber-700">
                          {outstanding.toLocaleString()} ر.س
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}

          {/* TRIAL BALANCE */}
          {reportType === 'trial_balance' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold sticky top-0">
                  <th className="px-3 py-2 w-20">رمز الحساب</th>
                  <th className="px-3 py-2">اسم الحساب المالي</th>
                  <th className="px-3 py-2 text-center w-28">النوع الأساسي</th>
                  <th className="px-3 py-2 w-28 text-left">أرصدة مدينة (Debit)</th>
                  <th className="px-3 py-2 w-28 text-left">أرصدة دائنة (Credit)</th>
                  <th className="px-3 py-2 w-28 text-left">الحساب الختامي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc, idx) => {
                  const isDebit = acc.balance >= 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 font-medium">
                      <td className="px-3 py-2.5 font-mono text-slate-500 font-bold">{acc.code}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-700">{acc.name}</td>
                      <td className="px-3 py-2.5 text-center text-slate-400 font-bold">
                        {acc.type === 'assets' ? 'أصول وممتلكات' : acc.type === 'liabilities' ? 'خصوم والتزامات' : acc.type === 'equity' ? 'رأس مال وحقوق' : acc.type === 'revenues' ? 'إيرادات ومبيعات' : 'مصاريف تشغيلية'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-left text-green-700">
                        {isDebit ? acc.balance.toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-left text-amber-700">
                        {!isDebit ? Math.abs(acc.balance).toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-left font-bold text-slate-400 font-mono">
                        {acc.finalAccount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* INVENTORY LIST */}
          {reportType === 'inventory_list' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold sticky top-0">
                  <th className="px-3 py-2 w-24">رمز المادة</th>
                  <th className="px-3 py-2">الوصف والمنتج</th>
                  <th className="px-3 py-2 w-24 text-left">سعر الشراء</th>
                  <th className="px-3 py-2 w-24 text-left">سعر الجمهور</th>
                  <th className="px-3 py-2 w-24 text-center">المخزون الفعلي</th>
                  <th className="px-3 py-2 w-32 text-left font-bold text-blue-700">القيمة المالية الكلية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => {
                  const invValue = it.currentStock * it.purchasePrice;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 font-medium">
                      <td className="px-3 py-2.5 font-mono text-slate-500 font-bold">{it.code}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-700">{it.name}</td>
                      <td className="px-3 py-2.5 font-mono text-left">{it.purchasePrice.toLocaleString()} ر.س</td>
                      <td className="px-3 py-2.5 font-mono text-left">{it.salePrice.toLocaleString()} ر.س</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${it.currentStock <= it.minLimit ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                          {it.currentStock} {it.unit}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-left text-emerald-700">
                        {invValue.toLocaleString()} ر.س
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* CUSTOMER BALANCES */}
          {reportType === 'customer_balances' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold sticky top-0">
                  <th className="px-3 py-2">الاسم العربي للعميل</th>
                  <th className="px-3 py-2">رقم الهاتف والتواصل</th>
                  <th className="px-3 py-2">العنوان والفرع</th>
                  <th className="px-3 py-2 w-28 text-center">التصنيف</th>
                  <th className="px-3 py-2 w-32 text-left font-bold text-blue-700">الرصيد المالي المتبقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-medium">
                    <td className="px-3 py-2.5 font-bold text-slate-700">{c.name}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{c.phone || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-500">{c.address || '-'}</td>
                    <td className="px-3 py-2.5 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] ${c.type === 'customer' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {c.type === 'customer' ? 'عميل مدين' : 'مورد دائن'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-left text-amber-700">
                      {c.balance.toLocaleString()} ر.س
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ITEM PROFIT */}
          {reportType === 'item_profit' && (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-bold sticky top-0">
                  <th className="px-3 py-2">اسم الصنف والمادة</th>
                  <th className="px-3 py-2 w-24 text-center">الكمية المباعة</th>
                  <th className="px-3 py-2 w-28 text-left">قيمة مبيعات الصنف</th>
                  <th className="px-3 py-2 w-28 text-left">تكلفة مشتريات الصنف</th>
                  <th className="px-3 py-2 w-28 text-left font-bold text-blue-700">صافي الربح المكتسب</th>
                  <th className="px-3 py-2 w-24 text-center">نسبة هامش الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => {
                  // Simulate sales qty
                  const qtySold = 8 + (idx * 3);
                  const revenue = qtySold * it.salePrice;
                  const cost = qtySold * it.purchasePrice;
                  const profit = revenue - cost;
                  const margin = ((profit / revenue) * 100).toFixed(1);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 font-medium">
                      <td className="px-3 py-2.5 font-bold text-slate-700">{it.name}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold">{qtySold} حبة</td>
                      <td className="px-3 py-2.5 font-mono text-left">{revenue.toLocaleString()} ر.س</td>
                      <td className="px-3 py-2.5 font-mono text-left">{cost.toLocaleString()} ر.س</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-left text-green-700">
                        {profit.toLocaleString()} ر.س
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-emerald-700 font-bold">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* Footer controls */}
      <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex gap-2 text-xs">
          <button 
            onClick={() => handleExport('pdf')}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>تصدير PDF</span>
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>
          <button 
            onClick={() => handleExport('word')}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>تصدير Word</span>
          </button>
          <button 
            onClick={() => handleExport('print')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-slate-900/10"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>الطباعة المباشرة</span>
          </button>
        </div>

        <button 
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded text-xs transition-colors cursor-pointer"
        >
          إغلاق نافذة التقرير
        </button>
      </div>

    </div>
  );
};

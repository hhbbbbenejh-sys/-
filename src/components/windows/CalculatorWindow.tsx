import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Calculator, Trash2, Copy, Check, RotateCcw, ArrowLeft, Equal } from 'lucide-react';

interface CalculatorWindowProps {
  windowId: string;
  onClose: () => void;
}

export const CalculatorWindow: React.FC<CalculatorWindowProps> = ({ windowId, onClose }) => {
  const { showToast } = useErp();
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleNumClick = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(prev => prev + num);
    }
  };

  const handleOperatorClick = (op: string) => {
    setEquation(prev => prev + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleEqual = () => {
    try {
      const fullEq = equation + display;
      if (!fullEq || fullEq.trim() === '') return;
      
      // Clean up multiplication and division symbols for javascript eval
      const evalExpression = fullEq.replace(/×/g, '*').replace(/÷/g, '/');
      
      // Safe evaluation of mathematical expression
      // eslint-disable-next-line no-eval
      const result = eval(evalExpression);
      
      const formattedResult = Number(result).toLocaleString('en-US', {
        maximumFractionDigits: 4
      });

      const historyItem = `${fullEq} = ${formattedResult}`;
      setHistory(prev => [historyItem, ...prev].slice(0, 20));
      setDisplay(String(result));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    showToast('تم نسخ الناتج إلى الحافظة', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    showToast('تم تفريغ سجل الحسابات', 'info');
  };

  const applyHistoryVal = (valStr: string) => {
    // Extract the result from "equation = result"
    const parts = valStr.split('=');
    if (parts.length === 2) {
      const val = parts[1].trim().replace(/,/g, '');
      setDisplay(val);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 select-none overflow-hidden" dir="rtl">
      {/* Tape history column */}
      <div className="w-[180px] bg-slate-100 border-l border-slate-300 flex flex-col justify-between p-3 shrink-0">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
            <span className="text-[10px] font-extrabold text-slate-500">سجل العمليات (شريط الحاسبة)</span>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-[9px] text-red-500 hover:text-red-700 font-bold"
                title="تفريغ السجل"
              >
                مسح
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px]">
            {history.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                لا توجد عمليات سابقة.
              </div>
            ) : (
              history.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => applyHistoryVal(item)}
                  className="p-1.5 bg-white border border-slate-200 rounded hover:border-blue-400 cursor-pointer transition-all text-left"
                >
                  <p className="text-slate-400 text-[9px] truncate">{item.split('=')[0]}</p>
                  <p className="font-bold text-blue-700 text-right">{item.split('=')[1]}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actual Keypad and screen */}
      <div className="flex-1 p-4 flex flex-col justify-between bg-white">
        
        {/* Calc Display */}
        <div className="bg-slate-900 rounded-xl p-3 text-right font-mono text-white shadow-inner flex flex-col justify-between h-20 mb-3 border border-slate-800">
          <div className="text-[10px] text-slate-400 h-4 truncate">
            {equation}
          </div>
          <div className="flex items-center justify-between">
            <button 
              onClick={handleCopy}
              className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="نسخ الرقم"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="text-2xl font-bold tracking-tight overflow-x-auto truncate max-w-[200px]">
              {display}
            </span>
          </div>
        </div>

        {/* Buttons grid */}
        <div className="grid grid-cols-4 gap-2 text-xs font-bold">
          
          {/* Row 1 */}
          <button 
            onClick={handleClear} 
            className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center border border-rose-200"
          >
            C
          </button>
          <button 
            onClick={() => handleOperatorClick('÷')} 
            className="p-3 bg-slate-100 text-blue-700 hover:bg-slate-200 rounded-lg transition-colors text-base"
          >
            ÷
          </button>
          <button 
            onClick={() => handleOperatorClick('×')} 
            className="p-3 bg-slate-100 text-blue-700 hover:bg-slate-200 rounded-lg transition-colors text-base"
          >
            ×
          </button>
          <button 
            onClick={handleBackspace} 
            className="p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
            title="حذف رقم"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Row 2 */}
          <button onClick={() => handleNumClick('7')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">7</button>
          <button onClick={() => handleNumClick('8')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">8</button>
          <button onClick={() => handleNumClick('9')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">9</button>
          <button 
            onClick={() => handleOperatorClick('-')} 
            className="p-3 bg-slate-100 text-blue-700 hover:bg-slate-200 rounded-lg transition-colors text-base"
          >
            -
          </button>

          {/* Row 3 */}
          <button onClick={() => handleNumClick('4')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">4</button>
          <button onClick={() => handleNumClick('5')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">5</button>
          <button onClick={() => handleNumClick('6')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">6</button>
          <button 
            onClick={() => handleOperatorClick('+')} 
            className="p-3 bg-slate-100 text-blue-700 hover:bg-slate-200 rounded-lg transition-colors text-base"
          >
            +
          </button>

          {/* Row 4 */}
          <button onClick={() => handleNumClick('1')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">1</button>
          <button onClick={() => handleNumClick('2')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">2</button>
          <button onClick={() => handleNumClick('3')} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm">3</button>
          
          {/* Equal spans 2 rows down */}
          <button 
            onClick={handleEqual} 
            className="row-span-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 shadow-md border border-blue-700"
          >
            <Equal className="w-5 h-5" />
          </button>

          {/* Row 5 */}
          <button 
            onClick={() => handleNumClick('0')} 
            className="col-span-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm"
          >
            0
          </button>
          <button 
            onClick={handleDecimal} 
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg transition-colors text-sm"
          >
            .
          </button>

        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import { TopHeader } from './components/TopHeader';
import { MenuBar } from './components/MenuBar';
import { Ribbon } from './components/Ribbon';
import { StatusBar } from './components/StatusBar';
import { DatabaseModal } from './components/DatabaseModal';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';

// Windows
import { AboutWindow } from './components/windows/AboutWindow';
import { ChartOfAccountsWindow } from './components/windows/ChartOfAccountsWindow';
import { AccountCardWindow } from './components/windows/AccountCardWindow';
import { JournalEntryWindow } from './components/windows/JournalEntryWindow';
import { ItemCardWindow } from './components/windows/ItemCardWindow';
import { ItemTreeWindow } from './components/windows/ItemTreeWindow';
import { BranchTreeWindow } from './components/windows/BranchTreeWindow';
import { PermissionsWindow } from './components/windows/PermissionsWindow';
import { InvoiceWindow } from './components/windows/InvoiceWindow';
import { ReportWindow } from './components/windows/ReportWindow';
import { DatabaseManagerWindow } from './components/windows/DatabaseManagerWindow';
import { DefinitionsWindow } from './components/windows/DefinitionsWindow';
import { CostCentersWindow } from './components/windows/CostCentersWindow';
import { CurrenciesWindow } from './components/windows/CurrenciesWindow';
import { PriceUpdateWindow } from './components/windows/PriceUpdateWindow';
import { ToolsManagerWindow } from './components/windows/ToolsManagerWindow';
import { CalculatorWindow } from './components/windows/CalculatorWindow';

import { 
  X, Minimize2, Maximize2, Move, AlertCircle, CheckCircle, AlertTriangle, XCircle, Info 
} from 'lucide-react';
import { MdiWindow } from './types/erp';

function DesktopContent() {
  const { 
    connectedDbId, 
    currentUser,
    windows, 
    closeWindow, 
    minimizeWindow, 
    maximizeWindow, 
    focusWindow, 
    updateWindowPosition, 
    updateWindowSize,
    toast,
    language,
    theme,
    customColor,
    fontFamily,
    fontSize,
    fontWeight
  } = useErp();

  // Find the active window (highest zIndex and not minimized)
  const activeWindowId = React.useMemo(() => {
    const activeWins = windows.filter(w => !w.isMinimized);
    if (activeWins.length === 0) return null;
    return activeWins.reduce((maxWin, w) => w.zIndex > maxWin.zIndex ? w : maxWin, activeWins[0]).id;
  }, [windows]);

  // Dragging logic
  const handleDragStart = (e: React.MouseEvent, win: MdiWindow) => {
    if (win.isMaximized) return;
    focusWindow(win.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = win.x;
    const initialY = win.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      updateWindowPosition(win.id, Math.max(0, initialX + dx), Math.max(0, initialY + dy));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Resizing logic
  const handleResizeStart = (e: React.MouseEvent, win: MdiWindow) => {
    focusWindow(win.id);
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = win.width;
    const initialH = win.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      updateWindowSize(
        win.id,
        Math.max(300, initialW + dx),
        Math.max(200, initialH + dy)
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderWindowContent = (win: MdiWindow) => {
    switch (win.type) {
      case 'about':
        return <AboutWindow onClose={() => closeWindow(win.id)} />;
      case 'chart_of_accounts':
        return <ChartOfAccountsWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'account_card':
        return <AccountCardWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'journal_entry':
        return <JournalEntryWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'opening_entry':
        return <JournalEntryWindow isOpening={true} windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'item_card':
        return <ItemCardWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'item_tree':
        return <ItemTreeWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'branch_tree':
      case 'branches':
        return <BranchTreeWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'permissions':
        return (
          <PermissionsWindow 
            windowId={win.id} 
            initialTab={win.props?.initialTab} 
            onClose={() => closeWindow(win.id)} 
          />
        );
      case 'db_manager':
        return (
          <DatabaseManagerWindow 
            windowId={win.id} 
            initialTab={win.props?.initialTab} 
            onClose={() => closeWindow(win.id)} 
          />
        );
      case 'definitions':
        return (
          <DefinitionsWindow 
            windowId={win.id} 
            initialTab={win.props?.initialTab} 
            onClose={() => closeWindow(win.id)} 
          />
        );
      case 'cost_centers':
        return <CostCentersWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'currencies':
        return <CurrenciesWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'price_update':
        return <PriceUpdateWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'tools_manager':
        return (
          <ToolsManagerWindow 
            windowId={win.id} 
            initialTab={win.props?.initialTab} 
            onClose={() => closeWindow(win.id)} 
          />
        );
      
      // Invoices
      case 'invoice':
        return (
          <InvoiceWindow 
            invoiceType={win.props?.invoiceType || 'sale'} 
            invoiceId={win.props?.invoiceId}
            windowId={win.id} 
            onClose={() => closeWindow(win.id)} 
          />
        );
      case 'sale_invoice':
        return <InvoiceWindow invoiceType="sale" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'purchase_invoice':
        return <InvoiceWindow invoiceType="purchase" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'sale_return':
        return <InvoiceWindow invoiceType="sale_return" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'purchase_return':
        return <InvoiceWindow invoiceType="purchase_return" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      
      // Reports
      case 'reports':
        return (
          <ReportWindow 
            reportType={win.props?.reportType || 'general_ledger'} 
            windowId={win.id} 
            onClose={() => closeWindow(win.id)} 
          />
        );
      case 'general_ledger':
        return <ReportWindow reportType="general_ledger" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'trial_balance':
        return <ReportWindow reportType="trial_balance" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'inventory_list':
        return <ReportWindow reportType="inventory_list" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'customer_balances':
        return <ReportWindow reportType="customer_balances" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'item_profit':
        return <ReportWindow reportType="item_profit" windowId={win.id} onClose={() => closeWindow(win.id)} />;
      case 'calculator':
        return <CalculatorWindow windowId={win.id} onClose={() => closeWindow(win.id)} />;

      default:
        return (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">عذراً، هذه الشاشة قيد التطوير والصيانة البرمجية.</p>
          </div>
        );
    }
  };

  const fontStyle = {
    fontFamily: fontFamily === 'Cairo' ? '"Cairo", sans-serif' :
                fontFamily === 'Tajawal' ? '"Tajawal", sans-serif' :
                fontFamily === 'Alexandria' ? '"Alexandria", sans-serif' :
                fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' :
                fontFamily === 'Inter' ? '"Inter", sans-serif' :
                fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : 'inherit',
    fontSize: `${fontSize}px`,
    fontWeight: fontWeight === 'bold' ? '700' : fontWeight === 'medium' ? '500' : '400'
  } as React.CSSProperties;

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden bg-slate-900 select-none transition-all duration-300" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={fontStyle}
    >
      {/* Top Executive Header Bar */}
      <TopHeader />

      {/* Top Menu Bar */}
      <MenuBar />

      {/* Main Ribbon Bar */}
      <Ribbon />

      {/* Workspace Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-100">
        {!connectedDbId ? (
          /* Locked Database Connection dialog */
          <DatabaseModal />
        ) : !currentUser ? (
          /* Login Dialog */
          <Login />
        ) : (
          /* Connected State: Desktop backdrop & Floating MDI Windows */
          <>
            {/* Desktop Dashboard (as background) */}
            <Dashboard />

            {/* Floating Windows manager */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {windows.map((win) => {
                if (win.isMinimized) return null;

                const style: React.CSSProperties = win.isMaximized
                  ? {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: win.zIndex,
                    }
                  : {
                      position: 'absolute',
                      top: win.y,
                      left: win.x,
                      width: win.width,
                      height: win.height,
                      zIndex: win.zIndex,
                    };

                const isActive = win.id === activeWindowId;

                return (
                  <div
                    key={win.id}
                    style={style}
                    onMouseDown={() => focusWindow(win.id)}
                    className={`bg-white rounded-lg flex flex-col overflow-hidden pointer-events-auto animate-window-open border-2 transition-all duration-150 ${
                      isActive 
                        ? 'border-blue-600 shadow-2xl ring-2 ring-blue-500/15 mdi-active-window scale-100 z-10' 
                        : 'border-slate-300 shadow-lg opacity-96 scale-[0.995] hover:opacity-100'
                    }`}
                  >
                    {/* Window Title Bar */}
                    <div
                      onMouseDown={(e) => handleDragStart(e, win)}
                      className={`px-3.5 py-2 flex items-center justify-between cursor-move shrink-0 select-none transition-colors border-b ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-700 to-sky-600 text-white border-blue-800 shadow-[inset_0_-1px_0_rgba(255,255,255,0.15)]'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Move className={`w-3.5 h-3.5 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
                        <span className={`text-xs tracking-wide ${isActive ? 'font-extrabold text-white' : 'font-semibold text-slate-600'}`}>{win.title}</span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        {/* Minimize */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            minimizeWindow(win.id);
                          }}
                          className={`p-0.5 rounded transition-colors cursor-pointer ${
                            isActive 
                              ? 'hover:bg-blue-600 text-blue-100 hover:text-white' 
                              : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                          title="تصغير"
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Maximize */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            maximizeWindow(win.id);
                          }}
                          className={`p-0.5 rounded transition-colors cursor-pointer ${
                            isActive 
                              ? 'hover:bg-blue-600 text-blue-100 hover:text-white' 
                              : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                          title={win.isMaximized ? 'استعادة الحجم الطبيعي' : 'تكبير'}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Close */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeWindow(win.id);
                          }}
                          className={`p-0.5 rounded transition-colors cursor-pointer ${
                            isActive 
                              ? 'hover:bg-red-600 text-blue-100 hover:text-white' 
                              : 'hover:bg-red-500/10 text-slate-400 hover:text-red-600'
                          }`}
                          title="إغلاق"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Window Body */}
                    <div className="flex-1 overflow-hidden relative bg-slate-50">
                      {renderWindowContent(win)}
                    </div>

                    {/* Resize Handle (bottom right corner) */}
                    {!win.isMaximized && (
                      <div
                        onMouseDown={(e) => handleResizeStart(e, win)}
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-slate-300/60 rounded-tl hover:bg-blue-600 transition-colors"
                        style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                        title="تغيير الحجم"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Non-blocking toast notification */}
      {toast && (
        <div className={`fixed bottom-12 right-6 z-[9999] bg-white border border-slate-200 rounded-lg shadow-2xl p-3.5 pr-4 pl-6 flex items-center gap-3 animate-window-open border-r-4 ${
          toast.type === 'success' ? 'border-r-emerald-500' :
          toast.type === 'warning' ? 'border-r-amber-500' :
          toast.type === 'error' ? 'border-r-red-500' : 'border-r-blue-500'
        }`} style={{ direction: 'rtl' }}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-800 text-[12px] font-extrabold leading-relaxed">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
}

export default function App() {
  return (
    <ErpProvider>
      <DesktopContent />
    </ErpProvider>
  );
}

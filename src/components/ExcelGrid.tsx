import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useErp } from '../context/ErpContext';
import { InvoiceGridRow, Item } from '../types/erp';
import { 
  Trash2, Plus, Copy, Filter, ArrowUpDown, ChevronDown, 
  Settings, Check, EyeOff, GripVertical, Search, Lock, Unlock
} from 'lucide-react';

interface ExcelGridProps {
  rows: InvoiceGridRow[];
  onChange: (updatedRows: InvoiceGridRow[]) => void;
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  invoiceType: string;
}

interface ColumnConfig {
  key: string;
  title: string;
  width: number;
  visible: boolean;
  frozen: boolean;
  type: 'text' | 'number' | 'select' | 'readonly';
}

const DEFAULT_COL_WIDTHS: { [key: string]: number } = {
  index: 45,
  itemId: 220,
  code: 90,
  barcode: 110,
  unit: 75,
  quantity: 80,
  unitPrice: 100,
  notes: 160,
  total: 110,
  actions: 50,
};

export const ExcelGrid: React.FC<ExcelGridProps> = ({
  rows,
  onChange,
  onAddRow,
  onDeleteRow,
  invoiceType
}) => {
  const { items, showToast } = useErp();

  // Load layout from localStorage
  const storageKey = `excel_grid_layout_v2`;
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}

    return [
      { key: 'index', title: '#', width: DEFAULT_COL_WIDTHS.index, visible: true, frozen: true, type: 'readonly' },
      { key: 'itemId', title: 'المادة المحاسبية', width: DEFAULT_COL_WIDTHS.itemId, visible: true, frozen: true, type: 'select' },
      { key: 'code', title: 'الكود', width: DEFAULT_COL_WIDTHS.code, visible: true, frozen: false, type: 'readonly' },
      { key: 'barcode', title: 'الباركود', width: DEFAULT_COL_WIDTHS.barcode, visible: true, frozen: false, type: 'readonly' },
      { key: 'unit', title: 'الوحدة', width: DEFAULT_COL_WIDTHS.unit, visible: true, frozen: false, type: 'text' },
      { key: 'quantity', title: 'الكمية', width: DEFAULT_COL_WIDTHS.quantity, visible: true, frozen: false, type: 'number' },
      { key: 'unitPrice', title: 'سعر الوحدة', width: DEFAULT_COL_WIDTHS.unitPrice, visible: true, frozen: false, type: 'number' },
      { key: 'notes', title: 'الشرح / الملاحظات', width: DEFAULT_COL_WIDTHS.notes, visible: true, frozen: false, type: 'text' },
      { key: 'total', title: 'الإجمالي', width: DEFAULT_COL_WIDTHS.total, visible: true, frozen: false, type: 'readonly' },
      { key: 'actions', title: 'خيارات', width: DEFAULT_COL_WIDTHS.actions, visible: true, frozen: false, type: 'readonly' },
    ];
  });

  // Save layout to localStorage when columns change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  }, [columns]);

  // Active cell state (row index, column key)
  const [activeCell, setActiveCell] = useState<{ row: number; colKey: string } | null>(null);
  
  // Selection Range (for dragging range or multi-select)
  const [selectionStart, setSelectionStart] = useState<{ row: number; colIndex: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ row: number; colIndex: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Edit cell state
  const [editingCell, setEditingCell] = useState<{ row: number; colKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Item Autocomplete Search state
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [focusedSearchIndex, setFocusedSearchIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sorting / Filtering States
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filterValues, setFilterValues] = useState<{ [key: string]: string }>({});
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<string | null>(null);
  const [tableSearchText, setTableSearchText] = useState('');

  // Row heights state
  const [rowHeights, setRowHeights] = useState<{ [index: number]: number }>({});
  const [resizingRowIndex, setResizingRowIndex] = useState<number | null>(null);
  const [rowResizeStartY, setRowResizeStartY] = useState(0);
  const [rowResizeStartHeight, setRowResizeStartHeight] = useState(0);

  // Column Resizing state
  const [resizingColKey, setResizingColKey] = useState<string | null>(null);
  const [colResizeStartX, setColResizeStartX] = useState(0);
  const [colResizeStartWidth, setColResizeStartWidth] = useState(0);

  // Column Picker State
  const [showColPicker, setShowColPicker] = useState(false);

  // Row Drag and drop reordering
  const [draggingRowIdx, setDraggingRowIdx] = useState<number | null>(null);
  const [dragOverRowIdx, setDragOverRowIdx] = useState<number | null>(null);

  // Undo / Redo history for local changes
  const [gridHistory, setGridHistory] = useState<InvoiceGridRow[][]>([]);
  const [gridHistoryIdx, setGridHistoryIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Filtered visible columns
  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

  // Order columns to put frozen first
  const orderedColumns = useMemo(() => {
    const frozen = visibleColumns.filter(c => c.frozen);
    const nonFrozen = visibleColumns.filter(c => !c.frozen);
    return [...frozen, ...nonFrozen];
  }, [visibleColumns]);

  // Autocomplete items filtered by query
  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return items.slice(0, 50);
    const query = itemSearchQuery.toLowerCase();
    return items.filter(it => 
      it.name.toLowerCase().includes(query) || 
      it.code.toLowerCase().includes(query) || 
      (it.barcode && it.barcode.toLowerCase().includes(query))
    );
  }, [items, itemSearchQuery]);

  // Focus input helper
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Handle outside click to close popups
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isDropdownOpen && searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (isFilterMenuOpen && !(e.target as Element).closest('.filter-popover')) {
        setIsFilterMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen, isFilterMenuOpen]);

  // Save current grid rows state into history
  const pushToGridHistory = useCallback((newRows: InvoiceGridRow[]) => {
    const nextHistory = gridHistory.slice(0, gridHistoryIdx + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newRows)));
    setGridHistory(nextHistory);
    setGridHistoryIdx(nextHistory.length - 1);
  }, [gridHistory, gridHistoryIdx]);

  // Sync rows changes
  const handleRowsChange = (updated: InvoiceGridRow[]) => {
    pushToGridHistory(updated);
    onChange(updated);
  };

  // Convert Column Key to Column Index in orderedColumns
  const getColIndex = useCallback((key: string) => {
    return orderedColumns.findIndex(c => c.key === key);
  }, [orderedColumns]);

  // Keyboard Navigation & Shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!activeCell) return;

    const rowCount = rows.length;
    const colCount = orderedColumns.length;
    const currentColIndex = getColIndex(activeCell.colKey);
    const isEditing = editingCell !== null;

    // Shortcuts while editing the item select autocompleter dropdown
    if (isEditing && activeCell.colKey === 'itemId' && isDropdownOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedSearchIndex(prev => Math.min(filteredItems.length - 1, prev + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedSearchIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = filteredItems[focusedSearchIndex];
        if (selectedItem) {
          applySelectedItem(activeCell.row, selectedItem);
        }
        return;
      }
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setEditingCell(null);
        return;
      }
    }

    // Generic standard editing modes
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEditingValue();
        // Move active cell down
        if (activeCell.row < rowCount - 1) {
          setActiveCell({ row: activeCell.row + 1, colKey: activeCell.colKey });
        } else {
          // Last row Enter creates a brand new row!
          onAddRow();
          setTimeout(() => {
            setActiveCell({ row: activeCell.row + 1, colKey: activeCell.colKey });
          }, 100);
        }
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        commitEditingValue();
        if (e.shiftKey) {
          // Move left
          if (currentColIndex > 0) {
            const prevCol = orderedColumns[currentColIndex - 1];
            setActiveCell({ row: activeCell.row, colKey: prevCol.key });
          }
        } else {
          // Move right
          if (currentColIndex < colCount - 1) {
            const nextCol = orderedColumns[currentColIndex + 1];
            setActiveCell({ row: activeCell.row, colKey: nextCol.key });
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        setEditingCell(null);
        return;
      }
      return; // Let standard input capture normal text entries
    }

    // Command shortcuts when NOT editing
    if ((e.ctrlKey || e.metaKey) && !isEditing) {
      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        // Select all cells
        setSelectionStart({ row: 0, colIndex: 0 });
        setSelectionEnd({ row: rowCount - 1, colIndex: colCount - 1 });
        return;
      }
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelection();
        return;
      }
      if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteFromClipboard();
        return;
      }
      if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCopySelection();
        handleDeleteSelectedCells();
        return;
      }
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        // Undo local grid state
        if (gridHistoryIdx > 0) {
          const prevIdx = gridHistoryIdx - 1;
          const snap = gridHistory[prevIdx];
          setGridHistoryIdx(prevIdx);
          onChange(JSON.parse(JSON.stringify(snap)));
          showToast('تراجع محلي للجدول', 'info');
        }
        return;
      }
      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        // Redo local grid state
        if (gridHistoryIdx < gridHistory.length - 1) {
          const nextIdx = gridHistoryIdx + 1;
          const snap = gridHistory[nextIdx];
          setGridHistoryIdx(nextIdx);
          onChange(JSON.parse(JSON.stringify(snap)));
          showToast('إعادة تطبيق محلي للجدول', 'info');
        }
        return;
      }
    }

    // Normal Arrow key and command key navigation
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (activeCell.row > 0) {
          const nextRow = activeCell.row - 1;
          setActiveCell({ ...activeCell, row: nextRow });
          updateSelectionRange(nextRow, currentColIndex, e.shiftKey);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (activeCell.row < rowCount - 1) {
          const nextRow = activeCell.row + 1;
          setActiveCell({ ...activeCell, row: nextRow });
          updateSelectionRange(nextRow, currentColIndex, e.shiftKey);
        }
        break;
      case 'ArrowRight': // In Arabic RTL, ArrowRight moves LEFT columns (lower index)
        e.preventDefault();
        if (currentColIndex > 0) {
          const prevCol = orderedColumns[currentColIndex - 1];
          setActiveCell({ ...activeCell, colKey: prevCol.key });
          updateSelectionRange(activeCell.row, currentColIndex - 1, e.shiftKey);
        }
        break;
      case 'ArrowLeft': // In Arabic RTL, ArrowLeft moves RIGHT columns (higher index)
        e.preventDefault();
        if (currentColIndex < colCount - 1) {
          const nextCol = orderedColumns[currentColIndex + 1];
          setActiveCell({ ...activeCell, colKey: nextCol.key });
          updateSelectionRange(activeCell.row, currentColIndex + 1, e.shiftKey);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // tab left
          if (currentColIndex > 0) {
            const prevCol = orderedColumns[currentColIndex - 1];
            setActiveCell({ ...activeCell, colKey: prevCol.key });
          }
        } else {
          // tab right
          if (currentColIndex < colCount - 1) {
            const nextCol = orderedColumns[currentColIndex + 1];
            setActiveCell({ ...activeCell, colKey: nextCol.key });
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        // Start editing this cell
        const currentCol = orderedColumns[currentColIndex];
        if (currentCol.type !== 'readonly' && currentCol.key !== 'actions') {
          startEditing(activeCell.row, currentCol.key);
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        handleDeleteSelectedCells();
        break;
      case 'Home':
        e.preventDefault();
        setActiveCell({ ...activeCell, colKey: orderedColumns[0].key });
        break;
      case 'End':
        e.preventDefault();
        setActiveCell({ ...activeCell, colKey: orderedColumns[colCount - 1].key });
        break;
      case 'PageUp':
        e.preventDefault();
        setActiveCell({ ...activeCell, row: 0 });
        break;
      case 'PageDown':
        e.preventDefault();
        setActiveCell({ ...activeCell, row: rowCount - 1 });
        break;
      default:
        // Start typing directly to edit!
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const curCol = orderedColumns[currentColIndex];
          if (curCol.type !== 'readonly' && curCol.key !== 'actions') {
            startEditing(activeCell.row, curCol.key, e.key);
          }
        }
        break;
    }
  }, [activeCell, rows, orderedColumns, editingCell, isDropdownOpen, filteredItems, focusedSearchIndex, gridHistoryIdx, gridHistory]);

  // Bind global keyboard listener to the window
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== inputRef.current) {
        return; // ignore if typing in general invoice header inputs
      }
      // Only capture keys if table is selected
      if (activeCell) {
        handleKeyDown(e as any);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeCell, handleKeyDown]);

  // Handle cell selection ranges
  const updateSelectionRange = (row: number, colIndex: number, shiftKey: boolean) => {
    if (!activeCell) return;
    if (shiftKey) {
      if (!selectionStart) {
        setSelectionStart({ row: activeCell.row, colIndex: getColIndex(activeCell.colKey) });
      }
      setSelectionEnd({ row, colIndex });
    } else {
      setSelectionStart({ row, colIndex });
      setSelectionEnd({ row, colIndex });
    }
  };

  // Start cell editing
  const startEditing = (rowIdx: number, colKey: string, initialChar: string = '') => {
    setEditingCell({ row: rowIdx, colKey });
    const row = rows[rowIdx];
    let val = '';
    if (colKey === 'itemId') {
      const currentItem = items.find(it => it.id === row.itemId);
      val = currentItem ? currentItem.name : '';
      setItemSearchQuery(initialChar || val);
      setIsDropdownOpen(true);
      setFocusedSearchIndex(0);
    } else {
      val = initialChar || String((row as any)[colKey] || '');
    }
    setEditingValue(val);
  };

  // Commit editing changes
  const commitEditingValue = () => {
    if (!editingCell) return;
    const { row, colKey } = editingCell;
    const val = editingValue;

    if (colKey !== 'itemId') {
      const updated = rows.map((r, idx) => {
        if (idx === row) {
          const updatedRow = { ...r, [colKey]: colKey === 'quantity' || colKey === 'unitPrice' ? Number(val) : val };
          updatedRow.total = Number(updatedRow.quantity || 0) * Number(updatedRow.unitPrice || 0);
          return updatedRow;
        }
        return r;
      });
      handleRowsChange(updated);
    }
    setEditingCell(null);
  };

  // Select Item autocomplete
  const applySelectedItem = (rowIdx: number, item: Item) => {
    const updated = rows.map((r, idx) => {
      if (idx === rowIdx) {
        const rowUnitPrice = invoiceType.includes('purchase') ? item.purchasePrice : item.salePrice;
        const updatedRow = {
          ...r,
          itemId: item.id,
          unit: item.unit || 'حبة',
          unitPrice: rowUnitPrice,
          total: Number(r.quantity || 1) * rowUnitPrice
        };
        return updatedRow;
      }
      return r;
    });
    handleRowsChange(updated);
    setIsDropdownOpen(false);
    setEditingCell(null);
    showToast(`تم إدراج الصنف: ${item.name}`, 'success');
  };

  // Mouse selection range dragging
  const handleCellMouseDown = (row: number, colKey: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const colIdx = getColIndex(colKey);
    setActiveCell({ row, colKey });
    setSelectionStart({ row, colIndex: colIdx });
    setSelectionEnd({ row, colIndex: colIdx });
    setIsSelecting(true);
    setEditingCell(null); // Cancel current edits unless double click
  };

  const handleCellMouseEnter = (row: number, colKey: string) => {
    if (!isSelecting) return;
    const colIdx = getColIndex(colKey);
    setSelectionEnd({ row, colIndex: colIdx });
  };

  const handleCellMouseUp = () => {
    setIsSelecting(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleCellMouseUp);
    return () => window.removeEventListener('mouseup', handleCellMouseUp);
  }, [isSelecting]);

  // Is Cell Selected?
  const isCellSelected = useCallback((row: number, colKey: string) => {
    if (!selectionStart || !selectionEnd) return false;
    const colIdx = getColIndex(colKey);
    
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.colIndex, selectionEnd.colIndex);
    const maxCol = Math.max(selectionStart.colIndex, selectionEnd.colIndex);

    return row >= minRow && row <= maxRow && colIdx >= minCol && colIdx <= maxCol;
  }, [selectionStart, selectionEnd, getColIndex]);

  // Copy Selected range to Clipboard (TSV format)
  const handleCopySelection = () => {
    if (!selectionStart || !selectionEnd) return;

    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.colIndex, selectionEnd.colIndex);
    const maxCol = Math.max(selectionStart.colIndex, selectionEnd.colIndex);

    let tsvRows: string[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      let tsvCols: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const col = orderedColumns[c];
        const rowData = rows[r];
        if (!rowData || !col) continue;

        let cellVal = '';
        if (col.key === 'itemId') {
          cellVal = items.find(it => it.id === rowData.itemId)?.name || '';
        } else if (col.key === 'code') {
          cellVal = items.find(it => it.id === rowData.itemId)?.code || '';
        } else if (col.key === 'barcode') {
          cellVal = items.find(it => it.id === rowData.itemId)?.barcode || '';
        } else {
          cellVal = String((rowData as any)[col.key] || '');
        }
        tsvCols.push(cellVal);
      }
      tsvRows.push(tsvCols.join('\t'));
    }

    const tsvText = tsvRows.join('\n');
    navigator.clipboard.writeText(tsvText)
      .then(() => showToast('تم نسخ النطاق المحدد إلى الحافظة بصيغة Excel', 'success'))
      .catch(() => showToast('فشل نسخ الخلايا.', 'error'));
  };

  // Paste from Clipboard Excel TSV
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;

      const pasteRows = text.split(/\r?\n/).map(line => line.split('\t'));
      if (pasteRows.length === 0) return;

      const startRowIdx = activeCell ? activeCell.row : 0;
      const startColIdx = activeCell ? getColIndex(activeCell.colKey) : 1; // skip index col

      let currentRows = [...rows];
      
      // Expand row structure if pasting goes beyond current rows length
      const requiredTotalRows = startRowIdx + pasteRows.length;
      if (currentRows.length < requiredTotalRows) {
        const deficit = requiredTotalRows - currentRows.length;
        for (let d = 0; d < deficit; d++) {
          currentRows.push({
            id: `grid-row-paste-${Date.now()}-${d}`,
            itemId: items[0]?.id || '',
            quantity: 1,
            unitPrice: invoiceType.includes('purchase') ? items[0]?.purchasePrice : items[0]?.salePrice,
            unit: items[0]?.unit || 'حبة',
            notes: '',
            total: invoiceType.includes('purchase') ? items[0]?.purchasePrice : items[0]?.salePrice
          });
        }
      }

      // Loop and insert
      pasteRows.forEach((rowData, rOffset) => {
        const targetRowIdx = startRowIdx + rOffset;
        if (targetRowIdx >= currentRows.length) return;

        let rowObj = { ...currentRows[targetRowIdx] };

        rowData.forEach((cellVal, cOffset) => {
          const targetColIdx = startColIdx + cOffset;
          if (targetColIdx >= orderedColumns.length) return;

          const col = orderedColumns[targetColIdx];
          if (col.type === 'readonly' && col.key !== 'code' && col.key !== 'barcode') return;

          const cleanedVal = cellVal.trim();
          if (col.key === 'itemId') {
            // lookup item by name or code
            const matched = items.find(it => 
              it.name.toLowerCase() === cleanedVal.toLowerCase() ||
              it.code.toLowerCase() === cleanedVal.toLowerCase() ||
              (it.barcode && it.barcode === cleanedVal)
            );
            if (matched) {
              rowObj.itemId = matched.id;
              rowObj.unit = matched.unit || 'حبة';
              rowObj.unitPrice = invoiceType.includes('purchase') ? matched.purchasePrice : matched.salePrice;
            }
          } else if (col.key === 'quantity' || col.key === 'unitPrice') {
            (rowObj as any)[col.key] = Number(cleanedVal.replace(/[^0-9.-]/g, '')) || 0;
          } else if (col.key !== 'total' && col.key !== 'actions') {
            (rowObj as any)[col.key] = cleanedVal;
          }
        });

        rowObj.total = Number(rowObj.quantity || 0) * Number(rowObj.unitPrice || 0);
        currentRows[targetRowIdx] = rowObj;
      });

      handleRowsChange(currentRows);
      showToast(`تم لصق ${pasteRows.length} صفوف بنجاح من Excel`, 'success');
    } catch (err) {
      showToast('يرجى تمكين أذونات الحافظة للصق المباشر.', 'warning');
    }
  };

  // Delete contents of selected cells
  const handleDeleteSelectedCells = () => {
    if (!selectionStart || !selectionEnd) return;

    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.colIndex, selectionEnd.colIndex);
    const maxCol = Math.max(selectionStart.colIndex, selectionEnd.colIndex);

    const updated = rows.map((r, rIdx) => {
      if (rIdx >= minRow && rIdx <= maxRow) {
        let rowObj = { ...r };
        for (let cIdx = minCol; cIdx <= maxCol; cIdx++) {
          const col = orderedColumns[cIdx];
          if (col.type === 'readonly' || col.key === 'actions' || col.key === 'index') continue;
          if (col.key === 'quantity' || col.key === 'unitPrice') {
            (rowObj as any)[col.key] = 0;
          } else {
            (rowObj as any)[col.key] = '';
          }
        }
        rowObj.total = Number(rowObj.quantity || 0) * Number(rowObj.unitPrice || 0);
        return rowObj;
      }
      return r;
    });

    handleRowsChange(updated);
  };

  // Column Resizing mouse dragging handlers
  const handleColResizeMouseDown = (colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingColKey(colKey);
    setColResizeStartX(e.clientX);
    const currentCol = columns.find(c => c.key === colKey);
    setColResizeStartWidth(currentCol ? currentCol.width : 100);
  };

  // Row Resizing mouse dragging handlers
  const handleRowResizeMouseDown = (rowIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingRowIndex(rowIdx);
    setRowResizeStartY(e.clientY);
    const currentHeight = rowHeights[rowIdx] || 32;
    setRowResizeStartHeight(currentHeight);
  };

  // Drag listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColKey) {
        // Arabic is RTL, so dragging left (dx < 0) expands column width, dragging right shrinks it!
        const dx = e.clientX - colResizeStartX;
        const newWidth = Math.max(40, colResizeStartWidth - dx); // inverted due to RTL
        setColumns(prev => prev.map(c => c.key === resizingColKey ? { ...c, width: newWidth } : c));
      }
      if (resizingRowIndex !== null) {
        const dy = e.clientY - rowResizeStartY;
        const newHeight = Math.max(20, rowResizeStartHeight + dy);
        setRowHeights(prev => ({ ...prev, [resizingRowIndex]: newHeight }));
      }
    };

    const handleMouseUp = () => {
      setResizingColKey(null);
      setResizingRowIndex(null);
    };

    if (resizingColKey || resizingRowIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColKey, colResizeStartX, colResizeStartWidth, resizingRowIndex, rowResizeStartY, rowResizeStartHeight]);

  // Insert Row Helper
  const handleInsertRow = (idx: number, position: 'before' | 'after') => {
    const insertIdx = position === 'before' ? idx : idx + 1;
    const newRowId = `grid-row-ins-${Date.now()}`;
    const newRow = {
      id: newRowId,
      itemId: items[0]?.id || '',
      quantity: 1,
      unitPrice: invoiceType.includes('purchase') ? items[0]?.purchasePrice : items[0]?.salePrice,
      unit: items[0]?.unit || 'حبة',
      notes: '',
      total: invoiceType.includes('purchase') ? items[0]?.purchasePrice : items[0]?.salePrice
    };

    const nextRows = [...rows];
    nextRows.splice(insertIdx, 0, newRow);
    handleRowsChange(nextRows);
    setActiveCell({ row: insertIdx, colKey: 'itemId' });
  };

  // Row Drag and drop reordering handlers
  const handleRowDragStart = (idx: number) => {
    setDraggingRowIdx(idx);
  };

  const handleRowDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverRowIdx(idx);
  };

  const handleRowDrop = (idx: number) => {
    if (draggingRowIdx === null || draggingRowIdx === idx) return;

    const nextRows = [...rows];
    const draggedItem = nextRows[draggingRowIdx];
    nextRows.splice(draggingRowIdx, 1);
    nextRows.splice(idx, 0, draggedItem);
    handleRowsChange(nextRows);

    setDraggingRowIdx(null);
    setDragOverRowIdx(null);
    showToast('تم إعادة ترتيب سطور المواد بنجاح', 'success');
  };

  // Show/Hide freeze state
  const toggleFreezeColumn = (colKey: string) => {
    setColumns(prev => prev.map(c => c.key === colKey ? { ...c, frozen: !c.frozen } : c));
    showToast('تم تعديل تثبيت العمود', 'info');
  };

  // Sort function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...rows].sort((a, b) => {
      let valA = (a as any)[key];
      let valB = (b as any)[key];

      if (key === 'itemId') {
        valA = items.find(it => it.id === a.itemId)?.name || '';
        valB = items.find(it => it.id === b.itemId)?.name || '';
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    handleRowsChange(sorted);
  };

  // Calculate Column Filter Options
  const getFilterOptions = (colKey: string): string[] => {
    const values = rows.map(r => {
      if (colKey === 'itemId') {
        return items.find(it => it.id === r.itemId)?.name || '';
      }
      return String((r as any)[colKey] || '');
    });
    return Array.from(new Set(values)).filter(Boolean) as string[];
  };

  const applyFilter = (colKey: string, val: string) => {
    setFilterValues(prev => ({ ...prev, [colKey]: val }));
    setIsFilterMenuOpen(null);
  };

  const clearFilter = (colKey: string) => {
    setFilterValues(prev => {
      const copy = { ...prev };
      delete copy[colKey];
      return copy;
    });
    setIsFilterMenuOpen(null);
  };

  // Filter & Search rows rendering
  const filteredRows = useMemo(() => {
    return rows.map((r, originalIdx) => ({ r, originalIdx })).filter(({ r }) => {
      // Apply column filters
      for (const [colKey, filterVal] of Object.entries(filterValues)) {
        let cellVal = '';
        if (colKey === 'itemId') {
          cellVal = items.find(it => it.id === r.itemId)?.name || '';
        } else {
          cellVal = String((r as any)[colKey] || '');
        }
        if (cellVal !== filterVal) return false;
      }

      // Apply fast search text
      if (tableSearchText.trim()) {
        const search = tableSearchText.toLowerCase();
        const itemName = (items.find(it => it.id === r.itemId)?.name || '').toLowerCase();
        const itemCode = (items.find(it => it.id === r.itemId)?.code || '').toLowerCase();
        const itemBarcode = (items.find(it => it.id === r.itemId)?.barcode || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        const quantity = String(r.quantity || '');
        const price = String(r.unitPrice || '');

        return itemName.includes(search) || 
               itemCode.includes(search) || 
               itemBarcode.includes(search) || 
               notes.includes(search) || 
               quantity.includes(search) || 
               price.includes(search);
      }

      return true;
    });
  }, [rows, filterValues, tableSearchText, items]);

  // Aggregate totals row
  const totals = useMemo(() => {
    return rows.reduce((acc, r) => {
      acc.quantity += Number(r.quantity || 0);
      acc.unitPrice += Number(r.unitPrice || 0);
      acc.total += Number(r.total || 0);
      return acc;
    }, { quantity: 0, unitPrice: 0, total: 0 });
  }, [rows]);

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-300 rounded-lg overflow-hidden select-none" dir="rtl">
      
      {/* Grid Toolbar: Search, Filters, Column Picker */}
      <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between shrink-0 gap-4 text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="البحث السريع والتصفية داخل الجدول..."
              value={tableSearchText}
              onChange={e => setTableSearchText(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md py-1 pr-8 pl-3 text-xs focus:ring-1 focus:ring-blue-500 font-bold text-slate-800"
            />
          </div>
          {Object.keys(filterValues).length > 0 && (
            <button
              onClick={() => setFilterValues({})}
              className="text-[10px] px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
            >
              إلغاء جميع المصافي ({Object.keys(filterValues).length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Column Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className="px-2.5 py-1 bg-white border rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" /> أعمدة الجدول
            </button>
            {showColPicker && (
              <div className="absolute left-0 mt-1 w-52 bg-white rounded-lg shadow-2xl border p-2 z-50 text-right font-bold text-slate-700 space-y-1">
                <div className="text-[10px] text-slate-400 pb-1 mb-1 border-b text-center">إظهار وإخفاء الأعمدة</div>
                {columns.map(c => (
                  <label key={c.key} className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 rounded cursor-pointer text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={c.visible}
                        disabled={c.key === 'itemId' || c.key === 'index'}
                        onChange={() => setColumns(prev => prev.map(x => x.key === c.key ? { ...x, visible: !x.visible } : x))}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      {c.title}
                    </span>
                    {c.key !== 'actions' && c.key !== 'index' && (
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFreezeColumn(c.key); }}
                        className={`p-0.5 rounded ${c.frozen ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}
                        title="تثبيت هذا العمود"
                      >
                        <Lock className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onAddRow}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 cursor-pointer font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة سطر
          </button>
          <button
            onClick={handlePasteFromClipboard}
            className="px-2.5 py-1 bg-white border text-slate-700 hover:bg-slate-50 rounded flex items-center gap-1 cursor-pointer font-bold"
            title="لصق البيانات من Excel مباشرة"
          >
            <Copy className="w-3.5 h-3.5 text-green-600" /> لصق
          </button>
        </div>
      </div>

      {/* Main grid area */}
      <div ref={containerRef} className="flex-1 overflow-auto relative">
        <table className="border-collapse table-fixed select-none text-[11px] font-bold min-w-full">
          <thead>
            <tr className="bg-slate-100 text-slate-500 border-b border-slate-300 sticky top-0 z-30">
              {orderedColumns.map((col) => {
                const isFrozen = col.frozen;
                const leftOffset = isFrozen ? 0 : undefined; // simple absolute pinned helper

                return (
                  <th
                    key={col.key}
                    style={{ 
                      width: col.width,
                      position: isFrozen ? 'sticky' : 'relative',
                      right: isFrozen ? 0 : undefined, // RTL pinning uses right offset
                      zIndex: isFrozen ? 40 : 10,
                    }}
                    className={`h-8 border-l border-b border-slate-300 select-none text-right px-2 bg-slate-100 ${
                      isFrozen ? 'shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between group">
                      <span 
                        onClick={() => col.key !== 'actions' && col.key !== 'index' && handleSort(col.key)}
                        className="cursor-pointer hover:text-slate-800 flex items-center gap-1 truncate w-full"
                      >
                        {col.title}
                        {col.key !== 'actions' && col.key !== 'index' && (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />
                        )}
                      </span>

                      {/* Header filter trigger */}
                      {col.key !== 'actions' && col.key !== 'index' && (
                        <div className="relative filter-popover shrink-0">
                          <button
                            onClick={() => setIsFilterMenuOpen(isFilterMenuOpen === col.key ? null : col.key)}
                            className={`p-0.5 rounded hover:bg-slate-200 ${filterValues[col.key] ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                          >
                            <Filter className="w-2.5 h-2.5" />
                          </button>
                          {isFilterMenuOpen === col.key && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-2xl border p-2 z-50 text-right text-[11px]">
                              <button
                                onClick={() => clearFilter(col.key)}
                                className="w-full text-right p-1 hover:bg-slate-50 text-red-600 font-bold border-b pb-1 mb-1"
                              >
                                إلغاء التصفية
                              </button>
                              <div className="max-h-36 overflow-y-auto space-y-1">
                                {getFilterOptions(col.key).map((opt: string) => (
                                  <button
                                    key={opt}
                                    onClick={() => applyFilter(col.key, opt)}
                                    className="w-full text-right p-1 hover:bg-slate-50 truncate"
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Resize handle */}
                    <div
                      onMouseDown={(e) => handleColResizeMouseDown(col.key, e)}
                      className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 z-40"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredRows.map(({ r, originalIdx }, rowIdx) => {
              const height = rowHeights[originalIdx] || 32;
              const isDragOver = dragOverRowIdx === originalIdx;

              return (
                <tr
                  key={r.id}
                  draggable
                  onDragStart={() => handleRowDragStart(originalIdx)}
                  onDragOver={(e) => handleRowDragOver(e, originalIdx)}
                  onDrop={() => handleRowDrop(originalIdx)}
                  style={{ height }}
                  className={`relative group ${isDragOver ? 'bg-blue-50 border-t-2 border-blue-600' : ''}`}
                >
                  {orderedColumns.map((col) => {
                    const isFrozen = col.frozen;
                    const isActive = activeCell?.row === originalIdx && activeCell?.colKey === col.key;
                    const isSelected = isCellSelected(originalIdx, col.key);
                    const isEditing = editingCell?.row === originalIdx && editingCell?.colKey === col.key;

                    // Fetch actual descriptive values for lookups
                    let renderedValue = '';
                    if (col.key === 'itemId') {
                      renderedValue = items.find(it => it.id === r.itemId)?.name || '';
                    } else if (col.key === 'code') {
                      renderedValue = items.find(it => it.id === r.itemId)?.code || '';
                    } else if (col.key === 'barcode') {
                      renderedValue = items.find(it => it.id === r.itemId)?.barcode || '';
                    } else if (col.key === 'total') {
                      renderedValue = r.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00';
                    } else {
                      renderedValue = String((r as any)[col.key] || '');
                    }

                    return (
                      <td
                        key={col.key}
                        style={{ 
                          width: col.width,
                          position: isFrozen ? 'sticky' : undefined,
                          right: isFrozen ? 0 : undefined,
                          zIndex: isFrozen ? 20 : 1,
                          height
                        }}
                        onMouseDown={(e) => handleCellMouseDown(originalIdx, col.key, e)}
                        onMouseEnter={() => handleCellMouseEnter(originalIdx, col.key)}
                        onDoubleClick={() => col.type !== 'readonly' && col.key !== 'actions' && startEditing(originalIdx, col.key)}
                        className={`border-l border-slate-200 px-2 relative truncate align-middle text-[11px] select-none ${
                          isFrozen ? 'bg-slate-50/95 sticky shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]' : 'bg-white'
                        } ${
                          isSelected ? 'bg-blue-50/70 ring-1 ring-blue-400/40' : ''
                        } ${
                          isActive ? 'outline-2 outline-blue-600 outline-offset-[-2px] z-10' : ''
                        }`}
                      >
                        {/* Editor rendering */}
                        {isEditing ? (
                          col.key === 'itemId' ? (
                            <div className="absolute inset-0 z-50 bg-white" ref={searchDropdownRef}>
                              <input
                                ref={inputRef}
                                type="text"
                                value={itemSearchQuery}
                                onChange={(e) => {
                                  setItemSearchQuery(e.target.value);
                                  setIsDropdownOpen(true);
                                  setFocusedSearchIndex(0);
                                }}
                                className="w-full h-full border-0 focus:ring-0 p-1 text-[11px] font-bold text-slate-800"
                              />
                              {isDropdownOpen && filteredItems.length > 0 && (
                                <div className="absolute right-0 left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-50 font-bold text-slate-700">
                                  {filteredItems.map((item, idx) => (
                                    <div
                                      key={item.id}
                                      onClick={() => applySelectedItem(originalIdx, item)}
                                      onMouseEnter={() => setFocusedSearchIndex(idx)}
                                      className={`px-3 py-1.5 text-right text-[11px] cursor-pointer flex justify-between items-center ${
                                        idx === focusedSearchIndex ? 'bg-blue-500 text-white' : 'hover:bg-slate-100'
                                      }`}
                                    >
                                      <span className="truncate">{item.name}</span>
                                      <span className={`font-mono text-[9px] shrink-0 ${idx === focusedSearchIndex ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {item.code}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              ref={inputRef}
                              type={col.type === 'number' ? 'number' : 'text'}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={commitEditingValue}
                              className="absolute inset-0 w-full h-full border-0 focus:ring-0 p-1 text-[11px] font-mono font-bold text-slate-800"
                            />
                          )
                        ) : (
                          // Readonly visual displays
                          col.key === 'index' ? (
                            <div className="flex items-center justify-between w-full h-full text-slate-400">
                              <span className="font-mono text-[10px]">{originalIdx + 1}</span>
                              <GripVertical className="w-3 h-3 cursor-grab opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 shrink-0" />
                            </div>
                          ) : col.key === 'actions' ? (
                            <div className="flex items-center justify-center w-full h-full">
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteRow(r.id); }}
                                className="p-1 text-slate-300 hover:text-red-600 rounded cursor-pointer"
                                title="حذف هذا السطر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className={`${
                              col.type === 'number' || col.key === 'total' || col.key === 'code' ? 'font-mono' : ''
                            } ${
                              col.key === 'total' ? 'font-black text-slate-900' : 'text-slate-700'
                            }`}>
                              {renderedValue}
                            </span>
                          )
                        )}

                        {/* Row Resize dragging handle indicator on first column */}
                        {col.key === orderedColumns[0].key && (
                          <div
                            onMouseDown={(e) => handleRowResizeMouseDown(originalIdx, e)}
                            className="absolute bottom-0 right-0 left-0 h-1 cursor-row-resize hover:bg-blue-500/50 z-40"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Grid Totals Aggregations Bar */}
      <div className="bg-slate-100 border-t border-slate-300 h-9 shrink-0 flex items-center justify-between px-4 text-xs font-black text-slate-800">
        <div className="flex gap-4">
          <span>عدد المواد النشطة: <span className="font-mono text-blue-700">{rows.length}</span></span>
          <span>مجموع الكميات المعبأة: <span className="font-mono text-blue-700">{totals.quantity}</span></span>
        </div>
        <div>
          <span>إجمالي البنود السلعية: <span className="font-mono text-emerald-700">{totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span></span>
        </div>
      </div>
    </div>
  );
};

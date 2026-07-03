export interface ErpDatabase {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface Warehouse {
  id: string;
  name: string;
  branchId: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
}

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  rate: number; // exchange rate to base currency
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'assets' | 'liabilities' | 'equity' | 'revenues' | 'expenses';
  parentId: string | null;
  balance: number;
  finalAccount: 'balance_sheet' | 'income_statement' | 'trading';
}

export interface Customer {
  id: string;
  name: string;
  accountId: string;
  phone?: string;
  address?: string;
  balance: number;
  type: 'customer' | 'supplier' | 'both';
}

export interface ItemGroup {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Item {
  id: string;
  code: string;
  barcode: string;
  name: string;
  groupId: string | null;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  initialStock: number;
  currentStock: number;
  minLimit: number;
  maxLimit: number;
  image?: string;
  notes?: string;
}

export interface JournalEntryRow {
  accountId: string;
  debit: number;
  credit: number;
  costCenterId: string | null;
  notes: string;
}

export interface JournalEntry {
  id: string;
  entryNo: string;
  date: string;
  description: string;
  posted: boolean;
  rows: JournalEntryRow[];
}

export type InvoiceType =
  | 'purchase'           // شراء
  | 'sale'               // بيع
  | 'purchase_return'    // مردود شراء
  | 'sale_return'        // مردود بيع
  | 'inward'             // إدخال
  | 'outward'            // إخراج
  | 'opening_stock'      // بضاعة أول المدة
  | 'closing_stock'      // بضاعة آخر المدة
  | 'transfer_entry'     // مناقلة بقيد
  | 'transfer_no_entry'; // مناقلة بلا قيد

export interface InvoiceGridRow {
  id: string; // React list key
  itemId: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  notes: string;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: InvoiceType;
  date: string;
  description: string;
  branchId: string;
  customerId: string;
  currencyId: string;
  exchangeRate: number;
  paymentMethod: 'cash' | 'credit' | 'bank';
  warehouseId: string;
  cashAccountId: string;
  itemsAccountId: string;
  debitCostCenterId: string;
  creditCostCenterId: string;
  posted: boolean;
  entryCreated: boolean;
  paidAmount: number;
  salesRepId: string;
  notes: string;
  originalInvoiceRef?: string;
  items: InvoiceGridRow[];
  discount: number;
  addition: number;
  taxPercent: number; // e.g., 15 for 15%
  expenses: number;
  netAmount: number;
  attachments?: { name: string; url: string }[];
  stickyNotes?: string;
  auditLogs?: string[];
}

export interface MdiWindow {
  id: string;
  title: string;
  type: string; // 'invoice' | 'account_card' | 'chart_of_accounts' | 'journal_entry' | 'item_card' | 'item_tree' | 'reports' | 'branches' | 'permissions' | 'about'
  isOpen: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  props?: any; // Custom props, e.g. { invoiceType: 'sale', invoiceId: '...' }
}

export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  date: string;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'info' | 'danger';
  message: string;
  date: string;
}

export interface ErpPermissions {
  open_system: boolean;
  sales: boolean;
  purchases: boolean;
  inventory: boolean;
  accounting: boolean;
  journal_entries: boolean;
  reports: boolean;
  settings: boolean;
  user_management: boolean;
  backup_create: boolean;
  backup_restore: boolean;
  delete_data: boolean;
  price_update: boolean;
  cancel_invoices: boolean;
  edit_invoices: boolean;
  delete_invoices: boolean;
  print: boolean;
  export_excel: boolean;
  export_pdf: boolean;
}

export interface ErpUser {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  jobTitle: string;
  department: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  permissions: ErpPermissions;
  role?: string;
}

export interface LoginLog {
  id: string;
  username: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  device: string;
  lastActivity: string;
}

export interface ManufacturingMaterial {
  itemId: string;
  quantityRequired: number;
  quantityConsumed: number;
  unitPrice: number;
}

export interface ManufacturingOrder {
  id: string;
  orderNo: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  productItemId: string;
  quantity: number;
  warehouseId: string;
  notes: string;
  materials: ManufacturingMaterial[];
}

export interface PrintElement {
  id: string;
  type: 'text' | 'image' | 'barcode' | 'qrcode' | 'table' | 'totals' | 'logo' | 'signature' | 'stamp' | 'header' | 'footer' | 'watermark';
  x: number; // grid position x (e.g. 0 to 100)
  y: number; // grid position y (e.g. 0 to 1000)
  w: number; // width (e.g. 1 to 100)
  h: number; // height (pixels)
  value: string; // custom text, header text, logo path, or key (e.g., "{invoiceNo}", "{customerName}")
  fontSize?: number;
  align?: 'right' | 'left' | 'center';
  bold?: boolean;
  color?: string;
}

export interface PrintTemplate {
  id: string;
  name: string;
  type: string; // 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'quotation' | 'delivery' | 'transfer' | 'receipt' | 'payment' | 'journal'
  paperSize: string; // 'A4' | 'A5' | 'receipt_80' | 'receipt_58' | 'letter' | 'legal'
  isPortrait: boolean;
  margins: { top: number; bottom: number; left: number; right: number };
  showFrame: boolean;
  isDefault: boolean;
  elements: PrintElement[];
}



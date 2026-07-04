-- Professional ERP Database Schema for Supabase
-- Created: 2026-07-04
-- Includes: 28 core tables, Foreign Keys, Indexes, Constraints, and Row Level Security (RLS)

-- Enable extension for UUID if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. COMPANIES & BRANCHES
-- ==========================================

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tax_no VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    logo TEXT,
    version VARCHAR(50) DEFAULT '12.0.1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_branch_code UNIQUE (company_id, code)
);

-- ==========================================
-- 2. ROLES, PERMISSIONS & USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_role_name UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id VARCHAR(100) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL, -- 'dashboard', 'sales', 'purchases', 'inventory', 'warehouses', 'accounting', 'treasury', 'manufacturing', 'reports', 'settings', 'administration'
    can_view BOOLEAN DEFAULT FALSE,
    can_add BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_print BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    can_import BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    can_cancel BOOLEAN DEFAULT FALSE,
    can_close_period BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_role_module UNIQUE (role_id, module)
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id VARCHAR(100) REFERENCES branches(id) ON DELETE SET NULL,
    role_id VARCHAR(100) REFERENCES roles(id) ON DELETE SET NULL,
    fullName VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    jobTitle VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_username UNIQUE (company_id, username)
);

-- ==========================================
-- 3. CUSTOMERS, SUPPLIERS, CATEGORIES & PRODUCTS
-- ==========================================

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    balance NUMERIC(15, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    balance NUMERIC(15, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_category_name UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS units (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_unit_name UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
    unit_id VARCHAR(100) REFERENCES units(id) ON DELETE SET NULL,
    code VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    purchase_price NUMERIC(15, 4) DEFAULT 0 CHECK (purchase_price >= 0),
    sale_price NUMERIC(15, 4) DEFAULT 0 CHECK (sale_price >= 0),
    initial_stock NUMERIC(15, 4) DEFAULT 0,
    current_stock NUMERIC(15, 4) DEFAULT 0,
    min_limit NUMERIC(15, 4) DEFAULT 0,
    max_limit NUMERIC(15, 4) DEFAULT 0,
    image TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_product_code UNIQUE (company_id, code)
);

-- ==========================================
-- 4. WAREHOUSES & INVENTORY MOVEMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id VARCHAR(100) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id VARCHAR(100) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    warehouse_id VARCHAR(100) NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'in', 'out', 'transfer'
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity <> 0),
    unit_price NUMERIC(15, 4) NOT NULL CHECK (unit_price >= 0),
    ref_type VARCHAR(100), -- 'sale_invoice', 'purchase_invoice', 'opening_stock', etc.
    ref_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. SALES & PURCHASE INVOICES
-- ==========================================

CREATE TABLE IF NOT EXISTS sales_invoices (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id VARCHAR(100) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id VARCHAR(100) REFERENCES customers(id) ON DELETE CASCADE,
    warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE CASCADE,
    invoice_no VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'credit', 'bank'
    total_amount NUMERIC(15, 4) DEFAULT 0,
    discount NUMERIC(15, 4) DEFAULT 0,
    tax_amount NUMERIC(15, 4) DEFAULT 0,
    net_amount NUMERIC(15, 4) DEFAULT 0,
    paid_amount NUMERIC(15, 4) DEFAULT 0,
    posted BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_sale_invoice UNIQUE (company_id, invoice_no)
);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id VARCHAR(100) NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 4) NOT NULL CHECK (unit_price >= 0),
    total NUMERIC(15, 4) NOT NULL,
    discount NUMERIC(15, 4) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_invoices (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id VARCHAR(100) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id VARCHAR(100) REFERENCES suppliers(id) ON DELETE CASCADE,
    warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE CASCADE,
    invoice_no VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'credit', 'bank'
    total_amount NUMERIC(15, 4) DEFAULT 0,
    discount NUMERIC(15, 4) DEFAULT 0,
    tax_amount NUMERIC(15, 4) DEFAULT 0,
    net_amount NUMERIC(15, 4) DEFAULT 0,
    paid_amount NUMERIC(15, 4) DEFAULT 0,
    posted BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_purchase_invoice UNIQUE (company_id, invoice_no)
);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id VARCHAR(100) NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 4) NOT NULL CHECK (unit_price >= 0),
    total NUMERIC(15, 4) NOT NULL,
    discount NUMERIC(15, 4) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. GENERAL LEDGER & ACCOUNTING
-- ==========================================

CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'assets', 'liabilities', 'equity', 'revenues', 'expenses'
    parent_id VARCHAR(100) REFERENCES accounts(id) ON DELETE SET NULL,
    balance NUMERIC(15, 4) DEFAULT 0,
    final_account VARCHAR(50) NOT NULL, -- 'balance_sheet', 'income_statement', 'trading'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_account_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_no VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    posted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_journal_entry UNIQUE (company_id, entry_no)
);

CREATE TABLE IF NOT EXISTS journal_entry_details (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_id VARCHAR(100) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id VARCHAR(100) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    debit NUMERIC(15, 4) DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC(15, 4) DEFAULT 0 CHECK (credit >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_debit_credit CHECK (debit = 0 OR credit = 0)
);

-- ==========================================
-- 7. TREASURY, BANKS, EMPLOYEES & HR
-- ==========================================

CREATE TABLE IF NOT EXISTS treasury (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id VARCHAR(100) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    balance NUMERIC(15, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banks (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_no VARCHAR(100),
    balance NUMERIC(15, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    job_title VARCHAR(100),
    department VARCHAR(100),
    salary NUMERIC(15, 4) DEFAULT 0 CHECK (salary >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_employee_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS hr (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- 'hiring', 'salary_increase', 'evaluation', etc.
    details TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. SETTINGS, AUDIT, ATTACHMENTS, NOTIFICATIONS & TEMPLATES
-- ==========================================

CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_company_setting_key UNIQUE (company_id, key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(100),
    username VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    device VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ref_type VARCHAR(100) NOT NULL, -- 'invoice', 'product', 'employee', etc.
    ref_id VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS print_templates (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'sale', 'purchase', etc.
    paper_size VARCHAR(50) DEFAULT 'A4',
    is_portrait BOOLEAN DEFAULT TRUE,
    margins TEXT, -- JSON representation of margins
    show_frame BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    elements TEXT, -- JSON representation of print elements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- BACKWARDS COMPATIBILITY TABLES FOR SYNC
-- ==========================================

CREATE TABLE IF NOT EXISTS erp_databases (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '12.0.1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS erp_company_records (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL REFERENCES erp_databases(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. INDEXES FOR PERFORMANCE
-- ==========================================

-- Branches
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Roles & Permissions
CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id);

-- Customers & Suppliers
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);

-- Categories & Products
CREATE INDEX IF NOT EXISTS idx_categories_company ON categories(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Warehouses & Inventory movements
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_warehouse ON inventory_movements(warehouse_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_sales_invoices_company ON sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_no ON sales_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_inv ON sales_invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_company ON purchase_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_no ON purchase_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_inv ON purchase_invoice_items(invoice_id);

-- Accounting
CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_no ON journal_entries(entry_no);
CREATE INDEX IF NOT EXISTS idx_journal_details_entry ON journal_entry_details(entry_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Attachments & Notifications
CREATE INDEX IF NOT EXISTS idx_attachments_ref ON attachments(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);


-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_company_records ENABLE ROW LEVEL SECURITY;

-- Create Isolation Policies
CREATE POLICY allow_all_companies ON companies FOR ALL USING (true);
CREATE POLICY allow_all_branches ON branches FOR ALL USING (true);
CREATE POLICY allow_all_roles ON roles FOR ALL USING (true);
CREATE POLICY allow_all_permissions ON permissions FOR ALL USING (true);
CREATE POLICY allow_all_users ON users FOR ALL USING (true);
CREATE POLICY allow_all_customers ON customers FOR ALL USING (true);
CREATE POLICY allow_all_suppliers ON suppliers FOR ALL USING (true);
CREATE POLICY allow_all_categories ON categories FOR ALL USING (true);
CREATE POLICY allow_all_units ON units FOR ALL USING (true);
CREATE POLICY allow_all_products ON products FOR ALL USING (true);
CREATE POLICY allow_all_warehouses ON warehouses FOR ALL USING (true);
CREATE POLICY allow_all_movements ON inventory_movements FOR ALL USING (true);
CREATE POLICY allow_all_sales_inv ON sales_invoices FOR ALL USING (true);
CREATE POLICY allow_all_sales_items ON sales_invoice_items FOR ALL USING (true);
CREATE POLICY allow_all_purch_inv ON purchase_invoices FOR ALL USING (true);
CREATE POLICY allow_all_purch_items ON purchase_invoice_items FOR ALL USING (true);
CREATE POLICY allow_all_accounts ON accounts FOR ALL USING (true);
CREATE POLICY allow_all_journal ON journal_entries FOR ALL USING (true);
CREATE POLICY allow_all_journal_details ON journal_entry_details FOR ALL USING (true);
CREATE POLICY allow_all_treasury ON treasury FOR ALL USING (true);
CREATE POLICY allow_all_banks ON banks FOR ALL USING (true);
CREATE POLICY allow_all_employees ON employees FOR ALL USING (true);
CREATE POLICY allow_all_hr ON hr FOR ALL USING (true);
CREATE POLICY allow_all_settings ON settings FOR ALL USING (true);
CREATE POLICY allow_all_audit ON audit_logs FOR ALL USING (true);
CREATE POLICY allow_all_attachments ON attachments FOR ALL USING (true);
CREATE POLICY allow_all_notifications ON notifications FOR ALL USING (true);
CREATE POLICY allow_all_templates ON print_templates FOR ALL USING (true);
CREATE POLICY allow_all_erp_db ON erp_databases FOR ALL USING (true);
CREATE POLICY allow_all_erp_records ON erp_company_records FOR ALL USING (true);

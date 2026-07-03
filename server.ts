import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data folder exists for persistent storage
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initialize database file with defaults if not exists
function loadServerDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      databases: [
        { id: 'db-main', name: 'AlMeezan_DB_2026', description: 'قاعدة البيانات الرئيسية للمؤسسة', version: '11.4.2' },
        { id: 'db-test', name: 'AlMeezan_Test', description: 'قاعدة بيانات تجريبية للتدريب', version: '11.4.0' },
      ],
      backups: {},
      dbData: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { databases: [], backups: {}, dbData: {} };
  }
}

function saveServerDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Supabase client lazy initialization
let supabaseClient: any = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

if (supabaseUrl && supabaseKey && isValidSupabaseUrl(supabaseUrl) && !supabaseUrl.includes('your-project-id')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase initialized successfully on server');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// Fallback multi-tenant storage per connected database
function getDbData(dbId: string) {
  const db = loadServerDb();
  if (!db.dbData[dbId]) {
    // Default initial datasets
    const DEFAULT_USERS = [
      {
        id: 'usr-admin',
        fullName: 'مدير النظام المالي المعتمد',
        username: 'Ahmed',
        password: '01278150', // Encrypted password representation in real app, here simple matching
        jobTitle: 'المدير العام',
        department: 'الإدارة العامة',
        email: 'ahmed@almeezan.net',
        phone: '0500000000',
        isActive: true,
        role: 'admin',
        permissions: {
          open_system: true,
          sales: true,
          purchases: true,
          inventory: true,
          accounting: true,
          journal_entries: true,
          reports: true,
          settings: true,
          user_management: true,
          backup_create: true,
          backup_restore: true,
          delete_data: true,
          price_update: true,
          cancel_invoices: true,
          edit_invoices: true,
          delete_invoices: true,
          print: true,
          export_excel: true,
          export_pdf: true,
        },
      }
    ];

    const initialBranches = [
      { id: 'br-1', name: 'الفرع الرئيسي - الرياض', code: '01' },
      { id: 'br-2', name: 'فرع المنطقة الغربية - جدة', code: '02' },
    ];

    const initialWarehouses = [
      { id: 'wh-1', name: 'مستودع صالة العرض الرئيسية', branchId: 'br-1' },
      { id: 'wh-2', name: 'المستودع المركزي الكبير', branchId: 'br-1' },
      { id: 'wh-3', name: 'مستودع فرع جدة', branchId: 'br-2' },
    ];

    const initialCostCenters = [
      { id: 'cc-1', name: 'مركز إدارة المبيعات والتسويق', code: '1001' },
      { id: 'cc-2', name: 'مركز الإدارة التشغيلية واللوجستية', code: '1002' },
    ];

    const initialCurrencies = [
      { id: 'cur-sar', name: 'ريال سعودي', symbol: 'ر.س', rate: 1.0 },
      { id: 'cur-usd', name: 'دولار أمريكي', symbol: '$', rate: 3.75 },
      { id: 'cur-jod', name: 'دينار أردني', symbol: 'د.أ', rate: 5.29 },
    ];

    const initialAccounts = [
      { id: 'acc-111001', code: '111001', name: 'الصندوق الرئيسي للفرع', type: 'assets', parentId: null, balance: 450000, finalAccount: 'balance_sheet' },
      { id: 'acc-111002', code: '111002', name: 'البنك الأهلي السعودي', type: 'assets', parentId: null, balance: 1250000, finalAccount: 'balance_sheet' },
      { id: 'acc-112001', code: '112001', name: 'العملاء المحليين (إجمالي)', type: 'assets', parentId: null, balance: 185000, finalAccount: 'balance_sheet' },
      { id: 'acc-113001', code: '113001', name: 'بضاعة أول المدة', type: 'assets', parentId: null, balance: 350000, finalAccount: 'trading' },
      { id: 'acc-211001', code: '211001', name: 'الموردين التجاريين (إجمالي)', type: 'liabilities', parentId: null, balance: 290000, finalAccount: 'balance_sheet' },
      { id: 'acc-311001', code: '311001', name: 'رأس مال الشركة المدفوع', type: 'equity', parentId: null, balance: 1500000, finalAccount: 'balance_sheet' },
      { id: 'acc-411001', code: '411001', name: 'حساب مبيعات البضائع', type: 'revenues', parentId: null, balance: 840000, finalAccount: 'trading' },
      { id: 'acc-411002', code: '411002', name: 'إيرادات خدمات صيانة وعقود', type: 'revenues', parentId: null, balance: 45000, finalAccount: 'income_statement' },
      { id: 'acc-511001', code: '511001', name: 'حساب مشتريات البضائع', type: 'expenses', parentId: null, balance: 520000, finalAccount: 'trading' },
      { id: 'acc-512001', code: '512001', name: 'مصاريف رواتب وأجور الموظفين', type: 'expenses', parentId: null, balance: 165000, finalAccount: 'income_statement' },
      { id: 'acc-512002', code: '512002', name: 'مصاريف كهرباء ومياه واتصالات', type: 'expenses', parentId: null, balance: 18500, finalAccount: 'income_statement' },
    ];

    const initialCustomers = [
      { id: 'cust-1', name: 'مؤسسة الأمل للتجارة والتقسيط', accountId: 'acc-112001', phone: '0501234567', address: 'طريق الملك فهد، الرياض', balance: 85000, type: 'customer' },
      { id: 'cust-2', name: 'شركة الرياض الوطنية للتوريدات والمقاولات', accountId: 'acc-211001', phone: '0547654321', address: 'الملز، الرياض', balance: 290000, type: 'supplier' },
      { id: 'cust-3', name: 'معرض النخبة للأجهزة والتقنية', accountId: 'acc-112001', phone: '0569876543', address: 'حي الروضة، جدة', balance: 100000, type: 'customer' },
    ];

    const initialItemGroups = [
      { id: 'ig-1', name: 'الأجهزة المنزلية الكبيرة', parentId: null },
      { id: 'ig-2', name: 'الشاشات والإلكترونيات المرئية', parentId: null },
      { id: 'ig-3', name: 'الأجهزة الكهربائية الصغيرة والملحقات', parentId: null },
    ];

    const initialItems = [
      { id: 'item-1', code: 'PRD-001', name: 'شاشة سامسونج ذكية 55 بوصة 4K', groupId: 'ig-2', barCode: '88060901', unit: 'حبة', currentStock: 45, averageCost: 1850, salePrice: 2400, minStock: 5 },
      { id: 'item-2', code: 'PRD-002', name: 'ثلاجة إل جي دولابي 22 قدم استيل', groupId: 'ig-1', barCode: '88060902', unit: 'حبة', currentStock: 12, averageCost: 3200, salePrice: 4100, minStock: 2 },
      { id: 'item-3', code: 'PRD-003', name: 'غسالة ملابس توشيبا حوضين 10 كغ', groupId: 'ig-1', barCode: '88060903', unit: 'حبة', currentStock: 25, averageCost: 1100, salePrice: 1550, minStock: 3 },
      { id: 'item-4', code: 'PRD-004', name: 'صانعة قهوة نسبريسو كبسولات', groupId: 'ig-3', barCode: '88060904', unit: 'حبة', currentStock: 80, averageCost: 380, salePrice: 550, minStock: 10 },
    ];

    const initialJournalEntries = [
      {
        id: 'je-1',
        entryNo: 'JV-2026-001',
        date: '2026-07-01',
        description: 'قيد إثبات رأس المال التأسيسي النقدي للشركة',
        posted: true,
        rows: [
          { accountId: 'acc-111001', debit: 1500000, credit: 0, costCenterId: null, notes: 'إيداع الصندوق الرئيسي للشركة' },
          { accountId: 'acc-311001', debit: 0, credit: 1500000, costCenterId: null, notes: 'رأس مال الشركاء النقدي بالكامل' },
        ],
      },
    ];

    const initialInvoices = [
      {
        id: 'inv-1',
        invoiceNo: 'SAL-2026-001',
        date: '2026-07-02',
        type: 'sale',
        customerId: 'cust-1',
        paymentMethod: 'credit',
        warehouseId: 'wh-1',
        branchId: 'br-1',
        totalAmount: 4800,
        discount: 300,
        taxAmount: 675,
        netAmount: 5175,
        paidAmount: 0,
        posted: true,
        entryCreated: true,
        description: 'مبيعات آجلة لشركة الأمل للتجارة والتقسيط',
        items: [
          { itemId: 'item-1', quantity: 2, unitPrice: 2400, discount: 150, netPrice: 2250, total: 4500 },
        ],
      },
    ];

    const initialManufacturing = [
      {
        id: 'mo-1',
        orderNo: 'MO-2026-001',
        date: '2026-07-02',
        status: 'pending',
        productItemId: 'item-1',
        quantity: 10,
        warehouseId: 'wh-1',
        notes: 'تشغيل خط تجميع شاشات العرض المتكاملة',
        materials: [
          { itemId: 'item-4', quantityRequired: 10, quantityConsumed: 0, unitPrice: 380 }
        ]
      }
    ];

    db.dbData[dbId] = {
      branches: initialBranches,
      warehouses: initialWarehouses,
      costCenters: initialCostCenters,
      currencies: initialCurrencies,
      accounts: initialAccounts,
      customers: initialCustomers,
      itemGroups: initialItemGroups,
      items: initialItems,
      journalEntries: initialJournalEntries,
      invoices: initialInvoices,
      tasks: [],
      alerts: [],
      users: DEFAULT_USERS,
      loginLogs: [],
      manufacturing: initialManufacturing,
      settings: {
        companyName: 'أحمد سامي سيستم المحدودة',
        taxNo: '300054321000003',
        address: 'الرياض - حي الياسمين - طريق الملك سلمان',
        phone: '0112223344',
        logo: ''
      }
    };
    saveServerDb(db);
  }
  return db.dbData[dbId];
}

function saveDbData(dbId: string, data: any) {
  const db = loadServerDb();
  db.dbData[dbId] = data;
  saveServerDb(db);
}

// Global API endpoints

// Get list of databases (companies)
app.get('/api/databases', (req, res) => {
  const db = loadServerDb();
  res.json(db.databases);
});

// Create new company database
app.post('/api/databases', (req, res) => {
  const { name, description } = req.body;
  const db = loadServerDb();
  const newDb = {
    id: `db-${Date.now()}`,
    name: name || 'شركة جديدة',
    description: description || 'قاعدة بيانات جديدة',
    version: '12.0.1'
  };
  db.databases.push(newDb);
  saveServerDb(db);
  res.json(newDb);
});

// Delete company database
app.delete('/api/databases/:id', (req, res) => {
  const { id } = req.params;
  const db = loadServerDb();
  db.databases = db.databases.filter((d: any) => d.id !== id);
  if (db.dbData[id]) {
    delete db.dbData[id];
  }
  saveServerDb(db);
  res.json({ success: true });
});

// Sync or fetch data endpoints per company
app.get('/api/data/:dbId', (req, res) => {
  const { dbId } = req.params;
  const data = getDbData(dbId);
  res.json(data);
});

app.post('/api/data/:dbId', (req, res) => {
  const { dbId } = req.params;
  const data = req.body;
  saveDbData(dbId, data);
  res.json({ success: true, message: 'تم حفظ كافة التغييرات ومزامنتها بنجاح على الخادم.' });
});

// REST endpoints for real-time specific updates if client wants atomic saves
app.post('/api/data/:dbId/:module', (req, res) => {
  const { dbId, module } = req.params;
  const payload = req.body;
  const data = getDbData(dbId);

  if (!data[module]) {
    data[module] = [];
  }

  // Find and update or insert
  const idx = data[module].findIndex((x: any) => x.id === payload.id);
  if (idx !== -1) {
    data[module][idx] = payload;
  } else {
    data[module].push(payload);
  }

  // Automatically trigger accounting effect for journal entries
  if (module === 'journalEntries' && payload.posted) {
    payload.rows.forEach((row: any) => {
      const acc = data.accounts.find((a: any) => a.id === row.accountId);
      if (acc) {
        const isDebitIncrease = acc.type === 'assets' || acc.type === 'expenses';
        if (isDebitIncrease) {
          acc.balance += (row.debit - row.credit);
        } else {
          acc.balance += (row.credit - row.debit);
        }
      }
    });
  }

  // Automatically trigger stock & ledger effect for invoices
  if (module === 'invoices') {
    // Inventory changes
    payload.items.forEach((itemRow: any) => {
      const prod = data.items.find((i: any) => i.id === itemRow.itemId);
      if (prod) {
        if (payload.type === 'purchase' || payload.type === 'sale_return') {
          prod.currentStock += itemRow.quantity;
        } else if (payload.type === 'sale' || payload.type === 'purchase_return') {
          prod.currentStock -= itemRow.quantity;
        }
      }
    });

    // Customer balance changes
    if (payload.customerId) {
      const cust = data.customers.find((c: any) => c.id === payload.customerId);
      if (cust) {
        let balDiff = 0;
        if (payload.type === 'sale') {
          balDiff += payload.netAmount - payload.paidAmount;
        } else if (payload.type === 'sale_return') {
          balDiff -= payload.netAmount;
        } else if (payload.type === 'purchase') {
          balDiff += payload.netAmount - payload.paidAmount;
        } else if (payload.type === 'purchase_return') {
          balDiff -= payload.netAmount;
        }
        cust.balance += balDiff;
      }
    }
  }

  saveDbData(dbId, data);
  res.json({ success: true, item: payload });
});

app.delete('/api/data/:dbId/:module/:id', (req, res) => {
  const { dbId, module, id } = req.params;
  const data = getDbData(dbId);

  if (data[module]) {
    data[module] = data[module].filter((x: any) => x.id !== id);
    saveDbData(dbId, data);
  }
  res.json({ success: true });
});

// File upload endpoint (base64 simulation to store inside server)
app.post('/api/data/:dbId/upload', (req, res) => {
  const { dbId } = req.params;
  const { fileName, fileContent } = req.body;
  
  const uploadDir = path.join(DATA_DIR, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const cleanFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, cleanFileName);

  try {
    const base64Data = fileContent.replace(/^data:.*?;base64,/, "");
    fs.writeFileSync(filePath, base64Data, 'base64');
    res.json({ success: true, fileUrl: `/uploads/${cleanFileName}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to write file' });
  }
});

// Serve uploaded attachments
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

// Backups REST APIs
app.get('/api/data/:dbId/backups', (req, res) => {
  const db = loadServerDb();
  const list = db.backups[req.params.dbId] || [];
  res.json(list);
});

app.post('/api/data/:dbId/backups', (req, res) => {
  const { dbId } = req.params;
  const { type, storage } = req.body;

  const db = loadServerDb();
  if (!db.backups[dbId]) db.backups[dbId] = [];

  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const cleanDate = timestamp.replace(/[- :]/g, '');
  const fileName = `AlMeezan_Backup_${type === 'auto' ? 'Auto' : 'Manual'}_${cleanDate}.bak`;

  const newBackup = {
    id: `b-${Date.now()}`,
    date: timestamp,
    type,
    status: 'success',
    fileName,
    size: `${(25.0 + Math.random() * 2).toFixed(1)} MB`,
    storage,
    dataDump: JSON.stringify(db.dbData[dbId] || {})
  };

  db.backups[dbId].unshift(newBackup);
  saveServerDb(db);
  res.json(newBackup);
});

app.post('/api/data/:dbId/backups/restore', (req, res) => {
  const { dbId } = req.params;
  const { backupId } = req.body;

  const db = loadServerDb();
  const backupsList = db.backups[dbId] || [];
  const target = backupsList.find((b: any) => b.id === backupId);

  if (!target) {
    return res.status(404).json({ success: false, error: 'Backup not found' });
  }

  try {
    db.dbData[dbId] = JSON.parse(target.dataDump);
    saveServerDb(db);
    res.json({ success: true, message: 'تم استعادة النسخة الاحتياطية المحددة بنجاح وإعادة تشغيل النظام.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to parse backup data dump' });
  }
});

app.delete('/api/data/:dbId/backups/:id', (req, res) => {
  const { dbId, id } = req.params;
  const db = loadServerDb();
  if (db.backups[dbId]) {
    db.backups[dbId] = db.backups[dbId].filter((b: any) => b.id !== id);
    saveServerDb(db);
  }
  res.json({ success: true });
});

// Update Management Endpoints for the ERP Automatic Update System
app.get('/api/updates/check', (req, res) => {
  const db = loadServerDb();
  if (!db.updates) {
    db.updates = [
      {
        id: 'upd-1',
        version: '12.0.0',
        notes: 'الإصدار التأسيسي لنظام الميزان دوت نت المطور بمزايا الذكاء الاصطناعي والحسابات الختامية المتكاملة.',
        changelog: '1. إطلاق النظام الأساسي.\n2. دعم تعدد الفروع والمستودعات.\n3. واجهات إدخال سريعة وفواتير ذكية.',
        releaseDate: '2026-07-01',
        size: '15.4 MB',
        isMandatory: false
      }
    ];
    saveServerDb(db);
  }
  
  const currentVersion = (req.query.currentVersion as string) || '12.0.0';
  
  // Find the latest update
  const latestUpdate = db.updates[db.updates.length - 1];
  
  // Simple version comparison: if latest update version is not equal to currentVersion
  const hasUpdate = latestUpdate && latestUpdate.version !== currentVersion;
  
  res.json({
    hasUpdate,
    latest: latestUpdate || null,
    history: db.updates
  });
});

app.post('/api/updates/publish', (req, res) => {
  const { version, notes, changelog, size, isMandatory, releaseDate } = req.body;
  const db = loadServerDb();
  if (!db.updates) {
    db.updates = [];
  }
  
  const newUpdate = {
    id: `upd-${Date.now()}`,
    version: version || '12.0.1',
    notes: notes || 'تحسينات عامة على أداء النظام وإصلاح بعض العيوب.',
    changelog: changelog || '• معالجة استقرار الحسابات.\n• تحسينات على كرت المادة.',
    releaseDate: releaseDate || new Date().toISOString().split('T')[0],
    size: size || '2.8 MB',
    isMandatory: !!isMandatory
  };
  
  db.updates.push(newUpdate);
  saveServerDb(db);
  res.json({ success: true, update: newUpdate });
});

app.post('/api/updates/rollback', (req, res) => {
  const db = loadServerDb();
  if (db.updates && db.updates.length > 1) {
    const rolled = db.updates.pop();
    saveServerDb(db);
    res.json({ success: true, message: 'تم التراجع عن آخر تحديث بنجاح.', rolled });
  } else {
    res.status(400).json({ success: false, error: 'لا يمكن التراجع، هذا هو الإصدار التأسيسي الوحيد المتاح.' });
  }
});

// Main Vite development configuration or Production serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud ERP Server is listening on port ${PORT}`);
  });
}

start();

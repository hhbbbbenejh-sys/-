export type LanguageCode = 'ar' | 'en' | 'fr' | 'de' | 'es' | 'tr' | 'it' | 'zh' | 'ru';

export const LANGUAGES: { code: LanguageCode; name: string; nativeName: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' }
];

export const translations: Record<string, Record<LanguageCode, string>> = {
  // Brand & Header
  appName: {
    ar: 'أحمد سامي سيستم',
    en: 'Ahmed Samy System',
    fr: 'Système Ahmed Samy',
    de: 'Ahmed Samy System',
    es: 'Sistema Ahmed Samy',
    tr: 'Ahmed Samy Sistemi',
    it: 'Sistema Ahmed Samy',
    zh: '艾哈迈德萨米系统',
    ru: 'Система Ахмеда Сами'
  },
  companyName: {
    ar: 'مؤسسة الميزان للتجارة الدولية',
    en: 'Al-Meezan Int. Trading Corp.',
    fr: 'Al-Meezan Corp. de Commerce',
    de: 'Al-Meezan Int. Handelsgesellschaft',
    es: 'Corp. de Comercio Int. Al-Meezan',
    tr: 'Al-Meezan Uluslararası Ticaret',
    it: 'Al-Meezan Int. Trading Corp.',
    zh: '美赞国际贸易公司',
    ru: 'Миззан Международная Торговая Корп.'
  },
  fiscalYear: {
    ar: 'السنة المالية الحالية',
    en: 'Current Fiscal Year',
    fr: 'Exercice Fiscal Actuel',
    de: 'Aktuelles Geschäftsjahr',
    es: 'Año Fiscal Actual',
    tr: 'Mevcut Mali Yıl',
    it: 'Anno Fiscale Corrente',
    zh: '当前财政年度',
    ru: 'Текущий финансовый год'
  },
  searchPlaceholder: {
    ar: 'البحث السريع عن الشاشات والتقارير والمواد...',
    en: 'Quick search screens, reports, items...',
    fr: 'Recherche rapide d\'écrans, rapports, articles...',
    de: 'Schnellsuche Masken, Berichte, Artikel...',
    es: 'Búsqueda rápida de pantallas, informes, artículos...',
    tr: 'Ekranlar, raporlar, ürünler hızlı ara...',
    it: 'Ricerca rapida schermate, report, articoli...',
    zh: '快速搜索屏幕、报告、物料...',
    ru: 'Быстрый поиск экранов, отчетов, товаров...'
  },
  activeUser: {
    ar: 'المستخدم النشط',
    en: 'Active User',
    fr: 'Utilisateur Actif',
    de: 'Aktiver Benutzer',
    es: 'Usuario Activo',
    tr: 'Aktif Kullanıcı',
    it: 'Utente Attivo',
    zh: '活动用户',
    ru: 'Активный пользователь'
  },
  database: {
    ar: 'قاعدة البيانات',
    en: 'Database',
    fr: 'Base de données',
    de: 'Datenbank',
    es: 'Base de datos',
    tr: 'Veritabanı',
    it: 'Database',
    zh: '数据库',
    ru: 'База данных'
  },
  connectionStatus: {
    ar: 'حالة الاتصال',
    en: 'Connection Status',
    fr: 'État de connexion',
    de: 'Verbindungsstatus',
    es: 'Estado de conexión',
    tr: 'Bağlantı Durumu',
    it: 'Stato della Connessione',
    zh: '连接状态',
    ru: 'Статус подключения'
  },
  connected: {
    ar: 'متصل بنجاح',
    en: 'Connected successfully',
    fr: 'Connecté avec succès',
    de: 'Erfolgreich verbunden',
    es: 'Conectado exitosamente',
    tr: 'Başarıyla bağlandı',
    it: 'Connesso con successo',
    zh: '连接成功',
    ru: 'Успешно подключено'
  },
  programVersion: {
    ar: 'إصدار البرنامج',
    en: 'Program Version',
    fr: 'Version du programme',
    de: 'Programmversion',
    es: 'Versión del programa',
    tr: 'Program Sürümü',
    it: 'Versione del Programma',
    zh: '程序版本',
    ru: 'Версия программы'
  },

  // Menu bar sections
  file: {
    ar: 'ملف',
    en: 'File',
    fr: 'Fichier',
    de: 'Datei',
    es: 'Archivo',
    tr: 'Dosya',
    it: 'File',
    zh: '文件',
    ru: 'Файл'
  },
  accounting_menu: {
    ar: 'الحسابات',
    en: 'Accounting',
    fr: 'Comptabilité',
    de: 'Buchhaltung',
    es: 'Contabilidad',
    tr: 'Muhasebe',
    it: 'Contabilità',
    zh: '财务',
    ru: 'Бухгалтерия'
  },
  sales_menu: {
    ar: 'المبيعات',
    en: 'Sales',
    fr: 'Ventes',
    de: 'Verkauf',
    es: 'Ventas',
    tr: 'Satışlar',
    it: 'Vendite',
    zh: '销售',
    ru: 'Продажи'
  },
  purchases_menu: {
    ar: 'المشتريات',
    en: 'Purchases',
    fr: 'Achats',
    de: 'Einkauf',
    es: 'Compras',
    tr: 'Satın Almalar',
    it: 'Acquisti',
    zh: '采购',
    ru: 'Закупки'
  },
  inventory_menu: {
    ar: 'المستودعات',
    en: 'Inventory',
    fr: 'Inventaire',
    de: 'Inventar',
    es: 'Inventario',
    tr: 'Envanter',
    it: 'Inventario',
    zh: '库存',
    ru: 'Склад'
  },
  reports_menu: {
    ar: 'تقارير',
    en: 'Reports',
    fr: 'Rapports',
    de: 'Berichte',
    es: 'Informes',
    tr: 'Raporlar',
    it: 'Report',
    zh: '报告',
    ru: 'Отчеты'
  },
  tools_menu: {
    ar: 'أدوات',
    en: 'Tools',
    fr: 'Outils',
    de: 'Werkzeuge',
    es: 'Herramientas',
    tr: 'Araçlar',
    it: 'Strumenti',
    zh: '工具',
    ru: 'Инструменты'
  },
  security_menu: {
    ar: 'الأمان',
    en: 'Security',
    fr: 'Sécurité',
    de: 'Sicherheit',
    es: 'Seguridad',
    tr: 'Güvenlik',
    it: 'Sicurezza',
    zh: '安全',
    ru: 'Безопасность'
  },
  favorites_menu: {
    ar: 'المفضلة',
    en: 'Favorites',
    fr: 'Favoris',
    de: 'Favoriten',
    es: 'Favoritos',
    tr: 'Favoriler',
    it: 'Preferiti',
    zh: '收藏夹',
    ru: 'Избранное'
  },
  help_menu: {
    ar: 'تعليمات',
    en: 'Help',
    fr: 'Aide',
    de: 'Hilfe',
    es: 'Ayuda',
    tr: 'Yardım',
    it: 'Aiuto',
    zh: '帮助',
    ru: 'Помощь'
  },

  // Screens names for quick link and search
  chartOfAccounts: {
    ar: 'دليل الحسابات (شجرة الحسابات)',
    en: 'Chart of Accounts (Account Tree)',
    fr: 'Plan Comptable (Arborescence)',
    de: 'Kontenplan (Kontobaum)',
    es: 'Plan de Cuentas (Árbol)',
    tr: 'Hesap Planı (Hesap Ağacı)',
    it: 'Piano dei Conti',
    zh: '会计科目表 (科目树)',
    ru: 'План счетов (Дерево счетов)'
  },
  accountCard: {
    ar: 'بطاقة تعريف حساب جديد',
    en: 'Account Card (New Account)',
    fr: 'Fiche de Compte',
    de: 'Kontokarte (Neues Konto)',
    es: 'Ficha de Cuenta',
    tr: 'Hesap Kartı (Yeni Hesap)',
    it: 'Scheda Conto',
    zh: '科目卡片 (新科目)',
    ru: 'Карточка счета (Новый счет)'
  },
  journalEntry: {
    ar: 'سند قيود اليومية العامة',
    en: 'General Journal Voucher',
    fr: 'Écriture de Journal Général',
    de: 'Journalbuchung',
    es: 'Asiento de Diario General',
    tr: 'Yevmiye Fişi',
    it: 'Scrittura di Prima Nota',
    zh: '普通日记账凭证',
    ru: 'Журнал общих проводок'
  },
  openingEntry: {
    ar: 'قيد الافتتاح السنوي للميزانية',
    en: 'Opening Balance Voucher',
    fr: 'Écriture d\'Ouverture',
    de: 'Eröffnungsbilanzbuchung',
    es: 'Asiento de Apertura',
    tr: 'Açılış Bilançosu Fişi',
    it: 'Apertura dei Conti',
    zh: '开户资产凭证',
    ru: 'Вступительная проводка'
  },
  salesInvoice: {
    ar: 'فاتورة مبيعات نقدية وآجل',
    en: 'Sales Invoice (Cash/Credit)',
    fr: 'Facture de Vente',
    de: 'Ausgangsrechnung',
    es: 'Facture de Venta',
    tr: 'Satış Faturası',
    it: 'Fattura di Vendita',
    zh: '销售发票 (现结/记账)',
    ru: 'Счет-фактура продаж'
  },
  purchaseInvoice: {
    ar: 'فاتورة مشتريات وتوريد',
    en: 'Purchase Invoice & Supply',
    fr: 'Facture d\'Achat',
    de: 'Eingangsrechnung',
    es: 'Factura de Compra',
    tr: 'Alış Faturası',
    it: 'Fattura d\'Acquisto',
    zh: '采购发票',
    ru: 'Счет-фактура закупок'
  },
  salesReturn: {
    ar: 'مرتجع مبيعات العملاء',
    en: 'Sales Return Invoice',
    fr: 'Retour de Vente',
    de: 'Verkaufsretoure',
    es: 'Devolución de Venta',
    tr: 'Satış İade Faturası',
    it: 'Reso da Cliente',
    zh: '销售退货单',
    ru: 'Возврат продаж'
  },
  purchaseReturn: {
    ar: 'مرتجع مشتريات للموردين',
    en: 'Purchase Return Invoice',
    fr: 'Retour d\'Achat',
    de: 'Einkaufsretoure',
    es: 'Devolución de Compra',
    tr: 'Alış İade Faturası',
    it: 'Reso a Fornitore',
    zh: '采购退货单',
    ru: 'Возврат закупок'
  },
  itemTree: {
    ar: 'شجرة تصنيفات المواد والمخزون',
    en: 'Item Groups & Category Tree',
    fr: 'Groupes d\'Articles & Catégories',
    de: 'Artikelgruppen & Kategoriebaum',
    es: 'Grupos de Artículos & Categorías',
    tr: 'Ürün Grupları & Kategoriler',
    it: 'Gruppi Articolo',
    zh: '物料分类树',
    ru: 'Дерево групп товаров'
  },
  itemCard: {
    ar: 'بطاقة تعريف مادة ومنتج جديد',
    en: 'Item Card & Product definition',
    fr: 'Fiche Article & Produit',
    de: 'Artikelkarte (Neuer Artikel)',
    es: 'Ficha de Artículo',
    tr: 'Ürün Kartı (Yeni Ürün)',
    it: 'Scheda Articolo',
    zh: '物料卡片',
    ru: 'Карточка товара'
  },
  priceUpdate: {
    ar: 'تعديل أسعار المواد دفعة واحدة',
    en: 'Bulk Item Price Updater',
    fr: 'Mise à jour des Prix en Masse',
    de: 'Massen-Preisaktualisierung',
    es: 'Actualizador de Precios Masivo',
    tr: 'Toplu Ürün Fiyat Güncelleyici',
    it: 'Aggiornamento Prezzi Massivo',
    zh: '批量更新价格',
    ru: 'Массовое обновление цен'
  },
  about: {
    ar: 'حول النظام والترخيص المالي',
    en: 'About System & Licensing',
    fr: 'À propos du système',
    de: 'Über das System',
    es: 'Acerca del sistema',
    tr: 'Sistem Hakkında',
    it: 'Informazioni sul Sistema',
    zh: '关于系统 & 许可',
    ru: 'О системе и лицензии'
  },

  // Widgets & UI words
  calculator: {
    ar: 'الآلة الحاسبة الاحترافية',
    en: 'Professional Calculator',
    fr: 'Calculatrice Professionnelle',
    de: 'Professioneller Rechner',
    es: 'Calculadora Profesional',
    tr: 'Profesyonel Hesap Makinesi',
    it: 'Calcolatrice Professionale',
    zh: '专业计算器',
    ru: 'Профессиональный калькулятор'
  },
  notificationsCenter: {
    ar: 'مركز الإشعارات والتنبيهات',
    en: 'Notifications & Alerts Center',
    fr: 'Centre de Notifications',
    de: 'Benachrichtigungszentrum',
    es: 'Centro de Notificaciones',
    tr: 'Bildirim Merkezi',
    it: 'Centro Notifiche',
    zh: '通知中心',
    ru: 'Центр уведомлений'
  },
  themeSelector: {
    ar: 'مظهر الألوان والثيمات',
    en: 'Themes & Color Schemes',
    fr: 'Thèmes & Couleurs',
    de: 'Themen & Farbschemata',
    es: 'Temas & Colores',
    tr: 'Temalar & Renk Şemaları',
    it: 'Temi & Colori',
    zh: '主题 & 配色',
    ru: 'Темы и цветовые схемы'
  },
  typography: {
    ar: 'تخصيص الخطوط وحجم الخط',
    en: 'Typography & Size Customization',
    fr: 'Typographie & Taille de Police',
    de: 'Typografie & Schriftgröße',
    es: 'Tipografía & Tamaño de Fuente',
    tr: 'Tipografi & Yazı Tipi Boyutu',
    it: 'Tipografia & Dimensione Font',
    zh: '字体 & 大小自定义',
    ru: 'Шрифт и размер текста'
  },
  backupsHistory: {
    ar: 'سجل النسخ الاحتياطي لقواعد البيانات',
    en: 'Database Backups History Log',
    fr: 'Historique des Sauvegardes de Base',
    de: 'Datenbank-Backup-Historie',
    es: 'Historial de Copias de Seguridad',
    tr: 'Veritabanı Yedekleme Geçmişi',
    it: 'Storico Backup Database',
    zh: '数据库备份历史记录',
    ru: 'История резервного копирования'
  }
};

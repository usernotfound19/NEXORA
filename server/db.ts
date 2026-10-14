import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import crypto from 'node:crypto';

// Initialize SQLite Database in the app root
const DB_PATH = path.resolve(process.cwd(), 'nexora.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high performance concurrent reads/writes
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Store settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Users (Admin and Customers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 3. Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      display_order INTEGER DEFAULT 0
    );
  `);

  // 4. Products
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      short_description TEXT,
      brand TEXT NOT NULL,
      model TEXT,
      sku TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL,
      supplier_cost REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL,
      original_price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'published',
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_trending INTEGER NOT NULL DEFAULT 0,
      primary_image TEXT NOT NULL,
      gallery_images TEXT NOT NULL DEFAULT '[]',
      specs TEXT NOT NULL DEFAULT '{}',
      variants TEXT NOT NULL DEFAULT '[]',
      warranty_info TEXT DEFAULT '1 Year Official Brand Warranty',
      sales_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 5. Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT NOT NULL,
      division TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL,
      postal_code TEXT,
      notes TEXT,
      subtotal REAL NOT NULL,
      shipping_fee REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      trx_id TEXT,
      order_status TEXT NOT NULL DEFAULT 'Order Placed',
      courier_name TEXT,
      tracking_number TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 6. Order Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_title TEXT NOT NULL,
      variant_label TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      product_image TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // 7. Reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      is_verified_purchase INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL
    );
  `);

  // 8. Coupons
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_amount REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      usage_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 9. Email Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL,
      provider_response TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 10. Audit Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);

  seedInitialData();
}

// Password hashing utility using Node's crypto
export function hashPassword(password: string, existingSalt?: string) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
}

function seedInitialData() {
  const now = new Date().toISOString();

  // 1. Initial Store Settings as specified in prompt
  const defaultSettings: Record<string, string> = {
    store_name: 'NEXORA TECH',
    direct_call_number: '01352313984',
    whatsapp_number: '01577215469',
    bkash_payment_number: '01577215469',
    nagad_payment_number: '01577215469',
    store_owner_email: 'tanjilur202@gmail.com',
    initial_admin_username: 'Kawshik',
    shipping_inside_dhaka: '70',
    shipping_outside_dhaka: '130',
    free_shipping_threshold: '5000',
    announcement_text: '⚡ NEXORA TECH Grand Launch: Free nationwide delivery on orders over ৳5,000! Authentic tech gadgets with official warranty.',
    bkash_instructions: 'Send money / payment to our Personal bKash number 01577215469. After sending, enter your 10-character Transaction ID (TrxID) below for verification.',
    nagad_instructions: 'Send money to our Personal Nagad number 01577215469. After sending, enter your Transaction ID (TrxID) below for instant verification.',
    resend_api_key: process.env.RESEND_API_KEY || '',
    email_from: 'NEXORA TECH <orders@nexoratech.com.bd>',
  };

  const getSetting = db.prepare('SELECT value FROM store_settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO store_settings (key, value, updated_at) VALUES (?, ?, ?)');

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = getSetting.get(key);
    if (!existing) {
      insertSetting.run(key, value, now);
    }
  }

  // 2. Initial Admin account "Kawshik"
  const checkAdmin = db.prepare("SELECT id FROM users WHERE username = ? OR role = 'admin'").get('Kawshik');
  if (!checkAdmin) {
    // Default initial admin password 'Kawshik@2026!'
    const { hash, salt } = hashPassword('Kawshik@2026!');
    db.prepare(`
      INSERT INTO users (id, username, email, phone, password_hash, salt, role, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'admin-kawshik',
      'Kawshik',
      'tanjilur202@gmail.com',
      '01352313984',
      hash,
      salt,
      'admin',
      'Kawshik (Founder & Administrator)',
      now,
      now
    );

    db.prepare('INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
      crypto.randomUUID(),
      'System',
      'INITIAL_ADMIN_SETUP',
      'Default admin user Kawshik created with username: Kawshik',
      now
    );
  }

  // 3. Initial Categories
  const checkCat = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (checkCat.count === 0) {
    const categories = [
      { id: 'cat-wearables', name: 'Smartwatches & Wearables', slug: 'smartwatches-wearables', icon: 'Watch', order: 1 },
      { id: 'cat-audio', name: 'Wireless Earbuds & Audio', slug: 'wireless-earbuds-audio', icon: 'Headphones', order: 2 },
      { id: 'cat-power', name: 'Power Banks & Chargers', slug: 'power-banks-chargers', icon: 'Zap', order: 3 },
      { id: 'cat-smartphones', name: 'Smartphones & Accessories', slug: 'smartphones-accessories', icon: 'Smartphone', order: 4 },
      { id: 'cat-gaming', name: 'Computer & Gaming Gear', slug: 'gaming-accessories', icon: 'Gamepad2', order: 5 },
      { id: 'cat-innovative', name: 'Innovative Everyday Gadgets', slug: 'innovative-gadgets', icon: 'Cpu', order: 6 },
    ];

    const insertCat = db.prepare('INSERT INTO categories (id, name, slug, description, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)');
    for (const c of categories) {
      insertCat.run(c.id, c.name, c.slug, `High-grade authentic ${c.name} with warranty`, c.icon, c.order);
    }
  }

  // 4. Initial Coupons
  const checkCoupon = db.prepare('SELECT COUNT(*) as count FROM coupons').get() as { count: number };
  if (checkCoupon.count === 0) {
    const insertCoupon = db.prepare('INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, is_active) VALUES (?, ?, ?, ?, ?, ?)');
    insertCoupon.run('cp-1', 'NEXORA10', 'percent', 10, 1500, 1);
    insertCoupon.run('cp-2', 'WELCOME500', 'fixed', 500, 4000, 1);
    insertCoupon.run('cp-3', 'RAMADAN2026', 'fixed', 300, 2500, 1);
  }

  // 5. Initial Sample Gadget Products using generated images
  const checkProd = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (checkProd.count === 0) {
    const sampleProducts = [
      {
        id: 'nxr-prod-01',
        title: 'Apex Titan Ultra Smartwatch (OLED Sapphire Glass)',
        slug: 'apex-titan-ultra-smartwatch',
        brand: 'ApexTech',
        model: 'AT-Ultra-2026',
        sku: 'NXR-WATCH-001',
        category_id: 'cat-wearables',
        supplier_cost: 3200,
        selling_price: 4850,
        original_price: 6500,
        stock_quantity: 42,
        is_featured: 1,
        is_trending: 1,
        primary_image: '/src/assets/images/product_smartwatch_ultra_1791985482803.jpg',
        gallery_images: JSON.stringify([
          '/src/assets/images/product_smartwatch_ultra_1791985482803.jpg',
          '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        ]),
        short_description: 'Military-grade titanium casing, Always-On AMOLED display, 14-day battery life, and comprehensive SpO2 / ECG sensors.',
        description: 'Engineered for endurance and luxury aesthetics, the Apex Titan Ultra combines aerospace titanium with a crystal-clear sapphire glass touch display. Features dual-frequency GPS, Bluetooth calling with noise reduction microphones, IP68 water resistance up to 50 meters, and comprehensive health monitoring tailored for active lifestyles in Bangladesh.',
        specs: JSON.stringify({
          'Display': '1.96" Super AMOLED 500 nits Peak Brightness',
          'Battery Life': 'Up to 14 Days Typical Usage',
          'Connectivity': 'Bluetooth 5.3 Low Energy + GPS',
          'Water Resistance': '5ATM / IP68 Certified',
          'Sensors': 'Optical Heart Rate, SpO2, Sleep Tracker, Barometer',
          'Compatibility': 'Android 8.0+ & iOS 12.0+'
        }),
        variants: JSON.stringify([
          { label: 'Color', options: ['Deep Navy Titanium', 'Stealth Charcoal', 'Silver Frost'] },
          { label: 'Strap', options: ['Fluoroelastomer Sport', 'Braided Alpine Loop'] }
        ]),
        warranty_info: '1 Year Brand Replacement Warranty',
        sales_count: 148
      },
      {
        id: 'nxr-prod-02',
        title: 'Kinetic Sound Pro ANC Wireless Earbuds (Spatial Audio)',
        slug: 'kinetic-sound-pro-anc-wireless-earbuds',
        brand: 'Kinetic Audio',
        model: 'KS-ANC-9',
        sku: 'NXR-AUDIO-002',
        category_id: 'cat-audio',
        supplier_cost: 2100,
        selling_price: 3450,
        original_price: 4500,
        stock_quantity: 65,
        is_featured: 1,
        is_trending: 1,
        primary_image: '/src/assets/images/product_earbuds_pro_1791985482766.jpg',
        gallery_images: JSON.stringify([
          '/src/assets/images/product_earbuds_pro_1791985482766.jpg',
          '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        ]),
        short_description: 'Active Noise Cancellation up to 45dB, 11mm dynamic drivers, low latency gaming mode, and 38-hour battery with charging case.',
        description: 'Immerse yourself in studio-grade fidelity. The Kinetic Sound Pro features advanced Hybrid Active Noise Cancellation, personalized transparency mode, and ultra-clear quad-mic beamforming technology for crystal clear telephone and WhatsApp calls even on noisy Dhaka streets.',
        specs: JSON.stringify({
          'Driver Unit': '11mm Liquid Crystal Polymer Drivers',
          'Noise Cancellation': 'Hybrid ANC up to -45dB',
          'Battery Playtime': '8.5 Hours Single Charge / 38 Hours with Case',
          'Charging': 'USB Type-C Fast Charge + Qi Wireless Charging',
          'Latency': '38ms Ultra-Low Latency Game Mode',
          'Codecs': 'LDAC, AAC, SBC'
        }),
        variants: JSON.stringify([
          { label: 'Color', options: ['Cobalt Blue & Matte Black', 'Obsidian Black', 'Pearl White'] }
        ]),
        warranty_info: '6 Months Replacement Warranty',
        sales_count: 220
      },
      {
        id: 'nxr-prod-03',
        title: 'Volt-Flow Cyber 30000mAh 100W PD Power Bank (OLED Display)',
        slug: 'volt-flow-cyber-30000mah-100w-power-bank',
        brand: 'VoltFlow',
        model: 'VF-CYBER-100W',
        sku: 'NXR-PWR-003',
        category_id: 'cat-power',
        supplier_cost: 3100,
        selling_price: 4690,
        original_price: 5800,
        stock_quantity: 38,
        is_featured: 1,
        is_trending: 1,
        primary_image: '/src/assets/images/product_powerbank_cyber_1791985483344.jpg',
        gallery_images: JSON.stringify([
          '/src/assets/images/product_powerbank_cyber_1791985483344.jpg',
        ]),
        short_description: 'Transparent cyberpunk aesthetic with real-time OLED volt/amp display, 100W dual-direction fast charge capable of charging laptops.',
        description: 'The pinnacle of portable power engineering. Built with automotive-grade cylindrical cells, real-time OLED status display showing voltage, amperage, remaining battery percentage and internal temperature. Powers MacBook Pro, Dell XPS, iPhone 16/15, Samsung Galaxy, and all USB-C devices at maximum speed.',
        specs: JSON.stringify({
          'Capacity': '30,000mAh / 111Wh Airline Approved',
          'Max Output': '100W Power Delivery 3.0 & QuickCharge 4+',
          'Ports': '2x USB-C (100W Max), 1x USB-A (22.5W)',
          'Display': 'Multi-Parameter Digital OLED Monitor',
          'Safety': '12-Layer Smart Temperature & Short Circuit Protection',
          'Recharge Time': '90 Minutes to 100% using 65W+ PD charger'
        }),
        variants: JSON.stringify([
          { label: 'Finish', options: ['Transparent Cyber Cyan', 'Smoked Obsidian'] }
        ]),
        warranty_info: '1 Year Comprehensive Warranty',
        sales_count: 95
      },
      {
        id: 'nxr-prod-04',
        title: 'AeroGlide Pro RGB Ergonomic Wireless Gaming Mouse',
        slug: 'aeroglide-pro-rgb-wireless-gaming-mouse',
        brand: 'AeroGlide',
        model: 'AG-980',
        sku: 'NXR-GAME-004',
        category_id: 'cat-gaming',
        supplier_cost: 1650,
        selling_price: 2690,
        original_price: 3500,
        stock_quantity: 50,
        is_featured: 0,
        is_trending: 1,
        primary_image: '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        gallery_images: JSON.stringify([
          '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        ]),
        short_description: 'Ultra-lightweight 58g honeycomb shell, 26,000 DPI optical sensor, optical switches, and tri-mode wireless connectivity.',
        description: 'Designed for esports professionals and competitive gaming. Features frictionless PTFE feet, 8000Hz polling rate support, Kailh optical switches rated for 90 million clicks, and customizable 16.8M color dynamic RGB edge lighting.',
        specs: JSON.stringify({
          'Sensor': 'PixArt PAW3395 26,000 DPI Optical',
          'Weight': '58 grams Ultra-lightweight',
          'Connectivity': '2.4GHz Wireless, Bluetooth 5.2, USB-C Paracord',
          'Battery Life': 'Up to 90 Hours Continuous Gameplay',
          'Switches': 'Optical Micro Switches (90M clicks lifespan)'
        }),
        variants: JSON.stringify([
          { label: 'Color', options: ['Matte Stealth Black', 'Arctic White'] }
        ]),
        warranty_info: '1 Year Warranty',
        sales_count: 84
      },
      {
        id: 'nxr-prod-05',
        title: 'MagCharge 3-in-1 Foldable Travel Wireless Charging Station',
        slug: 'magcharge-3-in-1-foldable-wireless-charger',
        brand: 'NexCharge',
        model: 'MC-TRIO-30',
        sku: 'NXR-CHG-005',
        category_id: 'cat-power',
        supplier_cost: 1400,
        selling_price: 2450,
        original_price: 3200,
        stock_quantity: 40,
        is_featured: 1,
        is_trending: 0,
        primary_image: '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        gallery_images: JSON.stringify([
          '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        ]),
        short_description: 'Simultaneously fast charges iPhone, Apple Watch, and AirPods. Compact magnetic folding design ideal for travel.',
        description: 'Eliminate cable clutter on your bedside table or workspace. This premium aluminum-accented charging station securely docks your smartphone, smartwatch, and wireless earbuds all at once with smart thermal dissipation.',
        specs: JSON.stringify({
          'Total Output': '25W Fast Wireless Charging',
          'Phone Pad': '15W MagSafe Compatible Qi2',
          'Watch Pad': '5W Magnetic Fast Charger',
          'Earbuds Pad': '5W Induction Plate',
          'Input': 'Type-C QC 3.0 / PD'
        }),
        variants: JSON.stringify([
          { label: 'Color', options: ['Space Gray', 'Starlight Silver'] }
        ]),
        warranty_info: '6 Months Warranty',
        sales_count: 112
      },
      {
        id: 'nxr-prod-06',
        title: 'Lumix Aura Smart Ambient Desk Light Bar (Music Sync)',
        slug: 'lumix-aura-smart-ambient-desk-light-bar',
        brand: 'Lumix',
        model: 'LX-AURA-SYNC',
        sku: 'NXR-LGT-006',
        category_id: 'cat-innovative',
        supplier_cost: 1200,
        selling_price: 2190,
        original_price: 2800,
        stock_quantity: 35,
        is_featured: 0,
        is_trending: 1,
        primary_image: '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        gallery_images: JSON.stringify([
          '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
        ]),
        short_description: 'Monitor-mounted or desktop ambient bar with built-in acoustic microphone, 32 animated lighting scenes, and smartphone app control.',
        description: 'Upgrade your workstation aesthetic. Responsive audio sensor reacts instantly to desktop speakers or music beats. Zero screen glare asymmetrical optical design protects eyes during late night coding and gaming sessions.',
        specs: JSON.stringify({
          'Light Source': '60 High-CRI Epistar LEDs',
          'Color Temp': '2700K - 6500K Tunable White + RGB',
          'Control': 'Touch Sensor + Bluetooth App',
          'Power': '5V/2A USB Powered'
        }),
        variants: JSON.stringify([
          { label: 'Length', options: ['45cm Curved Bar', 'Standard 38cm Bar'] }
        ]),
        warranty_info: '6 Months Warranty',
        sales_count: 67
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        id, title, slug, description, short_description, brand, model, sku,
        category_id, supplier_cost, selling_price, original_price, stock_quantity,
        status, is_featured, is_trending, primary_image, gallery_images,
        specs, variants, warranty_info, sales_count, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        'published', ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    for (const p of sampleProducts) {
      insertProd.run(
        p.id, p.title, p.slug, p.description, p.short_description, p.brand, p.model, p.sku,
        p.category_id, p.supplier_cost, p.selling_price, p.original_price, p.stock_quantity,
        p.is_featured, p.is_trending, p.primary_image, p.gallery_images,
        p.specs, p.variants, p.warranty_info, p.sales_count, now, now
      );
    }

    // Add genuine initial reviews
    const insertReview = db.prepare(`
      INSERT INTO reviews (id, product_id, customer_name, customer_phone, rating, comment, is_verified_purchase, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)
    `);

    insertReview.run('rev-1', 'nxr-prod-01', 'Tanvir Ahmed', '01711***482', 5, 'Exceptional build quality! The titanium casing feels premium and battery genuinely lasted 12 days on my heavy test.', 1, now);
    insertReview.run('rev-2', 'nxr-prod-01', 'Farhan Hossain', '01823***901', 5, 'Arrived in Dhanmondi within 24 hours via COD. Super clear Bluetooth calling during traffic.', 1, now);
    insertReview.run('rev-3', 'nxr-prod-02', 'Saiful Islam', '01912***345', 5, 'ANC is shockingly effective for this price point. Clean deep bass and snug fit.', 1, now);
    insertReview.run('rev-4', 'nxr-prod-03', 'Mahmudul Hasan', '01534***789', 5, 'Charges my MacBook Air at full 65W speed. The OLED screen showing real wattage is addictive to watch.', 1, now);
  }

  // 6. Add initial sample orders to showcase realistic analytics, tracking & status flows
  const checkOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (checkOrders.count === 0) {
    const sampleOrders = [
      {
        id: 'ord-10821',
        order_number: 'NXR-10821',
        customer_name: 'Sadman Rafid',
        customer_email: 'sadman.rafid@example.com',
        customer_phone: '01712345678',
        division: 'Dhaka',
        district: 'Dhaka - Mirpur',
        address: 'House 42, Road 11, Block D, Mirpur-12',
        postal_code: '1216',
        notes: 'Please call before delivery',
        subtotal: 4850,
        shipping_fee: 70,
        discount_amount: 0,
        total_amount: 4920,
        payment_method: 'Cash on Delivery',
        payment_status: 'pending',
        trx_id: null,
        order_status: 'Processing',
        courier_name: 'Steadfast Courier',
        tracking_number: 'ST-982310',
        admin_notes: 'Phone confirmed with customer. Packed and ready for dispatch.',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        items: [
          {
            product_id: 'nxr-prod-01',
            product_title: 'Apex Titan Ultra Smartwatch (OLED Sapphire Glass)',
            variant_label: 'Deep Navy Titanium',
            unit_price: 4850,
            quantity: 1,
            total_price: 4850,
            product_image: '/src/assets/images/product_smartwatch_ultra_1791985482803.jpg'
          }
        ]
      },
      {
        id: 'ord-10822',
        order_number: 'NXR-10822',
        customer_name: 'Anika Tabassum',
        customer_email: 'anika.t@example.com',
        customer_phone: '01898765432',
        division: 'Chittagong',
        district: 'Chittagong City',
        address: 'Apartment 4B, Nasirabad Housing Society',
        postal_code: '4000',
        notes: 'Deliver between 2 PM to 6 PM',
        subtotal: 3450,
        shipping_fee: 130,
        discount_amount: 345,
        total_amount: 3235,
        payment_method: 'bKash',
        payment_status: 'verified',
        trx_id: 'BL79A2X99P',
        order_status: 'Shipped',
        courier_name: 'RedX Logistics',
        tracking_number: 'RX-7712499',
        admin_notes: 'bKash TrxID verified by Kawshik.',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        items: [
          {
            product_id: 'nxr-prod-02',
            product_title: 'Kinetic Sound Pro ANC Wireless Earbuds (Spatial Audio)',
            variant_label: 'Cobalt Blue & Matte Black',
            unit_price: 3450,
            quantity: 1,
            total_price: 3450,
            product_image: '/src/assets/images/product_earbuds_pro_1791985482766.jpg'
          }
        ]
      },
      {
        id: 'ord-10823',
        order_number: 'NXR-10823',
        customer_name: 'Zubayer Hossain',
        customer_email: 'zubayer.h@example.com',
        customer_phone: '01911223344',
        division: 'Sylhet',
        district: 'Sylhet Sadar',
        address: 'Amberkhana Point, Shahi Eidgah Road',
        postal_code: '3100',
        notes: '',
        subtotal: 7140,
        shipping_fee: 0,
        discount_amount: 500,
        total_amount: 6640,
        payment_method: 'Nagad',
        payment_status: 'verified',
        trx_id: 'NG99182301',
        order_status: 'Delivered',
        courier_name: 'Paperfly',
        tracking_number: 'PF-449102',
        admin_notes: 'Successfully delivered and signed by recipient.',
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        items: [
          {
            product_id: 'nxr-prod-03',
            product_title: 'Volt-Flow Cyber 30000mAh 100W PD Power Bank (OLED Display)',
            variant_label: 'Transparent Cyber Cyan',
            unit_price: 4690,
            quantity: 1,
            total_price: 4690,
            product_image: '/src/assets/images/product_powerbank_cyber_1791985483344.jpg'
          },
          {
            product_id: 'nxr-prod-05',
            product_title: 'MagCharge 3-in-1 Foldable Travel Wireless Charging Station',
            variant_label: 'Space Gray',
            unit_price: 2450,
            quantity: 1,
            total_price: 2450,
            product_image: '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg'
          }
        ]
      }
    ];

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_email, customer_phone,
        division, district, address, postal_code, notes,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, trx_id, order_status,
        courier_name, tracking_number, admin_notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_title, variant_label,
        unit_price, quantity, total_price, product_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of sampleOrders) {
      insertOrder.run(
        o.id, o.order_number, o.customer_name, o.customer_email, o.customer_phone,
        o.division, o.district, o.address, o.postal_code, o.notes,
        o.subtotal, o.shipping_fee, o.discount_amount, o.total_amount,
        o.payment_method, o.payment_status, o.trx_id, o.order_status,
        o.courier_name, o.tracking_number, o.admin_notes, o.created_at, o.created_at
      );

      for (const item of o.items) {
        insertItem.run(
          crypto.randomUUID(),
          o.id,
          item.product_id,
          item.product_title,
          item.variant_label,
          item.unit_price,
          item.quantity,
          item.total_price,
          item.product_image
        );
      }
    }
  }
}

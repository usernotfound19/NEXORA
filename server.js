// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path2 from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// server/db.ts
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import crypto from "node:crypto";
var DB_PATH = path.resolve(process.cwd(), "nexora.sqlite");
var db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
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
function hashPassword(password, existingSalt) {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  const checkHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(checkHash, "hex"));
}
function seedInitialData() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const defaultSettings = {
    store_name: "NEXORA TECH",
    direct_call_number: "01352313984",
    whatsapp_number: "01577215469",
    bkash_payment_number: "01577215469",
    nagad_payment_number: "01577215469",
    store_owner_email: "tanjilur202@gmail.com",
    initial_admin_username: "Kawshik",
    shipping_inside_dhaka: "70",
    shipping_outside_dhaka: "130",
    free_shipping_threshold: "5000",
    announcement_text: "\u26A1 NEXORA TECH Grand Launch: Free nationwide delivery on orders over \u09F35,000! Authentic tech gadgets with official warranty.",
    bkash_instructions: "Send money / payment to our Personal bKash number 01577215469. After sending, enter your 10-character Transaction ID (TrxID) below for verification.",
    nagad_instructions: "Send money to our Personal Nagad number 01577215469. After sending, enter your Transaction ID (TrxID) below for instant verification.",
    resend_api_key: process.env.RESEND_API_KEY || "",
    email_from: "NEXORA TECH <orders@nexoratech.com.bd>"
  };
  const getSetting = db.prepare("SELECT value FROM store_settings WHERE key = ?");
  const insertSetting = db.prepare("INSERT INTO store_settings (key, value, updated_at) VALUES (?, ?, ?)");
  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = getSetting.get(key);
    if (!existing) {
      insertSetting.run(key, value, now);
    }
  }
  const checkAdmin = db.prepare("SELECT id FROM users WHERE username = ? OR role = 'admin'").get("Kawshik");
  if (!checkAdmin) {
    const { hash, salt } = hashPassword("Kawshik@2026!");
    db.prepare(`
      INSERT INTO users (id, username, email, phone, password_hash, salt, role, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "admin-kawshik",
      "Kawshik",
      "tanjilur202@gmail.com",
      "01352313984",
      hash,
      salt,
      "admin",
      "Kawshik (Founder & Administrator)",
      now,
      now
    );
    db.prepare("INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
      crypto.randomUUID(),
      "System",
      "INITIAL_ADMIN_SETUP",
      "Default admin user Kawshik created with username: Kawshik",
      now
    );
  }
  const checkCat = db.prepare("SELECT COUNT(*) as count FROM categories").get();
  if (checkCat.count === 0) {
    const categories = [
      { id: "cat-wearables", name: "Smartwatches & Wearables", slug: "smartwatches-wearables", icon: "Watch", order: 1 },
      { id: "cat-audio", name: "Wireless Earbuds & Audio", slug: "wireless-earbuds-audio", icon: "Headphones", order: 2 },
      { id: "cat-power", name: "Power Banks & Chargers", slug: "power-banks-chargers", icon: "Zap", order: 3 },
      { id: "cat-smartphones", name: "Smartphones & Accessories", slug: "smartphones-accessories", icon: "Smartphone", order: 4 },
      { id: "cat-gaming", name: "Computer & Gaming Gear", slug: "gaming-accessories", icon: "Gamepad2", order: 5 },
      { id: "cat-innovative", name: "Innovative Everyday Gadgets", slug: "innovative-gadgets", icon: "Cpu", order: 6 }
    ];
    const insertCat = db.prepare("INSERT INTO categories (id, name, slug, description, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)");
    for (const c of categories) {
      insertCat.run(c.id, c.name, c.slug, `High-grade authentic ${c.name} with warranty`, c.icon, c.order);
    }
  }
  const checkCoupon = db.prepare("SELECT COUNT(*) as count FROM coupons").get();
  if (checkCoupon.count === 0) {
    const insertCoupon = db.prepare("INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, is_active) VALUES (?, ?, ?, ?, ?, ?)");
    insertCoupon.run("cp-1", "NEXORA10", "percent", 10, 1500, 1);
    insertCoupon.run("cp-2", "WELCOME500", "fixed", 500, 4e3, 1);
    insertCoupon.run("cp-3", "RAMADAN2026", "fixed", 300, 2500, 1);
  }
  const checkProd = db.prepare("SELECT COUNT(*) as count FROM products").get();
  if (checkProd.count === 0) {
    const sampleProducts = [
      {
        id: "nxr-prod-01",
        title: "Apex Titan Ultra Smartwatch (OLED Sapphire Glass)",
        slug: "apex-titan-ultra-smartwatch",
        brand: "ApexTech",
        model: "AT-Ultra-2026",
        sku: "NXR-WATCH-001",
        category_id: "cat-wearables",
        supplier_cost: 3200,
        selling_price: 4850,
        original_price: 6500,
        stock_quantity: 42,
        is_featured: 1,
        is_trending: 1,
        primary_image: "/src/assets/images/product_smartwatch_ultra_1791985482803.jpg",
        gallery_images: JSON.stringify([
          "/src/assets/images/product_smartwatch_ultra_1791985482803.jpg",
          "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg"
        ]),
        short_description: "Military-grade titanium casing, Always-On AMOLED display, 14-day battery life, and comprehensive SpO2 / ECG sensors.",
        description: "Engineered for endurance and luxury aesthetics, the Apex Titan Ultra combines aerospace titanium with a crystal-clear sapphire glass touch display. Features dual-frequency GPS, Bluetooth calling with noise reduction microphones, IP68 water resistance up to 50 meters, and comprehensive health monitoring tailored for active lifestyles in Bangladesh.",
        specs: JSON.stringify({
          "Display": '1.96" Super AMOLED 500 nits Peak Brightness',
          "Battery Life": "Up to 14 Days Typical Usage",
          "Connectivity": "Bluetooth 5.3 Low Energy + GPS",
          "Water Resistance": "5ATM / IP68 Certified",
          "Sensors": "Optical Heart Rate, SpO2, Sleep Tracker, Barometer",
          "Compatibility": "Android 8.0+ & iOS 12.0+"
        }),
        variants: JSON.stringify([
          { label: "Color", options: ["Deep Navy Titanium", "Stealth Charcoal", "Silver Frost"] },
          { label: "Strap", options: ["Fluoroelastomer Sport", "Braided Alpine Loop"] }
        ]),
        warranty_info: "1 Year Brand Replacement Warranty",
        sales_count: 148
      },
      {
        id: "nxr-prod-02",
        title: "Kinetic Sound Pro ANC Wireless Earbuds (Spatial Audio)",
        slug: "kinetic-sound-pro-anc-wireless-earbuds",
        brand: "Kinetic Audio",
        model: "KS-ANC-9",
        sku: "NXR-AUDIO-002",
        category_id: "cat-audio",
        supplier_cost: 2100,
        selling_price: 3450,
        original_price: 4500,
        stock_quantity: 65,
        is_featured: 1,
        is_trending: 1,
        primary_image: "/src/assets/images/product_earbuds_pro_1791985482766.jpg",
        gallery_images: JSON.stringify([
          "/src/assets/images/product_earbuds_pro_1791985482766.jpg",
          "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg"
        ]),
        short_description: "Active Noise Cancellation up to 45dB, 11mm dynamic drivers, low latency gaming mode, and 38-hour battery with charging case.",
        description: "Immerse yourself in studio-grade fidelity. The Kinetic Sound Pro features advanced Hybrid Active Noise Cancellation, personalized transparency mode, and ultra-clear quad-mic beamforming technology for crystal clear telephone and WhatsApp calls even on noisy Dhaka streets.",
        specs: JSON.stringify({
          "Driver Unit": "11mm Liquid Crystal Polymer Drivers",
          "Noise Cancellation": "Hybrid ANC up to -45dB",
          "Battery Playtime": "8.5 Hours Single Charge / 38 Hours with Case",
          "Charging": "USB Type-C Fast Charge + Qi Wireless Charging",
          "Latency": "38ms Ultra-Low Latency Game Mode",
          "Codecs": "LDAC, AAC, SBC"
        }),
        variants: JSON.stringify([
          { label: "Color", options: ["Cobalt Blue & Matte Black", "Obsidian Black", "Pearl White"] }
        ]),
        warranty_info: "6 Months Replacement Warranty",
        sales_count: 220
      },
      {
        id: "nxr-prod-03",
        title: "Volt-Flow Cyber 30000mAh 100W PD Power Bank (OLED Display)",
        slug: "volt-flow-cyber-30000mah-100w-power-bank",
        brand: "VoltFlow",
        model: "VF-CYBER-100W",
        sku: "NXR-PWR-003",
        category_id: "cat-power",
        supplier_cost: 3100,
        selling_price: 4690,
        original_price: 5800,
        stock_quantity: 38,
        is_featured: 1,
        is_trending: 1,
        primary_image: "/src/assets/images/product_powerbank_cyber_1791985483344.jpg",
        gallery_images: JSON.stringify([
          "/src/assets/images/product_powerbank_cyber_1791985483344.jpg"
        ]),
        short_description: "Transparent cyberpunk aesthetic with real-time OLED volt/amp display, 100W dual-direction fast charge capable of charging laptops.",
        description: "The pinnacle of portable power engineering. Built with automotive-grade cylindrical cells, real-time OLED status display showing voltage, amperage, remaining battery percentage and internal temperature. Powers MacBook Pro, Dell XPS, iPhone 16/15, Samsung Galaxy, and all USB-C devices at maximum speed.",
        specs: JSON.stringify({
          "Capacity": "30,000mAh / 111Wh Airline Approved",
          "Max Output": "100W Power Delivery 3.0 & QuickCharge 4+",
          "Ports": "2x USB-C (100W Max), 1x USB-A (22.5W)",
          "Display": "Multi-Parameter Digital OLED Monitor",
          "Safety": "12-Layer Smart Temperature & Short Circuit Protection",
          "Recharge Time": "90 Minutes to 100% using 65W+ PD charger"
        }),
        variants: JSON.stringify([
          { label: "Finish", options: ["Transparent Cyber Cyan", "Smoked Obsidian"] }
        ]),
        warranty_info: "1 Year Comprehensive Warranty",
        sales_count: 95
      },
      {
        id: "nxr-prod-04",
        title: "AeroGlide Pro RGB Ergonomic Wireless Gaming Mouse",
        slug: "aeroglide-pro-rgb-wireless-gaming-mouse",
        brand: "AeroGlide",
        model: "AG-980",
        sku: "NXR-GAME-004",
        category_id: "cat-gaming",
        supplier_cost: 1650,
        selling_price: 2690,
        original_price: 3500,
        stock_quantity: 50,
        is_featured: 0,
        is_trending: 1,
        primary_image: "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg",
        gallery_images: JSON.stringify([
          "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg"
        ]),
        short_description: "Ultra-lightweight 58g honeycomb shell, 26,000 DPI optical sensor, optical switches, and tri-mode wireless connectivity.",
        description: "Designed for esports professionals and competitive gaming. Features frictionless PTFE feet, 8000Hz polling rate support, Kailh optical switches rated for 90 million clicks, and customizable 16.8M color dynamic RGB edge lighting.",
        specs: JSON.stringify({
          "Sensor": "PixArt PAW3395 26,000 DPI Optical",
          "Weight": "58 grams Ultra-lightweight",
          "Connectivity": "2.4GHz Wireless, Bluetooth 5.2, USB-C Paracord",
          "Battery Life": "Up to 90 Hours Continuous Gameplay",
          "Switches": "Optical Micro Switches (90M clicks lifespan)"
        }),
        variants: JSON.stringify([
          { label: "Color", options: ["Matte Stealth Black", "Arctic White"] }
        ]),
        warranty_info: "1 Year Warranty",
        sales_count: 84
      },
      {
        id: "nxr-prod-05",
        title: "MagCharge 3-in-1 Foldable Travel Wireless Charging Station",
        slug: "magcharge-3-in-1-foldable-wireless-charger",
        brand: "NexCharge",
        model: "MC-TRIO-30",
        sku: "NXR-CHG-005",
        category_id: "cat-power",
        supplier_cost: 1400,
        selling_price: 2450,
        original_price: 3200,
        stock_quantity: 40,
        is_featured: 1,
        is_trending: 0,
        primary_image: "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg",
        gallery_images: JSON.stringify([
          "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg"
        ]),
        short_description: "Simultaneously fast charges iPhone, Apple Watch, and AirPods. Compact magnetic folding design ideal for travel.",
        description: "Eliminate cable clutter on your bedside table or workspace. This premium aluminum-accented charging station securely docks your smartphone, smartwatch, and wireless earbuds all at once with smart thermal dissipation.",
        specs: JSON.stringify({
          "Total Output": "25W Fast Wireless Charging",
          "Phone Pad": "15W MagSafe Compatible Qi2",
          "Watch Pad": "5W Magnetic Fast Charger",
          "Earbuds Pad": "5W Induction Plate",
          "Input": "Type-C QC 3.0 / PD"
        }),
        variants: JSON.stringify([
          { label: "Color", options: ["Space Gray", "Starlight Silver"] }
        ]),
        warranty_info: "6 Months Warranty",
        sales_count: 112
      },
      {
        id: "nxr-prod-06",
        title: "Lumix Aura Smart Ambient Desk Light Bar (Music Sync)",
        slug: "lumix-aura-smart-ambient-desk-light-bar",
        brand: "Lumix",
        model: "LX-AURA-SYNC",
        sku: "NXR-LGT-006",
        category_id: "cat-innovative",
        supplier_cost: 1200,
        selling_price: 2190,
        original_price: 2800,
        stock_quantity: 35,
        is_featured: 0,
        is_trending: 1,
        primary_image: "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg",
        gallery_images: JSON.stringify([
          "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg"
        ]),
        short_description: "Monitor-mounted or desktop ambient bar with built-in acoustic microphone, 32 animated lighting scenes, and smartphone app control.",
        description: "Upgrade your workstation aesthetic. Responsive audio sensor reacts instantly to desktop speakers or music beats. Zero screen glare asymmetrical optical design protects eyes during late night coding and gaming sessions.",
        specs: JSON.stringify({
          "Light Source": "60 High-CRI Epistar LEDs",
          "Color Temp": "2700K - 6500K Tunable White + RGB",
          "Control": "Touch Sensor + Bluetooth App",
          "Power": "5V/2A USB Powered"
        }),
        variants: JSON.stringify([
          { label: "Length", options: ["45cm Curved Bar", "Standard 38cm Bar"] }
        ]),
        warranty_info: "6 Months Warranty",
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
        p.id,
        p.title,
        p.slug,
        p.description,
        p.short_description,
        p.brand,
        p.model,
        p.sku,
        p.category_id,
        p.supplier_cost,
        p.selling_price,
        p.original_price,
        p.stock_quantity,
        p.is_featured,
        p.is_trending,
        p.primary_image,
        p.gallery_images,
        p.specs,
        p.variants,
        p.warranty_info,
        p.sales_count,
        now,
        now
      );
    }
    const insertReview = db.prepare(`
      INSERT INTO reviews (id, product_id, customer_name, customer_phone, rating, comment, is_verified_purchase, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)
    `);
    insertReview.run("rev-1", "nxr-prod-01", "Tanvir Ahmed", "01711***482", 5, "Exceptional build quality! The titanium casing feels premium and battery genuinely lasted 12 days on my heavy test.", 1, now);
    insertReview.run("rev-2", "nxr-prod-01", "Farhan Hossain", "01823***901", 5, "Arrived in Dhanmondi within 24 hours via COD. Super clear Bluetooth calling during traffic.", 1, now);
    insertReview.run("rev-3", "nxr-prod-02", "Saiful Islam", "01912***345", 5, "ANC is shockingly effective for this price point. Clean deep bass and snug fit.", 1, now);
    insertReview.run("rev-4", "nxr-prod-03", "Mahmudul Hasan", "01534***789", 5, "Charges my MacBook Air at full 65W speed. The OLED screen showing real wattage is addictive to watch.", 1, now);
  }
  const checkOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get();
  if (checkOrders.count === 0) {
    const sampleOrders = [
      {
        id: "ord-10821",
        order_number: "NXR-10821",
        customer_name: "Sadman Rafid",
        customer_email: "sadman.rafid@example.com",
        customer_phone: "01712345678",
        division: "Dhaka",
        district: "Dhaka - Mirpur",
        address: "House 42, Road 11, Block D, Mirpur-12",
        postal_code: "1216",
        notes: "Please call before delivery",
        subtotal: 4850,
        shipping_fee: 70,
        discount_amount: 0,
        total_amount: 4920,
        payment_method: "Cash on Delivery",
        payment_status: "pending",
        trx_id: null,
        order_status: "Processing",
        courier_name: "Steadfast Courier",
        tracking_number: "ST-982310",
        admin_notes: "Phone confirmed with customer. Packed and ready for dispatch.",
        created_at: new Date(Date.now() - 36e5 * 5).toISOString(),
        items: [
          {
            product_id: "nxr-prod-01",
            product_title: "Apex Titan Ultra Smartwatch (OLED Sapphire Glass)",
            variant_label: "Deep Navy Titanium",
            unit_price: 4850,
            quantity: 1,
            total_price: 4850,
            product_image: "/src/assets/images/product_smartwatch_ultra_1791985482803.jpg"
          }
        ]
      },
      {
        id: "ord-10822",
        order_number: "NXR-10822",
        customer_name: "Anika Tabassum",
        customer_email: "anika.t@example.com",
        customer_phone: "01898765432",
        division: "Chittagong",
        district: "Chittagong City",
        address: "Apartment 4B, Nasirabad Housing Society",
        postal_code: "4000",
        notes: "Deliver between 2 PM to 6 PM",
        subtotal: 3450,
        shipping_fee: 130,
        discount_amount: 345,
        total_amount: 3235,
        payment_method: "bKash",
        payment_status: "verified",
        trx_id: "BL79A2X99P",
        order_status: "Shipped",
        courier_name: "RedX Logistics",
        tracking_number: "RX-7712499",
        admin_notes: "bKash TrxID verified by Kawshik.",
        created_at: new Date(Date.now() - 36e5 * 24).toISOString(),
        items: [
          {
            product_id: "nxr-prod-02",
            product_title: "Kinetic Sound Pro ANC Wireless Earbuds (Spatial Audio)",
            variant_label: "Cobalt Blue & Matte Black",
            unit_price: 3450,
            quantity: 1,
            total_price: 3450,
            product_image: "/src/assets/images/product_earbuds_pro_1791985482766.jpg"
          }
        ]
      },
      {
        id: "ord-10823",
        order_number: "NXR-10823",
        customer_name: "Zubayer Hossain",
        customer_email: "zubayer.h@example.com",
        customer_phone: "01911223344",
        division: "Sylhet",
        district: "Sylhet Sadar",
        address: "Amberkhana Point, Shahi Eidgah Road",
        postal_code: "3100",
        notes: "",
        subtotal: 7140,
        shipping_fee: 0,
        discount_amount: 500,
        total_amount: 6640,
        payment_method: "Nagad",
        payment_status: "verified",
        trx_id: "NG99182301",
        order_status: "Delivered",
        courier_name: "Paperfly",
        tracking_number: "PF-449102",
        admin_notes: "Successfully delivered and signed by recipient.",
        created_at: new Date(Date.now() - 36e5 * 72).toISOString(),
        items: [
          {
            product_id: "nxr-prod-03",
            product_title: "Volt-Flow Cyber 30000mAh 100W PD Power Bank (OLED Display)",
            variant_label: "Transparent Cyber Cyan",
            unit_price: 4690,
            quantity: 1,
            total_price: 4690,
            product_image: "/src/assets/images/product_powerbank_cyber_1791985483344.jpg"
          },
          {
            product_id: "nxr-prod-05",
            product_title: "MagCharge 3-in-1 Foldable Travel Wireless Charging Station",
            variant_label: "Space Gray",
            unit_price: 2450,
            quantity: 1,
            total_price: 2450,
            product_image: "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg"
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
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.division,
        o.district,
        o.address,
        o.postal_code,
        o.notes,
        o.subtotal,
        o.shipping_fee,
        o.discount_amount,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.trx_id,
        o.order_status,
        o.courier_name,
        o.tracking_number,
        o.admin_notes,
        o.created_at,
        o.created_at
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

// server/routes.ts
import { Router } from "express";

// server/email.ts
import crypto2 from "node:crypto";
async function sendOrderNotifications(order, orderId) {
  const settingsRows = db.prepare("SELECT key, value FROM store_settings").all();
  const settings = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }
  const storeOwnerEmail = settings.store_owner_email || "tanjilur202@gmail.com";
  const apiKey = process.env.RESEND_API_KEY || settings.resend_api_key || "";
  const fromEmail = settings.email_from || "NEXORA TECH <onboarding@resend.dev>";
  const fmt = (n) => `\u09F3${Number(n).toLocaleString("en-BD")}`;
  const itemsTableHtml = order.items.map((item) => `
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 10px 0; color: #f8fafc; font-weight: 500;">
        ${item.title}
        ${item.variant ? `<br><span style="font-size: 12px; color: #94a3b8;">Variant: ${item.variant}</span>` : ""}
      </td>
      <td style="padding: 10px 0; text-align: center; color: #94a3b8;">${item.quantity}</td>
      <td style="padding: 10px 0; text-align: right; color: #94a3b8;">${fmt(item.price)}</td>
      <td style="padding: 10px 0; text-align: right; color: #38bdf8; font-weight: 600;">${fmt(item.total)}</td>
    </tr>
  `).join("");
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order ${order.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b101b; color: #e2e8f0; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; padding: 32px;">
        <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; font-size: 24px; margin: 0 0 6px 0; letter-spacing: -0.5px;">NEXORA TECH</h1>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">\u{1F6A8} New Order Received \u2014 <strong>#${order.orderNumber}</strong></p>
        </div>

        <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8;">Customer &amp; Shipping Details</h3>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Customer:</strong> ${order.customerName}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Direct Phone:</strong> <a href="tel:${order.customerPhone}" style="color: #38bdf8; text-decoration: none;">${order.customerPhone}</a></p>
          ${order.customerEmail ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${order.customerEmail}</p>` : ""}
          <p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${order.district}, ${order.division} ${order.postalCode ? `(${order.postalCode})` : ""}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Delivery Address:</strong> ${order.address}</p>
          ${order.notes ? `<p style="margin: 4px 0; font-size: 14px; color: #fbbf24;"><strong>Customer Notes:</strong> ${order.notes}</p>` : ""}
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 1px solid #334155; text-align: left; color: #64748b; font-size: 12px;">
                <th style="padding-bottom: 8px;">Product</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Price</th>
                <th style="padding-bottom: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTableHtml}
            </tbody>
          </table>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 16px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="color: #94a3b8; padding: 4px 0;">Subtotal</td><td style="text-align: right; color: #f8fafc;">${fmt(order.subtotal)}</td></tr>
            <tr><td style="color: #94a3b8; padding: 4px 0;">Shipping Fee</td><td style="text-align: right; color: #f8fafc;">${fmt(order.shippingFee)}</td></tr>
            ${order.discount > 0 ? `<tr><td style="color: #34d399; padding: 4px 0;">Discount</td><td style="text-align: right; color: #34d399;">-${fmt(order.discount)}</td></tr>` : ""}
            <tr style="border-top: 1px solid #334155; font-size: 16px; font-weight: bold;">
              <td style="color: #f8fafc; padding: 8px 0;">Final Payable Total</td>
              <td style="text-align: right; color: #38bdf8;">${fmt(order.total)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #111827; border-left: 3px solid #38bdf8; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 13px;">
          <p style="margin: 2px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p style="margin: 2px 0;"><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
          ${order.trxId ? `<p style="margin: 2px 0;"><strong>Transaction ID (TrxID):</strong> <span style="font-family: monospace; color: #38bdf8;">${order.trxId}</span></p>` : ""}
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="/admin" style="background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Open in Admin Dashboard
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
  let ownerResult = { success: false, message: "" };
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: storeOwnerEmail,
          subject: `New Order Received \u2014 #${order.orderNumber}`,
          html: adminHtml
        })
      });
      const data = await res.json();
      if (res.ok) {
        ownerResult = { success: true, message: `Email delivered to ${storeOwnerEmail} (ID: ${data.id})`, response: data };
      } else {
        ownerResult = { success: false, message: `Resend API Error: ${data.message || res.statusText}`, response: data };
      }
    } catch (err) {
      ownerResult = { success: false, message: `Network/Dispatch Error: ${err.message}` };
    }
  } else {
    ownerResult = {
      success: false,
      message: `Transactional email ready: RESEND_API_KEY is not configured yet in .env or Admin Settings. Configured recipient: ${storeOwnerEmail}. Email payload verified and archived in email_logs.`
    };
  }
  db.prepare(`
    INSERT INTO email_logs (id, order_id, recipient, subject, status, provider_response, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto2.randomUUID(),
    orderId,
    storeOwnerEmail,
    `New Order Received \u2014 #${order.orderNumber}`,
    ownerResult.success ? "sent" : "logged_ready",
    JSON.stringify(ownerResult),
    (/* @__PURE__ */ new Date()).toISOString()
  );
  if (order.customerEmail) {
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b101b; color: #e2e8f0; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 32px;">
          <h2 style="color: #38bdf8; margin: 0 0 8px 0;">Order Confirmed!</h2>
          <p>Dear ${order.customerName},</p>
          <p>Thank you for shopping at <strong>NEXORA TECH</strong>. Your order <strong>#${order.orderNumber}</strong> has been received and is being prepared.</p>
          <p><strong>Payable Total:</strong> ${fmt(order.total)} (${order.paymentMethod})</p>
          <p>You can track your parcel live anytime on our website using your order number and phone number: <strong>${order.customerPhone}</strong>.</p>
          <p>Need instant assistance? Contact our helpline at <strong>${settings.direct_call_number || "01352313984"}</strong> or WhatsApp at <strong>${settings.whatsapp_number || "01577215469"}</strong>.</p>
        </div>
      </body>
      </html>
    `;
    if (apiKey) {
      try {
        const custRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: order.customerEmail,
            subject: `Order Confirmation \u2014 #${order.orderNumber} | NEXORA TECH`,
            html: customerHtml
          })
        });
        const custData = await custRes.json();
        db.prepare(`
          INSERT INTO email_logs (id, order_id, recipient, subject, status, provider_response, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto2.randomUUID(),
          orderId,
          order.customerEmail,
          `Order Confirmation \u2014 #${order.orderNumber}`,
          custRes.ok ? "sent" : "failed",
          JSON.stringify(custData),
          (/* @__PURE__ */ new Date()).toISOString()
        );
      } catch (e) {
        db.prepare(`
          INSERT INTO email_logs (id, order_id, recipient, subject, status, provider_response, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto2.randomUUID(),
          orderId,
          order.customerEmail,
          `Order Confirmation \u2014 #${order.orderNumber}`,
          "error",
          e.message,
          (/* @__PURE__ */ new Date()).toISOString()
        );
      }
    }
  }
  return ownerResult;
}

// server/routes.ts
import crypto3 from "node:crypto";
var apiRouter = Router();
var SESSIONS = /* @__PURE__ */ new Map();
function createSession(user) {
  const token = crypto3.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1e3;
  SESSIONS.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt
  });
  return token;
}
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const session = SESSIONS.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) SESSIONS.delete(token);
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
  if (session.role !== "admin") {
    return res.status(403).json({ error: "Administrator privilege required" });
  }
  req.user = session;
  next();
}
apiRouter.get("/settings", (req, res) => {
  const rows = db.prepare("SELECT key, value FROM store_settings").all();
  const settings = {};
  for (const row of rows) {
    if (row.key !== "resend_api_key") {
      settings[row.key] = row.value;
    }
  }
  res.json({ success: true, settings });
});
apiRouter.get("/categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM categories ORDER BY display_order ASC").all();
  res.json({ success: true, categories });
});
apiRouter.get("/products", (req, res) => {
  const { category, brand, search, minPrice, maxPrice, inStock, sort, featured, trending } = req.query;
  let query = "SELECT * FROM products WHERE status = 'published'";
  const params = [];
  if (category) {
    query += " AND category_id = ?";
    params.push(category);
  }
  if (brand) {
    query += " AND brand = ?";
    params.push(brand);
  }
  if (search) {
    query += " AND (title LIKE ? OR description LIKE ? OR brand LIKE ? OR sku LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (minPrice) {
    query += " AND selling_price >= ?";
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    query += " AND selling_price <= ?";
    params.push(Number(maxPrice));
  }
  if (inStock === "true") {
    query += " AND stock_quantity > 0";
  }
  if (featured === "true") {
    query += " AND is_featured = 1";
  }
  if (trending === "true") {
    query += " AND is_trending = 1";
  }
  switch (sort) {
    case "price_low_high":
      query += " ORDER BY selling_price ASC";
      break;
    case "price_high_low":
      query += " ORDER BY selling_price DESC";
      break;
    case "newest":
      query += " ORDER BY created_at DESC";
      break;
    case "bestselling":
      query += " ORDER BY sales_count DESC";
      break;
    default:
      query += " ORDER BY is_featured DESC, sales_count DESC, created_at DESC";
  }
  const products = db.prepare(query).all(...params).map((p) => ({
    ...p,
    gallery_images: JSON.parse(p.gallery_images || "[]"),
    specs: JSON.parse(p.specs || "{}"),
    variants: JSON.parse(p.variants || "[]")
  }));
  res.json({ success: true, products, count: products.length });
});
apiRouter.get("/products/:identifier", (req, res) => {
  const { identifier } = req.params;
  const product = db.prepare("SELECT * FROM products WHERE (id = ? OR slug = ?) AND status = ?").get(identifier, identifier, "published");
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  const reviews = db.prepare("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC").all(product.id);
  const related = db.prepare("SELECT * FROM products WHERE category_id = ? AND id != ? AND status = 'published' LIMIT 4").all(product.category_id, product.id).map((p) => ({
    ...p,
    gallery_images: JSON.parse(p.gallery_images || "[]"),
    specs: JSON.parse(p.specs || "{}"),
    variants: JSON.parse(p.variants || "[]")
  }));
  res.json({
    success: true,
    product: {
      ...product,
      gallery_images: JSON.parse(product.gallery_images || "[]"),
      specs: JSON.parse(product.specs || "{}"),
      variants: JSON.parse(product.variants || "[]")
    },
    reviews,
    related
  });
});
apiRouter.post("/coupons/validate", (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code is required" });
  }
  const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1").get(code.toUpperCase().trim());
  if (!coupon) {
    return res.status(404).json({ error: "Invalid or expired coupon code" });
  }
  const subtotal = Number(orderAmount) || 0;
  if (subtotal < coupon.min_order_amount) {
    return res.status(400).json({
      error: `Minimum order amount for coupon ${coupon.code} is \u09F3${coupon.min_order_amount}`
    });
  }
  let discount = 0;
  if (coupon.discount_type === "percent") {
    discount = Math.round(subtotal * coupon.discount_value / 100);
  } else {
    discount = coupon.discount_value;
  }
  discount = Math.min(discount, subtotal);
  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      calculated_discount: discount
    }
  });
});
apiRouter.post("/reviews", (req, res) => {
  const { productId, customerName, customerPhone, rating, comment } = req.body;
  if (!productId || !customerName || !rating || !comment) {
    return res.status(400).json({ error: "Missing required review fields" });
  }
  const numRating = Math.max(1, Math.min(5, Number(rating)));
  const reviewId = crypto3.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT INTO reviews (id, product_id, customer_name, customer_phone, rating, comment, is_verified_purchase, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'approved', ?)
  `).run(reviewId, productId, customerName.trim(), customerPhone || "", numRating, comment.trim(), now);
  res.json({ success: true, message: "Review submitted successfully", reviewId });
});
apiRouter.post("/orders", async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    division,
    district,
    address,
    postalCode,
    notes,
    items,
    paymentMethod,
    trxId,
    couponCode
  } = req.body;
  if (!customerName || !customerPhone || !division || !district || !address || !items || !items.length || !paymentMethod) {
    return res.status(400).json({ error: "Please provide all required shipping and order details." });
  }
  const cleanPhone = customerPhone.replace(/\s+/g, "").replace(/-/g, "");
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: "Please enter a valid 11-digit Bangladesh mobile number (e.g., 01712345678)." });
  }
  const settingsRows = db.prepare("SELECT key, value FROM store_settings").all();
  const settings = {};
  for (const s of settingsRows) settings[s.key] = s.value;
  const shippingInside = Number(settings.shipping_inside_dhaka || 70);
  const shippingOutside = Number(settings.shipping_outside_dhaka || 130);
  const freeThreshold = Number(settings.free_shipping_threshold || 5e3);
  let subtotal = 0;
  const verifiedItems = [];
  const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");
  for (const item of items) {
    const prod = getProduct.get(item.productId);
    if (!prod) {
      return res.status(400).json({ error: `Product "${item.title || item.productId}" is not available.` });
    }
    if (prod.stock_quantity < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${prod.title}. Only ${prod.stock_quantity} remaining.` });
    }
    const itemPrice = prod.selling_price;
    const itemTotal = itemPrice * Number(item.quantity);
    subtotal += itemTotal;
    verifiedItems.push({
      productId: prod.id,
      title: prod.title,
      variant: item.variantLabel || "",
      unitPrice: itemPrice,
      quantity: Number(item.quantity),
      totalPrice: itemTotal,
      image: prod.primary_image
    });
  }
  const isDhaka = division.toLowerCase().includes("dhaka") || district.toLowerCase().includes("dhaka");
  let shippingFee = isDhaka ? shippingInside : shippingOutside;
  if (subtotal >= freeThreshold) {
    shippingFee = 0;
  }
  let discountAmount = 0;
  if (couponCode) {
    const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1").get(couponCode.toUpperCase().trim());
    if (coupon && subtotal >= coupon.min_order_amount) {
      if (coupon.discount_type === "percent") {
        discountAmount = Math.round(subtotal * coupon.discount_value / 100);
      } else {
        discountAmount = coupon.discount_value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      db.prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?").run(coupon.id);
    }
  }
  const finalTotal = subtotal + shippingFee - discountAmount;
  const orderId = crypto3.randomUUID();
  const orderNumber = `NXR-${Math.floor(1e4 + Math.random() * 9e4)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let paymentStatus = "pending";
  let initialOrderStatus = "Order Placed";
  if (paymentMethod === "Cash on Delivery") {
    paymentStatus = "pending_cod";
  } else if (paymentMethod === "bKash" || paymentMethod === "Nagad") {
    paymentStatus = "awaiting_verification";
    initialOrderStatus = "Awaiting Payment Verification";
  }
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, order_number, customer_name, customer_email, customer_phone,
      division, district, address, postal_code, notes,
      subtotal, shipping_fee, discount_amount, total_amount,
      payment_method, payment_status, trx_id, order_status,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (
      id, order_id, product_id, product_title, variant_label,
      unit_price, quantity, total_price, product_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStock = db.prepare(`
    UPDATE products
    SET stock_quantity = MAX(0, stock_quantity - ?),
        sales_count = sales_count + ?
    WHERE id = ?
  `);
  insertOrder.run(
    orderId,
    orderNumber,
    customerName.trim(),
    customerEmail ? customerEmail.trim() : null,
    cleanPhone,
    division,
    district,
    address.trim(),
    postalCode ? postalCode.trim() : null,
    notes ? notes.trim() : null,
    subtotal,
    shippingFee,
    discountAmount,
    finalTotal,
    paymentMethod,
    paymentStatus,
    trxId ? trxId.trim() : null,
    initialOrderStatus,
    now,
    now
  );
  for (const item of verifiedItems) {
    insertItem.run(
      crypto3.randomUUID(),
      orderId,
      item.productId,
      item.title,
      item.variant || null,
      item.unitPrice,
      item.quantity,
      item.totalPrice,
      item.image
    );
    updateStock.run(item.quantity, item.quantity, item.productId);
  }
  sendOrderNotifications({
    orderNumber,
    customerName,
    customerEmail,
    customerPhone: cleanPhone,
    division,
    district,
    address,
    postalCode,
    items: verifiedItems.map((i) => ({
      title: i.title,
      variant: i.variant,
      quantity: i.quantity,
      price: i.unitPrice,
      total: i.totalPrice
    })),
    subtotal,
    shippingFee,
    discount: discountAmount,
    total: finalTotal,
    paymentMethod,
    paymentStatus,
    trxId,
    notes
  }, orderId).catch(console.error);
  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    orderId,
    orderNumber,
    totalAmount: finalTotal,
    paymentMethod,
    paymentStatus
  });
});
apiRouter.get("/orders/track", (req, res) => {
  const { orderNumber, phone } = req.query;
  if (!orderNumber || !phone) {
    return res.status(400).json({ error: "Please enter both Order Number and Contact Phone number." });
  }
  const cleanPhone = String(phone).replace(/\s+/g, "").replace(/-/g, "");
  const cleanOrderNum = String(orderNumber).trim().toUpperCase();
  const order = db.prepare(`
    SELECT * FROM orders
    WHERE UPPER(order_number) = ? AND (customer_phone LIKE ? OR customer_phone = ?)
  `).get(cleanOrderNum, `%${cleanPhone.slice(-8)}%`, cleanPhone);
  if (!order) {
    return res.status(404).json({ error: "No matching order found for this Order Number and Phone. Please verify and try again." });
  }
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  res.json({
    success: true,
    order: {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
      division: order.division,
      district: order.district,
      address: order.address,
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee,
      discount_amount: order.discount_amount,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      trx_id: order.trx_id,
      order_status: order.order_status,
      courier_name: order.courier_name,
      tracking_number: order.tracking_number,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items
    }
  });
});
apiRouter.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(username.trim(), username.trim());
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const isMatch = verifyPassword(password, user.password_hash, user.salt);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = createSession(user);
  db.prepare("INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
    crypto3.randomUUID(),
    user.username,
    "USER_LOGIN",
    `User ${user.username} (${user.role}) logged in successfully`,
    (/* @__PURE__ */ new Date()).toISOString()
  );
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});
apiRouter.post("/auth/register", (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }
  const { hash, salt } = hashPassword(password);
  const userId = crypto3.randomUUID();
  const username = email.split("@")[0] + Math.floor(Math.random() * 100);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT INTO users (id, username, email, phone, password_hash, salt, role, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'customer', ?, ?, ?)
  `).run(userId, username, email.trim().toLowerCase(), phone || "", hash, salt, name.trim(), now, now);
  const token = createSession({ id: userId, username, role: "customer" });
  res.json({
    success: true,
    token,
    user: {
      id: userId,
      username,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      role: "customer"
    }
  });
});
apiRouter.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const session = SESSIONS.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: "Session expired" });
  }
  const user = db.prepare("SELECT id, username, name, email, phone, role FROM users WHERE id = ?").get(session.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  res.json({ success: true, user });
});
apiRouter.get("/admin/metrics", requireAdmin, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders").get();
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status LIKE '%Placed%' OR order_status LIKE '%Awaiting%'").get();
  const confirmedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Order Confirmed'").get();
  const processingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Processing'").get();
  const shippedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Shipped' OR order_status = 'Out for Delivery'").get();
  const deliveredOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Delivered'").get();
  const cancelledOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Cancelled'").get();
  const lowStockProducts = db.prepare("SELECT id, title, sku, stock_quantity, selling_price FROM products WHERE stock_quantity <= 10 ORDER BY stock_quantity ASC LIMIT 10").all();
  const bestSellers = db.prepare(`
    SELECT p.id, p.title, p.primary_image, p.selling_price, p.supplier_cost,
           COALESCE(SUM(oi.quantity), 0) as units_sold,
           COALESCE(SUM(oi.total_price), 0) as total_revenue,
           COALESCE(SUM(oi.quantity * (p.selling_price - p.supplier_cost)), 0) as gross_profit
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.id
    ORDER BY units_sold DESC
    LIMIT 5
  `).all();
  const recentOrders = db.prepare(`
    SELECT id, order_number, customer_name, customer_phone, total_amount, payment_method, payment_status, order_status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 8
  `).all();
  res.json({
    success: true,
    metrics: {
      totalOrders: totalOrders.count,
      totalRevenue: totalOrders.revenue,
      pendingOrders: pendingOrders.count,
      confirmedOrders: confirmedOrders.count,
      processingOrders: processingOrders.count,
      shippedOrders: shippedOrders.count,
      deliveredOrders: deliveredOrders.count,
      cancelledOrders: cancelledOrders.count,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      bestSellers,
      recentOrders
    }
  });
});
apiRouter.get("/admin/orders", requireAdmin, (req, res) => {
  const { status, paymentStatus, search } = req.query;
  let sql = "SELECT * FROM orders WHERE 1=1";
  const params = [];
  if (status) {
    sql += " AND order_status = ?";
    params.push(status);
  }
  if (paymentStatus) {
    sql += " AND payment_status = ?";
    params.push(paymentStatus);
  }
  if (search) {
    sql += " AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR trx_id LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  sql += " ORDER BY created_at DESC";
  const orders = db.prepare(sql).all(...params).map((o) => {
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(o.id);
    return { ...o, items };
  });
  res.json({ success: true, orders });
});
apiRouter.patch("/admin/orders/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { order_status, payment_status, courier_name, tracking_number, admin_notes, trx_id } = req.body;
  const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Order not found" });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    UPDATE orders
    SET order_status = COALESCE(?, order_status),
        payment_status = COALESCE(?, payment_status),
        courier_name = COALESCE(?, courier_name),
        tracking_number = COALESCE(?, tracking_number),
        admin_notes = COALESCE(?, admin_notes),
        trx_id = COALESCE(?, trx_id),
        updated_at = ?
    WHERE id = ?
  `).run(
    order_status !== void 0 ? order_status : null,
    payment_status !== void 0 ? payment_status : null,
    courier_name !== void 0 ? courier_name : null,
    tracking_number !== void 0 ? tracking_number : null,
    admin_notes !== void 0 ? admin_notes : null,
    trx_id !== void 0 ? trx_id : null,
    now,
    id
  );
  const actor = req.user?.username || "Admin";
  db.prepare("INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
    crypto3.randomUUID(),
    actor,
    "UPDATE_ORDER",
    `Updated Order ${existing.order_number}: Status -> ${order_status || existing.order_status}, Payment -> ${payment_status || existing.payment_status}`,
    now
  );
  res.json({ success: true, message: "Order updated successfully" });
});
apiRouter.get("/admin/products", requireAdmin, (req, res) => {
  const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all().map((p) => ({
    ...p,
    gallery_images: JSON.parse(p.gallery_images || "[]"),
    specs: JSON.parse(p.specs || "{}"),
    variants: JSON.parse(p.variants || "[]"),
    profit: p.selling_price - p.supplier_cost,
    margin_percent: p.selling_price > 0 ? Math.round((p.selling_price - p.supplier_cost) / p.selling_price * 100) : 0
  }));
  res.json({ success: true, products });
});
apiRouter.post("/admin/products", requireAdmin, (req, res) => {
  const {
    title,
    slug,
    description,
    short_description,
    brand,
    model,
    sku,
    category_id,
    supplier_cost,
    selling_price,
    original_price,
    stock_quantity,
    status,
    is_featured,
    is_trending,
    primary_image,
    gallery_images,
    specs,
    variants,
    warranty_info
  } = req.body;
  if (!title || !selling_price || !category_id) {
    return res.status(400).json({ error: "Title, selling price, and category are required." });
  }
  const generatedSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const generatedSku = sku ? sku.trim().toUpperCase() : `NXR-${Math.floor(1e3 + Math.random() * 9e3)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const productId = crypto3.randomUUID();
  try {
    db.prepare(`
      INSERT INTO products (
        id, title, slug, description, short_description, brand, model, sku,
        category_id, supplier_cost, selling_price, original_price, stock_quantity,
        status, is_featured, is_trending, primary_image, gallery_images,
        specs, variants, warranty_info, sales_count, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 0, ?, ?
      )
    `).run(
      productId,
      title.trim(),
      generatedSlug,
      description || title,
      short_description || "",
      brand || "Generic",
      model || "",
      generatedSku,
      category_id,
      Number(supplier_cost) || 0,
      Number(selling_price),
      Number(original_price) || Number(selling_price),
      Number(stock_quantity) || 10,
      status || "published",
      is_featured ? 1 : 0,
      is_trending ? 1 : 0,
      primary_image || "/src/assets/images/hero_gadgets_showcase_1791985482814.jpg",
      JSON.stringify(gallery_images || []),
      JSON.stringify(specs || {}),
      JSON.stringify(variants || []),
      warranty_info || "1 Year Brand Warranty",
      now,
      now
    );
    const actor = req.user?.username || "Admin";
    db.prepare("INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
      crypto3.randomUUID(),
      actor,
      "CREATE_PRODUCT",
      `Created product "${title}" (SKU: ${generatedSku})`,
      now
    );
    res.status(201).json({ success: true, message: "Product created successfully", productId });
  } catch (err) {
    res.status(400).json({ error: `Failed to create product: ${err.message}` });
  }
});
apiRouter.put("/admin/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const p = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    db.prepare(`
      UPDATE products SET
        title = ?,
        slug = ?,
        description = ?,
        short_description = ?,
        brand = ?,
        model = ?,
        sku = ?,
        category_id = ?,
        supplier_cost = ?,
        selling_price = ?,
        original_price = ?,
        stock_quantity = ?,
        status = ?,
        is_featured = ?,
        is_trending = ?,
        primary_image = ?,
        gallery_images = ?,
        specs = ?,
        variants = ?,
        warranty_info = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      p.title,
      p.slug,
      p.description,
      p.short_description,
      p.brand,
      p.model,
      p.sku,
      p.category_id,
      Number(p.supplier_cost) || 0,
      Number(p.selling_price),
      Number(p.original_price),
      Number(p.stock_quantity),
      p.status,
      p.is_featured ? 1 : 0,
      p.is_trending ? 1 : 0,
      p.primary_image,
      JSON.stringify(p.gallery_images || []),
      JSON.stringify(p.specs || {}),
      JSON.stringify(p.variants || []),
      p.warranty_info,
      now,
      id
    );
    const actor = req.user?.username || "Admin";
    db.prepare("INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
      crypto3.randomUUID(),
      actor,
      "UPDATE_PRODUCT",
      `Updated product "${p.title}" (ID: ${id})`,
      now
    );
    res.json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    res.status(400).json({ error: `Update failed: ${err.message}` });
  }
});
apiRouter.delete("/admin/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT title FROM products WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Product not found" });
  }
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  const actor = req.user?.username || "Admin";
  db.prepare("INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
    crypto3.randomUUID(),
    actor,
    "DELETE_PRODUCT",
    `Deleted product "${existing.title}" (ID: ${id})`,
    (/* @__PURE__ */ new Date()).toISOString()
  );
  res.json({ success: true, message: "Product deleted successfully" });
});
apiRouter.get("/admin/customers", requireAdmin, (req, res) => {
  const customers = db.prepare(`
    SELECT customer_name, customer_phone, customer_email, division, district,
           COUNT(id) as total_orders,
           SUM(total_amount) as lifetime_spent,
           MAX(created_at) as last_order_date
    FROM orders
    GROUP BY customer_phone
    ORDER BY lifetime_spent DESC
  `).all();
  res.json({ success: true, customers });
});
apiRouter.get("/admin/settings", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT key, value FROM store_settings").all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({ success: true, settings });
});
apiRouter.put("/admin/settings", requireAdmin, (req, res) => {
  const updates = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const upsert = db.prepare(`
    INSERT INTO store_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  for (const [key, val] of Object.entries(updates)) {
    if (val !== void 0 && val !== null) {
      upsert.run(key, String(val), now);
    }
  }
  const actor = req.user?.username || "Admin";
  db.prepare("INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
    crypto3.randomUUID(),
    actor,
    "UPDATE_SETTINGS",
    `Updated store settings: ${Object.keys(updates).join(", ")}`,
    now
  );
  res.json({ success: true, message: "Settings saved successfully" });
});
apiRouter.get("/admin/audit-logs", requireAdmin, (req, res) => {
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50").all();
  res.json({ success: true, logs });
});
apiRouter.get("/admin/email-logs", requireAdmin, (req, res) => {
  const logs = db.prepare("SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50").all();
  res.json({ success: true, logs });
});

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  initDatabase();
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const isProd = process.env.NODE_ENV === "production";
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app.use("/api", apiRouter);
  app.use("/src/assets", express.static(path2.resolve(__dirname, "src/assets")));
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path2.resolve(distPath, "index.html"));
      });
    } else {
      console.warn('Production build directory "dist" not found. Falling back to dynamic rendering.');
    }
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`\u{1F680} NEXORA TECH platform running on http://0.0.0.0:${port}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

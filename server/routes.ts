import { Router, Request, Response, NextFunction } from 'express';
import { db, hashPassword, verifyPassword } from './db.js';
import { sendOrderNotifications } from './email.js';
import crypto from 'node:crypto';

export const apiRouter = Router();

// In-memory or database session store
const SESSIONS = new Map<string, { userId: string; username: string; role: string; expiresAt: number }>();

function createSession(user: { id: string; username: string; role: string }) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  SESSIONS.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt,
  });
  return token;
}

// Auth Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = SESSIONS.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) SESSIONS.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  if (session.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator privilege required' });
  }

  (req as any).user = session;
  next();
}

// -----------------------------------------------------------------------------
// PUBLIC STOREFRONT ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Store settings
apiRouter.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM store_settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const row of rows) {
    // Hide secret API keys from public output
    if (row.key !== 'resend_api_key') {
      settings[row.key] = row.value;
    }
  }
  res.json({ success: true, settings });
});

// 2. Categories
apiRouter.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  res.json({ success: true, categories });
});

// 3. Products with filtering, search, and sorting
apiRouter.get('/products', (req, res) => {
  const { category, brand, search, minPrice, maxPrice, inStock, sort, featured, trending } = req.query;

  let query = "SELECT * FROM products WHERE status = 'published'";
  const params: any[] = [];

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

  if (inStock === 'true') {
    query += " AND stock_quantity > 0";
  }

  if (featured === 'true') {
    query += " AND is_featured = 1";
  }

  if (trending === 'true') {
    query += " AND is_trending = 1";
  }

  // Sorting
  switch (sort) {
    case 'price_low_high':
      query += " ORDER BY selling_price ASC";
      break;
    case 'price_high_low':
      query += " ORDER BY selling_price DESC";
      break;
    case 'newest':
      query += " ORDER BY created_at DESC";
      break;
    case 'bestselling':
      query += " ORDER BY sales_count DESC";
      break;
    default:
      query += " ORDER BY is_featured DESC, sales_count DESC, created_at DESC";
  }

  const products = db.prepare(query).all(...params).map((p: any) => ({
    ...p,
    gallery_images: JSON.parse(p.gallery_images || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
  }));

  res.json({ success: true, products, count: products.length });
});

// 4. Product details by slug or ID
apiRouter.get('/products/:identifier', (req, res) => {
  const { identifier } = req.params;
  const product: any = db.prepare('SELECT * FROM products WHERE (id = ? OR slug = ?) AND status = ?').get(identifier, identifier, 'published');

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reviews = db.prepare("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC").all(product.id);
  const related = db.prepare("SELECT * FROM products WHERE category_id = ? AND id != ? AND status = 'published' LIMIT 4").all(product.category_id, product.id).map((p: any) => ({
    ...p,
    gallery_images: JSON.parse(p.gallery_images || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
  }));

  res.json({
    success: true,
    product: {
      ...product,
      gallery_images: JSON.parse(product.gallery_images || '[]'),
      specs: JSON.parse(product.specs || '{}'),
      variants: JSON.parse(product.variants || '[]'),
    },
    reviews,
    related,
  });
});

// 5. Validate coupon
apiRouter.post('/coupons/validate', (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  const coupon: any = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.toUpperCase().trim());
  if (!coupon) {
    return res.status(404).json({ error: 'Invalid or expired coupon code' });
  }

  const subtotal = Number(orderAmount) || 0;
  if (subtotal < coupon.min_order_amount) {
    return res.status(400).json({
      error: `Minimum order amount for coupon ${coupon.code} is ৳${coupon.min_order_amount}`
    });
  }

  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = Math.round((subtotal * coupon.discount_value) / 100);
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
      calculated_discount: discount,
    }
  });
});

// 6. Submit customer review
apiRouter.post('/reviews', (req, res) => {
  const { productId, customerName, customerPhone, rating, comment } = req.body;
  if (!productId || !customerName || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  const numRating = Math.max(1, Math.min(5, Number(rating)));
  const reviewId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reviews (id, product_id, customer_name, customer_phone, rating, comment, is_verified_purchase, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'approved', ?)
  `).run(reviewId, productId, customerName.trim(), customerPhone || '', numRating, comment.trim(), now);

  res.json({ success: true, message: 'Review submitted successfully', reviewId });
});

// 7. Create Order (Checkout)
apiRouter.post('/orders', async (req, res) => {
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
    couponCode,
  } = req.body;

  // Validation
  if (!customerName || !customerPhone || !division || !district || !address || !items || !items.length || !paymentMethod) {
    return res.status(400).json({ error: 'Please provide all required shipping and order details.' });
  }

  // Bangladesh mobile phone validation: 11 digits starting with 01
  const cleanPhone = customerPhone.replace(/\s+/g, '').replace(/-/g, '');
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: 'Please enter a valid 11-digit Bangladesh mobile number (e.g., 01712345678).' });
  }

  // Fetch settings for shipping calculations
  const settingsRows = db.prepare('SELECT key, value FROM store_settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const s of settingsRows) settings[s.key] = s.value;

  const shippingInside = Number(settings.shipping_inside_dhaka || 70);
  const shippingOutside = Number(settings.shipping_outside_dhaka || 130);
  const freeThreshold = Number(settings.free_shipping_threshold || 5000);

  // Recalculate prices server-side for integrity
  let subtotal = 0;
  const verifiedItems: Array<{
    productId: string;
    title: string;
    variant?: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    image: string;
  }> = [];

  const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');

  for (const item of items) {
    const prod: any = getProduct.get(item.productId);
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
      variant: item.variantLabel || '',
      unitPrice: itemPrice,
      quantity: Number(item.quantity),
      totalPrice: itemTotal,
      image: prod.primary_image,
    });
  }

  // Calculate shipping
  const isDhaka = division.toLowerCase().includes('dhaka') || district.toLowerCase().includes('dhaka');
  let shippingFee = isDhaka ? shippingInside : shippingOutside;
  if (subtotal >= freeThreshold) {
    shippingFee = 0;
  }

  // Calculate discount if coupon applied
  let discountAmount = 0;
  if (couponCode) {
    const coupon: any = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(couponCode.toUpperCase().trim());
    if (coupon && subtotal >= coupon.min_order_amount) {
      if (coupon.discount_type === 'percent') {
        discountAmount = Math.round((subtotal * coupon.discount_value) / 100);
      } else {
        discountAmount = coupon.discount_value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      // Increment coupon usage
      db.prepare('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?').run(coupon.id);
    }
  }

  const finalTotal = subtotal + shippingFee - discountAmount;
  const orderId = crypto.randomUUID();
  const orderNumber = `NXR-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();

  // Payment status
  let paymentStatus = 'pending';
  let initialOrderStatus = 'Order Placed';
  if (paymentMethod === 'Cash on Delivery') {
    paymentStatus = 'pending_cod';
  } else if (paymentMethod === 'bKash' || paymentMethod === 'Nagad') {
    paymentStatus = 'awaiting_verification';
    initialOrderStatus = 'Awaiting Payment Verification';
  }

  // Save order in transaction
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
      crypto.randomUUID(),
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

  // Dispatch Transactional Email notification to store owner (tanjilur202@gmail.com) and customer
  sendOrderNotifications({
    orderNumber,
    customerName,
    customerEmail,
    customerPhone: cleanPhone,
    division,
    district,
    address,
    postalCode,
    items: verifiedItems.map(i => ({
      title: i.title,
      variant: i.variant,
      quantity: i.quantity,
      price: i.unitPrice,
      total: i.totalPrice,
    })),
    subtotal,
    shippingFee,
    discount: discountAmount,
    total: finalTotal,
    paymentMethod,
    paymentStatus,
    trxId,
    notes,
  }, orderId).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    orderId,
    orderNumber,
    totalAmount: finalTotal,
    paymentMethod,
    paymentStatus,
  });
});

// 8. Order Tracking (Requires Order Number and Phone)
apiRouter.get('/orders/track', (req, res) => {
  const { orderNumber, phone } = req.query;
  if (!orderNumber || !phone) {
    return res.status(400).json({ error: 'Please enter both Order Number and Contact Phone number.' });
  }

  const cleanPhone = String(phone).replace(/\s+/g, '').replace(/-/g, '');
  const cleanOrderNum = String(orderNumber).trim().toUpperCase();

  const order: any = db.prepare(`
    SELECT * FROM orders
    WHERE UPPER(order_number) = ? AND (customer_phone LIKE ? OR customer_phone = ?)
  `).get(cleanOrderNum, `%${cleanPhone.slice(-8)}%`, cleanPhone);

  if (!order) {
    return res.status(404).json({ error: 'No matching order found for this Order Number and Phone. Please verify and try again.' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

  res.json({
    success: true,
    order: {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
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
      items,
    }
  });
});

// -----------------------------------------------------------------------------
// AUTHENTICATION
// -----------------------------------------------------------------------------

apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user: any = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username.trim(), username.trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isMatch = verifyPassword(password, user.password_hash, user.salt);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createSession(user);

  db.prepare('INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
    crypto.randomUUID(),
    user.username,
    'USER_LOGIN',
    `User ${user.username} (${user.role}) logged in successfully`,
    new Date().toISOString()
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
      role: user.role,
    }
  });
});

apiRouter.post('/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const { hash, salt } = hashPassword(password);
  const userId = crypto.randomUUID();
  const username = email.split('@')[0] + Math.floor(Math.random() * 100);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, username, email, phone, password_hash, salt, role, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'customer', ?, ?, ?)
  `).run(userId, username, email.trim().toLowerCase(), phone || '', hash, salt, name.trim(), now, now);

  const token = createSession({ id: userId, username, role: 'customer' });

  res.json({
    success: true,
    token,
    user: {
      id: userId,
      username,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      role: 'customer',
    }
  });
});

apiRouter.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = SESSIONS.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Session expired' });
  }

  const user: any = db.prepare('SELECT id, username, name, email, phone, role FROM users WHERE id = ?').get(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  res.json({ success: true, user });
});

// -----------------------------------------------------------------------------
// SECURE ADMIN MANAGEMENT ENDPOINTS (requireAdmin)
// -----------------------------------------------------------------------------

// Admin Dashboard Metrics
apiRouter.get('/admin/metrics', requireAdmin, (req, res) => {
  const totalOrders: any = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders').get();
  const pendingOrders: any = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status LIKE '%Placed%' OR order_status LIKE '%Awaiting%'").get();
  const confirmedOrders: any = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Order Confirmed'").get();
  const processingOrders: any = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Processing'").get();
  const shippedOrders: any = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Shipped' OR order_status = 'Out for Delivery'").get();
  const deliveredOrders: any = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Delivered'").get();
  const cancelledOrders: any = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Cancelled'").get();

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
      recentOrders,
    }
  });
});

// Admin Orders List & Filter
apiRouter.get('/admin/orders', requireAdmin, (req, res) => {
  const { status, paymentStatus, search } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (status) {
    sql += ' AND order_status = ?';
    params.push(status);
  }

  if (paymentStatus) {
    sql += ' AND payment_status = ?';
    params.push(paymentStatus);
  }

  if (search) {
    sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR trx_id LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY created_at DESC';

  const orders = db.prepare(sql).all(...params).map((o: any) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
    return { ...o, items };
  });

  res.json({ success: true, orders });
});

// Update Order (Status, Payment, Courier, Admin Notes)
apiRouter.patch('/admin/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { order_status, payment_status, courier_name, tracking_number, admin_notes, trx_id } = req.body;

  const existing: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const now = new Date().toISOString();
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
    order_status !== undefined ? order_status : null,
    payment_status !== undefined ? payment_status : null,
    courier_name !== undefined ? courier_name : null,
    tracking_number !== undefined ? tracking_number : null,
    admin_notes !== undefined ? admin_notes : null,
    trx_id !== undefined ? trx_id : null,
    now,
    id
  );

  const actor = (req as any).user?.username || 'Admin';
  db.prepare('INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
    crypto.randomUUID(),
    actor,
    'UPDATE_ORDER',
    `Updated Order ${existing.order_number}: Status -> ${order_status || existing.order_status}, Payment -> ${payment_status || existing.payment_status}`,
    now
  );

  res.json({ success: true, message: 'Order updated successfully' });
});

// Admin Products (all statuses, including supplier cost & profit margins)
apiRouter.get('/admin/products', requireAdmin, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all().map((p: any) => ({
    ...p,
    gallery_images: JSON.parse(p.gallery_images || '[]'),
    specs: JSON.parse(p.specs || '{}'),
    variants: JSON.parse(p.variants || '[]'),
    profit: p.selling_price - p.supplier_cost,
    margin_percent: p.selling_price > 0 ? Math.round(((p.selling_price - p.supplier_cost) / p.selling_price) * 100) : 0,
  }));
  res.json({ success: true, products });
});

// Admin Add Product (or Dropshipping quick-import)
apiRouter.post('/admin/products', requireAdmin, (req, res) => {
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
    warranty_info,
  } = req.body;

  if (!title || !selling_price || !category_id) {
    return res.status(400).json({ error: 'Title, selling price, and category are required.' });
  }

  const generatedSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const generatedSku = sku ? sku.trim().toUpperCase() : `NXR-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();

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
      short_description || '',
      brand || 'Generic',
      model || '',
      generatedSku,
      category_id,
      Number(supplier_cost) || 0,
      Number(selling_price),
      Number(original_price) || Number(selling_price),
      Number(stock_quantity) || 10,
      status || 'published',
      is_featured ? 1 : 0,
      is_trending ? 1 : 0,
      primary_image || '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
      JSON.stringify(gallery_images || []),
      JSON.stringify(specs || {}),
      JSON.stringify(variants || []),
      warranty_info || '1 Year Brand Warranty',
      now,
      now
    );

    const actor = (req as any).user?.username || 'Admin';
    db.prepare('INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
      crypto.randomUUID(),
      actor,
      'CREATE_PRODUCT',
      `Created product "${title}" (SKU: ${generatedSku})`,
      now
    );

    res.status(201).json({ success: true, message: 'Product created successfully', productId });
  } catch (err: any) {
    res.status(400).json({ error: `Failed to create product: ${err.message}` });
  }
});

// Admin Update Product
apiRouter.put('/admin/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const p = req.body;
  const now = new Date().toISOString();

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

    const actor = (req as any).user?.username || 'Admin';
    db.prepare('INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
      crypto.randomUUID(),
      actor,
      'UPDATE_PRODUCT',
      `Updated product "${p.title}" (ID: ${id})`,
      now
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err: any) {
    res.status(400).json({ error: `Update failed: ${err.message}` });
  }
});

// Admin Delete Product
apiRouter.delete('/admin/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing: any = db.prepare('SELECT title FROM products WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);

  const actor = (req as any).user?.username || 'Admin';
  db.prepare('INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
    crypto.randomUUID(),
    actor,
    'DELETE_PRODUCT',
    `Deleted product "${existing.title}" (ID: ${id})`,
    new Date().toISOString()
  );

  res.json({ success: true, message: 'Product deleted successfully' });
});

// Admin Customers List
apiRouter.get('/admin/customers', requireAdmin, (req, res) => {
  // Aggregate customer details from real order records
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

// Admin Store Settings (Full, including email keys and contact settings)
apiRouter.get('/admin/settings', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM store_settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({ success: true, settings });
});

// Update Store Settings (CRITICAL: each setting can be changed independently)
apiRouter.put('/admin/settings', requireAdmin, (req, res) => {
  const updates: Record<string, string> = req.body;
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO store_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined && val !== null) {
      upsert.run(key, String(val), now);
    }
  }

  const actor = (req as any).user?.username || 'Admin';
  db.prepare('INSERT INTO audit_logs (id, actor_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)').run(
    crypto.randomUUID(),
    actor,
    'UPDATE_SETTINGS',
    `Updated store settings: ${Object.keys(updates).join(', ')}`,
    now
  );

  res.json({ success: true, message: 'Settings saved successfully' });
});

// Admin Audit Logs & Email Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all();
  res.json({ success: true, logs });
});

apiRouter.get('/admin/email-logs', requireAdmin, (req, res) => {
  const logs = db.prepare('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50').all();
  res.json({ success: true, logs });
});

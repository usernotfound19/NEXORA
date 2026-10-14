import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Order, StoreSettings } from '../types';
import { ApiService } from '../services/api';
import {
  ShieldAlert, LayoutDashboard, ShoppingCart, Package, Users, Settings,
  History, LogOut, CheckCircle2, AlertTriangle, Search, Filter, Plus,
  Edit2, Trash2, Download, Upload, Printer, Phone, MessageCircle, Mail,
  DollarSign, TrendingUp, RefreshCw, X, Eye, FileText, Check, Lock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, token, login, logout, settings, updateSettingsState, navigate, showToast } = useStore();

  // Admin login states
  const [adminUsername, setAdminUsername] = useState('Kawshik');
  const [adminPassword, setAdminPassword] = useState('Kawshik@2026!');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active admin tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'dropship' | 'customers' | 'settings' | 'audit'>('overview');

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Order filters & modal
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Product editor modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Settings form
  const [formSettings, setFormSettings] = useState<StoreSettings>({ ...settings });
  const [savingSettings, setSavingSettings] = useState(false);

  // Dropshipping import form state
  const [dsTitle, setDsTitle] = useState('');
  const [dsBrand, setDsBrand] = useState('ApexTech');
  const [dsCategory, setDsCategory] = useState('cat-wearables');
  const [dsSupplierCost, setDsSupplierCost] = useState<number>(2000);
  const [dsSellingPrice, setDsSellingPrice] = useState<number>(3200);
  const [dsOriginalPrice, setDsOriginalPrice] = useState<number>(4500);
  const [dsSku, setDsSku] = useState('');
  const [dsDescription, setDsDescription] = useState('');
  const [dsImageUrl, setDsImageUrl] = useState('/src/assets/images/hero_gadgets_showcase_1791985482814.jpg');
  const [dsStock, setDsStock] = useState<number>(25);
  const [dsStatus, setDsStatus] = useState<'published' | 'draft'>('published');

  const isAdminAuthenticated = user?.role === 'admin' && !!token;

  // Handle Admin Login
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const data = await ApiService.adminLogin(adminUsername.trim(), adminPassword);
      if (data.success && data.token && data.user) {
        login(data.token, data.user);
        showToast('Administrator session authenticated', 'success');
      } else {
        setLoginError(data.error || 'Access denied: Administrator privileges required.');
      }
    } catch {
      setLoginError('Could not contact authentication service');
    } finally {
      setLoginLoading(false);
    }
  };

  // 1-Click Quick Demo Login for instant verification
  const handleQuickAdminLogin = async () => {
    setAdminUsername('Kawshik');
    setAdminPassword('Kawshik@2026!');
    setLoginLoading(true);
    const data = await ApiService.adminLogin('Kawshik', 'Kawshik@2026!');
    if (data.success && data.token && data.user) {
      login(data.token, data.user);
      showToast('Welcome, Administrator Kawshik!', 'success');
    }
    setLoginLoading(false);
  };

  // Fetch admin data
  const fetchAllAdminData = async () => {
    setLoadingData(true);
    try {
      const [m, o, p, sett, audit, email] = await Promise.all([
        ApiService.getMetrics(token || undefined),
        ApiService.getOrders(token || undefined),
        ApiService.getProducts(),
        ApiService.getSettings(),
        ApiService.getAuditLogs(),
        ApiService.getEmailLogs(),
      ]);

      setMetrics(m);
      setOrders(o);
      setProducts(p);
      setFormSettings(sett);
      updateSettingsState(sett);
      setAuditLogs(audit);
      setEmailLogs(email);
    } catch (e) {
      console.error(e);
      showToast('Error loading administrative records', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAllAdminData();
    }
  }, [isAdminAuthenticated, token]);

  // Update order status or payment
  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      await ApiService.updateOrder(orderId, updates, token || undefined);
      showToast('Order record updated', 'success');
      fetchAllAdminData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch {
      showToast('Error updating order', 'error');
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      await ApiService.updateSettings(formSettings, token || undefined);
      showToast('All contact details and store settings updated successfully!', 'success');
      updateSettingsState(formSettings);
      fetchAllAdminData();
    } catch {
      showToast('Error saving settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Save / Edit Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await ApiService.saveProduct(editingProduct, token || undefined);
      showToast(editingProduct.id ? 'Product updated successfully' : 'Product created successfully', 'success');
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchAllAdminData();
    } catch {
      showToast('Error saving product', 'error');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await ApiService.deleteProduct(id, token || undefined);
      showToast('Product removed from catalog', 'info');
      fetchAllAdminData();
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  // Dropshipping Import
  const handleDropshipImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsTitle.trim()) return;

    const payload = {
      title: dsTitle.trim(),
      brand: dsBrand.trim(),
      category_id: dsCategory,
      supplier_cost: dsSupplierCost,
      selling_price: dsSellingPrice,
      original_price: dsOriginalPrice,
      sku: dsSku.trim() || `NXR-${Math.floor(1000 + Math.random() * 9000)}`,
      description: dsDescription.trim() || `${dsTitle} - Imported premium dropshipping gadget.`,
      primary_image: dsImageUrl.trim() || '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
      stock_quantity: dsStock,
      status: dsStatus,
      is_featured: 0,
      is_trending: 1,
      specs: { 'Origin': 'Supplier Dropship Certified', 'Inspection': 'Quality Checked Prior to Delivery' },
      variants: [{ label: 'Color', options: ['Standard Edition'] }],
      warranty_info: '6 Months Replacement Warranty',
    };

    try {
      await ApiService.saveProduct(payload, token || undefined);
      showToast(`Dropship product "${dsTitle}" listed successfully!`, 'success');
      setDsTitle('');
      setDsDescription('');
      fetchAllAdminData();
      setActiveTab('products');
    } catch {
      showToast('Error importing dropship listing', 'error');
    }
  };

  // Export orders to CSV
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Date', 'Customer', 'Phone', 'Division', 'District', 'Payment Method', 'Payment Status', 'TrxID', 'Order Status', 'Total Amount'];
    const rows = orders.map(o => [
      o.order_number,
      o.created_at,
      `"${o.customer_name}"`,
      o.customer_phone,
      o.division,
      o.district,
      o.payment_method,
      o.payment_status,
      o.trx_id || '',
      o.order_status,
      o.total_amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexora_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export products to CSV
  const handleExportProductsCSV = () => {
    if (products.length === 0) return;
    const headers = ['SKU', 'Title', 'Brand', 'Category', 'Supplier Cost', 'Selling Price', 'Profit', 'Margin %', 'Stock', 'Status'];
    const rows = products.map(p => [
      p.sku,
      `"${p.title.replace(/"/g, '""')}"`,
      p.brand,
      p.category_id,
      p.supplier_cost,
      p.selling_price,
      p.profit || (p.selling_price - p.supplier_cost),
      `${p.margin_percent || 0}%`,
      p.stock_quantity,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexora_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If NOT authenticated as admin, show secure login panel
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="p-8 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">NEXORA Admin Portal</h1>
            <p className="text-xs text-slate-400">Restricted to authorized store managers</p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs text-center space-y-2">
              <p>{loginError}</p>
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded font-bold text-[11px] inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bypass &amp; Enter Admin Panel (1-Click)</span>
              </button>
            </div>
          )}

          {/* Quick 1-Click Instant Admin Access */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                One-Click Instant Access
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-mono">Netlify Ready</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Authenticate immediately as Administrator <strong className="text-white">Kawshik</strong> to manage orders, bKash/Nagad verification, products, and inventory.
            </p>
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={loginLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Enter Admin Dashboard (Instant)</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[11px] uppercase font-mono tracking-wider">or sign in manually</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Admin Username</label>
                <span className="text-[10px] text-slate-500 font-mono">Default: Kawshik</span>
              </div>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <span className="text-[10px] text-slate-500 font-mono">Default: Kawshik@2026!</span>
              </div>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? 'Verifying Credentials...' : 'Authenticate as Admin'}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={() => navigate('home')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              &larr; Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    const matchSearch = !orderSearch ||
      o.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_phone.includes(orderSearch) ||
      (o.trx_id && o.trx_id.toLowerCase().includes(orderSearch.toLowerCase()));

    const matchStatus = !orderStatusFilter || o.order_status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      
      {/* Admin Top Header */}
      <header className="bg-[#0b101b] border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              {settings.store_name || 'NEXORA TECH'} — Command Center
            </h1>
            <span className="text-[11px] text-slate-400">Admin: <strong>{user?.name}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllAdminData}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
          <button
            onClick={() => navigate('home')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            View Storefront
          </button>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar Tabs */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 bg-[#0b101b] border-r border-slate-800 p-4 space-y-1 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-4 h-4" />
              <span>Orders &amp; Dispatch</span>
            </div>
            {metrics?.pendingOrders > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {metrics.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />
              <span>Products Catalog</span>
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums">{products.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('dropship')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'dropship' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Dropship Quick Import</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Store Settings &amp; Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <History className="w-4 h-4" />
            <span>Audit &amp; Email Logs</span>
          </button>
        </aside>

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && metrics && (
            <div className="space-y-8">
              
              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Total Gross Revenue</span>
                  <div className="text-2xl font-extrabold text-blue-400 tabular-nums">
                    ৳{metrics.totalRevenue.toLocaleString('en-BD')}
                  </div>
                  <span className="text-[11px] text-slate-500">{metrics.totalOrders} total completed/active orders</span>
                </div>

                <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Pending Verification</span>
                  <div className="text-2xl font-extrabold text-amber-400 tabular-nums">
                    {metrics.pendingOrders}
                  </div>
                  <span className="text-[11px] text-slate-500">Requires phone/TrxID confirmation</span>
                </div>

                <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">In Transit / Shipped</span>
                  <div className="text-2xl font-extrabold text-indigo-400 tabular-nums">
                    {metrics.shippedOrders + metrics.processingOrders}
                  </div>
                  <span className="text-[11px] text-slate-500">Processing with courier partners</span>
                </div>

                <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Delivered Orders</span>
                  <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">
                    {metrics.deliveredOrders}
                  </div>
                  <span className="text-[11px] text-slate-500">Successfully fulfilled &amp; paid</span>
                </div>
              </div>

              {/* Best Sellers & Low Stock Alert */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Best Sellers from real sales */}
                <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    <span>Best Selling Gadgets (Real Data)</span>
                    <span className="text-xs text-emerald-400 font-semibold">Top Performers</span>
                  </h3>
                  <div className="space-y-3">
                    {metrics.bestSellers && metrics.bestSellers.map((item: any) => (
                      <div key={item.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.primary_image}
                            alt=""
                            className="w-10 h-10 object-cover rounded bg-slate-800"
                            onError={(e) => { (e.currentTarget as any).src = '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg'; }}
                          />
                          <div>
                            <span className="font-semibold text-white block truncate max-w-[200px]">{item.title}</span>
                            <span className="text-slate-400 text-[11px]">Units Sold: <strong>{item.units_sold}</strong></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-400 font-bold block tabular-nums">৳{item.total_revenue.toLocaleString('en-BD')}</span>
                          <span className="text-emerald-400 text-[10px]">Profit: ৳{item.gross_profit.toLocaleString('en-BD')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    <span>Low Stock Warning (&le; 10 units)</span>
                    <span className="text-xs text-amber-400 font-semibold">{metrics.lowStockCount} items</span>
                  </h3>
                  <div className="space-y-3">
                    {metrics.lowStockProducts && metrics.lowStockProducts.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">All inventory healthy above safety threshold.</p>
                    ) : (
                      metrics.lowStockProducts.map((prod: any) => (
                        <div key={prod.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white block truncate max-w-[220px]">{prod.title}</span>
                            <span className="text-slate-500 font-mono text-[11px]">SKU: {prod.sku}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 font-bold tabular-nums">
                            {prod.stock_quantity} left
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Recent Orders Overview Table */}
              <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Recent Store Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    View All Orders &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2.5 font-semibold">Order #</th>
                        <th className="py-2.5 font-semibold">Customer</th>
                        <th className="py-2.5 font-semibold">Phone</th>
                        <th className="py-2.5 font-semibold">Total</th>
                        <th className="py-2.5 font-semibold">Payment</th>
                        <th className="py-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {metrics.recentOrders && metrics.recentOrders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 font-mono font-bold text-blue-400">{o.order_number}</td>
                          <td className="py-3 text-slate-200">{o.customer_name}</td>
                          <td className="py-3 font-mono text-slate-400">{o.customer_phone}</td>
                          <td className="py-3 font-bold text-white tabular-nums">৳{o.total_amount.toLocaleString('en-BD')}</td>
                          <td className="py-3 text-slate-300">{o.payment_method}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              o.order_status === 'Delivered' ? 'bg-emerald-950 text-emerald-300' :
                              o.order_status === 'Cancelled' ? 'bg-rose-950 text-rose-300' :
                              o.order_status === 'Shipped' ? 'bg-indigo-950 text-indigo-300' :
                              'bg-amber-950 text-amber-300'
                            }`}>
                              {o.order_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Orders &amp; Courier Fulfillment</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Verify TrxIDs, update parcel dispatch status, and print invoices</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportOrdersCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Order #, phone, TrxID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Order Statuses</option>
                    <option value="Order Placed">Order Placed</option>
                    <option value="Awaiting Payment Verification">Awaiting Payment Verification</option>
                    <option value="Payment Verified">Payment Verified</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center justify-end text-xs text-slate-400 font-medium">
                  Showing {filteredOrders.length} orders
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Order Number</th>
                        <th className="p-3">Customer &amp; Phone</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment &amp; TrxID</th>
                        <th className="p-3">Order Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No orders matching current search or status filter.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3">
                              <span className="font-mono font-bold text-blue-400 block">{order.order_number}</span>
                              <span className="text-[10px] text-slate-500 block">
                                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="font-semibold text-slate-200 block">{order.customer_name}</span>
                              <a href={`tel:${order.customer_phone}`} className="font-mono text-slate-400 hover:text-blue-400 text-[11px] block">
                                {order.customer_phone}
                              </a>
                            </td>

                            <td className="p-3 text-slate-300">
                              <span className="block font-medium">{order.district}</span>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">{order.address}</span>
                            </td>

                            <td className="p-3">
                              <span className="font-bold text-white tabular-nums">৳{order.total_amount.toLocaleString('en-BD')}</span>
                              <span className="text-[10px] text-slate-500 block">{order.payment_method}</span>
                            </td>

                            <td className="p-3">
                              <div className="space-y-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  order.payment_status === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                                  order.payment_status === 'pending_cod' ? 'bg-blue-950 text-blue-300 border border-blue-800/40' :
                                  'bg-pink-950 text-pink-300 border border-pink-800/40'
                                }`}>
                                  {order.payment_status}
                                </span>
                                {order.trx_id && (
                                  <span className="block font-mono text-[11px] text-pink-400 font-bold">
                                    Trx: {order.trx_id}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <select
                                value={order.order_status}
                                onChange={(e) => handleUpdateOrder(order.id, { order_status: e.target.value as any })}
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                              >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Awaiting Payment Verification">Awaiting Payment Verification</option>
                                <option value="Payment Verified">Payment Verified</option>
                                <option value="Order Confirmed">Order Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => { setSelectedOrder(order); setIsInvoiceOpen(true); }}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Print Order Invoice"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors font-semibold"
                                >
                                  Manage
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Detail & Courier Assignment Drawer */}
              {selectedOrder && !isInvoiceOpen && (
                <div className="p-6 rounded-2xl bg-[#0f172a] border border-blue-500/40 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Fulfillment Manager — Order #{selectedOrder.order_number}
                      </h3>
                      <p className="text-xs text-slate-400">Customer: {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    
                    {/* Payment Verification */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Payment &amp; TrxID</h4>
                      <p>Method: <strong>{selectedOrder.payment_method}</strong></p>
                      <p>Status: <strong className="text-blue-400">{selectedOrder.payment_status}</strong></p>
                      {selectedOrder.trx_id && (
                        <p>TrxID: <span className="font-mono text-pink-400 font-bold">{selectedOrder.trx_id}</span></p>
                      )}
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => handleUpdateOrder(selectedOrder.id, { payment_status: 'verified' })}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-center"
                        >
                          Verify Payment
                        </button>
                        <button
                          onClick={() => handleUpdateOrder(selectedOrder.id, { payment_status: 'failed' })}
                          className="px-2 py-1.5 bg-rose-950 text-rose-300 rounded font-semibold text-center border border-rose-800"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Courier Assignment */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Courier Assignment</h4>
                      <div>
                        <label className="block text-slate-400 mb-1">Logistics Partner</label>
                        <input
                          type="text"
                          defaultValue={selectedOrder.courier_name || 'Steadfast Courier'}
                          onBlur={(e) => handleUpdateOrder(selectedOrder.id, { courier_name: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Consignment / Tracking Number</label>
                        <input
                          type="text"
                          defaultValue={selectedOrder.tracking_number || ''}
                          placeholder="e.g. ST-8891230"
                          onBlur={(e) => handleUpdateOrder(selectedOrder.id, { tracking_number: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Internal Admin Notes</h4>
                      <textarea
                        rows={3}
                        defaultValue={selectedOrder.admin_notes || ''}
                        placeholder="Add private staff notes..."
                        onBlur={(e) => handleUpdateOrder(selectedOrder.id, { admin_notes: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* Printable Invoice Modal */}
              {isInvoiceOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="bg-white text-slate-900 p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div>
                        <h2 className="text-xl font-extrabold tracking-wider text-slate-900">{settings.store_name || 'NEXORA TECH'}</h2>
                        <p className="text-xs text-slate-500">Dhaka, Bangladesh · Direct Call: {settings.direct_call_number || '01352313984'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-blue-600 block">INVOICE #{selectedOrder.order_number}</span>
                        <span className="text-[11px] text-slate-500">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold uppercase text-slate-400 text-[10px] block">Customer Details:</span>
                        <p className="font-semibold">{selectedOrder.customer_name}</p>
                        <p className="font-mono">{selectedOrder.customer_phone}</p>
                        <p className="text-slate-600">{selectedOrder.address}, {selectedOrder.district}, {selectedOrder.division}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold uppercase text-slate-400 text-[10px] block">Payment:</span>
                        <p className="font-semibold">{selectedOrder.payment_method}</p>
                        {selectedOrder.trx_id && <p className="font-mono text-xs">TrxID: {selectedOrder.trx_id}</p>}
                        <p className="text-slate-600">Status: {selectedOrder.payment_status.toUpperCase()}</p>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-600 font-semibold">
                          <th className="py-2">Item</th>
                          <th className="py-2 text-center">Qty</th>
                          <th className="py-2 text-right">Unit Price</th>
                          <th className="py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2">
                              <span className="font-semibold">{item.product_title}</span>
                              {item.variant_label && <span className="text-slate-500 block text-[10px]">{item.variant_label}</span>}
                            </td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right font-mono">৳{item.unit_price}</td>
                            <td className="py-2 text-right font-mono font-semibold">৳{item.total_price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t border-slate-300 pt-3 space-y-1 text-xs text-right">
                      <p><span className="text-slate-500">Subtotal:</span> <strong className="font-mono">৳{selectedOrder.subtotal}</strong></p>
                      <p><span className="text-slate-500">Shipping Fee:</span> <strong className="font-mono">৳{selectedOrder.shipping_fee}</strong></p>
                      {selectedOrder.discount_amount > 0 && (
                        <p className="text-emerald-600"><span>Discount:</span> -৳{selectedOrder.discount_amount}</p>
                      )}
                      <p className="text-base font-extrabold text-slate-900 border-t border-slate-300 pt-2">
                        Total Payable: ৳{selectedOrder.total_amount.toLocaleString('en-BD')}
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Print Invoice
                      </button>
                      <button
                        onClick={() => setIsInvoiceOpen(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PRODUCTS CATALOG MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Product Catalog &amp; Margin Management</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Edit prices, track supplier costs and profit margins</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportProductsCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct({
                        title: '',
                        slug: '',
                        brand: 'ApexTech',
                        category_id: 'cat-wearables',
                        supplier_cost: 2000,
                        selling_price: 3200,
                        original_price: 4500,
                        stock_quantity: 20,
                        status: 'published',
                        is_featured: 0,
                        is_trending: 0,
                        primary_image: '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg',
                        description: '',
                        warranty_info: '1 Year Warranty',
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg shadow-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Gadget</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">SKU &amp; Brand</th>
                        <th className="p-3">Supplier Cost</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">Gross Profit / Margin</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {products.map(prod => (
                        <tr key={prod.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.primary_image}
                                alt=""
                                className="w-10 h-10 object-cover rounded bg-slate-800 shrink-0"
                                onError={(e) => { (e.currentTarget as any).src = '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg'; }}
                              />
                              <div>
                                <span className="font-semibold text-white block truncate max-w-[200px]">{prod.title}</span>
                                <span className="text-[11px] text-slate-400">{prod.category_id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 font-mono">
                            <span className="text-blue-400 block font-semibold">{prod.sku}</span>
                            <span className="text-[11px] text-slate-400">{prod.brand}</span>
                          </td>

                          <td className="p-3 font-mono text-slate-400">
                            ৳{prod.supplier_cost.toLocaleString('en-BD')}
                          </td>

                          <td className="p-3 font-mono font-bold text-white">
                            ৳{prod.selling_price.toLocaleString('en-BD')}
                          </td>

                          <td className="p-3">
                            <span className="font-bold text-emerald-400 block tabular-nums">
                              +৳{(prod.profit || (prod.selling_price - prod.supplier_cost)).toLocaleString('en-BD')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {prod.margin_percent || 0}% margin
                            </span>
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                              prod.stock_quantity <= 5 ? 'bg-amber-950 text-amber-300' : 'bg-slate-900 text-slate-300'
                            }`}>
                              {prod.stock_quantity} units
                            </span>
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              prod.status === 'published' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {prod.status}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setEditingProduct(prod); setIsProductModalOpen(true); }}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Product Modal */}
              {isProductModalOpen && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white">
                        {editingProduct.id ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Product Title *</label>
                        <input
                          type="text"
                          value={editingProduct.title || ''}
                          onChange={(e) => setEditingProduct(p => ({ ...p, title: e.target.value }))}
                          required
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Brand</label>
                          <input
                            type="text"
                            value={editingProduct.brand || ''}
                            onChange={(e) => setEditingProduct(p => ({ ...p, brand: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Category</label>
                          <select
                            value={editingProduct.category_id || 'cat-wearables'}
                            onChange={(e) => setEditingProduct(p => ({ ...p, category_id: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          >
                            <option value="cat-wearables">Smartwatches &amp; Wearables</option>
                            <option value="cat-audio">Wireless Earbuds &amp; Audio</option>
                            <option value="cat-power">Power Banks &amp; Chargers</option>
                            <option value="cat-smartphones">Smartphones &amp; Accessories</option>
                            <option value="cat-gaming">Computer &amp; Gaming Gear</option>
                            <option value="cat-innovative">Innovative Everyday Gadgets</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Supplier Cost (৳)</label>
                          <input
                            type="number"
                            value={editingProduct.supplier_cost || 0}
                            onChange={(e) => setEditingProduct(p => ({ ...p, supplier_cost: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Selling Price (৳) *</label>
                          <input
                            type="number"
                            value={editingProduct.selling_price || 0}
                            onChange={(e) => setEditingProduct(p => ({ ...p, selling_price: Number(e.target.value) }))}
                            required
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Stock Units</label>
                          <input
                            type="number"
                            value={editingProduct.stock_quantity || 10}
                            onChange={(e) => setEditingProduct(p => ({ ...p, stock_quantity: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Primary Image URL</label>
                        <input
                          type="text"
                          value={editingProduct.primary_image || ''}
                          onChange={(e) => setEditingProduct(p => ({ ...p, primary_image: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Detailed Description</label>
                        <textarea
                          rows={3}
                          value={editingProduct.description || ''}
                          onChange={(e) => setEditingProduct(p => ({ ...p, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsProductModalOpen(false)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                        >
                          Save Product
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: DROPSHIPPING QUICK IMPORT */}
          {activeTab === 'dropship' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Dropshipping Instant Product Importer</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste supplier information, calculate profit margins in real-time, and publish directly to the storefront
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-xl">
                
                {/* Live Profit & Margin Indicator */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">Estimated Profit per Unit</span>
                    <span className="text-xl font-bold text-emerald-400 tabular-nums">
                      +৳{Math.max(0, dsSellingPrice - dsSupplierCost).toLocaleString('en-BD')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Gross Profit Margin</span>
                    <span className="text-xl font-bold text-blue-400 tabular-nums">
                      {dsSellingPrice > 0 ? Math.round(((dsSellingPrice - dsSupplierCost) / dsSellingPrice) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <form onSubmit={handleDropshipImport} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Supplier Product Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. CyberCharge 20000mAh Magnetic Power Bank 30W"
                      value={dsTitle}
                      onChange={(e) => setDsTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Supplier Cost (৳) *</label>
                      <input
                        type="number"
                        value={dsSupplierCost}
                        onChange={(e) => setDsSupplierCost(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Your Selling Price (৳) *</label>
                      <input
                        type="number"
                        value={dsSellingPrice}
                        onChange={(e) => setDsSellingPrice(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Original / MRP (৳)</label>
                      <input
                        type="number"
                        value={dsOriginalPrice}
                        onChange={(e) => setDsOriginalPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Brand Name</label>
                      <input
                        type="text"
                        value={dsBrand}
                        onChange={(e) => setDsBrand(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Category</label>
                      <select
                        value={dsCategory}
                        onChange={(e) => setDsCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="cat-wearables">Smartwatches &amp; Wearables</option>
                        <option value="cat-audio">Wireless Earbuds &amp; Audio</option>
                        <option value="cat-power">Power Banks &amp; Chargers</option>
                        <option value="cat-gaming">Computer &amp; Gaming Gear</option>
                        <option value="cat-innovative">Innovative Everyday Gadgets</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Initial Stock Units</label>
                      <input
                        type="number"
                        value={dsStock}
                        onChange={(e) => setDsStock(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Product Image Asset URL</label>
                    <input
                      type="text"
                      value={dsImageUrl}
                      onChange={(e) => setDsImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Product Description / Features</label>
                    <textarea
                      rows={3}
                      placeholder="Paste supplier specifications and descriptions..."
                      value={dsDescription}
                      onChange={(e) => setDsDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                      <label className="text-slate-400">Publish Status:</label>
                      <select
                        value={dsStatus}
                        onChange={(e) => setDsStatus(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      >
                        <option value="published">Publish Immediately</option>
                        <option value="draft">Save as Draft</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete Dropship Import</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER DIRECTORY */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Customer Records</h2>
                <p className="text-xs text-slate-400 mt-0.5">Aggregated customer purchase histories and contact records</p>
              </div>

              <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Phone Number</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Orders Placed</th>
                        <th className="p-3">Lifetime Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {customers.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-3 font-semibold text-white">{c.customer_name}</td>
                          <td className="p-3 font-mono text-slate-300">{c.customer_phone}</td>
                          <td className="p-3 text-slate-400">{c.customer_email || 'Guest (No Email)'}</td>
                          <td className="p-3 text-slate-300">{c.district}, {c.division}</td>
                          <td className="p-3 font-semibold text-blue-400">{c.total_orders}</td>
                          <td className="p-3 font-bold text-emerald-400 tabular-nums">৳{Number(c.lifetime_spent).toLocaleString('en-BD')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STORE SETTINGS & CONTACT CONFIGURATION (CRITICAL REQUIREMENTS) */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Store Settings &amp; Mandatory Contact Configuration</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update official brand contacts, payment wallet numbers, and email dispatcher keys. Changing one value does not alter others.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-xl text-xs">
                
                {/* 1. Official Contact Configuration (CRITICAL) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Official Helpline &amp; Wallet Contacts (Independently Configured)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <label className="text-slate-300 font-semibold block mb-1">
                        1. Direct Call Helpline Number *
                      </label>
                      <input
                        type="text"
                        value={formSettings.direct_call_number || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, direct_call_number: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 01352313984 (Triggers tel: link)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <label className="text-slate-300 font-semibold block mb-1">
                        2. WhatsApp Widget Number *
                      </label>
                      <input
                        type="text"
                        value={formSettings.whatsapp_number || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, whatsapp_number: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 01577215469 (Converts to +880 format)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <label className="text-slate-300 font-semibold block mb-1">
                        3. bKash Payment Number *
                      </label>
                      <input
                        type="text"
                        value={formSettings.bkash_payment_number || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, bkash_payment_number: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 01577215469 (Personal Wallet)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <label className="text-slate-300 font-semibold block mb-1">
                        4. Store Owner Notification Email *
                      </label>
                      <input
                        type="email"
                        value={formSettings.store_owner_email || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, store_owner_email: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: tanjilur202@gmail.com</span>
                    </div>
                  </div>
                </div>

                {/* 2. Brand & Shipping Settings */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Store Brand &amp; Shipping Charges</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Store Name</label>
                      <input
                        type="text"
                        value={formSettings.store_name || ''}
                        onChange={(e) => setFormSettings({ ...formSettings, store_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Free Delivery Threshold (৳)</label>
                      <input
                        type="number"
                        value={formSettings.free_shipping_threshold || '5000'}
                        onChange={(e) => setFormSettings({ ...formSettings, free_shipping_threshold: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Delivery Charge: Inside Dhaka (৳)</label>
                      <input
                        type="number"
                        value={formSettings.shipping_inside_dhaka || '70'}
                        onChange={(e) => setFormSettings({ ...formSettings, shipping_inside_dhaka: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Delivery Charge: Outside Dhaka (৳)</label>
                      <input
                        type="number"
                        value={formSettings.shipping_outside_dhaka || '130'}
                        onChange={(e) => setFormSettings({ ...formSettings, shipping_outside_dhaka: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Top Announcement Banner Text</label>
                    <input
                      type="text"
                      value={formSettings.announcement_text || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, announcement_text: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                {/* 3. Transactional Email API Key Configuration */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>Transactional Email Dispatcher (Resend API)</span>
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    To send transactional order emails directly to <strong>{formSettings.store_owner_email || 'tanjilur202@gmail.com'}</strong> via Resend, enter your Resend API Key below or add <code>RESEND_API_KEY</code> in environment variables. If left empty, all order notifications are logged and safely archived in the <code>email_logs</code> table.
                  </p>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Resend API Key</label>
                    <input
                      type="password"
                      placeholder="re_xxxxxxxxxxxxxx"
                      value={formSettings.resend_api_key || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, resend_api_key: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition-all"
                  >
                    {savingSettings ? 'Saving Settings...' : 'Save All Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: AUDIT & EMAIL LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-8">
              
              {/* Email Logs */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Transactional Email Dispatch Logs</span>
                </h3>
                <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Provider Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {emailLogs.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-500">No email logs yet.</td></tr>
                      ) : (
                        emailLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-900/40">
                            <td className="p-3 text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</td>
                            <td className="p-3 font-semibold text-white">{log.recipient}</td>
                            <td className="p-3 text-slate-300">{log.subject}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'sent' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-400 truncate max-w-xs">{log.provider_response}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <span>Administrative Security Audit Trail</span>
                </h3>
                <div className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden shadow-xl text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Actor</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="p-3 text-slate-400 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-3 font-semibold text-white">{log.actor_name}</td>
                          <td className="p-3 font-mono text-blue-400 font-bold">{log.action}</td>
                          <td className="p-3 text-slate-300">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
};

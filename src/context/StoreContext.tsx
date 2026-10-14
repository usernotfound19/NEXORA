import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, CartItem, StoreSettings, User, Coupon } from '../types';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface StoreContextType {
  settings: StoreSettings;
  updateSettingsState: (newSettings: Partial<StoreSettings>) => void;
  categories: Category[];
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariants?: Record<string, string>) => void;
  removeFromCart: (productId: string, variantLabel?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantLabel?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  deliveryArea: 'dhaka' | 'outside';
  setDeliveryArea: (area: 'dhaka' | 'outside') => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  discountAmount: number;
  cartTotal: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  currentPage: string;
  pageParams: Record<string, any>;
  navigate: (page: string, params?: Record<string, any>) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const defaultSettings: StoreSettings = {
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
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nexora_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nexora_token') || null;
  });

  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside'>('dhaka');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Navigation state syncing with URL hash/path
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});

  // Sync route on mount and browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const paramsObj: Record<string, any> = {};
      searchParams.forEach((val, key) => { paramsObj[key] = val; });

      if (path === '/' || path === '') {
        setCurrentPage('home');
      } else if (path === '/products') {
        setCurrentPage('products');
      } else if (path.startsWith('/product/')) {
        setCurrentPage('product-detail');
        paramsObj.slug = path.replace('/product/', '');
      } else if (path === '/categories') {
        setCurrentPage('categories');
      } else if (path === '/cart') {
        setCurrentPage('cart');
      } else if (path === '/checkout') {
        setCurrentPage('checkout');
      } else if (path === '/track-order') {
        setCurrentPage('track-order');
      } else if (path === '/wishlist') {
        setCurrentPage('wishlist');
      } else if (path === '/login') {
        setCurrentPage('login');
      } else if (path === '/register') {
        setCurrentPage('register');
      } else if (path === '/account') {
        setCurrentPage('account');
      } else if (path === '/admin') {
        setCurrentPage('admin');
      } else if (path === '/admin/login') {
        setCurrentPage('admin-login');
      } else if (path === '/about') {
        setCurrentPage('about');
      } else if (path === '/contact') {
        setCurrentPage('contact');
      } else if (path === '/faq') {
        setCurrentPage('faq');
      } else if (path === '/shipping-policy') {
        setCurrentPage('shipping-policy');
      } else if (path === '/returns-policy') {
        setCurrentPage('returns-policy');
      } else if (path === '/privacy-policy') {
        setCurrentPage('privacy-policy');
      } else if (path === '/terms') {
        setCurrentPage('terms');
      } else if (path === '/payment-info') {
        setCurrentPage('payment-info');
      } else {
        setCurrentPage('not-found');
      }
      setPageParams(paramsObj);
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page: string, params: Record<string, any> = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let newUrl = '/';
    if (page === 'home') newUrl = '/';
    else if (page === 'products') newUrl = '/products' + (params.category ? `?category=${params.category}` : params.search ? `?search=${encodeURIComponent(params.search)}` : '');
    else if (page === 'product-detail') newUrl = `/product/${params.slug || params.id}`;
    else if (page === 'categories') newUrl = '/categories';
    else if (page === 'cart') newUrl = '/cart';
    else if (page === 'checkout') newUrl = '/checkout';
    else if (page === 'track-order') newUrl = '/track-order' + (params.orderNumber ? `?orderNumber=${params.orderNumber}` : '');
    else if (page === 'wishlist') newUrl = '/wishlist';
    else if (page === 'login') newUrl = '/login';
    else if (page === 'register') newUrl = '/register';
    else if (page === 'account') newUrl = '/account';
    else if (page === 'admin') newUrl = '/admin';
    else if (page === 'admin-login') newUrl = '/admin/login';
    else if (page === 'about') newUrl = '/about';
    else if (page === 'contact') newUrl = '/contact';
    else if (page === 'faq') newUrl = '/faq';
    else if (page === 'shipping-policy') newUrl = '/shipping-policy';
    else if (page === 'returns-policy') newUrl = '/returns-policy';
    else if (page === 'privacy-policy') newUrl = '/privacy-policy';
    else if (page === 'terms') newUrl = '/terms';
    else if (page === 'payment-info') newUrl = '/payment-info';
    else newUrl = `/${page}`;

    window.history.pushState({}, '', newUrl);
  };

  // Fetch store settings & categories on load using resilient ApiService
  useEffect(() => {
    import('../services/api').then(({ ApiService, initLocalData }) => {
      initLocalData();
      ApiService.getSettings().then(s => {
        if (s) setSettings(prev => ({ ...prev, ...s }));
      });
      ApiService.getCategories().then(c => {
        if (c && c.length) setCategories(c);
      });
    });
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('nexora_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Save wishlist
  useEffect(() => {
    try {
      localStorage.setItem('nexora_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToCart = (product: Product, quantity = 1, selectedVariants: Record<string, string> = {}) => {
    const variantLabel = Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ');

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id && item.variantLabel === variantLabel);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        if (newQty > product.stock_quantity) {
          showToast(`Only ${product.stock_quantity} units available in stock`, 'error');
          return prev;
        }
        updated[existingIndex].quantity = newQty;
        return updated;
      } else {
        if (quantity > product.stock_quantity) {
          showToast(`Only ${product.stock_quantity} units available in stock`, 'error');
          return prev;
        }
        return [...prev, { productId: product.id, product, quantity, selectedVariants, variantLabel }];
      }
    });

    showToast(`Added ${product.title} to your cart`, 'success');
  };

  const removeFromCart = (productId: string, variantLabel = '') => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.variantLabel === variantLabel)));
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number, variantLabel = '') => {
    if (quantity <= 0) {
      removeFromCart(productId, variantLabel);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.productId === productId && item.variantLabel === variantLabel) {
        return { ...item, quantity: Math.min(quantity, item.product.stock_quantity) };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from wishlist', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Added to your wishlist', 'success');
        return [...prev, productId];
      }
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);

  const insideFee = Number(settings.shipping_inside_dhaka || 70);
  const outsideFee = Number(settings.shipping_outside_dhaka || 130);
  const freeThreshold = Number(settings.free_shipping_threshold || 5000);

  const shippingFee = cartSubtotal === 0 || cartSubtotal >= freeThreshold
    ? 0
    : (deliveryArea === 'dhaka' ? insideFee : outsideFee);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percent') {
      discountAmount = Math.round((cartSubtotal * appliedCoupon.discount_value) / 100);
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
    discountAmount = Math.min(discountAmount, cartSubtotal);
  }

  const cartTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount);

  const applyCouponCode = async (code: string) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount: cartSubtotal }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        showToast(`Coupon ${data.coupon.code} applied! Saved ৳${data.coupon.calculated_discount}`, 'success');
        return { success: true, message: 'Coupon applied successfully' };
      } else {
        showToast(data.error || 'Invalid coupon code', 'error');
        return { success: false, message: data.error || 'Invalid coupon code' };
      }
    } catch {
      showToast('Error validating coupon', 'error');
      return { success: false, message: 'Failed to contact validation server' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('nexora_token', newToken);
    localStorage.setItem('nexora_user', JSON.stringify(newUser));
    showToast(`Welcome back, ${newUser.name}!`, 'success');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
    showToast('You have been logged out', 'info');
  };

  const updateSettingsState = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <StoreContext.Provider value={{
      settings,
      updateSettingsState,
      categories,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartCount,
      cartSubtotal,
      shippingFee,
      deliveryArea,
      setDeliveryArea,
      appliedCoupon,
      applyCouponCode,
      removeCoupon,
      discountAmount,
      cartTotal,
      wishlist,
      toggleWishlist,
      isWishlisted,
      user,
      token,
      login,
      logout,
      isAdmin,
      currentPage,
      pageParams,
      navigate,
      isCartOpen,
      setIsCartOpen,
      toasts,
      showToast,
      removeToast,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

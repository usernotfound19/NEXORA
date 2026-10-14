import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingWidgets } from './components/FloatingWidgets';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { LoginPage, RegisterPage, AccountPage } from './pages/AuthPages';
import {
  AboutPage, ContactPage, FAQPage, ShippingPolicyPage,
  ReturnsPolicyPage, PrivacyPolicyPage, TermsPage, PaymentInfoPage
} from './pages/PolicyPages';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPage, toasts, removeToast, navigate } = useStore();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'products':
        return <ProductsPage />;
      case 'product-detail':
        return <ProductDetailPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'track-order':
        return <OrderTrackingPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'account':
        return <AccountPage />;
      case 'admin':
      case 'admin-login':
        return <AdminDashboard />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'faq':
        return <FAQPage />;
      case 'shipping-policy':
        return <ShippingPolicyPage />;
      case 'returns-policy':
        return <ReturnsPolicyPage />;
      case 'privacy-policy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsPage />;
      case 'payment-info':
        return <PaymentInfoPage />;
      default:
        return <NotFoundPage />;
    }
  };

  const isAdminView = currentPage === 'admin' || currentPage === 'admin-login';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b101b] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header (hidden in full admin management mode to preserve full screen workspace) */}
      {!isAdminView && <Header />}

      {/* Main Content Area */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      {!isAdminView && <Footer />}

      {/* Floating Call & WhatsApp Buttons */}
      {!isAdminView && <FloatingWidgets />}

      {/* Floating Admin Portal Shortcut (Always accessible on Netlify and mobile) */}
      {!isAdminView && (
        <button
          onClick={() => navigate('admin')}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 hover:bg-slate-850 border border-blue-500/50 hover:border-blue-400 text-blue-300 hover:text-white rounded-full text-xs font-bold shadow-xl shadow-black/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Direct Quick Access to NEXORA Admin Management Panel"
        >
          <ShieldAlert className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Admin Portal</span>
        </button>
      )}

      {/* Slide-out Cart Drawer */}
      <CartDrawer />

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-center justify-between gap-3 text-xs backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              toast.type === 'success' ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300' :
              toast.type === 'error' ? 'bg-slate-900/95 border-rose-500/50 text-rose-300' :
              'bg-slate-900/95 border-blue-500/50 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="font-medium text-slate-200">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

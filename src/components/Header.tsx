import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Heart, Search, User as UserIcon, Menu, X, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';

export const Header: React.FC = () => {
  const { settings, cartCount, wishlist, user, isAdmin, navigate, setIsCartOpen, currentPage } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('products', { search: searchQuery.trim() });
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* 1. Announcement Bar */}
      {settings.announcement_text && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-b border-blue-900/40 text-blue-200 text-xs py-2 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 font-medium tracking-wide">
            <span className="truncate">{settings.announcement_text}</span>
          </div>
        </div>
      )}

      {/* 2. Top Bar (One-Row, 3-Zone Contract) */}
      <header className="sticky top-0 z-40 bg-[#0b101b]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); navigate('home'); }}
              className="group flex items-center gap-2.5 text-xl font-bold tracking-tight text-white whitespace-nowrap"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-400">
                {settings.store_name || 'NEXORA TECH'}
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Single-line, 4-5 links) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a
              href="/products"
              onClick={(e) => { e.preventDefault(); navigate('products'); }}
              className={`hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${currentPage === 'products' ? 'text-blue-400 font-semibold' : ''}`}
            >
              All Products
            </a>
            <a
              href="/categories"
              onClick={(e) => { e.preventDefault(); navigate('categories'); }}
              className={`hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${currentPage === 'categories' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Categories
            </a>
            <a
              href="/track-order"
              onClick={(e) => { e.preventDefault(); navigate('track-order'); }}
              className={`hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${currentPage === 'track-order' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Track Order
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); navigate('about'); }}
              className={`hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${currentPage === 'about' ? 'text-blue-400 font-semibold' : ''}`}
            >
              About Us
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); navigate('contact'); }}
              className={`hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${currentPage === 'contact' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Contact
            </a>
          </nav>

          {/* Zone 3: Primary Actions (Search, Wishlist, Cart, User/Admin) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search Input toggle */}
            <div className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search smartwatches, earbuds, gear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 lg:w-72 pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </form>
            </div>

            {/* Mobile search button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Open search bar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => navigate('wishlist')}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              aria-label="View Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon / Trigger Drawer */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-blue-900/70 text-blue-100 px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums">
                {cartCount}
              </span>
            </button>

            {/* Explicit Admin Panel Button */}
            <button
              onClick={() => navigate('admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 hover:from-blue-700 hover:to-indigo-700 border border-blue-500/50 hover:border-blue-400 text-blue-100 hover:text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/20 transition-all shrink-0 cursor-pointer"
              title="Open Store Administrator Panel"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Admin Panel</span>
            </button>

            {/* Account link */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (isAdmin) navigate('admin');
                  else if (user) navigate('account');
                  else navigate('login');
                }}
                className={`p-2 rounded-lg transition-colors ${isAdmin ? 'text-blue-400 bg-blue-950/60 border border-blue-800/50 hover:bg-blue-900/60' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}`}
                title={isAdmin ? 'Admin Dashboard' : user ? `Account: ${user.name}` : 'Login / Register'}
              >
                {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search input dropdown */}
        {isSearchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-slate-800 bg-slate-900/95">
            <form onSubmit={handleSearchSubmit} className="relative pt-2">
              <input
                type="text"
                placeholder="Search gadgets, brands, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-5" />
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-[#0b101b] px-4 py-4 space-y-1 shadow-2xl">
            <a
              href="/products"
              onClick={(e) => { e.preventDefault(); navigate('products'); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span>All Products</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
            <a
              href="/categories"
              onClick={(e) => { e.preventDefault(); navigate('categories'); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span>Product Categories</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
            <a
              href="/track-order"
              onClick={(e) => { e.preventDefault(); navigate('track-order'); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span>Track My Order</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
            <a
              href="/wishlist"
              onClick={(e) => { e.preventDefault(); navigate('wishlist'); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span>Saved Wishlist ({wishlist.length})</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); navigate('about'); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span>About NEXORA TECH</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); navigate('contact'); setIsMobileMenuOpen(false); }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <span>Contact Support</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
            
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <a
                href={`tel:${settings.direct_call_number || '01352313984'}`}
                className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                <span>Direct Call: {settings.direct_call_number || '01352313984'}</span>
              </a>
              <a
                href="/admin"
                onClick={(e) => { e.preventDefault(); navigate('admin'); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 py-2 bg-blue-950/60 border border-blue-800/60 text-blue-300 rounded-lg text-xs font-semibold"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Management Panel</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

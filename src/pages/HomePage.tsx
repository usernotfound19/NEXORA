import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { ApiService } from '../services/api';
import { ArrowRight, ShieldCheck, Zap, Watch, Headphones, BatteryCharging, Gamepad2, ChevronRight, Award, Truck, Clock } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, categories } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getProducts()
      .then(prods => {
        if (prods && prods.length) setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = products.filter(p => p.is_featured);
  const trendingProducts = products.filter(p => p.is_trending);
  const bestSellers = [...products].sort((a, b) => b.sales_count - a.sales_count).slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION (1440px desktop balanced presence) */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-12 lg:pb-20 border-b border-slate-800/80 bg-gradient-to-b from-[#0b101b] via-[#0f172a] to-[#0b101b]">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Engineered for Bangladesh Tech Enthusiasts</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight">
                Authentic High-Tech Gadgets, Delivered to Your Doorstep.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Experience aerospace-grade smartwatches, studio-tuned ANC earbuds, and transparent cyberpunk power banks. Verified bKash, Nagad, and Cash on Delivery across all 64 districts.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('products')}
                  className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('products', { category: 'cat-wearables' })}
                  className="flex items-center gap-2 px-5 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-all hover:text-white"
                >
                  <span>Smartwatches &amp; Wearables</span>
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs text-slate-400">
                <div>
                  <div className="text-white font-bold text-base tabular-nums">24–48h</div>
                  <div>Dhaka Express Delivery</div>
                </div>
                <div>
                  <div className="text-white font-bold text-base tabular-nums">100% Genuine</div>
                  <div>Official Warranty</div>
                </div>
                <div>
                  <div className="text-white font-bold text-base tabular-nums">bKash &amp; COD</div>
                  <div>Zero Risk Payment</div>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
                <img
                  src="/src/assets/images/hero_gadgets_showcase_1791985482814.jpg"
                  alt="NEXORA TECH Premium Gadget Collection"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Featured Series</span>
                    <span className="text-xs font-bold text-white">Titan &amp; Cyber Collection 2026</span>
                  </div>
                  <button
                    onClick={() => navigate('products')}
                    className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View Series
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CATEGORIES BROWSER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse by Category</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Explore authentic tech gadgets engineered for high performance</p>
          </div>
          <button
            onClick={() => navigate('categories')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>View All ({categories.length || 6})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat, idx) => {
            const icons = [Watch, Headphones, BatteryCharging, Zap, Gamepad2, Award];
            const IconComponent = icons[idx % icons.length];
            return (
              <div
                key={cat.id}
                onClick={() => navigate('products', { category: cat.id })}
                className="group p-4 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/90 cursor-pointer transition-all duration-200 flex flex-col items-center text-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-blue-600/20 group-hover:text-blue-400 text-slate-300 flex items-center justify-center transition-colors">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Explore</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. TRENDING GADGETS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
              <span>Hot Drops</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Trending in Bangladesh</h2>
          </div>
          <button
            onClick={() => navigate('products', { sort: 'newest' })}
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>Browse All Gadgets</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingProducts.slice(0, 3).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. PROMOTIONAL CAMPAIGN BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-800/40 p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="inline-block px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-xs font-bold uppercase tracking-wider">
              Launch Celebration Offer
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Get 10% Instant Discount on Your Next Gadget
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Use promo code <code className="bg-slate-950/80 px-2 py-1 rounded text-blue-300 font-mono font-bold">NEXORA10</code> during checkout on orders over ৳1,500. Genuine gear with verified warranty support.
            </p>
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => navigate('products')}
                className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all hover:scale-105"
              >
                Shop Now with Discount
              </button>
            </div>
          </div>
          {/* Subtle graphic accent */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />
        </div>
      </section>

      {/* 5. BEST SELLERS (Calculated from Real Order Data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <span>Verified Sales</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Best Sellers</h2>
          </div>
          <button
            onClick={() => navigate('products', { sort: 'bestselling' })}
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>See Best Sellers</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. STORE BENEFITS / WHY NEXORA TECH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="p-8 sm:p-12 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">The NEXORA TECH Difference</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              We eliminate counterfeit risks and broken dropshipping promises with genuine warranties and responsive local support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Nationwide COD Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive and inspect your parcel anywhere in Bangladesh. Pay cash upon delivery to the courier or verify via bKash/Nagad.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Genuine Brand Warranty</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every gadget comes with an official warranty policy. No grey-market duplicates or cloned batteries.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Direct Phone &amp; WhatsApp</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect directly with our team via direct call (01352313984) or WhatsApp (01577215469) for instant support.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

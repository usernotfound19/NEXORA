import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Phone, MessageCircle, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, navigate, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      showToast('Thank you for subscribing to NEXORA TECH updates and VIP offers!', 'success');
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#070b14] border-t border-slate-800/80 text-slate-400 text-xs">
      
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-slate-800/60 bg-[#090f1a] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-xs">100% Genuine Gear</h4>
              <p className="text-[11px] text-slate-400">Authentic tech with brand warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-xs">Express Delivery</h4>
              <p className="text-[11px] text-slate-400">24-48 hrs in Dhaka, 2-4 days nationwide</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-xs">7-Day Easy Replacement</h4>
              <p className="text-[11px] text-slate-400">Hassle-free claims for defects</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold text-xs">bKash, Nagad &amp; COD</h4>
              <p className="text-[11px] text-slate-400">Verified manual &amp; cash on delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-wider text-white">
                {settings.store_name || 'NEXORA TECH'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Bangladesh’s premier destination for high-performance smartwatches, wireless ANC audio, cyberpunk power banks, and curated dropshipped everyday innovations.
            </p>

            {/* Newsletter */}
            <form onSubmit={handleNewsletter} className="pt-2">
              <p className="text-xs font-semibold text-slate-300 mb-2">Subscribe for VIP Drops &amp; Exclusive Flash Coupons</p>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                >
                  Join
                </button>
              </div>
            </form>
          </div>

          {/* Catalog Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product Catalog</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('products')} className="hover:text-blue-400 transition-colors">
                  All Products
                </button>
              </li>
              <li>
                <button onClick={() => navigate('categories')} className="hover:text-blue-400 transition-colors">
                  All Categories
                </button>
              </li>
              <li>
                <button onClick={() => navigate('products', { category: 'cat-wearables' })} className="hover:text-blue-400 transition-colors">
                  Smartwatches &amp; Wearables
                </button>
              </li>
              <li>
                <button onClick={() => navigate('products', { category: 'cat-audio' })} className="hover:text-blue-400 transition-colors">
                  Wireless Earbuds &amp; Audio
                </button>
              </li>
              <li>
                <button onClick={() => navigate('products', { category: 'cat-power' })} className="hover:text-blue-400 transition-colors">
                  Cyber Power Banks &amp; Chargers
                </button>
              </li>
              <li>
                <button onClick={() => navigate('products', { category: 'cat-gaming' })} className="hover:text-blue-400 transition-colors">
                  Computer &amp; Gaming Gear
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Policies &amp; Support</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('track-order')} className="hover:text-blue-400 transition-colors">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => navigate('shipping-policy')} className="hover:text-blue-400 transition-colors">
                  Shipping &amp; Delivery Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('returns-policy')} className="hover:text-blue-400 transition-colors">
                  Returns &amp; Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('payment-info')} className="hover:text-blue-400 transition-colors">
                  bKash &amp; Payment Methods
                </button>
              </li>
              <li>
                <button onClick={() => navigate('faq')} className="hover:text-blue-400 transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => navigate('privacy-policy')} className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('terms')} className="hover:text-blue-400 transition-colors">
                  Terms &amp; Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Official Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Official Contacts</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-slate-500">Direct Helpline:</span>
                  <a href={`tel:${settings.direct_call_number || '01352313984'}`} className="text-slate-200 hover:text-blue-400 font-medium">
                    {settings.direct_call_number || '01352313984'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-slate-500">WhatsApp Support:</span>
                  <a
                    href={`https://wa.me/880${(settings.whatsapp_number || '01577215469').replace(/\D/g, '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-200 hover:text-emerald-400 font-medium"
                  >
                    {settings.whatsapp_number || '01577215469'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-slate-500">Store Owner Email:</span>
                  <a href={`mailto:${settings.store_owner_email || 'tanjilur202@gmail.com'}`} className="text-slate-200 hover:text-blue-400">
                    {settings.store_owner_email || 'tanjilur202@gmail.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-slate-500">Headquarters:</span>
                  <span className="text-slate-300">Dhaka, Bangladesh</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Admin Portal Link */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {settings.store_name || 'NEXORA TECH'}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('about')} className="hover:text-slate-300">About Us</button>
            <button onClick={() => navigate('contact')} className="hover:text-slate-300">Contact</button>
            <button onClick={() => navigate('terms')} className="hover:text-slate-300">Terms</button>
            <button onClick={() => navigate('privacy-policy')} className="hover:text-slate-300">Privacy</button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => navigate('admin')}
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Admin Management Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

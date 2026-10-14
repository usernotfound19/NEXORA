import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist, navigate } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products) {
          setProducts(data.products.filter((p: Product) => wishlist.includes(p.id)));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wishlist]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Wishlist</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {wishlist.length} {wishlist.length === 1 ? 'saved gadget' : 'saved gadgets'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-slate-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-[#0f172a] rounded-2xl border border-slate-800 space-y-4 max-w-lg mx-auto">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Your wishlist is currently empty</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Save smartwatches, earbuds, and accessories by clicking the heart icon on any product card.
          </p>
          <button
            onClick={() => navigate('products')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

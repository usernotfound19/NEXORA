import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate, addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);

  const discountPercent = product.original_price > product.selling_price
    ? Math.round(((product.original_price - product.selling_price) / product.original_price) * 100)
    : 0;

  return (
    <div className="group relative bg-[#0f172a] rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/20 flex flex-col overflow-hidden">
      
      {/* Product Image Container */}
      <div
        onClick={() => navigate('product-detail', { slug: product.slug, id: product.id })}
        className="relative aspect-[4/3] bg-slate-900 overflow-hidden cursor-pointer"
      >
        <img
          src={product.primary_image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg';
          }}
        />

        {/* Clean subtle text discount tag (Zero-Pill discipline: unboxed subtle text badge) */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-rose-600/90 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded tracking-wide">
            -{discountPercent}%
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md transition-colors ${
            wishlisted
              ? 'bg-rose-500/90 text-white'
              : 'bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Alert */}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <div className="absolute bottom-2.5 left-2.5 bg-amber-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded">
            Only {product.stock_quantity} left
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Stock Status: clean unboxed metadata */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[11px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-semibold text-slate-300">4.9</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => navigate('product-detail', { slug: product.slug, id: product.id })}
            className="text-sm font-semibold text-slate-100 hover:text-blue-400 cursor-pointer line-clamp-2 transition-colors"
          >
            {product.title}
          </h3>

          {/* Short description preview if present */}
          {product.short_description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {product.short_description}
            </p>
          )}
        </div>

        {/* Pricing & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-white tabular-nums">
                ৳{product.selling_price.toLocaleString('en-BD')}
              </span>
              {product.original_price > product.selling_price && (
                <span className="text-xs text-slate-500 line-through tabular-nums">
                  ৳{product.original_price.toLocaleString('en-BD')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Cash on Delivery Available</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('product-detail', { slug: product.slug, id: product.id })}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="View Details"
              aria-label="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => addToCart(product, 1)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Add to Bag"
              aria-label="Add to Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

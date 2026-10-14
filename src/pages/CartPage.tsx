import React from 'react';
import { useStore } from '../context/StoreContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    shippingFee,
    deliveryArea,
    setDeliveryArea,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    discountAmount,
    cartTotal,
    navigate,
    settings,
  } = useStore();

  const [couponInput, setCouponInput] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await applyCouponCode(couponInput.trim());
    setCouponLoading(false);
  };

  const freeThreshold = Number(settings.free_shipping_threshold || 5000);
  const remainingForFree = Math.max(0, freeThreshold - cartSubtotal);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-400">
          Explore authentic gadgets and top technology in our catalog.
        </p>
        <button
          onClick={() => navigate('products')}
          className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Shopping Cart</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Review your items before proceeding to checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart Items Table */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4 shadow-xl">
          
          {remainingForFree > 0 ? (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex justify-between items-center">
              <span>Add <strong>৳{remainingForFree.toLocaleString('en-BD')}</strong> more for Free Nationwide Delivery!</span>
              <span className="text-blue-400 font-semibold">{Math.round((cartSubtotal / freeThreshold) * 100)}%</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>You have unlocked <strong>Free Nationwide Delivery</strong>!</span>
            </div>
          )}

          <div className="divide-y divide-slate-800">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.variantLabel}`} className="py-4 flex gap-4 items-center">
                <img
                  src={item.product.primary_image}
                  alt={item.product.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-slate-800 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h3
                    onClick={() => navigate('product-detail', { slug: item.product.slug, id: item.product.id })}
                    className="text-xs sm:text-sm font-semibold text-white hover:text-blue-400 cursor-pointer truncate"
                  >
                    {item.product.title}
                  </h3>
                  {item.variantLabel && (
                    <span className="text-[11px] text-slate-400 block mt-0.5">{item.variantLabel}</span>
                  )}
                  <div className="text-xs font-bold text-blue-400 mt-1 tabular-nums">
                    ৳{item.product.selling_price.toLocaleString('en-BD')} each
                  </div>
                </div>

                {/* Qty */}
                <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                  <button
                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.variantLabel)}
                    className="p-1.5 text-slate-400 hover:text-white"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2.5 text-xs font-semibold tabular-nums text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.variantLabel)}
                    className="p-1.5 text-slate-400 hover:text-white"
                    disabled={item.quantity >= item.product.stock_quantity}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Total */}
                <div className="text-right min-w-[70px]">
                  <span className="text-sm font-bold text-white tabular-nums block">
                    ৳{(item.product.selling_price * item.quantity).toLocaleString('en-BD')}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.productId, item.variantLabel)}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors mt-1 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Summary Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-xl sticky top-24">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Cart Summary</h2>

          {/* Delivery Region Switcher */}
          <div className="space-y-2 text-xs">
            <span className="text-slate-400 block font-semibold">Delivery Region:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryArea('dhaka')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${deliveryArea === 'dhaka' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
              >
                Inside Dhaka (৳70)
              </button>
              <button
                onClick={() => setDeliveryArea('outside')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${deliveryArea === 'outside' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
              >
                Outside Dhaka (৳130)
              </button>
            </div>
          </div>

          {/* Coupon */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-lg text-emerald-300">
                <span>Applied: <strong>{appliedCoupon.code}</strong> (-৳{discountAmount})</span>
                <button onClick={removeCoupon} className="text-slate-400 hover:text-rose-400 underline">Remove</button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon (e.g. NEXORA10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Pricing totals */}
          <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="tabular-nums text-slate-200">৳{cartSubtotal.toLocaleString('en-BD')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping Fee</span>
              <span className="tabular-nums text-slate-200">
                {shippingFee === 0 ? <span className="text-emerald-400 font-semibold">FREE</span> : `৳${shippingFee}`}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon Discount</span>
                <span className="tabular-nums">-৳{discountAmount.toLocaleString('en-BD')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
              <span>Total Payable</span>
              <span className="text-blue-400 tabular-nums">৳{cartTotal.toLocaleString('en-BD')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('checkout')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

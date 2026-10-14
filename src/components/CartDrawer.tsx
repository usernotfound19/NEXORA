import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
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

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await applyCouponCode(couponInput.trim());
    setCouponLoading(false);
  };

  const freeThreshold = Number(settings.free_shipping_threshold || 5000);
  const remainingForFreeShipping = Math.max(0, freeThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f172a] border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Your Shopping Bag ({cart.length})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          {cart.length > 0 && (
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
              {remainingForFreeShipping > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span>Add <strong>৳{remainingForFreeShipping.toLocaleString('en-BD')}</strong> more for Free Delivery!</span>
                    <span className="font-semibold text-blue-400">{Math.round((cartSubtotal / freeThreshold) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (cartSubtotal / freeThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>You unlocked <strong>Free Nationwide Delivery</strong>!</span>
                </div>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] text-slate-600 mb-3" />
                <p className="text-base font-medium text-slate-300">Your bag is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Discover authentic smartwatches, earbuds, and premium gadgets in our catalog.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('products');
                  }}
                  className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Explore Gadgets
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantLabel}`}
                  className="flex gap-3.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <img
                    src={item.product.primary_image}
                    alt={item.product.title}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 object-cover rounded-md bg-slate-800 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{item.product.title}</h4>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variantLabel)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.variantLabel && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.variantLabel}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <div className="flex items-center border border-slate-700 rounded-md bg-slate-950">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.variantLabel)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold tabular-nums text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.variantLabel)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          disabled={item.quantity >= item.product.stock_quantity}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-400 tabular-nums">
                          ৳{(item.product.selling_price * item.quantity).toLocaleString('en-BD')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 space-y-3">
              
              {/* Delivery Area Switcher */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Delivery Region:</span>
                <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                  <button
                    onClick={() => setDeliveryArea('dhaka')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${deliveryArea === 'dhaka' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Dhaka (৳70)
                  </button>
                  <button
                    onClick={() => setDeliveryArea('outside')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${deliveryArea === 'outside' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Outside (৳130)
                  </button>
                </div>
              </div>

              {/* Coupon Form */}
              <div className="pt-1">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg text-xs text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Applied: <strong>{appliedCoupon.code}</strong> (-৳{discountAmount})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-rose-400 text-[11px] underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code (e.g. NEXORA10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 pt-2 text-xs border-t border-slate-800/60">
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
                    <span>Discount</span>
                    <span className="tabular-nums">-৳{discountAmount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                  <span>Total Payable</span>
                  <span className="text-blue-400 tabular-nums">৳{cartTotal.toLocaleString('en-BD')}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('checkout');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

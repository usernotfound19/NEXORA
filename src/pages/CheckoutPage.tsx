import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, CheckCircle2, AlertCircle, Phone, ArrowRight, ShoppingBag, Truck, Lock } from 'lucide-react';

const BD_DIVISIONS = [
  {
    name: 'Dhaka',
    districts: ['Dhaka City', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Rajbari', 'Shariatpur']
  },
  {
    name: 'Chittagong',
    districts: ['Chittagong City', 'Cox\'s Bazar', 'Comilla', 'Feni', 'Brahmanbaria', 'Noakhali', 'Chandpur', 'Lakshmipur', 'Rangamati', 'Khagrachhari', 'Bandarban']
  },
  {
    name: 'Sylhet',
    districts: ['Sylhet Sadar', 'Moulvibazar', 'Habiganj', 'Sunamganj']
  },
  {
    name: 'Rajshahi',
    districts: ['Rajshahi City', 'Bogra', 'Pabna', 'Sirajganj', 'Naogaon', 'Natore', 'Chapai Nawabganj', 'Joypurhat']
  },
  {
    name: 'Khulna',
    districts: ['Khulna City', 'Jessore', 'Kushtia', 'Satkhira', 'Bagerhat', 'Jhenaidah', 'Chuadanga', 'Magura', 'Meherpur', 'Narail']
  },
  {
    name: 'Barishal',
    districts: ['Barishal City', 'Patuakhali', 'Bhola', 'Pirojpur', 'Barguna', 'Jhalokati']
  },
  {
    name: 'Rangpur',
    districts: ['Rangpur City', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon']
  },
  {
    name: 'Mymensingh',
    districts: ['Mymensingh Sadar', 'Jamalpur', 'Netrokona', 'Sherpur']
  }
];

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    shippingFee,
    deliveryArea,
    setDeliveryArea,
    appliedCoupon,
    discountAmount,
    cartTotal,
    clearCart,
    settings,
    navigate,
    showToast,
  } = useStore();

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('Dhaka');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka City');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'bKash' | 'Nagad'>('Cash on Delivery');
  const [trxId, setTrxId] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Division change
  const handleDivisionChange = (divisionName: string) => {
    setSelectedDivision(divisionName);
    const divObj = BD_DIVISIONS.find(d => d.name === divisionName);
    if (divObj && divObj.districts.length > 0) {
      setSelectedDistrict(divObj.districts[0]);
    }
    // Update delivery area for fee calculation
    if (divisionName === 'Dhaka') {
      setDeliveryArea('dhaka');
    } else {
      setDeliveryArea('outside');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('Your shopping cart is empty.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    // Bangladesh phone validation
    const cleanPhone = customerPhone.replace(/[\s-]/g, '');
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 11-digit Bangladesh phone number (e.g. 01712345678).');
      return;
    }

    if (!deliveryAddress.trim()) {
      setErrorMessage('Please provide your complete delivery address.');
      return;
    }

    if ((paymentMethod === 'bKash' || paymentMethod === 'Nagad') && !trxId.trim()) {
      setErrorMessage(`Please enter your ${paymentMethod} Transaction ID (TrxID) after sending payment.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        division: selectedDivision,
        district: selectedDistrict,
        address: deliveryAddress.trim(),
        postalCode: postalCode.trim() || undefined,
        notes: deliveryNotes.trim() || undefined,
        items: cart.map(item => ({
          productId: item.productId,
          title: item.product.title,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
          price: item.product.selling_price,
        })),
        paymentMethod,
        trxId: trxId.trim() || undefined,
        couponCode: appliedCoupon?.code,
      };

      const { ApiService } = await import('../services/api');
      const data = await ApiService.createOrder(payload);

      if (data.success && data.orderNumber) {
        setOrderSuccess({
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.paymentMethod === 'Cash on Delivery' ? 'pending_cod' : 'awaiting_verification',
          phone: cleanPhone,
        });
        clearCart();
        showToast(`Order #${data.orderNumber} placed successfully!`, 'success');
      } else {
        setErrorMessage(data.error || 'Failed to place order. Please check your details.');
      }
    } catch {
      setErrorMessage('Network connection error while placing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully created, render confirmation view
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-8 sm:p-10 rounded-2xl bg-[#0f172a] border border-emerald-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Order Confirmed!</h1>
            <p className="text-sm text-slate-300">
              Thank you, <strong>{customerName}</strong>. Your order has been registered in the database.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-left max-w-md mx-auto space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Order Number:</span>
              <span className="text-blue-400 font-bold font-mono text-sm">{orderSuccess.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Payable:</span>
              <span className="text-white font-bold tabular-nums">৳{orderSuccess.totalAmount.toLocaleString('en-BD')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Method:</span>
              <span className="text-slate-200">{orderSuccess.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivery Contact:</span>
              <span className="text-slate-200 font-mono">{orderSuccess.phone}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Our fulfillment team will call you to confirm dispatch. You can track parcel updates in real-time on our tracking page.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('track-order', { orderNumber: orderSuccess.orderNumber, phone: orderSuccess.phone })}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              Track Order Status
            </button>
            <button
              onClick={() => navigate('home')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Your Shopping Bag is Empty</h2>
        <p className="text-xs text-slate-400">
          You don't have any items to checkout. Browse our gadget collections to add authentic products.
        </p>
        <button
          onClick={() => navigate('products')}
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  const currentDistricts = BD_DIVISIONS.find(d => d.name === selectedDivision)?.districts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Checkout</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Fast guest checkout with Cash on Delivery or bKash / Nagad verification
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Shipping & Payment Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customer & Delivery Information */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">1. Delivery Address</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sadman Rafid"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Bangladesh Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX (11 Digits)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  maxLength={11}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Division *</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {BD_DIVISIONS.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">District / Area *</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {currentDistricts.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Street Address *</label>
              <textarea
                rows={2}
                placeholder="House No, Road No, Area / Thana, Landmark"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address (Optional for e-receipt)</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Postal Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1216"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Call before delivery, deliver after 3 PM"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

          </div>

          {/* Payment Method Selection */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">2. Payment Method</h2>

            <div className="space-y-3">
              
              {/* Option 1: Cash on Delivery */}
              <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'Cash on Delivery' ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                      className="text-blue-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Cash on Delivery (COD)</span>
                      <span className="text-[11px] text-slate-400">Pay cash in hand when the courier delivers your parcel</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Most Popular
                  </span>
                </div>
              </label>

              {/* Option 2: bKash */}
              <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'bKash' ? 'bg-pink-950/30 border-pink-500 ring-1 ring-pink-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'bKash'}
                    onChange={() => setPaymentMethod('bKash')}
                    className="text-pink-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">bKash Personal Payment</span>
                    <span className="text-[11px] text-slate-400">Direct send money to <strong>{settings.bkash_payment_number || '01577215469'}</strong></span>
                  </div>
                </div>

                {paymentMethod === 'bKash' && (
                  <div className="mt-3 pt-3 border-t border-pink-900/40 text-xs space-y-2">
                    <p className="text-pink-200 text-[11px] leading-relaxed">
                      {settings.bkash_instructions || `Please send money of ৳${cartTotal.toLocaleString('en-BD')} to our Personal bKash number 01577215469. After sending, enter your Transaction ID (TrxID) below for verification.`}
                    </p>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">bKash Transaction ID (TrxID) *</label>
                      <input
                        type="text"
                        placeholder="e.g. BL89A1209X"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-pink-800/60 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono tracking-wider"
                      />
                    </div>
                  </div>
                )}
              </label>

              {/* Option 3: Nagad */}
              <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'Nagad' ? 'bg-orange-950/30 border-orange-500 ring-1 ring-orange-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'Nagad'}
                    onChange={() => setPaymentMethod('Nagad')}
                    className="text-orange-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Nagad Personal Payment</span>
                    <span className="text-[11px] text-slate-400">Direct send money to <strong>{settings.nagad_payment_number || '01577215469'}</strong></span>
                  </div>
                </div>

                {paymentMethod === 'Nagad' && (
                  <div className="mt-3 pt-3 border-t border-orange-900/40 text-xs space-y-2">
                    <p className="text-orange-200 text-[11px] leading-relaxed">
                      {settings.nagad_instructions || `Please send money of ৳${cartTotal.toLocaleString('en-BD')} to our Personal Nagad number 01577215469. After sending, enter your Transaction ID (TrxID) below for instant verification.`}
                    </p>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nagad Transaction ID (TrxID) *</label>
                      <input
                        type="text"
                        placeholder="e.g. NG99182301"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-orange-800/60 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono tracking-wider"
                      />
                    </div>
                  </div>
                )}
              </label>

            </div>

          </div>

        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-xl sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">Order Summary</h2>
            <span className="text-xs text-slate-400">{cart.length} items</span>
          </div>

          {/* Items Preview */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.variantLabel}`} className="flex items-center gap-3 text-xs">
                <img
                  src={item.product.primary_image}
                  alt={item.product.title}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded-md bg-slate-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-200 truncate">{item.product.title}</h4>
                  <div className="text-[11px] text-slate-400">
                    Qty: {item.quantity} {item.variantLabel ? `· ${item.variantLabel}` : ''}
                  </div>
                </div>
                <span className="font-semibold text-white tabular-nums">
                  ৳{(item.product.selling_price * item.quantity).toLocaleString('en-BD')}
                </span>
              </div>
            ))}
          </div>

          {/* Price Calculation */}
          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="tabular-nums text-slate-200">৳{cartSubtotal.toLocaleString('en-BD')}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Shipping Fee ({selectedDivision})</span>
              <span className="tabular-nums text-slate-200">
                {shippingFee === 0 ? <span className="text-emerald-400 font-semibold">FREE</span> : `৳${shippingFee}`}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({appliedCoupon?.code})</span>
                <span className="tabular-nums">-৳{discountAmount.toLocaleString('en-BD')}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
              <span>Total Payable</span>
              <span className="text-blue-400 tabular-nums">৳{cartTotal.toLocaleString('en-BD')}</span>
            </div>
          </div>

          {/* Place Order CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isSubmitting ? 'Registering Order...' : 'Confirm Order Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Security guarantee */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted submission · Instant SMS &amp; Email notification</span>
          </div>

        </div>

      </form>

    </div>
  );
};

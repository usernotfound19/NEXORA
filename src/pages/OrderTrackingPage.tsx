import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, Package, CheckCircle2, Clock, Truck, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { pageParams } = useStore();
  const [orderNumber, setOrderNumber] = useState(pageParams.orderNumber || '');
  const [phone, setPhone] = useState(pageParams.phone || '');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please provide both your Order Number and Bangladesh Phone Number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { ApiService } = await import('../services/api');
      const order = await ApiService.trackOrder(orderNumber.trim(), phone.trim());
      if (order) {
        setOrderData(order);
      } else {
        setOrderData(null);
        setError('No matching order found. Please verify your Order Number and Phone.');
      }
    } catch {
      setError('Unable to reach order tracking service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageParams.orderNumber && pageParams.phone) {
      handleTrack();
    }
  }, [pageParams]);

  // Timeline Steps Definition
  const STEPS = [
    { title: 'Order Placed', desc: 'Received in database' },
    { title: 'Payment Verified', desc: 'bKash/Nagad or COD confirmed' },
    { title: 'Processing', desc: 'Quality checked & packed' },
    { title: 'Shipped', desc: 'Handed to courier partner' },
    { title: 'Delivered', desc: 'Signed & received' }
  ];

  const getStepStatus = (stepIndex: number, currentStatus: string) => {
    const statusMap: Record<string, number> = {
      'Order Placed': 0,
      'Awaiting Payment Verification': 0,
      'Payment Verified': 1,
      'Order Confirmed': 1,
      'Processing': 2,
      'Shipped': 3,
      'Out for Delivery': 3,
      'Delivered': 4,
      'Cancelled': -1,
    };

    const currentLevel = statusMap[currentStatus] ?? 0;
    if (currentStatus === 'Cancelled') return 'cancelled';
    if (stepIndex < currentLevel) return 'completed';
    if (stepIndex === currentLevel) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Live Order Tracking</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your Order Number and phone number to monitor parcel dispatch and delivery timeline.
        </p>
      </div>

      {/* Query Form */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl max-w-2xl mx-auto">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Order Number *</label>
              <input
                type="text"
                placeholder="e.g. NXR-10821"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Phone *</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching Parcel Status...' : 'Track Parcel Now'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}
      </div>

      {/* Tracking Results View */}
      {orderData && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-8 shadow-2xl">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">Order #{orderData.order_number}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-950 border border-blue-800 text-blue-300">
                  {orderData.order_status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Placed on {new Date(orderData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Total Amount</span>
              <span className="text-lg font-bold text-blue-400 tabular-nums">
                ৳{orderData.total_amount.toLocaleString('en-BD')}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {orderData.payment_method} ({orderData.payment_status})
              </span>
            </div>
          </div>

          {/* Visual Timeline */}
          {orderData.order_status === 'Cancelled' ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300 text-xs text-center">
              This order was marked as <strong>Cancelled</strong>. If you made an advance bKash/Nagad payment, our finance team will process a full refund to your wallet within 48 hours.
            </div>
          ) : (
            <div className="py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Fulfillment Progress</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {STEPS.map((step, idx) => {
                  const status = getStepStatus(idx, orderData.order_status);
                  return (
                    <div key={idx} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          status === 'completed'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : status === 'current'
                            ? 'bg-blue-950 border-blue-400 text-blue-400 animate-pulse'
                            : 'bg-slate-900 border-slate-800 text-slate-600'
                        }`}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-xs font-bold font-mono">{idx + 1}</span>
                        )}
                      </div>
                      <div className="text-left sm:text-center">
                        <span className={`text-xs font-bold block ${status === 'upcoming' ? 'text-slate-500' : 'text-white'}`}>
                          {step.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Courier & Dispatch Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Courier Logistics</span>
              </h4>
              <p className="text-slate-300">
                <strong>Courier Partner:</strong> {orderData.courier_name || 'Steadfast / RedX Logistics (Pending Assignment)'}
              </p>
              {orderData.tracking_number && (
                <p className="text-slate-300">
                  <strong>Consignment Code:</strong> <span className="font-mono text-blue-400 font-bold">{orderData.tracking_number}</span>
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Destination</span>
              </h4>
              <p className="text-slate-300">
                <strong>Recipient:</strong> {orderData.customer_name} ({orderData.customer_phone})
              </p>
              <p className="text-slate-400 leading-relaxed">
                {orderData.address}, {orderData.district}, {orderData.division}
              </p>
            </div>
          </div>

          {/* Order Items breakdown */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Items in this Package</h4>
            <div className="divide-y divide-slate-800 text-xs">
              {orderData.items && orderData.items.map((item: any, i: number) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt=""
                        className="w-10 h-10 object-cover rounded bg-slate-800"
                        onError={(e) => { (e.currentTarget as any).src = '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg'; }}
                      />
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">{item.product_title}</span>
                      {item.variant_label && <span className="text-[11px] text-slate-500">{item.variant_label}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-400">Qty: {item.quantity}</span>
                    <span className="ml-3 font-semibold text-white tabular-nums">৳{item.total_price.toLocaleString('en-BD')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

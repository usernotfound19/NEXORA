import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Phone, MessageCircle, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { settings, navigate } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">About {settings.store_name || 'NEXORA TECH'}</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Revolutionizing Gadget Shopping in Bangladesh
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Founded with a mission to eradicate low-quality counterfeits and unreliable dropshipping practices, <strong>{settings.store_name || 'NEXORA TECH'}</strong> delivers premium, tested, and genuinely warranted tech gadgets directly to customers across all 64 districts of Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white">Direct Sourcing &amp; Quality Control</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every smartwatch, wireless audio set, and power bank is bench-tested before shipping. We inspect battery health, charging circuits, firmware stability, and physical integrity to ensure zero surprises out of the box.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white">Genuine Local Customer Care</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No automated bot deflection loops. Our local customer support team is reachable directly via phone call at <a href={`tel:${settings.direct_call_number || '01352313984'}`} className="text-blue-400 font-semibold">{settings.direct_call_number || '01352313984'}</a> and WhatsApp at <a href={`https://wa.me/880${(settings.whatsapp_number || '01577215469').replace(/\D/g, '').replace(/^0/, '')}`} className="text-emerald-400 font-semibold">{settings.whatsapp_number || '01577215469'}</a>.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Our Commitments</h3>
        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
          <li>100% authentic electronic products with official replacement warranty.</li>
          <li>Fast delivery: 24–48 hours within Dhaka, 2–4 business days across all other divisions.</li>
          <li>Customer security: Inspection on delivery with Cash on Delivery and verified bKash/Nagad options.</li>
          <li>Honest pricing: No hidden service charges, inflated shipping rates, or artificial discount traps.</li>
        </ul>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSent(true);
    showToast('Your message has been received! Our support team will respond shortly.', 'success');
  };

  const directCall = settings.direct_call_number || '01352313984';
  const whatsapp = settings.whatsapp_number || '01577215469';
  const ownerEmail = settings.store_owner_email || 'tanjilur202@gmail.com';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Contact Customer Support</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Need help with an order, product compatibility, or warranty claim? Reach our team directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Direct Helpline (Call Now)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Available 10:00 AM – 10:00 PM (Daily)</p>
              <a href={`tel:${directCall}`} className="inline-block mt-2 text-base font-extrabold text-blue-400 hover:text-blue-300 font-mono">
                {directCall}
              </a>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">WhatsApp Support</h3>
              <p className="text-xs text-slate-400 mt-0.5">Instant messaging, photos &amp; order inquiries</p>
              <a
                href={`https://wa.me/880${whatsapp.replace(/\D/g, '').replace(/^0/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-base font-extrabold text-emerald-400 hover:text-emerald-300 font-mono"
              >
                {whatsapp}
              </a>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Official Email</h3>
              <p className="text-xs text-slate-400 mt-0.5">Corporate, warranty, and order inquiries</p>
              <a href={`mailto:${ownerEmail}`} className="inline-block mt-2 text-sm font-bold text-slate-200 hover:text-blue-400">
                {ownerEmail}
              </a>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-white font-bold">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Fulfillment &amp; Dispatch Hub</span>
            </div>
            <p>House 14, Road 7, Sector 3, Uttara, Dhaka 1230, Bangladesh.</p>
          </div>

        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Send Us a Direct Message</h2>

          {sent ? (
            <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Message Dispatched</h3>
              <p className="text-xs text-slate-300">
                Thank you for contacting NEXORA TECH. A representative will contact your phone or WhatsApp shortly.
              </p>
              <button
                onClick={() => { setSent(false); setMessage(''); }}
                className="mt-2 text-xs text-blue-400 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Phone or WhatsApp Number *</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Your Inquiry / Message *</label>
                <textarea
                  rows={4}
                  placeholder="How can we assist you today? Provide order number if applicable."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const { settings } = useStore();
  const faqs = [
    {
      q: 'How long does delivery take across Bangladesh?',
      a: 'Orders inside Dhaka are delivered within 24 to 48 hours. Orders to all other divisions and districts arrive within 2 to 4 business days via our verified courier partners (Steadfast, RedX, Paperfly).'
    },
    {
      q: 'Can I pay via Cash on Delivery (COD)?',
      a: 'Yes, Cash on Delivery is supported nationwide. You can inspect the exterior package and hand the cash directly to the courier upon delivery.'
    },
    {
      q: 'How do I pay using bKash or Nagad?',
      a: `Select bKash or Nagad during checkout. Send the exact payable amount to our official personal wallet number: ${settings.bkash_payment_number || '01577215469'}. Then enter your 10-character Transaction ID (TrxID) in the checkout field. Our administrator verifies the reference before packing.`
    },
    {
      q: 'Are the products 100% genuine?',
      a: 'Yes. We strictly sell authentic electronic hardware sourced directly from certified original equipment manufacturers with manufacturer warranties.'
    },
    {
      q: 'What is your warranty policy?',
      a: 'Every gadget includes a minimum 6-month or 1-year brand warranty, plus a 7-day hassle-free replacement period for manufacturing defects.'
    },
    {
      q: 'How can I track my shipment?',
      a: 'Visit our Track Order page, input your Order Number (e.g., NXR-10821) and your contact phone number to view live parcel updates and courier consignment numbers.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Clear answers regarding orders, payments, shipping, and warranty</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">{faq.q}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShippingPolicyPage: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">Shipping &amp; Delivery Policy</h1>
      
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">1. Delivery Zones &amp; Rates</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Inside Dhaka City:</strong> ৳{settings.shipping_inside_dhaka || '70'} standard delivery fee (24–48 hours delivery).</li>
          <li><strong>Outside Dhaka (All 63 Districts):</strong> ৳{settings.shipping_outside_dhaka || '130'} delivery fee (2–4 business days).</li>
          <li><strong>Free Shipping Threshold:</strong> Orders with a subtotal of ৳{settings.free_shipping_threshold || '5000'} or above receive 100% Free Nationwide Delivery!</li>
        </ul>
      </div>

      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">2. Order Verification &amp; Dispatch</h2>
        <p>Before dispatching Cash on Delivery orders, our customer support team conducts a quick telephone verification to ensure the recipient address and contact number are accurate. Orders confirmed before 3:00 PM are handed to logistics on the same business day.</p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">3. Inspection on Delivery</h2>
        <p>Customers are entitled to inspect the security seal on the external parcel before making final cash payment to the delivery agent. If the package shows signs of tampering, refuse acceptance and notify our helpline immediately at <strong>{settings.direct_call_number || '01352313984'}</strong>.</p>
      </div>
    </div>
  );
};

export const ReturnsPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">Returns &amp; Refund Policy</h1>
    
    <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
      <h2 className="text-base font-bold text-white">7-Day Replacement Guarantee</h2>
      <p>If you receive a defective or damaged product, you can request an instant replacement within 7 calendar days of receipt. The product must include all original packaging, cords, manuals, and accessories.</p>
    </div>

    <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
      <h2 className="text-base font-bold text-white">Refund Procedure</h2>
      <p>If an identical replacement is out of stock, customers will receive a 100% refund processed back to their bKash, Nagad, or bank account within 48 to 72 business hours after receiving the returned parcel.</p>
    </div>
  </div>
);

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">Privacy Policy</h1>
    <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
      <h2 className="text-base font-bold text-white">Customer Data Protection</h2>
      <p>We respect customer privacy. Personal information collected during checkout (name, telephone number, and delivery address) is strictly utilized for parcel fulfillment and dispatch confirmation. We never sell, lease, or monetize customer contact data with third-party advertising brokers.</p>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">Terms and Conditions</h1>
    <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
      <h2 className="text-base font-bold text-white">Platform Usage &amp; Sales Invariants</h2>
      <p>By placing an order on NEXORA TECH, the customer agrees to provide an authentic Bangladesh mobile number and valid delivery destination. Unwarranted repeated refusals of Cash on Delivery orders without defect claims may result in suspension of COD privileges.</p>
    </div>
  </div>
);

export const PaymentInfoPage: React.FC = () => {
  const { settings } = useStore();
  const bkashNum = settings.bkash_payment_number || '01577215469';
  const nagadNum = settings.nagad_payment_number || '01577215469';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Payment Information</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Detailed guide for bKash, Nagad, and Cash on Delivery</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* bKash */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-pink-900/50 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-pink-950/60 text-pink-400 font-bold flex items-center justify-center">
            bKash
          </div>
          <h3 className="text-base font-bold text-white">bKash Personal</h3>
          <p className="text-xs text-slate-400">Official bKash Personal Number:</p>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-pink-400 font-bold text-sm">
            {bkashNum}
          </div>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Open bKash App &gt; Send Money.</li>
            <li>Enter number <strong>{bkashNum}</strong>.</li>
            <li>Enter payable amount.</li>
            <li>Copy the 10-digit <strong>TrxID</strong> and paste at checkout.</li>
          </ol>
        </div>

        {/* Nagad */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-orange-900/50 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-orange-950/60 text-orange-400 font-bold flex items-center justify-center">
            Nagad
          </div>
          <h3 className="text-base font-bold text-white">Nagad Personal</h3>
          <p className="text-xs text-slate-400">Official Nagad Personal Number:</p>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-orange-400 font-bold text-sm">
            {nagadNum}
          </div>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Open Nagad App &gt; Send Money.</li>
            <li>Enter number <strong>{nagadNum}</strong>.</li>
            <li>Enter payable amount.</li>
            <li>Copy <strong>TrxID</strong> and submit at checkout.</li>
          </ol>
        </div>

        {/* Cash on Delivery */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-blue-900/50 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 font-bold flex items-center justify-center">
            COD
          </div>
          <h3 className="text-base font-bold text-white">Cash on Delivery</h3>
          <p className="text-xs text-slate-400">Zero Advance Required:</p>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-semibold">
            Pay at Your Doorstep
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our courier agent collects payment when delivering the parcel. Available across all 64 districts in Bangladesh.
          </p>
        </div>

      </div>
    </div>
  );
};

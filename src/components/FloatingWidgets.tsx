import React from 'react';
import { useStore } from '../context/StoreContext';
import { Phone, MessageCircle } from 'lucide-react';

export const FloatingWidgets: React.FC = () => {
  const { settings, currentPage } = useStore();

  // Hide widgets during checkout to prevent accidental taps/interference
  if (currentPage === 'checkout') {
    return null;
  }

  // Convert local BD phone 01577215469 to +8801577215469 for WhatsApp wa.me link
  const rawWhatsApp = settings.whatsapp_number || '01577215469';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const internationalWhatsApp = cleanWhatsApp.startsWith('0')
    ? '880' + cleanWhatsApp.substring(1)
    : cleanWhatsApp.startsWith('880')
    ? cleanWhatsApp
    : '880' + cleanWhatsApp;

  const prefilledMessage = encodeURIComponent('Hello! I need help with a product or order on NEXORA TECH.');
  const whatsAppUrl = `https://wa.me/${internationalWhatsApp}?text=${prefilledMessage}`;

  // Direct Call number: 01352313984
  const directCallNumber = settings.direct_call_number || '01352313984';
  const telUrl = `tel:${directCallNumber}`;

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      
      {/* 1. Direct Call Floating Button */}
      <div className="pointer-events-auto group relative flex items-center">
        <a
          href={telUrl}
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white rounded-full shadow-xl shadow-blue-900/30 border border-blue-400/30 transition-all hover:scale-105 active:scale-95"
          aria-label={`Call NEXORA TECH helpline directly at ${directCallNumber}`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Phone className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline">
            Call: {directCallNumber}
          </span>
        </a>
        {/* Mobile hover/touch tooltip */}
        <span className="sm:hidden absolute right-full mr-2 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Call: {directCallNumber}
        </span>
      </div>

      {/* 2. Floating WhatsApp Widget */}
      <div className="pointer-events-auto group relative flex items-center">
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-full shadow-xl shadow-emerald-950/40 border border-emerald-300/30 transition-all hover:scale-105 active:scale-95"
          aria-label={`Chat on WhatsApp with NEXORA TECH at ${rawWhatsApp}`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline">
            WhatsApp Support
          </span>
        </a>
        <span className="sm:hidden absolute right-full mr-2 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          WhatsApp: {rawWhatsApp}
        </span>
      </div>

    </div>
  );
};

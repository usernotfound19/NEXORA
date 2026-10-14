import React from 'react';
import { useStore } from '../context/StoreContext';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useStore();

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-4xl font-extrabold text-blue-500 font-mono">404</span>
        <h1 className="text-xl font-bold text-white tracking-tight">Page Not Found</h1>
        <p className="text-xs text-slate-400">
          The gadget page or destination you requested does not exist or has been relocated.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={() => navigate('products')}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
        >
          <span>Explore Catalog</span>
        </button>
      </div>
    </div>
  );
};

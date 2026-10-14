import React from 'react';
import { useStore } from '../context/StoreContext';
import { Watch, Headphones, Zap, Smartphone, Gamepad2, Cpu, ChevronRight } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { categories, navigate } = useStore();

  const iconMap: Record<string, any> = {
    'cat-wearables': Watch,
    'cat-audio': Headphones,
    'cat-power': Zap,
    'cat-smartphones': Smartphone,
    'cat-gaming': Gamepad2,
    'cat-innovative': Cpu,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Product Categories</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore curated collections of authentic technology and innovative gadgetry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = iconMap[cat.id] || Zap;
          return (
            <div
              key={cat.id}
              onClick={() => navigate('products', { category: cat.id })}
              className="group p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/80 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {cat.description || 'Premium certified electronic gadgets with warranty.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-semibold group-hover:text-blue-300">
                <span>View Products</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Filter, SlidersHorizontal, Search, RefreshCw, X } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { categories, pageParams } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(pageParams.category || '');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(pageParams.search || '');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>(pageParams.sort || 'default');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync category or search when pageParams changes
  useEffect(() => {
    if (pageParams.category !== undefined) {
      setSelectedCategory(pageParams.category);
    }
    if (pageParams.search !== undefined) {
      setSearchTerm(pageParams.search);
    }
    if (pageParams.sort !== undefined) {
      setSortBy(pageParams.sort);
    }
  }, [pageParams]);

  const fetchFilteredProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedBrand) params.append('brand', selectedBrand);
    if (searchTerm) params.append('search', searchTerm);
    if (minPrice > 0) params.append('minPrice', String(minPrice));
    if (maxPrice < 10000) params.append('maxPrice', String(maxPrice));
    if (inStockOnly) params.append('inStock', 'true');
    if (sortBy && sortBy !== 'default') params.append('sort', sortBy);

    const filterObj: Record<string, string> = {};
    if (selectedCategory) filterObj.category = selectedCategory;
    if (selectedBrand) filterObj.brand = selectedBrand;
    if (searchTerm) filterObj.search = searchTerm;
    if (inStockOnly) filterObj.inStock = 'true';

    import('../services/api').then(({ ApiService }) => {
      ApiService.getProducts(filterObj)
        .then(prods => {
          let list = prods || [];
          if (minPrice > 0) list = list.filter(p => p.selling_price >= minPrice);
          if (maxPrice < 10000) list = list.filter(p => p.selling_price <= maxPrice);
          if (sortBy === 'price_low_high') list = [...list].sort((a, b) => a.selling_price - b.selling_price);
          else if (sortBy === 'price_high_low') list = [...list].sort((a, b) => b.selling_price - a.selling_price);
          else if (sortBy === 'bestselling') list = [...list].sort((a, b) => b.sales_count - a.sales_count);
          setProducts(list);
        })
        .finally(() => setLoading(false));
    });
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [selectedCategory, selectedBrand, sortBy, inStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredProducts();
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchTerm('');
    setMinPrice(0);
    setMaxPrice(10000);
    setInStockOnly(false);
    setSortBy('default');
  };

  // Distinct brands list
  const availableBrands = ['ApexTech', 'Kinetic Audio', 'VoltFlow', 'AeroGlide', 'NexCharge', 'Lumix'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gadget Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Showing {products.length} {products.length === 1 ? 'gadget' : 'gadgets'}
            {selectedCategory && ` in ${categories.find(c => c.id === selectedCategory)?.name || selectedCategory}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="default">Featured &amp; Recommended</option>
              <option value="bestselling">Best Selling</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block space-y-6 p-5 rounded-xl bg-[#0f172a] border border-slate-800 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <span>Filter Catalog</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search within catalog */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Keywords</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, model, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </form>

          {/* Categories Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Category</label>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${!selectedCategory ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${selectedCategory === cat.id ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Brand</label>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedBrand('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${!selectedBrand ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
              >
                All Brands
              </button>
              {availableBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${selectedBrand === b ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <span>In-Stock Only</span>
            </label>
          </div>

        </aside>

        {/* Products Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-80 bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-[#0f172a] rounded-xl border border-slate-800 space-y-3">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No products found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We couldn't find any gadgets matching your active filters. Try searching for a different keyword or resetting your filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="relative w-80 max-w-full bg-[#0f172a] h-full p-5 overflow-y-auto z-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Filter Products</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="text-slate-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Category</span>
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => { setSelectedCategory(''); setIsMobileFilterOpen(false); }}
                    className={`block w-full text-left py-1.5 px-2 rounded ${!selectedCategory ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                  >
                    All Categories
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCategory(c.id); setIsMobileFilterOpen(false); }}
                      className={`block w-full text-left py-1.5 px-2 rounded ${selectedCategory === c.id ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => { handleResetFilters(); setIsMobileFilterOpen(false); }}
                className="flex-1 py-2.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

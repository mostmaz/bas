import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { Filter, Search, User, Heart, ShoppingCart, Home as HomeIcon, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const { products, t, searchQuery, setSearchQuery, isAppLoading, isProductsLoading } = useShop();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Categories from the user's JSON request (mapped to UI, functionality might need adjustment)
  const categories = [
    { name: "All", selected: true },
    { name: "Sofa", selected: false },
    { name: "Table", selected: false },
    { name: "Light", selected: false }
  ];

  // Filter products (using existing logic but adapted for the new UI)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const lowerQuery = searchQuery.toLowerCase();
      return !searchQuery ||
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery);
    });
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24 font-sans">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            {/* Time placeholder as requested in JSON */}
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">9:41</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back!</h1>
          </div>
          <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <User className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
          <button className="p-3.5 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Banner */}
      <div className="px-6 mt-6">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl shadow-purple-500/20">
          <div className="relative z-10 max-w-[60%]">
            <h2 className="text-2xl font-bold mb-3 leading-tight">Perfect Place<br />to Relax!</h2>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl font-bold">$249</span>
              <span className="text-lg opacity-60 line-through">$399</span>
            </div>
            <div className="mt-3 inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-bold border border-white/10">
              30% OFF
            </div>
          </div>
          {/* Abstract Shape/Image Placeholder */}
          <div className="absolute -right-6 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute right-4 bottom-4 w-24 h-24 bg-gradient-to-tr from-orange-400 to-pink-500 rounded-full opacity-80 blur-xl"></div>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-8 px-6">
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all ${selectedCategory === cat.name
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="mt-4 px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Popular</h3>
          <button className="text-sm text-purple-600 dark:text-purple-400 font-medium">View All</button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {isProductsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            filteredProducts.slice(0, 6).map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';

export const SearchPage: React.FC = () => {
  const { products, t, language } = useShop();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = query.toLowerCase().trim();
      // Admin shortcuts
      if (term === 'admin' || term === 'writ') {
        navigate('/admin');
      } else if (term === 'writbrands') {
        navigate('/admin', { state: { defaultTab: 'brands' } });
      }
    }
  };

  const filteredProducts = products.filter(p => {
    if (!query) return false;
    const lowerQuery = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(lowerQuery) || 
      p.description.toLowerCase().includes(lowerQuery) || 
      p.category.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery)
    );
  });

  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen pt-4 pb-24 px-4 bg-white dark:bg-slate-950 transition-colors">
      {/* Sticky Search Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-30 pb-4 pt-2 -mx-4 px-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            {isRTL ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
          </button>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder={t('searchPlaceholder')}
              className="block w-full pl-10 rtl:pr-10 rtl:pl-3 pr-10 rtl:pl-10 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl leading-5 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-3 rtl:pl-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {query ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('results')} ({filteredProducts.length})</h2>
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Search className="h-16 w-16 mb-4 text-slate-300" />
              <p className="text-slate-500">{t('noMatches')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 px-1">{t('popularSearches')}</h2>
            <div className="flex flex-wrap gap-2">
              {['iPhone 15', 'Samsung', 'Marble', 'Minimalist', 'Eco', 'Urban'].map(term => (
                <button 
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm text-slate-700 dark:text-slate-300 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
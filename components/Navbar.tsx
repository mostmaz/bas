

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, Moon, Sun, Globe, WifiOff, Wifi, Heart } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { cart, toggleCart, theme, toggleTheme, language, toggleLanguage, t, isOnline, supaConnectionError, setSearchQuery, storeLogo } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Debounce search to context
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setSearchQuery]);

  // Clear search when navigating to a new page (optional, but good UX)
  useEffect(() => {
    setSearchValue('');
    setSearchQuery('');
  }, [location.pathname, setSearchQuery]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = searchValue.toLowerCase().trim();
      
      // Hidden Admin Access Commands
      if (term === 'admin' || term === 'writ') {
        navigate('/admin');
        setSearchValue('');
        setSearchQuery(''); // Clear actual search so home page doesn't filter
      } else if (term === 'writbrands') {
        // Direct access to Brands tab
        navigate('/admin', { state: { defaultTab: 'brands' } });
        setSearchValue('');
        setSearchQuery('');
      } else {
        // Normal search behavior is handled by the useEffect debounce, 
        // but hitting Enter can also optionally navigate to Home if not already there
        if (location.pathname !== '/') {
          navigate('/');
        }
      }
    }
  };

  const isAdmin = location.pathname === '/admin';

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
      {/* Connectivity Banner if Offline */}
      {!isOnline && isAdmin && !supaConnectionError && (
        <div className="bg-amber-500 text-white text-xs py-1 text-center font-medium px-4">
          Demo Mode: Configure services/supabase.ts to sync data online.
        </div>
      )}
      
      {/* Database Error Banner - Visible to all during setup */}
      {supaConnectionError && (
        <div 
          className="bg-red-600 text-white text-xs py-1 text-center font-medium px-4 cursor-pointer hover:bg-red-700 transition-colors" 
          onClick={() => navigate('/admin')}
        >
          Database Error: {supaConnectionError} Click here to setup.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => navigate('/')}>
            <img 
              src={storeLogo} 
              alt="BasCavarat Logo"
              className="w-10 h-10 rounded-xl mr-3 rtl:ml-3 rtl:mr-0 object-cover shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-all duration-300"
            />
            <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white transition-colors">BasCavarat</span>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 items-center justify-center px-12">
            {!isAdmin && (
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-4 rtl:pr-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 rtl:pr-11 rtl:pl-4 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-full leading-5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm transition duration-200 shadow-inner"
                  placeholder={t('searchPlaceholder')}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </div>
            )}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <div className="bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                  {t('adminDashboard')}
                </div>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${isOnline && !supaConnectionError ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                  {isOnline && !supaConnectionError ? (
                    <><Wifi className="h-3 w-3" /> Online</>
                  ) : (
                    <><WifiOff className="h-3 w-3" /> Offline</>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors font-medium text-sm w-10 h-10 flex items-center justify-center"
              aria-label="Switch Language"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>

            {isAdmin ? (
               <button 
               onClick={() => navigate('/')}
               className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-2"
             >
               {t('exit')}
             </button>
            ) : (
              <>
                {/* Wishlist Link */}
                <button
                  onClick={() => navigate('/wishlist')}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
                  title="Wishlist"
                >
                  <Heart className="h-6 w-6" />
                </button>

                <button
                  onClick={toggleCart}
                  className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                  <span className="sr-only">Cart</span>
                  <ShoppingBag className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-full shadow-lg shadow-pink-500/30">
                      {totalItems}
                    </span>
                  )}
                </button>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pb-6 pt-2 transition-colors">
           {!isAdmin && (
             <div className="space-y-3">
                <div className="relative mt-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-purple-500 sm:text-sm"
                    placeholder={t('searchPlaceholder')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleSearch}
                  />
                </div>
                <button 
                  onClick={() => { navigate('/wishlist'); setIsMobileMenuOpen(false); }}
                  className="flex items-center w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white font-medium"
                >
                  <Heart className="h-5 w-5 mr-3" /> My Wishlist
                </button>
             </div>
           )}
           {isAdmin && (
             <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-center text-slate-500">
               Status: {isOnline && !supaConnectionError ? 'Online (Synced)' : supaConnectionError ? 'Error: Database Setup Required' : 'Offline (Local Demo)'}
             </div>
           )}
        </div>
      )}
    </nav>
  );
};

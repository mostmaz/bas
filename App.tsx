

import React, { useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ShopProvider, useShop } from './context/ShopContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { AiAssistant } from './components/AiAssistant';
import { Footer } from './components/Footer';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails').then(module => ({ default: module.ProductDetails })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess').then(module => ({ default: module.OrderSuccess })));
const MyOrders = React.lazy(() => import('./pages/MyOrders').then(module => ({ default: module.MyOrders })));
const SearchPage = React.lazy(() => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })));
const Wishlist = React.lazy(() => import('./pages/Wishlist').then(module => ({ default: module.Wishlist })));

// Loading Fallback for Route Transitions
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
  </div>
);

// Initial App Splash Screen
const SplashScreen = ({ logo }: { logo: string }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-500">
    <div className="relative flex items-center justify-center mb-8">
      <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
      <div className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl shadow-pink-500/30 animate-float">
        <img
          src={logo}
          alt="BasCavarat Logo"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 animate-pulse">BasCavarat</h1>
    <div className="flex gap-2">
      <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  // This component is needed to access the context inside the provider
  const { theme, isAppLoading, supaConnectionError, storeLogo } = useShop();
  const { pathname } = useLocation();

  // Automatically scroll to top whenever the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (isAppLoading) {
    return <SplashScreen logo={storeLogo} />;
  }

  // Critical Error State - Blocks App Usage
  if (supaConnectionError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6 text-center transition-colors">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Connection Error</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
          We encountered a problem connecting to the database. The app cannot function without a secure connection.
          <br /><br />
          <span className="text-xs font-mono bg-red-50 dark:bg-red-900/10 p-2 rounded block border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-300">
            {supaConnectionError}
          </span>
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 shadow-xl"
        >
          <RefreshCw className="w-5 h-5" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden flex flex-col font-sans antialiased selection:bg-purple-500 selection:text-white transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-[#FFF8F0] text-slate-900'}`}>
      <Navbar />
      <CartDrawer />
      <main className="flex-grow pb-20"> {/* Added padding-bottom for fixed footer */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <AiAssistant />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ToastProvider>
      <ShopProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </ShopProvider>
    </ToastProvider>
  );
};

export default App;

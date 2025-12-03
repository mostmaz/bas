import React from 'react';
import { Home, Search, ShoppingBag, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleCart, cart } = useShop();

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-40 transition-colors">
      <div className="flex justify-around items-center h-16 px-2 w-full">

        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center w-16 space-y-1 ${isActive('/') ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={() => navigate('/search')}
          className={`flex flex-col items-center justify-center w-16 space-y-1 ${isActive('/search') ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Search className="h-6 w-6" />
          <span className="text-[10px] font-medium">Search</span>
        </button>

        <button
          onClick={toggleCart}
          className="flex flex-col items-center justify-center w-16 space-y-1 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative"
        >
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cart</span>
        </button>

        <button
          onClick={() => navigate('/my-orders')}
          className={`flex flex-col items-center justify-center w-16 space-y-1 ${isActive('/my-orders') ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Package className="h-6 w-6" />
          <span className="text-[10px] font-medium">Orders</span>
        </button>

      </div>
    </div>
  );
};
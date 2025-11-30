
import React from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const Wishlist: React.FC = () => {
  const { products, wishlist, t } = useShop();
  const navigate = useNavigate();

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500 fill-current" />
          My Wishlist
        </h1>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8 animate-in fade-in duration-500">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
             <Heart className="h-12 w-12 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your wishlist is empty</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
            Save items you love to your wishlist and come back to them later.
          </p>
          <Button onClick={() => navigate('/')}>
            {t('startShopping')}
          </Button>
        </div>
      )}
    </div>
  );
};

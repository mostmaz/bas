
import React from 'react';
import { X, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { Button } from './Button';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';

interface ProductQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ isOpen, onClose, product }) => {
  const { addToCart, t } = useShop();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAddToCart = () => {
    addToCart(product);
    onClose();
  };

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-white/5">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-10 p-2 bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 backdrop-blur-md rounded-full text-slate-500 dark:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-slate-100 dark:bg-slate-800">
          <img 
            src={product.image} 
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white dark:bg-slate-900 text-left rtl:text-right">
          <div className="mb-auto">
            <div className="flex items-center justify-between mb-4">
               <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 rounded-full uppercase">
                 {product.category}
               </span>
               <div className="flex items-center text-yellow-400 text-sm">
                 <Star className="h-4 w-4 fill-current" />
                 <span className="ml-1 text-slate-600 dark:text-slate-400 font-medium">{product.rating}</span>
               </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
              {product.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {product.brand} • {t('forDevice')} {product.device}
            </p>
            
            <div className="flex items-baseline gap-2 mb-6">
               {product.salePrice ? (
                 <>
                   <span className="text-3xl font-bold text-red-600 dark:text-red-500">IQD {product.salePrice.toLocaleString()}</span>
                   <span className="text-lg text-slate-400 line-through">IQD {product.price.toLocaleString()}</span>
                 </>
               ) : (
                 <span className="text-3xl font-bold text-slate-900 dark:text-white">IQD {product.price.toLocaleString()}</span>
               )}
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8 line-clamp-4">
              {product.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button onClick={handleAddToCart} size="lg" className="flex-1 shadow-lg shadow-violet-500/25 justify-center">
               <ShoppingBag className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('addToCart')}
            </Button>
            <Button variant="outline" onClick={handleViewDetails} className="flex-1 justify-center group hover:bg-slate-100 dark:hover:bg-slate-800">
               {t('fullDetails')} <ArrowRight className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

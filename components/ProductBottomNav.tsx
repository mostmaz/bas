import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Home, Search, Menu, X, ShoppingBag } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useShop } from '../context/ShopContext';

interface ProductBottomNavProps {
    product: Product;
    selectedVariant: ProductVariant | null;
    currentStock: number;
    onAddToCart: () => void;
}

export const ProductBottomNav: React.FC<ProductBottomNavProps> = ({
    product,
    selectedVariant,
    currentStock,
    onAddToCart
}) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cart, t, toggleCart } = useShop();

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 pb-6 sm:pb-8">
            <div className="max-w-md mx-auto flex gap-0 h-16 shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">

                {/* Action Area (75% -> 3x25%) */}
                <div className="flex-1 flex transition-all duration-300 ease-in-out relative">

                    {/* Add to Cart Button (Visible when menu is closed) */}
                    <div
                        className={`absolute inset-0 transition-transform duration-300 ${isMenuOpen ? '-translate-y-full' : 'translate-y-0'}`}
                    >
                        <button
                            onClick={onAddToCart}
                            disabled={currentStock < 1}
                            className={`w-full h-full flex items-center justify-center gap-2 font-bold text-lg transition-colors
                                ${currentStock < 1
                                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-90 text-white'
                                }`}
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {currentStock < 1 ? t('outOfStock') : t('addToCart')}
                        </button>
                    </div>

                    {/* Navigation Buttons (Visible when menu is open) */}
                    <div
                        className={`absolute inset-0 flex transition-transform duration-300 ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
                    >
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 h-full flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700"
                        >
                            <Home className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{t('home')}</span>
                        </button>

                        <button
                            onClick={() => navigate('/search')}
                            className="flex-1 h-full flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700"
                        >
                            <Search className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{t('search')}</span>
                        </button>

                        <button
                            onClick={toggleCart}
                            className="flex-1 h-full flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative"
                        >
                            <div className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {cartItemCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{t('cart')}</span>
                        </button>
                    </div>
                </div>

                {/* Toggle Button (25%) */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-[25%] h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors border-l border-slate-200 dark:border-slate-600"
                >
                    {isMenuOpen ? (
                        <X className="h-6 w-6 animate-in spin-in-90 duration-200" />
                    ) : (
                        <Menu className="h-6 w-6 animate-in spin-in-90 duration-200" />
                    )}
                </button>
            </div>
        </div>
    );
};

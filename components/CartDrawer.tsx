
import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, toggleCart, removeFromCart, updateCartQuantity, totalAmount, shippingFee, discountAmount, finalTotal, applyDiscount, appliedDiscount, removeDiscount, t } = useShop();
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState('');

  const handleCheckout = () => {
    toggleCart();
    navigate('/checkout');
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountCode.trim()) {
      applyDiscount(discountCode.trim());
      setDiscountCode('');
    }
  };

  const finalTotalWithShipping = finalTotal + shippingFee;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={toggleCart} />
      
      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-white/10 transform transition-transform">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-purple-600 dark:text-purple-500" />
              {t('cart')} ({cart.reduce((a, c) => a + c.quantity, 0)})
            </h2>
            <button onClick={toggleCart} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white dark:bg-slate-900">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-full mb-6">
                  <ShoppingBag className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('emptyCart')}</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">{t('noProducts')}</p>
                <Button variant="outline" onClick={toggleCart}>
                  {t('startShopping')}
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {cart.map((item) => (
                  <li key={item.id} className="flex py-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                          <h3>{item.name}</h3>
                          <div className="ml-4 text-right">
                            {item.salePrice ? (
                              <>
                                <p className="text-red-600 dark:text-red-400">IQD {(item.salePrice * item.quantity).toLocaleString()}</p>
                                <p className="text-xs text-slate-400 line-through">IQD {(item.price * item.quantity).toLocaleString()}</p>
                              </>
                            ) : (
                              <p className="text-purple-600 dark:text-purple-400">IQD {(item.price * item.quantity).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 rounded-l-lg transition-all"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 font-medium text-slate-900 dark:text-white min-w-[1.5rem] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 rounded-r-lg transition-all"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center text-xs uppercase tracking-wide transition-colors"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-slate-200 dark:border-white/10 px-6 py-6 bg-slate-50 dark:bg-slate-900">
              
              {/* Discount Code Input */}
              <div className="mb-6">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                       <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                       <span className="font-bold text-green-700 dark:text-green-300">{appliedDiscount.code}</span>
                       <span className="text-xs text-green-600 dark:text-green-400">
                         (-{appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : `IQD ${appliedDiscount.value}`})
                       </span>
                    </div>
                    <button onClick={removeDiscount} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyDiscount} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter discount code" 
                      className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                    <Button type="submit" variant="secondary" disabled={!discountCode} className="text-xs whitespace-nowrap">
                      Apply
                    </Button>
                  </form>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm font-medium text-slate-900 dark:text-white">
                  <p className="text-slate-500 dark:text-slate-300">{t('subtotal')}</p>
                  <p>IQD {totalAmount.toLocaleString()}</p>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-green-600 dark:text-green-400">
                    <p className="flex items-center gap-1"><Tag className="h-3 w-3" /> Discount</p>
                    <p>- IQD {discountAmount.toLocaleString()}</p>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium text-slate-900 dark:text-white">
                  <p className="text-slate-500 dark:text-slate-300">{t('shipping')}</p>
                  <p>IQD {shippingFee.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                   <p>{t('total')}</p>
                   <p className="text-purple-600 dark:text-purple-400">IQD {finalTotalWithShipping.toLocaleString()}</p>
                </div>
              </div>

              <Button className="w-full flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20" size="lg" onClick={handleCheckout}>
                {t('checkout')} <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="mt-6 flex justify-center text-center text-sm">
                <button
                  type="button"
                  className="font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                  onClick={toggleCart}
                >
                  {t('continueShopping')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

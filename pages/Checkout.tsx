


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/Button';
import { Lock, ShoppingBag, MapPin, Phone, User, Truck, Tag } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { cart, totalAmount, shippingFee, discountAmount, finalTotal, appliedDiscount, clearCart, placeOrder, t } = useShop();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotalWithShipping = finalTotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const orderData = {
      customerName: formData.get('name') as string,
      phone: formData.get('phone') as string,
      city: formData.get('city') as string,
      address: formData.get('address') as string,
      items: cart,
      totalAmount: finalTotalWithShipping,
      shippingFee: shippingFee,
      discountAmount: discountAmount,
      discountCode: appliedDiscount?.code,
      orderNumber: Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    };

    try {
      await placeOrder(orderData);
      clearCart();
      navigate('/order-success');
    } catch (error: any) {
      console.error("Order failed", error);
      
      let errorMessage = "Failed to place order. Please try again.";
      
      // Handle specific Supabase errors
      if (error?.code === 'PGRST204' || (error?.message && error.message.includes('column'))) {
         errorMessage = "Database Error: Missing columns in 'orders' table. Please run the DB Setup script in Admin Dashboard.";
      } else if (error?.message) {
         errorMessage = `Error: ${error.message}`;
      } else if (error?.hint) {
         errorMessage = `Error: ${error.hint}`;
      }
      
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center border border-slate-100 dark:border-slate-700">
          <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('emptyCart')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{t('noProducts')}</p>
          <Button onClick={() => navigate('/')}>{t('startShopping')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('checkoutTitle')}</h1>
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>{t('cashOnDelivery')}</span>
          </div>
        </div>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          
          {/* Shipping Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Contact Info */}
              <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-6 flex items-center">
                  <MapPin className="mr-2 rtl:ml-2 rtl:mr-0 h-5 w-5 text-purple-600" /> {t('deliveryDetails')}
                </h2>
                
                <div className="grid grid-cols-1 gap-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('fullName')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="name"
                        required 
                        className="block w-full pl-10 rtl:pr-10 rtl:pl-3 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2.5 border outline-none transition-colors" 
                        placeholder={t('fullName')}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('phone')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-slate-400" />
                      </div>
                      <input 
                        type="tel" 
                        name="phone"
                        required 
                        className="block w-full pl-10 rtl:pr-10 rtl:pl-3 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2.5 border outline-none transition-colors" 
                        placeholder="0770 XXX XXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('city')}</label>
                    <input 
                      type="text" 
                      name="city"
                      required 
                      className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2.5 border outline-none transition-colors" 
                      placeholder={t('city')}
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('address')}</label>
                    <textarea 
                      name="address"
                      rows={3}
                      required 
                      className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2.5 border outline-none transition-colors" 
                      placeholder={t('address')}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" isLoading={isProcessing} className="w-full py-4 text-lg shadow-xl shadow-purple-600/20">
                {t('completeOrder')}
              </Button>

              <p className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 gap-2">
                <Lock className="h-3 w-3" /> {t('secureCheckout')}
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 mt-10 lg:mt-0">
            <div className="bg-white dark:bg-slate-900 shadow-lg shadow-purple-900/5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 sticky top-24">
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                  <ShoppingBag className="mr-2 rtl:ml-2 rtl:mr-0 h-5 w-5 text-purple-600" /> {t('orderSummary')}
                </h2>
              </div>

              <div className="p-6">
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 mb-6">
                  {cart.map((item) => {
                     const price = item.salePrice || item.price;
                     return (
                      <li key={item.id} className="flex py-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                        </div>
                        <div className="ml-4 flex flex-1 flex-col">
                          <div>
                            <div className="flex justify-between text-sm font-medium text-slate-900 dark:text-white">
                              <h3>{item.name}</h3>
                              <p className="ml-4">IQD {(price * item.quantity).toLocaleString()}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                          </div>
                          <div className="flex flex-1 items-end justify-between text-xs">
                            <p className="text-slate-500 dark:text-slate-400">{t('qty')} {item.quantity}</p>
                          </div>
                        </div>
                      </li>
                     );
                  })}
                </ul>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-slate-600 dark:text-slate-400">{t('subtotal')}</p>
                    <p className="font-medium text-slate-900 dark:text-white">IQD {totalAmount.toLocaleString()}</p>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                       <p className="flex items-center gap-1"><Tag className="h-3 w-3" /> Discount {appliedDiscount && `(${appliedDiscount.code})`}</p>
                       <p>- IQD {discountAmount.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-slate-600 dark:text-slate-400 flex items-center">
                       <Truck className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 text-slate-400" /> {t('shipping')}
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">IQD {shippingFee.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{t('total')}</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">IQD {finalTotalWithShipping.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
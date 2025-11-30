
import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Button } from '../components/Button';
import { Package, Search, Phone, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '../types';

export const MyOrders: React.FC = () => {
  const { orders, t } = useShop();
  const [phone, setPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundOrders, setFoundOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    const normalizedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    const results = orders.filter(o => o.phone.replace(/\D/g, '').includes(normalizedPhone));
    
    setFoundOrders(results);
    setHasSearched(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Processing': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Helper to translate status from DB value if needed, or just display it
  // Assuming status in DB is English 'Processing' | 'Shipped' | 'Delivered'
  const translateStatus = (status: string) => {
    const key = status.toLowerCase() as 'processing' | 'shipped' | 'delivered';
    return t(key) || status;
  };

  return (
    <div className="min-h-[80vh] pt-8 pb-20 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('myOrders')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('trackOrdersSubtitle')}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0770 XXX XXXX"
              className="block w-full pl-10 rtl:pr-10 rtl:pl-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent p-3 outline-none transition-colors"
            />
          </div>
          <Button type="submit" className="flex items-center justify-center gap-2">
            <Search className="h-4 w-4" /> {t('trackBtn')}
          </Button>
        </form>
      </div>

      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {foundOrders.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-slate-900 dark:text-white font-medium">{t('noOrdersFound')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('tryCheckingPhone')}</p>
            </div>
          ) : (
            foundOrders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Order Header Card */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('orderNum')} {order.orderNumber}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {translateStatus(order.status)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{order.items.length} {t('items')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {order.items.map(i => i.name).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                        IQD {order.totalAmount.toLocaleString()}
                      </span>
                      {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-6">
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">{t('deliveryDetails')}</h4>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{order.city}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{order.address}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">{t('items')}</h4>
                      <ul className="space-y-3">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                              <img 
                                src={item.image} 
                                alt="" 
                                loading="lazy"
                                className="h-full w-full object-cover" 
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.quantity} x IQD {item.price.toLocaleString()}</p>
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              IQD {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

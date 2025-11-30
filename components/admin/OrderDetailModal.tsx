
import React from 'react';
import { X, Package, MapPin, Phone, User, Calendar } from 'lucide-react';
import { Order } from '../../types';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Details</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">#{order.orderNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Customer Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User className="h-4 w-4" /> Customer Information
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="mb-3">
                  <span className="text-xs text-slate-500 block mb-0.5">Full Name</span>
                  <span className="font-medium text-slate-900 dark:text-white">{order.customerName}</span>
                </div>
                <div className="mb-3">
                   <span className="text-xs text-slate-500 block mb-0.5">Phone Number</span>
                   <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                     <Phone className="h-3 w-3 text-violet-500" />
                     {order.phone}
                   </div>
                </div>
                <div>
                   <span className="text-xs text-slate-500 block mb-0.5">Order Date</span>
                   <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                     <Calendar className="h-3 w-3 text-violet-500" />
                     {formatDate(order.date)}
                   </div>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Shipping Address
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 h-full">
                <div className="mb-3">
                  <span className="text-xs text-slate-500 block mb-0.5">City</span>
                  <span className="font-medium text-slate-900 dark:text-white">{order.city}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Address Details</span>
                  <p className="font-medium text-slate-900 dark:text-white leading-relaxed">{order.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" /> Order Items ({order.items.length})
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Product</th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-center">Qty</th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900">
                            <img 
                              src={item.image} 
                              alt="" 
                              loading="lazy"
                              className="h-full w-full object-cover" 
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.device}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-900 dark:text-white">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{item.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Totals */}
        <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>IQD {(order.totalAmount - order.shippingFee).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Shipping Fee</span>
              <span>IQD {order.shippingFee.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
              <span>Total Amount</span>
              <span className="text-violet-600 dark:text-violet-400">IQD {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

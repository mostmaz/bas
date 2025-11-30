import React, { useState } from 'react';
import { CheckCircle, Truck, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '../Button';
import { useShop } from '../../context/ShopContext';
import { OrderDetailModal } from './OrderDetailModal';
import { Order } from '../../types';

export const OrderManagement: React.FC = () => {
  const { orders, updateOrderStatus } = useShop();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Delivered': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'Shipped': return <Truck className="h-3 w-3 mr-1" />;
      case 'Processing': return <Clock className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleStatus = (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Processing' ? 'Shipped' : currentStatus === 'Shipped' ? 'Delivered' : 'Processing';
    updateOrderStatus(orderId, nextStatus);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Orders ({orders.length})</h2>
          <Button variant="outline" size="sm">Export CSV</Button>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Order #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Shipping</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">
                      <button 
                        onClick={() => handleOrderClick(order)} 
                        className="hover:underline focus:outline-none font-mono"
                      >
                        #{order.orderNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      <div className="text-sm line-clamp-1" title={order.address}>{order.address}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-500">{order.city}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {formatDate(order.date)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                       <span className="text-xs">IQD</span> {order.shippingFee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">IQD {order.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(order.id, order.status)}
                        className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors"
                        title="Advance Status"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};
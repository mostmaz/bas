import React, { useState } from 'react';
import { CheckCircle, Truck, Clock, MoreHorizontal, XCircle } from 'lucide-react';
import { Button } from '../Button';
import { useShop } from '../../context/ShopContext';
import { OrderDetailModal } from './OrderDetailModal';
import { Order } from '../../types';

export const OrderManagement: React.FC = () => {
  const { orders, updateOrderStatus } = useShop();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'Shipped': return <Truck className="h-3 w-3 mr-1" />;
      case 'Processing': return <Clock className="h-3 w-3 mr-1" />;
      case 'Cancelled': return <XCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (status: Order['status']) => {
    if (confirm(`Are you sure you want to mark ${selectedOrderIds.length} orders as ${status}?`)) {
      for (const id of selectedOrderIds) {
        await updateOrderStatus(id, status);
      }
      setSelectedOrderIds([]);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Orders ({orders.length})</h2>
        <div className="flex gap-2">
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-1 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <span className="text-xs font-medium px-2 text-indigo-700 dark:text-indigo-300">{selectedOrderIds.length} selected</span>
              <select
                className="text-sm border-none bg-white dark:bg-slate-800 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 py-1 px-2 dark:text-white"
                onChange={(e) => {
                  if (e.target.value) handleBulkStatusUpdate(e.target.value as Order['status']);
                  e.target.value = ''; // Reset
                }}
              >
                <option value="">Batch Action...</option>
                <option value="Processing">Mark Processing</option>
                <option value="Shipped">Mark Shipped</option>
                <option value="Delivered">Mark Delivered</option>
                <option value="Cancelled">Mark Cancelled</option>
              </select>
            </div>
          )}
          <Button variant="outline" size="sm">Export CSV</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
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
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
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
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className="text-xs border-gray-200 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-transparent dark:text-slate-300"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
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
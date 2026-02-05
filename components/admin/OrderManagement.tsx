import React, { useState } from 'react';
import { CheckCircle, Truck, Clock, MoreHorizontal, XCircle, Download } from 'lucide-react';
import { Button } from '../Button';
import { useShop } from '../../context/ShopContext';
import { OrderDetailModal } from './OrderDetailModal';
import { Order } from '../../types';

export const OrderManagement: React.FC = () => {
  // Use state from hook for pagination
  const { orders, updateOrderStatus, bulkUpdateOrderStatus, refreshOrders, page, totalPages, isOrdersLoading, exportOrders } = useShop();
  // Local state for tracking what the UI thinks is the current page, although the data drives the view
  const [currentPage, setCurrentPage] = useState(1);
  // Sync local current page with hook's page if needed, or just drive from hook. 
  // Simplified: Let's assume we trigger valid page updates.

  // We no longer slice orders locally because 'orders' now contains only the current page's data
  // const startIndex = (currentPage - 1) * itemsPerPage; 
  // const endIndex = startIndex + itemsPerPage;
  // const paginatedOrders = orders; // Use directly

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Order['status'] | null>(null);

  // Sync local state regarding page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    refreshOrders(newPage);
  };

  // Refresh on mount (load page 1)
  React.useEffect(() => {
    // We rely on context to load initial orders, but we can refresh here to be sure.
    // If context is already looping, this wasn't the cause.
    refreshOrders(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


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
    const allPageIds = orders.map(o => o.id);
    const allSelected = allPageIds.every(id => selectedOrderIds.includes(id));

    if (allSelected) {
      // Remove current page orders from selection
      setSelectedOrderIds(prev => prev.filter(id => !allPageIds.includes(id)));
    } else {
      // Add current page orders to selection (avoiding duplicates)
      const newIds = allPageIds.filter(id => !selectedOrderIds.includes(id));
      setSelectedOrderIds(prev => [...prev, ...newIds]);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const initiateBulkUpdate = (status: Order['status']) => {
    if (selectedOrderIds.length === 0) {
      alert("Please select at least one order.");
      return;
    }
    setPendingStatus(status);
    setIsConfirmOpen(true);
  };

  const confirmBulkUpdate = async () => {
    if (pendingStatus && selectedOrderIds.length > 0) {
      await bulkUpdateOrderStatus(selectedOrderIds, pendingStatus);
      setSelectedOrderIds([]);
      setIsConfirmOpen(false);
      setPendingStatus(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Orders</h2>
          <Button variant="outline" size="sm" onClick={() => refreshOrders(currentPage)}>Refresh</Button>
        </div>
        <div className="flex gap-2">
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-1 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <span className="text-xs font-medium px-2 text-indigo-700 dark:text-indigo-300">{selectedOrderIds.length} selected</span>
              <select
                className="text-sm border-none bg-white dark:bg-slate-800 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 py-1 px-2 dark:text-white"
                onChange={(e) => {
                  if (e.target.value) initiateBulkUpdate(e.target.value as Order['status']);
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportOrders(selectedOrderIds)}
            disabled={selectedOrderIds.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel ({selectedOrderIds.length})
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto relative min-h-[400px]">
          {isOrdersLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Loading orders...</span>
              </div>
            </div>
          )}
          <table className={`w-full text-left text-sm transition-opacity duration-300 ${isOrdersLoading ? 'opacity-40' : 'opacity-100'}`}>
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 w-4">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && orders.every(o => selectedOrderIds.includes(o.id))}
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
                      <div className="space-y-2 max-w-[300px]">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <div
                              className="w-8 h-8 rounded bg-gray-100 dark:bg-slate-700 flex-shrink-0 bg-cover bg-center border border-gray-200 dark:border-slate-600"
                              style={{ backgroundImage: `url(${item.selectedVariant?.image || item.image})` }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate" title={item.name}>
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 flex flex-wrap gap-x-2">
                                <span>{item.device}</span>
                                {item.selectedVariant?.color && (
                                  <span className="flex items-center gap-1">
                                    <span
                                      className="w-2 h-2 rounded-full border border-gray-200"
                                      style={{ backgroundColor: item.selectedVariant.color }}
                                    />
                                    {item.selectedVariant.sku ? item.selectedVariant.sku : 'Variant'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                              x{item.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-slate-400">
              Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
      />

      {/* Custom Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700 scale-100 opacity-100">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm Batch Update</h3>
            <p className="text-gray-600 dark:text-slate-300 mb-6">
              Are you sure you want to mark <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedOrderIds.length}</span> orders as <span className="font-bold">{pendingStatus}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setIsConfirmOpen(false); setPendingStatus(null); }}>
                Cancel
              </Button>
              <Button onClick={confirmBulkUpdate}>
                Confirm Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
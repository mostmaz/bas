import React, { useMemo, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Download, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

export const RevenueAuditTable: React.FC = () => {
    const { orders, revenueResetDate } = useShop();
    const [isExpanded, setIsExpanded] = useState(false);

    const auditData = useMemo(() => {
        return orders
            .filter(o => o.status !== 'Cancelled')
            .filter(o => !revenueResetDate || new Date(o.date).getTime() > new Date(revenueResetDate).getTime())
            .map(order => {
                const shipping = order.shippingFee || 0;
                const total = order.totalAmount || 0;
                const net = Math.max(0, total - shipping);

                // Calculate expected sum from items
                const itemSum = order.items.reduce((sum, item) => {
                    const price = item.salePrice || item.price || 0;
                    return sum + (price * item.quantity);
                }, 0);

                // Check if Net matches Item Sum (accounting for order-level discount)
                const discount = order.discountAmount || 0;
                const expectedNet = Math.max(0, itemSum - discount);

                const discrepancy = Math.abs(net - expectedNet);
                const hasDiscrepancy = discrepancy > 100; // Allow small rounding diffs

                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    date: new Date(order.date).toLocaleDateString(),
                    total,
                    shipping,
                    net,
                    itemSum,
                    discount,
                    expectedNet,
                    hasDiscrepancy,
                    discrepancy
                };
            })
            .sort((a, b) => b.discrepancy - a.discrepancy); // Show problems first
    }, [orders, revenueResetDate]);

    if (!isExpanded) {
        return (
            <div className="mt-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <span className="font-medium text-gray-900 dark:text-white flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                        Troubleshoot Revenue Calculation
                    </span>
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button
                onClick={() => setIsExpanded(false)}
                className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400"
            >
                <ChevronRight className="h-4 w-4 mr-1" /> Hide Audit Table
            </button>

            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Audit Log</h3>
            <p className="text-sm text-gray-500 mb-4">
                This table shows exactly how Net Revenue is calculated for each order.
                <br />
                <strong>Net Revenue</strong> = Total Amount - Shipping Fee.
                <br />
                <strong>Expected Net</strong> = (Item Price * Qty) - Discount.
                <br />
                Rows highlighted in <span className="text-red-500 font-bold">Red</span> have a mismatch between the Total stored and the Items inside.
            </p>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total (DB)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping (DB)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider font-bold">Net (Calc)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Item Sum</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diff</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {auditData.map((row) => (
                            <tr key={row.id} className={row.hasDiscrepancy ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {row.orderNumber || row.id.slice(0, 8)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                    {row.date}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                                    {row.total.toLocaleString()}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 text-right">
                                    {row.shipping.toLocaleString()}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400 text-right">
                                    {row.net.toLocaleString()}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 text-right">
                                    {row.itemSum.toLocaleString()}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 text-right">
                                    {row.discount.toLocaleString()}
                                </td>
                                <td className={`px-3 py-4 whitespace-nowrap text-sm text-right font-medium ${row.hasDiscrepancy ? 'text-red-600' : 'text-green-600'}`}>
                                    {row.discrepancy.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

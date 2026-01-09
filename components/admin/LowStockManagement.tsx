
import React, { useState } from 'react';
import { Package, AlertTriangle, Save, Search, Filter } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';

export const LowStockManagement: React.FC = () => {
    const { products, updateProduct } = useShop();
    const [searchTerm, setSearchTerm] = useState('');
    const [stockThreshold, setStockThreshold] = useState(5);
    const [editingStock, setEditingStock] = useState<{ [key: string]: number }>({});

    const lowStockProducts = products.filter(p =>
        p.stock <= stockThreshold &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.stock - b.stock);

    const handleStockChange = (id: string, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setEditingStock(prev => ({ ...prev, [id]: numValue }));
        }
    };

    const saveStock = (id: string) => {
        if (editingStock[id] !== undefined) {
            const productToUpdate = products.find(p => p.id === id);
            if (productToUpdate) {
                updateProduct({ ...productToUpdate, stock: editingStock[id] });
            }
            setEditingStock(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <AlertTriangle className="mr-2 h-6 w-6 text-amber-500" />
                        Low Stock Management
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        Monitor and restock items running low on inventory
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-slate-300 whitespace-nowrap">Threshold:</span>
                    <input
                        type="number"
                        value={stockThreshold}
                        onChange={(e) => setStockThreshold(parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Current Stock</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Update Stock</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {lowStockProducts.length > 0 ? (
                                lowStockProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                                                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400">{product.brand}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                                            {product.sku || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock === 0
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                }`}>
                                                {product.stock} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={editingStock[product.id] !== undefined ? editingStock[product.id] : product.stock}
                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                className="w-24 px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingStock[product.id] !== undefined && editingStock[product.id] !== product.stock && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => saveStock(product.id)}
                                                    className="flex items-center"
                                                >
                                                    <Save className="h-4 w-4 mr-1" /> Save
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                        <p>No products found below the threshold of {stockThreshold} units.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

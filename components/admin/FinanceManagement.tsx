import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Button } from '../Button';
import { IncomeRecord, ExpenseRecord } from '../../types';
import { Plus, Save, Trash2, DollarSign, TrendingUp, TrendingDown, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useShop } from '../../context/ShopContext';

export const FinanceManagement: React.FC = () => {
    const { addToast } = useToast();
    const { products, orders } = useShop();

    const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'costs'>('overview');
    const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
    const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
    const [productCosts, setProductCosts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    // Form States
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        source: '',
        category: '',
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Batch Edit State
    const [costEdits, setCostEdits] = useState<Record<string, number>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Bulk Update State
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [bulkCost, setBulkCost] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'costs' || activeTab === 'overview') {
                const { data: costs, error: costsError } = await supabase
                    .from('product_costs')
                    .select('*');

                if (costsError) throw costsError;

                const costMap: Record<string, number> = {};
                costs?.forEach(item => {
                    costMap[item.product_id] = item.cost;
                });
                setProductCosts(costMap);
            }

            if (activeTab !== 'costs') {
                const { data: income, error: incomeError } = await supabase
                    .from('income_records')
                    .select('*')
                    .order('date', { ascending: false });

                if (incomeError) throw incomeError;
                setIncomeRecords(income || []);

                const { data: expenses, error: expenseError } = await supabase
                    .from('expense_records')
                    .select('*')
                    .order('date', { ascending: false });

                if (expenseError) throw expenseError;
                setExpenseRecords(expenses || []);
            }
        } catch (err) {
            console.error('Error fetching finance data:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            source: '',
            category: '',
            amount: '',
            notes: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleAddIncome = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('income_records').insert({
                source: formData.source,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString(),
                notes: formData.notes
            });

            if (error) throw error;
            addToast('Income record added', 'success');
            setIsIncomeModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            addToast('Failed to add income', 'error');
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('expense_records').insert({
                category: formData.category,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString(),
                notes: formData.notes
            });

            if (error) throw error;
            addToast('Expense record added', 'success');
            setIsExpenseModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            addToast('Failed to add expense', 'error');
        }
    };

    const handleDeleteIncome = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const { error } = await supabase.from('income_records').delete().eq('id', id);
            if (error) throw error;
            addToast('Record deleted', 'success');
            setIncomeRecords(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            addToast('Failed to delete', 'error');
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const { error } = await supabase.from('expense_records').delete().eq('id', id);
            if (error) throw error;
            addToast('Record deleted', 'success');
            setExpenseRecords(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            addToast('Failed to delete', 'error');
        }
    };

    const handleCostChange = (productId: string, value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        setCostEdits(prev => ({
            ...prev,
            [productId]: numValue
        }));
        setHasUnsavedChanges(true);
    };

    const saveCostBatch = async () => {
        setLoading(true);
        try {
            const updates = Object.entries(costEdits).map(([productId, cost]) => ({
                product_id: productId,
                cost: cost
            }));

            const { error } = await supabase.from('product_costs').upsert(updates);

            if (error) throw error;

            addToast('Product costs updated', 'success');
            setCostEdits({});
            setHasUnsavedChanges(false);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast('Failed to update costs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.id)));
        }
    };

    const toggleSelectProduct = (id: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    const handleBulkApply = () => {
        if (!bulkCost) return;
        const cost = parseFloat(bulkCost);
        if (isNaN(cost)) return;

        const newEdits = { ...costEdits };
        selectedProducts.forEach(id => {
            newEdits[id] = cost;
        });

        setCostEdits(newEdits);
        setHasUnsavedChanges(true);
        addToast(`Applied cost ${cost} to ${selectedProducts.size} products`, 'success');
        setBulkCost('');
        setSelectedProducts(new Set());
    };

    // Calculations
    const totalIncome = incomeRecords.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalRecordedExpenses = expenseRecords.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Calculate Total Inventory Cost (Expense)
    // Formula: (Current Stock + Total Sold Units) * Cost per Unit to approximate total purchased inventory.

    // 1. Calculate Sold Counts per Product
    const soldCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        if (!orders) return counts;
        orders
            .filter(o => o.status !== 'Cancelled')
            .forEach(order => {
                order.items.forEach(item => {
                    counts[item.id] = (counts[item.id] || 0) + item.quantity;
                });
            });
        return counts;
    }, [orders]);

    // 2. Calculate Total Cost
    const totalInventoryCost = products.reduce((sum, product) => {
        const currentCost = productCosts[product.id] ?? 0;
        const sold = soldCounts[product.id] || 0;
        const totalUnits = product.stock + sold;
        return sum + (totalUnits * currentCost);
    }, 0);

    const totalExpenses = totalRecordedExpenses + totalInventoryCost;
    const netProfit = totalIncome - totalExpenses;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    Finance & Reports (IQD)
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchData()}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
                {(['overview', 'income', 'expenses', 'costs'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Income</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            IQD {totalIncome.toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Expenses</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            IQD {totalExpenses.toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-2">
                            Ops: {totalRecordedExpenses.toLocaleString()} + Inventory: {totalInventoryCost.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${netProfit >= 0 ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Net Profit</p>
                        <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-500'}`}>
                            IQD {netProfit.toLocaleString()}
                        </h3>
                    </div>
                </div>
            )}

            {activeTab === 'income' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setIsIncomeModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Income
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {incomeRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                            {record.source}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-semibold">
                                            + IQD {record.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate">
                                            {record.notes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button onClick={() => handleDeleteIncome(record.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {incomeRecords.length === 0 && (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                                No income records found. Add entry from shipping company balance.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'expenses' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setIsExpenseModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Expense
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {expenseRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs">
                                                {record.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                                            - IQD {record.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate">
                                            {record.notes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button onClick={() => handleDeleteExpense(record.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {expenseRecords.length === 0 && (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                                No expense records found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'costs' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                These costs are private and only visible to admins. They are used to calculate profit margins.
                            </p>
                        </div>
                        {hasUnsavedChanges && (
                            <Button onClick={saveCostBatch} className="bg-emerald-600 hover:bg-emerald-700">
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        )}
                    </div>

                    {/* Bulk Actions */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-wrap gap-4 items-center">
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                {selectedProducts.size} Selected
                            </span>
                            <div className="h-4 w-px bg-gray-300 dark:bg-slate-600 mx-2" />
                            <input
                                type="number"
                                placeholder="Bulk Cost..."
                                value={bulkCost}
                                onChange={(e) => setBulkCost(e.target.value)}
                                className="w-32 rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                            />
                            <Button
                                onClick={handleBulkApply}
                                disabled={selectedProducts.size === 0 || !bulkCost}
                                size="sm"
                                variant="secondary"
                            >
                                Apply to Selected
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.size === products.length && products.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Sale Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Private Cost</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {products.map((product) => {
                                    // Prioritize local edit, then saved cost, then 0
                                    const currentCost = costEdits[product.id] ?? productCosts[product.id] ?? 0;
                                    const price = product.salePrice || product.price;
                                    const margin = price - currentCost;
                                    const marginPercent = price > 0 ? (margin / price) * 100 : 0;

                                    return (
                                        <tr key={product.id} className={selectedProducts.has(product.id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.has(product.id)}
                                                    onChange={() => toggleSelectProduct(product.id)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.image || 'https://via.placeholder.com/40'}
                                                        alt={product.name}
                                                        className="w-8 h-8 rounded-lg object-cover bg-gray-100"
                                                    />
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                                {product.sku || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                IQD {price.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="relative max-w-[120px]">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">IQD</span>
                                                    <input
                                                        type="number"
                                                        value={currentCost}
                                                        onChange={(e) => handleCostChange(product.id, e.target.value)}
                                                        className="w-full pl-10 pr-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                                        min="0"
                                                        step="1"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className={`font-medium ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    IQD {margin.toLocaleString()} ({marginPercent.toFixed(1)}%)
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isIncomeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Record Income</h3>
                        <form onSubmit={handleAddIncome} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Source</label>
                                <select
                                    required
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Source</option>
                                    <option value="Shipping Company">Shipping Company Balance</option>
                                    <option value="Direct Sales">Direct Store Sales</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsIncomeModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Record</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Record Expense</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Ads">Ads (Facebook, Google, etc)</option>
                                    <option value="Salaries">Salaries</option>
                                    <option value="Server Fees">Server / Hosting Fees</option>
                                    <option value="Case Cost">Product/Case Cost</option>
                                    <option value="Operations">Operations</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Save Expense</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

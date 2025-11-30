
import React, { useState } from 'react';
import { Plus, Trash2, Tag, Check, X } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';

export const DiscountManagement: React.FC = () => {
  const { discounts, addDiscount, deleteDiscount, toggleDiscountStatus } = useShop();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minOrderAmount: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.value) return;

    setIsSubmitting(true);
    try {
      await addDiscount({
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: Number(formData.value),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        isActive: true
      });
      setFormData({ code: '', type: 'percentage', value: '', minOrderAmount: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to add discount code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this discount code?')) {
      try {
        await deleteDiscount(id);
      } catch (error) {
        console.error(error);
        alert('Failed to delete discount code');
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Discount Codes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Discount Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add New Code
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER2024"
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type</label>
                <select
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (IQD)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Value</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder={formData.type === 'percentage' ? "e.g. 10 for 10%" : "e.g. 5000"}
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Min. Order (Optional)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none"
                  value={formData.minOrderAmount}
                  onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting} isLoading={isSubmitting}>
                Create Discount
              </Button>
            </form>
          </div>
        </div>

        {/* Discount List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 shrink-0">
              <h3 className="font-semibold text-gray-700 dark:text-slate-300">Active Discounts ({discounts.length})</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700 overflow-y-auto custom-scrollbar flex-1">
              {discounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-slate-400">
                  <Tag className="h-8 w-8 mb-2 opacity-50" />
                  <p>No discount codes found.</p>
                </div>
              ) : (
                discounts.map((discount) => (
                  <div key={discount.id || discount.code} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className={`font-bold text-lg ${discount.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{discount.code}</span>
                         <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${discount.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                           {discount.isActive ? 'Active' : 'Inactive'}
                         </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                        {discount.type === 'percentage' ? `${discount.value}% Off` : `IQD ${discount.value.toLocaleString()} Off`}
                        {discount.minOrderAmount ? ` • Min Order: IQD ${discount.minOrderAmount.toLocaleString()}` : ''}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Toggle Button */}
                      <button
                        type="button"
                        onClick={() => discount.id && toggleDiscountStatus(discount.id, discount.isActive)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${discount.isActive ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                        disabled={!discount.id}
                        title={discount.isActive ? 'Deactivate' : 'Activate'}
                      >
                         <span className="sr-only">Use setting</span>
                         <span
                           aria-hidden="true"
                           className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${discount.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                         >
                           {discount.isActive ? (
                             <Check className="h-3 w-3 text-indigo-600 absolute top-1 left-1" strokeWidth={3} />
                           ) : (
                             <X className="h-3 w-3 text-gray-400 absolute top-1 left-1" strokeWidth={3} />
                           )}
                         </span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => discount.id && handleDelete(discount.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2"
                        title="Delete"
                        disabled={!discount.id}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

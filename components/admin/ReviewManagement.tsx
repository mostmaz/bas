import React, { useState, useEffect } from 'react';
import { Star, Trash2, AlertTriangle, MessageSquare } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useShop } from '../../context/ShopContext';
import { Review } from '../../types';
import { Button } from '../Button';
import { useToast } from '../../context/ToastContext';

export const ReviewManagement: React.FC = () => {
    const { products } = useShop();
    const { addToast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            addToast('Failed to load reviews', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setReviews(prev => prev.filter(r => r.id !== id));
            addToast('Review deleted successfully', 'success');
            setDeleteId(null);
        } catch (error) {
            console.error('Error deleting review:', error);
            addToast('Failed to delete review', 'error');
        }
    };

    const getProductName = (productId: string) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : 'Unknown Product';
    };

    const getProductImage = (productId: string) => {
        const product = products.find(p => p.id === productId);
        return product ? product.image : null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                    Review Management
                </h2>
                <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-indigo-900/30 dark:text-indigo-300">
                    {reviews.length} Reviews
                </span>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                {reviews.length === 0 ? (
                    <div className="p-12 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reviews yet</h3>
                        <p className="text-gray-500 dark:text-slate-400 mt-1">Product reviews will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Reviewer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Rating</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Comment</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                                    {getProductImage(review.product_id) ? (
                                                        <img
                                                            src={getProductImage(review.product_id)!}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                            <MessageSquare className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white text-sm max-w-[200px] truncate" title={getProductName(review.product_id)}>
                                                    {getProductName(review.product_id)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                            {review.user_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300 dark:text-slate-600'}`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400 max-w-xs truncate" title={review.comment}>
                                            {review.comment}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-500 whitespace-nowrap">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {deleteId === review.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => setDeleteId(null)}
                                                        className="h-8 px-2 text-xs"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDelete(review.id)}
                                                        className="h-8 px-2 text-xs bg-red-600 hover:bg-red-700 text-white border-none"
                                                    >
                                                        Confirm
                                                    </Button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteId(review.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Review"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

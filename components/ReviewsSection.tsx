import React, { useState } from 'react';
import { Star, User, Send } from 'lucide-react';
import { useReviewLogic } from '../hooks/useReviewLogic';
import { Button } from './Button';
import { useShop } from '../context/ShopContext';

interface ReviewsSectionProps {
    productId: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId }) => {
    const { reviews, isLoading, addReview, averageRating, reviewCount } = useReviewLogic(productId);
    const { t } = useShop();
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim() || !newComment.trim()) return;

        setIsSubmitting(true);
        const success = await addReview(userName, newRating, newComment);
        if (success) {
            setNewComment('');
            setUserName('');
            setNewRating(5);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                {t('reviews')}
                <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {reviewCount}
                </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Summary & Form */}
                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                        <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2">{averageRating.toFixed(1)}</div>
                        <div className="flex justify-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-slate-500">{reviewCount} {t('verifiedReviews')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">{t('writeReview')}</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">{t('rating')}</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-6 h-6 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">{t('name')}</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder={t('enterName')}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">{t('comment')}</label>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                                placeholder={t('shareExperience')}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <span className="animate-pulse">...</span> : <><Send className="w-4 h-4 mr-2" /> {t('submitReview')}</>}
                        </Button>
                    </form>
                </div>

                {/* Reviews List */}
                <div className="md:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-500">{t('loading')}...</div>
                    ) : reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{review.user_name}</h4>
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {review.comment}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-500">{t('noReviewsYet')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

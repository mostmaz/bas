import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Review } from '../types';

export const useReviewLogic = (productId: string | undefined) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        if (!productId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (err: any) {
            console.error('Error fetching reviews:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    const addReview = async (userName: string, rating: number, comment: string) => {
        if (!productId) return;
        try {
            const { error } = await supabase
                .from('reviews')
                .insert([{ product_id: productId, user_name: userName, rating, comment }]);

            if (error) throw error;
            await fetchReviews();
            return true;
        } catch (err: any) {
            console.error('Error adding review:', err);
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0;

    return { reviews, isLoading, error, addReview, averageRating, reviewCount: reviews.length };
};

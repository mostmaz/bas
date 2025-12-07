import React from 'react';

export const ProductSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
            {/* Image Skeleton */}
            <div className="aspect-[4/5] bg-slate-200 dark:bg-slate-800 w-full" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Brand & Rating */}
                <div className="flex justify-between items-center">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-3 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>

                {/* Price & Button */}
                <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
            </div>
        </div>
    );
};

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LazySectionProps {
    children: React.ReactNode;
    className?: string;
    threshold?: number;
}

export const LazySection: React.FC<LazySectionProps> = ({
    children,
    className = '',
    threshold = 0.1
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Once visible, stop observing
                    if (sectionRef.current) {
                        observer.unobserve(sectionRef.current);
                    }
                }
            },
            { threshold, rootMargin: '200px' }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, [threshold]);

    return (
        <div ref={sectionRef} className={className}>
            {isVisible ? children : (
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="animate-pulse text-slate-400">Loading...</div>
                </div>
            )}
        </div>
    );
};

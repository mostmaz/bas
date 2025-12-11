'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useShop } from '@/context/ShopContext';

export const OffersCarousel: React.FC = () => {
    const { carouselSlides, language } = useShop();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (carouselSlides.length === 0) return;
        const timer = setInterval(() => {
            setCurrent(c => (c + 1) % carouselSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [carouselSlides.length]);

    const next = () => setCurrent(c => (c + 1) % carouselSlides.length);
    const prev = () => setCurrent(c => (c === 0 ? carouselSlides.length - 1 : c - 1));

    // Handle RTL Icon flipping logic if needed, though icons are usually universally directional for next/prev
    const isRTL = language === 'ar';

    if (carouselSlides.length === 0) return null;

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xl h-[150px] md:h-[190px] group border border-gray-100 dark:border-white/5 transition-all">
            {carouselSlides.map((offer, idx) => (
                <div
                    key={offer.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    <div className="w-full h-full relative overflow-hidden">
                        <Image
                            src={offer.image}
                            alt={offer.title || "Slide"}
                            fill
                            sizes="(max-width: 768px) 100vw, 1200px"
                            priority={idx === 0}
                            className="object-cover"
                            style={{ objectPosition: offer.imagePosition || 'center' }}
                        />
                    </div>
                </div>
            ))}

            {/* Controls */}
            <button
                onClick={isRTL ? next : prev}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-1.5 md:p-2 rounded-full backdrop-blur-md text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button
                onClick={isRTL ? prev : next}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-1.5 md:p-2 rounded-full backdrop-blur-md text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 md:space-x-2 z-20">
                {carouselSlides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`h-1 md:h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === current ? 'w-6 md:w-8 bg-white' : 'w-1.5 md:w-2 bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
};

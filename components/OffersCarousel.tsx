import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

import { optimizeImage } from '../utils/imageUtils';

export const OffersCarousel: React.FC = () => {
  const { carouselSlides, language, isSlidesLoading } = useShop();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (carouselSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % carouselSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  const next = () => setCurrent(c => (c + 1) % carouselSlides.length);
  const prev = () => setCurrent(c => (c === 0 ? carouselSlides.length - 1 : c - 1));

  const isRTL = language === 'ar';

  if (isSlidesLoading) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden shadow-xl h-[150px] md:h-[190px] bg-gray-200 dark:bg-slate-800 animate-pulse border border-gray-100 dark:border-white/5">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (carouselSlides.length === 0) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl h-[150px] md:h-[190px] group border border-gray-100 dark:border-white/5 transition-all">
      {carouselSlides.map((offer, idx) => {
        const Content = (
          <img
            src={optimizeImage(offer.image, 800)}
            alt={offer.title || "Slide"}
            loading={idx === 0 ? "eager" : "lazy"}
            className="w-full h-full object-cover"
            style={{ objectPosition: offer.imagePosition || 'center' }}
          />
        );

        return (
          <div
            key={offer.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {offer.link ? (
              offer.link.startsWith('http') ? (
                <a href={offer.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative overflow-hidden">
                  {Content}
                </a>
              ) : (
                <Link to={offer.link} className="block w-full h-full relative overflow-hidden">
                  {Content}
                </Link>
              )
            ) : (
              <div className="w-full h-full relative overflow-hidden">
                {Content}
              </div>
            )}
          </div>
        );
      })}

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

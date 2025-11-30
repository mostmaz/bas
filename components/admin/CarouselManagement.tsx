
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';
import { CarouselSlide } from '../../types';
import { SlideFormModal } from './SlideFormModal';

export const CarouselManagement: React.FC = () => {
  const { carouselSlides, addSlide, deleteSlide } = useShop();
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);

  const handleAddSlide = (slideData: Omit<CarouselSlide, 'id'>) => {
    addSlide({
      id: Date.now().toString(),
      ...slideData
    });
    setIsSlideModalOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Carousel Slides</h2>
          <Button onClick={() => setIsSlideModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Slide
          </Button>
      </div>

      <div className="grid gap-6">
        {carouselSlides.map((slide) => (
          <div key={slide.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row">
            <div className={`h-32 md:h-auto md:w-48 bg-gradient-to-r ${slide.color} relative shrink-0`}>
                <img 
                  src={slide.image} 
                  alt="" 
                  loading="lazy"
                  className="w-full h-full object-cover mix-blend-overlay opacity-50" 
                />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-1 block">{slide.subtitle}</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{slide.title}</h3>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">{slide.description}</p>
                </div>
                <button 
                  onClick={() => deleteSlide(slide.id)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SlideFormModal 
        isOpen={isSlideModalOpen}
        onClose={() => setIsSlideModalOpen(false)}
        onSave={handleAddSlide}
      />
    </div>
  );
};

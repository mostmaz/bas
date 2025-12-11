import { useState } from 'react';
import { CarouselSlide } from '@/types';
import { INITIAL_CAROUSEL_SLIDES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export const useSlideLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, initialData?: CarouselSlide[]) => {
    const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(() => {
        if (initialData && initialData.length > 0) return initialData;
        return isSupabaseConfigured ? [] : INITIAL_CAROUSEL_SLIDES;
    });

    const addSlide = async (slide: CarouselSlide) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('slides').insert([slide]);
            if (error) {
                console.error(error);
                addToast('Failed to add slide', 'error');
                return;
            }
            const { data } = await supabase.from('slides').select('*');
            if (data) setCarouselSlides(data);
            addToast('Slide added', 'success');
        } else {
            setCarouselSlides(prev => [...prev, slide]);
            addToast('Slide added locally (Demo)', 'success');
        }
    };

    const updateSlide = async (slide: CarouselSlide) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('slides').update(slide).eq('id', slide.id);
            if (error) {
                console.error(error);
                addToast('Failed to update slide', 'error');
                return;
            }
            const { data } = await supabase.from('slides').select('*');
            if (data) setCarouselSlides(data);
            addToast('Slide updated', 'success');
        } else {
            setCarouselSlides(prev => prev.map(s => s.id === slide.id ? slide : s));
            addToast('Slide updated locally (Demo)', 'success');
        }
    };

    const deleteSlide = async (id: string) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('slides').delete().eq('id', id);
            if (error) {
                console.error(error);
                addToast('Failed to delete slide', 'error');
                return;
            }
            const { data } = await supabase.from('slides').select('*');
            if (data) setCarouselSlides(data);
            addToast('Slide deleted', 'success');
        } else {
            setCarouselSlides(prev => prev.filter(s => s.id !== id));
            addToast('Slide deleted locally (Demo)', 'success');
        }
    };

    const refreshSlides = async () => {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('slides').select('*');
            if (error) {
                console.error("Error fetching slides:", error);
                return;
            }
            if (data) setCarouselSlides(data);
        }
    };

    return { carouselSlides, setCarouselSlides, addSlide, updateSlide, deleteSlide, refreshSlides };
};

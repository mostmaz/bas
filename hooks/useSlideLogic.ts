import { useState } from 'react';
import { CarouselSlide } from '../types';
import { INITIAL_SLIDES } from '../constants';
import { supabase } from '../services/supabase';

// Helper to map app model (camelCase) to DB model (snake_case)
const mapSlideToDB = (slide: CarouselSlide) => ({
    id: slide.id, // DB might expect UUID, but we pass what we have. If DB generates, we might need to omit this for inserts if it's not a valid UUID.
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    color: slide.color,
    image: slide.image,
    image_position: slide.imagePosition, // Map imagePosition -> image_position
    link: slide.link
});

// Helper to map DB model (snake_case) to app model (camelCase)
const mapSlideFromDB = (slide: any): CarouselSlide => ({
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    color: slide.color,
    image: slide.image,
    imagePosition: slide.image_position, // Map image_position -> imagePosition
    link: slide.link
});

export const useSlideLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) => {
    const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(() => isSupabaseConfigured ? [] : INITIAL_SLIDES);

    const addSlide = async (slide: CarouselSlide) => {
        if (isSupabaseConfigured) {
            // Omit ID for new inserts if it's not a valid UUID, or let DB handle it. 
            // However, the app generates a timestamp ID. If DB id is UUID, this fails.
            // We'll try to insert without ID and let DB generate it, or map it if it's compatible.
            // For now, let's try mapping the whole object but be aware of ID issues.
            const dbSlide = mapSlideToDB(slide);

            // Remove ID if it looks like a timestamp (not UUID) to let DB generate a proper UUID
            if (!slide.id.includes('-')) {
                delete (dbSlide as any).id;
            }

            const { error } = await supabase.from('slides').insert([dbSlide]);
            if (error) {
                console.error(error);
                addToast('Failed to add slide', 'error');
                return;
            }
            await refreshSlides(); // Refresh to get the new ID
            addToast('Slide added', 'success');
        } else {
            setCarouselSlides(prev => [...prev, slide]);
            addToast('Slide added locally (Demo)', 'success');
        }
    };

    const updateSlide = async (slide: CarouselSlide) => {
        if (isSupabaseConfigured) {
            const dbSlide = mapSlideToDB(slide);
            const { error } = await supabase.from('slides').update(dbSlide).eq('id', slide.id);
            if (error) {
                console.error(error);
                addToast('Failed to update slide', 'error');
                return;
            }
            await refreshSlides();
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
            await refreshSlides();
            addToast('Slide deleted', 'success');
        } else {
            setCarouselSlides(prev => prev.filter(s => s.id !== id));
            addToast('Slide deleted locally (Demo)', 'success');
        }
    };

    const [isLoading, setIsLoading] = useState(true);

    const refreshSlides = async () => {
        setIsLoading(true);
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.from('slides').select('*');
            if (error) {
                console.error("Error fetching slides:", error);
            }
            if (data) setCarouselSlides(data.map(mapSlideFromDB));
        } else {
            setCarouselSlides(INITIAL_SLIDES);
        }
        setIsLoading(false);
    };

    return { carouselSlides, setCarouselSlides, addSlide, updateSlide, deleteSlide, refreshSlides, isLoading };
};

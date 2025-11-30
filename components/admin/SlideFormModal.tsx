import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Button';
import { CarouselSlide } from '../../types';

interface SlideFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slide: Omit<CarouselSlide, 'id'>) => void;
}

export const SlideFormModal: React.FC<SlideFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const defaultState = {
    title: '',
    subtitle: '',
    description: '',
    color: 'from-violet-600 to-fuchsia-600',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
  };
  const [newSlide, setNewSlide] = useState(defaultState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(newSlide);
    setNewSlide(defaultState);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Carousel Slide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title</label>
            <input required type="text" className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.title} onChange={e => setNewSlide({...newSlide, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subtitle</label>
            <input required type="text" className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.subtitle} onChange={e => setNewSlide({...newSlide, subtitle: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <textarea required rows={2} className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.description} onChange={e => setNewSlide({...newSlide, description: e.target.value})} />
          </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Image URL</label>
            <input required type="text" className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.image} onChange={e => setNewSlide({...newSlide, image: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gradient Color</label>
            <select className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.color} onChange={e => setNewSlide({...newSlide, color: e.target.value})}>
                <option value="from-violet-600 to-fuchsia-600">Violet/Fuchsia</option>
                <option value="from-emerald-600 to-teal-600">Emerald/Teal</option>
                <option value="from-orange-500 to-pink-500">Orange/Pink</option>
                <option value="from-blue-600 to-cyan-600">Blue/Cyan</option>
            </select>
          </div>
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Slide</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
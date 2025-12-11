import React, { useState } from 'react';
import { X, Upload, Loader2, ArrowUpLeft, ArrowUp, ArrowUpRight, ArrowLeft, Circle, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight } from 'lucide-react';
import { Button } from '../Button';
import { CarouselSlide } from '../../types';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';

interface SlideFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slide: Omit<CarouselSlide, 'id'>) => void;
}

export const SlideFormModal: React.FC<SlideFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const { addToast } = useToast();
  const defaultState: Omit<CarouselSlide, 'id'> = {
    title: '',
    subtitle: '',
    description: '',
    color: 'from-violet-600 to-fuchsia-600',
    image: '',
    imagePosition: 'center'
  };
  const [newSlide, setNewSlide] = useState(defaultState);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setNewSlide(prev => ({ ...prev, image: data.publicUrl }));
      addToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      addToast('Error uploading image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.image) {
      addToast('Please upload an image', 'error');
      return;
    }
    onSave(newSlide);
    setNewSlide(defaultState);
  };

  const positions = [
    { id: 'left top', icon: ArrowUpLeft },
    { id: 'center top', icon: ArrowUp },
    { id: 'right top', icon: ArrowUpRight },
    { id: 'left center', icon: ArrowLeft },
    { id: 'center', icon: Circle },
    { id: 'right center', icon: ArrowRight },
    { id: 'left bottom', icon: ArrowDownLeft },
    { id: 'center bottom', icon: ArrowDown },
    { id: 'right bottom', icon: ArrowDownRight },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Carousel Slide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Slide Image (Required)</label>
            <div className="flex flex-col gap-4">
              <div className="relative w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="slide-image-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="slide-image-upload"
                  className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </label>
              </div>

              {newSlide.image && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">Preview & Position</label>
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
                    <img
                      src={newSlide.image}
                      alt="Preview"
                      className="w-full h-full object-cover transition-all duration-300"
                      style={{ objectPosition: newSlide.imagePosition || 'center' }}
                    />
                  </div>

                  <div className="flex justify-center gap-1">
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700">
                      {positions.map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setNewSlide({ ...newSlide, imagePosition: pos.id })}
                          className={`p-1.5 rounded-md transition-all ${(newSlide.imagePosition || 'center') === pos.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-gray-500 hover:bg-white dark:hover:bg-slate-700'
                            }`}
                          title={pos.id}
                        >
                          <pos.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title (Optional)</label>
            <input type="text" className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.title} onChange={e => setNewSlide({ ...newSlide, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subtitle (Optional)</label>
            <input type="text" className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.subtitle} onChange={e => setNewSlide({ ...newSlide, subtitle: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description (Optional)</label>
            <textarea rows={2} className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.description} onChange={e => setNewSlide({ ...newSlide, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gradient Color (Optional)</label>
            <select className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none" value={newSlide.color} onChange={e => setNewSlide({ ...newSlide, color: e.target.value })}>
              <option value="">None</option>
              <option value="from-violet-600 to-fuchsia-600">Violet/Fuchsia</option>
              <option value="from-emerald-600 to-teal-600">Emerald/Teal</option>
              <option value="from-orange-500 to-pink-500">Orange/Pink</option>
              <option value="from-blue-600 to-cyan-600">Blue/Cyan</option>
            </select>
          </div>
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={uploading || !newSlide.image}>Add Slide</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
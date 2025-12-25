'use client';

import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { Button } from '@/components/Button';

interface CollectionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onSave: (data: any) => void;
}

export const CollectionFormModal: React.FC<CollectionFormModalProps> = ({ isOpen, onClose, selectedCount, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate a small delay or just call onSave
        onSave({
            name,
            description,
            price: Number(price) || 0,
            image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=600&q=75', // Placeholder collection image
            images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=600&q=75']
        });

        // Reset form
        setName('');
        setDescription('');
        setPrice('');
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Collection</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{selectedCount} products selected</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Collection Name</label>
                        <input
                            required
                            type="text"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Summer Essentials Bundle"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bundle Price (IQD)</label>
                        <input
                            required
                            type="number"
                            min="0"
                            step="100"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">Set a special price for this collection.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea
                            rows={3}
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe this collection..."
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Collection'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

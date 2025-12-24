import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Copy, Plus, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Collection } from '../../types';
import { Button } from '../Button';
import { useToast } from '../../context/ToastContext';

export const CollectionManagement: React.FC = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('collections')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map DB columns to TS interface
            const mappedData: Collection[] = (data || []).map((item: any) => ({
                id: item.id,
                title: item.title,
                productIds: item.product_ids || [],
                slug: item.slug,
                createdAt: item.created_at
            }));

            setCollections(mappedData);
        } catch (error) {
            console.error('Error fetching collections:', error);
            // Don't show toast on initial load failure if table doesn't exist yet
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this collection?')) return;

        try {
            const { error } = await supabase.from('collections').delete().eq('id', id);
            if (error) throw error;
            setCollections(prev => prev.filter(c => c.id !== id));
            addToast('Collection deleted', 'success');
        } catch (error) {
            console.error('Error deleting collection:', error);
            addToast('Failed to delete collection', 'error');
        }
    };

    const copyLink = (ids: string[]) => {
        const url = `${window.location.origin}/#/filtered-products?ids=${ids.join(',')}`;
        navigator.clipboard.writeText(url);
        addToast('Link copied to clipboard', 'success');
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manual Collections</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Manage your manually created product pages.</p>
                </div>
                <Button onClick={fetchCollections} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading collections...</div>
            ) : collections.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <LinkIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Collections Yet</h3>
                    <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                        Create collections by selecting products in the Inventory tab and clicking "Save as Collection".
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {collections.map((collection) => (
                        <div key={collection.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-2">
                                    {collection.title || 'Untitled Collection'}
                                </h3>
                                <button
                                    onClick={() => handleDelete(collection.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                {collection.productIds.length} products • {new Date(collection.createdAt || '').toLocaleDateString()}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => copyLink(collection.productIds)}
                                >
                                    <Copy className="h-3 w-3 mr-2" /> Copy Link
                                </Button>
                                <a
                                    href={`/#/filtered-products?ids=${collection.productIds.join(',')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

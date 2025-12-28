import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Loader2, Image as ImageIcon, Wand2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';

interface ScanResult {
    id: string;
    type: 'Product' | 'Brand' | 'Slide';
    name: string;
    field: string;
    data: string; // Store the base64 data for conversion
    index?: number; // For array fields like product images
}

export const ImageScanner: React.FC = () => {
    const { products, brands, carouselSlides, refreshProducts, refreshBrands, refreshSlides } = useShop();
    const { addToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [hasScanned, setHasScanned] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const isBase64 = (str: string | undefined | null) => {
        return str && typeof str === 'string' && str.startsWith('data:image');
    };

    const handleScan = () => {
        setIsScanning(true);
        setResults([]);

        // Simulate a short delay for UX
        setTimeout(() => {
            const newResults: ScanResult[] = [];

            // Scan Products
            products.forEach(p => {
                if (isBase64(p.image)) {
                    newResults.push({ id: p.id, type: 'Product', name: p.name, field: 'Main Image', data: p.image });
                }
                if (p.images && Array.isArray(p.images)) {
                    p.images.forEach((img, idx) => {
                        if (isBase64(img)) {
                            newResults.push({ id: p.id, type: 'Product', name: p.name, field: `Gallery Image ${idx + 1}`, data: img, index: idx });
                        }
                    });
                }
            });

            // Scan Brands
            brands.forEach(b => {
                if (isBase64(b.logo)) {
                    newResults.push({ id: b.id, type: 'Brand', name: b.name, field: 'Logo', data: b.logo || '' });
                }
            });

            // Scan Slides
            carouselSlides.forEach(s => {
                if (isBase64(s.image)) {
                    newResults.push({ id: s.id, type: 'Slide', name: s.title || 'Untitled Slide', field: 'Image', data: s.image });
                }
            });

            setResults(newResults);
            setIsScanning(false);
            setHasScanned(true);
        }, 1000);
    };

    const base64ToBlob = async (base64: string) => {
        const res = await fetch(base64);
        return await res.blob();
    };

    const uploadToSupabase = async (blob: Blob, prefix: string) => {
        const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error } = await supabase.storage
            .from('product-images')
            .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from('product-images').getPublicUrl(filename);
        return data.publicUrl;
    };

    const handleFixAll = async () => {
        if (!window.confirm(`This will convert ${results.length} images to Supabase Storage URLs. Continue?`)) return;

        setIsConverting(true);
        setProgress({ current: 0, total: results.length });
        let successCount = 0;

        try {
            for (let i = 0; i < results.length; i++) {
                const item = results[i];
                setProgress({ current: i + 1, total: results.length });

                try {
                    // 1. Convert to Blob
                    const blob = await base64ToBlob(item.data);

                    // 2. Upload to Supabase
                    const publicUrl = await uploadToSupabase(blob, item.type.toLowerCase());

                    // 3. Update Database
                    if (item.type === 'Product') {
                        if (item.field === 'Main Image') {
                            await supabase.from('products').update({ image: publicUrl }).eq('id', item.id);
                        } else if (item.field.startsWith('Gallery Image') && typeof item.index === 'number') {
                            // Fetch current array first to be safe
                            const { data: currentProduct } = await supabase.from('products').select('images').eq('id', item.id).single();
                            if (currentProduct && currentProduct.images) {
                                const newImages = [...currentProduct.images];
                                newImages[item.index] = publicUrl;
                                await supabase.from('products').update({ images: newImages }).eq('id', item.id);
                            }
                        }
                    } else if (item.type === 'Brand') {
                        await supabase.from('brands').update({ logo: publicUrl }).eq('id', item.id);
                    } else if (item.type === 'Slide') {
                        await supabase.from('slides').update({ image: publicUrl }).eq('id', item.id);
                    }

                    successCount++;
                } catch (error) {
                    console.error(`Failed to convert ${item.name}:`, error);
                }
            }

            addToast(`Successfully converted ${successCount} of ${results.length} images`, 'success');

            // Refresh data
            await refreshProducts();
            await refreshBrands();
            await refreshSlides();

            // Re-scan to show empty results
            handleScan();

        } catch (error) {
            console.error("Batch conversion failed:", error);
            addToast("Batch conversion failed. Check console.", 'error');
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Image Database Scanner</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Scan and migrate legacy base64 images to Supabase Storage.</p>
                </div>
                <div className="flex gap-3">
                    {results.length > 0 && (
                        <Button onClick={handleFixAll} disabled={isConverting || isScanning} variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
                            {isConverting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                            {isConverting ? `Converting ${progress.current}/${progress.total}` : 'Fix All Images'}
                        </Button>
                    )}
                    <Button onClick={handleScan} disabled={isScanning || isConverting} className="gap-2">
                        {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {isScanning ? 'Scanning...' : 'Start Scan'}
                    </Button>
                </div>
            </div>

            {isConverting && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                </div>
            )}

            {!hasScanned && !isScanning && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-200 dark:border-slate-700">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Scan</h3>
                    <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                        Click the button above to check all products, brands, and slides for unoptimized images.
                    </p>
                </div>
            )}

            {hasScanned && results.length === 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center border border-green-200 dark:border-green-900/50">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-green-800 dark:text-green-300">All Clear!</h3>
                    <p className="text-green-700 dark:text-green-400">No base64 images found. Your database is fully optimized.</p>
                </div>
            )}

            {hasScanned && results.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-amber-800 dark:text-amber-300">Found {results.length} items with base64 images</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                These items are storing images as large text strings instead of URLs.
                                Click "Fix All Images" to automatically upload them to Supabase Storage.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Type</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Name</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">Field</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-white">ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {results.map((result, index) => (
                                        <tr key={`${result.id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${result.type === 'Product' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        result.type === 'Brand' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                            'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'}`}>
                                                    {result.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{result.name}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{result.field}</td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-400">{result.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

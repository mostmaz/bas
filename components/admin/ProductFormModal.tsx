// Production-ready Product Form Modal - Fixed TypeScript errors
import React, { useState, useEffect } from 'react';
import { X, Upload, Wand2, Loader2, Trash2, Check, Plus, Image as ImageIcon, Gift } from 'lucide-react';
import { Button } from '../../components/Button';
import { Product, ProductVariant } from '../../types';
import { generateProductDescription, generateProductTags } from '../../services/geminiService';
import { useShop } from '../../context/ShopContext';
import { useToast } from '../../context/ToastContext';
import { compressImage } from '../../utils/imageCompression';
import { supabase } from '../../services/supabase';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: Product | null; // null = create mode
    onSave: (productData: Omit<Product, 'id' | 'rating'>) => void;
    isLoading?: boolean;
}

const COLOR_OPTIONS = [
    { name: 'Black', hex: '#18181b' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Lime', hex: '#84cc16' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, initialData, onSave, isLoading = false }) => {
    const { brands, devices, products, fetchProductDetails } = useShop();
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [isSaleEnabled, setIsSaleEnabled] = useState(false);

    // Variant Form State
    const [selectedVariantColor, setSelectedVariantColor] = useState<string>('');
    const [variantStock, setVariantStock] = useState('10');
    const [variantSku, setVariantSku] = useState('');
    const [variantImageIndex, setVariantImageIndex] = useState<number>(-1);

    const defaultState = {
        name: '',
        sku: '',
        price: '',
        salePrice: '',
        category: 'Mobile Case',
        device: '',
        brand: brands[0]?.name || 'CaseCraft',
        description: '',
        images: [] as string[],
        stock: '10',
        colors: [] as string[], // Legacy simple colors
        variants: [] as ProductVariant[],
        tags: [] as string[],
        giftIcon: '',
        bonusMessage: ''
    };

    const [formData, setFormData] = useState(defaultState);

    // Find the live product data from context to ensure we have the latest (including description)
    const liveProduct = initialData ? products.find(p => p.id === initialData.id) : null;
    const productToUse = liveProduct || initialData;

    useEffect(() => {
        if (!isOpen) return;

        if (productToUse) {
            // Fetch full details if description is missing (optimization)
            if (!productToUse.description && productToUse.id) {
                fetchProductDetails(productToUse.id);
            }

            setFormData({
                name: productToUse.name,
                sku: productToUse.sku || '',
                price: productToUse.price.toString(),
                salePrice: productToUse.salePrice ? productToUse.salePrice.toString() : '',
                category: productToUse.category || 'Mobile Case',
                device: productToUse.device,
                brand: productToUse.brand,
                description: productToUse.description || '',
                images: productToUse.images && productToUse.images.length > 0 ? productToUse.images : [productToUse.image],
                stock: productToUse.stock.toString(),
                colors: productToUse.colors || [],
                variants: productToUse.variants || [],
                tags: productToUse.tags || [],
                giftIcon: productToUse.giftIcon || '',
                bonusMessage: productToUse.bonusMessage || ''
            });
            setIsSaleEnabled(!!productToUse.salePrice);
        } else {
            // Only reset to default if we are opening in create mode
            // We use a functional update or check if it's already initialized to avoid overwriting if brands load late?
            // Actually, for create mode, we just want to set defaults once when opening.
            setFormData({ ...defaultState, brand: brands[0]?.name || 'CaseCraft' });
            setIsSaleEnabled(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, productToUse?.id]); // Only re-run if modal opens or product ID changes

    // Recalculate total stock when variants change
    useEffect(() => {
        if (formData.variants.length > 0) {
            const totalStock = formData.variants.reduce((sum, v) => sum + v.stock, 0);
            setFormData(prev => ({ ...prev, stock: totalStock.toString() }));
        }
    }, [formData.variants]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessingImage(true);
        const newImages: string[] = [];

        try {
            // Upload each file to Supabase Storage
            for (const file of Array.from(files)) {
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 10MB). Skipping.`);
                    continue;
                }

                // Compress image before upload
                let fileToUpload = file;
                try {
                    // Only compress images
                    if (file.type.startsWith('image/')) {
                        fileToUpload = await compressImage(file);
                    }
                } catch (compError) {
                    console.warn("Compression failed, using original file", compError);
                }

                const filename = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(filename, fileToUpload, {
                        contentType: fileToUpload.type || 'image/jpeg',
                        cacheControl: '31536000',
                        upsert: false
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filename);

                newImages.push(publicUrl);
            }

            // Add uploaded URLs to form data
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
            addToast(`${newImages.length} image(s) uploaded successfully`, 'success');
        } catch (error: any) {
            console.error('Upload error:', error);
            addToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            setIsProcessingImage(false);
        }
    };

    const removeImage = (index: number) => {
        const imageToRemove = formData.images[index];
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            // Also remove this image from variants if used
            variants: prev.variants.map(v => v.image === imageToRemove ? { ...v, image: '' } : v)
        }));
    };

    const handleAddVariant = () => {
        if (!selectedVariantColor) {
            alert("Please select a color");
            return;
        }

        const newVariant: ProductVariant = {
            id: Date.now().toString(),
            color: selectedVariantColor,
            stock: parseInt(variantStock) || 0,
            sku: variantSku,
            // If index is -1 or invalid, default to first image or empty
            image: variantImageIndex >= 0 && formData.images[variantImageIndex] ? formData.images[variantImageIndex] : (formData.images[0] || '')
        };

        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, newVariant],
            // Sync legacy colors array
            colors: Array.from(new Set([...prev.colors, selectedVariantColor]))
        }));

        // Reset mini form
        setSelectedVariantColor('');
        setVariantStock('10');
        setVariantSku('');
        setVariantImageIndex(-1);
    };

    const removeVariant = (id: string) => {
        setFormData(prev => {
            const newVariants = prev.variants.filter(v => v.id !== id);
            const remainingColors = Array.from(new Set(newVariants.map(v => v.color)));
            return {
                ...prev,
                variants: newVariants,
                colors: remainingColors
            };
        });
    };

    const updateVariantStock = (id: string, val: string) => {
        const stock = parseInt(val);
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map(v => v.id === id ? { ...v, stock: isNaN(stock) ? 0 : stock } : v)
        }));
    };

    const handleGenerateTags = async () => {
        if (!formData.name) return addToast("Please enter a product name first.", "error");

        setIsGeneratingTags(true);
        try {
            const tags = await generateProductTags(formData.name, formData.description);
            setFormData(prev => ({ ...prev, tags }));
            addToast(`Generated ${tags.length} smart tags`, 'success');
        } catch (e) {
            console.error(e);
            addToast("AI Tag Generation failed", 'error');
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!formData.name) return alert("Please enter a product name first.");
        if (formData.images.length === 0) return alert("Please upload an image first so the AI can see the product.");

        setIsGenerating(true);
        try {
            const desc = await generateProductDescription(formData.name, formData.images[0]);
            setFormData(prev => ({ ...prev, description: desc }));
        } catch (e) {
            console.error(e);
            alert("AI Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isProcessingImage) return;

        // Auto-generate search tags if missing
        // Removed tag generation as it's not supported in Vite yet
        // let finalTags = formData.tags;

        // Fallback if no images
        const finalImages = formData.images.length > 0
            ? formData.images
            : ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=75'];

        onSave({
            name: formData.name,
            sku: formData.sku,
            price: parseFloat(formData.price),
            salePrice: isSaleEnabled && formData.salePrice ? parseFloat(formData.salePrice) : undefined,
            category: formData.category,
            device: formData.device,
            brand: formData.brand,
            description: formData.description,
            image: finalImages[0],
            images: finalImages,
            stock: parseInt(formData.stock),
            colors: formData.colors,
            variants: formData.variants,
            tags: formData.tags,
            giftIcon: formData.giftIcon,
            bonusMessage: formData.bonusMessage
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{initialData ? 'Edit Product' : 'Add New Product'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Product Name</label>
                        <input
                            required
                            type="text"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Device Name</label>
                            <select
                                required
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none"
                                value={formData.device}
                                onChange={e => setFormData({ ...formData, device: e.target.value })}
                            >
                                <option value="" disabled>Select Device</option>
                                {devices.map(device => (
                                    <option key={device.id} value={device.name}>{device.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Brand</label>
                            <select
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none"
                                value={formData.brand}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            >
                                {brands.map(b => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Price (IQD)</label>
                            <input
                                required
                                type="number"
                                step="100"
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        {/* Sale Price Toggle */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Sale Status</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="accent-indigo-600 h-4 w-4 rounded border-gray-300"
                                        checked={isSaleEnabled}
                                        onChange={(e) => setIsSaleEnabled(e.target.checked)}
                                    />
                                    <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">On Sale</span>
                                </label>
                            </div>

                            {isSaleEnabled ? (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input
                                        type="number"
                                        step="100"
                                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.salePrice}
                                        onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                                        placeholder="Enter discounted price"
                                    />
                                    {formData.price && formData.salePrice && parseFloat(formData.salePrice) >= parseFloat(formData.price) && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Sale price must be lower than regular price
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="h-[38px] w-full border border-dashed border-gray-200 dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center text-xs text-gray-400">
                                    Not on sale
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Main SKU</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none font-mono text-sm"
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="e.g. SKU-12345"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Product Images</label>

                        {/* Image List */}
                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 group">
                                        <img
                                            src={img}
                                            alt=""
                                            className="object-cover w-full h-full"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white z-10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        {idx === 0 && (
                                            <span className="absolute top-0 left-0 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-br-md z-10">Main</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <label className={`flex-1 inline-flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors ${isProcessingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className="flex flex-col items-center">
                                    {isProcessingImage ? <Loader2 className="h-6 w-6 animate-spin mb-1 text-indigo-500" /> : <Upload className="h-6 w-6 mb-1 text-gray-400" />}
                                    <span>{isProcessingImage ? 'Processing...' : 'Upload Images'}</span>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    disabled={isProcessingImage}
                                />
                            </label>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400">Upload images before adding variants.</p>
                    </div>

                    {/* Variant Manager */}
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                            Variants (Color, Stock, SKU & Image)
                        </h4>

                        {/* Add Variant Inputs */}
                        <div className="flex flex-col gap-3 mb-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                            <div className="flex flex-wrap gap-2">
                                <div className="flex-1 min-w-[120px]">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLOR_OPTIONS.map((color) => {
                                            const isSelected = selectedVariantColor === color.hex;
                                            return (
                                                <button
                                                    key={color.name}
                                                    type="button"
                                                    onClick={() => setSelectedVariantColor(color.hex)}
                                                    className={`w-6 h-6 rounded-full border shadow-sm transition-all ${isSelected ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : 'hover:scale-105 opacity-80'}`}
                                                    style={{ backgroundColor: color.hex, borderColor: color.hex === '#FFFFFF' ? '#e5e7eb' : 'transparent' }}
                                                    title={color.name}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="w-20">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded p-1.5 dark:bg-slate-800 dark:text-white"
                                        value={variantStock}
                                        onChange={(e) => setVariantStock(e.target.value)}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        placeholder="SKU"
                                        className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded p-1.5 dark:bg-slate-800 dark:text-white font-mono"
                                        value={variantSku}
                                        onChange={(e) => setVariantSku(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Assign Image (Optional)</label>
                                <div className="flex gap-2 overflow-x-auto p-1 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900/50 custom-scrollbar">
                                    {formData.images.length > 0 ? formData.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setVariantImageIndex(idx)}
                                            className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${variantImageIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt="" className="object-cover w-full h-full" />
                                            {variantImageIndex === idx && (
                                                <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center z-10">
                                                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </button>
                                    )) : <span className="text-xs text-gray-400 p-2 italic">Upload images above first</span>}
                                </div>
                            </div>

                            <Button type="button" size="sm" onClick={handleAddVariant} disabled={!selectedVariantColor} className="w-full mt-1">
                                <Plus className="h-4 w-4 mr-1" /> Add Variant
                            </Button>
                        </div>

                        {/* Variant List */}
                        {formData.variants.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {formData.variants.map((v) => (
                                    <div key={v.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: v.color }}></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500 mb-0.5">Stock</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-16 text-xs border border-gray-300 dark:border-slate-600 rounded px-1 py-0.5 dark:bg-slate-800 dark:text-white"
                                                    value={v.stock}
                                                    onChange={(e) => updateVariantStock(v.id, e.target.value)}
                                                />
                                            </div>
                                            {v.sku && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 mb-0.5">SKU</span>
                                                    <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{v.sku}</span>
                                                </div>
                                            )}
                                            {v.image ? (
                                                <div className="relative w-8 h-8 rounded overflow-hidden border border-gray-200">
                                                    <img src={v.image} alt="" className="object-cover w-full h-full" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300">
                                                    <ImageIcon className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => removeVariant(v.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-center text-gray-500 italic py-2">No variants added yet.</p>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
                            <button
                                type="button"
                                onClick={handleGenerateDescription}
                                disabled={isGenerating || formData.images.length === 0}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                <Wand2 className="h-3 w-3" />
                                {isGenerating ? 'Analyzing...' : 'Generate from Image'}
                            </button>
                        </div>
                        <textarea
                            required
                            rows={3}
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter description or generate one..."
                        />
                    </div>

                    {/* Smart Search Tags */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Smart Search Tags</label>
                            <button
                                type="button"
                                onClick={handleGenerateTags}
                                disabled={isGeneratingTags || !formData.name}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                <Wand2 className="h-3 w-3" />
                                {isGeneratingTags ? 'Generating...' : 'Generate Smart Tags'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md min-h-[40px]">
                            {formData.tags && formData.tags.length > 0 ? (
                                formData.tags.map((tag, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full border border-purple-100 dark:border-purple-800">
                                        {tag}
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }))}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic">No tags generated yet. Use the button above to generate smart tags for search.</span>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Add tag manually and press Enter"
                            className="mt-2 w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 text-sm dark:text-white outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !formData.tags.includes(val)) {
                                        setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Total Stock</label>
                        <input
                            required
                            type="number"
                            min="0"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 rounded-md px-3 py-2 dark:text-white outline-none"
                            value={formData.stock}
                            readOnly
                            title="Calculated from variants"
                        />
                    </div>

                    {/* Gift Icon Upload */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                        <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            Gift & Bonus Settings
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gift Icon (Optional)</label>
                                <div className="flex items-center gap-4">
                                    {formData.giftIcon && (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 group">
                                            <img src={formData.giftIcon} alt="Gift Icon" className="object-cover w-full h-full" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, giftIcon: '' }))}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                    <label className="flex-1 cursor-pointer">
                                        <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                                            <Upload className="h-4 w-4 mr-2" />
                                            {formData.giftIcon ? 'Change Icon' : 'Upload Gift Icon'}
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                setIsProcessingImage(true);
                                                try {
                                                    const filename = `gift_icon_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                                                    const { data, error } = await supabase.storage
                                                        .from('product-images')
                                                        .upload(filename, file, {
                                                            contentType: file.type || 'image/jpeg',
                                                            cacheControl: '31536000',
                                                            upsert: false
                                                        });

                                                    if (error) throw error;

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('product-images')
                                                        .getPublicUrl(filename);

                                                    setFormData(prev => ({ ...prev, giftIcon: publicUrl }));
                                                    addToast("Gift icon uploaded", 'success');
                                                } catch (error: any) {
                                                    console.error('Upload error:', error);
                                                    addToast(`Upload failed: ${error.message}`, 'error');
                                                } finally {
                                                    setIsProcessingImage(false);
                                                }
                                            }}
                                            disabled={isProcessingImage}
                                        />
                                    </label>
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400">Upload a small icon to be displayed on the product card.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bonus Message</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-3 py-2 dark:text-white outline-none"
                                    value={formData.bonusMessage || ''}
                                    onChange={e => setFormData({ ...formData, bonusMessage: e.target.value })}
                                    placeholder="e.g. Free Screen Protector included!"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isProcessingImage || isGenerating || isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {initialData ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                initialData ? 'Update Product' : 'Add Product'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

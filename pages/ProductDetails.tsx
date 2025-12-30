import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ArrowLeft, Star, Truck, ShieldCheck, Share2, Heart, Check, AlertCircle, Tag, Gift, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { ProductVariant } from '../types';
import { ProductBottomNav } from '../components/ProductBottomNav';

import { optimizeImage } from '../utils/imageUtils';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, addToCart, t, wishlist, toggleWishlist, fetchProductDetails, language, isCartOpen } = useShop();
  const navigate = useNavigate();

  const product = products.find(p => p.id === id);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set());
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (product) {
      // Fetch full details if description is missing (optimization)
      if (!product.description && id) {
        fetchProductDetails(id);
      }

      setActiveImage(product.image);
      // Pre-select first variant if available and in stock
      if (product.variants && product.variants.length > 0) {
        const firstInStock = product.variants.find(v => v.stock > 0);
        if (firstInStock) {
          setSelectedVariant(firstInStock);
          if (firstInStock.image) setActiveImage(firstInStock.image);
        }
      }
    }
  }, [product, id, fetchProductDetails]);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.image) {
      setActiveImage(variant.image);
    }
  };

  const handleImageClick = (img: string) => {
    if (img !== activeImage) {
      setIsImageLoading(true);
      setActiveImage(img);
    }
    // Auto-select variant if image matches
    if (product?.variants) {
      const matchingVariant = product.variants.find(v => v.image === img && v.stock > 0);
      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
      }
    }
  };

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && p.device === product.device)
      .slice(0, 6);
  }, [products, product]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('noProducts')}</h2>
        <Button onClick={() => navigate('/')}>{t('back')}</Button>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);

  // Merge base images with variant images for the gallery
  const baseImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const variantImages = product.variants ? product.variants.map(v => v.image).filter(img => img && img.length > 0) : [];

  // Robust Deduplication
  const uniqueImages = new Set<string>();
  const normalizedImages = new Set<string>();

  const addImage = (img: string) => {
    if (!img) return;

    // Optimization: Skip normalization for base64 images to prevent performance issues
    if (img.startsWith('data:')) {
      if (!uniqueImages.has(img)) {
        uniqueImages.add(img);
      }
      return;
    }

    try {
      const normalized = decodeURIComponent(img).split('?')[0].split('#')[0].trim().toLowerCase();
      if (!normalizedImages.has(normalized)) {
        uniqueImages.add(img);
        normalizedImages.add(normalized);
      }
    } catch (e) {
      if (!uniqueImages.has(img)) {
        uniqueImages.add(img);
      }
    }
  };

  if (variantImages.length > 0) {
    variantImages.forEach(addImage);
  } else {
    baseImages.forEach(addImage);
  }

  const galleryImages = Array.from(uniqueImages);
  const availableVariants = product.variants ? product.variants.filter(v => v.stock > 0) : [];
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div key={id} className="pt-0 pb-32">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square w-full rounded-none sm:rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-b sm:border border-slate-200 dark:border-white/5 relative group shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all">
              <div className={`absolute inset-0 flex items-center justify-center z-20 bg-slate-100 dark:bg-slate-800 transition-opacity duration-500 ${isImageLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              <img
                key={activeImage}
                src={optimizeImage(activeImage || product.image, 800)}
                alt={product.name}
                onLoad={() => setIsImageLoading(false)}
                className={`w-full h-full object-cover object-center transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              />
              {/* Sale Tag */}
              {product.salePrice && (
                <div className="absolute top-6 left-6 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md flex items-center gap-1">
                  <Tag className="h-3 w-3" /> {discountPercent}% OFF
                </div>
              )}

              <div className="absolute top-6 right-6 space-y-3 opacity-0 group-hover:opacity-100 transition-opacity rtl:right-auto rtl:left-6 z-10">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3 backdrop-blur-md rounded-full shadow-lg transition-colors border border-white/20 dark:border-white/10 ${isWishlisted
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-white hover:text-red-500 dark:hover:text-red-500 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg text-slate-600 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900 transition-colors border border-white/20 dark:border-white/10">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 px-4 sm:px-1 snap-x no-scrollbar">
                {galleryImages.map((img, idx) => {
                  const isThumbLoaded = loadedThumbnails.has(img);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleImageClick(img)}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all snap-start ${activeImage === img
                        ? 'border-purple-600 ring-2 ring-purple-600/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    >
                      <div className={`absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 transition-opacity duration-300 ${!isThumbLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      </div>
                      <img
                        src={optimizeImage(img, 200)}
                        alt={`View ${idx + 1}`}
                        loading="lazy"
                        onLoad={() => setLoadedThumbnails(prev => new Set(prev).add(img))}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${!isThumbLoaded ? 'opacity-0' : 'opacity-100'}`}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product Name & Price */}
            <div className="mx-4 sm:mx-0 mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-row-reverse rtl:flex-row justify-between items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight text-right flex-1">{product.name}</h1>

              <div className="flex flex-col items-end shrink-0">
                {product.salePrice ? (
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                      IQD {product.salePrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-400 line-through decoration-slate-400/50">
                      IQD {product.price.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-purple-700 dark:text-white">
                    IQD {product.price.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col justify-center px-4 sm:px-0">
            {/* Color/Variant Selection */}
            {availableVariants.length > 0 && (
              <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className={`flex justify-between items-center mb-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('selectColor')}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${currentStock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {currentStock} {t('inStock')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {availableVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      className={`w-8 h-8 rounded-full border-2 shadow-sm flex items-center justify-center transition-all relative ${selectedVariant?.id === variant.id ? 'border-purple-600 scale-110 ring-2 ring-purple-500/10' : 'border-slate-200 dark:border-slate-600 hover:scale-105'}`}
                      style={{ backgroundColor: variant.color }}
                      title={`${variant.stock} available`}
                    >
                      {selectedVariant?.id === variant.id && (
                        <Check className={`h-6 w-6 drop-shadow-md ${['#FFFFFF', '#ffffff', '#fff'].includes(variant.color) ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>

                {selectedVariant && selectedVariant.stock < 5 && (
                  <div className="mt-3 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 py-1.5 px-3 rounded-lg w-fit">
                    <AlertCircle className="h-3 w-3 mr-1.5" />
                    {t('hurryOnly')} {selectedVariant.stock} {t('leftInStock')}
                  </div>
                )}

                {/* Bonus Message */}
                {product.bonusMessage && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                    <div className="p-1 bg-amber-100 dark:bg-amber-800 rounded-full shrink-0">
                      <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      {product.bonusMessage}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Custom Notification Bar */}
            {product.customNotification && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center text-center">
                  <p className="font-medium text-lg">{product.customNotification}</p>
                </div>
              </div>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mb-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('youMightAlsoLike')}</h2>
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x">
                  {relatedProducts.map(p => (
                    <div key={p.id} className="min-w-[160px] sm:min-w-[180px] snap-start">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button (Outside Variant Box - if no variants) */}
            {availableVariants.length === 0 && (
              <div className="mb-8">
                {/* Bonus Message */}
                {product.bonusMessage && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                    <div className="p-1 bg-amber-100 dark:bg-amber-800 rounded-full shrink-0">
                      <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      {product.bonusMessage}
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
              {product.description}
              <br /><br />
              {t('genericProductDesc')}
            </p>

            {/* Rating */}
            <div className="flex items-center mb-8">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                ))}
              </div>
              <span className="ml-4 text-sm text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">128 {t('reviews')}</span>
            </div>

            {/* Wishlist Button */}
            <div className="flex gap-4 mb-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => toggleWishlist(product.id)}
                className={`flex-1 px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 ${isWishlisted ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/10' : 'text-slate-600 dark:text-slate-300'}`}
              >
                <Heart className={`h-6 w-6 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
                {isWishlisted ? t('wishlist') : t('wishlist')}
              </Button>
            </div>

            {/* Value Props */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-8 space-y-6">
              <div className={`flex items-start ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Truck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className={`ml-4 rtl:mr-4 rtl:ml-0 ${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">{t('fastShipping')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('fastShippingDesc')}</p>
                </div>
              </div>
              <div className={`flex items-start ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className={`ml-4 rtl:mr-4 rtl:ml-0 ${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">{t('qualityGuarantee')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('qualityDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isCartOpen && (
        <ProductBottomNav
          product={product}
          selectedVariant={selectedVariant}
          currentStock={currentStock}
          onAddToCart={() => addToCart(product, selectedVariant || undefined)}
        />
      )}
    </div>
  );
};

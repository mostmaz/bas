
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ArrowLeft, Star, Truck, ShieldCheck, Share2, Heart, Check, AlertCircle, Tag } from 'lucide-react';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { ProductVariant } from '../types';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, addToCart, t, wishlist, toggleWishlist } = useShop();
  const navigate = useNavigate();

  const product = products.find(p => p.id === id);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (product) {
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
  }, [product]);

  const handleVariantSelect = (variant: ProductVariant) => {
     setSelectedVariant(variant);
     if (variant.image) {
        setActiveImage(variant.image);
     }
  };
  
  const handleImageClick = (img: string) => {
    setActiveImage(img);
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
      .filter(p => p.id !== product.id && (p.category === product.category || p.device === product.device))
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
  // Ensure we filter out empty strings and duplicates
  const baseImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const variantImages = product.variants ? product.variants.map(v => v.image).filter(img => img && img.length > 0) : [];
  const galleryImages = Array.from(new Set([...baseImages, ...variantImages])).filter(Boolean);
  
  // Available Variants (Stock > 0) - Only show if stock is available
  // Only hide variants if they have 0 stock to prevent selection
  // Safeguard against undefined variants with optional chaining
  const availableVariants = product.variants ? product.variants.filter(v => v.stock > 0) : [];
  
  // Determine current stock display
  // If a variant is selected, show its stock. Otherwise show total product stock.
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  // Discount Calculation
  const discountPercent = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
    : 0;

  return (
    <div className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Back */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8 flex-wrap">
          <button onClick={() => navigate(-1)} className="hover:text-purple-600 dark:hover:text-white flex items-center transition-colors font-medium">
            <ArrowLeft className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" /> {t('back')}
          </button>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="cursor-pointer hover:text-purple-600 dark:hover:text-white" onClick={() => navigate('/')}>{t('shop')}</span>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="cursor-pointer hover:text-purple-600 dark:hover:text-white" onClick={() => navigate('/')}>{product.brand}</span>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[150px] sm:max-w-none">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/4] w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 relative group shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all">
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-opacity duration-300"
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
                   className={`p-3 backdrop-blur-md rounded-full shadow-lg transition-colors border border-white/20 dark:border-white/10 ${
                     isWishlisted 
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
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x no-scrollbar">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleImageClick(img)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all snap-start ${
                      activeImage === img
                        ? 'border-purple-600 ring-2 ring-purple-600/20' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`View ${idx + 1}`} 
                      loading="lazy"
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 uppercase tracking-wider">
                {product.brand}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-8">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                ))}
              </div>
              <span className="ml-4 text-sm text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">128 {t('reviews')}</span>
            </div>

            <div className="flex flex-col mb-8">
              {product.salePrice ? (
                <div className="flex items-baseline gap-3">
                   <div className="text-4xl font-bold text-red-600 dark:text-red-500">
                     IQD {product.salePrice.toLocaleString()}
                   </div>
                   <div className="text-xl text-slate-400 line-through decoration-slate-400/50">
                     IQD {product.price.toLocaleString()}
                   </div>
                </div>
              ) : (
                <div className="text-4xl font-bold text-purple-700 dark:text-white flex items-baseline gap-2">
                  IQD {product.price.toLocaleString()}
                </div>
              )}
            </div>
            
            {/* Color/Variant Selection */}
            {availableVariants.length > 0 && (
              <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Color</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${currentStock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {currentStock} in stock
                    </span>
                 </div>
                 
                 <div className="flex flex-wrap gap-3">
                    {availableVariants.map((variant) => (
                       <button
                         key={variant.id}
                         onClick={() => handleVariantSelect(variant)}
                         className={`w-12 h-12 rounded-full border-2 shadow-sm flex items-center justify-center transition-all relative ${selectedVariant?.id === variant.id ? 'border-purple-600 scale-110 ring-4 ring-purple-500/10' : 'border-slate-200 dark:border-slate-600 hover:scale-105'}`}
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
                       Hurry! Only {selectedVariant.stock} left in stock.
                    </div>
                 )}
              </div>
            )}

            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
              {product.description}
              <br /><br />
              {t('genericProductDesc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                size="lg" 
                onClick={() => addToCart(product, selectedVariant || undefined)}
                disabled={currentStock < 1}
                className="flex-1 py-4 text-lg shadow-xl shadow-purple-600/20"
              >
                {currentStock < 1 ? 'Out of Stock' : t('addToCart')}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => toggleWishlist(product.id)}
                className={`px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 ${isWishlisted ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/10' : 'text-slate-600 dark:text-slate-300'}`}
              >
                <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Value Props */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-8 space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Truck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4 rtl:mr-4 rtl:ml-0">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">{t('fastShipping')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('fastShippingDesc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="ml-4 rtl:mr-4 rtl:ml-0">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">{t('qualityGuarantee')}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('qualityDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('youMightAlsoLike')}</h2>
             <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x">
                {relatedProducts.map(p => (
                   <div key={p.id} className="min-w-[200px] sm:min-w-[240px] snap-start">
                      <ProductCard product={p} />
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

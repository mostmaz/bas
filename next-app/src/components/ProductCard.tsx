
import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Eye, Heart } from 'lucide-react';
import { Product } from '@/types';
import { useShop } from '@/context/ShopContext';
import { useRouter } from 'next/navigation';
import { ProductQuickViewModal } from './ProductQuickViewModal';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const router = useRouter();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleNavigate = () => {
    router.push(`/product/${product.id}`);
  };

  const isWishlisted = wishlist.includes(product.id);

  // Determine display colors (Legacy 'colors' or new 'variants')
  // Filter out variants with 0 stock
  const displayColors = product.variants
    ? product.variants.filter(v => v.stock > 0).map(v => v.color)
    : product.colors || [];

  const uniqueDisplayColors = Array.from(new Set(displayColors));

  // Calculate discount percentage
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:border-pink-500/30 hover:-translate-y-1">
        <div onClick={handleNavigate} className="block relative cursor-pointer">
          <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={`object-cover object-center transition-all duration-700 ${isImageLoaded ? 'opacity-95 dark:opacity-90 group-hover:scale-110 group-hover:opacity-100' : 'opacity-0 scale-100'}`}
              onLoad={() => setIsImageLoaded(true)}
              priority={false}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Sale Badge */}
            {product.salePrice && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                {discountPercent}% OFF
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-[55%] right-2 sm:right-3 z-10 flex flex-col gap-1.5 sm:gap-2 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="flex items-center justify-center rounded-full bg-white text-slate-900 p-1.5 sm:p-2 shadow-lg shadow-black/20 hover:bg-purple-600 hover:text-white transition-all hover:scale-110 active:scale-95"
            aria-label="Add to cart"
            title="Add to Cart"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsQuickViewOpen(true);
            }}
            className="flex items-center justify-center rounded-full bg-white text-slate-900 p-1.5 sm:p-2 shadow-lg shadow-black/20 hover:bg-pink-600 hover:text-white transition-all delay-75 hover:scale-110 active:scale-95"
            aria-label="Quick view"
            title="Quick View"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className={`flex items-center justify-center rounded-full p-1.5 sm:p-2 shadow-lg shadow-black/20 transition-all delay-100 hover:scale-110 active:scale-95 ${isWishlisted
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white text-slate-900 hover:bg-red-500 hover:text-white'
              }`}
            aria-label="Add to wishlist"
            title="Wishlist"
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-2 sm:p-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
            <div className="w-full">
              <p className="text-[9px] sm:text-[10px] font-medium text-purple-600 dark:text-purple-400 mb-0.5 line-clamp-1">{product.device}</p>
              <div onClick={handleNavigate} className="cursor-pointer">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-1 leading-tight">
                  {product.name}
                </h3>
              </div>

              {/* Color Indicators */}
              {uniqueDisplayColors.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="flex -space-x-1">
                    {uniqueDisplayColors.slice(0, 4).map((color, idx) => (
                      <div
                        key={idx}
                        className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  {uniqueDisplayColors.length > 4 && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">+{uniqueDisplayColors.length - 4}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end mt-1 sm:mt-0">
              {product.salePrice ? (
                <>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 line-through mb-0.5">IQD {product.price.toLocaleString()}</p>
                  <p className="self-start text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-1.5 py-0.5 rounded-lg border border-red-100 dark:border-red-900/20 whitespace-nowrap">
                    IQD {product.salePrice.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="self-start text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20 whitespace-nowrap">
                  IQD {product.price.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductQuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        product={product}
      />
    </>
  );
};

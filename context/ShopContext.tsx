




import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem, CarouselSlide, Theme, Language, Order, Brand, ProductVariant, DiscountCode } from '../types';
import { INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_SLIDES, TRANSLATIONS, INITIAL_DISCOUNTS } from '../constants';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useToast } from './ToastContext';

interface ShopContextType {
  // Shop Data
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  brands: Brand[];
  carouselSlides: CarouselSlide[];
  orders: Order[];
  discounts: DiscountCode[];
  
  // Settings
  shippingFee: number;
  updateShippingFee: (fee: number) => Promise<void>;
  storeLogo: string;
  updateStoreLogo: (logo: string) => Promise<void>;
  
  // UI State
  isCartOpen: boolean;
  theme: Theme;
  language: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
  isOnline: boolean;
  supaConnectionError: string | null;
  isAppLoading: boolean;

  // Actions
  refreshBrands: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'rating'> & { id?: string, rating?: number }) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addBrand: (name: string, logo?: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addSlide: (slide: CarouselSlide) => Promise<void>;
  updateSlide: (slide: CarouselSlide) => Promise<void>;
  deleteSlide: (id: string) => Promise<void>;
  placeOrder: (orderData: Omit<Order, 'id' | 'date' | 'status'>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  toggleCart: () => void;
  clearCart: () => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  toggleWishlist: (productId: string) => void;

  // Discounts
  appliedDiscount: DiscountCode | null;
  applyDiscount: (code: string) => void;
  removeDiscount: () => void;
  addDiscount: (discount: Omit<DiscountCode, 'id'>) => Promise<void>;
  deleteDiscount: (id: string) => Promise<void>;
  toggleDiscountStatus: (id: string, currentStatus: boolean) => Promise<void>;
  
  // Demo Data
  isDemoActive: boolean;
  toggleDemoData: () => void;
  
  totalAmount: number; // Subtotal (sum of item prices)
  discountAmount: number; // Calculated discount
  finalTotal: number; // Subtotal - Discount
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

interface ShopProviderProps {
  children: ReactNode;
}

const DEFAULT_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f97316;stop-opacity:1' /%3E%3Cstop offset='50%25' style='stop-color:%23ec4899;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%239333ea;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='25' fill='url(%23grad)' /%3E%3Ctext x='50' y='62' font-family='Arial, sans-serif' font-weight='bold' font-size='60' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E";

// Helper to map database lowercase columns to camelCase Order interface
const mapOrderFromDB = (data: any): Order => ({
  id: data.id,
  customerName: data.customerName || data.customername || 'Unknown',
  phone: data.phone || '',
  city: data.city || '',
  address: data.address || '',
  // Handle items if they come back as a JSON string or already an object
  items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
  totalAmount: Number(data.totalAmount || data.totalamount || 0),
  shippingFee: Number(data.shippingFee || data.shippingfee || 0),
  discountAmount: Number(data.discountAmount || data.discountamount || 0),
  discountCode: data.discountCode || data.discountcode || undefined,
  orderNumber: data.orderNumber || data.ordernumber || '',
  status: data.status || 'Processing',
  date: Number(data.date || Date.now()),
});

// Helper for discounts mapping (Handles Postgres lowercase column names)
const mapDiscountFromDB = (d: any): DiscountCode => ({
  id: String(d.id),
  code: d.code,
  type: d.type,
  value: d.value,
  minOrderAmount: d.minorderamount !== undefined ? d.minorderamount : (d.minOrderAmount || 0),
  isActive: d.isactive !== undefined ? d.isactive : (d.isActive !== undefined ? d.isActive : true)
});

// Helper to map Product from DB with multiple images support
const mapProductFromDB = (p: any): Product => {
  // If images array exists in DB, use it. Otherwise, fallback to single image or empty array.
  let images = p.images || (p.image ? [p.image] : []);
  
  // Ensure the primary 'image' property is set for backward compatibility
  // If 'images' array has items, use the first one. Else use the legacy 'image' field.
  let mainImage = p.image;
  if (images.length > 0 && (!mainImage || mainImage !== images[0])) {
    mainImage = images[0];
  }

  // Handle variants JSONB safely
  let variants: ProductVariant[] = [];
  // Check if variants property exists at all on the returned object
  if (Object.prototype.hasOwnProperty.call(p, 'variants') && p.variants) {
     if (typeof p.variants === 'string') {
        try { variants = JSON.parse(p.variants); } catch (e) { console.error("Error parsing variants JSON", e); }
     } else if (Array.isArray(p.variants)) {
        variants = p.variants;
     }
  }

  return {
    ...p,
    image: mainImage,
    images: images,
    colors: p.colors || [],
    variants: variants,
    salePrice: p.sale_price || p.salePrice || undefined,
    sku: p.sku || undefined
  };
};

// Placeholder images for demo generation
const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1585351770602-6266d8e65505?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1541876919352-7f111dfb7841?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=75',
];

const DEMO_CATEGORIES = ['Artistic', 'Minimalist', 'Urban', 'Nature', 'Tech', 'Luxury'];
const DEMO_DEVICES = ['iPhone 15', 'iPhone 14', 'Samsung S24', 'Pixel 8', 'iPhone 15 Pro Max'];

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
  const { addToast } = useToast();
  
  // --- STATE ---
  // Initialize with fallback data immediately if in offline/demo mode to skip splash screen
  const [products, setProducts] = useState<Product[]>(() => isSupabaseConfigured ? [] : INITIAL_PRODUCTS);
  const [brands, setBrands] = useState<Brand[]>(() => isSupabaseConfigured ? [] : INITIAL_BRANDS);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(() => isSupabaseConfigured ? [] : INITIAL_SLIDES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>(INITIAL_DISCOUNTS);
  const [shippingFee, setShippingFee] = useState<number>(5000);
  
  // Persistent Logo State: Try local storage first, then default
  const [storeLogo, setStoreLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('storeLogo') || DEFAULT_LOGO;
    } catch {
      return DEFAULT_LOGO;
    }
  });

  const [supaConnectionError, setSupaConnectionError] = useState<string | null>(null);
  
  // Only start loading state if we are actually connected to Supabase
  const [isAppLoading, setIsAppLoading] = useState(isSupabaseConfigured);
  
  // Local-only state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoActive, setIsDemoActive] = useState(false);

  // Apply Theme and Language Effects
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.lang = language;
  }, [theme, language]);

  // Persist Wishlist
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);
  
  // Update Favicon based on store logo
  useEffect(() => {
    const updateFavicon = (url: string) => {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = url;
    };
    updateFavicon(storeLogo);
  }, [storeLogo]);

  // Helper to refresh brands specifically
  const refreshBrands = async () => {
     if (isSupabaseConfigured) {
         const { data, error } = await supabase.from('brands').select('*').order('id', { ascending: true });
         if (error) console.error("Error refreshing brands:", error);
         if (data) {
             setBrands(data.map(b => ({ ...b, id: String(b.id) })) as Brand[]);
         }
     }
  };

  // Helper to refresh products
  const refreshProducts = async () => {
    if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
        if (error) console.error("Error refreshing products:", error);
        if (data) {
            setProducts(data.map(mapProductFromDB));
        }
    }
  };
  
  // Helper to refresh discounts
  const refreshDiscounts = async () => {
     if (isSupabaseConfigured) {
       const { data, error } = await supabase.from('discounts').select('*').order('id', { ascending: false });
       if (error) console.error("Error refreshing discounts:", error);
       if (data) {
         setDiscounts(data.map(mapDiscountFromDB));
       }
     }
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    // If offline/demo mode, data is already initialized via useState defaults.
    // Return early to avoid async overhead and keep app interactive immediately.
    if (!isSupabaseConfigured) return;

    const loadData = async () => {
      setIsAppLoading(true);
      try {
        // Parallel fetching to reduce loading time
        const [productsRes, brandsRes, slidesRes, ordersRes, settingsRes, discountsRes] = await Promise.all([
          supabase.from('products').select('*').order('id', { ascending: false }),
          supabase.from('brands').select('*').order('id', { ascending: true }),
          supabase.from('slides').select('*'),
          supabase.from('orders').select('*').order('date', { ascending: false }),
          supabase.from('store_settings').select('*').single(),
          supabase.from('discounts').select('*')
        ]);

        if (productsRes.error) throw productsRes.error; // Critical error check
        
        // 1. Products
        if (productsRes.data) {
            setProducts(productsRes.data.map(mapProductFromDB));
        }

        // 2. Brands
        if (brandsRes.data) {
            setBrands(brandsRes.data.map(b => ({ ...b, id: String(b.id) })) as Brand[]);
        }

        // 3. Slides
        if (slidesRes.data) setCarouselSlides(slidesRes.data);

        // 4. Orders
        if (ordersRes.data) {
          setOrders(ordersRes.data.map(mapOrderFromDB));
        }

        // 5. Settings
        if (settingsRes.data) {
           if (settingsRes.data.shipping_fee) setShippingFee(settingsRes.data.shipping_fee);
           if (settingsRes.data.logo) {
             setStoreLogo(settingsRes.data.logo);
             // Sync DB logo to localStorage
             localStorage.setItem('storeLogo', settingsRes.data.logo);
           }
        }

        // 6. Discounts
        if (discountsRes.data) {
           setDiscounts(discountsRes.data.map(mapDiscountFromDB));
        }
        
        setSupaConnectionError(null);

      } catch (error: any) {
        // Extract meaningful error message
        let errorMsg = "Unknown error occurred";
        if (error instanceof Error) {
            errorMsg = error.message;
        } else if (typeof error === 'object' && error !== null) {
            // PostgrestError or similar
            errorMsg = error.message || error.details || error.hint || JSON.stringify(error);
        } else {
            errorMsg = String(error);
        }
        
        console.error("Supabase load error:", errorMsg);

        // Only show error if it's a connection/URL issue, not just empty tables
        if (errorMsg.includes('fetch') || errorMsg.includes('URL') || errorMsg.includes('apikey')) {
           setSupaConnectionError(errorMsg);
        }
        
        // Fallback to local data on error
        setProducts(INITIAL_PRODUCTS);
        setBrands(INITIAL_BRANDS);
        setCarouselSlides(INITIAL_SLIDES);
        setDiscounts(INITIAL_DISCOUNTS);
      } finally {
        setIsAppLoading(false);
      }
    };

    loadData();
  }, []);


  // --- ACTIONS ---

  const addProduct = async (product: Omit<Product, 'id' | 'rating'> & { id?: string, rating?: number }) => {
    const { salePrice, ...rest } = product;
    // Database expects snake_case for some columns if manually created, but we use map function
    // For insertion, we need to map back to DB schema if needed. 
    const dbProduct = {
       ...rest,
       sale_price: salePrice
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('products').insert([dbProduct]);
      if (error) {
        // Check for specific schema mismatch regarding 'images' or 'colors' or 'variants'
        const lowerMsg = (error.message || '').toLowerCase();
        if (error.code === '42703' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku')) {
           console.warn("Schema mismatch detected: column missing. Retrying without advanced fields.");
           addToast("Warning: Database Schema Outdated. Saved without complex data.", 'warning');
           
           // Remove the problematic fields and try again
           // Ensure 'image' (singular) is populated for thumbnail compatibility
           const { images, colors, variants, sale_price, sku, ...legacyProduct } = dbProduct;
           const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };
           
           const { error: retryError } = await supabase.from('products').insert([safeProduct]);
           if (retryError) throw retryError;
        } else {
           throw error;
        }
      }
      await refreshProducts();
      addToast('Product added successfully', 'success');
    } else {
      const newProduct: Product = {
        ...product,
        id: product.id || Date.now().toString(),
        rating: product.rating || 0,
        images: product.images || (product.image ? [product.image] : []),
        colors: product.colors || [],
        variants: product.variants || []
      };
      setProducts(prev => [newProduct, ...prev]);
      addToast('Product added locally (Demo)', 'success');
    }
  };

  const updateProduct = async (product: Product) => {
    const { salePrice, ...rest } = product;
    const dbProduct = { ...rest, sale_price: salePrice };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);
      if (error) {
        // Check for specific schema mismatch
        const lowerMsg = (error.message || '').toLowerCase();
        if (error.code === '42703' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku')) {
           console.warn("Schema mismatch detected: column missing. Retrying update without advanced fields.");
           addToast("Warning: Database Schema Outdated. Updated without complex data.", 'warning');

           // Remove the problematic fields and try again
           // Ensure 'image' is set
           const { images, colors, variants, sale_price, sku, ...legacyProduct } = dbProduct;
           const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };

           const { error: retryError } = await supabase.from('products').update(safeProduct).eq('id', safeProduct.id);
           if (retryError) throw retryError;
        } else {
           throw error;
        }
      }
      await refreshProducts();
      addToast('Product updated successfully', 'success');
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      addToast('Product updated locally (Demo)', 'success');
    }
  };

  const deleteProduct = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
         console.error(error);
         addToast('Failed to delete product', 'error');
         return;
      }
      await refreshProducts();
      addToast('Product deleted', 'success');
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
      addToast('Product deleted locally (Demo)', 'success');
    }
  };

  const addBrand = async (name: string, logo?: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('brands').insert([{ name, logo }]);
      if (error) throw error;
      await refreshBrands();
      addToast('Brand added successfully', 'success');
    } else {
      const newBrand: Brand = { id: Date.now().toString(), name, logo };
      setBrands(prev => [...prev, newBrand]);
      addToast('Brand added locally (Demo)', 'success');
    }
  };

  const deleteBrand = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      await refreshBrands();
      addToast('Brand deleted', 'success');
    } else {
      setBrands(prev => prev.filter(b => b.id !== id));
      addToast('Brand deleted locally (Demo)', 'success');
    }
  };
  
  const addDiscount = async (discount: Omit<DiscountCode, 'id'>) => {
    if (isSupabaseConfigured) {
      // Postgres column names are likely lowercase
      const dbDiscount = {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minorderamount: discount.minOrderAmount,
        isactive: discount.isActive
      };
      const { error } = await supabase.from('discounts').insert([dbDiscount]);
      if (error) throw error;
      await refreshDiscounts();
      addToast('Discount code added', 'success');
    } else {
      const newDiscount: DiscountCode = { ...discount, id: Date.now().toString() };
      setDiscounts(prev => [...prev, newDiscount]);
      addToast('Discount added locally (Demo)', 'success');
    }
  };

  const deleteDiscount = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('discounts').delete().eq('id', id);
      if (error) throw error;
      await refreshDiscounts();
      addToast('Discount code deleted', 'success');
    } else {
      setDiscounts(prev => prev.filter(d => d.id !== id));
      addToast('Discount deleted locally (Demo)', 'success');
    }
  };

  const toggleDiscountStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (isSupabaseConfigured) {
      // Use lowercase 'isactive' for DB update
      const { error } = await supabase.from('discounts').update({ isactive: newStatus }).eq('id', id);
      if (error) {
        console.error("Error toggling discount:", error);
        addToast('Failed to update status', 'error');
        return;
      }
      setDiscounts(prev => prev.map(d => d.id === id ? { ...d, isActive: newStatus } : d));
      addToast(`Discount ${newStatus ? 'activated' : 'deactivated'}`, 'success');
    } else {
      setDiscounts(prev => prev.map(d => d.id === id ? { ...d, isActive: newStatus } : d));
      addToast(`Discount ${newStatus ? 'activated' : 'deactivated'} (Local)`, 'success');
    }
  };

  const addSlide = async (slide: CarouselSlide) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('slides').insert([slide]);
      if (error) {
         console.error(error);
         addToast('Failed to add slide', 'error');
         return;
      }
      const { data } = await supabase.from('slides').select('*');
      if (data) setCarouselSlides(data);
      addToast('Slide added', 'success');
    } else {
      setCarouselSlides(prev => [...prev, slide]);
      addToast('Slide added locally (Demo)', 'success');
    }
  };

  const updateSlide = async (slide: CarouselSlide) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('slides').update(slide).eq('id', slide.id);
      if (error) {
         console.error(error);
         addToast('Failed to update slide', 'error');
         return;
      }
      const { data } = await supabase.from('slides').select('*');
      if (data) setCarouselSlides(data);
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
      const { data } = await supabase.from('slides').select('*');
      if (data) setCarouselSlides(data);
      addToast('Slide deleted', 'success');
    } else {
      setCarouselSlides(prev => prev.filter(s => s.id !== id));
      addToast('Slide deleted locally (Demo)', 'success');
    }
  };

  const placeOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const newOrder = {
      ...orderData,
      status: 'Processing',
      date: Date.now(),
      // Prepare for DB insertion
      customername: orderData.customerName,
      totalamount: orderData.totalAmount,
      shippingfee: orderData.shippingFee,
      discountamount: orderData.discountAmount,
      discountcode: orderData.discountCode,
      ordernumber: orderData.orderNumber
    };

    if (isSupabaseConfigured) {
       const dbPayload = {
         ...newOrder,
         items: newOrder.items // supabase-js handles JSON conversion
       };
       const { customerName, totalAmount, shippingFee, discountAmount, discountCode, orderNumber, ...cleanPayload } = dbPayload as any;

       const { error } = await supabase.from('orders').insert([cleanPayload]);
       if (error) {
         throw error;
       }
       
       // Update stock
       for (const item of orderData.items) {
          const product = products.find(p => p.id === item.id);
          if (product) {
             let newStock = product.stock;
             let variantsToUpdate = product.variants;
             
             // Update variant stock if applicable
             if (item.selectedVariant && variantsToUpdate) {
                variantsToUpdate = variantsToUpdate.map(v => {
                   if (v.id === item.selectedVariant?.id) {
                      return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                   }
                   return v;
                });
                // Recalculate total stock based on variants
                newStock = variantsToUpdate.reduce((sum, v) => sum + v.stock, 0);
                
                // We update both the variants JSON and the global stock number
                await supabase.from('products').update({ 
                   stock: newStock,
                   variants: variantsToUpdate
                }).eq('id', item.id);

             } else {
                // Fallback global stock update
                newStock = Math.max(0, product.stock - item.quantity);
                await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
             }
          }
       }
       
       // Refresh orders and products
       const { data: ordersData } = await supabase.from('orders').select('*').order('date', { ascending: false });
       if (ordersData) setOrders(ordersData.map(mapOrderFromDB));
       await refreshProducts();

    } else {
       // Local
       const localOrder: Order = {
          id: Date.now().toString(),
          customerName: orderData.customerName,
          phone: orderData.phone,
          city: orderData.city,
          address: orderData.address,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          shippingFee: orderData.shippingFee,
          discountAmount: orderData.discountAmount,
          discountCode: orderData.discountCode,
          status: 'Processing',
          date: Date.now(),
          orderNumber: orderData.orderNumber
       };
       setOrders(prev => [localOrder, ...prev]);
       
       // Update local stock
       setProducts(prev => prev.map(p => {
          const item = orderData.items.find(i => i.id === p.id);
          if (item) {
             if (item.selectedVariant && p.variants) {
                const updatedVariants = p.variants.map(v => {
                  if(v.id === item.selectedVariant?.id) return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                  return v;
                });
                return { ...p, variants: updatedVariants, stock: updatedVariants.reduce((a,b) => a + b.stock, 0) };
             }
             return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          }
          return p;
       }));
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) {
        console.error(error);
        addToast('Failed to update status', 'error');
        return;
      }
      const { data: ordersData } = await supabase.from('orders').select('*').order('date', { ascending: false });
      if (ordersData) setOrders(ordersData.map(mapOrderFromDB));
      addToast(`Order status updated to ${status}`, 'success');
    } else {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      addToast(`Order status updated to ${status}`, 'success');
    }
  };

  const updateShippingFee = async (fee: number) => {
    setShippingFee(fee);
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('store_settings').select('id').limit(1);
      if (data && data.length > 0) {
        await supabase.from('store_settings').update({ shipping_fee: fee }).eq('id', data[0].id);
      } else {
        await supabase.from('store_settings').insert([{ shipping_fee: fee }]);
      }
      addToast('Shipping fee updated', 'success');
    }
  };
  
  const updateStoreLogo = async (logo: string) => {
    // 1. Update State
    setStoreLogo(logo);
    
    // 2. Persist to Local Storage (Immediate fallback)
    try {
      localStorage.setItem('storeLogo', logo);
    } catch (e) {
      console.error("Local storage quota exceeded or failed", e);
    }

    // 3. Persist to Supabase
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('store_settings').select('id').limit(1);
      
      // If table is empty or error accessing it, handle graceful insertion attempt
      if (data && data.length > 0) {
        await supabase.from('store_settings').update({ logo: logo }).eq('id', data[0].id);
      } else {
        // Table likely empty or error. Try insert.
        await supabase.from('store_settings').insert([{ logo: logo }]);
      }
      addToast('Store logo updated', 'success');
    } else {
      addToast('Store logo updated (Local)', 'success');
    }
  };

  // --- LOCAL SHOPPING CART ---
  const addToCart = (product: Product, variant?: ProductVariant) => {
    setCart(prev => {
      // Create a composite key for product + variant
      // Ensure variant id exists if variant is passed
      const compositeId = (variant && variant.id) ? `${product.id}-${variant.id}` : product.id;
      
      const existing = prev.find(item => {
         const itemCompositeId = (item.selectedVariant && item.selectedVariant.id) ? `${item.id}-${item.selectedVariant.id}` : item.id;
         return itemCompositeId === compositeId;
      });

      if (existing) {
        return prev.map(item => {
           const itemCompositeId = (item.selectedVariant && item.selectedVariant.id) ? `${item.id}-${item.selectedVariant.id}` : item.id;
           return itemCompositeId === compositeId ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      
      // Override main image with variant image if available for cart display
      // If variant has an image, use it. Otherwise keep product.image.
      // IMPORTANT: Ensure we don't accidentally use an empty string if variant.image is missing
      const displayImage = (variant && variant.image) ? variant.image : product.image;

      return [...prev, { 
        ...product, 
        image: displayImage, 
        quantity: 1, 
        selectedVariant: variant 
      }];
    });
    setIsCartOpen(true);
    addToast(`${product.name} ${variant ? `(${variant.color})` : ''} added to cart`, 'success');
  };

  const removeFromCart = (id: string) => {
    // Current simple implementation removes by product ID
    // Ideally this should use the unique composite ID or index
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscount(null);
  };
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  
  // Translation Helper
  const t = (key: keyof typeof TRANSLATIONS.en) => {
    const translation = TRANSLATIONS[language][key];
    return translation || TRANSLATIONS['en'][key] || key;
  };
  
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        addToast('Removed from wishlist', 'info');
        return prev.filter(id => id !== productId);
      }
      addToast('Added to wishlist', 'success');
      return [...prev, productId];
    });
  };

  const toggleDemoData = async () => {
     if (isDemoActive) {
       setIsDemoActive(false);
       if (!isSupabaseConfigured) setProducts(INITIAL_PRODUCTS);
       return;
     }

     setIsDemoActive(true);
     // Generate dummy products
     const demoProducts: Product[] = [];
     const brandList = brands.length > 0 ? brands : INITIAL_BRANDS;
     
     for (let i = 0; i < 30; i++) {
        const brand = brandList[Math.floor(Math.random() * brandList.length)];
        const category = DEMO_CATEGORIES[Math.floor(Math.random() * DEMO_CATEGORIES.length)];
        const device = DEMO_DEVICES[Math.floor(Math.random() * DEMO_DEVICES.length)];
        const img = DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)];
        const hasSale = Math.random() > 0.7;
        const basePrice = Math.floor(Math.random() * 50) * 1000 + 15000;
        
        demoProducts.push({
          id: `demo-${Date.now()}-${i}`,
          name: `${brand.name} ${category} Case ${i+1}`,
          sku: `DEMO-SKU-${i+1}`,
          price: basePrice,
          salePrice: hasSale ? Math.floor(basePrice * 0.8) : undefined,
          description: `High quality ${category.toLowerCase()} case for ${device}.`,
          category: category,
          device: device,
          brand: brand.name,
          image: img,
          images: [img],
          rating: 4 + Math.random(),
          stock: Math.floor(Math.random() * 50) + 5,
          colors: ['#000000'],
          variants: []
        });
     }
     
     if (isSupabaseConfigured) {
        // Just set state, don't write to DB to avoid pollution
        setProducts(demoProducts);
     } else {
        setProducts(demoProducts);
     }
  };

  // --- CART CALCULATIONS ---
  // Subtotal uses salePrice if available
  const totalAmount = cart.reduce((acc, item) => {
    const priceToUse = item.salePrice || item.price;
    return acc + priceToUse * item.quantity;
  }, 0);

  // Discount Logic
  const applyDiscount = (code: string) => {
    const discount = discounts.find(d => d.code.toUpperCase() === code.toUpperCase() && d.isActive);
    if (!discount) {
      addToast('Invalid discount code', 'error');
      return;
    }
    
    if (discount.minOrderAmount && totalAmount < discount.minOrderAmount) {
       addToast(`Minimum spend of IQD ${discount.minOrderAmount.toLocaleString()} required`, 'warning');
       return;
    }

    setAppliedDiscount(discount);
    addToast('Discount applied!', 'success');
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    addToast('Discount removed', 'info');
  };

  // Calculate discount amount
  let discountAmount = 0;
  if (appliedDiscount) {
     if (appliedDiscount.type === 'percentage') {
       discountAmount = totalAmount * (appliedDiscount.value / 100);
     } else {
       discountAmount = appliedDiscount.value;
     }
     
     // Cannot exceed total
     if (discountAmount > totalAmount) discountAmount = totalAmount;
  }

  // Ensure discount conditions are still met if items are removed
  useEffect(() => {
    if (appliedDiscount && appliedDiscount.minOrderAmount && totalAmount < appliedDiscount.minOrderAmount) {
       setAppliedDiscount(null);
       addToast('Discount removed: Minimum spend not met', 'warning');
    }
  }, [totalAmount, appliedDiscount, addToast]);

  const finalTotal = Math.max(0, totalAmount - discountAmount);

  return (
    <ShopContext.Provider value={{
      products, cart, wishlist, brands, carouselSlides, orders, discounts,
      shippingFee, updateShippingFee, storeLogo, updateStoreLogo,
      isCartOpen, theme, language, searchQuery, setSearchQuery, t, isOnline: !!isSupabaseConfigured, supaConnectionError, isAppLoading,
      refreshBrands, refreshProducts,
      addProduct, updateProduct, deleteProduct,
      addBrand, deleteBrand,
      addSlide, updateSlide, deleteSlide,
      placeOrder, updateOrderStatus,
      addToCart, removeFromCart, updateCartQuantity, toggleCart, clearCart, toggleTheme, toggleLanguage, toggleWishlist,
      appliedDiscount, applyDiscount, removeDiscount, addDiscount, deleteDiscount, toggleDiscountStatus,
      isDemoActive, toggleDemoData,
      totalAmount, discountAmount, finalTotal
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
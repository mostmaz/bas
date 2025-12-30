import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem, CarouselSlide, Theme, Language, Order, Brand, ProductVariant, DiscountCode, Device } from '../types';
import { INITIAL_PRODUCTS, INITIAL_BRANDS, TRANSLATIONS, DEVICES } from '../constants';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useToast } from './ToastContext';

// Hooks
import { useBrandLogic } from '../hooks/useBrandLogic';
import { useDeviceLogic } from '../hooks/useDeviceLogic';
import { useSlideLogic } from '../hooks/useSlideLogic';
import { useDiscountLogic } from '../hooks/useDiscountLogic';
import { useProductLogic } from '../hooks/useProductLogic';
import { useCartLogic } from '../hooks/useCartLogic';
import { useOrderLogic } from '../hooks/useOrderLogic';

interface ShopContextType {
  // Shop Data
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  brands: Brand[];
  devices: Device[];
  carouselSlides: CarouselSlide[];
  orders: Order[];
  refreshOrders: () => Promise<void>;
  searchOrdersByPhone: (phone: string) => Promise<Order[]>;
  discounts: DiscountCode[];

  // Settings
  shippingFee: number; // Effective shipping fee
  baseShippingFee: number; // Configured base fee
  freeShippingThreshold: number; // Threshold for free shipping
  updateShippingFee: (fee: number) => Promise<void>;
  updateFreeShippingThreshold: (threshold: number) => Promise<void>;
  storeLogo: string;
  updateStoreLogo: (logo: string) => Promise<void>;
  notificationMessage: string;
  updateNotificationMessage: (message: string) => Promise<void>;

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
  isProductsLoading: boolean;
  isSlidesLoading: boolean;
  isBrandsLoading: boolean;

  // Actions
  refreshBrands: () => Promise<void>;
  refreshProducts: (silent?: boolean) => Promise<void>;
  fetchProductDetails: (id: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'rating'> & { id?: string, rating?: number }) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addBrand: (name: string, logo?: string) => Promise<void>;
  updateBrand: (id: string, name: string, logo?: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addDevice: (name: string) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  addSlide: (slide: CarouselSlide) => Promise<void>;
  updateSlide: (slide: CarouselSlide) => Promise<void>;
  deleteSlide: (id: string) => Promise<void>;
  refreshSlides: () => Promise<void>;
  placeOrder: (orderData: Omit<Order, 'id' | 'date' | 'status'>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  bulkUpdateOrderStatus: (ids: string[], status: Order['status']) => Promise<void>;

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

const DEFAULT_LOGO = "/logo.png";

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

  // --- UI STATE ---
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('ar');
  const [searchQuery, setSearchQuery] = useState('');
  const [supaConnectionError, setSupaConnectionError] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Settings State
  const [baseShippingFee, setBaseShippingFee] = useState<number>(5000);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(25000);

  const [storeLogo, setStoreLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('storeLogo') || DEFAULT_LOGO;
    } catch {
      return DEFAULT_LOGO;
    }
  });

  const [notificationMessage, setNotificationMessage] = useState<string>('');

  // --- HOOKS ---
  const { brands, setBrands, refreshBrands, addBrand, updateBrand, deleteBrand, isLoading: isBrandsLoading } = useBrandLogic(isSupabaseConfigured, addToast);
  const { devices, setDevices, refreshDevices, addDevice, deleteDevice } = useDeviceLogic(isSupabaseConfigured, addToast);
  const { carouselSlides, setCarouselSlides, addSlide, updateSlide, deleteSlide, refreshSlides, isLoading: isSlidesLoading } = useSlideLogic(isSupabaseConfigured, addToast);

  const { discounts, setDiscounts, refreshDiscounts, addDiscount, deleteDiscount, toggleDiscountStatus } = useDiscountLogic(isSupabaseConfigured, addToast);
  const { products, setProducts, refreshProducts, fetchProductDetails, addProduct, updateProduct, deleteProduct, isProductsLoading } = useProductLogic(isSupabaseConfigured, addToast, setIsAppLoading);
  const { cart, isCartOpen, appliedDiscount, addToCart, removeFromCart, updateCartQuantity, clearCart, toggleCart, applyDiscount, removeDiscount, totalAmount, discountAmount, finalTotal } = useCartLogic(addToast, products);
  const { orders, setOrders, placeOrder, updateOrderStatus, refreshOrders, bulkUpdateOrderStatus, searchOrdersByPhone } = useOrderLogic(isSupabaseConfigured, addToast, products, setProducts, refreshProducts);

  // Calculate Effective Shipping Fee
  const shippingFee = totalAmount >= freeShippingThreshold ? 0 : baseShippingFee;

  // --- EFFECTS ---
  useEffect(() => {
    if (!isSupabaseConfigured) {
      addToast("Offline Mode: Using Demo Data", "warning");
    }
    refreshProducts(true);
    refreshBrands();
    refreshDiscounts();
    refreshDevices();
    // refreshOrders(); // Deferred to Admin Dashboard or on-demand
    refreshSlides();

    // Fetch Settings
    const fetchSettings = async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('store_settings').select('shipping_fee, free_shipping_threshold, logo, notification_message').limit(1);
        if (data && data.length > 0) {
          if (data[0].shipping_fee !== undefined) setBaseShippingFee(data[0].shipping_fee);
          if (data[0].free_shipping_threshold !== undefined) setFreeShippingThreshold(data[0].free_shipping_threshold);
          if (data[0].logo) setStoreLogo(data[0].logo);
          if (data[0].notification_message) setNotificationMessage(data[0].notification_message);
        }
      }
    };
    fetchSettings();
  }, []);

  // --- ACTIONS (Settings & UI) ---
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');

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

  const updateShippingFee = async (fee: number) => {
    setBaseShippingFee(fee);
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

  const updateFreeShippingThreshold = async (threshold: number) => {
    setFreeShippingThreshold(threshold);
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('store_settings').select('id').limit(1);
      if (data && data.length > 0) {
        await supabase.from('store_settings').update({ free_shipping_threshold: threshold }).eq('id', data[0].id);
      } else {
        await supabase.from('store_settings').insert([{ free_shipping_threshold: threshold }]);
      }
      addToast('Free shipping threshold updated', 'success');
    }
  };

  const updateStoreLogo = async (logo: string) => {
    setStoreLogo(logo);
    try {
      localStorage.setItem('storeLogo', logo);
    } catch (e) {
      console.error("Local storage quota exceeded or failed", e);
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('store_settings').select('id').limit(1);
      if (data && data.length > 0) {
        await supabase.from('store_settings').update({ logo: logo }).eq('id', data[0].id);
      } else {
        await supabase.from('store_settings').insert([{ logo: logo }]);
      }
      addToast('Store logo updated', 'success');
    } else {
      addToast('Store logo updated (Local)', 'success');
    }
  };

  const updateNotificationMessage = async (message: string) => {
    setNotificationMessage(message);
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('store_settings').select('id').limit(1);
      if (data && data.length > 0) {
        await supabase.from('store_settings').update({ notification_message: message }).eq('id', data[0].id);
      } else {
        await supabase.from('store_settings').insert([{ notification_message: message }]);
      }
      addToast('Notification updated', 'success');
    }
  };

  const toggleDemoData = async () => {
    if (isDemoActive) {
      setIsDemoActive(false);
      if (!isSupabaseConfigured) setProducts(INITIAL_PRODUCTS);
      return;
    }

    setIsDemoActive(true);
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
        name: `${brand.name} ${category} Case ${i + 1}`,
        sku: `DEMO-SKU-${i + 1}`,
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
    setProducts(demoProducts);
    addToast('Demo data generated', 'success');
  };

  return (
    <ShopContext.Provider value={{
      products, cart, wishlist, brands, devices, carouselSlides, orders, discounts,
      shippingFee, baseShippingFee, freeShippingThreshold, updateShippingFee, updateFreeShippingThreshold, storeLogo, updateStoreLogo,
      notificationMessage, updateNotificationMessage,
      isCartOpen, theme, language, searchQuery, setSearchQuery, t, isOnline: !!isSupabaseConfigured, supaConnectionError, isAppLoading, isProductsLoading, isSlidesLoading, isBrandsLoading,
      refreshBrands, refreshProducts, refreshDevices,
      addProduct, updateProduct, deleteProduct, fetchProductDetails,
      addBrand, updateBrand, deleteBrand,
      addDevice, deleteDevice,
      addSlide, updateSlide, deleteSlide, refreshSlides,
      placeOrder, updateOrderStatus, refreshOrders, bulkUpdateOrderStatus, searchOrdersByPhone,
      addToCart, removeFromCart, updateCartQuantity, toggleCart, clearCart, toggleTheme, toggleLanguage, toggleWishlist,
      appliedDiscount, applyDiscount: (code) => applyDiscount(code, discounts), removeDiscount, addDiscount, deleteDiscount, toggleDiscountStatus,
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
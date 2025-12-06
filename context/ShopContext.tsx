import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem, CarouselSlide, Theme, Language, Order, Brand, ProductVariant, DiscountCode, Device } from '../types';
import { INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_SLIDES, TRANSLATIONS, INITIAL_DISCOUNTS, DEVICES } from '../constants';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useToast } from './ToastContext';

interface ShopContextType {
  // Shop Data
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  brands: Brand[];
  devices: Device[];
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
  refreshProducts: (silent?: boolean) => Promise<void>;
  refreshDevices: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'rating'> & { id?: string, rating?: number }) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addBrand: (name: string, logo?: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addDevice: (name: string) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
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

const DEFAULT_LOGO = "/logo.png";

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
  const [products, setProducts] = useState<Product[]>(() => isSupabaseConfigured ? [] : INITIAL_PRODUCTS);
  const [brands, setBrands] = useState<Brand[]>(() => isSupabaseConfigured ? [] : INITIAL_BRANDS);
  // Initialize devices with the constant values mapped to Device objects
  const [devices, setDevices] = useState<Device[]>(() =>
    DEVICES.filter(d => d !== 'All').map((d, i) => ({ id: i.toString(), name: d }))
  );
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(() => isSupabaseConfigured ? [] : INITIAL_SLIDES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>(INITIAL_DISCOUNTS);
  const [shippingFee, setShippingFee] = useState<number>(5000);

  // Persistent Logo State
  const [storeLogo, setStoreLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('storeLogo') || DEFAULT_LOGO;
    } catch {
      return DEFAULT_LOGO;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [supaConnectionError, setSupaConnectionError] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isDemoActive, setIsDemoActive] = useState(false);

  useEffect(() => {
    refreshProducts();
    refreshBrands();
    refreshDiscounts();
    refreshDevices();
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // --- ACTIONS ---

  const refreshProducts = async (silent = false) => {
    if (!silent) setIsAppLoading(true);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setProducts(data.map(mapProductFromDB));
        } else {
          setProducts(INITIAL_PRODUCTS);
        }
      } catch (err: any) {
        console.error("Fetch Error:", err);
        try {
          const { data, error: fallbackError } = await supabase.from('products').select('*');
          if (fallbackError) throw fallbackError;
          if (data && data.length > 0) {
            setProducts(data.map(mapProductFromDB));
          } else {
            setProducts(INITIAL_PRODUCTS);
          }
        } catch (fallbackErr: any) {
          console.error("Fallback Fetch Error:", fallbackErr);
          addToast(`Error loading products: ${fallbackErr.message || 'Unknown error'}`, 'error');
          setProducts(INITIAL_PRODUCTS);
        }
      }
    }
    if (!silent) setIsAppLoading(false);
  };

  const refreshBrands = async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('brands').select('*');
        if (error) throw error;
        if (data) setBrands(data);
      } catch (error) {
        console.error("Error loading brands:", error);
      }
    }
  };

  const refreshDevices = async () => {
    if (isSupabaseConfigured) {
      try {
        // Check if devices table exists by trying to select from it
        const { data, error } = await supabase.from('devices').select('*');
        if (error) {
          // If table doesn't exist or error, fallback to local defaults but don't crash
          console.warn("Could not load devices from DB (table might be missing)", error);
          return;
        }
        if (data) setDevices(data);
      } catch (error) {
        console.error("Error loading devices:", error);
      }
    }
  };

  const refreshDiscounts = async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('discounts').select('*');
        if (error) throw error;
        if (data) setDiscounts(data.map(mapDiscountFromDB));
      } catch (error) {
        console.error("Error loading discounts:", error);
      }
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'rating'> & { id?: string, rating?: number }) => {
    if (isSupabaseConfigured) {
      const dbProduct = {
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image,
        brand: product.brand,
        device: product.device,
        stock: product.stock,
        images: product.images,
        colors: product.colors,
        variants: product.variants,
        sale_price: product.salePrice,
        sku: product.sku
      };

      const { error } = await supabase.from('products').insert([dbProduct]);
      if (error) {
        console.error(error);
        addToast('Failed to add product', 'error');
        return;
      }
      await refreshProducts();
      addToast('Product added successfully', 'success');
    } else {
      const newProduct: Product = {
        ...product,
        id: product.id || Date.now().toString(),
        rating: product.rating || 0
      };
      setProducts(prev => [...prev, newProduct]);
      addToast('Product added locally (Demo)', 'success');
    }
  };

  const updateProduct = async (product: Product) => {
    if (isSupabaseConfigured) {
      const dbProduct = {
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image,
        brand: product.brand,
        device: product.device,
        stock: product.stock,
        images: product.images,
        colors: product.colors,
        variants: product.variants,
        sale_price: product.salePrice,
        sku: product.sku
      };

      const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);

      if (error) {
        const lowerMsg = (error.message || '').toLowerCase();
        if (error.code === '42703' || lowerMsg.includes('images') || lowerMsg.includes('colors') || lowerMsg.includes('variants') || lowerMsg.includes('sale_price') || lowerMsg.includes('sku')) {
          console.warn("Schema mismatch detected: column missing. Retrying update without advanced fields.");
          addToast("Warning: Database Schema Outdated. Updated without complex data.", 'warning');

          const { images, colors, variants, sale_price, sku, ...legacyProduct } = dbProduct;
          const safeProduct = { ...legacyProduct, image: product.images?.[0] || product.image };

          const { error: retryError } = await supabase.from('products').update(safeProduct).eq('id', product.id);
          if (retryError) {
            console.error(retryError);
            addToast('Failed to update product', 'error');
            return;
          }
        } else {
          console.error(error);
          addToast('Failed to update product', 'error');
          return;
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

  const addDevice = async (name: string) => {
    if (isSupabaseConfigured) {
      // Try to insert into devices table. If it fails (table missing), fallback to local state only for this session
      const { error } = await supabase.from('devices').insert([{ name }]);
      if (error) {
        console.error("Failed to add device to DB:", error);
        // Fallback: Add locally so UI updates, but warn user
        const newDevice: Device = { id: Date.now().toString(), name };
        setDevices(prev => [...prev, newDevice]);
        addToast('Device added locally (DB table missing?)', 'warning');
      } else {
        await refreshDevices();
        addToast('Device added successfully', 'success');
      }
    } else {
      const newDevice: Device = { id: Date.now().toString(), name };
      setDevices(prev => [...prev, newDevice]);
      addToast('Device added locally', 'success');
    }
  };

  const deleteDevice = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('devices').delete().eq('id', id);
      if (error) {
        console.error("Failed to delete device from DB:", error);
        setDevices(prev => prev.filter(d => d.id !== id));
        addToast('Device deleted locally (DB error)', 'warning');
      } else {
        await refreshDevices();
        addToast('Device deleted', 'success');
      }
    } else {
      setDevices(prev => prev.filter(d => d.id !== id));
      addToast('Device deleted locally', 'success');
    }
  };

  const addDiscount = async (discount: Omit<DiscountCode, 'id'>) => {
    if (isSupabaseConfigured) {
      const dbDiscount = {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minOrderAmount: discount.minOrderAmount,
        isActive: discount.isActive
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
      status: 'Processing' as const,
      date: Date.now(),
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
        items: newOrder.items
      };
      const { customerName, totalAmount, shippingFee, discountAmount, discountCode, orderNumber, ...cleanPayload } = dbPayload as any;

      const { error } = await supabase.from('orders').insert([cleanPayload]);
      if (error) throw error;

      const updatePromises = orderData.items.map(async (item) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          let newStock = product.stock;
          let variantsToUpdate = product.variants;

          if (item.selectedVariant && variantsToUpdate) {
            variantsToUpdate = variantsToUpdate.map(v => {
              if (v.id === item.selectedVariant?.id) {
                return { ...v, stock: Math.max(0, v.stock - item.quantity) };
              }
              return v;
            });
            newStock = variantsToUpdate.reduce((sum, v) => sum + v.stock, 0);

            return supabase.from('products').update({
              stock: newStock,
              variants: variantsToUpdate
            }).eq('id', item.id);

          } else {
            newStock = Math.max(0, product.stock - item.quantity);
            return supabase.from('products').update({ stock: newStock }).eq('id', item.id);
          }
        }
      });

      await Promise.all(updatePromises);

      const { data: ordersData } = await supabase.from('orders').select('*').order('date', { ascending: false });
      if (ordersData) setOrders(ordersData.map(mapOrderFromDB));
      await refreshProducts(true);

    } else {
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

      setProducts(prev => prev.map(p => {
        const item = orderData.items.find(i => i.id === p.id);
        if (item) {
          if (item.selectedVariant && p.variants) {
            const updatedVariants = p.variants.map(v => {
              if (v.id === item.selectedVariant?.id) return { ...v, stock: Math.max(0, v.stock - item.quantity) };
              return v;
            });
            return { ...p, variants: updatedVariants, stock: updatedVariants.reduce((a, b) => a + b.stock, 0) };
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

  const addToCart = (product: Product, variant?: ProductVariant) => {
    setCart(prev => {
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

  const applyDiscount = (code: string) => {
    const discount = discounts.find(d => d.code === code && d.isActive);
    if (discount) {
      if (discount.minOrderAmount && totalAmount < discount.minOrderAmount) {
        addToast(`Minimum order amount of ${discount.minOrderAmount} not met`, 'error');
        return;
      }
      setAppliedDiscount(discount);
      addToast('Discount applied', 'success');
    } else {
      addToast('Invalid or inactive discount code', 'error');
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    addToast('Discount removed', 'info');
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

  const totalAmount = cart.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      discountAmount = totalAmount * (appliedDiscount.value / 100);
    } else {
      discountAmount = appliedDiscount.value;
    }
    if (discountAmount > totalAmount) discountAmount = totalAmount;
  }

  useEffect(() => {
    if (appliedDiscount && appliedDiscount.minOrderAmount && totalAmount < appliedDiscount.minOrderAmount) {
      setAppliedDiscount(null);
      addToast('Discount removed: Minimum spend not met', 'warning');
    }
  }, [totalAmount, appliedDiscount, addToast]);

  const finalTotal = Math.max(0, totalAmount - discountAmount);

  return (
    <ShopContext.Provider value={{
      products, cart, wishlist, brands, devices, carouselSlides, orders, discounts,
      shippingFee, updateShippingFee, storeLogo, updateStoreLogo,
      isCartOpen, theme, language, searchQuery, setSearchQuery, t, isOnline: !!isSupabaseConfigured, supaConnectionError, isAppLoading,
      refreshBrands, refreshProducts, refreshDevices,
      addProduct, updateProduct, deleteProduct,
      addBrand, deleteBrand,
      addDevice, deleteDevice,
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
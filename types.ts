
export interface ProductVariant {
  id: string;
  color: string; // Hex code
  image: string; // Specific image for this color
  stock: number;
  sku?: string; // New: Stock Keeping Unit
}

export interface Product {
  id: string;
  name: string;
  sku?: string; // New: Stock Keeping Unit for main product
  price: number;
  salePrice?: number; // New: Discounted price
  description: string;
  category: string;
  device: string;
  brand: string;
  image: string; // Primary thumbnail
  images: string[]; // Gallery images
  rating: number;
  stock: number; // Total stock (sum of variants or legacy global stock)
  isDemo?: boolean;
  colors?: string[]; // Legacy: Array of hex codes
  variants?: ProductVariant[]; // New: Detailed variant system
}

export interface DiscountCode {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  isActive: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant; // Track which variant was added
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  image: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Device {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: CartItem[];
  totalAmount: number;
  shippingFee: number;
  discountAmount?: number; // New
  discountCode?: string; // New
  status: 'Processing' | 'Shipped' | 'Delivered';
  date: number;
  orderNumber: string;
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ar';

export enum SortOption {
  RECOMMENDED = 'Recommended',
  PRICE_LOW_HIGH = 'Price: Low to High',
  PRICE_HIGH_LOW = 'Price: High to Low',
}
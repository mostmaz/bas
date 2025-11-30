

import { Product, CarouselSlide, Brand, DiscountCode } from './types';

export const INITIAL_DISCOUNTS: DiscountCode[] = [
  { code: 'WELCOME10', type: 'percentage', value: 10, isActive: true },
  { code: 'SAVE5000', type: 'fixed', value: 5000, minOrderAmount: 40000, isActive: true },
  { code: 'SUMMER25', type: 'percentage', value: 25, minOrderAmount: 100000, isActive: true },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cyber Glitch v2',
    price: 50000,
    salePrice: 42000,
    description: 'A futuristic cyberpunk design with neon accents and glitch art aesthetic. Durable matte finish.',
    category: 'Artistic',
    device: 'iPhone 15',
    brand: 'CaseCraft',
    image: 'https://images.unsplash.com/photo-1603351154351-5cf233d327e4?auto=format&fit=crop&w=500&q=70&fm=webp',
    images: [
      'https://images.unsplash.com/photo-1603351154351-5cf233d327e4?auto=format&fit=crop&w=500&q=70&fm=webp',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=70&fm=webp'
    ],
    rating: 4.8,
    stock: 15,
    colors: ['#8B5CF6', '#3B82F6'],
    variants: [
      { id: 'v1', color: '#8B5CF6', stock: 10, image: 'https://images.unsplash.com/photo-1603351154351-5cf233d327e4?auto=format&fit=crop&w=500&q=70&fm=webp' },
      { id: 'v2', color: '#3B82F6', stock: 5, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=70&fm=webp' }
    ]
  },
  {
    id: '2',
    name: 'Marble Serenity',
    price: 45000,
    description: 'Elegant white marble texture with gold vein inlays. Perfect for a sophisticated look.',
    category: 'Minimalist',
    device: 'iPhone 14',
    brand: 'LuxLife',
    image: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=500&q=70&fm=webp',
    images: [
      'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=500&q=70&fm=webp',
      'https://images.unsplash.com/photo-1595429035839-c99c298ffdde?auto=format&fit=crop&w=500&q=70&fm=webp'
    ],
    rating: 4.5,
    stock: 42,
    colors: ['#FFFFFF', '#FFD700'],
    variants: [
      { id: 'v1', color: '#FFFFFF', stock: 20, image: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=500&q=70&fm=webp' },
      { id: 'v2', color: '#FFD700', stock: 22, image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde?auto=format&fit=crop&w=500&q=70&fm=webp' }
    ]
  },
  {
    id: '3',
    name: 'Neon Tokyo Night',
    price: 60000,
    description: 'Vibrant cityscape of Tokyo at night. High-gloss finish that protects against scratches.',
    category: 'Urban',
    device: 'Samsung S24',
    brand: 'UrbanArmor',
    image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=500&q=70&fm=webp',
    images: [
      'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=500&q=70&fm=webp'
    ],
    rating: 4.9,
    stock: 8,
    colors: ['#EC4899'],
    variants: [
       { id: 'v1', color: '#EC4899', stock: 8, image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=500&q=70&fm=webp' }
    ]
  },
  {
    id: '4',
    name: 'Eco-Bamboo Texture',
    price: 35000,
    salePrice: 30000,
    description: 'Sustainable look with a realistic bamboo wood grain texture. Soft touch feel.',
    category: 'Nature',
    device: 'Pixel 8',
    brand: 'EcoGuard',
    image: 'https://images.unsplash.com/photo-1694501015348-6b06504f3252?auto=format&fit=crop&w=500&q=70&fm=webp',
    images: [
      'https://images.unsplash.com/photo-1694501015348-6b06504f3252?auto=format&fit=crop&w=500&q=70&fm=webp'
    ],
    rating: 4.3,
    stock: 100,
    colors: ['#8B4513'],
    variants: [
       { id: 'v1', color: '#8B4513', stock: 100, image: 'https://images.unsplash.com/photo-1694501015348-6b06504f3252?auto=format&fit=crop&w=500&q=70&fm=webp' }
    ]
  },
  {
    id: '5',
    name: 'Abstract Geometry',
    price: 48000,
    description: 'Bold geometric shapes in primary colors. A statement piece for art lovers.',
    category: 'Artistic',
    device: 'iPhone 15',
    brand: 'CaseCraft',
    image: 'https://images.unsplash.com/photo-1541876919352-7f111dfb7841?auto=format&fit=crop&w=500&q=70&fm=webp',
    images: [
      'https://images.unsplash.com/photo-1541876919352-7f111dfb7841?auto=format&fit=crop&w=500&q=70&fm=webp'
    ],
    rating: 4.6,
    stock: 23,
    colors: ['#EF4444'],
    variants: [
      { id: 'v1', color: '#EF4444', stock: 23, image: 'https://images.unsplash.com/photo-1541876919352-7f111dfb7841?auto=format&fit=crop&w=500&q=70&fm=webp' }
    ]
  },
  {
    id: '6',
    name: 'Midnight Velvet',
    price: 30000,
    description: 'Deep black with a velvet-like visual texture. Simple, classic, and understated.',
    category: 'Minimalist',
    device: 'iPhone 14',
    brand: 'UrbanArmor',
    image: 'https://images.unsplash.com/photo-1622519566194-391c20cb633a?auto=format&fit=crop&w=500&q=70&fm=webp',
    images: [
      'https://images.unsplash.com/photo-1622519566194-391c20cb633a?auto=format&fit=crop&w=500&q=70&fm=webp'
    ],
    rating: 4.2,
    stock: 55,
    colors: ['#18181b'],
    variants: [
      { id: 'v1', color: '#18181b', stock: 55, image: 'https://images.unsplash.com/photo-1622519566194-391c20cb633a?auto=format&fit=crop&w=500&q=70&fm=webp' }
    ]
  },
];

export const INITIAL_SLIDES: CarouselSlide[] = [
  {
    id: '0',
    title: "Grand Opening Sale",
    subtitle: "UP TO 50% OFF",
    description: "Celebrate our launch with huge discounts on all premium cases.",
    color: "from-pink-600 via-red-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1000&q=70&fm=webp"
  },
  {
    id: '1',
    title: "BasCavarat Collection",
    subtitle: "BRAND NEW",
    description: "Experience the vibrant fusion of orange, pink, and purple.",
    color: "from-orange-500 via-pink-500 to-purple-600",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=70&fm=webp"
  },
  {
    id: '2',
    title: "Sustainable Luxury",
    subtitle: "NEW ARRIVALS",
    description: "Eco-friendly bamboo cases that protect your phone and the planet.",
    color: "from-emerald-600 to-teal-600",
    image: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1000&q=70&fm=webp"
  },
  {
    id: '3',
    title: "Summer Vibes",
    subtitle: "SPECIAL OFFER",
    description: "Warm tones and bright designs for the season.",
    color: "from-yellow-400 via-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=1000&q=70&fm=webp"
  }
];

export const INITIAL_BRANDS: Brand[] = [
  { id: '1', name: 'CaseCraft', logo: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde?auto=format&fit=crop&w=200&q=70&fm=webp' },
  { id: '2', name: 'UrbanArmor', logo: 'https://images.unsplash.com/photo-1504198266287-1659872e6590?auto=format&fit=crop&w=200&q=70&fm=webp' },
  { id: '3', name: 'EcoGuard', logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb771343?auto=format&fit=crop&w=200&q=70&fm=webp' },
  { id: '4', name: 'LuxLife', logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=200&q=70&fm=webp' }
];

export const CATEGORIES = ['All', 'Artistic', 'Minimalist', 'Urban', 'Nature'];
export const DEVICES = ['All', 'iPhone 15', 'iPhone 14', 'Samsung S24', 'Pixel 8'];

export const TRANSLATIONS = {
  en: {
    searchPlaceholder: "Search for the perfect case...",
    shopByBrand: "Shop by Brand",
    viewAll: "View All",
    featuredCollection: "Featured Collection",
    selectDevice: "Select Your Device",
    deviceSubtitle: "Filter specific cases for your phone model",
    noProducts: "No products found",
    cart: "Your Cart",
    emptyCart: "Your cart is empty",
    checkout: "Checkout",
    subtotal: "Subtotal",
    addToCart: "Add to Cart",
    adminDashboard: "Admin Dashboard",
    home: "Home",
    settings: "Settings",
    theme: "Theme",
    language: "Language",
    latestDrops: "Latest Drops",
    bestSellers: "Best Sellers",
    new: "New",
    trending: "Trending",
    filteredResults: "Filtered Results",
    items: "items",
    clearFilters: "Clear filters",
    reviews: "reviews",
    fastShipping: "Fast Shipping",
    fastShippingDesc: "Delivery within 24-48 hours.",
    qualityGuarantee: "Quality Guarantee",
    qualityDesc: "We stand by our quality. Full replacement for any defects.",
    startShopping: "Start Shopping",
    shippingCalculated: "Shipping calculated at checkout.",
    continueShopping: "Continue Shopping",
    checkoutTitle: "Checkout",
    cashOnDelivery: "Cash on Delivery Available",
    deliveryDetails: "Delivery Details",
    fullName: "Full Name",
    phone: "Phone Number",
    city: "City",
    address: "Detailed Address",
    completeOrder: "Complete Order",
    secureCheckout: "Secure checkout. Payment is cash on delivery.",
    orderSummary: "Order Summary",
    shipping: "Shipping",
    total: "Total",
    free: "Free",
    orders: "Orders",
    search: "Search",
    exit: "Exit",
    back: "Back",
    shop: "Shop",
    qty: "Qty",
    remove: "Remove",
    orderConfirmed: "Order Confirmed!",
    thankYou: "Thank you for your purchase. Your order",
    received: "has been received and is being processed.",
    importantInfo: "Important Information",
    estimatedDelivery: "Estimated Delivery",
    uponDelivery: "Upon Delivery",
    checkOrder: "check the order",
    beforePaying: "before paying.",
    trackOrder: "Track",
    myOrders: "My Orders",
    enterPhone: "Enter your phone number to track your orders.",
    noOrdersFound: "No orders found",
    trackOrdersSubtitle: "Enter your phone number to track your orders.",
    trackBtn: "Track",
    tryCheckingPhone: "Try checking the phone number you entered.",
    orderNum: "Order #",
    reachYouIn: "The order will reach you in",
    results: "Results",
    noMatches: "No matches found",
    popularSearches: "Popular Searches",
    askStyles: "Ask about styles...",
    caseyAi: "Casey AI",
    alwaysHelp: "Always here to help",
    fullDetails: "Full Details",
    forDevice: "For",
    genericProductDesc: "Designed with precision and crafted for durability, this case offers robust protection without compromising on style. The finish is scratch-resistant and maintains its vibrancy over time.",
    aiIntro: "Hi! I'm Casey, your AI style assistant. Looking for a specific vibe?",
    hours: "hours",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    youMightAlsoLike: "You Might Also Like",
  },
  ar: {
    searchPlaceholder: "ابحث عن الحافظة المثالية...",
    shopByBrand: "تسوق حسب العلامة التجارية",
    viewAll: "عرض الكل",
    featuredCollection: "مجموعة مميزة",
    selectDevice: "اختر جهازك",
    deviceSubtitle: "تصفية الحافظات الخاصة بموديل هاتفك",
    noProducts: "لم يتم العثور على منتجات",
    cart: "عربة التسوق",
    emptyCart: "عربة التسوق فارغة",
    checkout: "الدفع",
    subtotal: "المجموع الفرعي",
    addToCart: "أضف إلى العربة",
    adminDashboard: "لوحة التحكم",
    home: "الرئيسية",
    settings: "الإعدادات",
    theme: "المظهر",
    language: "اللغة",
    latestDrops: "أحدث الإصدارات",
    bestSellers: "الأكثر مبيعاً",
    new: "جديد",
    trending: "رائج",
    filteredResults: "نتائج التصفية",
    items: "عناصر",
    clearFilters: "مسح المرشحات",
    reviews: "مراجعات",
    fastShipping: "شحن سريع",
    fastShippingDesc: "التوصيل خلال 24-48 ساعة.",
    qualityGuarantee: "ضمان الجودة",
    qualityDesc: "نحن نضمن جودتنا. استبدال كامل لأي عيوب.",
    startShopping: "ابدأ التسوق",
    shippingCalculated: "يتم احتساب الشحن عند الدفع.",
    continueShopping: "متابعة التسوق",
    checkoutTitle: "إتمام الطلب",
    cashOnDelivery: "الدفع عند الاستلام متاح",
    deliveryDetails: "تفاصيل التوصيل",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    city: "المدينة",
    address: "العنوان بالتفصيل",
    completeOrder: "إتمام الطلب",
    secureCheckout: "دفع آمن. الدفع نقداً عند الاستلام.",
    orderSummary: "ملخص الطلب",
    shipping: "الشحن",
    total: "المجموع",
    free: "مجاني",
    orders: "طلباتي",
    search: "بحث",
    exit: "خروج",
    back: "رجوع",
    shop: "المتجر",
    qty: "الكمية",
    remove: "حذف",
    orderConfirmed: "تم تأكيد الطلب!",
    thankYou: "شكراً لشرائك. طلبك رقم",
    received: "قد تم استلامه وجاري معالجته.",
    importantInfo: "معلومات هامة",
    estimatedDelivery: "وقت التوصيل المتوقع",
    uponDelivery: "عند الاستلام",
    checkOrder: "فحص الطلب",
    beforePaying: "قبل الدفع.",
    trackOrder: "تتبع",
    myOrders: "طلباتي",
    enterPhone: "أدخل رقم هاتفك لتتبع طلباتك.",
    noOrdersFound: "لم يتم العثور على طلبات",
    trackOrdersSubtitle: "أدخل رقم هاتفك لتتبع طلباتك.",
    trackBtn: "تتبع",
    tryCheckingPhone: "حاول التحقق من رقم الهاتف الذي أدخلته.",
    orderNum: "رقم الطلب #",
    reachYouIn: "سيصلك الطلب خلال",
    results: "النتائج",
    noMatches: "لم يتم العثور على نتائج",
    popularSearches: "عمليات البحث الشائعة",
    askStyles: "اسأل عن الأنماط...",
    caseyAi: "مساعد كيسي",
    alwaysHelp: "دائماً هنا للمساعدة",
    fullDetails: "التفاصيل الكاملة",
    forDevice: "لـ",
    genericProductDesc: "مصممة بدقة ومصنوعة من أجل المتانة، توفر هذه الحافظة حماية قوية دون المساومة على الأناقة. اللمسة النهائية مقاومة للخدش وتحافظ على حيويتها بمرور الوقت.",
    aiIntro: "مرحباً! أنا كيسي، مساعدك الذكي للأناقة. هل تبحث عن طابع معين؟",
    hours: "ساعة",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    youMightAlsoLike: "قد يعجبك أيضاً",
  }
};
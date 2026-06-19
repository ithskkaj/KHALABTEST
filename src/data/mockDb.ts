import { Product, Review, Order, WebConfig, PromoCode, ThemeConfig } from '../types';

// Web Config Defaults matching exact user request
export const DEFAULT_WEB_CONFIG: WebConfig = {
  brandName: 'KHALAB',
  address: 'Shuvadda, South Keraniganj, Dhaka, Bangladesh.',
  mobile: '+880171941040',
  whatsapp: '+880171941040',
  facebookPage: 'https://www.facebook.com/khalabfashion',
  instagramPage: 'https://instagram.com/khalabfashion',
  tagline: 'Make your self premium.',
  logoText: 'KHALAB',
  banners: [
    {
      id: 'b1',
      imageUrl: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=1200',
      title: 'Premium Panjabi Core Collection',
      subtitle: 'Experience cultural luxury reinvented with bespoke Bangladeshi fabrics.',
      linkToCategory: 'Panjabi'
    },
    {
      id: 'b2',
      imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1200',
      title: 'Luxe Heavyweight Hoodies',
      subtitle: 'Soft brush interiors, drop shoulder designs, customized tailored sizes.',
      linkToCategory: 'Hoodies'
    },
    {
      id: 'b3',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200',
      title: 'Make Your Self Premium',
      subtitle: 'Premium Minimalist Streetwear for the modern generation.',
      linkToCategory: 'T-Shirts'
    }
  ]
};

// 5 Professional Color Templates + Custom Theme Configuration
export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 't1',
    name: 'Editorial Aesthetic (Default)',
    primary: '#1a1a1a',      // Onyx Charcoal
    primaryHover: '#000000',
    secondary: '#c5a059',    // Gold accent
    accent: '#c5a059',       // Muted gold
    bgDark: '#1a1a1a',
    bgLight: '#fdfcf9'
  },
  {
    id: 't2',
    name: 'Emerald Velvet',
    primary: '#064e3b',      // Deep forest green
    primaryHover: '#022c22',
    secondary: '#f59e0b',    // Rich Amber
    accent: '#b45309',       // Gold Bronze
    bgDark: '#022c22',
    bgLight: '#f0fdf4'
  },
  {
    id: 't3',
    name: 'Crimson Lux',
    primary: '#7f1d1d',      // Maroon/crimson
    primaryHover: '#450a0a',
    secondary: '#3b82f6',    // Royal blue accent
    accent: '#b91c1c',       // Vivid Crimson
    bgDark: '#1a0505',
    bgLight: '#fef2f2'
  },
  {
    id: 't4',
    name: 'Slate Minimalist',
    primary: '#111827',      // Pitch jet black
    primaryHover: '#030712',
    secondary: '#14b8a6',    // Electric Teal
    accent: '#0d9488',
    bgDark: '#030712',
    bgLight: '#fafafa'
  },
  {
    id: 't5',
    name: 'Sunset Silk',
    primary: '#581c87',      // Royal purple
    primaryHover: '#3b0764',
    secondary: '#ec4899',    // Vibrant pink/rose gold
    accent: '#f43f5e',
    bgDark: '#120224',
    bgLight: '#fdf2ff'
  }
];

// Default Clothing Catalog
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'KHALAB Royal Gold Embroidered Panjabi',
    description: 'Masterfully stitched heavy cotton premium Panjabi with hand-embossed gold threads along the collar and placket. Ultimate choice for occasions.',
    price: 3450,
    promoPrice: 2850,
    images: [
      'https://images.unsplash.com/photo-1621243804936-775306a8f2e3?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=600'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-showing-his-traditional-outfit-43110-large.mp4',
    category: 'Panjabi',
    catalog: 'Eid Special Edition',
    sizes: ['M', 'L', 'XL'],
    stock: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p2',
    title: 'KHALAB Midnight Black Premium Panjabi',
    description: 'Sleek, minimalist matte black pure linen Panjabi with dark copper custom buttons. Extremely breathable and tailored to look premium.',
    price: 3200,
    images: [
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Panjabi',
    catalog: 'Regular Luxe',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p3',
    title: 'Minimalist Signature Heavyweight Hoodie',
    description: '450 GSM pure premium cotton-fleece hoodie in Sage Green. Drop shoulder profile with high density KHALAB logo embroidery on chest.',
    price: 2450,
    promoPrice: 1950,
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Hoodies',
    catalog: 'Streetwear 2026',
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p4',
    title: 'Premium Jet Black Drop-Shoulder Tee',
    description: 'Made from 240 GSM organic long-staple combed cotton. Highly resistant to fade, designed with premium wide collar cuffs.',
    price: 1250,
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'T-Shirts',
    catalog: 'Summer Drops',
    sizes: ['S', 'M', 'L'],
    stock: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p5',
    title: 'Premium Classic Linen Shirt',
    description: 'Relaxed fit classic casual shirt crafted with blended flax linen. Comes with custom wooden buttons and premium button-down collars.',
    price: 1850,
    promoPrice: 1650,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Shirts',
    catalog: 'Lifestyle Luxury',
    sizes: ['M', 'L', 'XL'],
    stock: 6,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p6',
    title: 'Luxe Olive Green Active Polo',
    description: 'Athletic-blend premium honeycomb polo with double mercerized finish. Breathable, durable collar and customized cuff bindings.',
    price: 1450,
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'Polo Shirts',
    catalog: 'Regular Luxe',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
    createdAt: new Date().toISOString()
  }
];

// Initial Promos
export const DEFAULT_PROMOS: PromoCode[] = [
  { code: 'KHALAB200', discountPercent: 10, minSpend: 1500 },
  { code: 'PREMIUM300', discountPercent: 15, minSpend: 2500 },
  { code: 'EIDPREMIUM', discountPercent: 20, minSpend: 4000 }
];

// Initial default reviews
export const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'r1',
    productId: 'p1',
    userName: 'Tanvir Hossain',
    rating: 5,
    comment: 'The quality of the embroidery is absolutely stunning. Perfect fit for Shuvadda local functions! Proud to buy Bangladesh premium wear.',
    date: '2026-06-10T12:00:00Z'
  },
  {
    id: 'r2',
    productId: 'p1',
    userName: 'Nusrat Jahan',
    rating: 4,
    comment: 'Fabric feels very luxurious. Got it as a gift for my husband. He is in love with KHALAB designs!',
    date: '2026-06-12T14:30:00Z'
  },
  {
    id: 'r3',
    productId: 'p3',
    userName: 'Sabbir Ahmed',
    rating: 5,
    comment: 'Unbelievably heavy hoodie! Extremely premium stitching, feels like imported luxury wear. Highly recommended.',
    date: '2026-06-14T08:15:00Z'
  }
];

// Database loading helpers with dynamic storage fallback
export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem('khalab_products');
  if (!data) {
    localStorage.setItem('khalab_products', JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  return JSON.parse(data);
};

export const saveStoredProducts = (products: Product[]) => {
  localStorage.setItem('khalab_products', JSON.stringify(products));
};

export const getStoredReviews = (): Review[] => {
  const data = localStorage.getItem('khalab_reviews');
  if (!data) {
    localStorage.setItem('khalab_reviews', JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  }
  return JSON.parse(data);
};

export const saveStoredReviews = (reviews: Review[]) => {
  localStorage.setItem('khalab_reviews', JSON.stringify(reviews));
};

export const getStoredOrders = (): Order[] => {
  const data = localStorage.getItem('khalab_orders');
  return data ? JSON.parse(data) : [];
};

export const saveStoredOrders = (orders: Order[]) => {
  localStorage.setItem('khalab_orders', JSON.stringify(orders));
};

export const getStoredWebConfig = (): WebConfig => {
  const data = localStorage.getItem('khalab_web_config');
  if (!data) {
    localStorage.setItem('khalab_web_config', JSON.stringify(DEFAULT_WEB_CONFIG));
    return DEFAULT_WEB_CONFIG;
  }
  return JSON.parse(data);
};

export const saveStoredWebConfig = (config: WebConfig) => {
  localStorage.setItem('khalab_web_config', JSON.stringify(config));
};

export const getStoredPromoCodes = (): PromoCode[] => {
  const data = localStorage.getItem('khalab_promos');
  if (!data) {
    localStorage.setItem('khalab_promos', JSON.stringify(DEFAULT_PROMOS));
    return DEFAULT_PROMOS;
  }
  return JSON.parse(data);
};

export const saveStoredPromoCodes = (promos: PromoCode[]) => {
  localStorage.setItem('khalab_promos', JSON.stringify(promos));
};

export const getStoredTheme = (): ThemeConfig => {
  const data = localStorage.getItem('khalab_active_theme');
  if (!data) {
    localStorage.setItem('khalab_active_theme', JSON.stringify(PRESET_THEMES[0]));
    return PRESET_THEMES[0];
  }
  // If we have an existing theme, let's make sure it loads Editorial Aesthetic
  const parsed = JSON.parse(data);
  if (parsed.id === 't1' && parsed.name !== 'Editorial Aesthetic (Default)') {
    localStorage.setItem('khalab_active_theme', JSON.stringify(PRESET_THEMES[0]));
    return PRESET_THEMES[0];
  }
  return parsed;
};

export const saveStoredTheme = (theme: ThemeConfig) => {
  localStorage.setItem('khalab_active_theme', JSON.stringify(theme));
};

export const getStoredThemeCustomColors = () => {
  const data = localStorage.getItem('khalab_custom_colors');
  return data ? JSON.parse(data) : { primary: '#1e293b', secondary: '#d97706', accent: '#cb9e5c' };
};

export const saveStoredThemeCustomColors = (colors: { primary: string; secondary: string; accent: string }) => {
  localStorage.setItem('khalab_custom_colors', JSON.stringify(colors));
};

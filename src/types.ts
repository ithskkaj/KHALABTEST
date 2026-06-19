export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  promoPrice?: number;
  images: string[]; // Support multiple display photos
  videoUrl?: string; // Support catalog/product video
  category: string;
  catalog: string;
  sizes: string[];
  stock: number;
  createdAt: string;
  rating?: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Order {
  id: string;
  invoiceNo: string;
  userId: string;
  userPhoneOrEmail: string;
  items: {
    product: Product;
    selectedSize: string;
    quantity: number;
  }[];
  shippingAddress: {
    name: string;
    phone: string;
    district: string;
    thana: string;
    union: string;
    streetAddress: string;
  };
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'card' | 'cod';
  paymentDetails: {
    transactionId?: string;
    cardNumber?: string;
    senderNumber?: string;
  };
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export interface WebConfig {
  brandName: string;
  address: string;
  mobile: string;
  whatsapp: string;
  facebookPage: string;
  instagramPage: string;
  tagline: string;
  logoText: string;
  banners: {
    id: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    linkToCategory?: string;
  }[];
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  minSpend: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;       // hex or tailwind equivalent class config
  primaryHover: string;
  secondary: string;
  accent: string;
  bgDark: string;
  bgLight: string;
  isCustom?: boolean;
}

export interface UserSession {
  userId: string;
  phoneOrEmail: string;
  browsingHistory: string[]; // list of productIds viewed
}

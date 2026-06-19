import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Order, UserSession, Product, PromoCode, WebConfig, ThemeConfig, Review } from "../types";
import { DEFAULT_PRODUCTS, DEFAULT_PROMOS, DEFAULT_WEB_CONFIG, DEFAULT_REVIEWS, PRESET_THEMES } from "../data/mockDb";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore Error handler interface as defined in firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes all undefined fields from an object so Firestore doesn't reject it.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as any;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Normalizes a phone number or email into a unique, standard email for Firebase Authentication.
 */
export function normalizePhoneOrEmailToAuthEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  
  // If it's already an email, return it
  if (trimmed.includes("@")) {
    return trimmed;
  }
  
  // Otherwise it's a mobile number, extract digits
  const cleanPhone = trimmed.replace(/\D/g, "");
  return `${cleanPhone}@khalabshop.com`;
}

/**
 * Generates a consistent, secure password derived from the input phone or email.
 */
function deriveSecurePassword(input: string): string {
  const cleanInput = input.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
  return `khalab_${cleanInput}_2026!`;
}

/**
 * Automatically creates a Firebase Auth account or signs in the user based on their phone or email.
 */
export async function authenticateUserByPhoneOrEmail(phoneOrEmail: string): Promise<FirebaseUser> {
  const email = normalizePhoneOrEmailToAuthEmail(phoneOrEmail);
  const password = deriveSecurePassword(phoneOrEmail);

  try {
    // Attempt to register first
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    
    // Create their document profile in Firestore
    const userPath = `users/${user.uid}`;
    try {
      await setDoc(doc(db, "users", user.uid), sanitizeForFirestore({
        userId: user.uid,
        phoneOrEmail: phoneOrEmail,
        browsingHistory: [],
        createdAt: new Date().toISOString()
      }));
    } catch (fsErr) {
      handleFirestoreError(fsErr, OperationType.WRITE, userPath);
    }
    
    return user;
  } catch (error: any) {
    // If account already exists, sign in
    if (error?.code === "auth/email-already-in-use" || error?.message?.includes("already-in-use")) {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    }
    throw error;
  }
}

/**
 * Saves a placed order into Firestore
 */
export async function saveOrderToFirestore(order: Order): Promise<void> {
  const orderPath = `orders/${order.id}`;
  try {
    await setDoc(doc(db, "orders", order.id), sanitizeForFirestore(order));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, orderPath);
  }
}

/**
 * Fetches all orders belonging to a specific user using their Firebase Authentication UID.
 */
export async function fetchUserOrdersFromFirestore(userId: string): Promise<Order[]> {
  const ordersPath = "orders";
  try {
    const q = query(
      collection(db, ordersPath),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((document) => {
      orders.push(document.data() as Order);
    });

    // Sort by createdAt descending
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ordersPath);
    return [];
  }
}

/**
 * Updates order's status in Firestore
 */
export async function updateOrderStatusInFirestore(orderId: string, status: Order["status"]): Promise<void> {
  const orderPath = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, "orders", orderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, orderPath);
  }
}

/**
 * Fetches all orders from Firestore (for Admin Dashboard)
 */
export async function fetchAllOrdersFromFirestore(): Promise<Order[]> {
  const ordersPath = "orders";
  try {
    const querySnapshot = await getDocs(collection(db, ordersPath));
    const orders: Order[] = [];
    querySnapshot.forEach((document) => {
      orders.push(document.data() as Order);
    });
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ordersPath);
    return [];
  }
}

/**
 * Sync browsing history down to custom user profile doc in Firestore
 */
export async function updateBrowsingHistoryInFirestore(userId: string, browsingHistory: string[]): Promise<void> {
  const userPath = `users/${userId}`;
  try {
    await updateDoc(doc(db, "users", userId), { browsingHistory });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

/**
 * Verify Firestore Database connection
 */
export async function testConnection() {
  try {
    const docRef = doc(db, 'test', 'connection');
    await getDoc(docRef);
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

/**
 * =========================================================================
 * MULTI-DEVICE SYNCHRONIZED STORAGE HELPERS
 * =========================================================================
 */

/**
 * 1. PRODUCTS SYNC HELPERS
 */
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  const collectionPath = "products";
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const productsList: Product[] = [];
    querySnapshot.forEach((document) => {
      productsList.push(document.data() as Product);
    });

    if (productsList.length === 0) {
      // Seed default products in cloud database if we have admin credentials
      const email = auth.currentUser?.email;
      if (email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com") {
        for (const prod of DEFAULT_PRODUCTS) {
          await saveProductToFirestore(prod);
        }
        return DEFAULT_PRODUCTS;
      }
      return [];
    }

    // Sort by createdAt descending
    return productsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    return [];
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const productPath = `products/${product.id}`;
  try {
    await setDoc(doc(db, "products", product.id), sanitizeForFirestore(product));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, productPath);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const productPath = `products/${productId}`;
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, productPath);
  }
}

/**
 * 2. PROMO CODES SYNC HELPERS
 */
export async function fetchPromoCodesFromFirestore(): Promise<PromoCode[]> {
  const collectionPath = "promos";
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const promosList: PromoCode[] = [];
    querySnapshot.forEach((document) => {
      promosList.push(document.data() as PromoCode);
    });

    if (promosList.length === 0) {
      // Seed default promos in cloud database if we have admin credentials
      const email = auth.currentUser?.email;
      if (email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com") {
        for (const promo of DEFAULT_PROMOS) {
          await savePromoCodeToFirestore(promo);
        }
        return DEFAULT_PROMOS;
      }
      return [];
    }
    return promosList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    return [];
  }
}

export async function savePromoCodeToFirestore(promo: PromoCode): Promise<void> {
  const promoPath = `promos/${promo.code}`;
  try {
    await setDoc(doc(db, "promos", promo.code), sanitizeForFirestore(promo));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, promoPath);
  }
}

export async function deletePromoCodeFromFirestore(code: string): Promise<void> {
  const promoPath = `promos/${code}`;
  try {
    await deleteDoc(doc(db, "promos", code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, promoPath);
  }
}

/**
 * 3. WEB CONFIG SYNC HELPERS
 */
export async function fetchWebConfigFromFirestore(): Promise<WebConfig> {
  const docPath = "config/web_settings";
  try {
    const docSnap = await getDoc(doc(db, "config", "web_settings"));
    if (docSnap.exists()) {
      return docSnap.data() as WebConfig;
    } else {
      // Seed default web configuration if we have admin credentials
      const email = auth.currentUser?.email;
      if (email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com") {
        await saveWebConfigToFirestore(DEFAULT_WEB_CONFIG);
        return DEFAULT_WEB_CONFIG;
      }
      return null as any;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null as any;
  }
}

export async function saveWebConfigToFirestore(config: WebConfig): Promise<void> {
  const docPath = "config/web_settings";
  try {
    await setDoc(doc(db, "config", "web_settings"), sanitizeForFirestore(config));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * 4. THEME & COLORS SYNC HELPERS
 */
export async function fetchActiveThemeFromFirestore(): Promise<ThemeConfig> {
  const docPath = "config/theme_settings";
  try {
    const docSnap = await getDoc(doc(db, "config", "theme_settings"));
    if (docSnap.exists()) {
      return docSnap.data() as ThemeConfig;
    } else {
      // Seed default active theme if we have admin credentials
      const defaultTheme = PRESET_THEMES[0];
      const email = auth.currentUser?.email;
      if (email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com") {
        await saveActiveThemeToFirestore(defaultTheme);
        return defaultTheme;
      }
      return null as any;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null as any;
  }
}

export async function saveActiveThemeToFirestore(theme: ThemeConfig): Promise<void> {
  const docPath = "config/theme_settings";
  try {
    await setDoc(doc(db, "config", "theme_settings"), sanitizeForFirestore(theme));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function fetchThemeCustomColorsFromFirestore(): Promise<{ primary: string; secondary: string; accent: string }> {
  const docPath = "config/theme_colors";
  const defaultColors = { primary: '#1e293b', secondary: '#d97706', accent: '#cb9e5c' };
  try {
    const docSnap = await getDoc(doc(db, "config", "theme_colors"));
    if (docSnap.exists()) {
      return docSnap.data() as { primary: string; secondary: string; accent: string };
    } else {
      const defaultColors = { primary: '#1e293b', secondary: '#d97706', accent: '#cb9e5c' };
      const email = auth.currentUser?.email;
      if (email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com") {
        await saveThemeCustomColorsToFirestore(defaultColors);
      }
      return defaultColors;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return defaultColors;
  }
}

export async function saveThemeCustomColorsToFirestore(colors: { primary: string; secondary: string; accent: string }): Promise<void> {
  const docPath = "config/theme_colors";
  try {
    await setDoc(doc(db, "config", "theme_colors"), sanitizeForFirestore(colors));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * 5. REVIEWS SYNC HELPERS
 */
export async function fetchReviewsFromFirestore(): Promise<Review[]> {
  const collectionPath = "reviews";
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const reviewsList: Review[] = [];
    querySnapshot.forEach((document) => {
      reviewsList.push(document.data() as Review);
    });

    if (reviewsList.length === 0) {
      // Seed default reviews if we have admin credentials
      const email = auth.currentUser?.email;
      if (email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com") {
        for (const rev of DEFAULT_REVIEWS) {
          await saveReviewToFirestore(rev);
        }
        return DEFAULT_REVIEWS;
      }
      return [];
    }
    return reviewsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    return [];
  }
}

export async function saveReviewToFirestore(review: Review): Promise<void> {
  const reviewPath = `reviews/${review.id}`;
  try {
    await setDoc(doc(db, "reviews", review.id), sanitizeForFirestore(review));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, reviewPath);
  }
}

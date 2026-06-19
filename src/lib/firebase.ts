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
  updateDoc
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Order, UserSession } from "../types";

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
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        phoneOrEmail: phoneOrEmail,
        browsingHistory: [],
        createdAt: new Date().toISOString()
      });
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
    await setDoc(doc(db, "orders", order.id), order);
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

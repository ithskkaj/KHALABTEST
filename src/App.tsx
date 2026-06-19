import React, { useState, useEffect } from 'react';
import { Product, Review, Order, WebConfig, PromoCode, ThemeConfig, UserSession } from './types';
import { 
  getStoredProducts, saveStoredProducts, 
  getStoredReviews, saveStoredReviews, 
  getStoredOrders, saveStoredOrders, 
  getStoredWebConfig, saveStoredWebConfig, 
  getStoredPromoCodes, saveStoredPromoCodes, 
  getStoredTheme, saveStoredTheme 
} from './data/mockDb';
import CheckoutModal from './components/CheckoutModal';
import UserOrdersModal from './components/UserOrdersModal';
import AdminDashboard from './components/AdminDashboard';
import RecommendationEngine from './components/RecommendationEngine';
import NotificationCenter, { PushNotification } from './components/NotificationCenter';
import { 
  fetchUserOrdersFromFirestore, 
  fetchAllOrdersFromFirestore, 
  updateBrowsingHistoryInFirestore, 
  updateOrderStatusInFirestore,
  fetchProductsFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  fetchPromoCodesFromFirestore,
  savePromoCodeToFirestore,
  deletePromoCodeFromFirestore,
  fetchWebConfigFromFirestore,
  saveWebConfigToFirestore,
  fetchActiveThemeFromFirestore,
  saveActiveThemeToFirestore,
  fetchReviewsFromFirestore,
  saveReviewToFirestore,
  auth
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { 
  ShoppingBag, Search, ExternalLink, SlidersHorizontal, Star, 
  Play, Eye, ShieldCheck, Heart, User, Settings, Phone, MapPin, 
  Facebook, Instagram, MessageSquare, AlertCircle, Sparkles, X, Plus, Minus
} from 'lucide-react';

export default function App() {
  // Brand details states
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [webConfig, setWebConfig] = useState<WebConfig>(getStoredWebConfig());
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(getStoredTheme());

  // App layouts toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Active User session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Navigation filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart operations states
  const [cart, setCart] = useState<{ product: Product; selectedSize: string; quantity: number }[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  // Banner slide index
  const [bannerIndex, setBannerIndex] = useState(0);

  // Custom User Review Submittal fields
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Cart quantities limits check
  const [sizeWarning, setSizeWarning] = useState('');

  // Sizing pick in detail view
  const [selectedSize, setSelectedSize] = useState('M');

  // simulated notifications lists
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize DB data with local cache for prompt rendering and background cloud synchronization
  useEffect(() => {
    // 1. Prompt UI load from local storage cache to guarantee 0ms latency boot
    const localProducts = getStoredProducts();
    const localReviews = getStoredReviews();
    const localOrders = getStoredOrders();
    const localPromos = getStoredPromoCodes();
    const localTheme = getStoredTheme();
    const localWeb = getStoredWebConfig();

    setProducts(localProducts);
    setReviews(localReviews);
    setAllOrders(localOrders);
    setPromoCodes(localPromos);
    setActiveTheme(localTheme);
    setWebConfig(localWeb);

    // Seed initial user session if present
    const prevUser = localStorage.getItem('khalab_active_user');
    if (prevUser) {
      setCurrentUser(JSON.parse(prevUser));
    }

    // Seed initial demo notifications
    setNotifications([
      {
        id: 'n_welcome',
        title: '🔥 KHALAB Premium Store is Open!',
        message: 'Welcome: Use COUPON code "KHALAB200" to secure 10% Instant discount on clothes purchases.',
        type: 'promo',
        timestamp: new Date(),
        read: false
      },
      {
        id: 'n_eid',
        title: '🌟 Limited Shuvadda Festival Arrivals',
        message: 'Unique embroidered Punjabi collections and Luxe heavyweight Hoodies now available! Check recommendations.',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ]);
  }, []);

  // Listen to Firebase auth state initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthInitialized(true);
      if (user) {
        const hasSession = localStorage.getItem('khalab_active_user');
        if (!hasSession) {
          const storedHistory = JSON.parse(localStorage.getItem('khalab_history') || '[]');
          const session: UserSession = {
            userId: user.uid,
            phoneOrEmail: user.email || '',
            browsingHistory: storedHistory
          };
          setCurrentUser(session);
          localStorage.setItem('khalab_active_user', JSON.stringify(session));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time background cloud load from Firestore to replace cache once Auth is verified
  useEffect(() => {
    if (!authInitialized) return;

    const loadCloudData = async () => {
      // Products sync
      try {
        const cloudProducts = await fetchProductsFromFirestore();
        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
          saveStoredProducts(cloudProducts);
        }
      } catch (err: any) {
        console.warn("Products cloud sync skipped, running on local storage cache:", err);
        const errStr = String(err?.message || err).toLowerCase();
        if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
          setHasPermissionError(true);
        }
      }

      // Reviews sync
      try {
        const cloudReviews = await fetchReviewsFromFirestore();
        if (cloudReviews && cloudReviews.length > 0) {
          setReviews(cloudReviews);
          saveStoredReviews(cloudReviews);
        }
      } catch (err: any) {
        console.warn("Reviews cloud sync skipped, running on local storage cache:", err);
        const errStr = String(err?.message || err).toLowerCase();
        if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
          setHasPermissionError(true);
        }
      }

      // Promos sync
      try {
        const cloudPromos = await fetchPromoCodesFromFirestore();
        if (cloudPromos && cloudPromos.length > 0) {
          setPromoCodes(cloudPromos);
          saveStoredPromoCodes(cloudPromos);
        }
      } catch (err: any) {
        console.warn("Promos cloud sync skipped, running on local storage cache:", err);
        const errStr = String(err?.message || err).toLowerCase();
        if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
          setHasPermissionError(true);
        }
      }

      // Themes sync
      try {
        const cloudTheme = await fetchActiveThemeFromFirestore();
        if (cloudTheme) {
          setActiveTheme(cloudTheme);
          saveStoredTheme(cloudTheme);
        }
      } catch (err: any) {
        console.warn("Theme cloud sync skipped, running on local storage cache:", err);
        const errStr = String(err?.message || err).toLowerCase();
        if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
          setHasPermissionError(true);
        }
      }

      // Web Config sync
      try {
        const cloudWeb = await fetchWebConfigFromFirestore();
        if (cloudWeb) {
          setWebConfig(cloudWeb);
          saveStoredWebConfig(cloudWeb);
        }
      } catch (err: any) {
        console.warn("Web config cloud sync skipped, running on local storage cache:", err);
        const errStr = String(err?.message || err).toLowerCase();
        if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
          setHasPermissionError(true);
        }
      }
    };

    loadCloudData();
  }, [authInitialized]);

  // Synchronize orders with Firebase Firestore in real-time
  useEffect(() => {
    const syncFirebaseOrders = async () => {
      if (currentUser) {
        try {
          const remoteOrders = await fetchUserOrdersFromFirestore(currentUser.userId);
          if (remoteOrders && remoteOrders.length > 0) {
            // Merge with local orders, prioritizing remote (Firestore) records
            const currentLocal = getStoredOrders();
            const merged = [...remoteOrders];
            currentLocal.forEach((o) => {
              if (!merged.some((m) => m.id === o.id)) {
                merged.push(o);
              }
            });
            setAllOrders(merged);
            saveStoredOrders(merged);
          }
        } catch (err: any) {
          console.error("Firestore order synchronization failed: ", err);
          const errStr = String(err?.message || err).toLowerCase();
          if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
            setHasPermissionError(true);
          }
        }
      }
    };
    syncFirebaseOrders();
  }, [currentUser]);

  // Sync state changes back to Storage DB and Firebase Firestore dynamically
  const handleSaveProducts = async (nextProducts: Product[]) => {
    // Hold previous to identify deletions
    const previousProducts = [...products];
    setProducts(nextProducts);
    saveStoredProducts(nextProducts);

    const email = auth.currentUser?.email;
    const isAdmin = email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com";
    if (!isAdmin) {
      return;
    }

    try {
      // Find deleted products to remove them from Firestore
      const deleted = previousProducts.filter(p => !nextProducts.some(n => n.id === p.id));
      for (const d of deleted) {
        await deleteProductFromFirestore(d.id);
      }

      // Save/update next products
      for (const p of nextProducts) {
        await saveProductToFirestore(p);
      }
    } catch (err: any) {
      console.error("Failed to sync products in Firestore:", err);
      const errStr = String(err?.message || err).toLowerCase();
      if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
        setHasPermissionError(true);
      }
    }
  };

  const handleSaveReviews = async (nextReviews: Review[]) => {
    const previousReviews = [...reviews];
    setReviews(nextReviews);
    saveStoredReviews(nextReviews);

    try {
      const email = auth.currentUser?.email;
      const isAdmin = email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com";
      if (isAdmin) {
        for (const r of nextReviews) {
          await saveReviewToFirestore(r);
        }
      } else {
        // Standard users can only create new reviews (the security rules allow CREATE but deny UPDATE/DELETE)
        const onlyNew = nextReviews.filter(n => !previousReviews.some(p => p.id === n.id));
        for (const r of onlyNew) {
          await saveReviewToFirestore(r);
        }
      }
    } catch (err: any) {
      console.error("Failed to sync reviews to Firestore:", err);
      const errStr = String(err?.message || err).toLowerCase();
      if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
        setHasPermissionError(true);
      }
    }
  };

  const handleUpdateOrdersList = (nextOrders: Order[]) => {
    setAllOrders(nextOrders);
    saveStoredOrders(nextOrders);
  };

  const handleSaveWebConfig = async (nextCfg: WebConfig) => {
    setWebConfig(nextCfg);
    saveStoredWebConfig(nextCfg);

    const email = auth.currentUser?.email;
    const isAdmin = email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com";
    if (!isAdmin) {
      return;
    }

    try {
      await saveWebConfigToFirestore(nextCfg);
    } catch (err: any) {
      console.error("Failed to sync web config to Firestore:", err);
      const errStr = String(err?.message || err).toLowerCase();
      if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
        setHasPermissionError(true);
      }
    }
  };

  const handleSavePromoCodes = async (nextPromos: PromoCode[]) => {
    const previousPromos = [...promoCodes];
    setPromoCodes(nextPromos);
    saveStoredPromoCodes(nextPromos);

    const email = auth.currentUser?.email;
    const isAdmin = email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com";
    if (!isAdmin) {
      return;
    }

    try {
      const deleted = previousPromos.filter(p => !nextPromos.some(n => n.code === p.code));
      for (const d of deleted) {
        await deletePromoCodeFromFirestore(d.code);
      }
      for (const p of nextPromos) {
        await savePromoCodeToFirestore(p);
      }
    } catch (err: any) {
      console.error("Failed to sync promo codes to Firestore:", err);
      const errStr = String(err?.message || err).toLowerCase();
      if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
        setHasPermissionError(true);
      }
    }
  };

  const handleSaveTheme = async (nextTheme: ThemeConfig) => {
    setActiveTheme(nextTheme);
    saveStoredTheme(nextTheme);

    const email = auth.currentUser?.email;
    const isAdmin = email === "admin@khalabshop.com" || email === "itsbrbellal@gmail.com";
    if (!isAdmin) {
      return;
    }

    try {
      await saveActiveThemeToFirestore(nextTheme);
    } catch (err: any) {
      console.error("Failed to sync theme config to Firestore:", err);
      const errStr = String(err?.message || err).toLowerCase();
      if (errStr.includes("permission") || errStr.includes("insufficient") || errStr.includes("denied") || errStr.includes("auth")) {
        setHasPermissionError(true);
      }
    }
  };

  // Helper inside template for dynamic banner transitions
  useEffect(() => {
    const interval = setInterval(() => {
      if (webConfig.banners && webConfig.banners.length > 0) {
        setBannerIndex(prev => (prev + 1) % webConfig.banners.length);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [webConfig.banners]);

  // Auth synchronization handlers
  const handleUserLogin = (session: UserSession) => {
    setCurrentUser(session);
    localStorage.setItem('khalab_active_user', JSON.stringify(session));
  };

  const handleUserLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn("Customer auth sign out skipped:", err);
    }
    setCurrentUser(null);
    localStorage.removeItem('khalab_active_user');
    alert('Logged out securely from KHALAB customer portal.');
  };

  // Product Selection Details / recommendations tracking
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || 'M');

    // Add to local browsing history
    let updatedHistory: string[] = JSON.parse(localStorage.getItem('khalab_history') || '[]');
    if (!updatedHistory.includes(product.id)) {
      updatedHistory.unshift(product.id);
      // keep last 12 items
      if (updatedHistory.length > 12) updatedHistory.pop();
      localStorage.setItem('khalab_history', JSON.stringify(updatedHistory));
      
      if (currentUser) {
        const updatedUser = { ...currentUser, browsingHistory: updatedHistory };
        setCurrentUser(updatedUser);
        localStorage.setItem('khalab_active_user', JSON.stringify(updatedUser));
        
        // Sync history to Firestore
        updateBrowsingHistoryInFirestore(currentUser.userId, updatedHistory).catch((err) => {
          console.error("Firestore browsing history sync failed:", err);
        });
      }
    }
  };

  // Add review form handler
  const handleReviewSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!reviewName || !reviewComment) {
      alert('Provide your name and review remarks.');
      return;
    }

    const addedReview: Review = {
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      userName: reviewName,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString()
    };

    const updatedReviews = [addedReview, ...reviews];
    handleSaveReviews(updatedReviews);

    // Recalculate average product rating
    const pReviews = updatedReviews.filter(r => r.productId === selectedProduct.id);
    const avgRating = pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length;
    
    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct.id) {
        return { ...p, rating: parseFloat(avgRating.toFixed(1)) };
      }
      return p;
    });
    handleSaveProducts(updatedProducts);

    // Reset Review fields
    setReviewName('');
    setReviewComment('');
    alert('Thank you for reviewing KHALAB premium couture!');
  };

  // Add notification inside app helper
  const addAppNotification = (title: string, message: string) => {
    const newNotif: PushNotification = {
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      title,
      message,
      type: 'order',
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Status updates in orders cycles triggered by admin
  const handleAdminOrderStatusUpdate = async (orderId: string, nextStatus: Order['status']) => {
    // 1. Sync nextStatus in Firestore
    try {
      await updateOrderStatusInFirestore(orderId, nextStatus);
    } catch (err) {
      console.error("Firestore order update failed:", err);
    }

    const updatedOrders = allOrders.map(o => {
      if (o.id === orderId) {
        // Emit simulated push notification to the client
        addAppNotification(
          `🚚 Order Status Updated!`, 
          `Your KHALAB order ${o.invoiceNo} is now in "${nextStatus}" status.`
        );
        return { ...o, status: nextStatus };
      }
      return o;
    });
    handleUpdateOrdersList(updatedOrders);
    alert(`Order ${orderId} successfully marked: ${nextStatus}`);
  };

  // Shopping Bag Actions
  const addToBag = (product: Product, size: string) => {
    if (product.stock <= 0) {
      alert('This item is currently sold out.');
      return;
    }

    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.selectedSize === size
    );

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.stock) {
        alert(`Cannot add more. Real-time stock is only ${product.stock} items.`);
        return;
      }
      const nextCart = [...cart];
      nextCart[existingIndex].quantity += 1;
      setCart(nextCart);
    } else {
      setCart([...cart, { product, selectedSize: size, quantity: 1 }]);
    }
    
    addAppNotification('Shopping Bag Updated', `${product.title} added to checkout.`);
    alert(`Success: Added 1x ${product.title} (${size}) to shopping bag.`);
  };

  const updateCartQuantity = (index: number, change: number) => {
    const nextCart = [...cart];
    const item = nextCart[index];
    const targetQty = item.quantity + change;

    if (targetQty <= 0) {
      nextCart.splice(index, 1);
    } else {
      if (targetQty > item.product.stock) {
        alert(`Cannot exceed stock limits. Only (${item.product.stock}) left.`);
        return;
      }
      item.quantity = targetQty;
    }
    setCart(nextCart);
  };

  // Promo code discounts calculator
  const checkPromoDiscount = () => {
    if (!promoInput) return;
    const resolved = promoCodes.find(p => p.code === promoInput.trim().toUpperCase());
    
    if (!resolved) {
      alert('Invalid promo voucher coupon.');
      setAppliedPromo(null);
      return;
    }

    if (totalBeforePromo < resolved.minSpend) {
      alert(`Minimum spend of ৳${resolved.minSpend} required to claim coupon.`);
      setAppliedPromo(null);
      return;
    }

    setAppliedPromo(resolved);
    alert(`Success! Applied ${resolved.code} promo - enjoying ${resolved.discountPercent}% instant discount.`);
  };

  // Filter products mathematically
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.catalog.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Unique category lists
  const availableCategories = ['All', 'Panjabi', 'Hoodies', 'Shirts', 'T-Shirts', 'Polo Shirts'];

  // Totals calculations
  const totalBeforePromo = cart.reduce(
    (sum, item) => sum + (item.product.promoPrice || item.product.price) * item.quantity, 
    0
  );
  
  const discountAmount = appliedPromo 
    ? (totalBeforePromo * appliedPromo.discountPercent) / 100 
    : 0;

  const finalCartTotal = Math.max(0, totalBeforePromo - discountAmount);

  return (
    <div 
      id="app_root" 
      style={{ 
        '--color-primary': activeTheme.primary, 
        '--color-secondary': activeTheme.secondary,
        '--color-accent': activeTheme.accent,
        backgroundColor: activeTheme.bgLight 
      } as React.CSSProperties} 
      className="min-h-screen flex flex-col font-sans text-[#1a1a1a] antialiased"
    >
      
      {/* BRAND BLACK RIBBON HEADER */}
      <div 
        id="top_mini_ribbon" 
        style={{ backgroundColor: activeTheme.primary }} 
        className="text-[#fdfcf9] py-2 px-6 text-center text-[10px] uppercase tracking-[0.2em] font-sans flex justify-between items-center gap-2 relative overflow-hidden"
      >
        <span className="hidden sm:inline-block opacity-85">📞 Helpline: {webConfig.mobile}</span>
        <span className="flex-1 text-center font-serif italic normal-case tracking-normal text-slate-100 font-medium">"Make yourself premium"</span>
        <button 
          id="admin_entry_shortcut"
          onClick={() => setIsAdminOpen(true)}
          className="text-white hover:text-[#c5a059] font-bold underline flex items-center gap-1 text-[10px] uppercase transition-colors"
        >
          <Settings className="w-3.5 h-3.5 animate-spin" /> Admin Gateway
        </button>
      </div>

      {/* NAVIGATION HEADER BAR */}
      <nav id="nav_header_container" className="sticky top-0 bg-[#fdfcf9]/95 backdrop-blur-md z-45 border-b border-[#1a1a1a]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* LOGO AREA */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedProduct(null)}>
            <div 
              style={{ backgroundColor: activeTheme.primary }} 
              className="text-[#fdfcf9] w-10 h-10 rounded-xs flex items-center justify-center font-serif italic font-black text-xl shadow-xs"
            >
              {webConfig.brandName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-serif font-black italic tracking-tighter text-[#1a1a1a] uppercase leading-none">
                {webConfig.brandName}
              </span>
              <span className="text-[9px] text-[#c5a059] font-sans font-bold uppercase tracking-[0.2em] mt-1 leading-none">
                {webConfig.tagline}
              </span>
            </div>
          </div>

          {/* DYNAMIC SEARCH BAR */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative flex items-center border-b border-black/30 px-1 py-1">
              <input
                id="header_search_input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH PREMIUM COUTURE..."
                className="w-full bg-transparent text-[10px] text-gray-900 tracking-widest placeholder-gray-400 outline-hidden font-sans uppercase"
              />
              <Search className="text-gray-900 w-3.5 h-3.5 shrink-0 ml-1" />
            </div>
          </div>

          {/* NAVIGATION BUTTON ACTIONS */}
          <div className="flex items-center gap-3">
            
            {/* PUSH NOTIFICATIONS CENTER */}
            <NotificationCenter
              notifications={notifications}
              onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              onClear={() => setNotifications([])}
              primaryColor={activeTheme.primary}
            />

            {/* MEMBER PORTAL TRIGGER */}
            <button
              id="header_lounge_btn"
              onClick={() => setIsUserOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 transition-all text-gray-800 flex items-center gap-1.5 cursor-pointer"
              title="Customer Tracking Lounge"
            >
              <User className="w-5 h-5" />
              {currentUser && <span className="text-[10px] tracking-wider uppercase font-bold text-gray-700 hidden sm:inline">{currentUser.phoneOrEmail.split('@')[0]}</span>}
            </button>

            {/* SHOPPING BAG WITH FLOAT COUNT */}
            <button
              id="header_cart_btn"
              onClick={() => setIsCartOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 relative transition-all text-gray-800 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#c5a059] text-white rounded-full flex items-center justify-center font-bold text-[8px] shadow-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MINI SEARCH BAR */}
      <div className="p-3 bg-[#fdfcf9] border-b border-[#1a1a1a]/10 block md:hidden">
        <div className="relative flex items-center border-b border-black/20 p-1">
          <input
            id="mobile_search_input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH IN CLOTHES..."
            className="w-full bg-transparent text-[10px] tracking-widest text-[#1a1a1a] outline-hidden uppercase"
          />
          <Search className="text-[#1a1a1a] w-3.5 h-3.5" />
        </div>
      </div>

      {/* HERO HERO BANNER SLIDESHOW */}
      {!selectedProduct && webConfig.banners && webConfig.banners.length > 0 && (
        <header id="main_slider_banner" className="relative h-[240px] sm:h-[350px] bg-[#1a1a1a] text-white overflow-hidden border-b border-[#1a1a1a]/10">
          <div className="absolute inset-0 transition-all duration-1000 transform scale-100">
            <img 
              src={webConfig.banners[bannerIndex]?.imageUrl} 
              alt="Holiday Collection Banner" 
              className="w-full h-full object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Golden overlay and Tagline values */}
          <div className="absolute inset-0 bg-linear-to-r from-[#1a1a1a]/95 via-[#1a1a1a]/60 to-transparent flex flex-col justify-center px-6 sm:px-12 lg:px-24 space-y-2 select-none">
            <span style={{ color: activeTheme.accent }} className="text-[10px] uppercase font-bold tracking-[0.25em] block">
              {webConfig.brandName} • Drop Collection 2026
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif italic tracking-tight font-light leading-none text-white max-w-xl">
              {webConfig.banners[bannerIndex]?.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md font-sans tracking-wide leading-relaxed line-clamp-2">
              {webConfig.banners[bannerIndex]?.subtitle}
            </p>
            
            {/* Quick banner categories action cue */}
            {webConfig.banners[bannerIndex]?.linkToCategory && (
              <div className="pt-3">
                <button
                  id={`banner_shop_now_${bannerIndex}`}
                  onClick={() => setSelectedCategory(webConfig.banners[bannerIndex].linkToCategory!)}
                  className="px-8 py-3 bg-white text-[#1a1a1a] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#c5a059] hover:text-white shadow-md transition-all duration-300 self-start cursor-pointer"
                >
                  Shop Now &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Toggle buttons indicators */}
          <div className="absolute bottom-4 right-6 flex gap-2">
            {webConfig.banners.map((_, dotIdx) => (
              <button
                id={`slider_nav_dot_${dotIdx}`}
                key={dotIdx}
                onClick={() => setBannerIndex(dotIdx)}
                className={`w-2 h-2 rounded-full transition-all ${bannerIndex === dotIdx ? 'bg-[#c5a059] w-6' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </header>
      )}

      {/* CORE WEB STORE GRID WRAPPER */}
      <main id="storefront_main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        
        {/* PRODUCT LISTINGS VIEW */}
        {!selectedProduct ? (
          <div className="space-y-8">
            
            {/* Catalog category filtration slider */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1a1a]/10 pb-4">
              <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-1">
                {availableCategories.map(cat => (
                  <button
                    id={`cat_toggle_${cat}`}
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`pb-1 text-[11px] uppercase tracking-[0.2em] transition-all font-sans cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat 
                        ? 'border-b border-[#1a1a1a] text-[#1a1a1a] font-black' 
                        : 'text-gray-400 hover:text-gray-900 font-medium'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="text-[10px] uppercase text-gray-500 tracking-widest font-sans font-bold flex items-center gap-1.5 self-start">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                <span>Curated {filteredProducts.length} Premium wears</span>
              </div>
            </div>

            {/* Listings Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-sans">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-350" />
                <p className="font-semibold uppercase tracking-wider text-xs">No garments match your inquiry</p>
                <p className="text-[11px] text-gray-450 mt-1">Try modifying search phrases or categories tabs.</p>
              </div>
            ) : (
              <div id="apparel_catalog_grid" className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  // Reviews scores
                  const itemReviews = reviews.filter(r => r.productId === product.id);
                  const starsAvg = itemReviews.length > 0 
                    ? parseFloat((itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length).toFixed(1)) 
                    : 5;

                  return (
                    <div 
                      id={`apparel_card_${product.id}`}
                      key={product.id}
                      className="group bg-[#fdfcf9] rounded-xs border border-[#1a1a1a]/10 overflow-hidden hover:shadow-xs transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Product image covers */}
                      <div className="relative aspect-square sm:aspect-[4/5] bg-[#ebe7df]/40 overflow-hidden">
                        <img 
                          src={product.images[0]} 
                          alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-101 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Sold out state indicator */}
                        {product.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold tracking-[0.2em] bg-red-650/95 py-2 px-4 rounded-xs uppercase">
                              SOLD OUT
                            </span>
                          </div>
                        )}

                        {/* Badges details (price cuts, organic) */}
                        {product.promoPrice && product.stock > 0 && (
                          <span className="absolute top-3 left-3 text-[8px] font-bold tracking-[0.2em] bg-[#c5a059] text-white px-2.5 py-1 uppercase shadow-2xs">
                            PROMO SALE
                          </span>
                        )}

                        <span className="absolute top-3 right-3 text-[8px] font-bold text-gray-800 bg-white/90 backdrop-blur-xs py-1 px-2 rounded-xs font-sans uppercase tracking-widest">
                          {product.catalog}
                        </span>
                      </div>

                      {/* Product copy details */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] block leading-none">
                            {product.category}
                          </span>
                          <h3 className="font-serif font-black italic text-[#1a1a1a] group-hover:text-amber-700 transition-colors text-lg sm:text-xl leading-tight line-clamp-1">
                            {product.title}
                          </h3>
                        </div>

                        {/* Stars scoring and reviews totals count */}
                        <div className="flex items-center gap-1">
                          <div className="flex text-amber-500 items-center">
                            {[1, 2, 3, 4, 5].map(st => (
                              <Star key={st} className={`w-3 h-3 ${st <= Math.round(starsAvg) ? 'fill-current' : 'opacity-20'}`} />
                            ))}
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">({itemReviews.length > 0 ? itemReviews.length : 'VERIFIED'})</span>
                        </div>

                        {/* Product stock alert and price tags */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3.5 border-t border-black/5 mt-1">
                          <div>
                            <p className="text-sm font-bold text-[#1a1a1a] font-serif italic">
                              Tk {(product.promoPrice || product.price).toLocaleString()}
                              {product.promoPrice && (
                                <span className="text-xs text-gray-450 line-through font-sans not-italic ml-2">Tk {product.price}</span>
                              )}
                            </p>
                            
                            {/* Real-time Inventory badge */}
                            {product.stock > 0 && product.stock < 5 && (
                              <span className="text-[8px] text-red-500 font-bold uppercase tracking-widest animate-pulse">Only {product.stock} units left</span>
                            )}
                          </div>

                          <button
                            id={`view_apparel_btn_${product.id}`}
                            onClick={() => handleSelectProduct(product)}
                            className="bg-[#1a1a1a] text-[#fdfcf9] text-[10px] tracking-[0.2em] font-medium py-2 px-3.5 rounded-none hover:bg-[#c5a059] transition-all hover:text-white uppercase inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" /> Specs
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // DETAILED SINGLE VIEW FOR APPARELS
          <div className="space-y-8 animate-fade-in">
            <button
              id="back_to_catalog_action"
              onClick={() => setSelectedProduct(null)}
              className="text-[10px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 select-none uppercase tracking-widest"
            >
              &larr; Back to Premium Catalogs
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Product Visual media player and covers */}
              <div className="space-y-4">
                <div id="detail_banner_media" className="relative aspect-[4/5] bg-[#ebe7df]/25 rounded-none overflow-hidden border border-[#1a1a1a]/10">
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Promo sale banners */}
                  {selectedProduct.promoPrice && (
                    <span className="absolute top-4 left-4 text-[9px] font-bold tracking-[0.2em] bg-[#c5a059] text-white py-1.5 px-3 uppercase">
                      PROMO VALUE DROP
                    </span>
                  )}
                </div>

                {/* Multiple display photographs gallery */}
                {selectedProduct.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.images.map((imgUrl, idx) => (
                      <div key={idx} className="aspect-square bg-[#ebe7df]/20 border border-black/10 rounded-none overflow-hidden cursor-pointer hover:border-[#c5a059]">
                        <img 
                          src={imgUrl} 
                          alt="Detail product fabric image thumbnail" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* DYNAMIC CATALOG VIDEO PLAYER INTEGRATION */}
                {selectedProduct.videoUrl && (
                  <div className="border border-black/10 rounded-none overflow-hidden bg-[#ebe7df]/10 p-3 space-y-1.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" /> Fabric demonstration reel
                    </span>
                    <video 
                      id="catalog_video_player"
                      controls 
                      className="w-full h-[180px] rounded-none bg-black object-cover"
                      src={selectedProduct.videoUrl}
                    />
                  </div>
                )}
              </div>

              {/* Product Description Specifications */}
              <div id="product_specs_panel" className="bg-[#fdfcf9] rounded-none border border-[#1a1a1a]/10 p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-1">
                    {selectedProduct.catalog} • {selectedProduct.category}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-serif italic font-black text-[#1a1a1a] tracking-tight leading-tight">
                    {selectedProduct.title}
                  </h2>
                </div>

                {/* Price tags details */}
                <div className="bg-[#ebe7df]/15 border border-[#1a1a1a]/10 p-5 rounded-none flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-[#c5a059] uppercase tracking-wider block font-bold">PRICING BDT:</span>
                    <p className="text-2xl font-serif italic font-bold text-[#1a1a1a]">
                      Tk {(selectedProduct.promoPrice || selectedProduct.price).toLocaleString()}
                      {selectedProduct.promoPrice && (
                        <span className="text-sm text-gray-400 not-italic line-through ml-2">Tk {selectedProduct.price}</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-gray-400 block font-bold text-right tracking-wider uppercase">INVENTORY:</span>
                    <span className={`text-[9px] font-bold px-2 py-1 uppercase mt-1 tracking-widest inline-block ${
                      selectedProduct.stock <= 0 
                        ? 'bg-red-100 text-red-750' 
                        : selectedProduct.stock < 5 
                          ? 'bg-orange-100 text-orange-700 animate-pulse' 
                          : 'bg-green-150/15 text-green-750'
                    }`}>
                      {selectedProduct.stock <= 0 ? 'Out of stock' : `${selectedProduct.stock} Left`}
                    </span>
                  </div>
                </div>

                {/* Product details and story */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#1a1a1a] tracking-wider block">Garment Description</span>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-sans">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Sizing picks */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-[#1a1a1a] tracking-[0.22em] block">SELECT CAPSULE SIZE:</span>
                  <div className="flex gap-2">
                    {selectedProduct.sizes.map(size => (
                      <button
                        id={`size_pick_${size}`}
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 rounded-none text-xs font-bold border transition-all cursor-pointer ${
                          selectedSize === size 
                            ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white font-bold' 
                            : 'border-black/10 hover:border-[#1a1a1a] text-gray-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add to checkout bag trigger button */}
                <button
                  id="add_to_bag_action"
                  onClick={() => addToBag(selectedProduct, selectedSize)}
                  disabled={selectedProduct.stock <= 0}
                  className="w-full text-white font-bold py-3.5 tracking-[0.2em] text-xs hover:bg-[#c5a059] transition-all cursor-pointer disabled:bg-gray-400 uppercase rounded-none"
                  style={{ backgroundColor: selectedProduct.stock > 0 ? '#1a1a1a' : '#94a3b8' }}
                >
                  {selectedProduct.stock <= 0 ? 'SOLD OUT' : 'Add to Shopping Bag'}
                </button>

                <div className="flex items-center gap-1.5 justify-center text-[10px] text-gray-450 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>Guaranteed exchanges inside Bangladesh portals</span>
                </div>
              </div>

            </div>

            {/* PRODUCT USER REVIEWS SYSTEM */}
            <div className="border-t border-gray-150 pt-8 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Review metrics dashboard */}
              <div className="space-y-4 text-left">
                <h3 className="font-extrabold text-slate-900 border-l-4 pl-2 border-amber-600 uppercase text-sm sm:text-base">Verified reviews</h3>
                
                {/* Score numbers */}
                <div className="bg-slate-50 border border-gray-100 rounded-2xl p-5 text-center space-y-2">
                  <div className="text-4xl font-extrabold text-slate-950">
                    {reviews.filter(r => r.productId === selectedProduct.id).length > 0
                      ? (reviews.filter(r => r.productId === selectedProduct.id).reduce((sum, r) => sum + r.rating, 0) / reviews.filter(r => r.productId === selectedProduct.id).length).toFixed(1)
                      : '5.0'}
                  </div>
                  <div className="flex justify-center text-amber-500 text-xl">
                    <Star className="fill-current w-5 h-5" />
                    <Star className="fill-current w-5 h-5" />
                    <Star className="fill-current w-5 h-5" />
                    <Star className="fill-current w-5 h-5" />
                    <Star className="fill-current w-5 h-5" />
                  </div>
                  <span className="text-xs text-gray-400 block font-bold uppercase">
                    Average Verified buyer Rating
                  </span>
                </div>

                {/* Submittal form */}
                <form onSubmit={handleReviewSubmission} className="border border-gray-100 rounded-2xl p-5 bg-white space-y-3 shadow-2xs">
                  <span className="text-xs uppercase font-extrabold text-slate-800 block mb-1">Add your Review</span>
                  
                  <div>
                    <label className="block text-[10px] text-gray-500 font-medium font-sans pb-0.5">Your Name:</label>
                    <input
                      id="rev_name_input"
                      type="text"
                      required
                      placeholder="e.g. Tanvir Hossain"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 font-medium font-sans pb-0.5">Stars rating:</label>
                    <select
                      id="rev_rating_select"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      className="w-full text-xs p-1.5 border border-gray-300 rounded bg-white font-bold text-amber-600"
                    >
                      <option value="5">★★★★★ Outstanding 5/5</option>
                      <option value="4">★★★★ Very good 4/5</option>
                      <option value="3">★★★ Average 3/5</option>
                      <option value="2">★★ Disappointed 2/5</option>
                      <option value="1">★ Highly negative 1/5</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 font-medium font-sans pb-0.5">Detailed review remarks:</label>
                    <textarea
                      id="rev_comment_input"
                      required
                      rows={2}
                      placeholder="Share your experience about fabrics, embroidery and fittings..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                    />
                  </div>

                  <button
                    id="rev_submit_action"
                    type="submit"
                    style={{ backgroundColor: activeTheme.primary }}
                    className="w-full text-white text-[10px] font-black py-2 rounded uppercase tracking-wider cursor-pointer"
                  >
                    Submit Verified Review
                  </button>
                </form>
              </div>

              {/* Reviews Listing details */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Buyer Testimonials</h4>
                
                {reviews.filter(r => r.productId === selectedProduct.id).length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs italic">
                    Be the first reviewer of this premium clothes drop!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-2 space-y-3">
                    {reviews
                      .filter(r => r.productId === selectedProduct.id)
                      .map(rev => (
                        <div key={rev.id} className="pt-3 first:pt-0 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-900">{rev.userName}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(rev.date).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex text-amber-500 text-xs">
                            {[1, 2, 3, 4, 5].map(st => (
                              <Star key={st} className={`w-3.5 h-3.5 ${st <= rev.rating ? 'fill-current' : 'opacity-25'}`} />
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 leading-normal font-sans italic">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* PERSONALIZED RECOMMENDATION SHELF */}
            <RecommendationEngine
              products={products}
              browsingHistory={currentUser?.browsingHistory || []}
              onSelectProduct={handleSelectProduct}
              primaryColor={activeTheme.primary}
            />

          </div>
        )}
      </main>

      {/* FOOTER AREA */}
      <footer id="website_footer" className="bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <h2 className="text-white text-xl font-black uppercase tracking-widest leading-none">
              {webConfig.brandName}
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans block max-w-xs">
              Make yourself premium with our luxury clothing line. Exporter of bespoke fabrics and festival couture.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider block">Dhaka Showroom</span>
            <div className="space-y-1.5 font-sans text-slate-400">
              <p className="flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-500 inline-block shrink-0" /> {webConfig.address}</p>
              <p className="flex items-center gap-1 bg-white/5 py-1 px-3 rounded text-white font-extrabold uppercase font-mono tracking-widest">
                <Phone className="w-4 h-4 text-green-500 inline-block" /> Whats up: {webConfig.whatsapp}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider block">Follow Us Offline</span>
            <div className="flex flex-col gap-2 font-mono text-[11px]">
              <a 
                id="fb_page_link"
                href={webConfig.facebookPage} 
                target="_blank" 
                rel="no-referrer" 
                className="hover:text-blue-500 flex items-center gap-1"
              >
                <Facebook className="w-4 h-4" /> facebookpage
              </a>
              <a 
                id="insta_page_link"
                href={webConfig.instagramPage} 
                target="_blank" 
                rel="no-referrer" 
                className="hover:text-amber-500 flex items-center gap-1"
              >
                <Instagram className="w-4 h-4" /> Instagram page
              </a>
            </div>
          </div>

          <div className="space-y-3 text-slate-500 text-right md:text-left">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider block">Verified Secure platform</span>
            <p className="text-[10px] leading-relaxed">
              Accepting all Credit Cards, bKash mobile pockets, Nagad wallets, & Rocket secure gateways instantly. Real-time inventories automated.
            </p>
          </div>
        </div>

        {/* Footer legal credits */}
        <div className="border-t border-slate-800 py-6 text-center text-[10px] text-slate-600 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {webConfig.brandName} Corporation • All Rights Reserved. Crafted with Premium aesthetics.
        </div>
      </footer>

      {/* SHOPPING BAG DRAWER OVERLAY */}
      {isCartOpen && (
        <div id="cart_overlay_backdrop" className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs flex justify-end">
          <div id="cart_drawer_body" className="w-full max-w-md bg-[#fdfcf9] h-full shadow-2xl flex flex-col justify-between animate-slide-left border-l border-black/10">
            
            {/* Header bag */}
            <div style={{ backgroundColor: '#1a1a1a' }} className="text-[#fdfcf9] p-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#c5a059]" />
                <h3 className="font-serif italic font-bold uppercase text-sm tracking-[0.1em]">Your Shopping Bag</h3>
              </div>
              <button 
                id="close_cart_btn"
                onClick={() => setIsCartOpen(false)} 
                className="text-white hover:text-[#c5a059] font-black text-xl w-8 h-8 flex items-center justify-center rounded-none bg-white/5 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* List products inside cart */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-black/5">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3 font-sans">
                  <ShoppingBag className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="font-bold uppercase tracking-wider text-xs">Your shopping bag is empty</p>
                  <p className="text-[11px] text-gray-400">Select capsule couture from our premium catalogs to add items.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 flex gap-4">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.title} 
                      className="w-16 h-20 object-cover bg-[#ebe7df]/20 border border-black/10 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 space-y-1.5 text-left">
                      <h4 className="text-xs font-serif font-black italic text-[#1a1a1a] leading-tight">{item.product.title}</h4>
                      <p className="text-[9px] text-[#c5a059] uppercase font-bold tracking-widest">SIZE: {item.selectedSize}</p>
                      
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 border border-black/10 rounded-none p-0.5 bg-transparent">
                          <button 
                            id={`cart_minus_btn_${idx}`}
                            onClick={() => updateCartQuantity(idx, -1)} 
                            className="p-1 hover:bg-[#ebe7df]/30 text-gray-700"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold font-mono px-1.5">{item.quantity}</span>
                          <button 
                            id={`cart_plus_btn_${idx}`}
                            onClick={() => updateCartQuantity(idx, 1)} 
                            className="p-1 hover:bg-[#ebe7df]/30 text-gray-700"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <span className="font-serif italic text-xs font-bold text-gray-950">
                          Tk {((item.product.promoPrice || item.product.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer cart operations & promo coupon checkers */}
            {cart.length > 0 && (
              <div className="bg-[#ebe7df]/10 border-t border-[#1a1a1a]/10 p-5 space-y-4 text-xs">
                
                {/* Coupon entry */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-450 block">Log Discount Coupon:</span>
                  <div className="flex gap-2">
                    <input
                      id="cart_promo_input"
                      type="text"
                      placeholder="e.g. KHALAB200"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 border border-black/10 text-xs px-2.5 bg-white uppercase font-mono tracking-widest rounded-none py-1.5"
                    />
                    <button
                      id="apply_promo_btn"
                      onClick={checkPromoDiscount}
                      className="py-1.5 px-4 bg-[#1a1a1a] text-[#fdfcf9] uppercase tracking-widest text-[9px] font-bold font-sans cursor-pointer hover:bg-[#c5a059] transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-black/5 pt-2 space-y-2 font-sans text-[11px]">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal Price</span>
                    <span className="font-serif italic text-gray-900">Tk {totalBeforePromo.toLocaleString()}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-green-700 font-bold pt-1.5">
                      <span>Applied Coupon ({appliedPromo.code})</span>
                      <span className="font-serif italic">-{appliedPromo.discountPercent}% OFF</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-950 text-xs pt-2 tracking-wide">
                    <span>ACTIVE GRAND TOTAL</span>
                    <span className="font-serif italic text-sm text-[#1a1a1a] font-black">Tk {finalCartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  id="cart_checkout_proceed_btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckOpen(true);
                  }}
                  className="w-full bg-[#1a1a1a] text-[#fdfcf9] text-[10px] tracking-[0.2em] font-bold py-3.5 rounded-none uppercase text-center shadow-xs cursor-pointer hover:bg-[#c5a059] transition-all block"
                >
                  Proceed to Checkout Gateway
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL OVERALL */}
      <CheckoutModal
        isOpen={isCheckOpen}
        onClose={() => setIsCheckOpen(false)}
        cart={cart}
        clearCart={() => setCart([])}
        appliedPromo={appliedPromo}
        totalBeforePromo={totalBeforePromo}
        finalTotal={finalCartTotal}
        currentUser={currentUser}
        onOrderSuccess={(order) => {
          // Push order and trigger live states
          setAllOrders(prev => [order, ...prev]);
          // Refresh products state from newly remaining local/custom configs and push to Firestore
          const updatedProds = getStoredProducts();
          handleSaveProducts(updatedProds);
        }}
        addNotification={addAppNotification}
        primaryColor={activeTheme.primary}
      />

      {/* USER LOUNGE PROFILE MODAL */}
      <UserOrdersModal
        isOpen={isUserOpen}
        onClose={() => setIsUserOpen(false)}
        currentUser={currentUser}
        onLogin={handleUserLogin}
        onLogout={handleUserLogout}
        allOrders={allOrders}
        brandName={webConfig.brandName}
        brandAddress={webConfig.address}
        brandPhone={webConfig.mobile}
        primaryColor={activeTheme.primary}
      />

      {/* CORE ADMIN CONTROL COMMAND DASHBOARD */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onSaveProducts={handleSaveProducts}
        allOrders={allOrders}
        onUpdateOrderStatus={handleAdminOrderStatusUpdate}
        webConfig={webConfig}
        onSaveWebConfig={handleSaveWebConfig}
        promoCodes={promoCodes}
        onSavePromoCodes={handleSavePromoCodes}
        activeTheme={activeTheme}
        onSaveThemeChange={handleSaveTheme}
        primaryColor={activeTheme.primary}
        onUpdateOrders={handleUpdateOrdersList}
        hasPermissionError={hasPermissionError}
        onClearPermissionError={() => setHasPermissionError(false)}
      />

    </div>
  );
}

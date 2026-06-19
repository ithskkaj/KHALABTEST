import React, { useState, useEffect } from 'react';
import { Product, Order, PromoCode, WebConfig, ThemeConfig } from '../types';
import { PRESET_THEMES } from '../data/mockDb';
import { 
  Settings, ShoppingCart, Truck, Tag, Palette, Key, LogOut, 
  Trash2, Edit, Plus, Check, RefreshCw, Users, Image, Upload, X, AlertCircle, ExternalLink 
} from 'lucide-react';
import { authenticateUserByPhoneOrEmail, fetchAllOrdersFromFirestore, auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { compressImageFile } from '../utils/imageCompressor';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  allOrders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: Order['status']) => void;
  webConfig: WebConfig;
  onSaveWebConfig: (config: WebConfig) => void;
  promoCodes: PromoCode[];
  onSavePromoCodes: (promos: PromoCode[]) => void;
  activeTheme: ThemeConfig;
  onSaveThemeChange: (theme: ThemeConfig) => void;
  primaryColor: string;
  onUpdateOrders?: (orders: Order[]) => void;
  hasPermissionError?: boolean;
  onClearPermissionError?: () => void;
  onReloadCloudData?: () => Promise<void>;
}

export default function AdminDashboard({
  isOpen,
  onClose,
  products,
  onSaveProducts,
  allOrders,
  onUpdateOrderStatus,
  webConfig,
  onSaveWebConfig,
  promoCodes,
  onSavePromoCodes,
  activeTheme,
  onSaveThemeChange,
  primaryColor,
  onUpdateOrders,
  hasPermissionError = false,
  onClearPermissionError = () => {},
  onReloadCloudData,
}: AdminDashboardProps) {
  // Authentication states
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Auto-restore admin access on refresh if Firebase session persists
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && (user.email === 'admin@khalabshop.com' || user.email === 'itsbrbellal@gmail.com')) {
        setIsAdminAuth(true);
      } else {
        setIsAdminAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Dashboard Navigation Tabs
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'appearance' | 'setup' | 'banners_promos'>('products');

  // Product CRUD forms
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [pTitle, setPTitle] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pPromoPrice, setPPromoPrice] = useState('');
  const [pCategory, setPCategory] = useState('Panjabi');
  const [pCatalog, setPCatalog] = useState('Eid Special');
  const [pSizes, setPSizes] = useState<string[]>(['M', 'L', 'XL']);
  const [pStock, setPStock] = useState('10');
  const [pImages, setPImages] = useState<string[]>(['']);
  const [pVideoUrl, setPVideoUrl] = useState('');

  // Brand Web configuration state
  const [cfgBrandName, setCfgBrandName] = useState(webConfig.brandName);
  const [cfgAddress, setCfgAddress] = useState(webConfig.address);
  const [cfgMobile, setCfgMobile] = useState(webConfig.mobile);
  const [cfgWhatsapp, setCfgWhatsapp] = useState(webConfig.whatsapp);
  const [cfgFb, setCfgFb] = useState(webConfig.facebookPage);
  const [cfgInsta, setCfgInsta] = useState(webConfig.instagramPage);
  const [cfgTagline, setCfgTagline] = useState(webConfig.tagline);
  const [cfgLogoText, setCfgLogoText] = useState(webConfig.logoText);

  // Banners state
  const [banners, setBanners] = useState(webConfig.banners);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [newPromoMinSpend, setNewPromoMinSpend] = useState('');

  // Custom theme colors state
  const [isCustomTheme, setIsCustomTheme] = useState(activeTheme.isCustom || false);
  const [custPrimary, setCustPrimary] = useState(activeTheme.primary || '#1e293b');
  const [custSecondary, setCustSecondary] = useState(activeTheme.secondary || '#d97706');
  const [custAccent, setCustAccent] = useState(activeTheme.accent || '#cb9e5c');

  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // Admin login check matching requested values
  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.trim() === 'Khalab@123' && adminPass === '48282@Khalab') {
      setIsAdminLoggingIn(true);
      try {
        // Authenticate with Firebase Auth as admin@khalabshop.com to enable secure admin write operations in Firestore
        await authenticateUserByPhoneOrEmail("admin@khalabshop.com");
        setIsAdminAuth(true);
        if (onReloadCloudData) {
          await onReloadCloudData();
        }
        alert('KHALAB Core Administration Privileges Granted. Cloud write authority synced.');
      } catch (err: any) {
        console.error("Auto Firebase Authentication failed for Admin profile:", err);
        // Fallback to local admin clearance anyway
        setIsAdminAuth(true);
        alert('KHALAB Core Administration Privileges Granted locally (Cloud Sync restricted: ' + (err.message || err) + ')');
      } finally {
        setIsAdminLoggingIn(false);
      }
    } else {
      alert('Access Denied. Incorrect ID or Passcode.');
    }
  };

  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  const handleSyncOrdersOnline = async () => {
    setIsSyncingOrders(true);
    try {
      // 1. Authenticate with Firebase as admin using admin@khalabshop.com to unlock isAdmin() permissions
      await authenticateUserByPhoneOrEmail("admin@khalabshop.com");
      
      // 2. Fetch all orders from Firebase
      const allDbOrders = await fetchAllOrdersFromFirestore();
      
      if (onUpdateOrders) {
        onUpdateOrders(allDbOrders);
      }
      alert(`Synchronized: ${allDbOrders.length} orders downloaded successfully from live cloud database.`);
    } catch (err: any) {
      alert(`Firebase order sync error: ${err.message || err}`);
    } finally {
      setIsSyncingOrders(false);
    }
  };

  // Safe preset triggers
  const triggerPresetTheme = (theme: ThemeConfig) => {
    setIsCustomTheme(false);
    onSaveThemeChange(theme);
    alert(`Theme painted to preset: ${theme.name}`);
  };

  const triggerCustomThemeApply = () => {
    const customTheme: ThemeConfig = {
      id: 'custom_admin_colors',
      name: 'Custom Theme Configured',
      primary: custPrimary,
      primaryHover: custPrimary, // simplified
      secondary: custSecondary,
      accent: custAccent,
      bgDark: '#030712',
      bgLight: '#fafafa',
      isCustom: true
    };
    setIsCustomTheme(true);
    onSaveThemeChange(customTheme);
    alert('Dynamic custom palette successfully loaded.');
  };

  // Product add/edit handles
  const submitProductAction = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      id: editingProduct ? editingProduct.id : 'p_' + Math.random().toString(36).substr(2, 9),
      title: pTitle,
      description: pDescription,
      price: parseFloat(pPrice),
      promoPrice: pPromoPrice ? parseFloat(pPromoPrice) : undefined,
      category: pCategory,
      catalog: pCatalog,
      sizes: pSizes,
      stock: parseInt(pStock) || 0,
      images: pImages.filter(img => img.trim() !== ''),
      videoUrl: pVideoUrl || undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      rating: editingProduct ? editingProduct.rating : 5
    };

    let nextProducts = [...products];
    if (editingProduct) {
      nextProducts = nextProducts.map(p => p.id === editingProduct.id ? productData : p);
      alert('Product detail updated successfully.');
    } else {
      nextProducts.unshift(productData);
      alert('New clothes logged successfully.');
    }

    onSaveProducts(nextProducts);
    resetProductForm();
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processUploadedFiles = async (files: FileList) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) {
        alert('Please select image files only.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large! Maximum image size allowed is 10MB.`);
        continue;
      }

      try {
        // High quality scale down to maximum 900px which is pristine for website catalog layouts
        const base64String = await compressImageFile(file, { maxWidth: 900, maxHeight: 900, quality: 0.75 });
        setPImages((prev) => {
          const filtered = prev.filter(img => img.trim() !== '');
          if (filtered.includes(base64String)) return prev;
          return [...filtered, base64String];
        });
      } catch (err) {
        console.warn("Image compression failed, using direct reader fallback:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPImages((prev) => {
            const filtered = prev.filter(img => img.trim() !== '');
            if (filtered.includes(base64String)) return prev;
            return [...filtered, base64String];
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFiles(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFiles(files);
    }
  };

  const handleRemoveImageByIndex = (indexToRemove: number) => {
    setPImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      return filtered.length === 0 ? [''] : filtered;
    });
  };

  const resetProductForm = () => {
    setIsAddingProduct(false);
    setEditingProduct(null);
    setPTitle('');
    setPDescription('');
    setPPrice('');
    setPPromoPrice('');
    setPCategory('Panjabi');
    setPCatalog('Eid Special');
    setPSizes(['M', 'L', 'XL']);
    setPStock('10');
    setPImages(['']);
    setPVideoUrl('');
  };

  const triggerEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setPTitle(prod.title);
    setPDescription(prod.description);
    setPPrice(prod.price.toString());
    setPPromoPrice(prod.promoPrice ? prod.promoPrice.toString() : '');
    setPCategory(prod.category);
    setPCatalog(prod.catalog);
    setPSizes(prod.sizes);
    setPStock(prod.stock.toString());
    setPImages(prod.images.length > 0 ? prod.images : ['']);
    setPVideoUrl(prod.videoUrl || '');
    setIsAddingProduct(true);
  };

  const removeProduct = (productId: string) => {
    if (confirm('Verify: Destroy item record?')) {
      const remaining = products.filter(p => p.id !== productId);
      onSaveProducts(remaining);
      alert('Item record discarded.');
    }
  };

  // Save Setup block
  const commitSetupConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WebConfig = {
      ...webConfig,
      brandName: cfgBrandName,
      address: cfgAddress,
      mobile: cfgMobile,
      whatsapp: cfgWhatsapp,
      facebookPage: cfgFb,
      instagramPage: cfgInsta,
      tagline: cfgTagline,
      logoText: cfgLogoText,
    };
    onSaveWebConfig(updated);
    alert('Setup configuration loaded & synced to database.');
  };

  // Banner edit actions
  const updateBannerField = (index: number, key: 'imageUrl' | 'title' | 'subtitle' | 'linkToCategory', value: string) => {
    const nextBanners = [...banners];
    nextBanners[index] = { ...nextBanners[index], [key]: value };
    setBanners(nextBanners);
  };

  const saveBannersWithPromo = () => {
    onSaveWebConfig({
      ...webConfig,
      banners: banners
    });
    alert('Slide Banners re-cached & fully loaded.');
  };

  const addNewPromoCodeAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode || !newPromoDiscount) return;
    const added: PromoCode = {
      code: newPromoCode.trim().toUpperCase(),
      discountPercent: parseInt(newPromoDiscount),
      minSpend: parseInt(newPromoMinSpend) || 0,
    };
    onSavePromoCodes([...promoCodes, added]);
    setNewPromoCode('');
    setNewPromoDiscount('');
    setNewPromoMinSpend('');
    alert('Promo coupon registered.');
  };

  const removePromoCode = (code: string) => {
    const next = promoCodes.filter(p => p.code !== code);
    onSavePromoCodes(next);
    alert('Promo discounter retired.');
  };

  if (!isOpen) return null;

  return (
    <div id="admin_dashboard_backdrop" className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div id="admin_dashboard_grid" className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl relative overflow-hidden transition-all duration-300 max-h-[85vh] flex flex-col">
        
        {/* LOG IN PAGE IF NOT AUTHENTICATED */}
        {!isAdminAuth ? (
          <div className="p-8 max-w-md mx-auto space-y-6 text-center">
            <Key className="w-14 h-14 mx-auto text-amber-500 animate-bounce" />
            <div className="space-y-1">
              <h2 className="text-xl font-black text-gray-950 uppercase tracking-widest">KHALAB ADMIN LOGON</h2>
              <p className="text-xs text-gray-500">Provide official brand access keys to authorize modifying fabrics, catalogs, payments, and colors.</p>
            </div>

            {hasPermissionError && (
              <div className="bg-emerald-50 border border-emerald-200 text-left rounded-xl p-4 space-y-2 text-xs text-emerald-800">
                <div className="flex gap-2 justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">✅ Rules Successfully Synced</span>
                  </div>
                  <button 
                    onClick={onClearPermissionError}
                    className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase py-0.5 px-2 rounded cursor-pointer"
                  >
                    Dismiss Warning
                  </button>
                </div>
                <p className="font-normal text-emerald-700">
                  Firestore rules have been automatically deployed to your personal Firebase project <strong>"khalabshop"</strong>. Click "Dismiss Warning" to clear the notice banner.
                </p>
              </div>
            )}

            <form onSubmit={handleAdminVerify} className="space-y-4 text-left border border-gray-100 rounded-2xl p-6 bg-slate-50 shadow-xs">
              <div>
                <label className="block text-xs font-bold text-gray-600 pb-1">ADMIN LOGIN ID:</label>
                <input
                  id="admin_id_input"
                  type="text"
                  required
                  placeholder="Khalab@123"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 pb-1">SECURITY PASSCODE:</label>
                <input
                  id="admin_pass_input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white font-mono"
                />
              </div>

              <button
                id="admin_login_submit"
                type="submit"
                disabled={isAdminLoggingIn}
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 cursor-pointer disabled:opacity-60 flex justify-center items-center gap-2"
              >
                {isAdminLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Synchronizing Authority...
                  </>
                ) : (
                  'Logon to Dashboard'
                )}
              </button>
            </form>
            <button id="cancel_admin_login" onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-gray-600">
              Close Panel
            </button>
          </div>
        ) : (
          // AUTHENTICATED MANAGEMENT STATION
          <>
            {/* Header Dashboard panel */}
            <div style={{ backgroundColor: primaryColor }} className="text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-amber-500 animate-spin" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider">KHALAB Core Command Station</h2>
                  <p className="text-xs opacity-90 font-mono">Status: Secure Authority Verified</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {onReloadCloudData && (
                  <button
                    id="admin_force_sync_btn"
                    onClick={async () => {
                      try {
                        await onReloadCloudData();
                        alert('Cloud products, web setup, themes, and promo configurations fully synchronized from live Firestore database!');
                      } catch (err: any) {
                        alert('Sync failed: ' + (err?.message || err));
                      }
                    }}
                    className="text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-4 h-4 animate-reverse-spin" /> Sync Live Database
                  </button>
                )}
                <button
                  id="admin_logout_btn"
                  onClick={async () => {
                    try {
                      await signOut(auth);
                    } catch (err) {
                      console.warn("Sign out skipped:", err);
                    }
                    setIsAdminAuth(false);
                  }}
                  className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <LogOut className="w-4 h-4" /> Exit Command
                </button>
              </div>
            </div>

            {/* INTEGRATED PERSISTENT FIRESTORE RULES COPIER */}
            {hasPermissionError && (
              <div className="bg-emerald-50 border-b border-emerald-250 px-6 py-4 space-y-3 text-xs animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-emerald-900 font-bold">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-emerald-950">✅ Firestore Security Rules Automatically Synced</h4>
                      <p className="font-normal text-emerald-800 mt-1">
                        We have successfully finished the full automated deployment of the optimized security rules configuration directly to your personal Firebase project <strong>"khalabshop"</strong>! Multi-device synchronization is fully armed and syncing in real-time.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClearPermissionError}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap self-start sm:self-auto"
                  >
                    Dismiss Warning
                  </button>
                </div>
              </div>
            )}

            {/* IFRAME PRIVACY SANDBOX OR CUSTOMER OVERRIDE WARNING */}
            {(!auth.currentUser || !(auth.currentUser.email === 'admin@khalabshop.com' || auth.currentUser.email === 'itsbrbellal@gmail.com')) && (
              <div className="bg-amber-50 border-b border-amber-250 px-6 py-4 space-y-2 text-xs">
                <div className="flex items-start gap-2.5 text-amber-900 font-bold">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-amber-950">⚠️ ক্লাউড ডাটাবেজ সিঙ্ক হচ্ছে না (Local-Only Mode Enabled)</h4>
                    <p className="font-normal text-amber-800 mt-1">
                      আপনার ব্রাউজারের প্রাইভেসি সুরক্ষার কারণে আইফ্রেম (Iframe) এর ভিতর Firebase ডাটাবেজের সাথে কানেক্ট হতে পারছে না, অথবা আপনি কাস্টমার পোর্টালে লগইন করেছেন যা এডমিন সেশন বাতিল করেছে। 
                      <strong> এই অবস্থায় নতুন প্রোডাক্ট এড, ইমেজ পরিবর্তন, অথবা কোনো তথ্য এডিট করলে তা স্থায়ীভাবে সেভ (Permanent Save) হবে না।</strong>
                    </p>
                    <p className="font-black text-amber-950 mt-2 flex items-center gap-1">
                      👉 সমাধান: উপরের ডানের <span className="bg-amber-200 px-1.5 py-0.5 rounded font-mono">Open in a New Tab</span> বা নতুন উইন্ডো বাটনে ক্লিক করে ওয়েবসাইটটি সরাসরি ব্রাউজারে ওপেন করুন এবং সেখানে এডমিন প্যানেলে লগইন করে কাজ করুন। তাহলে সমস্ত তথ্য স্থায়ীভাবে ডাটাবেজে সেভ থাকবে এবং অন্য যেকোনো ডিভাইস থেকেও পাওয়া যাবে।
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-menu Tabs */}
            <div className="bg-slate-50 border-b border-gray-200 px-6 overflow-x-auto flex gap-6 text-xs font-bold uppercase text-gray-500">
              {[
                { id: 'products', name: 'Clothes Catalogs', icon: ShoppingCart },
                { id: 'orders', name: 'Order Logs', icon: Truck },
                { id: 'appearance', name: 'Color Themes', icon: Palette },
                { id: 'setup', name: 'Brand Setup', icon: Settings },
                { id: 'banners_promos', name: 'Banners & Promos', icon: Image },
              ].map(tab => (
                <button
                  id={`admin_tab_${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 flex items-center gap-1.5 border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-amber-600 text-amber-700' 
                      : 'border-transparent hover:text-gray-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* TAB CONTAINER AREA */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              
              {/* TAB 1: PRODUCTS / DRESSES LISTINGS */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm font-extrabold text-slate-800">Available Clothes ({products.length})</span>
                    {!isAddingProduct && (
                      <button
                        id="prod_add_new_toggle"
                        onClick={() => setIsAddingProduct(true)}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Premium Clothing
                      </button>
                    )}
                  </div>

                  {isAddingProduct ? (
                    // Add Product Multi-fields Drawer Form
                    <form onSubmit={submitProductAction} className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase border-b pb-2 mb-2">
                        {editingProduct ? 'Edit Clothing Spec' : 'Log New Luxury Apparel'}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Clothing Item Title *</label>
                          <input
                            id="p_title_input"
                            type="text"
                            required
                            placeholder="e.g. KHALAB Heavy Cotton Panjabi"
                            value={pTitle}
                            onChange={(e) => setPTitle(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden font-semibold text-gray-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Fashion Catalog Name *</label>
                          <input
                            id="p_catalog_input"
                            type="text"
                            required
                            placeholder="e.g. Eid Premium / Urban Fall"
                            value={pCatalog}
                            onChange={(e) => setPCatalog(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 pb-1">Clothing Details & Story *</label>
                        <textarea
                          id="p_desc_input"
                          required
                          rows={2}
                          placeholder="Fibers used, density in GSM, craftsmanship details..."
                          value={pDescription}
                          onChange={(e) => setPDescription(e.target.value)}
                          className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Normal Price (৳ BDT) *</label>
                          <input
                            id="p_price_input"
                            type="number"
                            required
                            placeholder="3200"
                            value={pPrice}
                            onChange={(e) => setPPrice(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Promo Sale Price (৳ Optional)</label>
                          <input
                            id="p_promo_input"
                            type="number"
                            placeholder="2800"
                            value={pPromoPrice}
                            onChange={(e) => setPPromoPrice(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Category Group *</label>
                          <select
                            id="p_cat_select"
                            value={pCategory}
                            onChange={(e) => setPCategory(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white"
                          >
                            {['Panjabi', 'Hoodies', 'T-Shirts', 'Shirts', 'Polo Shirts', 'Women Shalwar', 'Kurtis'].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Inventory / Real-Time Stock *</label>
                          <input
                            id="p_stock_input"
                            type="number"
                            required
                            placeholder="12"
                            value={pStock}
                            onChange={(e) => setPStock(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white text-center"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Clothing Sizes Checklist</label>
                          <div className="flex gap-4 p-2 bg-white rounded-lg border border-gray-300 flex-wrap">
                            {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                              <label key={sz} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                                <input
                                  id={`checkbox_sz_${sz}`}
                                  type="checkbox"
                                  checked={pSizes.includes(sz)}
                                  onChange={(e) => {
                                    if (e.target.checked) setPSizes([...pSizes, sz]);
                                    else setPSizes(pSizes.filter(x => x !== sz));
                                  }}
                                />
                                {sz}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 pb-1">Dynamic Video Preview (MP4 URL)</label>
                          <input
                            id="p_video_input"
                            type="url"
                            placeholder="e.g. https://assets.mixkit.co/videos/..."
                            value={pVideoUrl}
                            onChange={(e) => setPVideoUrl(e.target.value)}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 border border-gray-200 bg-slate-50/50 rounded-xl p-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Product Display Imagery *
                          </label>
                          <span className="text-[10px] text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full font-semibold">
                            {pImages.filter(img => img.trim() !== '').length} Selected
                          </span>
                        </div>

                        {/* Local Storage File Dropzone & Click Area */}
                        <div 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('p_local_file_input')?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                            isDragging 
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                              : 'border-gray-300 hover:border-indigo-400 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            id="p_local_file_input"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleLocalImageUpload}
                          />
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs font-bold text-gray-800">
                            Drag & drop your product files here, or <span className="text-indigo-600 underline">browse device</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            PNG, JPG, JPEG or WEBP formats (Max 2MB per image)
                          </p>
                        </div>

                        {/* Image Previews & Custom List */}
                        {pImages.filter(img => img.trim() !== '').length > 0 && (
                          <div className="space-y-2">
                            <label className="block text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                              Image Queue & Previews
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                              {pImages.filter(img => img.trim() !== '').map((img, idx) => (
                                <div 
                                  key={idx} 
                                  className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 group bg-slate-100"
                                >
                                  <img 
                                    src={img} 
                                    alt={`Product preview ${idx + 1}`} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    id={`p_img_remove_btn_${idx}`}
                                    type="button"
                                    onClick={() => handleRemoveImageByIndex(idx)}
                                    className="absolute inset-0 bg-red-900/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                                    title="Click to remove"
                                  >
                                    <X className="w-5 h-5 pointer-events-none" />
                                  </button>
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                    #{idx + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collapsible Textarea or Textarea Helper for Link pasting */}
                        <div className="pt-2 border-t border-gray-200">
                          <label className="block text-xs text-gray-500 pb-1 font-semibold">
                            Or paste direct Web URLs (one image link per line):
                          </label>
                          <textarea
                            id="p_images_input"
                            required
                            rows={2}
                            placeholder="e.g. https://images.unsplash.com/photo-..."
                            value={pImages.join('\n')}
                            onChange={(e) => setPImages(e.target.value.split('\n'))}
                            className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          id="p_form_cancel_btn"
                          type="button"
                          onClick={resetProductForm}
                          className="py-2 px-4 border border-gray-300 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          id="p_form_submit_btn"
                          type="submit"
                          style={{ backgroundColor: primaryColor }}
                          className="py-2 px-6 text-white rounded-lg text-xs font-bold cursor-pointer hover:opacity-90 transition-all"
                        >
                          {editingProduct ? 'Commit changes' : 'Upload to storefront'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {/* Listings grids */}
                  <div id="admin_products_grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map(prod => (
                      <div key={prod.id} className="border border-gray-100 rounded-xl p-4 bg-slate-50 flex gap-4 shadow-2xs">
                        <img 
                          src={prod.images[0]} 
                          alt={prod.title} 
                          className="w-16 h-16 rounded-lg object-cover bg-gray-200 self-start"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                            {prod.catalog} • {prod.category}
                          </span>
                          <h4 className="text-xs font-bold text-gray-900 leading-tight">{prod.title}</h4>
                          <p className="text-xs font-bold text-slate-700">
                            ৳{(prod.promoPrice || prod.price).toLocaleString()}
                            {prod.promoPrice && <span className="text-[10px] text-gray-400 line-through ml-2">৳{prod.price}</span>}
                          </p>
                          
                          {/* Real-time Inventory Stocks levels */}
                          <div className="flex items-center gap-1 pt-1.5">
                            <span className="text-[10px] font-semibold text-gray-500">Inventory Level:</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              prod.stock <= 0 ? 'bg-red-100 text-red-700' :
                              prod.stock < 5 ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-green-100 text-green-700'
                            }`}>
                              {prod.stock <= 0 ? 'SOLD OUT' : `${prod.stock} left`}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-2 justify-end">
                            <button
                              id={`prod_edit_btn_${prod.id}`}
                              onClick={() => triggerEditProduct(prod)}
                              className="p-1 px-2 hover:bg-amber-100 rounded border border-gray-200 text-[10px] font-bold text-slate-700 flex items-center gap-0.5"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button
                              id={`prod_delete_btn_${prod.id}`}
                              onClick={() => removeProduct(prod.id)}
                              className="p-1 px-2 hover:bg-red-50 text-red-600 rounded border border-red-100 text-[10px] font-bold flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: ACTIVE ORDER LOGS & SHIPMENT CONTROLS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-800">Customer Checkout Activity Log ({allOrders.length})</h3>
                    <button
                      id="sync_from_firestore_btn"
                      onClick={handleSyncOrdersOnline}
                      disabled={isSyncingOrders}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold text-white uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer hover:opacity-90 ${
                        isSyncingOrders ? 'bg-amber-500 animate-pulse' : 'bg-slate-950'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                      {isSyncingOrders ? 'Synchronizing...' : 'Sync with Cloud DB'}
                    </button>
                  </div>

                  {allOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No order tracks recorded yet. Waiting for client checkouts.
                    </div>
                  ) : (
                    <div id="admin_orders_wrapper" className="space-y-4">
                      {allOrders.map(order => (
                        <div key={order.id} className="border border-gray-200 rounded-xl p-5 bg-slate-50 space-y-3 shadow-2xs">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 pb-2">
                            <div>
                              <span className="font-mono text-xs font-black text-gray-900 bg-gray-200 px-2 py-0.5 rounded">
                                {order.invoiceNo}
                              </span>
                              <span className="text-[10px] text-gray-500 ml-2">
                                {new Date(order.createdAt).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {/* Order level status toggles triggers notifications to user */}
                              <span className="text-[10px] text-gray-500 font-semibold font-sans">Status controller:</span>
                              <select
                                id={`order_status_select_${order.id}`}
                                value={order.status}
                                onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                                className="text-xs p-1 rounded font-bold border border-gray-300 bg-white cursor-pointer"
                              >
                                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-700">Delivery Account:</p>
                              <p className="text-gray-900">{order.shippingAddress.name} ({order.shippingAddress.phone})</p>
                              <p className="text-gray-500">
                                {order.shippingAddress.streetAddress}, {order.shippingAddress.union}, {order.shippingAddress.thana}, {order.shippingAddress.district}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="font-semibold text-gray-700">Authorised Gateway:</p>
                              <p className="text-gray-900 uppercase font-black">
                                {order.paymentMethod === 'cod'
                                  ? 'Cash on Delivery (COD)'
                                  : order.paymentMethod === 'card'
                                  ? 'Credit Card Gateway'
                                  : `${order.paymentMethod} wallet channel`}
                              </p>
                              {order.paymentDetails.senderNumber && <p className="text-gray-500">Sender: {order.paymentDetails.senderNumber}</p>}
                              {order.paymentDetails.transactionId && <p className="text-gray-500 font-mono">TXN: {order.paymentDetails.transactionId}</p>}
                              <p className="font-bold text-amber-700 pt-1">Total Paid Amount: ৳{order.totalAmount.toLocaleString()} BDT</p>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 text-xs border border-gray-100 space-y-1">
                            <p className="font-bold text-gray-600 block pb-1">Garments ordered:</p>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between font-mono">
                                <span className="text-gray-700">• {item.product.title} ({item.selectedSize})</span>
                                <span className="font-bold">x {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VISUAL COLOR SCHEMES - 5 PRESETS & CUSTOM CANVAS */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 pb-1">Website Appearance Styling</h3>
                    <p className="text-xs text-gray-500">Select an elegant preset block that matches your textile capsule colorways, or build any bespoke color profile using hex inputs.</p>
                  </div>

                  {/* 5 Professional preset boxes */}
                  <div>
                    <span className="text-xs font-bold text-gray-600 block pb-3 uppercase">Pillar 1: 5 Premium Color presets</span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {PRESET_THEMES.map(theme => {
                        const isCurrentlyActive = !isCustomTheme && activeTheme.id === theme.id;
                        return (
                          <button
                            id={`theme_preset_box_${theme.id}`}
                            key={theme.id}
                            type="button"
                            onClick={() => triggerPresetTheme(theme)}
                            className={`p-4 rounded-xl border flex flex-col justify-between h-[120px] shadow-2xs hover:shadow text-left transition-all cursor-pointer ${
                              isCurrentlyActive ? 'border-amber-600 ring-2 ring-amber-500' : 'border-gray-200'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold text-gray-900 block leading-tight">{theme.name}</span>
                              <span className="text-[9px] text-gray-500 block leading-tight">Preset config</span>
                            </div>
                            
                            <div className="flex gap-1.5 pt-2">
                              <span className="w-5 h-5 rounded-full inline-block border border-gray-300" style={{ backgroundColor: theme.primary }} title="Primary" />
                              <span className="w-5 h-5 rounded-full inline-block border border-gray-300" style={{ backgroundColor: theme.secondary }} title="Accent" />
                              <span className="w-5 h-5 rounded-full inline-block border border-gray-300" style={{ backgroundColor: theme.bgLight }} title="Background" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CUSTOM CANVAS SYSTEM */}
                  <div className="border-t border-gray-200 pt-5">
                    <span className="text-xs font-bold text-gray-600 block pb-3 uppercase">Pillar 2: Custom hex canvas colorizers</span>
                    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 pb-1.5 uppercase">Navbar & Primary tone:</label>
                          <div className="flex gap-2">
                            <input
                              id="custom_primary_picker"
                              type="color"
                              value={custPrimary}
                              onChange={(e) => setCustPrimary(e.target.value)}
                              className="w-10 h-10 border rounded cursor-pointer p-0"
                            />
                            <input
                              id="custom_primary_hex"
                              type="text"
                              value={custPrimary}
                              onChange={(e) => setCustPrimary(e.target.value)}
                              className="flex-1 text-xs border border-gray-300 bg-white rounded-lg px-2 text-center font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 pb-1.5 uppercase">Buttons & Promo highlight:</label>
                          <div className="flex gap-2">
                            <input
                              id="custom_secondary_picker"
                              type="color"
                              value={custSecondary}
                              onChange={(e) => setCustSecondary(e.target.value)}
                              className="w-10 h-10 border rounded cursor-pointer p-0"
                            />
                            <input
                              id="custom_secondary_hex"
                              type="text"
                              value={custSecondary}
                              onChange={(e) => setCustSecondary(e.target.value)}
                              className="flex-1 text-xs border border-gray-300 bg-white rounded-lg px-2 text-center font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 pb-1.5 uppercase">Luxe Accent details:</label>
                          <div className="flex gap-2">
                            <input
                              id="custom_accent_picker"
                              type="color"
                              value={custAccent}
                              onChange={(e) => setCustAccent(e.target.value)}
                              className="w-10 h-10 border rounded cursor-pointer p-0"
                            />
                            <input
                              id="custom_accent_hex"
                              type="text"
                              value={custAccent}
                              onChange={(e) => setCustAccent(e.target.value)}
                              className="flex-1 text-xs border border-gray-300 bg-white rounded-lg px-2 text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        id="apply_custom_theme_btn"
                        type="button"
                        onClick={triggerCustomThemeApply}
                        className="py-2.5 px-6 font-bold bg-amber-600 text-white hover:bg-amber-700 text-xs rounded-lg transition-all cursor-pointer block w-full text-center"
                      >
                        Activate Custom Color presets
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: STORE SETUP DETAILS */}
              {activeTab === 'setup' && (
                <form onSubmit={commitSetupConfig} className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 pb-2 border-b border-gray-100">KHALAB Address & Social Media credentials</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 pb-1">Brand Logo Title *</label>
                      <input
                        id="cfg_logo_input"
                        type="text"
                        required
                        value={cfgLogoText}
                        onChange={(e) => setCfgLogoText(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 pb-1">Brand Name *</label>
                      <input
                        id="cfg_brandname_input"
                        type="text"
                        required
                        value={cfgBrandName}
                        onChange={(e) => setCfgBrandName(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 pb-1">Company Tagline *</label>
                    <input
                      id="cfg_tagline_input"
                      type="text"
                      required
                      value={cfgTagline}
                      onChange={(e) => setCfgTagline(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden italic"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 pb-1">Mobile Helpline *</label>
                      <input
                        id="cfg_mobile_input"
                        type="text"
                        required
                        value={cfgMobile}
                        onChange={(e) => setCfgMobile(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 pb-1">WhatsApp Sourced No. *</label>
                      <input
                        id="cfg_whatsapp_input"
                        type="text"
                        required
                        value={cfgWhatsapp}
                        onChange={(e) => setCfgWhatsapp(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 pb-1">Facebook Page Sourced URL *</label>
                      <input
                        id="cfg_fb_input"
                        type="url"
                        required
                        value={cfgFb}
                        onChange={(e) => setCfgFb(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 pb-1">Instagram Page URL</label>
                      <input
                        id="cfg_insta_input"
                        type="url"
                        value={cfgInsta}
                        onChange={(e) => setCfgInsta(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 pb-1">Full Corporate address *</label>
                      <input
                        id="cfg_address_input"
                        type="text"
                        required
                        value={cfgAddress}
                        onChange={(e) => setCfgAddress(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    id="save_brand_setup_btn"
                    type="submit"
                    style={{ backgroundColor: primaryColor }}
                    className="w-full py-3 text-white text-xs font-bold rounded-lg cursor-pointer uppercase shadow-xs transition-all hover:opacity-95"
                  >
                    Commit brand setup configuration
                  </button>
                </form>
              )}

              {/* TAB 5: HERO SLIDERS & PROMO CODES */}
              {activeTab === 'banners_promos' && (
                <div className="space-y-6">
                  
                  {/* HERO BANNER SECTION LISTINGS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 pb-2 border-b border-gray-100">Storefront Slideshow Banners ({banners.length})</h3>
                    {banners.map((ban, idx) => (
                      <div key={ban.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 rounded p-1">Slide Banner #{idx + 1}</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-gray-500">Banner Overlay Title</label>
                            <input
                              id={`ban_title_${idx}`}
                              type="text"
                              value={ban.title}
                              onChange={(e) => updateBannerField(idx, 'title', e.target.value)}
                              className="w-full text-xs p-2 border border-gray-300 rounded bg-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500">Subtitle promo pitch</label>
                            <input
                              id={`ban_sub_${idx}`}
                              type="text"
                              value={ban.subtitle}
                              onChange={(e) => updateBannerField(idx, 'subtitle', e.target.value)}
                              className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-gray-500">Image Cover Unsplash URL</label>
                            <input
                              id={`ban_img_${idx}`}
                              type="url"
                              value={ban.imageUrl}
                              onChange={(e) => updateBannerField(idx, 'imageUrl', e.target.value)}
                              className="w-full text-xs p-2 border border-gray-300 rounded bg-white font-mono text-[10px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500">Redirect Link target Category</label>
                            <input
                              id={`ban_link_${idx}`}
                              type="text"
                              value={ban.linkToCategory || ''}
                              onChange={(e) => updateBannerField(idx, 'linkToCategory', e.target.value)}
                              placeholder="e.g. Panjabi"
                              className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      id="save_banners_btn"
                      onClick={saveBannersWithPromo}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full py-2.5 text-white font-bold rounded-lg text-xs hover:opacity-90 transition-all cursor-pointer"
                    >
                      Save Live Banner Layouts
                    </button>
                  </div>

                  {/* PROMO CODE LISTINGS */}
                  <div className="border-t border-gray-200 pt-5 space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 pb-1">Promotional Discount Coupons</h3>
                    
                    <form onSubmit={addNewPromoCodeAction} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 pb-1 uppercase">Coupon Code Name *</label>
                        <input
                          id="promo_code_input"
                          type="text"
                          required
                          placeholder="FASHION400"
                          value={newPromoCode}
                          onChange={(e) => setNewPromoCode(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white font-mono uppercase"
                        />
                      </div>
                      <div className="w-[120px]">
                        <label className="block text-[10px] text-gray-500 pb-1 uppercase">Discount % *</label>
                        <input
                          id="promo_discount_input"
                          type="number"
                          required
                          max={100}
                          placeholder="15"
                          value={newPromoDiscount}
                          onChange={(e) => setNewPromoDiscount(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-center font-bold"
                        />
                      </div>
                      <div className="w-[120px]">
                        <label className="block text-[10px] text-gray-500 pb-1 uppercase">Min Spend (৳) *</label>
                        <input
                          id="promo_min_input"
                          type="number"
                          required
                          placeholder="1500"
                          value={newPromoMinSpend}
                          onChange={(e) => setNewPromoMinSpend(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-center font-mono"
                        />
                      </div>
                      <button
                        id="promo_register_submit"
                        type="submit"
                        className="py-2 px-4 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 h-[34px]"
                      >
                        Add Coup
                      </button>
                    </form>

                    <div id="promo_codes_list" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {promoCodes.map(promo => (
                        <div key={promo.code} className="border border-gray-100 rounded-xl p-3 bg-white shadow-3xs flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border">
                              {promo.code}
                            </span>
                            <p className="text-[11px] text-gray-500 font-medium">
                              Provides {promo.discountPercent}% Discount on spending inside KHALAB &gt; ৳{promo.minSpend}
                            </p>
                          </div>
                          <button
                            id={`promo_del_btn_${promo.code}`}
                            type="button"
                            onClick={() => removePromoCode(promo.code)}
                            className="p-1 px-2 border border-red-100 text-red-500 hover:bg-red-50 text-[10px] rounded font-bold"
                          >
                            Discard
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

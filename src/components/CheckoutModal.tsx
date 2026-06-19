import React, { useState, useEffect } from 'react';
import { Product, PromoCode, Order } from '../types';
import { 
  BANGLADESH_DISTRICTS, 
  BANGLADESH_THANAS, 
  BANGLADESH_UNIONS, 
  BangladeshThana, 
  BangladeshUnion 
} from '../data/bangladeshData';
import { CreditCard, Smartphone, CheckCircle, ShieldCheck, Banknote } from 'lucide-react';
import { authenticateUserByPhoneOrEmail, saveOrderToFirestore } from '../lib/firebase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { product: Product; selectedSize: string; quantity: number }[];
  clearCart: () => void;
  appliedPromo: PromoCode | null;
  totalBeforePromo: number;
  finalTotal: number;
  currentUser: { phoneOrEmail: string } | null;
  onOrderSuccess: (order: Order) => void;
  addNotification: (title: string, message: string) => void;
  primaryColor: string;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  clearCart,
  appliedPromo,
  totalBeforePromo,
  finalTotal,
  currentUser,
  onOrderSuccess,
  addNotification,
  primaryColor,
}: CheckoutModalProps) {
  // Cascading Address levels
  const [district, setDistrict] = useState('');
  const [thana, setThana] = useState('');
  const [union, setUnion] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(currentUser?.phoneOrEmail || '');

  // Filter lists based on cascading selections
  const [filteredThanas, setFilteredThanas] = useState<BangladeshThana[]>([]);
  const [filteredUnions, setFilteredUnions] = useState<BangladeshUnion[]>([]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'card' | 'cod'>('bkash');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment_gateway' | 'completed'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wallet inputs
  const [walletPhone, setWalletPhone] = useState(currentUser?.phoneOrEmail || '');
  const [walletOtp, setWalletOtp] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletStep, setWalletStep] = useState<'credentials' | 'otp' | 'pin'>('credentials');

  // Card inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Update thanas when district changes
  useEffect(() => {
    if (district) {
      const filtered = BANGLADESH_THANAS.filter(t => t.districtId === district);
      setFilteredThanas(filtered);
      setThana('');
      setUnion('');
    } else {
      setFilteredThanas([]);
      setThana('');
      setUnion('');
    }
  }, [district]);

  // Update unions when thana changes
  useEffect(() => {
    if (thana) {
      const filtered = BANGLADESH_UNIONS.filter(u => u.thanaId === thana);
      setFilteredUnions(filtered);
      setUnion('');
    } else {
      setFilteredUnions([]);
      setUnion('');
    }
  }, [thana]);

  // Handle step completion
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !district || !thana || !union || !streetAddress) {
      alert('Please fill out all billing and cascading address fields.');
      return;
    }
    setCheckoutStep('payment_gateway');
  };

  const simulateOtpGeneration = () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[KHALAB Payment System] Your 6-digit payment confirmation OTP verification code is: ${randomOtp}`);
    addNotification('Verification Code Sent', 'Use the OTP sent via simulated notification to secure the checkout.');
  };

  const handleWalletNext = () => {
    if (walletStep === 'credentials') {
      if (!walletPhone) {
        alert('Please enter your mobile pocket number.');
        return;
      }
      simulateOtpGeneration();
      setWalletStep('otp');
    } else if (walletStep === 'otp') {
      if (walletOtp.length < 4) {
        alert('Please enter valid security OTP code.');
        return;
      }
      setWalletStep('pin');
    } else if (walletStep === 'pin') {
      if (walletPin.length < 4) {
        alert('Please enter your secured PIN.');
        return;
      }
      executeOrderPlacement();
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardHolder || !expiry || !cvv) {
      alert('Complete credit card details to authorize payment.');
      return;
    }
    executeOrderPlacement();
  };

  const executeOrderPlacement = async () => {
    setIsSubmitting(true);
    try {
      // 1. Auto register or log in the user via Firebase Auth using their checkout number/email
      const firebaseUser = await authenticateUserByPhoneOrEmail(phone);

      const distObj = BANGLADESH_DISTRICTS.find(d => d.id === district);
      const thanaObj = BANGLADESH_THANAS.find(t => t.id === thana);
      const unionObj = BANGLADESH_UNIONS.find(u => u.id === union);

      const generatedOrder: Order = {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        invoiceNo: 'KLB-' + Math.floor(10000 + Math.random() * 90000),
        userId: firebaseUser.uid, // Store the real user UID from Firebase
        userPhoneOrEmail: phone,
        items: cart,
        shippingAddress: {
          name,
          phone,
          district: distObj ? distObj.name : district,
          thana: thanaObj ? thanaObj.name : thana,
          union: unionObj ? unionObj.name : union,
          streetAddress,
        },
        paymentMethod,
        paymentDetails: paymentMethod === 'cod' ? {
          transactionId: 'COD-' + Math.floor(100000 + Math.random() * 900000)
        } : paymentMethod === 'card' ? {
          cardNumber: '**** **** **** ' + cardNumber.slice(-4)
        } : {
          senderNumber: walletPhone,
          transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()
        },
        totalAmount: finalTotal,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      // 2. Save order to Firebase Firestore cloud database
      await saveOrderToFirestore(generatedOrder);

      // Update real-time inventory and save order locally
      const localProds = JSON.parse(localStorage.getItem('khalab_products') || '[]');
      const updatedProds = localProds.map((p: Product) => {
        const cartItem = cart.find(item => item.product.id === p.id);
        if (cartItem) {
          const remaining = Math.max(0, p.stock - cartItem.quantity);
          return { ...p, stock: remaining };
        }
        return p;
      });
      localStorage.setItem('khalab_products', JSON.stringify(updatedProds));

      // Save order down to DB
      const allOrders = JSON.parse(localStorage.getItem('khalab_orders') || '[]');
      allOrders.unshift(generatedOrder);
      localStorage.setItem('khalab_orders', JSON.stringify(allOrders));

      // 3. Automatically set up active user session
      const session = {
        userId: firebaseUser.uid,
        phoneOrEmail: phone,
        browsingHistory: JSON.parse(localStorage.getItem('khalab_history') || '[]')
      };
      localStorage.setItem('khalab_active_user', JSON.stringify(session));

      // Callback & Notify
      onOrderSuccess(generatedOrder);
      addNotification('Order Confirmed!', `Your order ${generatedOrder.invoiceNo} was placed successfully and synced online.`);
      setCheckoutStep('completed');
    } catch (err: any) {
      alert(`Firebase storage error: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="checkout_modal_container" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div id="checkout_card_inner" className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Banner header showing matching custom color */}
        <div style={{ backgroundColor: primaryColor }} className="text-white p-6 relative">
          <button 
            id="close_checkout_btn"
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:text-white/80 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center bg-black/20"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold uppercase tracking-wide">Secure KHALAB Checkout</h2>
          <p className="text-xs opacity-90 mt-1">Make yourself premium. Guaranteed delivery within Bangladesh.</p>
        </div>

        <div className="p-6">
          {/* Progress bar info */}
          <div className="flex border-b border-gray-100 pb-4 mb-6 text-sm">
            <span id="prog_details" className={`flex-1 text-center font-semibold ${checkoutStep === 'details' ? 'text-amber-600' : 'text-gray-400'}`}>
              1. Delivery details
            </span>
            <span id="prog_payment" className={`flex-1 text-center font-semibold ${checkoutStep === 'payment_gateway' ? 'text-amber-600' : 'text-gray-400'}`}>
              2. Secured Payment gateway
            </span>
            <span id="prog_status" className={`flex-1 text-center font-semibold ${checkoutStep === 'completed' ? 'text-amber-600' : 'text-gray-400'}`}>
              3. Done
            </span>
          </div>

          {/* STEP 1: DELIVERY DATA DETAILS */}
          {checkoutStep === 'details' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 border-l-4 pl-2 border-amber-600">
                Bangladesh Address Selection (Cascading Dropdowns)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 font-medium pb-1">Customer Full Name *</label>
                  <input
                    id="chk_name_input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium pb-1">Primary Mobile Number *</label>
                  <input
                    id="chk_phone_input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +8801700000000"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Cascading selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 font-medium pb-1">District *</label>
                  <select
                    id="chk_district_select"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="">Select District</option>
                    {BANGLADESH_DISTRICTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 font-medium pb-1">Thana / Upazila *</label>
                  <select
                    id="chk_thana_select"
                    required
                    disabled={!district}
                    value={thana}
                    onChange={(e) => setThana(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="">Select Thana</option>
                    {filteredThanas.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 font-medium pb-1">Union Selection *</label>
                  <select
                    id="chk_union_select"
                    required
                    disabled={!thana}
                    value={union}
                    onChange={(e) => setUnion(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="">Select Union</option>
                    {filteredUnions.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-medium pb-1">Street Address, Landmark / Village *</label>
                <textarea
                  id="chk_address_detail_input"
                  required
                  rows={2}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Village: Shuvadda, House: 12, Level 2"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mt-2">
                <span className="text-xs text-gray-500 block uppercase font-bold mb-2">Order Price Summary</span>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 text-gray-600">
                    <span>{item.product.title} ({item.selectedSize}) x {item.quantity}</span>
                    <span>৳{((item.product.promoPrice || item.product.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                
                {appliedPromo && (
                  <div className="flex justify-between text-xs border-t border-gray-200 pt-2 mt-2 font-medium text-green-600">
                    <span>Discount Applied ({appliedPromo.code} - {appliedPromo.discountPercent}%)</span>
                    <span>-৳{(totalBeforePromo - finalTotal).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>৳{finalTotal.toLocaleString()} BDT</span>
                </div>
              </div>

              <button
                id="details_proceed_btn"
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="w-full text-white text-sm font-semibold rounded-lg py-3 text-center transition-all cursor-pointer shadow-md"
              >
                Proceed to Payment Gateway
              </button>
            </form>
          )}

          {/* STEP 2: SECURED PAYMENT GATEWAY CHANNELS */}
          {checkoutStep === 'payment_gateway' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 pb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  Select Sourced Payment Method
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'bkash', name: 'bKash', color: 'border-pink-500 bg-pink-50 text-pink-700' },
                    { id: 'nagad', name: 'Nagad', color: 'border-orange-500 bg-orange-50 text-orange-700' },
                    { id: 'rocket', name: 'Rocket', color: 'border-purple-500 bg-purple-50 text-purple-700' },
                    { id: 'card', name: 'Card', color: 'border-blue-600 bg-blue-50 text-blue-700' },
                    { id: 'cod', name: 'COD', color: 'border-emerald-600 bg-emerald-50 text-emerald-800' },
                  ].map(method => (
                    <button
                      id={`pay_select_${method.id}`}
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id as any);
                        setWalletStep('credentials');
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id 
                          ? `${method.color} shadow-xs` 
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      {method.id === 'card' ? (
                        <CreditCard className="w-5 h-5 mb-1" />
                      ) : method.id === 'cod' ? (
                        <Banknote className="w-5 h-5 mb-1" />
                      ) : (
                        <Smartphone className="w-5 h-5 mb-1" />
                      )}
                      <span className="text-xs font-bold">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional payment form screens */}
              {paymentMethod === 'cod' ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                      Cash on Delivery Verify
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 self-center">
                      Pay on Delivery
                    </span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs text-gray-600 leading-relaxed text-center">
                      You will pay the full amount of <strong className="text-gray-900">৳{finalTotal.toLocaleString()}</strong> in cash to the courier agent when your elegant package is received at your doorstep.
                    </p>
                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-medium border border-emerald-100 flex items-center gap-2 justify-center text-center">
                      <span>No advance payment or online authorization pin required. Securely checkout now.</span>
                    </div>
                    <button
                      id="cod_pay_confirm_btn"
                      onClick={executeOrderPlacement}
                      disabled={isSubmitting}
                      className={`w-full text-sm font-bold bg-emerald-600 text-white rounded-lg py-3 hover:bg-emerald-700 shadow-sm cursor-pointer ${isSubmitting ? 'opacity-70 animate-pulse' : ''}`}
                    >
                      {isSubmitting ? 'Placing Order...' : 'Confirm Cash on Delivery Order'}
                    </button>
                  </div>
                </div>
              ) : paymentMethod !== 'card' ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                      {paymentMethod} Verified Checkout
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 self-center">
                      SSL Multi-Secure
                    </span>
                  </div>

                  {walletStep === 'credentials' && (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">
                        Enter your personal registered mobile wallet block number to authorize the instant pay connection.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 pb-1 uppercase">{paymentMethod} Account number:</label>
                        <input
                          id="wallet_number_input"
                          type="tel"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          placeholder="e.g. 0171XXXXXXXX"
                          className="w-full text-base font-semibold border border-gray-300 tracking-wider rounded-lg p-3 text-center outline-hidden bg-white"
                        />
                      </div>
                      <button
                        id="wallet_request_otp_btn"
                        onClick={handleWalletNext}
                        className="w-full font-bold bg-gray-900 text-white rounded-lg py-2.5 text-sm hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        Request Payment OTP
                      </button>
                    </div>
                  )}

                  {walletStep === 'otp' && (
                    <div className="space-y-4 text-center">
                      <p className="text-xs text-gray-600">
                        A unique verification security code has been emitted. Check simulated alert popup box.
                      </p>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 pb-1 uppercase">Enter 6-Digit OTP:</label>
                        <input
                          id="wallet_otp_input"
                          type="text"
                          maxLength={6}
                          value={walletOtp}
                          onChange={(e) => setWalletOtp(e.target.value)}
                          placeholder="******"
                          className="w-full text-xl text-center tracking-normal font-bold border border-gray-300 rounded-lg p-2 bg-white outline-hidden"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="wallet_otp_resend_btn"
                          onClick={simulateOtpGeneration}
                          className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-2 border border-gray-200 rounded-lg"
                        >
                          Resend OTP
                        </button>
                        <button
                          id="wallet_otp_submit_btn"
                          onClick={handleWalletNext}
                          className="flex-2 text-xs font-bold bg-gray-900 text-white rounded-lg py-2 hover:bg-gray-800"
                        >
                          Verify & Confirm
                        </button>
                      </div>
                    </div>
                  )}

                  {walletStep === 'pin' && (
                    <div className="space-y-4">
                      <p className="text-xs text-red-500 font-medium">
                        This is a simulated secure transaction channel for KHALAB. Enter your Pin code to complete checkout.
                      </p>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 pb-1 uppercase">{paymentMethod} PIN Secure Gate:</label>
                        <input
                          id="wallet_pin_input"
                          type="password"
                          maxLength={5}
                          value={walletPin}
                          onChange={(e) => setWalletPin(e.target.value)}
                          placeholder="•••••"
                          className="w-full text-2xl text-center tracking-widest font-bold border border-gray-300 rounded-lg p-2.5 bg-white outline-hidden"
                        />
                      </div>
                      <button
                        id="wallet_pay_confirm_btn"
                        onClick={handleWalletNext}
                        disabled={isSubmitting}
                        className={`w-full text-sm font-bold bg-green-600 text-white rounded-lg py-3 hover:bg-green-700 shadow-sm cursor-pointer ${isSubmitting ? 'opacity-70 animate-pulse' : ''}`}
                      >
                        {isSubmitting ? 'Authenticating & Placing Order...' : `Confirm Payment (৳${finalTotal.toLocaleString()})`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Credit Card payment entries
                <form onSubmit={handleCardSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-700">Credit Card Gateway</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Secure AES-256</span>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 font-semibold pb-1">CARDHOLDER NAME</label>
                    <input
                      id="card_holder_input"
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="e.g. TANVIR HOSSAIN"
                      className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 bg-white outline-hidden uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 font-semibold pb-1">CARD NUMBER</label>
                    <input
                      id="card_number_input"
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="w-full text-sm font-bold tracking-wider border border-gray-300 rounded-lg p-2.5 bg-white outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold pb-1">VALID THRU</label>
                      <input
                        id="card_expiry_input"
                        type="text"
                        required
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white outline-hidden text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 font-semibold pb-1">CVV / CVC</label>
                      <input
                        id="card_cvv_input"
                        type="password"
                        required
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white outline-hidden text-center tracking-widest"
                      />
                    </div>
                  </div>

                  <button
                    id="card_pay_submit_btn"
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-sm font-bold bg-blue-600 text-white rounded-lg py-3 hover:bg-blue-700 shadow-sm cursor-pointer ${isSubmitting ? 'opacity-70 animate-pulse' : ''}`}
                  >
                    {isSubmitting ? 'Verifying & Saving Order Online...' : `Authorize Payment (৳${finalTotal.toLocaleString()})`}
                  </button>
                </form>
              )}

              <button
                id="payment_back_btn"
                onClick={() => setCheckoutStep('details')}
                className="w-full text-xs text-gray-500 hover:text-gray-700 bg-transparent text-center font-semibold pt-1 block"
              >
                &larr; Back to delivery address
              </button>
            </div>
          )}

          {/* STEP 3: TRANSACTION SUCCESS & STATUS SUMMARY */}
          {checkoutStep === 'completed' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-20 h-20 text-green-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 font-sans">Payment Authorized successfully!</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Your premium clothes order has been logged into KHALAB. Head over to your dashboard profile to view invoices and do tracking.
              </p>
              
              <div className="pt-4 flex flex-col gap-2">
                <button
                  id="checkout_complete_close_btn"
                  onClick={() => {
                    clearCart();
                    onClose();
                  }}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white text-sm font-bold py-3 px-6 rounded-lg shadow-md cursor-pointer hover:opacity-90"
                >
                  Return to Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

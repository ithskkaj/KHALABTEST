import React, { useState, useEffect } from 'react';
import { Order, UserSession } from '../types';
import { ShoppingBag, ChevronRight, FileText, User, Printer, LogOut, Phone, Mail, Clock, MapPin } from 'lucide-react';
import { authenticateUserByPhoneOrEmail, fetchUserOrdersFromFirestore } from '../lib/firebase';

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onLogin: (session: UserSession) => void;
  onLogout: () => void;
  allOrders: Order[];
  brandName: string;
  brandAddress: string;
  brandPhone: string;
  primaryColor: string;
}

export default function UserOrdersModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  allOrders,
  brandName,
  brandAddress,
  brandPhone,
  primaryColor,
}: UserOrdersModalProps) {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [authChoice, setAuthChoice] = useState<'signin' | 'signup'>('signin');
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Filter orders for logged-in user
  const userOrders = currentUser 
    ? allOrders.filter(o => o.userId === currentUser.userId || o.userId === currentUser.phoneOrEmail || o.userPhoneOrEmail === currentUser.phoneOrEmail) 
    : [];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail) {
      alert('Please fill out your Phone or Gmail address to continue.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const firebaseUser = await authenticateUserByPhoneOrEmail(phoneOrEmail);
      
      const session: UserSession = {
        userId: firebaseUser.uid,
        phoneOrEmail,
        browsingHistory: JSON.parse(localStorage.getItem('khalab_history') || '[]')
      };

      onLogin(session);
      alert(`Onboarded securely to KHALAB Member Lounge as: ${phoneOrEmail}`);
    } catch (err: any) {
      alert(`Firebase authentication error: ${err.message || err}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const getStatusStep = (status: string): number => {
    switch (status) {
      case 'Pending': return 1;
      case 'Processing': return 2;
      case 'Shipped': return 3;
      case 'Delivered': return 4;
      default: return 1;
    }
  };

  if (!isOpen) return null;

  return (
    <div id="user_orders_modal_container" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div id="user_orders_card" className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl relative overflow-hidden transition-all duration-300 max-h-[85vh] flex flex-col">
        
        {/* Modal Header */}
        <div style={{ backgroundColor: primaryColor }} className="text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider">KHALAB Member Lounge</h2>
              {currentUser && <p className="text-xs opacity-90">Session: {currentUser.phoneOrEmail}</p>}
            </div>
          </div>
          <button 
            id="close_user_orders_btn"
            onClick={onClose} 
            className="text-white hover:text-white/80 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center bg-black/20 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentUser ? (
            // Authentication form
            <div className="max-w-md mx-auto space-y-6 py-6">
              <div className="text-center space-y-2">
                <ShoppingBag style={{ color: primaryColor }} className="w-12 h-12 mx-auto animate-pulse" />
                <h3 className="text-lg font-black text-gray-800 uppercase">Access Your Orders & Track Shipping</h3>
                <p className="text-xs text-gray-500">Sign in effortlessly with your active mobile number or Gmail address.</p>
              </div>

              {/* Login block */}
              <form onSubmit={handleAuthSubmit} className="space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50">
                <div className="flex rounded-lg bg-gray-200 p-1 text-xs">
                  <button 
                    id="auth_choice_signin"
                    type="button" 
                    onClick={() => setAuthChoice('signin')} 
                    className={`flex-1 py-1.5 rounded-md font-bold transition-all ${authChoice === 'signin' ? 'bg-white shadow-xs text-amber-700' : 'text-gray-600'}`}
                  >
                    SIGN IN NOW
                  </button>
                  <button 
                    id="auth_choice_signup"
                    type="button" 
                    onClick={() => setAuthChoice('signup')} 
                    className={`flex-1 py-1.5 rounded-md font-bold transition-all ${authChoice === 'signup' ? 'bg-white shadow-xs text-amber-700' : 'text-gray-600'}`}
                  >
                    CREATE NUMBER/GMAIL ACCOUNT
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 pb-1 uppercase">Enter Mobile Number or Gmail Account *</label>
                  <div className="relative">
                    <input
                      id="auth_number_email_input"
                      type="text"
                      required
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="e.g. +8801700000000 or myname@gmail.com"
                      className="w-full text-sm border border-gray-300 rounded-lg p-3 outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                {/* Secure Social Medias mocks requested by user */}
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 block text-center font-semibold uppercase tracking-wider mb-2">Or quick secure social onboarding</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="social_login_fb"
                      type="button"
                      onClick={() => {
                        setPhoneOrEmail('fb_user_' + Math.floor(1000 + Math.random() * 9000) + '@facebook.com');
                        setAuthChoice('signin');
                        alert('Pre-filled Facebook secure login tokens initialized.');
                      }}
                      className="text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white flex items-center justify-center gap-1 hover:bg-gray-50"
                    >
                      <span>Facebook Login</span>
                    </button>
                    <button
                      id="social_login_google"
                      type="button"
                      onClick={() => {
                        setPhoneOrEmail('gmail_' + Math.floor(1000 + Math.random() * 9000) + '@gmail.com');
                        setAuthChoice('signin');
                        alert('Pre-filled Google Workspace authentication tokens initialized.');
                      }}
                      className="text-xs py-2 px-3 border border-gray-200 rounded-lg bg-white flex items-center justify-center gap-1 hover:bg-gray-50"
                    >
                      <span>Gmail Login</span>
                    </button>
                  </div>
                </div>

                <button
                  id="auth_submit_btn"
                  type="submit"
                  disabled={isLoggingIn}
                  style={{ backgroundColor: primaryColor }}
                  className={`w-full text-white text-sm font-bold py-2.5 rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-sm uppercase mt-4 ${isLoggingIn ? 'opacity-70 animate-pulse' : ''}`}
                >
                  {isLoggingIn ? 'Authenticating securely...' : (authChoice === 'signin' ? 'Verify and Log In' : 'Sign Up securely')}
                </button>
              </form>
            </div>
          ) : (
            // Logged in user space
            <div className="space-y-6">
              
              {/* Profile banner bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center font-black">
                    {currentUser.phoneOrEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{currentUser.phoneOrEmail}</h3>
                    <p className="text-xs text-gray-500">Welcome back! Keep tracking your orders live.</p>
                  </div>
                </div>
                <button
                  id="logout_btn"
                  onClick={onLogout}
                  className="text-xs border border-red-200 text-red-600 font-bold py-1.5 px-3 rounded-lg hover:bg-red-50 flex items-center gap-1 self-start"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>

              {/* Order Lists / Invoices navigation */}
              {!selectedOrder ? (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 mb-3 flex items-center gap-1">
                    <span>Active Invoices / Purchase History</span>
                    <span className="text-xs font-semibold bg-amber-500 text-white rounded-full px-2 py-0.5">{userOrders.length}</span>
                  </h4>

                  {userOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 space-y-1">
                      <p className="font-semibold">No order traces detected.</p>
                      <p className="text-xs">Once you checkout, your items will be automatically updated here.</p>
                    </div>
                  ) : (
                    <div id="orders_list_wrapper" className="space-y-3">
                      {userOrders.map((order) => (
                        <div 
                          id={`order_row_${order.id}`}
                          key={order.id}
                          className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all bg-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                {order.invoiceNo}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">
                              {order.items.length} clothing item(s) • Total: ৳{order.totalAmount.toLocaleString()} BDT
                            </p>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                            {/* Real-time Order Tracker Badge */}
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-700' :
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {order.status}
                            </span>

                            <button
                              id={`view_invoice_btn_${order.id}`}
                              onClick={() => setSelectedOrder(order)}
                              style={{ borderStyle: 'solid', borderWidth: '1px', borderColor: primaryColor }}
                              className="text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1"
                            >
                              Details & Invoice <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Detailed Order & Invoice Screen
                <div className="space-y-6">
                  <button 
                    id="back_to_list_btn"
                    onClick={() => setSelectedOrder(null)} 
                    className="text-xs font-bold text-gray-500 hover:text-gray-900 mb-2 block"
                  >
                    &larr; Back to purchase history
                  </button>

                  {/* VISUAL REAL TIME SHIPMENT PROGRESS BAR */}
                  <div className="bg-amber-500/5 stroke-amber-500/10 border border-amber-600/10 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-amber-800 tracking-wider">Live Package Real-Time Shipment Tracker</h4>
                    
                    {selectedOrder.status === 'Cancelled' ? (
                      <p className="text-sm font-semibold text-red-600">This order was marked Cancelled.</p>
                    ) : (
                      <div className="grid grid-cols-4 items-center gap-2">
                        {[
                          { step: 1, label: 'Pending', desc: 'Awaiting' },
                          { step: 2, label: 'Processing', desc: 'Sewing / Packaging' },
                          { step: 3, label: 'Shipped', desc: 'On Transit' },
                          { step: 4, label: 'Delivered', desc: 'Received' },
                        ].map(item => {
                          const activeStep = getStatusStep(selectedOrder.status);
                          const isComplete = activeStep >= item.step;
                          return (
                            <div key={item.step} className="text-center relative">
                              <div className="flex justify-center mb-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isComplete 
                                    ? 'bg-amber-500 text-white shadow-md' 
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                  {item.step}
                                </div>
                              </div>
                              <span className={`block text-[11px] font-black ${isComplete ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{item.label}</span>
                              <span className="block text-[9px] text-gray-400">{item.desc}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* INVOICE DESIGN (PRINTABLE) */}
                  <div id="printable_invoice_area" className="border border-gray-200 rounded-2xl bg-white p-6 shadow-sm space-y-6">
                    {/* Invoice header */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-widest text-amber-600">{brandName}</h2>
                        <p className="text-[10px] text-gray-500 font-mono">Invoice reference: {selectedOrder.invoiceNo}</p>
                        <p className="text-[10px] text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500 space-y-0.5">
                        <p className="font-bold text-gray-800">{brandName} Clothing Brand</p>
                        <p>{brandAddress}</p>
                        <p>Tel: {brandPhone}</p>
                      </div>
                    </div>

                    {/* Customer receipt details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Billed & Shipped To</span>
                        <p className="font-bold text-gray-900">{selectedOrder.shippingAddress.name}</p>
                        <p className="text-gray-600">{selectedOrder.shippingAddress.phone}</p>
                        <div className="flex gap-1.5 flex-wrap text-gray-500 mt-1">
                          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {selectedOrder.shippingAddress.union}, {selectedOrder.shippingAddress.thana}, {selectedOrder.shippingAddress.district}</span>
                        </div>
                        <p className="text-gray-500 mt-1">Street Details: {selectedOrder.shippingAddress.streetAddress}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Transaction Data</span>
                        <p className="text-gray-900">
                          <span className="text-gray-500">Method:</span>{' '}
                          <span className="font-bold uppercase">
                            {selectedOrder.paymentMethod === 'cod'
                              ? 'Cash on Delivery'
                              : selectedOrder.paymentMethod === 'card'
                              ? 'Credit Card'
                              : `${selectedOrder.paymentMethod} Wallet`}
                          </span>
                        </p>
                        {selectedOrder.paymentDetails.senderNumber && <p className="text-gray-600">Phone: {selectedOrder.paymentDetails.senderNumber}</p>}
                        {selectedOrder.paymentDetails.transactionId && <p className="text-gray-500 font-mono">TXN: {selectedOrder.paymentDetails.transactionId}</p>}
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-12 bg-gray-50 p-2.5 font-bold text-gray-700 uppercase border-b border-gray-100">
                        <div className="col-span-6">Cloth item & description</div>
                        <div className="col-span-2 text-center">Size</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-2 text-right">Price</div>
                      </div>

                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 p-3 border-b border-gray-50 items-center text-gray-600">
                          <div className="col-span-6 font-semibold text-gray-800">{item.product.title}</div>
                          <div className="col-span-2 text-center font-mono">{item.selectedSize}</div>
                          <div className="col-span-2 text-center font-mono">{item.quantity}</div>
                          <div className="col-span-2 text-right font-mono">
                            ৳{((item.product.promoPrice || item.product.price) * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer totals */}
                    <div className="flex justify-end pt-2">
                      <div className="w-[250px] space-y-1.5 text-xs text-right">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span className="font-mono">৳{selectedOrder.totalAmount.toLocaleString()} BDT</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Shipping Charge</span>
                          <span className="font-mono text-green-600">FREE Shipping</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900 text-sm">
                          <span>Paid Total</span>
                          <span className="font-mono text-amber-600">৳{selectedOrder.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Buttons to print or save */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        id="print_invoice_action_btn"
                        onClick={printInvoice}
                        className="flex-1 py-2 px-4 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print Receipt / PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckSquare, Sparkles, Tag, ShoppingBag } from 'lucide-react';

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'promo' | 'order' | 'info';
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  notifications: PushNotification[];
  onMarkAllRead: () => void;
  onClear: () => void;
  primaryColor: string;
}

export default function NotificationCenter({
  notifications,
  onMarkAllRead,
  onClear,
  primaryColor,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');

  const unreadCount = notifications.filter(n => !n.read).length;

  const requestMockPermission = () => {
    setPermission('granted');
    alert('[KHALAB Notifications] Push subscription is fully active! You will now receive real-time shipping milestones and discount notices.');
  };

  return (
    <div id="notification_dropdown_root" className="relative">
      <button
        id="notification_bell_toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-all cursor-pointer text-gray-700"
        title="Push notifications inbox"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          id="notifications_panel"
          className="absolute right-0 mt-3 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-150 z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div style={{ backgroundColor: primaryColor }} className="text-white p-4 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              Store notifications Center
            </h3>
            <button 
              id="close_notif_panel"
              onClick={() => setIsOpen(false)} 
              className="text-white hover:text-white/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-amber-500/5 border-b border-gray-150 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium font-sans">Receive push updates?</span>
            {permission === 'granted' ? (
              <span className="text-green-600 font-extrabold flex items-center gap-0.5">
                <CheckSquare className="w-3.5 h-3.5" /> SUBBED
              </span>
            ) : (
              <button
                id="grant_notif_permission"
                onClick={requestMockPermission}
                className="text-amber-700 font-bold hover:underline"
              >
                ENABLE NOW
              </button>
            )}
          </div>

          {/* List notifications */}
          <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400 space-y-1">
                <p className="text-xs font-semibold">Notifications Box is quiet.</p>
                <p className="text-[10px] text-gray-400">Shop, log promo codes, or update orders to view alerts.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  id={`notif_row_${notif.id}`}
                  key={notif.id} 
                  className={`p-3.5 space-y-1 text-left transition-all ${notif.read ? 'bg-white' : 'bg-gray-50/70 border-l-4 border-amber-500'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-1 leading-none">
                      {notif.type === 'promo' ? <Tag className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                      {notif.type} alert
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">{notif.title}</h4>
                  <p className="text-xs text-gray-500 leading-normal">{notif.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Footer actions */}
          {notifications.length > 0 && (
            <div className="bg-gray-50 p-2.5 flex justify-between gap-2 border-t border-gray-150 text-[10px] font-semibold text-gray-500 uppercase">
              <button 
                id="notif_mark_read"
                onClick={onMarkAllRead} 
                className="hover:text-gray-800 cursor-pointer"
              >
                Mark as read
              </button>
              <button 
                id="notif_clear_all"
                onClick={onClear} 
                className="hover:text-red-500 cursor-pointer"
              >
                Dismiss All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Phone, MapPin, ShoppingBag, X, ArrowRight, Bell } from 'lucide-react';

interface OrderNotificationData {
  orderId: string;
  orderType: string;
  customerName: string;
  customerPhone: string;
  amount: string;
  itemsSummary: string;
  dropAddress: string;
  navigateTo: string;
}

export default function OrderNotificationPopup() {
  const [notification, setNotification] = useState<OrderNotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Render for both provider and admin users
  const isProviderOrAdmin = user?.role === 'provider' || user?.role === 'admin';

  const showNotification = useCallback((data: OrderNotificationData) => {
    setNotification(data);
    setIsVisible(true);
    setIsExiting(false);

    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.6;
      audio.loop = true; // Loop continuously 
      audio.play().catch(() => { /* Browser may block autoplay */ });
      setActiveAudio(audio);
    } catch (e) { /* Ignore audio errors */ }

    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      dismissNotification();
    }, 30000);
  }, []);

  const dismissNotification = useCallback(() => {
    setIsExiting(true);
    
    // Stop audio
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      setActiveAudio(null);
    }

    setTimeout(() => {
      setIsVisible(false);
      setNotification(null);
      setIsExiting(false);
    }, 400);
  }, [activeAudio]);

  const handleViewOrder = useCallback(() => {
    dismissNotification();
    setLocation(notification?.navigateTo || '/provider/dashboard');
  }, [setLocation, dismissNotification, notification]);

  // Listen for messages from Android WebView bridge
  useEffect(() => {
    if (!isProviderOrAdmin) return;

    // Method 1: Android WebView bridge callback
    (window as any).onOrderNotification = (dataStr: string) => {
      try {
        const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
        if (data.orderId) {
          showNotification(data);
        }
      } catch (e) {
        console.error('[Notification] Parse error:', e);
      }
    };

    // Method 2: Listen for postMessage events (from service worker or other sources)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ORDER_REQUEST' && event.data?.data) {
        showNotification(event.data.data);
      }
    };
    window.addEventListener('message', handleMessage);

    // Method 3: Listen for service worker push events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'ORDER_REQUEST' && event.data?.data) {
          showNotification(event.data.data);
        }
      });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      delete (window as any).onOrderNotification;
    };
  }, [isProviderOrAdmin, showNotification]);

  if (!isProviderOrAdmin || !isVisible || !notification) return null;

  const orderTypeConfig: Record<string, { icon: string; label: string; gradient: string }> = {
    'restaurant': { icon: '🍽️', label: 'Restaurant Order', gradient: 'from-orange-500 to-red-500' },
    'street_food': { icon: '🌮', label: 'Street Food Order', gradient: 'from-amber-500 to-orange-500' },
    'grocery': { icon: '🛒', label: 'Grocery Order', gradient: 'from-green-500 to-emerald-500' },
    'service': { icon: '🔧', label: 'Service Booking', gradient: 'from-blue-500 to-indigo-500' },
  };

  const config = orderTypeConfig[notification.orderType] || orderTypeConfig['restaurant'];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}
        onClick={dismissNotification}
      />

      {/* Notification card */}
      <div
        className={`fixed top-0 left-0 right-0 z-[9999] flex justify-center p-4 pt-6 transition-all duration-400 ${
          isExiting ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{ animation: isExiting ? '' : 'slideInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

          {/* Branded header with gradient */}
          <div className={`bg-gradient-to-r ${config.gradient} px-5 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">SHIRUR EXPRESS</p>
                <p className="text-white/80 text-[10px] font-medium">New Order Alert</p>
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Order type badge */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{config.icon}</span>
              <span className="text-white font-semibold text-lg">{config.label}</span>
            </div>

            {/* Amount — Large & prominent */}
            <div className="bg-white/5 rounded-xl p-4 mb-3 border border-white/10">
              <p className="text-white/60 text-xs font-medium mb-1">ORDER TOTAL</p>
              <p className="text-3xl font-extrabold text-emerald-400">
                ₹{notification.amount}
              </p>
            </div>

            {/* Items summary */}
            {notification.itemsSummary && (
              <div className="flex items-start gap-3 mb-3 px-1">
                <ShoppingBag className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                <p className="text-white/80 text-sm leading-relaxed">{notification.itemsSummary}</p>
              </div>
            )}

            {/* Customer phone */}
            {notification.customerPhone && notification.customerPhone !== 'N/A' && (
              <div className="flex items-center gap-3 mb-2 px-1">
                <Phone className="w-4 h-4 text-white/50 flex-shrink-0" />
                <p className="text-white/90 text-sm font-medium">{notification.customerPhone}</p>
              </div>
            )}

            {/* Delivery address */}
            {notification.dropAddress && notification.dropAddress !== 'Check App' && (
              <div className="flex items-start gap-3 mb-2 px-1">
                <MapPin className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                <p className="text-white/70 text-sm leading-relaxed line-clamp-2">{notification.dropAddress}</p>
              </div>
            )}
          </div>

          {/* View Order button — Single prominent CTA */}
          <div className="px-5 pb-5 pt-2">
            <button
              onClick={handleViewOrder}
              className={`w-full bg-gradient-to-r ${config.gradient} hover:brightness-110 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-lg`}
            >
              <span className="text-base">View Order</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInDown {
          0% { transform: translateY(-120%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

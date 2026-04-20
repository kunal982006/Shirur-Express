import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Key, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingOtp() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hasNotified, setHasNotified] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Queries matching my-bookings to find active OTPs
  const { data: bookings } = useQuery<any[]>({
    queryKey: ["/api/customer/my-bookings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customer/my-bookings");
      return response.json();
    },
    enabled: !!user && isAuthenticated,
    refetchInterval: 5000,
  });

  const { data: groceryOrders } = useQuery<any[]>({
    queryKey: ["/api/customer/grocery-orders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/customer/grocery-orders");
      return response.json();
    },
    enabled: !!user && isAuthenticated,
    refetchInterval: 5000,
  });

  const { data: restaurantOrders } = useQuery<any[]>({
    queryKey: ["/api/customer/restaurant-orders"],
    queryFn: async () => {
      const response = await api.get("/customer/restaurant-orders");
      return response.data;
    },
    enabled: !!user && isAuthenticated,
    refetchInterval: 5000,
  });

  // Determine active OTP
  let activeOtpCode = null;
  let activeOtpContext = "";
  let bookingId = "";

  if (bookings) {
    const bookingWithOtp = bookings.find((b: any) => b.status === "awaiting_otp" && b.serviceOtp);
    if (bookingWithOtp) {
      activeOtpCode = bookingWithOtp.serviceOtp;
      activeOtpContext = bookingWithOtp.problem?.name || bookingWithOtp.serviceOffering?.name || "Service Request";
      bookingId = bookingWithOtp.id;
    }
  }

  useEffect(() => {
    if (activeOtpCode && !hasNotified) {
      toast({
        title: "OTP Required",
        description: `Your OTP for ${activeOtpContext} is ${activeOtpCode}. Click to view details.`,
        action: (
          <Button size="sm" onClick={() => setLocation("/my-bookings")}>
            View
          </Button>
        ),
        duration: 8000,
      });
      setHasNotified(true);
    }
  }, [activeOtpCode, hasNotified, activeOtpContext, toast, setLocation]);

  if (!activeOtpCode || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-[88px] right-4 z-50 animate-in slide-in-from-right-8 fade-in duration-500 max-w-[280px]">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
        <div className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-yellow-200/50 dark:border-yellow-700/50 flex flex-col gap-2">
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 dark:bg-amber-900/40 rounded-full">
              <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                {activeOtpContext}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Share this OTP to complete
              </p>
            </div>
          </div>
          
          <div 
            className="mt-2 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-transparent rounded-xl p-3 border border-yellow-100 dark:border-yellow-900/50 flex items-center justify-between cursor-pointer hover:bg-yellow-100/50 dark:hover:bg-yellow-900/40 transition-colors"
            onClick={() => setLocation("/my-bookings")}
          >
            <span className="text-3xl font-extrabold tracking-[0.2em] text-amber-700 dark:text-amber-300">
              {activeOtpCode}
            </span>
            <ChevronRight className="h-5 w-5 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

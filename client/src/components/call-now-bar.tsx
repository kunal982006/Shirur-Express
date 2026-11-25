import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PhoneCall, Sparkles, Wrench, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CALL_REQUEST_ADDRESS, CALL_REQUEST_SLOT } from "@shared/call-request";

export interface CallNowBarProps {
  title?: string;
  tagline?: string;
  phoneNumber?: string;
  variant?: "electrician" | "plumber" | "beauty" | "default";
  className?: string;
  hideOnCart?: boolean;
  /**
   * When set, the button asks Shirur Express to call the customer back: it
   * creates an unassigned booking for this service, which rings the admin
   * panel, where a technician is assigned. Without it the button dials directly.
   */
  requestCallFor?: "electrician" | "plumber";
}

export function CallNowBar({
  title = "Direct Call Specialist",
  tagline = "Hume call karein aur apni problem batayein",
  phoneNumber = "+917840940113",
  variant = "default",
  className = "",
  requestCallFor,
}: CallNowBarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [problem, setProblem] = useState("");

  const requestCall = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookings", {
        serviceType: requestCallFor,
        scheduledAt: new Date().toISOString(),
        preferredTimeSlots: [CALL_REQUEST_SLOT],
        userPhone: phone,
        userAddress: CALL_REQUEST_ADDRESS,
        notes: problem.trim() ? `Call request: ${problem.trim()}` : "Call request: call the customer for the problem and address",
        isUrgent: true,
        paymentMethod: "cod",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Could not send your request");
      }
      return res.json();
    },
    onSuccess: () => {
      setOpen(false);
      setProblem("");
      queryClient.invalidateQueries({ queryKey: ["customerBookings"] });
      toast({ title: "Request sent!", description: `We will call you on ${phone} in a few minutes.` });
    },
    onError: (error: any) => {
      toast({ title: "Request failed", description: error.message || "Please try again.", variant: "destructive" });
    },
  });

  const handleCall = () => {
    if (!requestCallFor) {
      window.location.href = `tel:${phoneNumber}`;
      return;
    }
    if (!user) {
      toast({ title: "Please log in", description: "Log in so we can call you back." });
      setLocation("/login");
      return;
    }
    setPhone((user.phone || "").replace(/\D/g, "").slice(-10));
    setOpen(true);
  };

  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  const variantStyles = {
    electrician: {
      barBg: "bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-amber-500/40 shadow-[0_4px_25px_rgba(245,158,11,0.2)]",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      button: "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-amber-500/30",
      pulseColor: "bg-amber-400",
      icon: <Zap className="h-3.5 w-3.5 text-amber-400" />,
    },
    plumber: {
      barBg: "bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-cyan-500/40 shadow-[0_4px_25px_rgba(6,182,212,0.2)]",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      button: "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white shadow-cyan-500/30",
      pulseColor: "bg-cyan-400",
      icon: <Wrench className="h-3.5 w-3.5 text-cyan-400" />,
    },
    beauty: {
      barBg: "bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-pink-500/40 shadow-[0_4px_25px_rgba(236,72,153,0.2)]",
      badge: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      button: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-500/30",
      pulseColor: "bg-pink-400",
      icon: <Sparkles className="h-3.5 w-3.5 text-pink-400" />,
    },
    default: {
      barBg: "bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 border-emerald-400/40 shadow-[0_4px_25px_rgba(5,150,105,0.25)]",
      badge: "bg-white/20 text-white border-white/30",
      button: "bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 shadow-md font-extrabold",
      pulseColor: "bg-emerald-300",
      icon: <PhoneCall className="h-3.5 w-3.5 text-white" />,
    },
  };

  const currentTheme = variantStyles[variant] || variantStyles.default;

  return (
    <aside
      aria-label="Direct Call Support"
      style={{
        /* 
           Crucial fix: Position strictly above mobile bottom nav bar (4rem) + safe area inset + 12px clearance 
           Ensures the Call Now button is 100% visible and NEVER overlapped by the bottom navigation bar.
        */
        bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 12px)",
      }}
      className={`fixed z-40 transition-all duration-300 backdrop-blur-xl border
        /* Floating pill styling on mobile */
        left-3 right-3 rounded-2xl
        /* Desktop centered layout */
        md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:w-full md:mx-0
        ${currentTheme.barBg} ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 max-w-xl mx-auto gap-3">
        {/* Left Side: Pulse indicator + Title + Tagline */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.pulseColor}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentTheme.pulseColor}`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-xs tracking-wide flex items-center gap-1 truncate">
                {currentTheme.icon}
                {title}
              </span>
              <span
                className={`hidden sm:inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${currentTheme.badge}`}
              >
                Instant
              </span>
            </div>

            <p className="text-slate-200 text-[11px] sm:text-xs leading-tight font-medium truncate">
              {tagline}
            </p>
          </div>
        </div>

        {/* Right Side: Prominent, fully accessible Call Button */}
        <Button
          onClick={handleCall}
          className={`shrink-0 rounded-full h-10 px-4 sm:px-5 font-bold text-xs sm:text-sm tracking-wide
            shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2 ${currentTheme.button}`}
        >
          <PhoneCall className="h-4 w-4 animate-pulse" />
          <span>{requestCallFor ? "Request a Call" : "Call Now"}</span>
        </Button>
      </div>

      {requestCallFor && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Request a call</DialogTitle>
              <DialogDescription>
                Our team will call you in a few minutes to understand the problem and confirm your address, then send a {requestCallFor}.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (phoneValid && !requestCall.isPending) requestCall.mutate();
              }}
            >
              <div className="space-y-1">
                <label htmlFor="call-request-phone" className="text-sm font-medium">Your mobile number</label>
                <Input
                  id="call-request-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                />
                {phone.length > 0 && !phoneValid && <p className="text-xs text-red-500">Enter a valid 10-digit mobile number.</p>}
              </div>
              <div className="space-y-1">
                <label htmlFor="call-request-problem" className="text-sm font-medium">Problem (optional)</label>
                <Textarea
                  id="call-request-problem"
                  rows={2}
                  maxLength={200}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="e.g. Tap leaking, fan not working"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!phoneValid || requestCall.isPending}>
                {requestCall.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                <span className="ml-2">Request a Call</span>
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </aside>
  );
}

export default CallNowBar;

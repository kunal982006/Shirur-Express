import React from "react";
import { PhoneCall, Sparkles, Wrench, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CallNowBarProps {
  title?: string;
  tagline?: string;
  phoneNumber?: string;
  variant?: "electrician" | "plumber" | "beauty" | "default";
  className?: string;
  hideOnCart?: boolean;
}

export function CallNowBar({
  title = "Direct Call Specialist",
  tagline = "Hume call karein aur apni problem batayein",
  phoneNumber = "+917840940113",
  variant = "default",
  className = "",
}: CallNowBarProps) {
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

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
          <span>Call Now</span>
        </Button>
      </div>
    </aside>
  );
}

export default CallNowBar;

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

  // Service specific accents while maintaining sleek, non-intrusive aesthetic
  const variantStyles = {
    electrician: {
      barBg: "bg-slate-950/90 border-amber-500/30 shadow-[0_-4px_20px_rgba(245,158,11,0.15)]",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      button: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/25",
      pulseColor: "bg-amber-400",
      icon: <Zap className="h-3.5 w-3.5 text-amber-400" />,
    },
    plumber: {
      barBg: "bg-slate-950/90 border-cyan-500/30 shadow-[0_-4px_20px_rgba(6,182,212,0.15)]",
      badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      button: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/25",
      pulseColor: "bg-cyan-400",
      icon: <Wrench className="h-3.5 w-3.5 text-cyan-400" />,
    },
    beauty: {
      barBg: "bg-slate-950/90 border-pink-500/30 shadow-[0_-4px_20px_rgba(236,72,153,0.15)]",
      badge: "bg-pink-500/15 text-pink-300 border-pink-500/30",
      button: "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-500/25",
      pulseColor: "bg-pink-400",
      icon: <Sparkles className="h-3.5 w-3.5 text-pink-400" />,
    },
    default: {
      barBg: "bg-slate-950/90 border-emerald-500/30 shadow-[0_-4px_20px_rgba(16,185,129,0.15)]",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      button: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25",
      pulseColor: "bg-emerald-400",
      icon: <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />,
    },
  };

  const currentTheme = variantStyles[variant] || variantStyles.default;

  return (
    <aside
      aria-label="Direct Call Support"
      className={`fixed z-40 left-0 right-0 backdrop-blur-xl transition-all duration-300
        /* Docks cleanly directly above mobile bottom nav bar */
        bottom-[calc(4rem+env(safe-area-inset-bottom))]
        /* Floats centered on tablet/desktop */
        md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:rounded-2xl md:mx-4
        border-t md:border ${currentTheme.barBg} ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 max-w-xl mx-auto gap-3">
        {/* Left Side: Status Dot + Taglines */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Pulsing Available Now Indicator */}
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.pulseColor}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentTheme.pulseColor}`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            {/* Title / Badge */}
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

            {/* Tagline */}
            <p className="text-slate-300 text-[11px] sm:text-xs leading-tight font-medium truncate">
              {tagline}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Call Button */}
        <Button
          onClick={handleCall}
          className={`shrink-0 rounded-full h-9 sm:h-10 px-4 sm:px-5 font-bold text-xs sm:text-sm tracking-wide
            shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-95 flex items-center gap-2 ${currentTheme.button}`}
        >
          <PhoneCall className="h-3.5 w-3.5 animate-pulse" />
          <span>Call Now</span>
        </Button>
      </div>
    </aside>
  );
}
export default CallNowBar;

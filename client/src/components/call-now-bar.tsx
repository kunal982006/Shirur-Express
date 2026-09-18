import React from "react";
import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallNowBarProps {
  tagline?: string;
  phoneNumber?: string;
}

export function CallNowBar({ 
  tagline = "Hume call karein aur apni problem batayein",
  phoneNumber = "+919876543210" // Default placeholder, you can pass actual number
}: CallNowBarProps) {
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-gradient-to-r from-emerald-600 to-teal-700 shadow-[0_-4px_15px_rgba(0,0,0,0.15)] md:hidden">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-wide">Need Help?</span>
          <span className="text-emerald-100 text-[11px] leading-tight max-w-[200px]">
            {tagline}
          </span>
        </div>
        <Button 
          onClick={handleCall}
          className="rounded-full bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-md h-10 px-5 flex items-center gap-2 font-bold"
        >
          <PhoneCall className="h-4 w-4 animate-pulse" />
          Call Now
        </Button>
      </div>
    </div>
  );
}

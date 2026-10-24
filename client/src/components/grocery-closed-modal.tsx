import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, UtensilsCrossed, Flame, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface GroceryClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function GroceryClosedModal({
  isOpen,
  onClose,
  title = "Grocery Service Temporarily Closed",
  description = "We are currently restocking and updating our fresh grocery inventory to serve you better. Grocery delivery will resume very shortly!",
}: GroceryClosedModalProps) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[92vw] max-w-[420px] rounded-3xl p-6 border-0 shadow-2xl bg-white text-gray-900 overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-primary" />

        <div className="flex flex-col items-center text-center pt-2">
          {/* Animated Icon Badge */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-inner">
              <span className="text-4xl select-none animate-bounce" role="img" aria-label="Grocery Cart">
                🛒
              </span>
            </div>
            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-md">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Heading */}
          <DialogHeader className="space-y-1.5 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-semibold self-center mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Temporarily Paused</span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-gray-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 leading-relaxed max-w-sm pt-1">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Prompt banner */}
          <div className="w-full bg-orange-50/70 border border-orange-200/70 rounded-2xl p-3.5 my-5 text-left flex items-start gap-3">
            <span className="text-2xl mt-0.5">🍲</span>
            <div className="text-xs text-orange-950 leading-snug">
              <span className="font-bold block text-sm text-orange-900 mb-0.5">Hungry? Food is live!</span>
              Explore top restaurants and hot street food in Shirur — delivered to your doorstep in minutes.
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="w-full space-y-2.5">
            <Button
              className="w-full h-11 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md flex items-center justify-center gap-2"
              onClick={() => {
                onClose();
                setLocation("/");
              }}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Explore Restaurants</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-11 text-sm font-semibold rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50 flex items-center justify-center gap-2"
              onClick={() => {
                onClose();
                setLocation("/street-food");
              }}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Explore Street Food</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full h-9 text-xs text-gray-500 hover:text-gray-800 font-medium rounded-lg"
              onClick={onClose}
            >
              Close and Browse Catalog
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

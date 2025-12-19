import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Plus, Minus, Trash2 } from "lucide-react";
import type { CartItem } from "@/hooks/use-cart";

interface CartSummaryProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onProceedToCheckout: () => void;
}

export default function CartSummary({
  items,
  onUpdateQuantity,
  onProceedToCheckout
}: CartSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const platformFee = subtotal * 0.05; // 5% platform fee
  const distance = 3.5; // Mock distance - in real app this would be calculated
  const deliveryFee = distance * 9; // ₹9 per km
  const total = subtotal + platformFee + deliveryFee;

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 md:relative bg-card border-t md:border rounded-t-xl md:rounded-xl shadow-2xl p-4 z-40">
      <div className="max-w-7xl mx-auto">
        {/* Collapsed View */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {totalItems} item{totalItems !== 1 ? 's' : ''} • Subtotal
            </p>
            <p className="text-2xl font-bold">₹{subtotal.toFixed(2)}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="text-primary font-medium flex items-center space-x-1"
            data-testid="button-toggle-cart"
          >
            <span>View Cart</span>
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Expanded View */}
        {expanded && (
          <div className="border-t border-border pt-4 mb-4 max-h-60 overflow-y-auto">
            <h4 className="font-medium mb-3">Cart Items</h4>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.weight}</p>
                      <p className="text-sm font-medium">₹{item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                    </Button>
                    <Badge variant="secondary" className="min-w-[2rem] text-center">
                      {item.quantity}
                    </Badge>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        {/* Price Breakdown - Hidden per user request (visible at billing/checkout) */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Subtotal (excluding fees)</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-3 mt-3"
          onClick={onProceedToCheckout}
          data-testid="button-checkout"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
// --- BADLAV: Stripe ke imports hata diye ---
// import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/hooks/use-cart-store";
// --- BADLAV: apiRequest aur useToast imports rehne diye, par use nahi honge abhi ---
// import { apiRequest } from "@/lib/queryClient"; // Abhi iski zaroorat nahi
import { useToast } from "@/hooks/use-toast"; // Toast abhi bhi kaam aayega

// --- Naye Icons import kiye hain (Agar pehle se nahi hain) ---
import { ArrowLeft, ShoppingCart, Truck, Minus, Plus, Trash2 } from "lucide-react";


// --- BADLAV: CheckoutForm component ko hata diya hai ---
// const CheckoutForm = () => { /* ... */ };


export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, removeItem, increaseQuantity, decreaseQuantity, getTotalPrice, clearCart } = useCartStore();
  const { toast } = useToast(); // Toast ko use karenge "Order Placed" message ke liye

  // Fees calculation
  const subtotal = getTotalPrice();
  const platformFee = subtotal * 0.01;
  const deliveryFee = 24.50; // Mock delivery fee
  const total = subtotal + platformFee + deliveryFee;

  useEffect(() => {
    // Agar cart empty hai, toh user ko shopping page par bhej do
    if (items.length === 0) {
      setLocation('/street-food');
    }
    // Dependency array me `items.length` bhi add kiya, taaki cart empty hone par redirect ho
  }, [items.length, setLocation]);


  // --- BADLAV: handlePlaceOrder function banaya hai ---
  const handlePlaceOrder = () => {
    // Yahan hum fake order place karenge aur success dikhayenge
    toast({
      title: "🎉 Order Placed!",
      description: "Your order has been placed successfully. You will receive a confirmation shortly.",
    });
    clearCart(); // Cart ko khaali kar do order place hone ke baad
    setLocation("/order-success"); // Order success page par redirect
  };


  // --- BADLAV: Loading state aur clientSecret ki ab zaroorat nahi hai ---
  // if (loading || !clientSecret) { /* ... */ }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/street-food")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Street Food</span>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary / Cart Items List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Your Cart Items</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} / item</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => decreaseQuantity(item.id)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Badge variant="secondary" className="h-7 w-7 flex items-center justify-center">
                            {item.quantity}
                        </Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => increaseQuantity(item.id)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                          className="ml-2 text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (1%)</span>
                    <span>₹{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      Delivery Fee
                    </span>
                    <span>₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {/* --- BADLAV: Place Order button --- */}
                <Button
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={items.length === 0}
                  data-testid="button-place-order"
                >
                  Place Order (₹{total.toFixed(2)})
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* --- BADLAV: Payment Form Section ko hata diya --- */}
          {/* Ab yahan koi payment form nahi hai */}
        </div>
      </div>
    </div>
  );
}
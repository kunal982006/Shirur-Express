import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Truck, Minus, Plus, Trash2, Loader2, MapPin, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// --- NAYE IMPORTS ---
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api"; // API client
import { useAuth } from "@/hooks/use-auth"; // User details ke liye
import { calculateDistance, calculateDeliveryFee } from "@/lib/location";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// --- IMPORTS KHATAM ---

// Delivery Address ke liye Schema
const checkoutSchema = z.object({
  deliveryAddress: z.string().min(10, {
    message: "Please enter a valid delivery address (min. 10 characters).",
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Yeh function Razorpay script load hone ka wait karega
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};


export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth(); // Logged in user ko get karo
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { toast } = useToast();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // --- LOCATION & FEE STATE ---
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceInMeters, setDistanceInMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Fetch Provider Details to get coordinates
  const { data: provider } = useQuery({
    queryKey: ['/api/service-providers', items[0]?.providerId],
    queryFn: async () => {
      if (!items[0]?.providerId) return null;
      const res = await api.get(`/service-providers/${items[0].providerId}`);
      return res.data;
    },
    enabled: !!items[0]?.providerId
  });

  // Calculate Distance when locations are available
  useEffect(() => {
    if (userLocation && provider && provider.latitude && provider.longitude) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(provider.latitude),
        parseFloat(provider.longitude)
      );
      setDistanceInMeters(dist);
    }
  }, [userLocation, provider]);

  // Fees calculation
  const subtotal = getTotalPrice();
  const platformFee = 0; // Platform fee removed as per request


  // Determine Delivery Fee directly based on item type
  const isGrocery = items.some(item => item.itemType === 'grocery');
  const isCake = items.some(item => item.itemType === 'cake');

  let deliveryFee = 50; // Default fixed delivery fee as per request
  if (isGrocery) {
    deliveryFee = 20;
  }

  // Deliverability Check (based on distance if available)
  let isDeliverable = true;
  let distanceInKm = 0;

  if (distanceInMeters !== null) {
    distanceInKm = distanceInMeters / 1000;
    if (distanceInKm > 10) {
      isDeliverable = false;
    }
  } else {
    // Default or fallback if location not yet fetched? 
    // For now, let's keep it 0 or show "Calculate"
    // We will block order if location is missing.
  }

  const total = subtotal + platformFee + deliveryFee;

  // Form setup
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "",
    },
  });

  useEffect(() => {
    if (items.length === 0 && !isPlacingOrder) {
      setLocation('/street-food'); // Ya grocery, jahan se user aaya
    }
  }, [items.length, setLocation, isPlacingOrder]);

  // Get User Location
  const getUserLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setUserLocation({
          lat: latitude,
          lng: longitude
        });

        // Attempt reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data && data.display_name) {
            // Only update if the field is empty to avoid overwriting user edits? 
            // Or always update since user clicked "Detect Location"?
            // Let's assume on "Detect" we should provide the address.
            form.setValue("deliveryAddress", data.display_name);
            toast({ title: "Address Found", description: "Location address updated." });
          } else {
            toast({ title: "Location Detected", description: "Could not fetch street address. Please enter details." });
          }
        } catch (error) {
          console.error("Reverse geocoding failed", error);
          // Fallback or just silent fail for address text
          toast({ title: "Location Detected", description: "Please enter your specific address." });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Unable to retrieve your location. Please allow location access.");
        setIsLocating(false);
      }
    );
  };

  // Auto-detect location on mount if not set
  useEffect(() => {
    getUserLocation();
  }, []);


  // --- YEH FUNCTION POORA NAYA HAI ---
  const onSubmit = async (values: CheckoutFormValues) => {
    if (!userLocation) {
      toast({ title: "Location Required", description: "Please enable location to calculate delivery fee.", variant: "destructive" });
      getUserLocation();
      return;
    }

    if (!isDeliverable) {
      toast({ title: "Not Deliverable", description: "Sorry, we do not deliver to this location (too far).", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);

    // 1. Razorpay script load karo
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({ title: "Error", description: "Payment gateway failed to load. Please try again.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "You must be logged in to place an order.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }

    try {
      // 2. Determine Order Type and Payload
      const isStreetFood = items.some(item => item.itemType === 'street_food');
      const isRestaurant = items.some(item => item.itemType === 'restaurant');

      let endpoint = "/grocery-orders";
      if (isStreetFood) endpoint = "/street-food-orders";
      if (isRestaurant) endpoint = "/restaurant/orders";

      let orderPayload;

      if (isStreetFood || isRestaurant) {
        orderPayload = {
          items: items.map(item => ({
            productId: item.id, // For restaurant, this is menuItemId
            menuItemId: isRestaurant ? item.id : undefined, // Explicitly set menuItemId for restaurant
            quantity: item.quantity,
            price: item.price,
            providerId: item.providerId || "unknown",
            name: item.name
          })),
          totalAmount: total.toFixed(2), // Schema expects totalAmount
          deliveryAddress: values.deliveryAddress,
          providerId: isRestaurant ? items[0].providerId : undefined, // Restaurant order needs providerId at root
          // runnerId will be assigned by backend
        };
      } else {
        // Grocery Order Payload
        orderPayload = {
          items: items.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
          subtotal: subtotal.toFixed(2),
          platformFee: platformFee.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          total: total.toFixed(2),
          deliveryAddress: values.deliveryAddress,
          providerId: items[0]?.providerId || null,
        };
      }

      // Validate single provider for Grocery (Street food can be multi-vendor? Schema supports it via JSON items having providerId)
      // But for now let's keep the single provider check ONLY for grocery if needed, or remove it if we want multi-vendor grocery too.
      // The user requirement said "Users can add multiple items from a single vendor or multiple vendors to the cart" for Street Food.
      // So we SKIP the single provider check for Street Food.

      if (!isStreetFood) {
        // For Grocery AND Restaurant, we enforce single provider
        const uniqueProviders = new Set(items.map(item => item.providerId).filter(Boolean));
        if (uniqueProviders.size > 1) {
          toast({ title: "Multiple Shops Detected", description: "Please order from one shop/restaurant at a time.", variant: "destructive" });
          setIsPlacingOrder(false);
          return;
        }
      }

      const dbOrderResponse = await api.post(endpoint, orderPayload);
      const dbOrder = await dbOrderResponse.data;
      console.log("DB Order Response:", dbOrder);

      if (!dbOrder || !dbOrder.id) {
        alert("DEBUG: Order created but ID missing! " + JSON.stringify(dbOrder));
        throw new Error("Order ID missing from server response");
      }

      const databaseOrderId = dbOrder.id;

      // 3. Ab Razorpay ka order create karo
      const rzpOrderResponse = await api.post("/payment/create-order", {
        orderId: databaseOrderId,
        orderType: isStreetFood ? 'street_food' : (isRestaurant ? 'restaurant' : 'grocery'),
      });
      const rzpOrder = await rzpOrderResponse.data;

      // 4. Razorpay Popup Options
      const options = {
        key: rzpOrder.razorpayKeyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Shirur Express",
        description: `Order ID: ${databaseOrderId}`,
        order_id: rzpOrder.razorpayOrderId,

        // Yeh function tab call hoga jab payment complete hogi
        handler: async (response: any) => {
          try {
            // 5. Payment ko server par verify karo
            const verificationResponse = await api.post("/payment/verify-signature", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              database_order_id: databaseOrderId,
              orderType: isStreetFood ? 'street_food' : (isRestaurant ? 'restaurant' : 'grocery'),
            });

            if (verificationResponse.data.status === 'success') {
              // 6. Success!
              toast({
                title: "✅ Order Placed!",
                description: "Your payment was successful.",
              });
              clearCart();
              setLocation("/order-success"); // Success page par bhejo
            } else {
              throw new Error("Payment verification failed");
            }

          } catch (verifyError) {
            toast({ title: "Payment Failed", description: "Signature verification failed. Please contact support.", variant: "destructive" });
            setIsPlacingOrder(false);
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
          contact: user.phone,
        },
        notes: {
          address: values.deliveryAddress,
          databaseOrderId: databaseOrderId,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            toast({ title: "Payment Cancelled", description: "Your order was not placed.", variant: "destructive" });
            setIsPlacingOrder(false);
          },
        },
      };

      // 7. Razorpay Popup Kholo
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error("Order placement error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Could not create order. Please try again.";
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsPlacingOrder(false);
    }
  };


  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/street-food")} // TODO: Isko dynamic bana sakte ho
          data-testid="button-back"
          disabled={isPlacingOrder}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shopping</span>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* --- YEH POORA FORM ME WRAP KIYA HAI --- */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left Column: Address + Cart */}
              <div>
                {/* Location Status Card */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Location & Delivery</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!userLocation ? (
                      <div className="flex flex-col items-start gap-2">
                        <p className="text-sm text-muted-foreground">
                          We need your location to calculate the delivery fee.
                        </p>
                        <Button
                          type="button"
                          onClick={getUserLocation}
                          disabled={isLocating}
                          variant="secondary"
                        >
                          {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                          Detect My Location
                        </Button>
                        {locationError && (
                          <p className="text-sm text-destructive">{locationError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-green-600 gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm font-medium">Location Detected</span>
                        </div>
                        {distanceInMeters !== null && (
                          <p className="text-sm text-muted-foreground">
                            Distance to Vendor: <span className="font-medium text-foreground">{distanceInKm.toFixed(1)} km</span>
                          </p>
                        )}
                        {!isDeliverable && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Not Deliverable</AlertTitle>
                            <AlertDescription>
                              Your location is too far from the vendor ({distanceInKm.toFixed(1)} km). We only deliver within 10 km.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Truck className="h-5 w-5" />
                      <span>Delivery Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* --- YEH NAYA ADDRESS FORM FIELD HAI --- */}
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your full address, including house number, street, and landmark..."
                              className="resize-none"
                              rows={4}
                              {...field}
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span>Your Cart Items</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
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
                              variant="outline" size="icon" className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1 || isPlacingOrder}
                              aria-label="Decrease quantity" type="button"
                            > <Minus className="h-4 w-4" /> </Button>

                            <Badge variant="secondary" className="h-7 w-7 flex items-center justify-center">
                              {item.quantity}
                            </Badge>

                            <Button
                              variant="outline" size="icon" className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity" type="button"
                              disabled={isPlacingOrder}
                            > <Plus className="h-4 w-4" /> </Button>

                            <Button
                              variant="ghost" size="icon"
                              onClick={() => removeItem(item.id)}
                              aria-label="Remove item" type="button"
                              className="ml-2 text-destructive"
                              disabled={isPlacingOrder}
                            > <Trash2 className="h-5 w-5" /> </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Price Summary & Pay Button */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Price Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Delivery Fee
                        {distanceInMeters !== null && (
                          <span className="ml-1 text-xs">({distanceInKm.toFixed(1)} km)</span>
                        )}
                      </span>
                      <span>
                        ₹{deliveryFee.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit" // <-- YEH CHANGE HUA
                      className="w-full"
                      disabled={items.length === 0 || isPlacingOrder || !isDeliverable || !userLocation}
                      data-testid="button-place-order"
                    >
                      {isPlacingOrder ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : !isDeliverable ? (
                        "Not Deliverable"
                      ) : !userLocation ? (
                        "Detect Location to Pay"
                      ) : (
                        `Pay Securely (₹${total.toFixed(2)})`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
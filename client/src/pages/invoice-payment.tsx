import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

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

type Invoice = {
  id: string;
  bookingId: string;
  serviceCharge: number;
  spareParts: Array<{ part: string; cost: number }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
};

export default function InvoicePayment() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/pay/invoice/:id");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const invoiceId = params?.id || "";

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}`);
      return response.json();
    },
    enabled: !!invoiceId && isAuthenticated,
  });

  const createPaymentOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/create-payment-order`);
      return response.json();
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      const response = await apiRequest("POST", "/api/invoices/verify-payment", {
        invoice_id: invoiceId,
        ...paymentData,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful!",
        description: "Your payment has been verified. Thank you!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      setLocation("/my-bookings");
    },
    onError: (error: any) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Please contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({
        title: "Error",
        description: "Payment gateway failed to load. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    if (!user || !invoice) {
      toast({
        title: "Error",
        description: "Unable to process payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    try {
      const rzpOrder = await createPaymentOrderMutation.mutateAsync();

      const options = {
        key: rzpOrder.razorpayKeyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Shirur Express", // Updated name
        description: `Invoice Payment - ${invoiceId.slice(-8)}`,
        order_id: rzpOrder.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
          } catch (error) {
            console.error("Payment verification error:", error);
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
          contact: user.phone || "",
        },
        notes: {
          invoiceId: invoiceId,
          userId: user.id,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment.",
              variant: "destructive"
            });
            setIsProcessing(false);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error("Payment initiation error:", error); // Added logging
      toast({
        title: "Payment Failed",
        description: error.message || "Could not initiate payment. Please try again.", // Improved error message
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to view and pay this invoice</p>
          <Button onClick={() => setLocation("/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground mb-4">This invoice does not exist or you don't have permission to view it</p>
          <Button onClick={() => setLocation("/my-bookings")}>Back to My Bookings</Button>
        </div>
      </div>
    );
  }

  if (invoice.paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Already Paid</h2>
              <p className="text-muted-foreground mb-4">This invoice has already been paid</p>
              <Button onClick={() => setLocation("/my-bookings")}>Back to My Bookings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const spareParts = invoice.spareParts || [];

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/my-bookings")}
          data-testid="button-back"
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Bookings</span>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Invoice Payment</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invoice ID</span>
              <span className="font-mono text-sm">...{invoiceId.slice(-8)}</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span>Service Charge</span>
              <span className="font-semibold">₹{Number(invoice.serviceCharge).toFixed(2)}</span>
            </div>

            {spareParts.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Spare Parts Used</h4>
                  <div className="space-y-2">
                    {spareParts.map((part, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">• {part.part}</span>
                        <span>₹{part.cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-primary">₹{Number(invoice.totalAmount).toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={invoice.paymentStatus === "pending" ? "destructive" : "default"}>
                {invoice.paymentStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You will be redirected to Razorpay's secure payment gateway to complete your payment.
              </p>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                data-testid="button-pay-securely"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-5 w-5" />
                    Pay Securely - ₹{Number(invoice.totalAmount).toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
  Loader2,
  CheckCircle,
  AlertCircle,
  QrCode,
  Clock
} from "lucide-react";

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
  const [showQr, setShowQr] = useState(false);

  const invoiceId = params?.id || "";

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}`);
      return response.json();
    },
    enabled: !!invoiceId && isAuthenticated,
  });

  // Pay Online (QR scanned) mutation
  const payOnlineMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/pay-online`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Submitted!",
        description: "Your payment is being verified. Admin will confirm shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Could not process payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const payCodMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/pay-cod`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process COD payment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "You have chosen to pay with cash. The service is now complete.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      setLocation("/my-bookings");
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Could not process COD payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleCodPayment = async () => {
    if (confirm("Are you sure you want to pay with cash? The technician will collect it.")) {
      setIsProcessing(true);
      await payCodMutation.mutateAsync();
    }
  };

  const handlePayOnline = async () => {
    if (confirm("Have you completed the payment via UPI? Click OK to confirm.")) {
      setIsProcessing(true);
      await payOnlineMutation.mutateAsync();
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

  // Already paid
  if (invoice.paymentStatus === "completed") {
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

  // Awaiting admin confirmation
  if (invoice.paymentStatus === "awaiting_confirmation") {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2">Payment Verification Pending</h2>
              <p className="text-muted-foreground mb-2">
                You have submitted your payment of <span className="font-bold text-primary">₹{Number(invoice.totalAmount).toFixed(2)}</span>
              </p>
              <p className="text-muted-foreground mb-4">
                Admin will verify and confirm your payment shortly.
              </p>
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

              {/* QR Code Section */}
              {showQr ? (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-primary/30">
                  <p className="text-center text-sm font-semibold mb-3">
                    📱 Scan QR Code to Pay ₹{Number(invoice.totalAmount).toFixed(2)}
                  </p>
                  <div className="flex justify-center mb-3">
                    <img
                      src="/images/payment-qr.jpeg"
                      alt="Payment QR Code"
                      className="w-56 h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground mb-4">
                    Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.) and complete the payment. Then tap "I Have Paid" below.
                  </p>
                  <Button
                    onClick={handlePayOnline}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                    data-testid="button-i-have-paid"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        I Have Paid ✅
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-sm text-muted-foreground"
                    onClick={() => setShowQr(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred payment method below.
                  </p>
                  <Button
                    onClick={() => setShowQr(true)}
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
                        <QrCode className="mr-2 h-5 w-5" />
                        Pay Online (Scan QR) - ₹{Number(invoice.totalAmount).toFixed(2)}
                      </>
                    )}
                  </Button>
                  <div className="relative my-4 flex items-center py-2">
                     <div className="flex-grow border-t border-muted"></div>
                     <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">OR</span>
                     <div className="flex-grow border-t border-muted"></div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCodPayment}
                    disabled={isProcessing}
                    className="w-full text-lg py-6 border-2"
                    data-testid="button-pay-cash"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="mr-2 text-xl">💵</span>
                        Pay Offline (Cash)
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

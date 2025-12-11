// client/src/pages/provider-dashboard.tsx
// (POORA REBUILT CODE - BLUEPRINT KE HISAB SE)

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  ServiceProvider,
  ServiceCategory,
  ServiceProblem,
  Booking,
  Invoice,
  User,
  ServiceTemplate, // NAYA
  ServiceOffering, // NAYA
  RestaurantOrder, // NAYA
  RentalProperty, // NAYA
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Play,
  ClipboardCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  Home,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import MenuItemForm from "@/components/forms/MenuItemForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link, Redirect } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

// --- TYPES ---

// Provider profile API se jaisa aayega
type ProviderProfileWithCategory = ServiceProvider & {
  category: ServiceCategory;
  profileImageUrl?: string | null;
  galleryImages?: string[] | null;
  beautyServices?: ServiceOffering[]; // NAYA: Include beautyServices
};

// Booking API se jaisi aayegi (user aur invoice ke saath)
type FullBooking = Booking & {
  user: Pick<User, "id" | "username" | "phone">;
  invoice: Invoice | null;
};

// Bill/Invoice create karne ka Zod schema
const billFormSchema = z.object({
  serviceCharge: z.preprocess(
    (val) => (val === "" ? 0 : parseFloat(z.string().parse(val))),
    z.number().min(0, "Service charge is required")
  ),
  spareParts: z.array(
    z.object({
      part: z.string().min(1, "Part name is required"),
      cost: z.preprocess(
        (val) => (val === "" ? 0 : parseFloat(z.string().parse(val))),
        z.number().min(0, "Price must be positive")
      ),
    })
  ).optional(),
  // notes: z.string().optional(), // Notes abhi form mein nahi hain, baad mein add kar sakte hain
});

type BillFormData = z.infer<typeof billFormSchema>;

// --- COMPONENT 1: MENU MANAGER (Yeh waise ka waisa hai) ---
const MenuItemsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const providerCategorySlug = providerProfile.category?.slug;

  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    refetch: refetchMenuItems,
  } = useQuery<any[]>({
    queryKey: ["providerMenuItems", providerCategorySlug],
    queryFn: async () => {
      if (!providerCategorySlug) return [];
      const res = await api.get(
        `/provider/menu-items/${providerCategorySlug}`
      );
      return res.data;
    },
    enabled: !!providerCategorySlug,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const deleteMenuItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/provider/menu-items/${providerCategorySlug}/${itemId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Menu item deleted." });
      queryClient.invalidateQueries({
        queryKey: ["providerMenuItems", providerCategorySlug],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMenuItemMutation.mutate(itemId);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    refetchMenuItems();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Menu Items</CardTitle>
          <CardDescription>
            Manage the items for your '
            {providerProfile.category ? providerProfile.category.name : "service"}
            ' service.
          </CardDescription>
        </div>
        <Dialog
          open={isFormOpen}
          onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details for your service or product.
              </DialogDescription>
            </DialogHeader>
            <MenuItemForm
              providerId={providerProfile.id}
              categorySlug={providerCategorySlug}
              initialData={editingItem}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoadingMenuItems ? (
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading menu...
          </div>
        ) : !Array.isArray(menuItems) || menuItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">Your Menu is Empty</h3>
            <p className="text-muted-foreground mt-2">
              Click "Add New Item" to start building your menu.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="outline">{item.category}</Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={
                        deleteMenuItemMutation.isPending &&
                        deleteMenuItemMutation.variables === item.id
                      }
                    >
                      {deleteMenuItemMutation.isPending &&
                        deleteMenuItemMutation.variables === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// --- COMPONENT 2: BOOKING MANAGER (POORA NAYA BANA HAI) ---
const BookingsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Bookings Fetch karne ka logic
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<
    FullBooking[]
  >({
    queryKey: ["providerBookings"],
    queryFn: async () => {
      const res = await api.get("/provider/my-bookings");
      return res.data;
    },
    // Har 30 second mein refresh karo (urgent bookings ke liye)
    refetchInterval: 30000,
  });

  // Grocery Orders Fetch karne ka logic
  const { data: groceryOrders, isLoading: isLoadingOrders } = useQuery<GroceryOrder[]>({
    queryKey: ["providerGroceryOrders"],
    queryFn: async () => {
      const res = await api.get("/provider/grocery-orders");
      return res.data;
    },
  });

  // Action mutations (Accept / Decline)
  const updateBookingStatusMutation = useMutation({
    mutationFn: ({
      bookingId,
      action,
    }: {
      bookingId: string;
      action: "accept" | "decline" | "start-job";
    }) => api.patch(`/bookings/${bookingId}/${action}`),
    onSuccess: (data) => {
      toast({
        title: `Booking ${data.data.status}`,
        description: `Booking ID ${data.data.id} has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update booking.",
        variant: "destructive",
      });
    },
  });

  const getBadgeColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending": return "default"; // Blue
      case "accepted": return "secondary"; // Gray
      case "in_progress": return "secondary"; // Gray
      case "awaiting_otp": return "secondary"; // Gray
      case "awaiting_billing": return "secondary"; // Gray
      case "pending_payment": return "secondary"; // Gray
      case "completed": return "default"; // Green (custom style se)
      case "declined":
      case "cancelled": return "destructive"; // Red
      default: return "outline";
    }
  };

  const filterBookings = (statusList: string[]) => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter(b => statusList.includes(b.status || 'pending'));
  }

  const newBookings = filterBookings(['pending']);
  const activeBookings = filterBookings(['accepted', 'in_progress', 'awaiting_otp', 'awaiting_billing', 'pending_payment']);
  const completedBookings = filterBookings(['completed', 'declined', 'cancelled']);

  // Determine default tab based on category
  const defaultTab = (providerProfile.category?.slug === 'cake-shop' || providerProfile.category?.slug === 'grocery')
    ? "orders"
    : "new";

  if (isLoadingBookings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>
            View and manage your upcoming bookings for '
            {providerProfile.category ? providerProfile.category.name : 'your service'}
            '.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading
            bookings...
          </div>
        </CardContent>
      </Card>
    );
  }

  // BUG FIX: Ab !Array.isArray check kar rahe hain
  if (!Array.isArray(bookings)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-destructive">Error Loading Bookings</h3>
            <p className="text-muted-foreground mt-2">
              Could not fetch bookings. Please try refreshing.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="new">
          New ({newBookings.length})
        </TabsTrigger>
        <TabsTrigger value="active">
          Active ({activeBookings.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completedBookings.length})
        </TabsTrigger>
        <TabsTrigger value="orders">
          Orders ({groceryOrders?.length || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="mt-6">
        <BookingList
          bookings={newBookings}
          emptyMessage="You have no new booking requests."
          mutations={{ updateBookingStatusMutation }}
        />
      </TabsContent>

      <TabsContent value="active" className="mt-6">
        <BookingList
          bookings={activeBookings}
          emptyMessage="You have no active jobs."
          mutations={{ updateBookingStatusMutation }}
        />
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <BookingList
          bookings={completedBookings}
          emptyMessage="You have no completed or declined jobs."
          mutations={{ updateBookingStatusMutation }}
        />
      </TabsContent>

      <TabsContent value="orders" className="mt-6">
        {!Array.isArray(groceryOrders) || groceryOrders.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Orders Yet</h3>
            <p className="text-muted-foreground mt-2">
              You haven't received any grocery/cake orders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groceryOrders.map((order) => (
              <Card key={order.id} className="shadow-md border-l-4 border-green-500">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Order #{order.id.slice(0, 8)}</span>
                    <Badge className="bg-green-600">
                      {order.status?.toUpperCase() || "CONFIRMED"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Placed on {new Date(order.createdAt || new Date()).toLocaleString("en-IN")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium mb-2 text-sm">Items:</h4>
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                      <span>Total</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

// Helper function for badge colors
const getBadgeColor = (status: string) => {
  switch (status) {
    case "pending":
      return "secondary";
    case "accepted":
    case "in_progress":
      return "default";
    case "awaiting_otp":
    case "awaiting_billing":
      return "outline";
    case "pending_payment":
      return "outline";
    case "declined":
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

// --- NAYA HELPER COMPONENT: BOOKING LIST ---
const BookingList: React.FC<{
  bookings: FullBooking[];
  emptyMessage: string;
  mutations: {
    updateBookingStatusMutation: any;
  }
}> = ({ bookings, emptyMessage, mutations }) => {

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">{emptyMessage}</h3>
        <p className="text-muted-foreground mt-2">
          This tab will update automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="shadow-md">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Booking ID: ...{booking.id.slice(-6)}</span>
              <Badge
                variant={booking.status === 'completed' ? 'default' : getBadgeColor(booking.status || 'pending')}
                className={booking.status === 'completed' ? 'bg-green-600' : ''}
              >
                {booking.status?.replace("_", " ").toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              Customer: {booking.user.username} | Phone:{" "}
              {booking.user.phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p>
              <strong>Address:</strong> {booking.userAddress}
            </p>
            <p>
              <strong>Scheduled:</strong>{" "}
              {booking.scheduledAt
                ? new Date(booking.scheduledAt).toLocaleString("en-IN")
                : "ASAP"}
            </p>
            {booking.isUrgent && <Badge variant="destructive">URGENT</Badge>}
            {booking.notes && (
              <p className="pt-2">
                <strong>Notes:</strong> {booking.notes}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <ProviderBookingActions
              booking={booking}
              mutations={mutations}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

// --- NAYA HELPER COMPONENT: BOOKING ACTIONS (SAARA LOGIC YAHAN HAI) ---
const ProviderBookingActions: React.FC<{
  booking: FullBooking;
  mutations: { updateBookingStatusMutation: any; };
}> = ({ booking, mutations }) => {
  const { updateBookingStatusMutation } = mutations;
  const [otp, setOtp] = useState("");
  const [isBillOpen, setIsBillOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Saare mutations (API calls) ---
  const generateOtpMutation = useMutation({
    mutationFn: (bookingId: string) =>
      api.post(`/bookings/${bookingId}/generate-otp`),
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "OTP has been sent to the customer's phone.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "OTP Error",
        description: error.response?.data?.message || "Failed to send OTP.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { bookingId: string, otp: string }) =>
      api.post(`/bookings/${data.bookingId}/verify-otp`, { otp: data.otp }),
    onSuccess: () => {
      toast({
        title: "OTP Verified!",
        description: "Please create the final bill for the customer.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
      setIsBillOpen(true); // OTP Sahi hone par bill modal kholo
    },
    onError: (error: any) => {
      toast({
        title: "Invalid OTP",
        description: error.response?.data?.message || "That OTP is incorrect.",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: BillFormData) =>
      api.post(`/bookings/${booking.id}/create-invoice`, data),
    onSuccess: () => {
      toast({
        title: "Bill Created!",
        description: "Waiting for customer to complete payment.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
      setIsBillOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Billing Error",
        description:
          error.response?.data?.message || "Failed to create bill.",
        variant: "destructive",
      });
    },
  });
  // --- Mutations khatam ---

  // --- Action Handlers ---
  const handleAccept = () => {
    updateBookingStatusMutation.mutate({ bookingId: booking.id, action: "accept" });
  };
  const handleDecline = () => {
    updateBookingStatusMutation.mutate({ bookingId: booking.id, action: "decline" });
  };
  const handleStartJob = () => {
    updateBookingStatusMutation.mutate({ bookingId: booking.id, action: "start-job" });
  };
  const handleJobDone = () => {
    generateOtpMutation.mutate(booking.id);
  };
  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      verifyOtpMutation.mutate({ bookingId: booking.id, otp });
    }
  };
  const handleBillSubmit = (data: BillFormData) => {
    createInvoiceMutation.mutate(data);
  };
  // --- Handlers khatam ---


  // --- Logic ke hisaab se button dikhao ---
  if (booking.status === "pending") {
    return (
      <>
        <Button
          variant="destructive"
          onClick={handleDecline}
          disabled={updateBookingStatusMutation.isPending}
        >
          <X className="mr-2 h-4 w-4" /> Decline
        </Button>
        <Button
          onClick={handleAccept}
          className="bg-green-600 hover:bg-green-700"
          disabled={updateBookingStatusMutation.isPending}
        >
          <Check className="mr-2 h-4 w-4" /> Accept
        </Button>
      </>
    );
  }

  if (booking.status === "accepted") {
    return (
      <Button
        onClick={handleStartJob}
        className="bg-blue-600 hover:bg-blue-700"
        disabled={updateBookingStatusMutation.isPending}
      >
        <Play className="mr-2 h-4 w-4" /> Start Job
      </Button>
    );
  }

  if (booking.status === "in_progress") {
    return (
      <Button
        onClick={handleJobDone}
        className="bg-green-600 hover:bg-green-700"
        disabled={generateOtpMutation.isPending}
      >
        {generateOtpMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
        Job Done (Get OTP)
      </Button>
    );
  }

  if (booking.status === "awaiting_otp") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <ClipboardCheck className="mr-2 h-4 w-4" /> Verify OTP
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Service OTP</DialogTitle>
            <DialogDescription>
              Please ask the customer ({booking.user.username}) for the 6-digit
              OTP sent to their phone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify
            </Button>
          </DialogFooter>
          <div className="flex justify-center pb-4">
            <Button
              variant="link"
              size="sm"
              onClick={() => generateOtpMutation.mutate(booking.id)}
              disabled={generateOtpMutation.isPending}
              className="text-muted-foreground"
            >
              {generateOtpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Sending...
                </>
              ) : (
                "Resend OTP"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (booking.status === "awaiting_billing") {
    return (
      <>
        <Button
          onClick={() => setIsBillOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <FileText className="mr-2 h-4 w-4" /> Create Final Bill
        </Button>
        <CreateBillDialog
          isOpen={isBillOpen}
          onOpenChange={setIsBillOpen}
          onSubmit={handleBillSubmit}
          isLoading={createInvoiceMutation.isPending}
        />
      </>
    );
  }

  if (booking.status === "pending_payment") {
    return (
      <Badge variant="secondary" className="p-2 text-base">
        <DollarSign className="mr-2 h-4 w-4" />
        Waiting for Customer Payment
      </Badge>
    )
  }

  if (booking.status === "completed") {
    // TODO: "View Invoice" ka button bana sakte hain
    return null;
  }

  if (booking.status === "declined" || booking.status === "cancelled") {
    return null; // Koi action nahi
  }

  return null; // Fallback
};

// --- NAYA HELPER COMPONENT: CREATE BILL DIALOG (with form) ---
const CreateBillDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BillFormData) => void;
  isLoading: boolean;
}> = ({ isOpen, onOpenChange, onSubmit, isLoading }) => {
  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      spareParts: [],
      serviceCharge: undefined, // 0 ki jagah undefined
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "spareParts"
  });

  const watchSpareParts = form.watch("spareParts");
  const watchServiceCharge = form.watch("serviceCharge");

  const total =
    (watchSpareParts?.reduce((acc, part) => acc + (Number(part.cost) || 0), 0) || 0) +
    (Number(watchServiceCharge) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Final Bill</DialogTitle>
          <DialogDescription>
            Enter service charges and any spare parts used for this job.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-h-[60vh] overflow-y-auto p-1"
          >
            <FormField
              control={form.control}
              name="serviceCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Charge (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 350" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Spare Parts Used (Optional)</Label>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`spareParts.${index}.part`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Part Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`spareParts.${index}.cost`}
                      render={({ field }) => (
                        <FormItem className="w-[120px]">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Price (₹)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ part: "", cost: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Part
              </Button>
            </div>

            <div className="text-xl font-bold text-right pt-4">
              Total Bill: ₹{total.toFixed(2)}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Bill & Request Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT 3: SPECIALIZATIONS MANAGER (Waise ka waisa) ---
const SpecializationsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    () => providerProfile.specializations || []
  );

  const { data: allProblems, isLoading: isLoadingProblems } = useQuery<
    ServiceProblem[]
  >({
    queryKey: ["serviceProblems", providerProfile.category.slug],
    queryFn: async () => {
      const res = await api.get(
        `/service-problems?category=${providerProfile.category.slug}`
      );
      return res.data;
    },
    enabled: !!providerProfile.category.slug,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (specializations: string[]) =>
      api.patch("/provider/profile", { specializations }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your specializations have been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["providerProfile", providerProfile.userId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update.",
        variant: "destructive",
      });
    },
  });

  const handleCheckedChange = (
    checked: boolean | "indeterminate",
    specName: string
  ) => {
    setSelectedSpecs((prev) =>
      checked ? [...prev, specName] : prev.filter((s) => s !== specName)
    );
  };

  const handleSave = () => {
    updateProfileMutation.mutate(selectedSpecs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Specializations</CardTitle>
        <CardDescription>
          Select the devices and services you are an expert in. This will be
          shown to customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingProblems ? (
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading options...
          </div>
        ) : !allProblems || allProblems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Service Problems Found</h3>
            <p className="text-muted-foreground mt-2">
              (Admin needs to add problems for '{providerProfile.category.name}'
              category)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center space-x-2 p-3 border rounded-md"
                >
                  <Checkbox
                    id={problem.id}
                    checked={selectedSpecs.includes(problem.name)}
                    onCheckedChange={(checked) =>
                      handleCheckedChange(checked, problem.name)
                    }
                  />
                  <Label
                    htmlFor={problem.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {problem.name}
                  </Label>
                </div>
              ))}
            </div>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Specializations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- COMPONENT 4: BEAUTY SERVICE SELECTOR (NAYA COMPONENT) ---
const BeautyServiceSelector: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const categorySlug = providerProfile.category.slug;

  // 1. Fetch Master Templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery<ServiceTemplate[]>({
    queryKey: ["serviceTemplates", categorySlug],
    queryFn: async () => {
      const res = await api.get(`/service-templates/${categorySlug}`);
      return res.data;
    },
  });

  // 2. Use Existing Services from Profile (No extra fetch needed)
  const existingServices = providerProfile.beautyServices || [];

  // State for form
  const [selectedServices, setSelectedServices] = useState<Record<string, { price: number; enabled: boolean }>>({});

  // Initialize state when data loads
  React.useEffect(() => {
    if (templates) {
      const initial: Record<string, { price: number; enabled: boolean }> = {};

      // Initialize all templates as disabled first
      templates.forEach(t => {
        initial[t.name] = { price: Number(t.defaultPrice), enabled: false };
      });

      // Override with existing services (match by templateId)
      if (existingServices.length > 0) {
        existingServices.forEach(s => {
          const template = templates.find(t => t.id === s.templateId);
          if (template && s.isActive) {
            initial[template.name] = { price: Number(s.price), enabled: true };
          }
        });
      }

      setSelectedServices(initial);
    }
  }, [templates, existingServices]);

  const handleToggle = (name: string, checked: boolean, defaultPrice: number) => {
    setSelectedServices(prev => {
      const existing = prev[name];
      // Agar pehle se state mein hai, toh wahi price use karo, warna defaultPrice
      const priceToUse = existing ? existing.price : defaultPrice;

      return {
        ...prev,
        [name]: { price: priceToUse, enabled: checked }
      };
    });
  };

  const handlePriceChange = (name: string, price: string) => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
      setSelectedServices(prev => ({
        ...prev,
        [name]: { ...prev[name], price: numPrice }
      }));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Convert state to array for API
      const servicesToSave = Object.entries(selectedServices)
        .filter(([_, val]) => val.enabled)
        .map(([name, val]) => {
          const template = templates?.find(t => t.name === name);
          return {
            templateId: template?.id, // Send templateId
            price: String(val.price),
            isActive: true, // Explicitly set active
          };
        });

      return api.post("/provider/beauty-services/bulk", { services: servicesToSave });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Services updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["providerProfile", providerProfile.userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update services.",
        variant: "destructive"
      });
    }
  });

  if (isLoadingTemplates) {
    return <div><Loader2 className="animate-spin" /> Loading services...</div>;
  }

  // Group templates by subCategory
  const groupedTemplates = templates?.reduce((acc, template) => {
    const sub = template.subCategory || "Other";
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(template);
    return acc;
  }, {} as Record<string, ServiceTemplate[]>) || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Services</CardTitle>
        <CardDescription>Select the services you offer and set your prices.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([subCategory, items]) => (
            <div key={subCategory}>
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">{subCategory}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => {
                  const state = selectedServices[item.name] || { price: Number(item.defaultPrice), enabled: false };
                  return (
                    <div key={item.id} className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors ${state.enabled ? 'bg-accent/10 border-accent' : 'bg-card'}`}>
                      <Checkbox
                        id={`srv-${item.id}`}
                        checked={state.enabled}
                        onCheckedChange={(checked) => handleToggle(item.name, checked as boolean, Number(item.defaultPrice))}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`srv-${item.id}`} className="font-medium cursor-pointer">
                          {item.name}
                        </Label>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={state.price}
                          onChange={(e) => handlePriceChange(item.name, e.target.value)}
                          disabled={!state.enabled}
                          className="h-8"
                          placeholder="Price"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full md:w-auto">
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

// --- COMPONENT 5: RESTAURANT ORDERS MANAGER (NEW) ---
const RestaurantOrdersManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Live Orders (Polling every 10 seconds)
  const { data: orders, isLoading } = useQuery<RestaurantOrder[]>({
    queryKey: ["restaurantOrders", providerProfile.id],
    queryFn: async () => {
      const res = await api.get("/restaurant/orders/live");
      return res.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/restaurant/orders/${orderId}/status`, { status }),
    onSuccess: (data) => {
      toast({
        title: "Order Updated",
        description: `Order status changed to ${data.data.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading live orders...
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">No Active Orders</h3>
        <p className="text-muted-foreground mt-2">
          New orders will appear here automatically.
        </p>
      </div>
    );
  }

  // Filter orders by status
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter((o) => ["accepted", "preparing", "ready_for_pickup"].includes(o.status || ""));
  const pastOrders = orders.filter((o) => ["picked_up", "delivered", "declined", "cancelled"].includes(o.status || ""));

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending" className="relative">
          Pending
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2 absolute -top-2 -right-2 px-1.5 py-0.5 text-xs rounded-full">
              {pendingOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-6 space-y-4">
        {pendingOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No pending orders.</p>
        ) : (
          pendingOrders.map((order) => (
            <RestaurantOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isPending={true}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="active" className="mt-6 space-y-4">
        {activeOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active orders.</p>
        ) : (
          activeOrders.map((order) => (
            <RestaurantOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-6 space-y-4">
        {pastOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No order history.</p>
        ) : (
          pastOrders.map((order) => (
            <RestaurantOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isHistory={true}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

const RestaurantOrderCard: React.FC<{
  order: RestaurantOrder & { user?: any; rider?: any };
  onStatusChange: (id: string, status: string) => void;
  isPending?: boolean;
  isHistory?: boolean;
}> = ({ order, onStatusChange, isPending, isHistory }) => {
  return (
    <Card className={`shadow-md ${isPending ? "border-l-4 border-orange-500 animate-in fade-in slide-in-from-bottom-2" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              {new Date(order.createdAt || new Date()).toLocaleTimeString()} - {order.user?.username || "Guest"}
            </CardDescription>
          </div>
          <Badge variant={isPending ? "destructive" : "outline"}>
            {order.status?.toUpperCase().replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted/50 p-3 rounded-md mb-3">
          {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm mb-1">
              <span>{item.quantity} x {item.name}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
        <div className="text-sm space-y-1">
          <p><strong>Address:</strong> {order.deliveryAddress}</p>
          {order.rider && (
            <p className="text-blue-600"><strong>Rider:</strong> {order.rider.username} ({order.rider.phone})</p>
          )}
        </div>
      </CardContent>
      {!isHistory && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          {isPending ? (
            <>
              <Button variant="destructive" size="sm" onClick={() => onStatusChange(order.id, "declined")}>
                Decline
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => onStatusChange(order.id, "accepted")}>
                Accept Order
              </Button>
            </>
          ) : (
            <>
              {order.status === "accepted" && (
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => onStatusChange(order.id, "preparing")}>
                  Start Preparing
                </Button>
              )}
              {order.status === "preparing" && (
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm" onClick={() => onStatusChange(order.id, "ready_for_pickup")}>
                  Ready for Pickup
                </Button>
              )}
              {order.status === "ready_for_pickup" && (
                <span className="text-sm text-muted-foreground italic">Waiting for rider...</span>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

// --- COMPONENT 6: RENTAL MANAGER (NEW) ---
const RentalManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery<RentalProperty[]>({
    queryKey: ["providerProperties", providerProfile.userId],
    queryFn: async () => {
      const res = await api.get("/provider/rental-properties");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rental-properties/${id}`),
    onSuccess: () => {
      toast({ title: "Property Deleted", description: "Listing removed successfully." });
      queryClient.invalidateQueries({ queryKey: ["providerProperties"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/rental-properties/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Property status changed." });
      queryClient.invalidateQueries({ queryKey: ["providerProperties"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div><Loader2 className="animate-spin" /> Loading properties...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Rental Listings</CardTitle>
          <CardDescription>Manage your property listings.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/list-property">
            <PlusCircle className="mr-2 h-4 w-4" /> List New Property
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!properties || properties.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Properties Listed</h3>
            <p className="text-muted-foreground mt-2">List your first property to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map(property => (
              <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {property.images && property.images[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center"><Home className="h-6 w-6 opacity-20" /></div>
                  )}
                  <div>
                    <h4 className="font-semibold">{property.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      ₹{property.rent}/mo • {property.locality}
                    </div>
                    <Badge variant={property.status === 'available' ? 'default' : 'secondary'} className="mt-1">
                      {property.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/properties/${property.id}`}>View</Link>
                  </Button>
                  {property.status === 'available' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: property.id, status: 'rented' })}
                      disabled={toggleStatusMutation.isPending}
                    >
                      Mark Rented
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: property.id, status: 'available' })}
                      disabled={toggleStatusMutation.isPending}
                    >
                      Mark Available
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this listing?')) deleteMutation.mutate(property.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- COMPONENT 4: PROFILE SETTINGS (Waise ka waisa) ---
const ProfileSettingsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
  userId: string;
}> = ({ providerProfile, userId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);

  // Profile Pic Upload Mutation
  const profilePicMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return api.patch("/provider/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile picture updated." });
      queryClient.invalidateQueries({ queryKey: ["providerProfile", userId] });
      setProfileFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload.",
        variant: "destructive",
      });
    },
  });

  // Gallery Images Upload Mutation
  const galleryUploadMutation = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
      return api.post("/provider/profile/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Gallery images uploaded." });
      queryClient.invalidateQueries({ queryKey: ["providerProfile", userId] });
      setGalleryFiles(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload.",
        variant: "destructive",
      });
    },
  });

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfileFile(e.target.files[0]);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGalleryFiles(e.target.files);
    }
  };

  const handleProfileUpload = () => {
    if (profileFile) {
      profilePicMutation.mutate(profileFile);
    }
  };

  const handleGalleryUpload = () => {
    if (galleryFiles) {
      galleryUploadMutation.mutate(galleryFiles);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a clear photo of yourself or your logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-muted mx-auto flex items-center justify-center">
            {providerProfile.profileImageUrl ? (
              <img
                src={providerProfile.profileImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleProfileFileChange}
            disabled={profilePicMutation.isPending}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleProfileUpload}
            disabled={!profileFile || profilePicMutation.isPending}
          >
            {profilePicMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Picture
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
          <CardDescription>
            Showcase your work (e.g., past projects, food items).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 min-h-[80px]">
            {providerProfile.galleryImages?.map((url, index) => (
              <div
                key={index}
                className="relative aspect-square bg-muted rounded-md overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Gallery item ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryFileChange}
            disabled={galleryUploadMutation.isPending}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGalleryUpload}
            disabled={!galleryFiles || galleryUploadMutation.isPending}
          >
            {galleryUploadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Gallery
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// --- Category Lists ---
const menuBasedCategories = [
  "beauty",
  "cake-shop",
  "street-food",
  "grocery",
];
const bookingBasedCategories = ["electrician", "plumber"];
const restaurantCategory = "restaurants";

// --- MAIN DASHBOARD COMPONENT (Ab yeh smart hai) ---
const ProviderDashboard: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const {
    data: providerProfile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useQuery<ProviderProfileWithCategory>({
    queryKey: ["providerProfile", user?.id],
    queryFn: async () => {
      const res = await api.get("/provider/profile");
      return res.data;
    },
    enabled: !!user?.id,
    retry: false,
  });

  // --- LOADING/ERROR STATES ---
  if (isAuthLoading || (!!user && isLoadingProfile)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading your
        profile...
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== "provider") {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground mt-4">Access Denied</h2>
        <p className="mt-2">You must be a provider to view this page.</p>
        <Button asChild className="mt-4">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  if (isErrorProfile || !providerProfile) {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground mt-4">
          Provider Profile Not Found
        </h2>
        <p className="mt-2">
          It seems you haven't completed your provider onboarding yet.
        </p>
        <Button asChild className="mt-4">
          <Link to="/provider-onboarding">Complete Your Profile</Link>
        </Button>
      </div>
    );
  }
  // --- LOADING/ERROR STATES KHATAM ---

  const providerType = () => {
    if (!providerProfile || !providerProfile.category) {
      return 'unknown';
    }
    const slug = providerProfile.category.slug;
    if (menuBasedCategories.includes(slug)) return "menu";
    if (bookingBasedCategories.includes(slug)) return "booking";
    if (slug === restaurantCategory) return "restaurant";
    if (slug === "rental") return "rental"; // NAYA
    return "unknown";
  };

  const type = providerType();

  const getTabs = () => {
    // Basic tabs
    const tabs = [
      { value: "profile", label: "Profile Settings" },
    ];

    // Kaam ke hisaab se tabs add karo
    if (type === "menu") {
      tabs.unshift({ value: "menu", label: "Menu / Services" });
      tabs.unshift({ value: "bookings", label: "Bookings" }); // Menu waalon ko bhi booking aa sakti hai
    }
    // Beauty Parlor Logic
    if (type === "menu" && providerProfile.category.slug === "beauty") {
      // Replace "menu" with "services" for beauty
      const menuIndex = tabs.findIndex(t => t.value === "menu");
      if (menuIndex !== -1) {
        tabs[menuIndex] = { value: "beauty-services", label: "My Services" };
      }
    }

    if (type === "booking") {
      tabs.push({ value: "specializations", label: "My Specializations" });
      tabs.unshift({ value: "bookings", label: "Bookings" });
    }

    if (type === "restaurant") {
      tabs.unshift({ value: "menu", label: "Menu Management" });
      tabs.unshift({ value: "live-orders", label: "Live Orders" });
    }

    if (type === "rental") {
      tabs.unshift({ value: "rental-listings", label: "My Properties" });
    }

    return tabs;
  };

  const tabs = getTabs();
  const defaultTab = type === "restaurant" ? "live-orders" : (type === "rental" ? "rental-listings" : "bookings"); // Sabse important tab

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {providerProfile.businessName}!
      </h1>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          <BookingsManager providerProfile={providerProfile} />
        </TabsContent>

        <TabsContent value="menu" className="mt-6">
          {type === "menu" || type === "restaurant" ? (
            <MenuItemsManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="live-orders" className="mt-6">
          {type === "restaurant" ? (
            <RestaurantOrdersManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="beauty-services" className="mt-6">
          <BeautyServiceSelector providerProfile={providerProfile} />
        </TabsContent>

        <TabsContent value="rental-listings" className="mt-6">
          <RentalManager providerProfile={providerProfile} />
        </TabsContent>



        <TabsContent value="specializations" className="mt-6">
          {type === "booking" ? (
            <SpecializationsManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettingsManager
            providerProfile={providerProfile}
            userId={user!.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderDashboard;
// client/src/components/booking-slot-form.tsx (FIXED)

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

const bookingSchema = z.object({
  userPhone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[\d\s()-]+$/, "Please enter a valid phone number with country code (e.g., +1234567890)"),
  userAddress: z.string().min(5, "Address is required"),
  scheduledDate: z.date({
    required_error: "Please select a date",
  }),
  preferredTimeSlot: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingSlotFormProps {
  providerId: string;
  problemId: string;
  problemName: string;
  onSuccess?: () => void;
}

export default function BookingSlotForm({
  providerId,
  problemId,
  problemName,
  onSuccess,
}: BookingSlotFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isLocating, setIsLocating] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      userPhone: user?.phone || "",
      userAddress: "",
      notes: "",
    },
  });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Attempt reverse geocoding with OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            form.setValue("userAddress", data.display_name);
            toast({ title: "Location Detected", description: "Address updated successfully." });
          } else {
            form.setValue("userAddress", `Lat: ${latitude}, Long: ${longitude}`);
            toast({ title: "Location Detected", description: "Could not fetch address name, using coordinates." });
          }
        } catch (error) {
          form.setValue("userAddress", `Lat: ${latitude}, Long: ${longitude}`);
          toast({ title: "Location Detected", description: "Using coordinates (Address fetch failed)." });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error("Geolocation error:", error);
        toast({
          title: "Location Access Denied",
          description: "Please enter your address manually in the box below.",
          variant: "destructive",
        });
      }
    );
  };

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {

      const date = data.scheduledDate;
      const timeSlot = data.preferredTimeSlot;
      const [time, modifier] = timeSlot.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (modifier === 'PM' && hours !== 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }

      const combinedDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes
      );

      const scheduledAtISO = combinedDateTime.toISOString();

      const bookingData = {
        userId: user?.id || "",
        providerId, // <-- Yeh jaa raha hai, bilkul sahi
        serviceType: "electrician",
        problemId,
        scheduledAt: scheduledAtISO,
        preferredTimeSlots: [data.preferredTimeSlot],
        userPhone: data.userPhone,
        userAddress: data.userAddress,
        notes: data.notes,
      };

      const response = await apiRequest("POST", "/api/bookings", bookingData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      return response.json();
    },

    // ----- YEH RAHA FIX -----
    onSuccess: () => {
      toast({
        title: "Booking Successful!",
        description: "Your service request has been sent. Check 'My Bookings'.",
      });

      // Provider ke dashboard ki list ko refresh karo
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });

      // Customer ke 'My Bookings' page ki list ko refresh karo
      queryClient.invalidateQueries({ queryKey: ["customerBookings"] });

      form.reset();
      onSuccess?.();

      // User ko 'My Bookings' page par bhejo
      setLocation("/my-bookings");
    },
    // ----- FIX KHATAM -----

    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to book a service.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    createBookingMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-sm font-medium">Selected Problem:</p>
        <p className="text-lg font-semibold">{problemName}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date Selection */}
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Select Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-select-date"
                      >
                        {field.value ? (
                          format(field.value, "PPP") // e.g., "November 13, 2025"
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0)) // Aaj se pehle ki date disable karo
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Slot Selection */}
          <FormField
            control={form.control}
            name="preferredTimeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Preferred Time Slot
                </FormLabel>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={field.value === slot ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(slot)}
                      data-testid={`button-timeslot-${slot.replace(/\s/g, '-')}`}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="userPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Phone Number (with Country Code)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+91 98765 43210"
                    {...field}
                    data-testid="input-phone"
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Include country code (e.g., +91, +1)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="userAddress"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-1">
                  <FormLabel>Your Complete Address</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-primary"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    {isLocating ? "Detecting..." : "Use My Location"}
                  </Button>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Enter your full address or click 'Use My Location'..."
                    {...field}
                    data-testid="input-address"
                    className="resize-none"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  If location detection fails, please enter address manually.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Additional Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional details about the problem..."
                    {...field}
                    data-testid="input-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={createBookingMutation.isPending}
            data-testid="button-submit-booking"
          >
            {createBookingMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {createBookingMutation.isPending ? "Submitting..." : "Book Service Slot"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
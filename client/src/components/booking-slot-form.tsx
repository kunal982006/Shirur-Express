import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

const bookingSchema = z.object({
  userPhone: z.string().min(10, "Phone number must be at least 10 digits"),
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

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      userPhone: "",
      userAddress: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const bookingData = {
        userId: "mock-user-id", // TODO: Get from authentication
        providerId,
        serviceType: "electrician",
        problemId,
        scheduledAt: data.scheduledDate.toISOString(),
        preferredTimeSlots: [data.preferredTimeSlot],
        userPhone: data.userPhone,
        userAddress: data.userAddress,
        notes: data.notes,
        status: "pending",
      };

      return apiRequest("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Booking Submitted!",
        description: "The electrician will be notified and will accept/decline your request.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormValues) => {
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
                          format(field.value, "PPP")
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
                        date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
                <FormLabel>Your Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+91 98765 43210"
                    {...field}
                    data-testid="input-phone"
                  />
                </FormControl>
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
                <FormLabel>Your Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your complete address..."
                    {...field}
                    data-testid="input-address"
                  />
                </FormControl>
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
                    placeholder="Any specific details about the problem..."
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
            {createBookingMutation.isPending ? "Submitting..." : "Book Service Slot"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

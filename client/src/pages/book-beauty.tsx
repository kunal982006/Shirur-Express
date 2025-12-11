import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import { ArrowLeft, CalendarIcon, Clock, Loader2, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";

const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

const bookingSchema = z.object({
    userPhone: z.string()
        .min(10, "Phone number must be at least 10 digits")
        .regex(/^[+]?[\d\s()-]+$/, "Please enter a valid phone number"),
    userAddress: z.string().min(5, "Address is required"),
    scheduledDate: z.date({
        required_error: "Please select a date",
    }),
    preferredTimeSlot: z.string().min(1, "Please select a time slot"),
    notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookBeauty() {
    const [, setLocation] = useLocation();
    const [location] = useLocation();
    const queryParams = new URLSearchParams(window.location.search);
    const parlorId = queryParams.get("parlorId");
    const serviceIdsParam = queryParams.get("services");
    const serviceIds = useMemo(() => serviceIdsParam ? serviceIdsParam.split(",") : [], [serviceIdsParam]);

    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Parlor Details to get services
    const { data: parlor, isLoading } = useQuery({
        queryKey: ["service-provider-detail", parlorId],
        queryFn: () => apiRequest("GET", `/api/service-providers/${parlorId}`).then(res => res.json()),
        enabled: !!parlorId,
    });

    // Filter selected services
    const selectedServices = useMemo(() => {
        if (!parlor || !parlor.beautyServices) return [];
        return parlor.beautyServices.filter((s: any) => serviceIds.includes(s.id));
    }, [parlor, serviceIds]);

    const totalCost = selectedServices.reduce((sum: number, s: any) => sum + Number(s.price), 0);

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            userPhone: user?.phone || "",
            userAddress: "",
            notes: "",
        },
    });

    const createBookingMutation = useMutation({
        mutationFn: async (data: BookingFormValues) => {
            const date = data.scheduledDate;
            const timeSlot = data.preferredTimeSlot;
            const [time, modifier] = timeSlot.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier === 'PM' && hours !== 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            const combinedDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);

            // Construct notes with service details
            const serviceNames = selectedServices.map((s: any) => s.template?.name || "Service").join(", ");
            const finalNotes = `Services: ${serviceNames}. ${data.notes || ""}`;

            const bookingData = {
                userId: user?.id,
                providerId: parlorId,
                serviceType: "beauty",
                problemId: selectedServices[0]?.id,
                scheduledAt: combinedDateTime.toISOString(),
                preferredTimeSlots: [data.preferredTimeSlot],
                userPhone: data.userPhone,
                userAddress: data.userAddress,
                notes: finalNotes,
                estimatedCost: totalCost,
                isUrgent: false
            };

            const response = await apiRequest("POST", "/api/bookings", bookingData);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create booking');
            }
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Booking Successful! 🎉",
                description: "Your appointment has been booked.",
            });
            queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
            setLocation("/my-bookings");
        },
        onError: (error: any) => {
            toast({
                title: "Booking Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const onSubmit = (data: BookingFormValues) => {
        if (!isAuthenticated) {
            toast({ title: "Login Required", description: "Please log in to book.", variant: "destructive" });
            setLocation("/login");
            return;
        }
        createBookingMutation.mutate(data);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    if (!parlor) return <div className="text-center py-20">Parlor not found</div>;
    if (selectedServices.length === 0) return <div className="text-center py-20">No services selected</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                <Button variant="ghost" onClick={() => setLocation(`/beauty/${parlorId}`)} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Parlor
                </Button>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Booking Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Complete Your Booking</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                    {/* Date */}
                                    <FormField
                                        control={form.control}
                                        name="scheduledDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Time */}
                                    <FormField
                                        control={form.control}
                                        name="preferredTimeSlot"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Time Slot</FormLabel>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {timeSlots.map((slot) => (
                                                        <Button
                                                            key={slot}
                                                            type="button"
                                                            variant={field.value === slot ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => field.onChange(slot)}
                                                        >
                                                            {slot}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Phone */}
                                    <FormField
                                        control={form.control}
                                        name="userPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl><Input placeholder="+91..." {...field} /></FormControl>
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
                                                <FormLabel>Address</FormLabel>
                                                <FormControl><Textarea placeholder="Your address..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Notes */}
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes</FormLabel>
                                                <FormControl><Textarea placeholder="Any special requests..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full" disabled={createBookingMutation.isPending}>
                                        {createBookingMutation.isPending ? <Loader2 className="mr-2 animate-spin" /> : "Confirm Booking"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <img src={parlor.profileImageUrl} alt={parlor.businessName} className="w-16 h-16 rounded-md object-cover" />
                                    <div>
                                        <h3 className="font-semibold">{parlor.businessName}</h3>
                                        <p className="text-sm text-muted-foreground">{parlor.address}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Selected Services</h4>
                                    <ul className="space-y-2">
                                        {selectedServices.map((s: any) => (
                                            <li key={s.id} className="flex justify-between text-sm">
                                                <span>{s.template?.name}</span>
                                                <span className="font-medium">₹{s.price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{totalCost}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

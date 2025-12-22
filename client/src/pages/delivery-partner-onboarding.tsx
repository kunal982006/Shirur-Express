import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Truck, Bike, Car, CheckCircle } from "lucide-react";

const profileSchema = z.object({
    vehicleType: z.string().min(1, "Please select a vehicle type"),
    vehicleNumber: z.string().min(2, "Vehicle number is required"),
    licenseNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function DeliveryPartnerOnboarding() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            vehicleType: "",
            vehicleNumber: "",
            licenseNumber: "",
        },
    });

    const createProfileMutation = useMutation({
        mutationFn: async (data: ProfileFormValues) => {
            const response = await api.post("/delivery-partner/profile", data);
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: "Profile Created!",
                description: "Your delivery partner profile is now active. Start earning!",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
            setLocation("/delivery-partner/dashboard");
        },
        onError: (error: any) => {
            toast({
                title: "Profile Creation Failed",
                description: error.message || "Could not create profile",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: ProfileFormValues) => {
        createProfileMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-xl border-0">
                    <CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-white/20 rounded-full">
                                <Truck className="h-10 w-10" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Become a Delivery Partner</CardTitle>
                        <CardDescription className="text-center text-blue-100">
                            Join Shirur Express and start earning by delivering orders
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="vehicleType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vehicle Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger data-testid="select-vehicle-type">
                                                        <SelectValue placeholder="Select your vehicle" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="bike">
                                                        <div className="flex items-center gap-2">
                                                            <Bike className="h-4 w-4" />
                                                            <span>Bike</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="scooter">
                                                        <div className="flex items-center gap-2">
                                                            <Bike className="h-4 w-4" />
                                                            <span>Scooter</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="car">
                                                        <div className="flex items-center gap-2">
                                                            <Car className="h-4 w-4" />
                                                            <span>Car</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="vehicleNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vehicle Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., MH12AB1234"
                                                    {...field}
                                                    data-testid="input-vehicle-number"
                                                    className="uppercase"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Enter your vehicle registration number
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="licenseNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Driving License Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., MH1234567890"
                                                    {...field}
                                                    data-testid="input-license-number"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium mb-1 text-green-800">Benefits of joining:</p>
                                            <ul className="list-disc list-inside text-green-700 space-y-1">
                                                <li>Flexible working hours - work when you want</li>
                                                <li>Daily payments directly to your account</li>
                                                <li>Incentives and bonuses on completing deliveries</li>
                                                <li>Insurance coverage while on delivery</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                    disabled={createProfileMutation.isPending}
                                    data-testid="button-create-profile"
                                >
                                    {createProfileMutation.isPending ? "Creating profile..." : "Start Delivering Now"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationPicker } from "@/components/location-picker";
import { Loader2, ArrowLeft, Save, User as UserIcon, Mail, Phone, MapPin } from "lucide-react";

// Schema for profile updates
const profileSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Settings() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form with default values from user
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: user?.username || "",
            email: user?.email || "",
            phone: user?.phone || "",
            address: user?.address || "",
        },
    });

    // Update form values when user data loads
    useEffect(() => {
        if (user) {
            form.reset({
                username: user.username,
                email: user.email,
                phone: user.phone || "",
                address: user.address || "",
            });
        }
    }, [user, form]);

    const onSubmit = async (values: ProfileFormValues) => {
        setIsSaving(true);
        try {
            await api.patch("/auth/profile", values);

            // Invalidate auth query to refresh user data globally
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

            toast({
                title: "Profile Updated",
                description: "Your details have been saved successfully.",
            });
        } catch (error: any) {
            console.error("Update error:", error);
            toast({
                title: "Update Failed",
                description: error.response?.data?.message || error.message || "Could not update profile.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 flex items-center space-x-2 pl-0 hover:bg-transparent hover:text-primary"
                    onClick={() => setLocation("/")}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                </Button>

                <Card className="border-none shadow-lg bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <UserIcon className="h-6 w-6 text-primary" />
                            Account Settings
                        </CardTitle>
                        <CardDescription>
                            Manage your personal information and preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="johndoe" {...field} className="pl-10" />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                This is your public display name.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="john@example.com" {...field} className="pl-10" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="9876543210" {...field} className="pl-10" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <div className="space-y-4">
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Select location on map..."
                                                            {...field}
                                                            className="pl-10 bg-muted/50"
                                                            readOnly
                                                        />
                                                    </div>
                                                    <LocationPicker
                                                        onAddressSelect={(address) => form.setValue("address", address)}
                                                        currentAddress={field.value}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Pin your location on the map to set your address.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

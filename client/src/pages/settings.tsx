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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationPicker } from "@/components/location-picker";
import { Loader2, ArrowLeft, Save, User as UserIcon, Mail, Phone, MapPin, Trash2 } from "lucide-react";

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
    const [isDeleting, setIsDeleting] = useState(false);

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
            let phone = user.phone || "";
            // clean non-digits just in case
            phone = phone.replace(/\D/g, '');

            form.reset({
                username: user.username,
                email: user.email,
                phone: phone,
                address: user.address || "",
            });
        }
    }, [user, form]);

    const onSubmit = async (values: ProfileFormValues) => {
        setIsSaving(true);
        try {
            // Save as is (10 digits) or prepend +91? 
            // The user wants to "write only phone number". 
            // Saving standard local format is fine if backend handles +91 for SMS. 
            // We'll save it as they type (10 digits).
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

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await api.delete("/auth/profile");
            toast({
                title: "Account Deleted",
                description: "Your account has been successfully deleted.",
            });
            // Clear auth state and redirect to home layout where login handles itself
            window.location.href = "/";
        } catch (error: any) {
            console.error("Delete account error:", error);
            toast({
                title: "Deletion Failed",
                description: error.response?.data?.message || "Could not delete account. Please try again.",
                variant: "destructive",
            });
            setIsDeleting(false);
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
                                                <div className="flex relative">
                                                    <Input
                                                        placeholder="9876543210"
                                                        {...field}
                                                        maxLength={10}
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                            field.onChange(value);
                                                        }}
                                                    />
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
                                                            className="pl-10"
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
                <Card className="border-none shadow-lg bg-card/60 backdrop-blur-sm mt-8 border-t-4 border-t-destructive">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Once you delete your account, there is no going back. Please be certain.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data (including any service provider profiles) from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteAccount();
                                        }}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isDeleting ? "Deleting..." : "Yes, delete my account"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

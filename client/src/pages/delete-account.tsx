import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

// Schema for account deletion request
const deleteAccountSchema = z.object({
    fullName: z.string().min(2, "Full Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    reason: z.string().optional(),
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export default function DeleteAccount() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<DeleteAccountFormValues>({
        resolver: zodResolver(deleteAccountSchema),
        defaultValues: {
            fullName: "",
            phone: "",
            reason: "",
        },
    });

    const onSubmit = async (values: DeleteAccountFormValues) => {
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            console.log("Deletion request submitted:", values);

            setIsSubmitted(true);
            toast({
                title: "Request Submitted",
                description: "Your account deletion request is being processed.",
            });
        } catch (error) {
            console.error("Submission error:", error);
            toast({
                title: "Submission Failed",
                description: "Could not submit request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <Card className="max-w-md w-full border-none shadow-lg bg-card/60 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <CardTitle className="text-xl font-bold text-green-700">Request Submitted</CardTitle>
                        <CardDescription className="text-black font-medium mt-2">
                            Thank you. Your request is being processed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            In accordance with Google Play Data Safety policies, upon submission, your account and all associated personal data will be permanently deleted from our servers within 30 days.
                        </p>
                        <Button
                            className="w-full"
                            onClick={() => setLocation("/")}
                        >
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
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
                        <CardTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6" />
                            Request Account Deletion
                        </CardTitle>
                        <CardDescription>
                            We are sorry to see you go. Use this form to request data removal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your full name" {...field} />
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
                                            <FormLabel>Registered Phone Number <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <div className="flex relative">
                                                    <div className="flex items-center justify-center px-3 border rounded-l-md bg-muted text-muted-foreground text-sm font-medium border-r-0">
                                                        +91
                                                    </div>
                                                    <Input
                                                        placeholder="9876543210"
                                                        {...field}
                                                        className="rounded-l-none"
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
                                            <FormDescription>
                                                The phone number linked to your account.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason for Deletion (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Please let us know why you are leaving..."
                                                    className="resize-none min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive-foreground">
                                    <p className="font-bold">
                                        In accordance with Google Play Data Safety policies, upon submission, your account and all associated personal data will be permanently deleted from our servers within 30 days.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    variant="destructive"
                                    className="w-full font-bold"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing Request...
                                        </>
                                    ) : (
                                        "Confirm Deletion Request"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, MapPin, CheckCircle, Truck } from "lucide-react";

const profileSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  categoryId: z.string().min(1, "Please select a service category"),
  description: z.string().optional(),
  experience: z.string().transform(Number),
  address: z.string().min(5, "Address is required"),
  latitude: z.string().optional().transform((val) => val ? Number(val) : undefined),
  longitude: z.string().optional().transform((val) => val ? Number(val) : undefined),
  specializations: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProviderOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: "",
      categoryId: "",
      description: "",
      experience: "0",
      address: "",
      latitude: "",
      longitude: "",
      specializations: "",
    },
  });

  // Watch for category changes to handle delivery partner redirect
  const watchedCategoryId = form.watch("categoryId");

  useEffect(() => {
    if (watchedCategoryId && categories) {
      const selectedCategory = (categories as any[]).find((c: any) => c.id === watchedCategoryId);
      if (selectedCategory) {
        setSelectedCategorySlug(selectedCategory.slug);
      }
    }
  }, [watchedCategoryId, categories]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const profileData = {
        ...data,
        specializations: data.specializations
          ? data.specializations.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      const response = await apiRequest("POST", "/api/provider/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Created!",
        description: "Your service provider profile is now active.",
      });
      setLocation("/provider/dashboard");
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
    // If delivery partner category is selected, redirect to delivery partner onboarding
    if (selectedCategorySlug === "delivery-partner") {
      setLocation("/delivery-partner/onboarding");
      return;
    }
    createProfileMutation.mutate(data);
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Briefcase className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Complete Your Provider Profile</CardTitle>
            <CardDescription className="text-center">
              Tell us about your business to start receiving service requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Quick Fix Electricals"
                          {...field}
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select your service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your services and expertise..."
                          className="resize-none"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Tell customers about your experience and what makes you stand out
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g., 5"
                          {...field}
                          data-testid="input-experience"
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Business Address
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your business address"
                          className="resize-none"
                          {...field}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specializations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specializations (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., AC Repair, Wiring, Installation (comma-separated)"
                          {...field}
                          data-testid="input-specializations"
                        />
                      </FormControl>
                      <FormDescription>
                        List your areas of expertise, separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">What happens next?</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Your profile will be visible to customers</li>
                        <li>You'll start receiving booking requests</li>
                        <li>You can manage bookings from your dashboard</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProfileMutation.isPending}
                  data-testid="button-create-profile"
                >
                  {createProfileMutation.isPending ? "Creating profile..." : "Create Profile & Get Started"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertRentalPropertySchema, type InsertRentalProperty } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";

const PROPERTY_TYPES = ["Apartment", "Villa", "Plot", "Commercial Space", "Independent House"];
const FURNISHING_TYPES = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];
const AMENITIES_LIST = [
    "Parking", "24/7 Water", "Power Backup", "Gym", "Swimming Pool",
    "Security", "Lift", "Club House", "Park", "Gas Pipeline"
];

export default function PropertyListingForm() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const form = useForm<InsertRentalProperty>({
        resolver: zodResolver(insertRentalPropertySchema),
        defaultValues: {
            title: "",
            description: "",
            propertyType: "Apartment",
            rent: "0",
            deposit: "0",
            area: 0,
            bedrooms: 1,
            bathrooms: 1,
            furnishing: "Unfurnished",
            address: "",
            locality: "",
            amenities: [],
            images: [],
            status: "available",
            ownerNote: "",
            contactPhone: "",
            contactEmail: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertRentalProperty) => {
            const res = await apiRequest("POST", "/api/rental-properties", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/rental-properties"] });
            toast({
                title: "Success",
                description: "Property listed successfully!",
            });
            setLocation("/provider/dashboard");
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append("images", files[i]);
        }

        try {
            // Re-using the existing gallery upload endpoint for convenience
            // Ideally, we should have a generic upload endpoint, but this works if authenticated as provider
            // Wait, this endpoint expects 'isProvider'. 
            // If the user is just a normal user listing a property, this might fail if they are not a 'service provider'.
            // For MVP, let's assume we use a generic upload endpoint or the user is a provider.
            // Actually, let's use the single image upload endpoint repeatedly or create a new one.
            // Existing: POST /api/provider/profile/gallery (requires isProvider)
            // We need a generic upload for rental properties.
            // Let's try to use the existing one for now, assuming the user might be a provider.
            // If not, we might need to add a generic upload route.
            // For now, let's mock the upload or use a placeholder if we can't upload.
            // BETTER: Let's use the /api/provider/profile/image endpoint which is for single image but maybe we can loop.
            // BUT that also requires isProvider.

            // Let's assume for now we just input URLs or we add a generic upload route in the backend.
            // I'll add a generic upload route in the next step if needed. 
            // For now, let's just use a simple URL input or assume the backend route exists.
            // I will add a generic upload route to server/routes.ts quickly.

            const res = await fetch("/api/upload", { // New generic route I will add
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            const newUrls = [...imageUrls, ...data.urls];
            setImageUrls(newUrls);
            form.setValue("images", newUrls);
        } catch (error) {
            console.error("Upload error", error);
            toast({ title: "Upload failed", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = (data: InsertRentalProperty) => {
        // Ensure numbers are strings/numbers as expected by schema
        const formattedData = {
            ...data,
            rent: data.rent.toString(),
            deposit: data.deposit?.toString(),
            area: Number(data.area),
            bedrooms: Number(data.bedrooms),
            bathrooms: Number(data.bathrooms),
            images: imageUrls,
        };
        createMutation.mutate(formattedData);
    };

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>List Your Property</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Basic Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Property Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 2BHK Apartment in City Center" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="propertyType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Property Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {PROPERTY_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Financials */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="rent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monthly Rent (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="deposit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Security Deposit (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Specs */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="area"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Area (sq ft)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bedrooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bedrooms</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bathrooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bathrooms</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="furnishing"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Furnishing</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {FURNISHING_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="locality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Locality/Neighborhood</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Indiranagar" {...field} />
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
                                            <FormLabel>Full Address</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Enter full address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contactPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Phone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+91..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contactEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="email@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Owner Note */}
                            <FormField
                                control={form.control}
                                name="ownerNote"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Owner's Note / USP</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe unique features (e.g. near metro, park facing)..."
                                                className="h-24"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Amenities */}
                            <FormField
                                control={form.control}
                                name="amenities"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-4">
                                            <FormLabel className="text-base">Amenities</FormLabel>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {AMENITIES_LIST.map((item) => (
                                                <FormField
                                                    key={item}
                                                    control={form.control}
                                                    name="amenities"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={item}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(item)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), item])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== item
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {item}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <FormLabel>Property Images</FormLabel>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                </div>
                                {imageUrls.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {imageUrls.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <img src={url} alt={`Property ${index}`} className="h-20 w-full object-cover rounded" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newUrls = imageUrls.filter((_, i) => i !== index);
                                                        setImageUrls(newUrls);
                                                        form.setValue("images", newUrls);
                                                    }}
                                                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Listing Property...
                                    </>
                                ) : (
                                    "List Property"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Home as HomeIcon, MapPin, DollarSign, Image } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "Independent House" },
    { value: "villa", label: "Villa" },
];

const furnishingOptions = [
    { value: "furnished", label: "Fully Furnished" },
    { value: "semifurnished", label: "Semi Furnished" },
    { value: "unfurnished", label: "Unfurnished" },
];

// NOTE: This component assumes you have authentication and can get the current userId
const MOCK_OWNER_ID = "owner-user-123"; 

export default function PostProperty() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    // Form State
    const [formData, setFormData] = useState({
        title: '', description: '', rent: '', propertyType: '', 
        bedrooms: '1', bathrooms: '1', area: '', furnishing: '', locality: '', 
        address: '', images: [] as string[]
    });

    // Simple change handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Select change handler
    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Mutation hook to submit data
    const postPropertyMutation = useMutation({
        mutationFn: (propertyData: any) => {
            // NOTE: In the backend (routes.ts), ensure you're getting ownerId from the session, not the body!
            return apiRequest('POST', '/api/rental-properties', propertyData);
        },
        onSuccess: () => {
            toast({ title: "Success!", description: "Property listed successfully. Tenants will contact you soon." });
            setLocation('/rental'); // Redirect to listing page
        },
        onError: (error: any) => {
            console.error("Post Error:", error);
            toast({ title: "Failed", description: error.message || "Failed to list property.", variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const dataToSend = {
            ownerId: MOCK_OWNER_ID, // This should come from Auth context/session
            ...formData,
            rent: parseInt(formData.rent) || 0,
            bedrooms: parseInt(formData.bedrooms) || 0,
            bathrooms: parseInt(formData.bathrooms) || 0,
            area: parseInt(formData.area) || 0,
        };

        if (!dataToSend.title || !dataToSend.rent || !dataToSend.locality || !dataToSend.propertyType) {
             return toast({ title: "Missing Info", description: "Please fill in all required fields (Title, Rent, Locality, Type).", variant: "destructive" });
        }

        postPropertyMutation.mutate(dataToSend);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <Button variant="ghost" onClick={() => setLocation("/rental")} className="mb-6 text-primary">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Rentals
                </Button>

                <Card className="shadow-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <HomeIcon className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold">List Your Property</h2>
                        </div>
                        <p className="text-muted-foreground mt-1">Fill the details accurately to attract verified tenants quickly.</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* BASIC DETAILS */}
                            <h3 className="text-xl font-semibold border-b pb-2 mb-4">1. Basic Property Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="title">Listing Title (e.g., Spacious 3 BHK)</Label>
                                    <Input id="title" placeholder="Catchy title for your property" value={formData.title} onChange={handleChange} required />
                                </div>
                                <div>
                                    <Label htmlFor="rent">Monthly Rent (₹)</Label>
                                    <Input id="rent" type="number" placeholder="e.g., 25000" value={formData.rent} onChange={handleChange} required />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Detailed Description</Label>
                                <Textarea id="description" placeholder="Describe amenities, surroundings, and USPs." value={formData.description} onChange={handleChange} rows={4} />
                            </div>

                            {/* TYPE & CONFIGURATION */}
                            <h3 className="text-xl font-semibold border-b pb-2 pt-4 mb-4">2. Configuration</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Property Type</Label>
                                    <Select onValueChange={(v) => handleSelectChange('propertyType', v)} value={formData.propertyType} required>
                                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                        <SelectContent>
                                            {propertyTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="bedrooms">Bedrooms</Label>
                                    <Input id="bedrooms" type="number" min="1" value={formData.bedrooms} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label htmlFor="bathrooms">Bathrooms</Label>
                                    <Input id="bathrooms" type="number" min="1" value={formData.bathrooms} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label htmlFor="area">Area (sqft)</Label>
                                    <Input id="area" type="number" placeholder="e.g., 1200" value={formData.area} onChange={handleChange} />
                                </div>
                            </div>

                            {/* LOCATION AND FURNISHING */}
                            <h3 className="text-xl font-semibold border-b pb-2 pt-4 mb-4">3. Location & Furnishing</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="locality">Locality (Required)</Label>
                                    <Input id="locality" placeholder="e.g., Koramangala, Whitefield" value={formData.locality} onChange={handleChange} required />
                                </div>
                                <div>
                                    <Label>Furnishing Status</Label>
                                    <Select onValueChange={(v) => handleSelectChange('furnishing', v)} value={formData.furnishing} required>
                                        <SelectTrigger><SelectValue placeholder="Select Furnishing" /></SelectTrigger>
                                        <SelectContent>
                                            {furnishingOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Full Address (Internal Use)</Label>
                                <Input id="address" placeholder="Flat No., Building Name" value={formData.address} onChange={handleChange} />
                            </div>

                            {/* IMAGE UPLOAD (Mock) */}
                            <h3 className="text-xl font-semibold border-b pb-2 pt-4 mb-4">4. Photos</h3>
                            <div className="border border-dashed border-gray-300 p-6 rounded-lg text-center">
                                <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Upload Property Photos (Max 5)</p>
                                {/* In a real app, this would handle file uploads */}
                                <Button type="button" variant="outline" className="mt-3">Select Files</Button>
                            </div>


                            {/* SUBMIT */}
                            <Button 
                                type="submit" 
                                className="w-full mt-6" 
                                size="lg" 
                                disabled={postPropertyMutation.isPending}
                            >
                                {postPropertyMutation.isPending ? "Listing Property..." : "Submit Property & Go Live"}
                            </Button>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { RentalProperty, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    MapPin, Bed, Bath, Home, Phone, Mail, CheckCircle2,
    Calendar, ShieldCheck, Info
} from "lucide-react";

export default function PropertyDetail() {
    const [, params] = useRoute("/properties/:id");
    const [showContact, setShowContact] = useState(false);

    const { data: property, isLoading } = useQuery<RentalProperty & { owner: User }>({
        queryKey: [`/api/rental-properties/${params?.id}`],
        enabled: !!params?.id,
    });

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center">Loading property details...</div>;
    }

    if (!property) {
        return <div className="container mx-auto p-4 text-center">Property not found</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                        <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{property.locality}, {property.address}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-primary">₹{property.rent}<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                        <div className="text-sm text-muted-foreground">Deposit: ₹{property.deposit}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Images & Description */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Image Carousel */}
                    <Card className="overflow-hidden border-none shadow-none">
                        <Carousel className="w-full">
                            <CarouselContent>
                                {property.images && property.images.length > 0 ? (
                                    property.images.map((img, index) => (
                                        <CarouselItem key={index}>
                                            <div className="aspect-video relative">
                                                <img
                                                    src={img}
                                                    alt={`Property view ${index + 1}`}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))
                                ) : (
                                    <CarouselItem>
                                        <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                                            <Home className="h-20 w-20 opacity-20" />
                                        </div>
                                    </CarouselItem>
                                )}
                            </CarouselContent>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                        </Carousel>
                    </Card>

                    {/* Key Specs */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Bed className="h-6 w-6 mb-2 text-primary" />
                                <div className="font-semibold">{property.bedrooms} Bedrooms</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Bath className="h-6 w-6 mb-2 text-primary" />
                                <div className="font-semibold">{property.bathrooms} Bathrooms</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Home className="h-6 w-6 mb-2 text-primary" />
                                <div className="font-semibold">{property.area} sqft</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-xl font-semibold mb-3">About this property</h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {property.description || "No description provided."}
                        </p>
                    </div>

                    {/* Owner's Note */}
                    {property.ownerNote && (
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                                <Info className="h-4 w-4" /> Owner's Note
                            </h3>
                            <p className="text-sm text-muted-foreground">{property.ownerNote}</p>
                        </div>
                    )}

                    {/* Amenities */}
                    <div>
                        <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {property.amenities?.map((amenity) => (
                                <div key={amenity} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                            {(!property.amenities || property.amenities.length === 0) && (
                                <span className="text-muted-foreground italic">No specific amenities listed.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact & Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{property.propertyType}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Furnishing</span>
                                    <span className="font-medium">{property.furnishing}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Notice Period</span>
                                    <span className="font-medium">{property.noticePeriod || "N/A"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Available From</span>
                                    <span className="font-medium">Immediately</span>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {property.owner?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            {property.owner?.username || "Property Owner"}
                                            {property.owner?.isVerified && (
                                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Property Owner</div>
                                    </div>
                                </div>

                                {!showContact ? (
                                    <Button className="w-full" onClick={() => setShowContact(true)}>
                                        Show Contact Details
                                    </Button>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3 p-2 bg-background rounded border">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{property.contactPhone || property.owner?.phone || "Not available"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 bg-background rounded border">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{property.contactEmail || property.owner?.email || "Not available"}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center mt-2">
                                            Please mention you saw this on ShirurExpress.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

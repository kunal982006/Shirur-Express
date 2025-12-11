import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BookingSlotForm from "@/components/booking-slot-form";
import {
    ArrowLeft,
    MapPin,
    Star,
    Briefcase,
    CheckCircle2,
    Clock,
    Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceProvider, ServiceProblem, User, ServiceCategory } from "@shared/schema";

type PlumberProviderDetail = ServiceProvider & {
    user: User;
    category: ServiceCategory;
};

export default function PlumberDetail() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute("/plumber/:id");
    const [selectedProblem, setSelectedProblem] = useState<{ id: string; name: string } | null>(null);
    const [showBooking, setShowBooking] = useState(false);

    const providerId = params?.id;

    // Get plumber details
    const { data: provider, isLoading } = useQuery<PlumberProviderDetail>({
        queryKey: ["service-provider-detail", providerId],
        queryFn: () =>
            apiRequest("GET", `/api/service-providers/${providerId}`)
                .then(res => res.json()),
        enabled: !!providerId,
    });

    // Get all appliances (parent problems)
    const { data: appliances, isLoading: appliancesLoading } = useQuery<ServiceProblem[]>({
        queryKey: ["service-problems", "plumber"],
        queryFn: () =>
            apiRequest("GET", "/api/service-problems?category=plumber")
                .then(res => res.json()),
        enabled: !!provider,
    });

    const handleProblemSelect = (problemId: string, problemName: string) => {
        setSelectedProblem({ id: problemId, name: problemName });
        setShowBooking(true);
    };

    if (isLoading) {
        return (
            <div className="py-16 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="py-16 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-muted-foreground">
                        Plumber not found
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6 flex items-center space-x-2"
                    onClick={() => setLocation("/plumber")}
                    data-testid="button-back"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Plumbers</span>
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Plumber Profile */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-2xl mb-1">
                                            {provider.businessName}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            @{provider.user?.username}
                                        </p>
                                    </div>
                                    {provider.isVerified && (
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Rating */}
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center">
                                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                        <span className="ml-1 font-semibold">
                                            {provider.rating}
                                        </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        ({provider.reviewCount} reviews)
                                    </span>
                                </div>

                                <Separator />

                                {/* Experience */}
                                <div className="flex items-center space-x-2 text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{provider.experience} years experience</span>
                                </div>

                                {/* Location */}
                                <div className="flex items-start space-x-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{provider.address}</span>
                                </div>

                                {/* Availability */}
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4" />
                                    <span className={provider.isAvailable ? "text-green-600" : "text-red-600"}>
                                        {provider.isAvailable ? "Available Now" : "Not Available"}
                                    </span>
                                </div>

                                <Separator />

                                {/* Specializations */}
                                {provider.specializations && provider.specializations.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Specializations</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {provider.specializations.map((spec: string, index: number) => (
                                                <Badge key={index} variant="outline">
                                                    {spec}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Problems This Plumber Can Handle */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Plumbing Problems I Can Fix</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Select a problem to book a service slot
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {appliancesLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : appliances && appliances.length > 0 ? (
                                    appliances.map((appliance) => (
                                        <ApplianceProblems
                                            key={appliance.id}
                                            appliance={appliance}
                                            selectedProblemId={selectedProblem?.id || ""}
                                            onProblemSelect={handleProblemSelect}
                                        />
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No problems listed
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Booking Section - Shown when problem is selected */}
                        {showBooking && selectedProblem && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Book a Service Slot</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        You selected: <span className="text-primary font-medium">{selectedProblem.name}</span>
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <BookingSlotForm
                                        providerId={providerId!}
                                        problemId={selectedProblem.id}
                                        problemName={selectedProblem.name}
                                        onSuccess={() => {
                                            setShowBooking(false);
                                            setSelectedProblem(null);
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

// Component to display problems for each appliance
function ApplianceProblems({
    appliance,
    selectedProblemId,
    onProblemSelect,
}: {
    appliance: ServiceProblem;
    selectedProblemId: string;
    onProblemSelect: (problemId: string, problemName: string) => void;
}) {
    // Child problems fetch karo
    const { data: problems, isLoading } = useQuery<ServiceProblem[]>({
        queryKey: [
            "service-problems",
            "plumber",
            appliance.id, // Parent ID
        ],
        queryFn: () =>
            apiRequest("GET", `/api/service-problems?category=plumber&parentId=${appliance.id}`)
                .then(res => res.json()),
        enabled: !!appliance.id,
    });

    return (
        <div>
            <h4 className="font-semibold mb-3 flex items-center">
                {appliance.name}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading issues...</p>
                ) : (
                    problems?.map((problem: any) => (
                        <Button
                            key={problem.id}
                            variant={selectedProblemId === problem.id ? "default" : "outline"}
                            className="justify-start"
                            onClick={() => onProblemSelect(problem.id, problem.name)}
                            data-testid={`button-problem-${problem.id}`}
                        >
                            {problem.name}
                        </Button>
                    ))
                )}
            </div>
        </div>
    );
}

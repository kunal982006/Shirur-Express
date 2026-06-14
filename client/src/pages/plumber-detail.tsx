import { useState, useEffect } from "react";
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

    // Auto-select problem if present in URL
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const preSelectedProblemId = searchParams.get("problemId");
        const preSelectedProblemName = searchParams.get("problemName");

        if (preSelectedProblemId && preSelectedProblemName) {
            setSelectedProblem({ id: preSelectedProblemId, name: preSelectedProblemName });
            setShowBooking(true);
        }
    }, []); // Run once on mount

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

                <div className="w-full max-w-3xl mx-auto">
                    {/* Problems This Plumber Can Handle OR Booking Form */}

                    {showBooking && selectedProblem ? (
                        <Card className="mt-0 border-none shadow-none sm:border-solid sm:border-border sm:shadow-sm">
                            <CardHeader className="px-0 sm:px-6 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-bold">Book Slot</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            For: <span className="font-semibold text-foreground">{selectedProblem.name}</span>
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowBooking(false)} className="h-8 text-xs">
                                        Change
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 sm:px-6">
                                <BookingSlotForm
                                    providerId={providerId!}
                                    problemId={selectedProblem.id}
                                    problemName={selectedProblem.name}
                                    serviceType="plumber"
                                    onSuccess={() => {
                                        // Maybe redirect or show success
                                    }}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Plumbing Problems I Can Fix</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Select a problem to book a service slot
                                </p>
                            </CardHeader>
                            <CardContent className="max-h-[400px] overflow-y-auto space-y-4">
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
                    )}

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
        <div className="pb-3 border-b last:border-b-0">
            <h4 className="font-semibold text-sm mb-2 text-primary">
                {appliance.name}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                ) : (
                    problems?.map((problem: any) => (
                        <Button
                            key={problem.id}
                            variant={selectedProblemId === problem.id ? "default" : "outline"}
                            size="sm"
                            className="justify-start text-xs h-8 px-2"
                            onClick={() => onProblemSelect(problem.id, problem.name)}
                            data-testid={`button-problem-${problem.id}`}
                        >
                            <span className="truncate">{problem.name}</span>
                        </Button>
                    ))
                )}
            </div>
        </div>
    );
}

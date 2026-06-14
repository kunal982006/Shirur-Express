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
  Phone,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceProvider, ServiceProblem, User, ServiceCategory } from "@shared/schema";

type ElectricianProviderDetail = ServiceProvider & {
  user: User;
  category: ServiceCategory;
};

export default function ElectricianDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/electrician/:id");
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

  // Get electrician details (FIXED)
  const { data: provider, isLoading } = useQuery<ElectricianProviderDetail>({
    queryKey: ["service-provider-detail", providerId],
    queryFn: () =>
      apiRequest("GET", `/api/service-providers/${providerId}`)
        .then(res => res.json()),
    enabled: !!providerId,
  });

  // Get all appliances (parent problems) (FIXED)
  const { data: appliances, isLoading: appliancesLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "electrician"],
    queryFn: () =>
      apiRequest("GET", "/api/service-problems?category=electrician")
        .then(res => res.json()),
    enabled: !!provider, // Jab provider load ho jaye tab
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
            Technician not found
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
          onClick={() => setLocation("/electrician")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Technicians</span>
        </Button>

        <div className="w-full max-w-3xl mx-auto">
          {/* Problems This Electrician Can Handle OR Booking Form */}

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
                  serviceType="electrician"
                  onSuccess={() => {
                    // Maybe redirect or show success
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Electrical Problems I Can Fix</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a problem to book a service slot
                </p>
              </CardHeader>
              <CardContent>
                {appliancesLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading problems...</p>
                ) : appliances && appliances.length > 0 ? (
                  <div className="space-y-6">
                    {/* Sirf wohi appliances dikhao jo provider specialize karta hai */}
                    {appliances
                      .filter(appliance => provider.specializations?.includes(appliance.name) || appliance.name === 'Others')
                      .map((appliance: any) => (
                        <ApplianceProblems
                          key={appliance.id}
                          appliance={appliance}
                          selectedProblemId={selectedProblem?.id || ""}
                          onProblemSelect={handleProblemSelect}
                        />
                      ))}
                  </div>
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
    </div>
  );
}

// Component to display problems for each appliance (FIXED)
function ApplianceProblems({
  appliance,
  selectedProblemId,
  onProblemSelect,
}: {
  appliance: ServiceProblem;
  selectedProblemId: string;
  onProblemSelect: (problemId: string, problemName: string) => void;
}) {
  // Child problems fetch karo (FIXED)
  const { data: problems, isLoading } = useQuery<ServiceProblem[]>({
    queryKey: [
      "service-problems",
      "electrician",
      appliance.id, // Parent ID
    ],
    queryFn: () =>
      apiRequest("GET", `/api/service-problems?category=electrician&parentId=${appliance.id}`)
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

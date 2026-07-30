import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookingSlotForm from "@/components/booking-slot-form";
import {
  ArrowLeft,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceProblem } from "@shared/schema";

// Phone Hub service IDs
const PHONE_HUB_IDS = ["screen-guard", "phone-repair", "buy-phone", "sell-phone"];
const PHONE_HUB_TIME_SLOTS = [
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"
];
const PHONE_HUB_INSTANT_HOURS = { from: 18, to: 22 }; // 6 PM to 10 PM

export default function ElectricianBook() {
  const [, setLocation] = useLocation();
  const [selectedProblem, setSelectedProblem] = useState<{ id: string; name: string } | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  // Auto-select problem if present in URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const preSelectedProblemId = searchParams.get("problemId");
    const preSelectedProblemName = searchParams.get("problemName");

    if (preSelectedProblemId && preSelectedProblemName) {
      setSelectedProblem({ id: preSelectedProblemId, name: preSelectedProblemName });
      setShowBooking(true);
    }
  }, []); // Run once on mount

  // Get all appliances (parent problems)
  const { data: appliances, isLoading: appliancesLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "electrician"],
    queryFn: () =>
      apiRequest("GET", "/api/service-problems?category=electrician")
        .then(res => res.json()),
  });

  const handleProblemSelect = (problemId: string, problemName: string) => {
    setSelectedProblem({ id: problemId, name: problemName });
    setShowBooking(true);
  };

  return (
    <div className="py-6 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl mx-auto">
          {/* Booking Form or Problem Selection */}

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
                {(() => {
                  const isPhoneHub = PHONE_HUB_IDS.includes(selectedProblem.id);
                  return (
                    <BookingSlotForm
                      problemId={selectedProblem.id}
                      problemName={selectedProblem.name}
                      serviceType={isPhoneHub ? "phone-hub" : "electrician"}
                      onSuccess={() => {
                        // Maybe redirect or show success
                      }}
                      {...(isPhoneHub ? {
                        availableTimeSlots: PHONE_HUB_TIME_SLOTS,
                        instantHours: PHONE_HUB_INSTANT_HOURS,
                      } : {})}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setLocation("/electrician")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle>Select Your Problem</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose a problem to book a service slot
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {appliancesLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading problems...</p>
                ) : appliances && appliances.length > 0 ? (
                  <div className="space-y-6">
                    {appliances.map((appliance: any) => (
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
  // Child problems fetch
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

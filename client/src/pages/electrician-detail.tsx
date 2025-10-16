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
  Phone
} from "lucide-react";

export default function ElectricianDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/electrician/:id");
  const [selectedProblem, setSelectedProblem] = useState<{id: string; name: string} | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const providerId = params?.id;

  // Get electrician details
  const { data: provider, isLoading } = useQuery({
    queryKey: ["/api/service-providers", providerId],
    enabled: !!providerId,
  });

  // Get electrician category
  const { data: categories } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const electricianCategory = categories?.find(
    (cat: any) => cat.slug === "electrician"
  );

  // Get all appliances (parent problems)
  const { data: appliances } = useQuery({
    queryKey: ["/api/service-problems", electricianCategory?.id],
    enabled: !!electricianCategory?.id,
  });

  // Get all problems for all appliances
  const { data: allProblems } = useQuery({
    queryKey: ["/api/service-problems", electricianCategory?.id, "all"],
    enabled: !!electricianCategory?.id,
    select: (data) => {
      // This will get parent problems, we need to get child problems separately
      return data;
    },
  });

  const handleProblemSelect = (problemId: string, problemName: string) => {
    setSelectedProblem({ id: problemId, name: problemName });
    setShowBooking(true);
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground">
            Electrician not found
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
          <span>Back to Electricians</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Electrician Profile */}
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

                {/* Contact Button */}
                <Button className="w-full" disabled={!provider.isAvailable}>
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Electrician
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Problems This Electrician Can Handle */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Electrical Problems I Can Fix</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a problem to book a service slot
                </p>
              </CardHeader>
              <CardContent>
                {appliances && appliances.length > 0 ? (
                  <div className="space-y-6">
                    {appliances.map((appliance: any) => (
                      <ApplianceProblems
                        key={appliance.id}
                        appliance={appliance}
                        electricianCategoryId={electricianCategory?.id}
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

            {/* Booking Section - Shown when problem is selected */}
            {showBooking && selectedProblem && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Book a Service Slot</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred date and time
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
    </div>
  );
}

// Component to display problems for each appliance
function ApplianceProblems({
  appliance,
  electricianCategoryId,
  selectedProblemId,
  onProblemSelect,
}: {
  appliance: any;
  electricianCategoryId: string;
  selectedProblemId: string;
  onProblemSelect: (problemId: string, problemName: string) => void;
}) {
  const { data: problems } = useQuery({
    queryKey: [
      "/api/service-problems",
      electricianCategoryId,
      { parentId: appliance.id },
    ],
    enabled: !!electricianCategoryId && !!appliance.id,
  });

  return (
    <div>
      <h4 className="font-semibold mb-3 flex items-center">
        {appliance.name}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {problems?.map((problem: any) => (
          <Button
            key={problem.id}
            variant={selectedProblemId === problem.id ? "default" : "outline"}
            className="justify-start"
            onClick={() => onProblemSelect(problem.id, problem.name)}
            data-testid={`button-problem-${problem.id}`}
          >
            {problem.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

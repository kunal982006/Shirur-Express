import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceProvider, ServiceProblem } from "@shared/schema";

const IMAGE_MAPPING: Record<string, string> = {
  "Air Conditioner (AC)": "/images/electrician/ac.png",
  "Refrigerator": "/images/electrician/refrigerator.png",
  "Television (TV)": "/images/electrician/tv.png",
  "Water Heater (Geyser)": "/images/electrician/water-heater.png",
  "Washing Machine": "/images/electrician/washing-machine.png",
  "Microwave Oven": "/images/electrician/microwave.png",
  "Others": "/images/electrician/others.png"
};

export default function Electrician() {
  const [, setLocation] = useLocation();
  const [selectedAppliance, setSelectedAppliance] = useState<ServiceProblem | null>(null);

  // 1. Get the "Admin" Electrician Provider
  const { data: providers, isLoading: providersLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["service-providers", "electrician"],
    queryFn: () =>
      apiRequest("GET", "/api/service-providers?category=electrician")
        .then(res => res.json()),
  });

  const adminProviderId = providers?.[0]?.id;

  // 2. Get appliance categories (Parent Problems)
  const { data: appliances, isLoading: appliancesLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "electrician"],
    queryFn: () =>
      apiRequest("GET", "/api/service-problems?category=electrician")
        .then(res => res.json()),
  });

  // 3. Get child problems for Selected Appliance (when dialog is open)
  const { data: childProblems, isLoading: childProblemsLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "electrician", selectedAppliance?.id],
    queryFn: () =>
      apiRequest("GET", `/api/service-problems?category=electrician&parentId=${selectedAppliance?.id}`)
        .then(res => res.json()),
    enabled: !!selectedAppliance?.id,
  });

  const handleApplianceClick = (appliance: ServiceProblem) => {
    setSelectedAppliance(appliance);
  };

  const handleProblemClick = (problem: ServiceProblem) => {
    if (!adminProviderId) {
      console.error("No electrician provider found!");
      return;
    }
    // Navigate to detail page with pre-selected problem
    // passing problem info in query params
    setLocation(`/electrician/${adminProviderId}?problemId=${problem.id}&problemName=${encodeURIComponent(problem.name)}`);
  };

  const isLoading = providersLoading || appliancesLoading;

  return (
    <div className="py-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Button>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Electrician & Technician Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select an appliance to see available services. We provide expert repairs for all major home appliances.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {appliances?.map((appliance) => {
              // Fallback image logic
              const imageUrl = appliance.imageUrl || IMAGE_MAPPING[appliance.name] || "/images/placeholder.png";

              return (
                <Card
                  key={appliance.id}
                  className="cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 border-primary/10"
                  onClick={() => handleApplianceClick(appliance)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center h-full">
                    <div className="w-full aspect-square mb-4 relative flex items-center justify-center p-2">
                      <img
                        src={imageUrl}
                        alt={appliance.name}
                        className="w-full h-full object-contain drop-shadow-sm transition-transform hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/150?text=" + appliance.name.substring(0, 2);
                        }}
                      />
                    </div>
                    <h3 className="font-semibold text-lg">{appliance.name}</h3>
                    <p className="text-xs text-muted-foreground mt-2">View Issues</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Problems Dialog */}
        <Dialog open={!!selectedAppliance} onOpenChange={(open) => !open && setSelectedAppliance(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAppliance?.name} - Select Issue
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto">
              {childProblemsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : childProblems?.length === 0 ? (
                <p className="text-center text-muted-foreground">No specific issues listed. Please contact support.</p>
              ) : (
                childProblems?.map((problem) => (
                  <Button
                    key={problem.id}
                    variant="outline"
                    className="w-full justify-between h-auto py-3 px-4 hover:bg-primary/5 hover:text-primary hover:border-primary"
                    onClick={() => handleProblemClick(problem)}
                  >
                    <span className="text-left font-medium">{problem.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
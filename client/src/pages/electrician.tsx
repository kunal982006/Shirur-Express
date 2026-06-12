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
import { ArrowLeft, Loader2, ChevronRight, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceProvider, ServiceProblem } from "@shared/schema";

const IMAGE_MAPPING: Record<string, string> = {
  "Air Conditioner (AC)": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448848/shirur-express/electrician/ac.jpg",
  "Refrigerator": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448852/shirur-express/electrician/refrigerator.jpg",
  "Television (TV)": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448854/shirur-express/electrician/tv.jpg",
  "Water Heater (Geyser)": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448857/shirur-express/electrician/water-heater.jpg",
  "Washing Machine": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448855/shirur-express/electrician/washing-machine.jpg",
  "Microwave Oven": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448849/shirur-express/electrician/microwave.jpg",
  "Others": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448851/shirur-express/electrician/others.jpg"
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

  const adminProviderId = providers?.sort((a, b) => {
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    return 0;
  })?.[0]?.id;

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
            Don't stay in the dark. Let our experts power up your home. 💡⚡
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-2 sm:gap-6 px-1 sm:px-0">
            {appliances?.map((appliance) => {
              // Fallback image logic
              const imageUrl = appliance.imageUrl || IMAGE_MAPPING[appliance.name] || "/images/placeholder.png";

              return (
                <div
                  key={appliance.id}
                  className="cursor-pointer group flex flex-col items-center text-center justify-start"
                  onClick={() => handleApplianceClick(appliance)}
                >
                  <div className="w-full h-20 sm:h-28 mb-1 relative flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={appliance.name}
                      className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/150?text=" + appliance.name.substring(0, 2);
                      }}
                    />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-base leading-tight line-clamp-2 text-foreground/90">{appliance.name}</h3>
                </div>
              );
            })}
          </div>
        )}

        {/* Attractive Footer Banner */}
        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 rounded-2xl p-6 text-center max-w-lg mx-auto shadow-sm">
          <div className="flex justify-center mb-3">
            <div className="bg-white p-2.5 rounded-full shadow-sm border border-amber-100">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-amber-950 mb-1 tracking-tight">
            No ordinary repairs.
          </h3>
          <p className="text-sm sm:text-base text-amber-800 font-medium">
            Only certified elite professionals for your home.
          </p>
        </div>

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
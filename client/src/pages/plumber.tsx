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
import { Loader2, ChevronRight, ShieldCheck, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceProblem } from "@shared/schema";
import { CallNowBar } from "@/components/call-now-bar";

const CUSTOMER_REVIEWS = [
  { name: "Suresh Kadam (Tap & Mixer)", rating: 4.8, text: "Bathroom cha mixer leak hot hota. Shirur Express varun plumber bolavla, 30 minitat yeun changlya quality cha part basavla. Ekdum neat kaam." },
  { name: "Pooja Patil (Basin & Sink)", rating: 5.0, text: "Kitchen sink full choke zala hota. Plumber arrived quickly with proper tools and cleared it completely. Very clean and hygienic work!" },
  { name: "Ganesh Shinde (Water Tank)", rating: 4.7, text: "Overhead water tank leakage and ball valve replacement karwaya. Kaam bohot badiya kiya aur rate bhi reasonable tha. Highly recommended." },
  { name: "Nitin Jagtap (Pipe Leakage)", rating: 4.9, text: "Wall madhye pipe leakage hota, shodhnyasathi tras hot hota. Technician ne accurate leak find kela ani bina jada todphod repair kela." },
  { name: "Sunita More (Toilet Flush)", rating: 4.6, text: "Flush tank continuously running hota. Quickly repair zala. Very polite and professional service in Shirur." }
];

const IMAGE_MAPPING: Record<string, string> = {
  "Tap & Mixer": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448864/shirur-express/plumber/tap.jpg",
  "Toilet": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448866/shirur-express/plumber/toilet.jpg",
  "Water Tank": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448869/shirur-express/plumber/water-tank.jpg",
  "Basin & Sink": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448858/shirur-express/plumber/basin-sink.jpg",
  "Pipe & Leakage": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448861/shirur-express/plumber/leakage.jpg",
  "Water Heater (Geyser)": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448860/shirur-express/plumber/geyser.jpg",
  "Water Pump": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448863/shirur-express/plumber/motor.jpg",
  "Others": "https://res.cloudinary.com/mlijtrrb/image/upload/v1772448851/shirur-express/electrician/others.jpg",
};

export default function Plumber() {
  const [, setLocation] = useLocation();
  const [selectedAppliance, setSelectedAppliance] = useState<ServiceProblem | null>(null);

  // 1. No need to fetch providers anymore — admin will assign after booking

  // 2. Get appliance/item categories (Parent Problems)
  const { data: appliances, isLoading: appliancesLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "plumber"],
    queryFn: () =>
      apiRequest("GET", "/api/service-problems?category=plumber")
        .then(res => res.json()),
  });

  // 3. Get child problems for Selected Appliance (when dialog is open)
  const { data: childProblems, isLoading: childProblemsLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "plumber", selectedAppliance?.id],
    queryFn: () =>
      apiRequest("GET", `/api/service-problems?category=plumber&parentId=${selectedAppliance?.id}`)
        .then(res => res.json()),
    enabled: !!selectedAppliance?.id,
  });

  const handleApplianceClick = (appliance: ServiceProblem) => {
    setSelectedAppliance(appliance);
  };

  const handleProblemClick = (problem: ServiceProblem) => {
    // Navigate to booking page with problem info — no providerId needed
    setLocation(`/plumber/book?problemId=${problem.id}&problemName=${encodeURIComponent(problem.name)}`);
  };

  const isLoading = appliancesLoading;

  return (
    <div className="pt-3 sm:pt-5 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-2 sm:gap-6 px-1 sm:px-0">
            {appliances?.filter(a => a.name !== "Others").map((appliance) => {
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

        {/* 'Others' Custom Full-Width Highlight Banner */}
        {appliances?.find(a => a.name === "Others") && (
          <div 
            className="mt-6 mx-2 sm:mx-0 bg-sky-50/60 border border-sky-100 rounded-2xl overflow-hidden shadow-sm flex relative cursor-pointer group hover:shadow-md transition-all h-32 sm:h-40"
            onClick={() => handleApplianceClick(appliances.find(a => a.name === "Others")!)}
          >
            <div className="p-4 sm:p-6 z-10 w-[60%] sm:w-2/3 flex flex-col justify-center">
              <h3 className="text-sky-950 font-bold text-base sm:text-2xl mb-1 leading-tight">Looking for something else?</h3>
              <p className="text-sky-800/80 text-[10px] sm:text-sm font-medium leading-tight mb-2 sm:mb-3">
                From pipe leakages to new fittings, our experts handle it all.
              </p>
              <div className="bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full inline-block self-start shadow-sm group-hover:bg-sky-700 transition-colors">
                Explore All Services &rarr;
              </div>
            </div>
            {/* The plumber / repair image */}
            <div className="w-[45%] absolute right-0 top-0 bottom-0 flex items-end justify-end pointer-events-none mix-blend-multiply overflow-visible">
              <img 
                src="https://res.cloudinary.com/mlijtrrb/image/upload/v1772448851/shirur-express/electrician/others.jpg" 
                alt="Plumbing Expert" 
                className="h-full w-full object-contain object-right-bottom transition-transform group-hover:scale-105 origin-bottom mix-blend-multiply drop-shadow-sm pr-2 sm:pr-4"
              />
            </div>
          </div>
        )}

        {/* Attractive Footer Banner */}
        <div className="mt-8 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100/50 rounded-xl p-3 flex items-center gap-3 max-w-lg mx-auto shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm border border-sky-100 shrink-0">
            <ShieldCheck className="h-5 w-5 text-sky-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-sky-950 leading-tight">
              No ordinary repairs.
            </h3>
            <p className="text-xs text-sky-800 font-medium leading-tight mt-0.5">
              Only certified elite plumbing professionals for your home.
            </p>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-8 mb-8">
          <h3 className="text-lg font-bold mb-4 px-2 text-foreground/90">What our customers say</h3>
          <div className="flex flex-col gap-3 px-1">
            {CUSTOMER_REVIEWS.map((review, i) => (
              <Card key={i} className="border-primary/10 shadow-sm bg-card">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-xs sm:text-sm text-foreground">{review.name}</div>
                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                      {review.rating.toFixed(1)} <Star className="h-2.5 w-2.5 fill-green-700 dark:fill-green-400" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                    "{review.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
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

      {/* Call Now Sticky Bottom Bar */}
      <CallNowBar
        variant="plumber"
        title="Direct Call Specialist"
        tagline="Hume call karein aur apni problem batayein"
      />
    </div>
  );
}

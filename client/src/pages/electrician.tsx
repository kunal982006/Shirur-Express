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
import { ArrowLeft, Loader2, ChevronRight, ShieldCheck, Star, Smartphone, Shield, Wrench, RefreshCw, ShoppingBag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceProvider, ServiceProblem } from "@shared/schema";

const CUSTOMER_REVIEWS = [
  { name: "Sachin Gawade (Fridge)", rating: 4.8, text: "Amcha fridge achanak band padla hota. Shirur Express varun technician book kela, khupach bhari service dili. Paisanchi kontihi fasavnuk nahi, ekdum vishwasu manus hota." },
  { name: "Rahul Deshmukh (AC Repair)", rating: 5.0, text: "Booked an AC servicing yesterday. The technician was highly professional, cleaned everything properly without making a mess, and charged exactly what was shown in the app. Premium service!" },
  { name: "Priya Verma (Water Filter)", rating: 4.5, text: "वाटर फिल्टर का पानी लीक हो रहा था। इनका टेक्निशियन टाइम पर आया और फटाफट फिक्स कर दिया। सर्विस एकदम प्रीमियम और टेंशन-फ्री थी।" },
  { name: "Vikram Singh (Switchboard)", rating: 4.2, text: "Kitchen ka gas aur hall ke kuch switchboards repair karwaye. Bohot hi experienced electrician tha. Mujhe baar-baar market bhagna nahi pada, saara kaam ek baar me hi chaka-chak ho gaya." },
  { name: "Anjali Thite (Washing Machine)", rating: 4.9, text: "वॉशिंग मशीन दुरुस्त करण्यासाठी बेस्ट ॲप आहे. टेक्निशियन वेळेवर आला आणि काम खूप परफेक्ट केलं. घरच्या घरी इतकी चांगली आणि प्रीमियम सर्विस मिळेल वाटलं नव्हतं." },
  { name: "Amit Sharma (LED TV)", rating: 4.6, text: "LED TV ka display chal nahi raha tha. Shirur Express ke technician ne aakar bht acche se check kiya aur genuine part replace kiya. Kaam ekdum perfect aur saaf-suthra tha." },
  { name: "Rohan Joshi (Microwave)", rating: 4.7, text: "Finally a reliable service in town. Fixed my double-door fridge and oven on the same day. No hidden charges. Highly recommended for premium home repairs." },
  { name: "Mahendra Shinde (Wiring)", rating: 4.3, text: "Gharatil short circuit ani navin switchboard che kaam ekdum safe padhatine kele. Technician khup experienced hota. Shirur madhye ashi kamachi guarantee denari dusri service nahi." }
];

const IMAGE_MAPPING: Record<string, string> = {
  "Air Conditioner (AC)": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448848/shirur-express/electrician/ac.jpg",
  "Refrigerator": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448852/shirur-express/electrician/refrigerator.jpg",
  "Television (TV)": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448854/shirur-express/electrician/tv.jpg",
  "Water Heater (Geyser)": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448857/shirur-express/electrician/water-heater.jpg",
  "Washing Machine": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448855/shirur-express/electrician/washing-machine.jpg",
  "Microwave Oven": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448849/shirur-express/electrician/microwave.jpg",
  "Others": "https://res.cloudinary.com/dtxtql7zd/image/upload/v1772448851/shirur-express/electrician/others.jpg"
};

const PHONE_HUB_CATEGORIES = [
  { id: "screen-guard", name: "Screen Guard", icon: Shield, description: "Screen guard installation at ₹70 only" },
  { id: "phone-repair", name: "Phone Repair", icon: Wrench, description: "Expert phone repair at best prices" },
  { id: "buy-phone", name: "Buy Phone", icon: ShoppingBag, description: "Buy quality phones at best deals" },
  { id: "sell-phone", name: "Sell Phone", icon: RefreshCw, description: "Sell your old phone for best price" },
];

export default function Electrician() {
  const [, setLocation] = useLocation();
  const [selectedAppliance, setSelectedAppliance] = useState<ServiceProblem | null>(null);
  const [showPhoneHub, setShowPhoneHub] = useState(false);

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
            className="mt-6 mx-2 sm:mx-0 bg-blue-50/50 border border-blue-100 rounded-2xl overflow-hidden shadow-sm flex relative cursor-pointer group hover:shadow-md transition-all h-32 sm:h-40"
            onClick={() => handleApplianceClick(appliances.find(a => a.name === "Others")!)}
          >
            <div className="p-4 sm:p-6 z-10 w-[60%] sm:w-2/3 flex flex-col justify-center">
              <h3 className="text-blue-950 font-bold text-base sm:text-2xl mb-1 leading-tight">Looking for something else?</h3>
              <p className="text-blue-800/80 text-[10px] sm:text-sm font-medium leading-tight mb-2 sm:mb-3">
                From wiring fixes to complex repairs, our experts handle it all.
              </p>
              <div className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full inline-block self-start shadow-sm group-hover:bg-blue-700 transition-colors">
                Explore All Services &rarr;
              </div>
            </div>
            {/* The uploaded man image */}
            <div className="w-[45%] absolute right-0 top-0 bottom-0 flex items-end justify-end pointer-events-none mix-blend-multiply overflow-visible">
              <img 
                src="/electrician-expert.png" 
                alt="Expert Technician" 
                className="h-full w-full object-contain object-right-bottom transition-transform group-hover:scale-105 origin-bottom mix-blend-multiply drop-shadow-sm pr-2 sm:pr-4"
              />
            </div>
          </div>
        )}

        {/* EXPRESS PHONE HUB Banner */}
        <div className="mt-6 mx-2 sm:mx-0 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group relative"
          onClick={() => setShowPhoneHub(true)}
          style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)' }}
        >
          {/* Decorative floating shapes */}
          <div className="absolute top-2 left-3 w-8 h-8 rounded-full bg-emerald-300/20 blur-sm animate-pulse" />
          <div className="absolute bottom-4 left-1/3 w-6 h-6 rounded-full bg-teal-200/30 blur-sm" />
          
          <div className="flex relative min-h-[280px] sm:min-h-[300px]">
            {/* Left: Content */}
            <div className="p-4 sm:p-6 z-10 w-[58%] sm:w-[55%] flex flex-col justify-center">
              {/* Title Badge */}
              <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] sm:text-xs font-extrabold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full self-start mb-3 shadow-sm tracking-wide uppercase">
                <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Express Phone Hub
              </div>
              
              {/* Service 1: Screen Guard */}
              <div className="flex items-start gap-1.5 mb-2.5">
                <div className="mt-0.5 shrink-0 bg-white/70 rounded-full p-1 shadow-sm">
                  <Shield className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <span className="text-emerald-950 font-bold text-[11px] sm:text-sm leading-tight block">Screen Guard</span>
                  <span className="text-emerald-800/80 text-[9px] sm:text-xs leading-tight block">
                    Bas <span className="font-extrabold text-emerald-700">₹70</span> mein screen guard + free doorstep installation!
                    <span className="text-emerald-600/60 text-[8px] sm:text-[10px]"> (Market ₹100)</span>
                  </span>
                </div>
              </div>

              {/* Service 2: Phone Repair */}
              <div className="flex items-start gap-1.5 mb-2.5">
                <div className="mt-0.5 shrink-0 bg-white/70 rounded-full p-1 shadow-sm">
                  <Wrench className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <span className="text-emerald-950 font-bold text-[11px] sm:text-sm leading-tight block">Phone Repair</span>
                  <span className="text-emerald-800/80 text-[9px] sm:text-xs leading-tight block">
                    Market se saste mein expert phone repair!
                  </span>
                </div>
              </div>

              {/* Service 3: Buy / Sell */}
              <div className="flex items-start gap-1.5 mb-3">
                <div className="mt-0.5 shrink-0 bg-white/70 rounded-full p-1 shadow-sm">
                  <RefreshCw className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <span className="text-emerald-950 font-bold text-[11px] sm:text-sm leading-tight block">Buy / Sell</span>
                  <span className="text-emerald-800/80 text-[9px] sm:text-xs leading-tight block">
                    Purana phone kharido ya becho—best deals guarantee!
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full inline-block self-start shadow-sm group-hover:bg-emerald-700 transition-colors">
                View Now &rarr;
              </div>
            </div>

            {/* Right: Phone Repair Expert Image */}
            <div className="w-[42%] sm:w-[45%] absolute right-0 top-0 bottom-0 flex items-end justify-end pointer-events-none overflow-visible">
              <img 
                src="/phone-repair-expert.png" 
                alt="Phone Repair Expert" 
                className="h-full w-full object-contain object-right-bottom transition-transform group-hover:scale-105 origin-bottom drop-shadow-md pr-1 sm:pr-3"
              />
            </div>
          </div>

          {/* Bottom decorative border */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
        </div>

        {/* Attractive Footer Banner */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 rounded-xl p-3 flex items-center gap-3 max-w-lg mx-auto shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm border border-amber-100 shrink-0">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-amber-950 leading-tight">
              No ordinary repairs.
            </h3>
            <p className="text-xs text-amber-800 font-medium leading-tight mt-0.5">
              Only certified elite professionals for your home.
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

        {/* Phone Hub Categories Dialog */}
        <Dialog open={showPhoneHub} onOpenChange={setShowPhoneHub}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                Express Phone Hub
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">Select a service to book</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {PHONE_HUB_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all group/card text-center"
                    onClick={() => {
                      setShowPhoneHub(false);
                      if (adminProviderId) {
                        setLocation(`/electrician/${adminProviderId}?problemId=${cat.id}&problemName=${encodeURIComponent(cat.name)}`);
                      }
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 group-hover/card:bg-emerald-200 flex items-center justify-center transition-colors">
                      <Icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="font-semibold text-sm text-emerald-950">{cat.name}</span>
                    <span className="text-[10px] text-emerald-700/70 leading-tight">{cat.description}</span>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Sparkles, Crown } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// --- Data (Minimal for Listing) ---
const NESTED_SERVICES = {
  "Hair Services": [], "Nail Services": [], "Skincare Services": [], "Makeup Services": [], "Bridal & Special Events": [],
};
const MAIN_BEAUTY_CATEGORIES = Object.keys(NESTED_SERVICES);

const PREMIUM_DUMMY_PARLOR = {
  id: "premium-dummy-1",
  businessName: "L'Aura Elite Spa & Studio",
  profileImageUrl: "https://images.unsplash.com/photo-1560944527-a4a429848866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  rating: "5.0",
  reviewCount: 428,
  address: "Platinum Tower, Downtown",
  isVerified: true,
  specializations: ["Hair Services", "Skincare Services", "Nail Services", "Bridal & Special Events"],
  isPremiumDummy: true
};
// --- End Data ---

export default function Beauty() {
  const [, setLocation] = useLocation();
  const [filterMainCategory, setFilterMainCategory] = useState("All");

  const { data: beautyParlors, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "beauty" }],
    queryFn: async () => {
      const res = await api.get("/service-providers?category=beauty");
      return res.data;
    },
  });

  const filteredParlors = useMemo(() => {
    let allP = beautyParlors ? [...beautyParlors] : [];

    // Inject the premium dummy to make them feel "WOW, 4 parlors!"
    if (beautyParlors && !allP.find(p => p.id === PREMIUM_DUMMY_PARLOR.id)) {
      // Add it to the top so it's the first thing they see and sets a premium tone
      allP.unshift(PREMIUM_DUMMY_PARLOR);
    }

    if (filterMainCategory !== "All") {
      allP = allP.filter((parlor: any) =>
        parlor.specializations?.includes(filterMainCategory) || parlor.isPremiumDummy
      );
    }
    return allP;
  }, [beautyParlors, filterMainCategory]);


  return (
    <div className="py-8 md:py-12 min-h-screen bg-gradient-to-br from-rose-50/80 via-white to-pink-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header & Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            className="mb-8 flex items-center space-x-2 hover:bg-rose-100/50 text-rose-700 transition-colors"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Services</span>
          </Button>
        </motion.div>

        {/* Hero Title Area - Making it feel premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 text-center md:text-left"
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold mb-4 shadow-sm border border-rose-200">
            <Sparkles className="w-4 h-4 mr-2" /> Elite Beauty Collection
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-gray-900">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Ultimate Luxury</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Curated premium beauty professionals delivering exceptional salon and spa experiences directly to you.
          </p>
        </motion.div>

        {/* Horizontal Scrollable Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex overflow-x-auto scrollbar-hide space-x-3 mb-10 pb-4 border-b border-rose-100"
        >
          <Button
            variant={filterMainCategory === "All" ? "default" : "outline"}
            className={`flex-shrink-0 rounded-full px-6 transition-all ${filterMainCategory === "All" ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md" : "hover:bg-rose-50 border-rose-200 text-rose-700"}`}
            onClick={() => setFilterMainCategory("All")}
          >
            All Destinations
          </Button>

          {MAIN_BEAUTY_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={filterMainCategory === cat ? "default" : "outline"}
              className={`flex-shrink-0 rounded-full px-6 transition-all ${filterMainCategory === cat ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md" : "hover:bg-rose-50 border-rose-200 text-rose-700"}`}
              onClick={() => setFilterMainCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </motion.div>

        {/* Beauty Parlor Grid - The WOW factor! */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence>
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse border-none shadow-xl rounded-3xl overflow-hidden aspect-[4/3] bg-rose-50/50" />
              ))
            ) : filteredParlors && filteredParlors.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-500 text-lg font-medium">No elite parlors found for this category yet.</p>
              </div>
            ) : (
              filteredParlors?.map((parlor: any, index: number) => (
                <motion.div
                  key={parlor.id}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.3, duration: 0.6, type: "spring", bounce: 0.4 }}
                >
                  <Card className="group relative border-none shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(236,72,153,0.3)] transition-all duration-500 rounded-3xl overflow-hidden h-full flex flex-col bg-white">
                    <Link to={parlor.isPremiumDummy ? "#" : `/beauty/${parlor.id}`} className="flex flex-col h-full block hover:no-underline">
                      {/* Large Premium Image Area */}
                      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                        {parlor.profileImageUrl ? (
                          <img
                            src={parlor.profileImageUrl}
                            alt={parlor.businessName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-rose-100 to-pink-100 flex items-center justify-center text-rose-300 transition-transform duration-700 group-hover:scale-105">
                            <Sparkles className="h-16 w-16" />
                          </div>
                        )}
                        {/* Elegant gradient overlay for perfect text legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent flex flex-col justify-between p-6 opacity-90 transition-opacity duration-300 group-hover:opacity-100">

                          {/* Overlay Badges Top Right */}
                          <div className="flex flex-col gap-2 items-end self-end">
                            {parlor.isPremiumDummy && (
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none shadow-lg flex items-center gap-1.5 px-3 py-1 text-sm font-semibold pointer-events-none">
                                <Crown className="w-3.5 h-3.5" /> Elite Member
                              </Badge>
                            )}
                            {parlor.isVerified && !parlor.isPremiumDummy && (
                              <Badge className="bg-rose-500/90 backdrop-blur-sm text-white border-none shadow-lg flex items-center gap-1.5 px-3 py-1 text-sm pointer-events-none">
                                <Sparkles className="w-3.5 h-3.5" /> Verified
                              </Badge>
                            )}
                          </div>

                          {/* Text Content overlaying image at bottom */}
                          <div className="text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight drop-shadow-md tracking-tight">
                              {parlor.businessName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base font-medium text-white/90">
                              <div className="flex items-center bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1.5" />
                                <span>{parlor.rating || "New"} <span className="opacity-70 ml-1">({parlor.reviewCount || 0})</span></span>
                              </div>
                              <div className="flex items-center bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm max-w-[200px] sm:max-w-xs">
                                <MapPin className="h-4 w-4 mr-1.5 text-rose-300 flex-shrink-0" />
                                <span className="truncate">{parlor.address}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Card Bottom / Action Area */}
                      <CardContent className="p-6 flex flex-col flex-grow bg-white relative z-10">
                        <div className="flex flex-wrap gap-2 mb-6">
                          {parlor.specializations?.slice(0, 3).map((spec: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-600 rounded-full border border-rose-100 shadow-sm">
                              {spec}
                            </span>
                          ))}
                          {parlor.specializations?.length > 3 && (
                            <span className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-600 rounded-full border border-gray-100 shadow-sm">
                              +{parlor.specializations.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="mt-auto">
                          <Button
                            className={`w-full h-12 text-base font-semibold rounded-xl shadow-md transition-all duration-300 ${parlor.isPremiumDummy ? 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
                            onClick={(e) => {
                              if (parlor.isPremiumDummy) {
                                e.preventDefault();
                                alert("Welcome to our new elite partner! Menu coming shortly and you won't be disappointed.");
                              }
                            }}
                          >
                            {parlor.isPremiumDummy ? "Explore Elite Services" : "View Services Menu"}
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
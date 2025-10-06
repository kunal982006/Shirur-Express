import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProviderCard from "@/components/provider-card";
import CallRequestModal from "@/components/call-request-modal";
import { ArrowLeft, Wrench, Droplets, Aperture, ShowerHead, ChevronRight } from "lucide-react";

const problemCategories = [
  {
    id: "leakage",
    name: "Water Leakage",
    icon: Droplets,
    subcategories: [
      "Pipe Leakage",
      "Tap Leaking",
      "Toilet Leakage",
      "Ceiling Leak",
      "Underground Leak"
    ]
  },
  {
    id: "blockage",
    name: "Drain Blockage",
    icon: Aperture,
    subcategories: [
      "Kitchen Sink Block",
      "Bathroom Drain Block", 
      "Toilet Blockage",
      "Main Drain Block",
      "Other Blockage"
    ]
  },
  {
    id: "installation",
    name: "New Installation",
    icon: ShowerHead,
    subcategories: [
      "Bathroom Fitting",
      "Kitchen Setup",
      "Water Heater",
      "Water Pump",
      "Other Installation"
    ]
  },
  {
    id: "repair",
    name: "Repair & Maintenance",
    icon: Wrench,
    subcategories: [
      "Tap Repair",
      "Flush Repair",
      "Pipe Repair",
      "Water Motor",
      "General Repair"
    ]
  }
];

export default function Plumber() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("distance");
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "plumber" }],
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory("");
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
  };

  const handleCallRequest = (provider: any) => {
    setSelectedProvider(provider);
    setCallModalOpen(true);
  };

  const selectedCategoryData = problemCategories.find(cat => cat.id === selectedCategory);

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Find Plumbers</h2>
          <p className="text-muted-foreground">
            Select your problem and we'll show you the best plumbers near you
          </p>
        </div>

        {/* Problem Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's your problem?</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Main Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {problemCategories.map((category) => (
                <div
                  key={category.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCategory === category.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary hover:bg-primary/5"
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                  data-testid={`category-${category.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <category.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>

            {/* Subcategory Selection */}
            {selectedCategoryData && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Select specific issue:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategoryData.subcategories.map((subcategory) => (
                      <Button
                        key={subcategory}
                        variant={selectedSubcategory === subcategory ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSubcategorySelect(subcategory)}
                        data-testid={`subcategory-${subcategory.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {subcategory}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Available Plumbers */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Available Plumbers Near You</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {providers?.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No plumbers found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your location or check back later for available providers.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                providers?.map((provider: any) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onCallRequest={() => handleCallRequest(provider)}
                    onSchedule={() => {}}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Call Request Modal */}
      <CallRequestModal
        open={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        provider={selectedProvider}
      />
    </div>
  );
}

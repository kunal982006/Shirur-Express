import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import ProviderCard from "@/components/provider-card";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient"; // Asli API request function import kiya
import type { ServiceProvider, ServiceProblem, User, ServiceCategory } from "@shared/schema";

// Types define kiye
type ElectricianProvider = ServiceProvider & { user: User; category: ServiceCategory };

export default function Electrician() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppliance, setSelectedAppliance] = useState("");
  const [selectedProblem, setSelectedProblem] = useState("");

  // 1. Get all electricians (Profiles)
  const { data: providers, isLoading: providersLoading } = useQuery<ElectricianProvider[]>({
    queryKey: ["service-providers", "electrician"],
    queryFn: () => 
      apiRequest("GET", "/api/service-providers?category=electrician")
        .then(res => res.json()),
  });

  // 2. Get appliance categories (Parent Problems)
  const { data: appliances, isLoading: appliancesLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "electrician"],
    queryFn: () => 
      apiRequest("GET", "/api/service-problems?category=electrician")
        .then(res => res.json()),
    // Yeh hamesha enabled rahega
  });

  // 3. Get problems for selected appliance (Child Problems)
  const { data: problems, isLoading: problemsLoading } = useQuery<ServiceProblem[]>({
    queryKey: ["service-problems", "electrician", selectedAppliance],
    queryFn: () => 
      apiRequest("GET", `/api/service-problems?category=electrician&parentId=${selectedAppliance}`)
        .then(res => res.json()),
    enabled: !!selectedAppliance, // Jab selectedAppliance ho tabhi chalao
  });

  // Filter providers based on search and selected problem/appliance
  const filteredProviders = useMemo(() => {
    if (!providers) return [];

    let filtered = providers;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((provider) =>
        provider.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Specialization (Appliance) filter
    if (selectedAppliance) {
      const applianceName = appliances?.find(a => a.id === selectedAppliance)?.name;
      if (applianceName) {
        filtered = filtered.filter(provider => 
          provider.specializations?.includes(applianceName)
        );
      }
    }

    // TODO: Problem-specific filter (agar backend support karta hai)
    // Abhi ke liye, hum sirf appliance (specialization) se filter kar rahe hain

    return filtered;
  }, [providers, searchQuery, selectedAppliance, appliances]);

  const handleApplianceChange = (value: string) => {
    setSelectedAppliance(value);
    setSelectedProblem(""); // Reset problem selection
  };

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
          <h2 className="text-3xl font-bold mb-2">Find Technicians & Electricians</h2>
          <p className="text-muted-foreground">
            Search by name or filter by appliance and problem
          </p>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search electricians by name or location..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-electrician"
                />
              </div>

              {/* Appliance and Problem Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Appliance Dropdown */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Appliance
                  </label>
                  <Select
                    value={selectedAppliance}
                    onValueChange={handleApplianceChange}
                    disabled={appliancesLoading}
                  >
                    <SelectTrigger data-testid="select-appliance">
                      <SelectValue placeholder={appliancesLoading ? "Loading..." : "Choose an appliance"} />
                    </SelectTrigger>
                    <SelectContent>
                      {appliances?.map((appliance: any) => (
                        <SelectItem 
                          key={appliance.id} 
                          value={appliance.id}
                          data-testid={`appliance-${appliance.id}`}
                        >
                          {appliance.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Problem Dropdown */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Problem
                  </label>
                  <Select
                    value={selectedProblem}
                    onValueChange={setSelectedProblem}
                    disabled={!selectedAppliance || problemsLoading}
                  >
                    <SelectTrigger data-testid="select-problem">
                      <SelectValue placeholder={
                        problemsLoading ? "Loading..." :
                        selectedAppliance 
                        ? "Choose a problem" 
                        : "Select appliance first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {problems?.map((problem: any) => (
                        <SelectItem 
                          key={problem.id} 
                          value={problem.id}
                          data-testid={`problem-${problem.id}`}
                        >
                          {problem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedAppliance || selectedProblem) && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {selectedAppliance && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {appliances?.find((a: any) => a.id === selectedAppliance)?.name}
                    </span>
                  )}
                  {selectedProblem && (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {problems?.find((p: any) => p.id === selectedProblem)?.name}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAppliance("");
                      setSelectedProblem("");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Electricians List */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Available Technicians ({filteredProviders?.length || 0})
          </h3>

          {providersLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-2">Loading technicians...</p>
            </div>
          ) : filteredProviders?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No technicians found. Try adjusting your filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders?.map((provider: any) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  categorySlug="electrician"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
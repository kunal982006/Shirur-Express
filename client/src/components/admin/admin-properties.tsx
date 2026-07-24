import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RentalProperty } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Home, Trash2, Edit } from "lucide-react";
import { Link } from "wouter";

export default function AdminProperties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery<RentalProperty[]>({
    queryKey: ["/api/rental-properties"],
    queryFn: async () => {
      // Empty query string gets all properties
      const res = await apiRequest("GET", "/api/rental-properties");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rental-properties/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Property Deleted", description: "Property removed successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/rental-properties"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-[#0d1220] border-white/5 text-white shadow-xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Home className="h-5 w-5 text-blue-400" />
          Manage Rental Properties
        </CardTitle>
        <CardDescription className="text-gray-400">
          View, edit, and delete user-submitted rental properties.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!properties || properties.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
            <h3 className="text-lg font-medium text-gray-300">No Properties Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {properties.map(property => (
              <div key={property.id} className="flex flex-col sm:flex-row bg-white/5 p-4 rounded-xl border border-white/5 gap-4 transition-all hover:bg-white/10">
                <div className="flex-shrink-0">
                  {property.images && property.images[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full sm:w-24 h-32 sm:h-24 bg-black/20 rounded-lg flex items-center justify-center">
                      <Home className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-lg text-gray-100">{property.title}</h4>
                      <Badge className={property.status === 'available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                        {property.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{property.propertyType} • {property.locality}</p>
                    <p className="font-medium text-blue-400 mt-1">₹{property.rent}/mo</p>
                    <p className="text-xs text-gray-500 mt-1">Owner ID: {property.ownerId.slice(0, 8)}...</p>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 sm:mt-0">
                    <Button variant="outline" size="sm" asChild className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                      <Link href={`/edit-property/${property.id}`}><Edit className="h-4 w-4 mr-1" /> Edit</Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
                      onClick={() => {
                        if (confirm('Delete this property?')) deleteMutation.mutate(property.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

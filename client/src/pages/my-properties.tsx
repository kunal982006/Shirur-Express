import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { RentalProperty } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Home, Trash2, Edit } from "lucide-react";

export default function MyProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery<RentalProperty[]>({
    queryKey: ["myProperties", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/rental-properties");
      return res.json();
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rental-properties/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Property Deleted", description: "Listing removed successfully." });
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/rental-properties/${id}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Property status changed." });
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (!user) {
    return <div>Please log in to view your properties.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Rental Listings</CardTitle>
            <CardDescription>Manage your property listings.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/list-property">
              <PlusCircle className="mr-2 h-4 w-4" /> List New Property
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : !properties || properties.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">No Properties Listed</h3>
              <p className="text-muted-foreground mt-2">List your first property to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map(property => (
                <div key={property.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex items-center gap-4">
                    {property.images && property.images[0] ? (
                      <img src={property.images[0]} alt={property.title} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center"><Home className="h-6 w-6 opacity-20" /></div>
                    )}
                    <div>
                      <h4 className="font-semibold">{property.title}</h4>
                      <div className="text-sm text-muted-foreground">
                        ₹{property.rent}/mo • {property.locality}
                      </div>
                      <Badge variant={property.status === 'available' ? 'default' : 'secondary'} className="mt-1">
                        {property.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/edit-property/${property.id}`}><Edit className="h-4 w-4 mr-1" /> Edit</Link>
                    </Button>
                    {property.status === 'available' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ id: property.id, status: 'rented' })}
                        disabled={toggleStatusMutation.isPending}
                      >
                        Mark Rented
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ id: property.id, status: 'available' })}
                        disabled={toggleStatusMutation.isPending}
                      >
                        Mark Available
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this listing?')) deleteMutation.mutate(property.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

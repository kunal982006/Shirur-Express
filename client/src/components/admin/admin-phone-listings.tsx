import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type PhoneListing } from "@shared/schema";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, IndianRupee, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminPhoneListings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: rawListings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/phone-listings", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? "/admin/phone-listings" 
        : `/admin/phone-listings?status=${statusFilter}`;
      const res = await api.get(url);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const listings = Array.isArray(rawListings) ? rawListings : [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.patch(`/admin/phone-listings/${id}`, updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-listings"] });
      toast({ title: "Listing updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating listing",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/phone-listings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-listings"] });
      toast({ title: "Listing deleted" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case "sold": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sold</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#1e40af]" />
          Phone Hub Buy/Sell Requests
        </CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Seller Details</TableHead>
                <TableHead>Condition/Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading listings...
                  </TableCell>
                </TableRow>
              ) : listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No phone listings found.
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          {listing.images && (Array.isArray(listing.images) ? listing.images.length > 0 : JSON.parse(listing.images).length > 0) ? (
                            <img src={Array.isArray(listing.images) ? listing.images[0] : JSON.parse(listing.images)[0]} alt="Phone" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{listing.brand} {listing.model}</div>
                          <div className="text-xs text-gray-500">
                            {[listing.storage, listing.ram, listing.color].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{listing.sellerName}</div>
                      <div className="text-sm text-gray-500">{listing.sellerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="capitalize">{listing.condition}</div>
                      <div className="text-xs text-gray-500">{listing.age || "N/A"}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(listing.status)}</TableCell>
                    <TableCell>
                      {listing.adminPrice ? (
                        <span className="font-medium flex items-center">
                          <IndianRupee className="w-3 h-3 mr-1" />
                          {Number(listing.adminPrice).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionDialog 
                        listing={listing} 
                        onUpdate={(updates) => updateMutation.mutate({ id: listing.id, updates })} 
                      />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-1">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this phone listing? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(listing.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionDialog({ listing, onUpdate }: { listing: any, onUpdate: (updates: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(listing.status);
  const [price, setPrice] = useState(listing.adminPrice || "");
  const [note, setNote] = useState(listing.adminNote || "");

  const handleSave = () => {
    onUpdate({
      status,
      adminPrice: price ? parseFloat(price.toString()) : null,
      adminNote: note
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Manage</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Phone Listing</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Images Section */}
          <div className="space-y-3">
            <Label>Uploaded Photos</Label>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(listing.images) ? listing.images.map((img: string, i: number) => (
                <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                  <img src={img} alt={`Phone view ${i+1}`} className="w-full h-32 object-cover rounded-md border" />
                </a>
              )) : (typeof listing.images === 'string' ? JSON.parse(listing.images) : []).map((img: string, i: number) => (
                <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                  <img src={img} alt={`Phone view ${i+1}`} className="w-full h-32 object-cover rounded-md border" />
                </a>
              ))}
            </div>
            {(!listing.images || listing.images.length === 0) && <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground text-center">No images uploaded</div>}
            
            <div className="pt-4 border-t mt-4">
              <Label>Seller Information</Label>
              <div className="text-sm space-y-1 mt-2">
                <p><span className="font-medium">Name:</span> {listing.sellerName}</p>
                <p><span className="font-medium">Phone:</span> {listing.sellerPhone}</p>
                <p><span className="font-medium">Address:</span> {listing.sellerAddress || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Action Form */}
          <div className="space-y-4">
            <div>
              <Label>Phone Details</Label>
              <div className="text-sm bg-muted p-3 rounded-md mt-2 space-y-1">
                <p><span className="font-medium">Brand/Model:</span> {listing.brand} {listing.model}</p>
                <p><span className="font-medium">Specs:</span> {listing.storage} / {listing.ram} / {listing.color}</p>
                <p><span className="font-medium">Condition:</span> {listing.condition}</p>
                <p><span className="font-medium">Age:</span> {listing.age}</p>
                {listing.description && <p><span className="font-medium">Notes:</span> {listing.description}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Update</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved (List on Buy Phone page)</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Selling Price (₹) - Shown to buyers</Label>
              <Input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                placeholder="e.g. 15000"
              />
            </div>

            <div className="space-y-2">
              <Label>Admin Notes (Reason for rejection, etc.)</Label>
              <Textarea 
                value={note} 
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional notes to send to seller..."
              />
            </div>

            <Button onClick={handleSave} className="w-full bg-[#1e40af] hover:bg-[#1e3a8a]">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

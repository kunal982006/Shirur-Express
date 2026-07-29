import { useQuery } from "@tanstack/react-query";
import { type PhoneListing } from "@shared/schema";
import { useLocation } from "wouter";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, MapPin, BadgeIndianRupee, Phone, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BuyPhone() {
  const [, setLocation] = useLocation();

  const { data: listings, isLoading } = useQuery<PhoneListing[]>({
    queryKey: ["/api/phone-listings/approved"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/phone-listings/approved`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
  });

  const getConditionBadgeColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "fair": return "bg-yellow-100 text-yellow-800";
      case "poor": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleContact = () => {
    // Open WhatsApp to Shirur Express admin
    window.open("https://wa.me/919822606626?text=Hi, I am interested in buying a phone from Express Phone Hub", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#1e40af] text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold">Buy Used Phones</h1>
            <span className="text-xs text-blue-200">Certified by Express Phone Hub</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300 mt-10">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Phones Available</h3>
            <p className="text-gray-500 mb-6">There are currently no approved phones for sale. Please check back later!</p>
            <Button onClick={() => setLocation("/sell-phone")} variant="outline" className="border-[#1e40af] text-[#1e40af]">
              Sell Your Phone Instead
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((phone) => (
              <Card key={phone.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {phone.images && phone.images.length > 0 ? (
                    <img 
                      src={phone.images[0]} 
                      alt={`${phone.brand} ${phone.model}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  {phone.images && phone.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                      1/{phone.images.length} Photos
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge className={getConditionBadgeColor(phone.condition) + " border-none shadow-sm capitalize"}>
                      {phone.condition} Condition
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="mb-1 text-sm font-medium text-gray-500">{phone.brand}</div>
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-2">{phone.model}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    {phone.storage && <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{phone.storage}</span>}
                    {phone.ram && <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{phone.ram} RAM</span>}
                    {phone.color && <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{phone.color}</span>}
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-[#1e40af] font-bold text-xl">
                        <BadgeIndianRupee className="w-5 h-5 mr-0.5" />
                        {Number(phone.adminPrice).toLocaleString('en-IN')}
                      </div>
                      {phone.age && (
                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                          Age: {phone.age}
                        </div>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-[#1e40af] hover:bg-[#1e3a8a]">View Details</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-xl overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="p-4 sm:p-6 pb-0 sticky top-0 bg-white z-10 border-b">
                          <DialogTitle className="text-xl">
                            {phone.brand} {phone.model}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="p-4 sm:p-6 space-y-6">
                          {/* Image Gallery */}
                          {phone.images && phone.images.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                              {phone.images.map((img, i) => (
                                <div key={i} className="min-w-[80%] sm:min-w-[250px] aspect-square flex-shrink-0 snap-center rounded-lg overflow-hidden bg-gray-100 border">
                                  <img src={img} alt={`${phone.model} - view ${i+1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Price Banner */}
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <div className="text-sm text-blue-800 font-medium mb-1">Shirur Express Price</div>
                              <div className="text-3xl font-bold text-[#1e40af] flex items-center">
                                <BadgeIndianRupee className="w-7 h-7 mr-1" />
                                {Number(phone.adminPrice).toLocaleString('en-IN')}
                              </div>
                            </div>
                            <Badge className={getConditionBadgeColor(phone.condition) + " uppercase"}>
                              {phone.condition}
                            </Badge>
                          </div>

                          {/* Specs Grid */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Specifications</h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                              <div>
                                <div className="text-gray-500 mb-1">Brand</div>
                                <div className="font-medium">{phone.brand}</div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Model</div>
                                <div className="font-medium">{phone.model}</div>
                              </div>
                              {phone.storage && (
                                <div>
                                  <div className="text-gray-500 mb-1">Storage</div>
                                  <div className="font-medium">{phone.storage}</div>
                                </div>
                              )}
                              {phone.ram && (
                                <div>
                                  <div className="text-gray-500 mb-1">RAM</div>
                                  <div className="font-medium">{phone.ram}</div>
                                </div>
                              )}
                              {phone.color && (
                                <div>
                                  <div className="text-gray-500 mb-1">Color</div>
                                  <div className="font-medium">{phone.color}</div>
                                </div>
                              )}
                              {phone.age && (
                                <div>
                                  <div className="text-gray-500 mb-1">Age</div>
                                  <div className="font-medium">{phone.age}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          {phone.description && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wider">Description</h4>
                              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                                {phone.description}
                              </p>
                            </div>
                          )}

                          {/* Action Button */}
                          <Button 
                            onClick={handleContact} 
                            className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-sm"
                          >
                            <Phone className="w-5 h-5 mr-2" />
                            Contact to Buy
                          </Button>
                          <p className="text-xs text-center text-gray-500 mt-2">
                            Available for pickup at Express Phone Hub, Shirur
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Phone, Star, User, Info } from "lucide-react";

interface CallRequestModalProps {
  open: boolean;
  onClose: () => void;
  provider: {
    id: string;
    businessName: string;
    rating: string;
    user: {
      username: string;
    };
  } | null;
}

const timeSlots = [
  "9:00 AM", "11:00 AM", "2:00 PM", 
  "4:00 PM", "6:00 PM", "8:00 PM"
];

export default function CallRequestModal({ 
  open, 
  onClose, 
  provider 
}: CallRequestModalProps) {
  const [callTime, setCallTime] = useState("now");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const { toast } = useToast();

  const callRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/call-request", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Call Request Sent",
        description: "The provider will be notified and will contact you shortly.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed", 
        description: error.message || "Failed to send call request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleConfirmCall = () => {
    if (!provider) return;

    if (callTime === "schedule" && !selectedTimeSlot) {
      toast({
        title: "Time Slot Required",
        description: "Please select a preferred time slot.",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      providerId: provider.id,
      callType: callTime,
      preferredTimeSlot: callTime === "schedule" ? selectedTimeSlot : null,
      customerPhone: "9876543210", // In real app, this would come from user profile
    };

    callRequestMutation.mutate(requestData);
  };

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md slide-up">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Request Call
            <Button variant="ghost" size="icon" onClick={onClose}>
              ×
            </Button>
          </DialogTitle>
          <DialogDescription>
            Connect with your selected service provider
          </DialogDescription>
        </DialogHeader>

        {/* Provider Info */}
        <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{provider.businessName}</p>
            <div className="flex items-center space-x-1">
              <p className="text-sm text-muted-foreground">
                {provider.user.username}
              </p>
              <span>•</span>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-sm ml-1">{provider.rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Options */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">When would you like to connect?</p>
            <RadioGroup value={callTime} onValueChange={setCallTime}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="cursor-pointer flex-1">
                  Call Now
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="schedule" id="schedule" />
                <Label htmlFor="schedule" className="cursor-pointer flex-1">
                  Schedule for Later
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Time Slots */}
          {callTime === "schedule" && (
            <div>
              <p className="text-sm font-medium mb-3">Select Preferred Time Slot</p>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTimeSlot === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeSlot(slot)}
                    data-testid={`timeslot-${slot.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onClose}
            disabled={callRequestMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 flex items-center space-x-2" 
            onClick={handleConfirmCall}
            disabled={callRequestMutation.isPending}
            data-testid="button-confirm-call"
          >
            <Phone className="h-4 w-4" />
            <span>
              {callRequestMutation.isPending ? "Requesting..." : "Request Call"}
            </span>
          </Button>
        </div>

        {/* Info Note */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground flex items-start">
            <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Your phone number will be shared securely. The provider's number will remain confidential.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

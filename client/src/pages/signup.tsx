// client/src/pages/signup.tsx
// Signup = verify phone via SMS OTP, then enter name. If the number already has
// an account, the same flow simply logs the user in.

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";

export default function Signup() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Network className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join Shirur Express to order food, groceries & services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhoneOtpAuth />

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() => setLocation("/login")}
              data-testid="link-login"
            >
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// client/src/components/phone-otp-auth.tsx
// Phone number -> SMS OTP -> (new user: name) / (several accounts: pick one) -> logged in.
// Used by both /login and /signup; the server decides whether the number is new.

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type { ConfirmationResult } from "firebase/auth";
import { Loader2, ArrowLeft, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { sendOtp, confirmOtp, isPhoneAuthConfigured } from "@/lib/firebase";

type Step = "phone" | "otp" | "details" | "select";
type AccountOption = { id: string; username: string; role: string };

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";
const RESEND_SECONDS = 30;

async function postJson(url: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function PhoneOtpAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const showError = (title: string, error: any) =>
    toast({ title, description: error?.message || "Something went wrong.", variant: "destructive" });

  const finishLogin = async (user: any, message: string) => {
    toast({ title: "Success", description: message });
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });

    if (user.role === "admin") setLocation("/admin");
    else if (user.isDeliveryPartner) setLocation("/delivery-partner/dashboard");
    else if (user.role === "provider") setLocation("/provider/dashboard");
    else setLocation("/");
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast({ title: "Invalid number", description: "Enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(phone, RECAPTCHA_CONTAINER_ID);
      setConfirmation(result);
      setOtp("");
      setStep("otp");
      setResendIn(RESEND_SECONDS);
      toast({ title: "OTP sent", description: `We sent a 6-digit code to +91 ${phone}` });
    } catch (error) {
      showError("Could not send OTP", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code = otp) => {
    if (!confirmation || code.length !== 6) return;
    setLoading(true);
    try {
      const idToken = await confirmOtp(confirmation, code);
      const data = await postJson("/api/auth/phone/verify", { idToken });

      if (data.status === "logged_in") {
        await finishLogin(data.user, data.message);
      } else if (data.status === "new_user") {
        setStep("details");
      } else if (data.status === "select_account") {
        setAccounts(data.accounts);
        setStep("select");
      }
    } catch (error) {
      setOtp("");
      showError("Verification failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (name.trim().length < 2) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await postJson("/api/auth/phone/complete-signup", { name: name.trim(), email: email.trim() });
      await finishLogin(data.user, "Welcome to Shirur Express! 🎉");
    } catch (error) {
      showError("Signup failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (userId: string) => {
    setLoading(true);
    try {
      const data = await postJson("/api/auth/phone/select-account", { userId });
      await finishLogin(data.user, data.message);
    } catch (error) {
      showError("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isPhoneAuthConfigured) {
    return (
      <p className="text-sm text-center text-muted-foreground">
        Phone login is temporarily unavailable. Please use password login below.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Invisible reCAPTCHA host required by Firebase Phone Auth */}
      <div id={RECAPTCHA_CONTAINER_ID} />

      {step === "phone" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                +91
              </span>
              <Input
                id="phone"
                className="rounded-l-none"
                placeholder="9876543210"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                data-testid="input-phone"
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleSendOtp} disabled={loading || phone.length !== 10} data-testid="button-send-otp">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </>
      )}

      {step === "otp" && (
        <>
          <button
            type="button"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setStep("phone")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Change number
          </button>
          <div className="space-y-2 text-center">
            <Label>Enter the 6-digit OTP sent to +91 {phone}</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                onComplete={(code: string) => handleVerifyOtp(code)}
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                data-testid="input-otp"
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <Button className="w-full" onClick={() => handleVerifyOtp()} disabled={loading || otp.length !== 6} data-testid="button-verify-otp">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>
          <div className="text-center text-sm">
            {resendIn > 0 ? (
              <span className="text-muted-foreground">Resend OTP in {resendIn}s</span>
            ) : (
              <Button variant="link" className="p-0 h-auto" onClick={handleSendOtp} disabled={loading}>
                Resend OTP
              </Button>
            )}
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <p className="text-sm text-muted-foreground text-center">
            +91 {phone} verified ✅ — just tell us your name to create your account.
          </p>
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus data-testid="input-name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-email" />
          </div>
          <Button className="w-full" onClick={handleCompleteSignup} disabled={loading} data-testid="button-signup">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </>
      )}

      {step === "select" && (
        <>
          <p className="text-sm text-muted-foreground text-center">
            This number has more than one account. Choose which one to log into:
          </p>
          <div className="space-y-2">
            {accounts.map((a) => (
              <Button
                key={a.id}
                variant="outline"
                className="w-full justify-start h-auto py-3"
                disabled={loading}
                onClick={() => handleSelectAccount(a.id)}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                <span className="font-medium">{a.username}</span>
                <span className="ml-auto text-xs text-muted-foreground capitalize">{a.role}</span>
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

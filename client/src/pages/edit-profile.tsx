import { ArrowLeft, Save, User as UserIcon, Mail, Phone, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EditProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Profile Updated", description: "Your profile details have been saved successfully." });
      setLocation("/");
    }, 1000);
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">Edit Profile</h1>
      </header>

      <div className="p-4 max-w-xl mx-auto mt-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-8">
              <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold mb-4 border-4 border-white shadow-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <Button variant="outline" size="sm">Change Photo</Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> Full Name</FormLabel>
                <Input name="username" value={formData.username} onChange={handleChange} required />
              </div>
              
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> Email Address</FormLabel>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} disabled className="bg-slate-50 text-slate-500" />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
              </div>
              
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Phone Number</FormLabel>
                <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="e.g. +91 9876543210" />
              </div>

              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Default Delivery Address</FormLabel>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="Enter your full address" />
              </div>

              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

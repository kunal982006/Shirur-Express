import { ArrowLeft, Info, FileText, ShieldCheck, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GeneralInfo() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">General Info</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4 mt-4">
        
        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-0">
            <Link href="/privacy">
              <div className="flex items-center gap-4 p-4">
                <div className="bg-slate-100 p-3 rounded-full text-slate-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Privacy Policy</h3>
                  <p className="text-sm text-slate-500">Read about how we handle your data</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="bg-slate-100 p-3 rounded-full text-slate-700">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Terms & Conditions</h3>
                <p className="text-sm text-slate-500">Our terms of service</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="bg-slate-100 p-3 rounded-full text-slate-700">
                <Info className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">About Us</h3>
                <p className="text-sm text-slate-500">Learn more about Shirur Express</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-primary/5 border-primary/20 mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Our Office</h3>
                <p className="text-slate-600 mb-1">Shirur Express Headquarters</p>
                <p className="text-slate-500 text-sm">Shirur, Pune District, Maharashtra 412210</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-8 text-sm text-slate-400">
          <p>App Version 1.0.0</p>
          <p>© 2024 Shirur Express. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}

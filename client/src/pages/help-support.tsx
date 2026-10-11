import { ArrowLeft, Phone, Mail, MessageSquare, HeadphonesIcon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpSupport() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">Help & Support</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6 mt-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <HeadphonesIcon className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">How can we help you?</h2>
          <p className="text-muted-foreground mt-2">
            Our support team is always ready to assist you with your queries.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Us Directly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Helpline Number</p>
                <p className="text-lg font-bold text-blue-700">78409 40113</p>
              </div>
              <a href="tel:7840940113">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Call Now</Button>
              </a>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="bg-white p-3 rounded-full text-green-600 shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">WhatsApp Support</p>
                <p className="text-sm text-green-700">Get quick replies on WhatsApp</p>
              </div>
              <a href="https://wa.me/917840940113" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Chat</Button>
              </a>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-100 border">
              <div className="bg-white p-3 rounded-full text-slate-600 shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Email Support</p>
                <p className="text-sm text-slate-600">support@shirurexpress.com</p>
              </div>
              <a href="mailto:support@shirurexpress.com">
                <Button size="sm" variant="outline">Email Us</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

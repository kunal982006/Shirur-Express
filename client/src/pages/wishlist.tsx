import { ArrowLeft, Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Wishlist() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">Your Wishlist</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        <Card className="border-dashed border-2 bg-transparent mt-8">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-16 w-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Looks like you haven't added anything to your wishlist yet. Explore our services and add your favorites!
            </p>
            <Link href="/">
              <Button>Explore Services</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

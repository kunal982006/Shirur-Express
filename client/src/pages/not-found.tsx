import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="text-xl font-bold text-foreground">We couldn't find that page</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be old or the page may have moved. Everything in Shirur is still one tap away.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button className="w-full" onClick={() => navigate("/")}>Go to home</Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/my-bookings")}>
            My orders & bookings
          </Button>
        </div>
      </div>
    </div>
  );
}

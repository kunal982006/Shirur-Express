import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function OrderSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get("type") || "orders";

  useEffect(() => {
    // Fire confetti from the center of the screen
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <Card>
        <CardContent className="p-8 md:p-12">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl md:text-4xl font-bold">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mt-4 mb-8">
            Thank you for your order. You will receive a confirmation and delivery updates shortly.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
            <Link href={`/my-bookings?tab=${type}`}>
              <Button variant="outline">Track Your Order</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
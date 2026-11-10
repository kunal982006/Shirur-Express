import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Navigation } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function OrderSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const type = searchParams.get("type") || "orders";
  const orderId = searchParams.get("orderId");
  const payment = searchParams.get("payment");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const duration = 2000;
    const end = Date.now() + duration;
    let frameId = 0;

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
        frameId = requestAnimationFrame(frame);
      }
    };
    frame();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="max-w-md mx-auto py-10 px-4 text-center">
      <Card>
        <CardContent className="p-6 md:p-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Order placed!</h1>
          {orderId && (
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Order #{orderId.slice(-6).toUpperCase()}
            </p>
          )}
          <p className="text-muted-foreground mt-3 mb-6 text-sm">
            {payment === "cod"
              ? "Please keep cash ready for the delivery partner. "
              : payment === "online"
                ? "Payment received. "
                : ""}
            We'll notify you as your order moves.
          </p>
          <div className="flex flex-col gap-2">
            {orderId ? (
              <Link href={`/order/${orderId}/track`}>
                <Button className="w-full">
                  <Navigation className="mr-2 h-4 w-4" />
                  Track order live
                </Button>
              </Link>
            ) : (
              <Link href={`/my-bookings?tab=${type}`}>
                <Button className="w-full">View your orders</Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline" className="w-full">Back to home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

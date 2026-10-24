import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Global or page-level hook for real-time order status tracking via Server-Sent Events (SSE).
 * Automatically refetches relevant queries as soon as delivery partners or vendors update order status.
 */
export function useLiveOrderTracking(activeOrderId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      try {
        eventSource = new EventSource("/api/orders/live");

        eventSource.onopen = () => {
          console.log("[LiveOrder SSE] Connected to real-time order stream.");
        };

        eventSource.addEventListener("order_update", (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            console.log("[LiveOrder SSE] Live order update received:", data);

            // Invalidate the tracking query for this order
            if (data.orderId) {
              queryClient.invalidateQueries({ queryKey: ["orderTracking", data.orderId] });
            }

            // Invalidate customer orders lists
            queryClient.invalidateQueries({ queryKey: ["/api/customer/restaurant-orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/customer/grocery-orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/customer/my-bookings"] });

            // Invalidate rider orders lists
            queryClient.invalidateQueries({ queryKey: ["riderMyOrders"] });
            queryClient.invalidateQueries({ queryKey: ["riderAvailableOrders"] });

            // Invalidate provider orders lists
            queryClient.invalidateQueries({ queryKey: ["providerRestaurantOrders"] });
            queryClient.invalidateQueries({ queryKey: ["providerGroceryOrders"] });
          } catch (err) {
            console.error("[LiveOrder SSE] Parse error:", err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isMounted) {
            // Reconnect after 3 seconds
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        console.error("[LiveOrder SSE] Connection error:", e);
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient, activeOrderId]);
}

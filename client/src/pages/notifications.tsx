import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import api from "@/lib/api";
import {
    ArrowLeft,
    Bell,
    BellOff,
    Zap,
    Wrench,
    Scissors,
    ShoppingBasket,
    Sandwich,
    UtensilsCrossed,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Notification {
    id: string;
    type: "booking" | "grocery_order" | "street_food_order" | "restaurant_order";
    category: string;
    title: string;
    status: string;
    amount: string | null;
    address: string;
    createdAt: string | null;
}

function getIcon(type: string, category: string) {
    if (type === "booking") {
        if (category === "electrician") return <Zap className="h-5 w-5 text-yellow-500" />;
        if (category === "plumber") return <Wrench className="h-5 w-5 text-blue-500" />;
        if (category === "beauty_parlor") return <Scissors className="h-5 w-5 text-pink-500" />;
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
    if (type === "grocery_order") return <ShoppingBasket className="h-5 w-5 text-green-600" />;
    if (type === "street_food_order") return <Sandwich className="h-5 w-5 text-orange-500" />;
    if (type === "restaurant_order") return <UtensilsCrossed className="h-5 w-5 text-red-500" />;
    return <Package className="h-5 w-5 text-gray-500" />;
}

function getStatusBadge(status: string) {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
        pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
        paid: { label: "Paid", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
        confirmed: { label: "Confirmed", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
        accepted: { label: "Accepted", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
        preparing: { label: "Preparing", variant: "default", icon: <Package className="h-3 w-3" /> },
        ready_for_pickup: { label: "Ready for Pickup", variant: "default", icon: <Package className="h-3 w-3" /> },
        out_for_delivery: { label: "Out for Delivery", variant: "default", icon: <Package className="h-3 w-3" /> },
        delivered: { label: "Delivered", variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
        completed: { label: "Completed", variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
        cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
        declined: { label: "Declined", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
        awaiting_otp: { label: "OTP Verification", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
        in_progress: { label: "In Progress", variant: "default", icon: <Package className="h-3 w-3" /> },
    };

    const s = config[status] || { label: status.replace(/_/g, " "), variant: "secondary" as const, icon: <Clock className="h-3 w-3" /> };

    return (
        <Badge variant={s.variant} className="flex items-center gap-1 text-xs">
            {s.icon}
            {s.label}
        </Badge>
    );
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getNavLink(n: Notification): string {
    if (n.type === "booking") return "/my-bookings";
    if (n.type === "restaurant_order") return `/order/${n.id}/track`;
    return "/"; // fallback
}

export default function NotificationsPage() {
    const { data: notifications, isLoading, isError } = useQuery<Notification[]>({
        queryKey: ["/api/customer/notifications"],
        queryFn: () => api.get("/customer/notifications").then((r: any) => r.data),
    });

    return (
        <div className="min-h-screen bg-background pt-16 pb-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/">
                        <ArrowLeft className="h-6 w-6 cursor-pointer hover:text-primary transition-colors" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Bell className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold">Notifications</h1>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                        <p className="text-muted-foreground text-sm">Loading notifications...</p>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <XCircle className="h-10 w-10 text-red-400 mb-3" />
                        <p className="text-muted-foreground">Failed to load notifications. Please try again later.</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && (!notifications || notifications.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-muted rounded-full p-6 mb-4">
                            <BellOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold mb-1">No notifications yet</h2>
                        <p className="text-muted-foreground text-sm max-w-xs">
                            Your bookings and order updates will appear here.
                        </p>
                    </div>
                )}

                {/* Notifications List */}
                {notifications && notifications.length > 0 && (
                    <div className="space-y-3">
                        {notifications.map((n) => (
                            <Link key={n.id} href={getNavLink(n)}>
                                <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer border-l-4" style={{
                                    borderLeftColor: n.status === 'pending' || n.status === 'paid' ? '#f59e0b'
                                        : n.status === 'completed' || n.status === 'delivered' ? '#22c55e'
                                            : n.status === 'cancelled' || n.status === 'declined' ? '#ef4444'
                                                : '#6366f1'
                                }}>
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="rounded-full bg-muted p-2.5 shrink-0 mt-0.5">
                                            {getIcon(n.type, n.category)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-sm">{n.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.address}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                                    {timeAgo(n.createdAt)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                {getStatusBadge(n.status)}
                                                {n.amount && (
                                                    <span className="text-sm font-bold text-foreground">
                                                        ₹{parseFloat(n.amount).toFixed(0)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

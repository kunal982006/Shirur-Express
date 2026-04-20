import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
    Users,
    ShoppingCart,
    IndianRupee,
    CalendarCheck,
    Store,
    Loader2,
    ShieldCheck,
    Send,
    Bell,
    ShoppingBasket,
    Sandwich,
    UtensilsCrossed,
    Wrench,
    Zap,
    Scissors,
    Package,
    Search,
    AlertCircle,
    TrendingUp,
    Activity,
    BarChart3,
    LogOut,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Signal,
    Crown,
    Star, // ADDED
    Utensils,
    Trash2,
    Image as ImageIcon,
    XCircle,
    Power,
    Phone,
    MapPin,
    ExternalLink,
    Navigation,
    Megaphone,
} from "lucide-react";

import { AdminPromotions } from "@/components/admin-promotions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import AdminStreetFood from "@/components/admin/admin-street-food";

// ─── Types ──────────────────────────────────────────────────────────

interface Stats {
    totalUsers: number;
    totalProviders: number;
    ordersToday: number;
    bookingsToday: number;
    totalOrders: number;
    totalBookings: number;
    revenueToday: string;
}

interface Order {
    id: string;
    userId: string;
    orderType: "grocery" | "street_food" | "restaurant";
    status: string | null;
    amount: string | null;
    deliveryAddress: string;
    createdAt: string | null;
    user?: { username: string; phone: string | null };
    provider?: { businessName: string };
    items?: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>;
    paymentMethod?: string | null;
}

interface Booking {
    id: string;
    userId: string;
    serviceType: string;
    status: string | null;
    userAddress: string;
    userPhone: string;
    estimatedCost: string | null;
    createdAt: string | null;
    notes?: string | null;
    paymentMethod?: string | null;
    user?: { username: string; phone: string | null };
    provider?: { businessName: string; address: string };
    serviceOffering?: { name: string | null; price: string; imageUrl?: string | null } | null;
    problem?: { name: string } | null;
}

interface Provider {
    id: string;
    userId: string;
    businessName: string;
    categoryName: string;
    address: string;
    rating: string | null;
    reviewCount: number | null;
    isVerified: boolean | null;
    isAvailable: boolean | null;
    createdAt: string | null;
}

interface AppUser {
    id: string;
    username: string;
    email: string;
    phone: string | null;
    role: string | null;
    createdAt: string | null;
    businessName?: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function statusColor(s: string | null): string {
    const status = s || "pending";
    const map: Record<string, string> = {
        pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        accepted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        preparing: "bg-violet-500/15 text-violet-400 border-violet-500/30",
        ready_for_pickup: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        out_for_delivery: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
        delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
        declined: "bg-red-500/15 text-red-400 border-red-500/30",
        in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        awaiting_otp: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
    return map[status] || "bg-gray-500/15 text-gray-400 border-gray-500/30";
}

// ─── Mini Bar Chart ────────────────────────────────────────────────

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-[3px] h-10">
            {data.map((val, i) => (
                <div
                    key={i}
                    className={`w-2 rounded-t-sm ${color} transition-all duration-500`}
                    style={{ height: `${(val / max) * 100}%`, minHeight: '2px', opacity: 0.4 + (i / data.length) * 0.6 }}
                />
            ))}
        </div>
    );
}

// ─── Donut Chart ────────────────────────────────────────────────────

function DonutChart({ segments, size = 120 }: {
    segments: { value: number; color: string; label: string }[];
    size?: number;
}) {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                {segments.map((seg, i) => {
                    const pct = seg.value / total;
                    const dashLen = pct * circumference;
                    const gap = circumference - dashLen;
                    const offset = accumulatedOffset;
                    accumulatedOffset += dashLen;
                    return (
                        <circle
                            key={i}
                            cx="50" cy="50" r={radius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={`${dashLen} ${gap}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{total}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient(); // ADDED
    const [activeTab, setActiveTab] = useState<"overview" | "orders" | "bookings" | "providers" | "users" | "broadcast" | "featured" | "street_food" | "promotions">(
        user?.username === "streetfood_admin" ? "street_food" : "overview"
    );
    const [searchQuery, setSearchQuery] = useState("");

    // Featured Tab State
    const [featuredType, setFeaturedType] = useState<"restaurant" | "cake">("restaurant");
    const [featuredSearch, setFeaturedSearch] = useState("");
    const [broadcastAudience, setBroadcastAudience] = useState("everyone");
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Auth guard
    useEffect(() => {
        if (user && user.role !== 'admin') {
            setLocation("/");
        }
    }, [user, setLocation]);

    // Force Dark Mode for Admin Panel
    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    // --- FCM TOKEN SYNC FROM ANDROID APP ---
    useEffect(() => {
        const syncFcmToken = async () => {
            if (typeof window !== 'undefined' && (window as any).AndroidApp) {
                try {
                    const token = (window as any).AndroidApp.getFcmToken();
                    if (token && token.length > 0) {
                        console.log('[FCM Admin] Token from Android:', token.substring(0, 20) + '...');
                        await api.post('/users/fcm-token', { token });
                    }
                } catch (error) {
                    console.error('[FCM Admin] Error syncing token:', error);
                }
            }
        };

        if (user?.id) {
            syncFcmToken();
        }
    }, [user?.id]);
    // --- FCM TOKEN SYNC END ---

    // Queries
    const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
        queryKey: ["/api/admin/stats"],
        queryFn: () => api.get("/admin/stats").then(r => r.data),
        refetchInterval: 30000,
    });

    const { data: orders } = useQuery<Order[]>({
        queryKey: ["/api/admin/orders"],
        queryFn: () => api.get("/admin/orders").then(r => r.data),
    });

    const { data: allBookings } = useQuery<Booking[]>({
        queryKey: ["/api/admin/bookings"],
        queryFn: () => api.get("/admin/bookings").then(r => r.data),
    });

    const { data: providers } = useQuery<Provider[]>({
        queryKey: ["/api/admin/providers"],
        queryFn: () => api.get("/admin/providers").then(r => r.data),
    });

    const { data: allUsers } = useQuery<AppUser[]>({
        queryKey: ["/api/admin/users"],
        queryFn: () => api.get("/admin/users").then(r => r.data),
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await api.delete(`/admin/users/${userId}`);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: "Success", description: "User deleted successfully." });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete user.",
                variant: "destructive"
            });
        }
    });

    const cancelOrderMutation = useMutation({
        mutationFn: async ({ type, id }: { type: string; id: string }) => {
            const res = await api.patch(`/admin/orders/${type}/${id}/cancel`);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: "✅ Order Cancelled", description: "The order has been cancelled." });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            setExpandedOrderId(null);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to cancel order.",
                variant: "destructive",
            });
        },
    });

    const cancelBookingMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await api.patch(`/admin/bookings/${bookingId}/cancel`);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: "✅ Booking Cancelled", description: "The booking has been cancelled." });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to cancel booking.",
                variant: "destructive",
            });
        },
    });

    const broadcastMutation = useMutation({
        mutationFn: (data: { audience: string; title: string; message: string }) =>
            api.post("/admin/broadcast", data).then(r => r.data),
        onSuccess: (data: any) => {
            toast({
                title: "📨 Broadcast Sent!",
                description: `Delivered to ${data.sent}/${data.total} devices`,
            });
            setBroadcastTitle("");
            setBroadcastMessage("");
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.response?.data?.message || "Broadcast failed", variant: "destructive" });
        },
    });

    const { data: searchResults, isLoading: isSearchLoading } = useQuery({
        queryKey: ["/api/admin/search-items", featuredSearch, featuredType],
        queryFn: () => {
            if (!featuredSearch) return [];
            return api.get(`/admin/search-items?query=${featuredSearch}&type=${featuredType}`).then(r => r.data);
        },
        enabled: activeTab === 'featured' && featuredSearch.length > 0,
    });

    // --- PLATFORM STATUS TOGGLE ---
    const { data: platformStatus } = useQuery<{ servicesEnabled: boolean }>({
        queryKey: ["/api/admin/platform-status"],
        queryFn: () => api.get("/admin/platform-status").then(r => r.data),
        refetchInterval: 15000,
    });

    const togglePlatformMutation = useMutation({
        mutationFn: (enabled: boolean) =>
            api.put("/admin/platform-status", { servicesEnabled: enabled }).then(r => r.data),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-status"] });
            toast({
                title: data.servicesEnabled ? "✅ Services OPEN" : "🔴 Services CLOSED",
                description: data.message,
            });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to toggle", variant: "destructive" });
        },
    });

    const togglePopularMutation = useMutation({
        mutationFn: (data: { type: string; id: string; isPopular: boolean }) =>
            api.post("/admin/toggle-popular", data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/search-items"] });
            toast({ title: "Updated", description: "Updated popular status successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to update", variant: "destructive" });
        }
    });

    const handleLogout = async () => {
        try {
            await logout();
            setLocation("/login");
        } catch (e) { }
    };

    // Order type breakdown
    const groceryCount = orders?.filter(o => o.orderType === 'grocery').length || 0;
    const streetFoodCount = orders?.filter(o => o.orderType === 'street_food').length || 0;
    const restaurantCount = orders?.filter(o => o.orderType === 'restaurant').length || 0;

    // Recent activity (latest 8)
    const recentActivity = orders?.slice(0, 8) || [];

    // Filtered data
    const filteredOrders = orders?.filter(o =>
        !searchQuery || o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.orderType.includes(searchQuery.toLowerCase()) ||
        o.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBookings = allBookings?.filter(b => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return b.serviceType.toLowerCase().includes(q) ||
            b.status?.toLowerCase().includes(q) ||
            b.user?.username?.toLowerCase().includes(q) ||
            b.user?.phone?.toLowerCase().includes(q) ||
            b.userPhone?.toLowerCase().includes(q) ||
            b.userAddress?.toLowerCase().includes(q) ||
            b.provider?.businessName?.toLowerCase().includes(q) ||
            b.serviceOffering?.name?.toLowerCase().includes(q) ||
            b.problem?.name?.toLowerCase().includes(q);
    });

    const filteredProviders = providers?.filter(p =>
        !searchQuery || p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = allUsers?.filter(u =>
        !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const baseTabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "bookings", label: "Bookings", icon: CalendarCheck },
        { id: "providers", label: "Providers", icon: Store },
        { id: "users", label: "Users", icon: Users },
        { id: "broadcast", label: "Broadcast", icon: Send },
        { id: "featured", label: "Featured", icon: Star },
        { id: "street_food", label: "Street Food", icon: Sandwich },
        { id: "promotions", label: "Promotions", icon: Megaphone },
    ] as const;

    const tabs = user?.username === "streetfood_admin" 
        ? [{ id: "street_food", label: "Street Food Dashboard", icon: Sandwich }] as const
        : baseTabs;


    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-400">Checking access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">

            {/* ─── Top Nav ─────────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-[#0d1220]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Crown className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Shirur Express</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user?.username === "streetfood_admin" ? "Street Food Vendor Manager" : "Admin Console"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Signal className="h-3 w-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Live</span>
                        </div>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── Tab Nav ─────────────────────────────────────── */}
            <nav className="sticky top-[57px] z-40 bg-[#0d1220]/90 backdrop-blur-xl border-b border-white/5 overflow-x-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => { setActiveTab(t.id); setSearchQuery(""); }}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${activeTab === t.id
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === "overview" && (
                    <>
                        {/* ─── Platform Services Toggle ─── */}
                        <div className={`rounded-2xl border p-5 transition-all duration-500 ${
                            platformStatus?.servicesEnabled !== false
                                ? 'bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border-emerald-500/30'
                                : 'bg-gradient-to-r from-red-900/30 to-red-800/20 border-red-500/30'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                        platformStatus?.servicesEnabled !== false
                                            ? 'bg-emerald-500/20'
                                            : 'bg-red-500/20'
                                    }`}>
                                        <Power className={`h-6 w-6 ${
                                            platformStatus?.servicesEnabled !== false ? 'text-emerald-400' : 'text-red-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold">
                                            Platform Services
                                        </h3>
                                        <p className={`text-sm font-medium ${
                                            platformStatus?.servicesEnabled !== false ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                            {platformStatus?.servicesEnabled !== false ? '🟢 All services are OPEN' : '🔴 All services are CLOSED'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {platformStatus?.servicesEnabled !== false
                                                ? 'Customers can place orders & bookings'
                                                : 'No new orders or bookings will be accepted'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <div className="flex items-center gap-3 cursor-pointer">
                                            <Switch
                                                checked={platformStatus?.servicesEnabled !== false}
                                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                                            />
                                        </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#111827] border-white/10 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                {platformStatus?.servicesEnabled !== false
                                                    ? '🔴 Close All Services?'
                                                    : '✅ Open All Services?'
                                                }
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                {platformStatus?.servicesEnabled !== false
                                                    ? 'This will block all new orders and bookings. Customers will see a "Services Closed" message. Existing orders will not be affected.'
                                                    : 'This will re-enable all services. Customers will be able to place orders and bookings again.'
                                                }
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-0">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => togglePlatformMutation.mutate(!(platformStatus?.servicesEnabled !== false))}
                                                className={platformStatus?.servicesEnabled !== false
                                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                }
                                            >
                                                {togglePlatformMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : null}
                                                {platformStatus?.servicesEnabled !== false ? 'Yes, Close Services' : 'Yes, Open Services'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {statsLoading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="rounded-2xl bg-[#111827] border border-white/5 p-5 animate-pulse">
                                        <div className="h-16 bg-white/5 rounded-lg" />
                                    </div>
                                ))
                            ) : stats ? (
                                <>
                                    {/* Users */}
                                    <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0f172a] border border-white/5 p-5 relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <MiniBarChart data={[3, 5, 4, 7, 6, 8, stats.totalUsers % 10 || 5]} color="bg-blue-400" />
                                            </div>
                                            <p className="text-2xl font-bold">{stats.totalUsers}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
                                        </div>
                                    </div>

                                    {/* Orders Today */}
                                    <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0f172a] border border-white/5 p-5 relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                                                    <ShoppingCart className="h-5 w-5 text-orange-400" />
                                                </div>
                                                <MiniBarChart data={[2, 4, 3, 5, stats.ordersToday % 10 || 2, 6, 4]} color="bg-orange-400" />
                                            </div>
                                            <p className="text-2xl font-bold">{stats.ordersToday}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Orders Today <span className="text-gray-600">/ {stats.totalOrders} total</span></p>
                                        </div>
                                    </div>

                                    {/* Revenue */}
                                    <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0f172a] border border-white/5 p-5 relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                                    <IndianRupee className="h-5 w-5 text-emerald-400" />
                                                </div>
                                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <p className="text-2xl font-bold">₹{parseFloat(stats.revenueToday).toLocaleString("en-IN")}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Revenue Today</p>
                                        </div>
                                    </div>

                                    {/* Providers */}
                                    <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0f172a] border border-white/5 p-5 relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                                                    <Store className="h-5 w-5 text-purple-400" />
                                                </div>
                                                <MiniBarChart data={[1, 3, 2, 4, 5, stats.totalProviders % 10 || 3, 6]} color="bg-purple-400" />
                                            </div>
                                            <p className="text-2xl font-bold">{stats.totalProviders}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Providers <span className="text-gray-600">/ {stats.bookingsToday} bookings today</span></p>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Charts + Activity Row */}
                        <div className="grid lg:grid-cols-3 gap-4">
                            {/* Order Breakdown Donut */}
                            <div className="rounded-2xl bg-[#111827] border border-white/5 p-6">
                                <h3 className="text-sm font-semibold text-gray-300 mb-5 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-gray-500" /> Order Breakdown
                                </h3>
                                <div className="flex items-center justify-center mb-5">
                                    <DonutChart segments={[
                                        { value: groceryCount, color: "#22c55e", label: "Grocery" },
                                        { value: streetFoodCount, color: "#f97316", label: "Street Food" },
                                        { value: restaurantCount, color: "#ef4444", label: "Restaurant" },
                                    ]} size={140} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                            <span className="text-gray-400">Grocery</span>
                                        </div>
                                        <span className="font-medium">{groceryCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                            <span className="text-gray-400">Street Food</span>
                                        </div>
                                        <span className="font-medium">{streetFoodCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                            <span className="text-gray-400">Restaurant</span>
                                        </div>
                                        <span className="font-medium">{restaurantCount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Feed */}
                            <div className="lg:col-span-2 rounded-2xl bg-[#111827] border border-white/5 p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-gray-500" /> Recent Activity
                                    </h3>
                                    <button onClick={() => setActiveTab("orders")} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                        View All <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {recentActivity.length === 0 && (
                                        <p className="text-gray-600 text-sm text-center py-8">No activity yet</p>
                                    )}
                                    {recentActivity.map((o) => (
                                        <div key={o.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${o.orderType === 'grocery' ? 'bg-green-500/15' :
                                                o.orderType === 'street_food' ? 'bg-orange-500/15' : 'bg-red-500/15'
                                                }`}>
                                                {o.orderType === 'grocery' ? <ShoppingBasket className="h-4 w-4 text-green-400" /> :
                                                    o.orderType === 'street_food' ? <Sandwich className="h-4 w-4 text-orange-400" /> :
                                                        <UtensilsCrossed className="h-4 w-4 text-red-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium capitalize">{o.orderType.replace("_", " ")}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(o.status)}`}>
                                                        {(o.status || 'pending').replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-600 font-mono">#{o.id.slice(0, 8)}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {o.amount && <p className="text-sm font-semibold">₹{parseFloat(o.amount).toFixed(0)}</p>}
                                                <p className="text-[10px] text-gray-600">{timeAgo(o.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <button onClick={() => setActiveTab("broadcast")} className="rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 p-5 text-left hover:border-blue-500/40 transition-all group">
                                <Send className="h-6 w-6 text-blue-400 mb-3 group-hover:translate-x-1 transition-transform" />
                                <h4 className="font-semibold text-sm">Send Notification</h4>
                                <p className="text-xs text-gray-500 mt-1">Broadcast to customers & providers</p>
                            </button>
                            <button onClick={() => setActiveTab("providers")} className="rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 p-5 text-left hover:border-purple-500/40 transition-all group">
                                <Store className="h-6 w-6 text-purple-400 mb-3 group-hover:translate-x-1 transition-transform" />
                                <h4 className="font-semibold text-sm">Manage Providers</h4>
                                <p className="text-xs text-gray-500 mt-1">View & verify service providers</p>
                            </button>
                            <button onClick={() => setActiveTab("users")} className="rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 p-5 text-left hover:border-emerald-500/40 transition-all group">
                                <Users className="h-6 w-6 text-emerald-400 mb-3 group-hover:translate-x-1 transition-transform" />
                                <h4 className="font-semibold text-sm">User Management</h4>
                                <p className="text-xs text-gray-500 mt-1">View all registered users</p>
                            </button>
                        </div>
                    </>
                )}

                {/* ═══ NON-OVERVIEW TABS: Search Bar (Exclude Broadcast and Featured) ═══ */}
                {activeTab !== "overview" && activeTab !== "broadcast" && activeTab !== "featured" && activeTab !== "street_food" && (
                    <div className="relative max-w-5xl mx-auto mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#111827] border border-white/5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors shadow-sm"
                        />
                    </div>
                )}

                {/* ═══ ORDERS TAB ═══ */}
                {activeTab === "orders" && (
                    <div className="max-w-5xl mx-auto rounded-3xl bg-[#111827] border border-white/5 overflow-hidden shadow-lg">
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <ShoppingCart className="h-5 w-5 text-gray-400" /> All Orders
                            </h3>
                            <span className="text-sm text-gray-500 px-3 py-1 bg-white/5 rounded-full">{filteredOrders?.length || 0} results</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {!filteredOrders || filteredOrders.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">No orders found</p>
                            ) : filteredOrders.map(o => (
                                <div key={o.id} className="group">
                                    <div 
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${o.orderType === 'grocery' ? 'bg-green-500/15' :
                                            o.orderType === 'street_food' ? 'bg-orange-500/15' : 'bg-red-500/15'
                                            }`}>
                                            {o.orderType === 'grocery' ? <ShoppingBasket className="h-5 w-5 text-green-400" /> :
                                                o.orderType === 'street_food' ? <Sandwich className="h-5 w-5 text-orange-400" /> :
                                                    <UtensilsCrossed className="h-5 w-5 text-red-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-sm text-gray-400">#{o.id.slice(0, 10)}</span>
                                                <span className="text-sm font-medium capitalize text-gray-100">{o.orderType.replace("_", " ")}</span>
                                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${statusColor(o.status)}`}>
                                                    {(o.status || 'pending').replace(/_/g, ' ')}
                                                </span>
                                                {o.paymentMethod === 'cod' && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                                                        COD
                                                    </span>
                                                )}
                                                {o.paymentMethod === 'online' && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase tracking-wider">
                                                        PAID Online
                                                    </span>
                                                )}
                                            </div>
                                            {o.user && (
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-sm text-gray-300 font-medium">{o.user.username}</span>
                                                    {(o.user.phone) && (
                                                        <a
                                                            href={`tel:${o.user.phone}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 active:bg-green-500/35 transition-colors"
                                                        >
                                                            <Phone className="h-3 w-3" />
                                                            {o.user.phone}
                                                        </a>
                                                    )}
                                                    {o.provider && o.provider.businessName && o.provider.businessName !== 'Unknown' && (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                                            <Store className="h-3 w-3" />
                                                            {o.provider.businessName}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {o.provider && o.provider.businessName && o.provider.businessName !== 'Unknown' && !o.user && (
                                                <p className="text-xs text-purple-400 mt-0.5 flex items-center gap-1">
                                                    <Store className="h-3 w-3" />
                                                    {o.provider.businessName}
                                                </p>
                                            )}
                                            {o.deliveryAddress && (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.deliveryAddress)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-start gap-1.5 mt-1 text-xs text-gray-400 hover:text-blue-400 active:text-blue-300 transition-colors group/addr"
                                                >
                                                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-500 group-hover/addr:text-blue-400" />
                                                    <span className="break-words leading-relaxed">{o.deliveryAddress}</span>
                                                    <Navigation className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover/addr:opacity-100 transition-opacity" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0 flex items-center gap-3">
                                            <div>
                                                {o.amount && <p className="text-lg font-bold text-gray-100">₹{parseFloat(o.amount).toFixed(0)}</p>}
                                                <p className="text-[11px] text-gray-500 mt-0.5">{timeAgo(o.createdAt)}</p>
                                            </div>
                                            <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                                                {expandedOrderId === o.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Expandable Order Details */}
                                    {expandedOrderId === o.id && (
                                        <div className="bg-black/20 border-t border-white/5 px-6 py-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-gray-500" /> Order Items ({o.items?.length || 0})
                                                </h4>
                                                {/* Cancel Order Button — only for active orders */}
                                                {o.status && !['cancelled', 'delivered', 'completed'].includes(o.status) && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-1.5 h-auto text-xs font-semibold gap-1.5"
                                                                disabled={cancelOrderMutation.isPending}
                                                            >
                                                                {cancelOrderMutation.isPending ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                )}
                                                                Cancel Order
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-[#111827] border-white/10 text-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-gray-400">
                                                                    This will mark the order as <span className="text-red-400 font-semibold">cancelled</span>. The provider will no longer see it as an active order. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-0">Keep Order</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => cancelOrderMutation.mutate({ type: o.orderType, id: o.id })}
                                                                    className="bg-red-600 hover:bg-red-700 text-white border-0"
                                                                >
                                                                    Yes, Cancel Order
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>

                                            {!o.items || o.items.length === 0 ? (
                                                <p className="text-sm text-gray-500 italic">No items details available.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {o.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                                            <div className="w-12 h-12 rounded-md bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center border border-white/10">
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ImageIcon className="h-5 w-5 text-gray-600" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="text-sm font-medium text-gray-200 truncate">{item.name}</h5>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                                                                    <span className="text-xs font-semibold text-gray-300">₹{parseFloat(item.price as unknown as string).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ BOOKINGS TAB ═══ */}
                {activeTab === "bookings" && (
                    <div className="max-w-5xl mx-auto rounded-3xl bg-[#111827] border border-white/5 overflow-hidden shadow-lg">
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <CalendarCheck className="h-5 w-5 text-gray-400" /> All Bookings
                            </h3>
                            <span className="text-sm text-gray-500 px-3 py-1 bg-white/5 rounded-full">{filteredBookings?.length || 0} results</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {!filteredBookings || filteredBookings.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">No bookings found</p>
                            ) : filteredBookings.map(b => (
                                <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.serviceType === 'electrician' ? 'bg-yellow-500/15' :
                                        b.serviceType === 'plumber' ? 'bg-blue-500/15' : 'bg-pink-500/15'
                                        }`}>
                                        {b.serviceType === 'electrician' ? <Zap className="h-5 w-5 text-yellow-400" /> :
                                            b.serviceType === 'plumber' ? <Wrench className="h-5 w-5 text-blue-400" /> :
                                                <Scissors className="h-5 w-5 text-pink-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-sm text-gray-400">#{b.id.slice(0, 10)}</span>
                                            <span className="text-sm font-medium capitalize text-gray-100">{b.serviceType.replace("_", " ")}</span>
                                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${statusColor(b.status)}`}>
                                                {(b.status || 'pending').replace(/_/g, ' ')}
                                            </span>
                                            {b.paymentMethod === 'cod' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                                                    COD
                                                </span>
                                            )}
                                            {b.paymentMethod === 'online' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase tracking-wider">
                                                    PAID Online
                                                </span>
                                            )}
                                        </div>
                                        {/* Customer Name & Phone */}
                                        {b.user && (
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-sm text-gray-300 font-medium">{b.user.username}</span>
                                                {(b.user.phone || b.userPhone) && (
                                                    <a
                                                        href={`tel:${b.user.phone || b.userPhone}`}
                                                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 active:bg-green-500/35 transition-colors"
                                                    >
                                                        <Phone className="h-3 w-3" />
                                                        {b.user.phone || b.userPhone}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {!b.user && b.userPhone && (
                                            <a
                                                href={`tel:${b.userPhone}`}
                                                className="inline-flex items-center gap-1.5 mt-1 text-sm text-green-400 font-medium hover:text-green-300 active:text-green-200 transition-colors"
                                            >
                                                <Phone className="h-3.5 w-3.5" />
                                                {b.userPhone}
                                            </a>
                                        )}
                                        {/* Service Name */}
                                        {(b.serviceOffering?.name || b.problem?.name) && (
                                            <p className="text-xs text-blue-400 mt-0.5">🔧 {b.serviceOffering?.name || b.problem?.name}</p>
                                        )}
                                        {/* Provider Name */}
                                        {b.provider && <p className="text-xs text-purple-400 mt-0.5">🏪 {b.provider.businessName}</p>}
                                        {/* Address */}
                                        {b.userAddress && (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.userAddress)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-start gap-1.5 mt-1 text-xs text-gray-400 hover:text-blue-400 active:text-blue-300 transition-colors group/addr"
                                            >
                                                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-500 group-hover/addr:text-blue-400" />
                                                <span className="break-words leading-relaxed">{b.userAddress}</span>
                                                <Navigation className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover/addr:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                        {/* Notes */}
                                        {b.notes && <p className="text-xs text-gray-600 mt-0.5 italic break-words">💬 {b.notes}</p>}
                                    </div>
                                    <div className="text-right shrink-0 flex items-center gap-3">
                                        <div>
                                            {b.estimatedCost && <p className="text-lg font-bold text-gray-100">₹{parseFloat(b.estimatedCost).toFixed(0)}</p>}
                                            {b.serviceOffering?.price && !b.estimatedCost && <p className="text-lg font-bold text-gray-100">₹{parseFloat(b.serviceOffering.price).toFixed(0)}</p>}
                                            <p className="text-[11px] text-gray-500 mt-0.5">{timeAgo(b.createdAt)}</p>
                                        </div>
                                        {/* Cancel Booking Button — only for active bookings */}
                                        {b.status && !['cancelled', 'completed'].includes(b.status) && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-red-500/60 hover:text-red-400 hover:bg-red-500/15 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                        disabled={cancelBookingMutation.isPending}
                                                        title="Cancel Booking"
                                                    >
                                                        {cancelBookingMutation.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-[#111827] border-white/10 text-white">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-gray-400">
                                                            This will mark the booking as <span className="text-red-400 font-semibold">cancelled</span>. The service provider will no longer see it as an active booking. This cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-0">Keep Booking</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => cancelBookingMutation.mutate(b.id)}
                                                            className="bg-red-600 hover:bg-red-700 text-white border-0"
                                                        >
                                                            Yes, Cancel Booking
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ PROVIDERS TAB ═══ */}
                {activeTab === "providers" && (
                    <div className="max-w-5xl mx-auto space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <Store className="h-5 w-5 text-gray-400" /> All Providers
                            </h3>
                            <span className="text-sm text-gray-500 px-3 py-1 bg-white/5 rounded-full">{filteredProviders?.length || 0} results</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!filteredProviders || filteredProviders.length === 0 ? (
                                <p className="col-span-full text-center text-gray-600 py-12">No providers found</p>
                            ) : filteredProviders.map(p => (
                                <div key={p.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] hover:border-white/10 transition-all group relative tracking-wide">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 ${p.isAvailable ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-gray-700'
                                                }`}>
                                                {p.businessName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-base text-gray-100">{p.businessName}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">{p.categoryName}</span>
                                                    {p.isVerified && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                                            <ShieldCheck className="h-2.5 w-2.5" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-medium text-gray-200 flex items-center justify-end gap-1">
                                                <Star className="h-3 w-3 text-yellow-500 fill-current" /> {p.rating ? parseFloat(p.rating).toFixed(1) : "New"}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{p.reviewCount || 0} reviews</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl min-w-0 border border-white/[0.02]">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2 text-sm text-gray-400 hover:text-blue-400 active:text-blue-300 transition-colors group/addr"
                                        >
                                            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-500 group-hover/addr:text-blue-400" />
                                            <span className="break-words leading-relaxed flex-1">{p.address}</span>
                                            <Navigation className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60 group-hover/addr:opacity-100 text-blue-400" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ USERS TAB ═══ */}
                {activeTab === "users" && (
                    <div className="max-w-5xl mx-auto space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-gray-400" /> All Users
                            </h3>
                            <span className="text-sm text-gray-500 px-3 py-1 bg-white/5 rounded-full">{filteredUsers?.length || 0} results</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!filteredUsers || filteredUsers.length === 0 ? (
                                <p className="col-span-full text-center text-gray-600 py-12">No users found</p>
                            ) : filteredUsers.map(u => (
                                <div key={u.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] hover:border-white/10 transition-colors relative group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xl shrink-0 shadow-sm">
                                                {(u.role === 'provider' && u.businessName ? u.businessName.charAt(0) : u.username.charAt(0)).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-base text-gray-100">
                                                    {u.role === 'provider' && u.businessName ? u.businessName : u.username}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                                        u.role === 'provider' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                                                            'bg-white/5 text-gray-400 border-white/10'
                                                        }`}>
                                                        {u.role || 'customer'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{timeAgo(u.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500/70 hover:text-red-400 hover:bg-red-500/20 rounded-xl opacity-0 flex-shrink-0 group-hover:opacity-100 transition-all focus:opacity-100 xl:translate-x-2 group-hover:translate-x-0">
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#111827] border-white/10 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-gray-400">
                                                        This action cannot be undone. This will permanently delete the user account entirely, including their provider profile if applicable.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-0 mt-2 sm:mt-0">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteUserMutation.mutate(u.id)} className="bg-red-600 hover:bg-red-700 text-white border-0">
                                                        Delete User
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl flex flex-col gap-2 min-w-0 border border-white/[0.02]">
                                        <p className="text-sm text-gray-400 break-words">
                                            <span className="font-medium text-gray-500">Email:</span> {u.email}
                                        </p>
                                        {(u.phone || (u.role === 'provider' && u.username)) && (
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {u.phone && (
                                                    <a
                                                        href={`tel:${u.phone}`}
                                                        className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 active:bg-green-500/35 transition-colors"
                                                    >
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {u.phone}
                                                    </a>
                                                )}
                                                {u.role === 'provider' && u.username && (
                                                    <span className="text-sm text-gray-400"><span className="font-medium text-gray-500">User:</span> @{u.username}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ BROADCAST TAB ═══ */}
                {activeTab === "broadcast" && (
                    <div className="max-w-2xl mx-auto">
                        <div className="rounded-2xl bg-[#111827] border border-white/5 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Bell className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Broadcast Notification</h3>
                                    <p className="text-xs text-gray-500">Send push notification to your users</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Audience */}
                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {[
                                            { id: 'everyone', icon: '🌐', label: 'Everyone' },
                                            { id: 'customers', icon: '👤', label: 'Customers' },
                                            { id: 'providers', icon: '🏪', label: 'Providers' },
                                            { id: 'restaurants', icon: '🍽️', label: 'Restaurants' },
                                            { id: 'street_food', icon: '🌮', label: 'Street Food' },
                                        ].map(a => (
                                            <button
                                                key={a.id}
                                                onClick={() => setBroadcastAudience(a.id)}
                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${broadcastAudience === a.id
                                                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                                                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <span>{a.icon}</span> {a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
                                    <input
                                        placeholder="e.g. 🎉 Big Sale Today!"
                                        value={broadcastTitle}
                                        onChange={(e) => setBroadcastTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 block">Message</label>
                                    <textarea
                                        placeholder="Write your message..."
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                                    />
                                </div>

                                {/* Preview */}
                                {broadcastTitle && (
                                    <div className="rounded-xl bg-black/30 border border-white/5 p-4">
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Notification Preview</p>
                                        <div className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                                <Bell className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{broadcastTitle}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{broadcastMessage || "..."}</p>
                                                <p className="text-[10px] text-gray-600 mt-1">Just now • Shirur Express</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Send Button */}
                                <button
                                    onClick={() => broadcastMutation.mutate({
                                        audience: broadcastAudience,
                                        title: broadcastTitle,
                                        message: broadcastMessage,
                                    })}
                                    disabled={!broadcastTitle || !broadcastMessage || broadcastMutation.isPending}
                                    className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${!broadcastTitle || !broadcastMessage
                                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
                                        }`}
                                >
                                    {broadcastMutation.isPending ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send className="h-4 w-4" /> Send to {broadcastAudience.replace("_", " ")}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ FEATURED TAB ═══ */}
                {activeTab === "featured" && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Type Selection */}
                        <div className="flex gap-2">
                            {(['restaurant', 'cake', 'street_food_vendor'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => { setFeaturedType(type); setFeaturedSearch(""); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${featuredType === type
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {type === 'restaurant' ? 'Restaurants' : type === 'cake' ? 'Cakes' : 'Street Food'}
                                </button>
                            ))}
                        </div>

                        {/* Search to filter providers */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                placeholder={`Filter ${featuredType.replace("_", " ")} vendors...`}
                                value={featuredSearch}
                                onChange={(e) => setFeaturedSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111827] border border-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        {/* Providers List Accordion */}
                        <div className="space-y-3">
                            {providers?.filter(p => {
                                const catName = p.categoryName?.toLowerCase() || "";
                                // Temporary debug:
                                if (p.businessName?.toLowerCase().includes('abhiruchi')) {
                                    console.log("Found Abhiruchi! Category is:", catName, "ID:", p.id);
                                }

                                // Filter providers based on the selected type
                                if (featuredType === 'restaurant' && !catName.includes('restaurant')) return false;
                                if (featuredType === 'cake' && !catName.includes('cake')) return false;
                                if (featuredType === 'street_food_vendor' && !catName.includes('street')) return false;

                                // Filter by search term
                                if (featuredSearch && !p.businessName?.toLowerCase().includes(featuredSearch.toLowerCase())) return false;

                                return true;
                            }).map(provider => (
                                <ProviderFeaturedAccordion
                                    key={provider.id.toString() + featuredType}
                                    provider={provider}
                                    type={featuredType as "restaurant" | "cake" | "street_food_vendor"}
                                />
                            ))}
                            {providers?.filter(p => {
                                const catName = p.categoryName?.toLowerCase() || "";
                                return (featuredType === 'restaurant' && catName.includes('restaurant')) ||
                                    (featuredType === 'cake' && catName.includes('cake')) ||
                                    (featuredType === 'street_food_vendor' && catName.includes('street'));
                            }).length === 0 && (
                                    <div className="py-12 text-center text-gray-600 bg-[#111827] rounded-xl border border-white/5">
                                        No providers found for this category.
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {/* ═══ STREET FOOD TAB ═══ */}
                {activeTab === "street_food" && (
                     <AdminStreetFood />
                )}

                {/* ═══ PROMOTIONS TAB ═══ */}
                {activeTab === "promotions" && (
                     <AdminPromotions />
                )}

            </main>
        </div>
    );
}

// ─── Sub-component for Featured Section Providers ──────────────────
function ProviderFeaturedAccordion({ provider, type }: { provider: Provider, type: "street_food_vendor" | "restaurant" | "cake" }) {
    const { toast } = useToast();
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: menuItems, isLoading } = useQuery({
        queryKey: [`/api/admin/provider-menu/${type}/${provider.id}`],
        queryFn: () => api.get(`/admin/provider-menu/${type === 'street_food_vendor' ? 'street_food' : type}/${provider.id}`).then(r => r.data),
        enabled: isExpanded,
    });

    const togglePopularMutation = useMutation({
        mutationFn: (data: { type: string, id: string, isPopular: boolean, popularOrder?: number }) =>
            api.post("/admin/toggle-popular", data).then(r => r.data),
        onSuccess: (updatedItem) => {
            toast({
                title: "Updated",
                description: `${updatedItem.name || updatedItem.businessName} ${updatedItem.isPopular ? 'added to' : 'removed from'} popular items.`
            });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to update item", variant: "destructive" });
        }
    });

    // We manually update the local cache so the checkbox toggles instantly visually
    const queryClient = useQueryClient();
    
    const handleItemToggle = (item: any) => {
        const newIsPopular = !item.isPopular;

        // Optimistic update
        queryClient.setQueryData(
            [`/api/admin/provider-menu/${type}/${provider.id}`],
            (oldData: any[]) => oldData?.map(i => i.id === item.id ? { ...i, isPopular: newIsPopular } : i)
        );

        togglePopularMutation.mutate({
            type: type === 'street_food_vendor' ? 'street_food' : type,
            id: item.id,
            isPopular: newIsPopular
        });
    };

    const handleItemOrderChange = (item: any, newOrder: number) => {
        // Optimistic update
        queryClient.setQueryData(
            [`/api/admin/provider-menu/${type}/${provider.id}`],
            (oldData: any[]) => oldData?.map(i => i.id === item.id ? { ...i, popularOrder: newOrder } : i)
        );

        togglePopularMutation.mutate({
            type: type === 'street_food_vendor' ? 'street_food' : type,
            id: item.id,
            isPopular: item.isPopular,
            popularOrder: newOrder
        });
    };

    const handleProviderToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent accordion expansion
        const newIsPopular = !provider.isPopular;
        togglePopularMutation.mutate({
            type: type === 'restaurant' ? 'restaurant' : 'street_food_vendor', // type='cake' doesn't usually toggle the provider but we fallback to it if needed
            id: provider.id,
            isPopular: newIsPopular
        });
        
        // Optimistic update for provider
        queryClient.setQueryData(["/api/admin/service-providers"], (oldData: any[]) => {
            if (!oldData) return oldData;
            return oldData.map(p => p.id === provider.id ? { ...p, isPopular: newIsPopular } : p);
        });
    };

    return (
        <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden transition-all">
            {/* Header / Clickable row */}
            <div
                className="flex items-center p-4 cursor-pointer hover:bg-white/[0.02]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center border border-white/10">
                        {provider.profileImageUrl ? (
                            <img src={provider.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Store className="h-5 w-5 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">{provider.businessName}</h4>
                        <p className="text-xs text-gray-400">
                            {type === 'street_food_vendor' && "Street Food Vendor"}
                            {type === 'restaurant' && "Restaurant Provider"}
                            {type === 'cake' && "Cake Baker"}
                        </p>
                    </div>
                </div>
                
                {/* Switch for the Provider itself */}
                {type === 'restaurant' && (
                    <div className="flex items-center gap-3 mr-4" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-400">Popular Vendor</span>
                        <Switch
                            checked={provider.isPopular || false}
                            onCheckedChange={() => handleProviderToggle({ stopPropagation: () => {} } as React.MouseEvent)}
                            disabled={togglePopularMutation.isPending}
                            className={`${provider.isPopular ? 'bg-yellow-500' : 'bg-gray-700'}`}
                        />
                    </div>
                )}

                <div className="flex flex-col items-end">
                    <span className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded-md mb-1 border border-blue-500/20">
                        {isExpanded ? "Hide Menu" : "View Menu"}
                    </span>
                    {/* Add a chevron here if wanted in the future */}
                </div>
            </div>

            {/* Expandable Content (Menu Items) */}
            {isExpanded && (
                <div className="border-t border-white/5 bg-black/20 p-4">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
                    ) : !menuItems || !Array.isArray(menuItems) || menuItems.length === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-500">
                            This provider has no items added yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {menuItems.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 group">
                                    <div className="flex items-center gap-3 w-full pr-4">
                                        <div className="w-10 h-10 rounded-md bg-gray-800 overflow-hidden shrink-0">
                                            {(item.imageUrl || item.images?.[0]) ? (
                                                <img src={item.imageUrl || item.images?.[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-gray-600" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 truncate">
                                            <h5 className="text-sm font-medium truncate pr-2">{item.name}</h5>
                                            <p className="text-xs text-gray-500">₹{item.price}</p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <div className="flex items-center justify-end shrink-0 gap-3">
                                        {item.isPopular && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">Order:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-16 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                                                    defaultValue={item.popularOrder || 0}
                                                    onBlur={(e) => {
                                                        const newVal = parseInt(e.target.value) || 0;
                                                        if (newVal !== item.popularOrder) {
                                                            handleItemOrderChange(item, newVal);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <Switch
                                            checked={item.isPopular}
                                            onCheckedChange={() => handleItemToggle(item)}
                                            disabled={togglePopularMutation.isPending}
                                            className={`${item.isPopular ? 'bg-yellow-500' : 'bg-gray-700'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

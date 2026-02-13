import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
    Signal,
    Crown,
} from "lucide-react";

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
    const [activeTab, setActiveTab] = useState<"overview" | "orders" | "bookings" | "providers" | "users" | "broadcast">("overview");
    const [searchQuery, setSearchQuery] = useState("");
    const [broadcastAudience, setBroadcastAudience] = useState("everyone");
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastMessage, setBroadcastMessage] = useState("");

    // Auth guard
    useEffect(() => {
        if (user && user.role !== 'admin') {
            setLocation("/");
        }
    }, [user, setLocation]);

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

    const filteredBookings = allBookings?.filter(b =>
        !searchQuery || b.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProviders = providers?.filter(p =>
        !searchQuery || p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = allUsers?.filter(u =>
        !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "bookings", label: "Bookings", icon: CalendarCheck },
        { id: "providers", label: "Providers", icon: Store },
        { id: "users", label: "Users", icon: Users },
        { id: "broadcast", label: "Broadcast", icon: Send },
    ] as const;

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
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Console</p>
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

                {/* ═══ NON-OVERVIEW TABS: Search Bar ═══ */}
                {activeTab !== "overview" && activeTab !== "broadcast" && (
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111827] border border-white/5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                )}

                {/* ═══ ORDERS TAB ═══ */}
                {activeTab === "orders" && (
                    <div className="rounded-2xl bg-[#111827] border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-gray-500" /> All Orders
                            </h3>
                            <span className="text-xs text-gray-600">{filteredOrders?.length || 0} results</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {!filteredOrders || filteredOrders.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">No orders found</p>
                            ) : filteredOrders.map(o => (
                                <div key={o.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${o.orderType === 'grocery' ? 'bg-green-500/15' :
                                            o.orderType === 'street_food' ? 'bg-orange-500/15' : 'bg-red-500/15'
                                        }`}>
                                        {o.orderType === 'grocery' ? <ShoppingBasket className="h-4 w-4 text-green-400" /> :
                                            o.orderType === 'street_food' ? <Sandwich className="h-4 w-4 text-orange-400" /> :
                                                <UtensilsCrossed className="h-4 w-4 text-red-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs text-gray-500">#{o.id.slice(0, 10)}</span>
                                            <span className="text-xs text-gray-400 capitalize">{o.orderType.replace("_", " ")}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(o.status)}`}>
                                                {(o.status || 'pending').replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {o.deliveryAddress && <p className="text-xs text-gray-600 mt-0.5 truncate">{o.deliveryAddress}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                        {o.amount && <p className="text-sm font-semibold">₹{parseFloat(o.amount).toFixed(0)}</p>}
                                        <p className="text-[10px] text-gray-600">{timeAgo(o.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ BOOKINGS TAB ═══ */}
                {activeTab === "bookings" && (
                    <div className="rounded-2xl bg-[#111827] border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <CalendarCheck className="h-4 w-4 text-gray-500" /> All Bookings
                            </h3>
                            <span className="text-xs text-gray-600">{filteredBookings?.length || 0} results</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {!filteredBookings || filteredBookings.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">No bookings found</p>
                            ) : filteredBookings.map(b => (
                                <div key={b.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${b.serviceType === 'electrician' ? 'bg-yellow-500/15' :
                                            b.serviceType === 'plumber' ? 'bg-blue-500/15' : 'bg-pink-500/15'
                                        }`}>
                                        {b.serviceType === 'electrician' ? <Zap className="h-4 w-4 text-yellow-400" /> :
                                            b.serviceType === 'plumber' ? <Wrench className="h-4 w-4 text-blue-400" /> :
                                                <Scissors className="h-4 w-4 text-pink-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs text-gray-500">#{b.id.slice(0, 10)}</span>
                                            <span className="text-xs text-gray-400 capitalize">{b.serviceType.replace("_", " ")}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(b.status)}`}>
                                                {(b.status || 'pending').replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {b.userAddress && <p className="text-xs text-gray-600 mt-0.5 truncate">{b.userAddress}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                        {b.estimatedCost && <p className="text-sm font-semibold">₹{parseFloat(b.estimatedCost).toFixed(0)}</p>}
                                        <p className="text-[10px] text-gray-600">{timeAgo(b.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ PROVIDERS TAB ═══ */}
                {activeTab === "providers" && (
                    <div className="rounded-2xl bg-[#111827] border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Store className="h-4 w-4 text-gray-500" /> All Providers
                            </h3>
                            <span className="text-xs text-gray-600">{filteredProviders?.length || 0} results</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {!filteredProviders || filteredProviders.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">No providers found</p>
                            ) : filteredProviders.map(p => (
                                <div key={p.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${p.isAvailable ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gray-700'
                                        }`}>
                                        {p.businessName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold">{p.businessName}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">{p.categoryName}</span>
                                            {p.isVerified && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                                    <ShieldCheck className="h-2.5 w-2.5" /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-0.5 truncate">{p.address}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-medium">⭐ {p.rating ? parseFloat(p.rating).toFixed(1) : "—"}</p>
                                        <p className="text-[10px] text-gray-600">{p.reviewCount || 0} reviews</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ USERS TAB ═══ */}
                {activeTab === "users" && (
                    <div className="rounded-2xl bg-[#111827] border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" /> All Users
                            </h3>
                            <span className="text-xs text-gray-600">{filteredUsers?.length || 0} results</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {!filteredUsers || filteredUsers.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">No users found</p>
                            ) : filteredUsers.map(u => (
                                <div key={u.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-blue-300 font-bold text-sm shrink-0">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold">{u.username}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                                    u.role === 'provider' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                                                        'bg-white/5 text-gray-400 border-white/10'
                                                }`}>
                                                {u.role || 'customer'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-0.5">{u.email} {u.phone ? `• ${u.phone}` : ""}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] text-gray-600">{timeAgo(u.createdAt)}</p>
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

            </main>
        </div>
    );
}

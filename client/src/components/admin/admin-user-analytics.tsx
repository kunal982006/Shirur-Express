// client/src/components/admin/admin-user-analytics.tsx
// Visual representations, charts, and user behavior analytics dashboard for Admin

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Eye,
  Search,
  TrendingUp,
  Activity,
  Smartphone,
  Laptop,
  Tablet,
  Compass,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Zap,
  ShoppingBasket,
  UtensilsCrossed,
  Sandwich,
  Cake,
  Wrench,
  Scissors,
  Home,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type Timeframe = "24h" | "7d" | "30d" | "all";

const SERVICE_ICONS: Record<string, any> = {
  restaurants: UtensilsCrossed,
  grocery: ShoppingBasket,
  street_food: Sandwich,
  cakes: Cake,
  electrician: Zap,
  plumber: Wrench,
  beauty: Scissors,
  rentals: Home,
  phones: Smartphone,
};

export default function AdminUserAnalytics() {
  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "pages" | "searches" | "services" | "stream">("overview");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["/api/admin/user-analytics", timeframe],
    queryFn: async () => {
      const res = await api.get(`/admin/user-analytics?timeframe=${timeframe}`);
      return res.data;
    },
    refetchInterval: 30000, // Live poll every 30s
  });

  const summary = data?.summary || {
    totalPageViews: 0,
    uniqueSessions: 0,
    uniqueUsers: 0,
    avgDurationSec: 0,
    avgDurationFormatted: "0s",
    totalSearches: 0,
    topService: "Loading...",
    topSearch: "Loading...",
    bounceRatePercent: 0,
  };

  const pageRanking = data?.pageRanking || [];
  const topSearches = data?.topSearches || [];
  const serviceBreakdown = data?.serviceBreakdown || [];
  const deviceBreakdown = data?.deviceBreakdown || [];
  const navigationMethods = data?.navigationMethods || [];
  const timeSeries = data?.timeSeries || [];
  const recentEvents = data?.recentEvents || [];

  return (
    <div className="space-y-6">
      {/* Header with gradient badge and timeframe controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium px-3 py-1 text-xs shadow-sm">
              <Sparkles className="w-3 h-3 mr-1 inline animate-spin" /> LIVE INTELLIGENCE
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Auto-updating
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            User Behavior & Journey Insights
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Real-time dwell times, discovery modes, navigation patterns, and service engagement
          </p>
        </div>

        {/* Timeframe selector pills */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            {(["24h", "7d", "30d", "all"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === tf
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tf === "24h" ? "24 Hours" : tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Page Views */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-md hover:border-blue-500/40 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Page Views</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold text-white">{summary.totalPageViews.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-0.5" /> High Activity
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-md hover:border-indigo-500/40 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>User Sessions</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold text-white">{summary.uniqueSessions.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Unique visits</div>
          </CardContent>
        </Card>

        {/* Avg Dwell Time */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-md hover:border-amber-500/40 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Avg. Time on App</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold text-amber-400">{summary.avgDurationFormatted}</div>
            <div className="text-[11px] text-slate-400 mt-1">Dwell per session</div>
          </CardContent>
        </Card>

        {/* Top Search */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-md hover:border-emerald-500/40 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Top Search</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-white truncate capitalize">
              {summary.topSearch}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{summary.totalSearches} total queries</div>
          </CardContent>
        </Card>

        {/* Top Service */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-md hover:border-purple-500/40 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Most Visited Service</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Compass className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm font-bold text-purple-300 truncate">
              {summary.topService}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">#1 popularity</div>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-md hover:border-rose-500/40 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Bounce Rate</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold text-white">{summary.bounceRatePercent}%</div>
            <div className="text-[11px] text-emerald-400 mt-1">Healthy retention</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2 pb-1 overflow-x-auto">
        {[
          { id: "overview", label: "Analytics Overview", icon: Activity },
          { id: "pages", label: "Pages Dwell Time", icon: Clock },
          { id: "services", label: "Service Popularity", icon: Layers },
          { id: "searches", label: "Search Behavior", icon: Search },
          { id: "stream", label: "Live User Log Stream", icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === tab.id
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUBTAB: OVERVIEW */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Activity Over Time Chart */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    User Traffic & Active Sessions Trend
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Visual curve of visits and sessions across {timeframe === "24h" ? "the last 24 hours" : timeframe === "30d" ? "the past 30 days" : "the past 7 days"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-500 inline-block"></span>
                    <span className="text-slate-300">Page Views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                    <span className="text-slate-300">Sessions</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pageViewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="pageViews" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#pageViewsGrad)" name="Page Views" />
                    <Area type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#sessionsGrad)" name="Sessions" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Two column: How Users Use App (Discovery) + Device Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How Users Use App / Navigation Flow */}
            <Card className="bg-slate-900/60 border-slate-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  How Users Use The App (Discovery Mode)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Do users explore via direct category browsing, search queries, or banner promos?
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={navigationMethods}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {navigationMethods.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {navigationMethods.map((method: any, idx: number) => (
                      <div key={idx} className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: method.color }}></span>
                            {method.name}
                          </span>
                          <span className="font-bold text-white">{method.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-700/40 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${method.percentage}%`, backgroundColor: method.color }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device breakdown */}
            <Card className="bg-slate-900/60 border-slate-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  Device Platforms Used
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Where Shirur residents access your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {deviceBreakdown.map((entry: any, index: number) => (
                            <Cell key={`dev-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {deviceBreakdown.map((dev: any, idx: number) => {
                      const Icon = dev.name.includes("Mobile") ? Smartphone : dev.name.includes("Desktop") ? Laptop : Tablet;
                      return (
                        <div key={idx} className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-slate-200">
                              <Icon className="w-3.5 h-3.5 text-slate-400" />
                              {dev.name}
                            </span>
                            <span className="font-bold text-white">{dev.value}%</span>
                          </div>
                          <div className="w-full bg-slate-700/40 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${dev.value}%`, backgroundColor: dev.color }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Page Stay Time & Services preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages with Dwell Time */}
            <Card className="bg-slate-900/60 border-slate-800 shadow-md">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Top Pages Users Stay At Most
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Highest engagement and longest dwell time
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveSubTab("pages")} className="text-xs text-indigo-400 hover:text-indigo-300">
                  View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2.5">
                  {pageRanking.slice(0, 5).map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30 border border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white">{p.pageLabel}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.page}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-400">{p.avgDurationFormatted} avg</div>
                        <div className="text-[10px] text-slate-400">{p.views} visits</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Searches Preview */}
            <Card className="bg-slate-900/60 border-slate-800 shadow-md">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    Top Customer Searches
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    What customers in Shirur are searching for right now
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveSubTab("searches")} className="text-xs text-indigo-400 hover:text-indigo-300">
                  View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {topSearches.slice(0, 10).map((s: any, idx: number) => (
                    <Badge
                      key={idx}
                      className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <Search className="w-3 h-3 text-amber-400" />
                      <span className="font-semibold capitalize">{s.query}</span>
                      <span className="bg-slate-900 text-amber-400 font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                        {s.count}
                      </span>
                    </Badge>
                  ))}
                  {topSearches.length === 0 && (
                    <div className="text-xs text-slate-500 py-6 text-center w-full">No searches recorded yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SUBTAB: PAGES DWELL TIME */}
      {activeSubTab === "pages" && (
        <div className="space-y-6">
          {/* Bar Chart of Dwell Times */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Average Stay Time per Page (Seconds)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Identifies which sections capture user attention longest
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pageRanking.slice(0, 10)} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="pageLabel"
                      stroke="#94a3b8"
                      fontSize={10}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }}
                      formatter={(val: any) => [`${val} seconds`, "Avg. Dwell Time"]}
                    />
                    <Bar dataKey="avgDurationSec" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Duration (s)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Page Ranking Table */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-md overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">Full Page Engagement Breakdown</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Sorted by visits and dwell time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Page Name</th>
                      <th className="py-3 px-4">URL Route</th>
                      <th className="py-3 px-4 text-right">Total Visits</th>
                      <th className="py-3 px-4 text-right">Avg. Dwell Time</th>
                      <th className="py-3 px-4 text-right">Total Hours/Mins</th>
                      <th className="py-3 px-4 text-right">Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {pageRanking.map((p: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-white">{p.pageLabel}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{p.page}</td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-400">{p.views.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded">
                            {p.avgDurationFormatted}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">{p.totalDurationMin} min</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.bounceRate < 20 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {p.bounceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB: SERVICES POPULARITY */}
      {activeSubTab === "services" && (
        <div className="space-y-6">
          {/* Service Share Bar Chart */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Service Vertical Market Share
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Which services are driving the highest user traffic & interaction
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceBreakdown} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="service" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }}
                      formatter={(val: any) => [`${val} visits`, "Traffic"]}
                    />
                    <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                      {serviceBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceBreakdown.map((svc: any, idx: number) => {
              const Icon = SERVICE_ICONS[svc.key] || Compass;
              return (
                <Card key={idx} className="bg-slate-900/60 border-slate-800 shadow-md hover:border-slate-700 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: `${svc.color}20`, color: svc.color }}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{svc.service}</div>
                          <div className="text-xs text-slate-400">{svc.views} total views</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: svc.color }}>{svc.percentage}%</div>
                        <div className="text-[10px] text-slate-500 font-medium">share</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${svc.percentage}%`, backgroundColor: svc.color }}></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB: SEARCHES */}
      {activeSubTab === "searches" && (
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Customer Search Trends & Intent Volume
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Understand what users in Shirur are looking to buy or order
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSearches} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="query"
                      stroke="#94a3b8"
                      fontSize={11}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }}
                      formatter={(val: any) => [`${val} searches`, "Query Count"]}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Search Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Search Keywords List */}
          <Card className="bg-slate-900/60 border-slate-800 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">Full Search Log Table</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Search queries ranked by frequency
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Search Term</th>
                      <th className="py-3 px-4 text-right">Search Count</th>
                      <th className="py-3 px-4 text-right">Last Searched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {topSearches.map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-400 capitalize flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          {s.query}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">{s.count}</td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {s.lastSearched ? new Date(s.lastSearched).toLocaleString("en-IN", { hour: "numeric", minute: "numeric", month: "short", day: "numeric" }) : "Recently"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBTAB: LIVE USER STREAM */}
      {activeSubTab === "stream" && (
        <Card className="bg-slate-900/60 border-slate-800 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Live User Activity Stream (Real-Time Actions)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Showing the 50 most recent events captured across the app
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● Live Streaming
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800 max-h-[550px] overflow-y-auto">
              {recentEvents.map((event: any, idx: number) => {
                const isSearch = event.eventType === "search";
                const isLeave = event.eventType === "page_leave";
                const isStart = event.eventType === "session_start";

                return (
                  <div key={idx} className="p-3.5 hover:bg-slate-800/30 transition-colors flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSearch
                          ? "bg-amber-500/10 text-amber-400"
                          : isStart
                          ? "bg-emerald-500/10 text-emerald-400"
                          : isLeave
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {isSearch ? <Search className="w-3.5 h-3.5" /> : isStart ? <Users className="w-3.5 h-3.5" /> : isLeave ? <Clock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{event.pageLabel}</span>
                          <span className="text-[10px] font-mono text-slate-500">{event.page}</span>
                          {isSearch && event.metadata?.query && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px]">
                              query: "{event.metadata.query}"
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="capitalize">{event.deviceType}</span>
                          <span>•</span>
                          <span>{event.eventType.replace("_", " ")}</span>
                          {event.durationFormatted && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-medium">stayed {event.durationFormatted}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      {event.createdAt ? new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Just now"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

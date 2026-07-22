import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  CircleDollarSign, 
  Receipt, 
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Percent,
  Coins,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { DashboardStats, ParkingRecord } from "../types";

interface WeeklyTrendItem {
  date: string;
  day: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface DashboardProps {
  token: string;
  onNavigateToTab: (tab: string) => void;
  t: (key: any) => string;
  language: string;
  privacyMode?: boolean;
}

export default function Dashboard({ token, onNavigateToTab, t, language, privacyMode }: DashboardProps) {
  // Pre-load from cache for sub-millisecond, offline-capable startup
  const [stats, setStats] = useState<DashboardStats | null>(() => {
    const cached = localStorage.getItem("cattlehaven_cached_dashboard_stats");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  });

  const formatMoney = (val: number) => {
    if (privacyMode) return "••••••";
    return `ETB ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  const [activeRecords, setActiveRecords] = useState<ParkingRecord[]>(() => {
    const cached = localStorage.getItem("cattlehaven_cached_active_records");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendItem[]>(() => {
    const cached = localStorage.getItem("cattlehaven_cached_weekly_trend");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const cachedStats = localStorage.getItem("cattlehaven_cached_dashboard_stats");
    return !cachedStats; // Only block with a spinner on first-time login
  });
  const [refreshing, setRefreshing] = useState(false);

  // Quick Report Expense State
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState<number | "">("");
  const [expCategory, setExpCategory] = useState("OPERATIONAL");
  const [expDate, setExpDate] = useState("");
  const [expError, setExpError] = useState<string | null>(null);
  const [expSuccess, setExpSuccess] = useState<string | null>(null);
  const [expSubmitting, setExpSubmitting] = useState(false);

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);
    setExpSuccess(null);

    if (!expDescription.trim() || expAmount === "" || expAmount <= 0) {
      setExpError(language === "am" ? "እባክዎ ትክክለኛ መግለጫ እና መጠን ያስገቡ።" : "Please fill in a valid description and amount.");
      return;
    }

    setExpSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: expDescription,
          amount: Number(expAmount),
          category: expCategory,
          date: expDate ? new Date(expDate).toISOString() : new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExpSuccess(language === "am" ? "ወጪው በተሳካ ሁኔታ ተመዝግቧል!" : "Expense registered successfully!");
        setExpDescription("");
        setExpAmount("");
        setExpCategory("OPERATIONAL");
        setExpDate("");
        
        // Refresh dashboard statistics and charts instantly!
        fetchDashboardData();
        
        setTimeout(() => {
          setExpSuccess(null);
          setShowQuickExpense(false);
        }, 1500);
      } else {
        setExpError(data.error || "Failed to register expense.");
      }
    } catch (err) {
      setExpError("Network error. Please try again.");
    } finally {
      setExpSubmitting(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();

      // Fetch active records for quick monitoring
      const activeRes = await fetch("/api/parking/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeData = await activeRes.json();

      // Fetch weekly trend
      const trendRes = await fetch("/api/dashboard/weekly-trend", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trendData = await trendRes.json();

      if (statsRes.ok) {
        setStats(statsData);
        localStorage.setItem("cattlehaven_cached_dashboard_stats", JSON.stringify(statsData));
      }
      if (activeRes.ok) {
        setActiveRecords(activeData);
        localStorage.setItem("cattlehaven_cached_active_records", JSON.stringify(activeData));
      }
      if (trendRes.ok) {
        setWeeklyTrend(trendData);
        localStorage.setItem("cattlehaven_cached_weekly_trend", JSON.stringify(trendData));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-poll stats every 30 seconds for real-time gate monitoring
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Find debtors
  const debtors = activeRecords.filter(r => r.balanceDue > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{t("loadingRecords")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t("dashboard")}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Real-time parking count, revenue streams, and collection monitoring.</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? t("refreshing") : t("refreshStats")}</span>
        </button>
      </div>

      {/* Grid of Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Active Cattle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t("activeCattleParked")}</p>
              <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3 font-sans tracking-tight">
                {stats?.activeCattleCount || 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-bento-border/60 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {t("activeCattleParkedDesc")}
            </span>
            <button
              onClick={() => onNavigateToTab("active-parking")}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer border-0 bg-transparent"
            >
              View Gate <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Stat 2: Today's Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t("todaysTotalRevenue")}</p>
              <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3 font-mono tracking-tight">
                {formatMoney(stats?.todayRevenue.total || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-bento-border/60 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 dark:text-slate-500 block">{t("todayCashPayments")}</span>
              <span className="font-semibold text-gray-700 dark:text-zinc-300 font-mono mt-0.5 block">
                {formatMoney(stats?.todayRevenue.cash || 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-slate-500 block">{t("todayBankPayments")}</span>
              <span className="font-semibold text-gray-700 dark:text-zinc-300 font-mono mt-0.5 block">
                {formatMoney(stats?.todayRevenue.bank || 0)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stat 3: Total Receivables */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t("totalUnpaidReceivables")}</p>
              <h3 className="text-4xl font-extrabold text-red-600 dark:text-red-400 mt-3 font-mono tracking-tight">
                {formatMoney(stats?.totalReceivables || 0)}
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-bento-border/60 flex items-center justify-between">
            <span className="text-xs text-red-500 dark:text-red-400/80 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {t("unpaidAlert")}
            </span>
            <button
              onClick={() => onNavigateToTab("reports")}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 cursor-pointer border-0 bg-transparent"
            >
              Collection Report <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Weekly Revenue & Expenses Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-bento-border/50">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
              {t("weeklyPerformance") || "Weekly Financial Performance"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              7-day dynamic overview of gate revenues, operational expenses, and net profitability.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <div className="px-3 py-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/10">
              <span className="text-gray-400 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">{t("sevenDayRevenue") || "7-Day Revenue"}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                {formatMoney(weeklyTrend.reduce((sum, item) => sum + item.revenue, 0))}
              </span>
            </div>
            <div className="px-3 py-2 bg-red-500/5 dark:bg-red-500/10 rounded-xl border border-red-500/10">
              <span className="text-gray-400 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">{t("sevenDayExpenses") || "7-Day Expenses"}</span>
              <span className="font-mono text-red-600 dark:text-red-400 font-extrabold text-sm">
                {formatMoney(weeklyTrend.reduce((sum, item) => sum + item.expenses, 0))}
              </span>
            </div>
            <div className={`px-3 py-2 rounded-xl border cursor-pointer hover:brightness-110 active:scale-95 transition-all flex flex-col justify-center relative group ${
              weeklyTrend.reduce((sum, item) => sum + item.profit, 0) >= 0
                ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
              onClick={() => setShowQuickExpense(true)}
              title={language === "am" ? "ወጪ እዚህ ሪፖርት ያድርጉ" : language === "om" ? "Gabaasa baasii asirratti galmeessi" : "Report an expense directly from here"}
            >
              <div className="flex items-center gap-1">
                <span className="text-gray-400 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">{t("netProfit") || "Net Profit"}</span>
                <Coins className="w-3 h-3 text-amber-500 group-hover:animate-bounce shrink-0" />
              </div>
              <span className="font-mono font-extrabold text-sm">
                {formatMoney(weeklyTrend.reduce((sum, item) => sum + item.profit, 0))}
              </span>
            </div>
          </div>
        </div>

        {weeklyTrend.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Percent className="w-8 h-8 text-gray-350 dark:text-zinc-600 animate-pulse mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Preparing trend visualization...</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Waiting for transaction metrics to sync.</p>
          </div>
        ) : (
          <div className="w-full h-[320px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={weeklyTrend}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(val) => privacyMode ? "•••" : `ETB ${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-bento-border p-3.5 rounded-xl shadow-2xl space-y-1.5 text-xs">
                          <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
                          {payload.map((entry: any, index: number) => {
                            const name = entry.name;
                            const value = entry.value;
                            const colorClass = 
                              name === "Revenue" ? "text-emerald-600 dark:text-emerald-400" :
                              name === "Expenses" ? "text-red-500" : "text-amber-500 font-extrabold";
                            return (
                              <div key={index} className="flex items-center justify-between gap-6">
                                <span className="text-gray-400 dark:text-zinc-400 font-semibold">{name}:</span>
                                <span className={`font-mono font-bold ${colorClass}`}>
                                  {privacyMode ? "••••••" : `ETB ${value.toLocaleString()}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, fontWeight: 500 }}
                />
                <Area 
                  type="monotone" 
                  name="Revenue" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  name="Expenses" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
                <Line 
                  type="monotone" 
                  name="Net Profit" 
                  dataKey="profit" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Main Bottom Section: Active Debtors Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Debtors Panel */}
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{t("activeUnpaidDebtors")}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t("outstandingReceivablesDesc")}</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full font-mono">
              {debtors.length} Unpaid
            </span>
          </div>

          {debtors.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-150 dark:border-bento-border/60 rounded-xl">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-3">
                <CircleDollarSign className="w-5 h-5" />
              </span>
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">All current customers are fully paid!</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">No outstanding balances at the gate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-bento-border text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">{t("ownerName")}</th>
                    <th className="py-3 px-4 font-semibold">{t("cattleCount")}</th>
                    <th className="py-3 px-4 font-semibold">{t("shift")}</th>
                    <th className="py-3 px-4 font-semibold">{t("totalCharged")}</th>
                    <th className="py-3 px-4 font-semibold text-right">{t("balanceDue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-bento-border/50">
                  {debtors.map((record) => (
                    <tr
                      key={record.id}
                      className="text-sm hover:bg-gray-50/50 dark:hover:bg-bento-bg/30 group transition-colors duration-150 cursor-pointer"
                      onClick={() => onNavigateToTab("active-parking")}
                    >
                      <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{record.customer.fullName}</span>
                          <span className="text-[10px] text-gray-400 font-mono font-normal">{record.customer.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300 font-medium font-mono">{record.cattleCount} Head</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md font-mono ${
                          record.parkingType === "DAY"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                            : record.parkingType === "BOTH"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400"
                        }`}>
                          {record.parkingType === "DAY"
                            ? (language === "am" ? "ቀን" : language === "om" ? "Guyyaa" : "DAY")
                            : record.parkingType === "BOTH"
                            ? (language === "am" ? "ሁለቱም" : language === "om" ? "Lachuu" : "BOTH")
                            : (language === "am" ? "ማታ" : language === "om" ? "Halkan" : "NIGHT")
                          }
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300 font-mono">{formatMoney(record.totalAmount)}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-amber-600 dark:text-amber-400 font-mono">
                        {formatMoney(record.balanceDue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gate Actions Card */}
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{t("quickActions")}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Quickly register arrivals or release cattle from the gate.</p>

            <div className="space-y-3 mt-6">
              <button
                onClick={() => onNavigateToTab("check-in")}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-black font-extrabold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("newArrivalCheckIn")}</span>
              </button>

              <button
                onClick={() => onNavigateToTab("active-parking")}
                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-bento-bg dark:hover:bg-bento-bg/80 border border-gray-200 dark:border-bento-border text-gray-700 dark:text-zinc-300 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("releaseParkingCheckOut")}</span>
              </button>

              <button
                onClick={() => setShowQuickExpense(true)}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-red-500/20 text-white dark:text-red-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
              >
                <Coins className="w-4 h-4 text-red-100 dark:text-red-400 shrink-0" />
                <span>{t("reportExpense")}</span>
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-bento-border/60 mt-6 bg-linear-to-b from-transparent to-amber-500/5 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t("gateSecurityProtocol")}
            </h4>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 mt-1.5 leading-relaxed font-medium">
              {t("gateSecurityProtocolDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Report Expense Modal */}
      <AnimatePresence>
        {showQuickExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-bento-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-bento-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500 dark:text-emerald-500" />
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-md tracking-tight">
                    {t("reportExpense")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickExpense(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {expError && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{expError}</span>
                </div>
              )}

              {expSuccess && (
                <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                  <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{expSuccess}</span>
                </div>
              )}

              <form onSubmit={handleQuickExpenseSubmit} className="space-y-4">
                {/* Amount input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                    {t("expenseAmount")} (ETB) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Amount in ETB"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold font-mono"
                  />
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                    {t("expenseCategory")} *
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                  >
                    <option value="OPERATIONAL">
                      {language === "am" ? "የስራ ማስኬጃ ወጪ" : language === "om" ? "Baasii Hojii" : "Operational Expense"}
                    </option>
                    <option value="WITHDRAWAL">
                      {language === "am" ? "ወጪ/ማውጣት" : language === "om" ? "Baasii Baanki/Maallaqa" : "Cash Withdrawal"}
                    </option>
                    <option value="CATTLE_FEED">
                      {language === "am" ? "የከብቶች መኖ" : language === "om" ? "Nyaata Loonii" : "Cattle Feed"}
                    </option>
                    <option value="SALARY">
                      {language === "am" ? "ደመወዝ" : language === "om" ? "Mindaa / Kaffaltii" : "Salary / Wages"}
                    </option>
                    <option value="MAINTENANCE">
                      {language === "am" ? "ጥገና እና ዕድሳት" : language === "om" ? "Suphaa fi Haaromsa" : "Maintenance & Repair"}
                    </option>
                    <option value="OTHER">
                      {language === "am" ? "ሌሎች ወጪዎች" : language === "om" ? "Baasii Biroo" : "Other / Misc"}
                    </option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                    {t("expenseDescription")} *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    placeholder="e.g. Bought feed bags, Paid daily wages"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                {/* Optional Specific Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                    {t("specificDate")}
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickExpense(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold text-sm rounded-xl transition-all cursor-pointer border-0"
                  >
                    {language === "am" ? "ተው" : language === "om" ? "Dhiisi" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={expSubmitting}
                    className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{expSubmitting ? t("saving") : t("registerExpense")}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

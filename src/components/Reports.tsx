import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CalendarRange, 
  Download, 
  TrendingUp, 
  CircleDollarSign, 
  Receipt,
  Loader,
  RefreshCw,
  Coins,
  Edit,
  Trash2,
  BarChart3,
  History,
  AlertCircle
} from "lucide-react";
import { ParkingRecord } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";

interface ReportsProps {
  token: string;
  t: (key: any) => string;
  language: string;
  privacyMode?: boolean;
}

export default function Reports({ token, t, language, privacyMode }: ReportsProps) {
  const [records, setRecords] = useState<ParkingRecord[]>([]);

  const formatMoney = (val: number) => {
    if (privacyMode) return "••••••";
    return `ETB ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "daily" | "weekly" | "monthly" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"list" | "charts">("list");
  const [chartGrouping, setChartGrouping] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Sync chart grouping with filter preset changes
  useEffect(() => {
    if (filterType === "daily" || filterType === "weekly") {
      setChartGrouping("weekly");
    } else if (filterType === "monthly") {
      setChartGrouping("monthly");
    } else if (filterType === "all" || filterType === "custom") {
      setChartGrouping("yearly");
    }
  }, [filterType]);

  const handleChartGroupingChange = (grouping: "weekly" | "monthly" | "yearly") => {
    setChartGrouping(grouping);
    if (grouping === "weekly") {
      setFilterType("weekly");
    } else if (grouping === "monthly") {
      setFilterType("monthly");
    } else if (grouping === "yearly") {
      setFilterType("all");
    }
  };

  const isAmharic = language === "am";
  const isOromiffa = language === "om";
  const labels = {
    chartsTab: isAmharic ? "ስታቲስቲክስ እና ገበታዎች" : isOromiffa ? "Istaatistiksii & Chaartii" : "Statistics & Charts",
    ledgerTab: isAmharic ? "የግብይት ታሪክ" : isOromiffa ? "Galmee Gabaasaa" : "Transaction History",
    oxenProcessed: isAmharic ? "የበሬዎች ብዛት በገበታ" : isOromiffa ? "Loon herregame" : "Oxen Processed",
    revenueVsReceivables: isAmharic ? "የተሰበሰበ ገቢ እና ያልተከፈለ ቀሪ" : isOromiffa ? "Kaffaltii vs Idaa" : "Revenue vs Outstanding Receivables",
    oxenProcessedTitle: isAmharic ? "የበሬዎች ብዛት ገበታ (ራስ)" : isOromiffa ? "Baay'ina Loonii (Mataa)" : "Oxen Headcount Volume (Head)",
    revenueVsReceivablesTitle: isAmharic ? "የፋይናንስ ገበታ (ETB)" : isOromiffa ? "Haala Maallaqaa (ETB)" : "Financial Breakdown (ETB)",
    clickToFilter: isAmharic ? "የዚያን ቀን ታሪክ ለማየት ገበታውን ይጫኑ" : isOromiffa ? "Kan guyyaa sanaa ilaaluuf chaartii tuqi" : "Click on any bar to view detailed logs for that timeframe",
    selectGroup: isAmharic ? "የገበታ እይታ ይምረጡ:" : isOromiffa ? "Yeroo Chaartii filadhu:" : "Choose Chart Timeframe:",
    weeklyReport: isAmharic ? "ሳምንታዊ (በቀን)" : isOromiffa ? "Torban (Guyyaadhaan)" : "Weekly (By Day)",
    monthlyReport: isAmharic ? "ወርሃዊ (በሳምንት)" : isOromiffa ? "Ji'a (Torbaniin)" : "Monthly (By Week)",
    yearlyReport: isAmharic ? "ዓመታዊ (በወር)" : isOromiffa ? "Waggaa (Ji'aan)" : "Yearly (By Month)",
    oxenCountLabel: isAmharic ? "የበሬዎች ብዛት" : isOromiffa ? "Baay'ina Loonii" : "Oxen Count",
    collectedRevenueLabel: isAmharic ? "የተሰበሰበ ገቢ" : isOromiffa ? "Kaffaltii Walitti Qabame" : "Collected Revenue",
    receivablesLabel: isAmharic ? "ያልተከፈለ ቀሪ" : isOromiffa ? "Idaa Hafte" : "Outstanding Receivables",
    settleReceivableTitle: isAmharic ? "ያልተከፈለ ቀሪ ሂሳብ መሰብሰቢያ" : isOromiffa ? "Idaa Walitti Sassaabuu" : "Settle Receivable Balance",
    customerName: isAmharic ? "የደንበኛ ስም" : isOromiffa ? "Maqaa Maamilichaa" : "Customer Name",
    customerPhone: isAmharic ? "የደንበኛ ስልክ" : isOromiffa ? "Bilbila Maamilichaa" : "Customer Phone",
    oxenCount: isAmharic ? "የበሬዎች ብዛት" : isOromiffa ? "Baay'ina Loonii" : "Oxen Count",
    totalCharged: isAmharic ? "አጠቃላይ ክፍያ" : isOromiffa ? "Gatii Guutuu" : "Total Charged",
    amountPaidInitially: isAmharic ? "መጀመሪያ የተከፈለ" : isOromiffa ? "Kaffaltii Jalqabaa" : "Amount Paid Initially",
    outstandingReceivables: isAmharic ? "ያልተከፈለ ቀሪ እዳ" : isOromiffa ? "Idaa Hafte" : "Outstanding Receivables",
    amountReceived: isAmharic ? "የተቀበሉት ገንዘብ (ብር)" : isOromiffa ? "Gatii Sassaabame (ETB)" : "Amount Received (ETB)",
    paymentMethodLabel: isAmharic ? "የክፍያ መንገድ" : isOromiffa ? "Mala Kaffaltii" : "Payment Method",
    cancel: isAmharic ? "አቁም" : isOromiffa ? "Haqi" : "Cancel",
    recordPayment: isAmharic ? "ክፍያ መዝግብ" : isOromiffa ? "Kaffaltii Galmeessi" : "Record Payment",
    updating: isAmharic ? "በማዘመን ላይ..." : isOromiffa ? "Gabaasaa jira..." : "Updating...",
    editRecordTitle: isAmharic ? "የግብይት መዝገብ ማስተካከያ" : isOromiffa ? "Galmee Gabaasaa Gidduu sirreessi" : "Edit Transaction Record",
    ratePerOx: isAmharic ? "የአንድ በሬ ዋጋ (ብር)" : isOromiffa ? "Gatii Ox tokkoo (ETB)" : "Rate per Ox (ETB)",
    shift: isAmharic ? "ፈረቃ" : isOromiffa ? "Ziiqii" : "Shift",
    status: isAmharic ? "ሁኔታ" : isOromiffa ? "Haala" : "Status",
    newTotalAmount: isAmharic ? "አዲስ አጠቃላይ ዋጋ" : isOromiffa ? "Gatii Guutuu Haaraya" : "New Total Amount",
    newBalanceDue: isAmharic ? "አዲስ ቀሪ እዳ" : isOromiffa ? "Idaa Haaraya" : "New Balance Due",
    saveCorrections: isAmharic ? "ማስተካከያዎችን አስቀምጥ" : isOromiffa ? "Sirreeffama Ol-kaahi" : "Save Corrections",
    saving: isAmharic ? "በማስቀመጥ ላይ..." : isOromiffa ? "Kubaasaa jira..." : "Saving...",
    deleteConfirm: isAmharic ? "ይህንን የከብት ማቆሚያ መዝገብ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት? ይህ በቋሚነት ያጠፋዋል!" : isOromiffa ? "Galmee kana haqasuu barbaddaa? Kana booda deebisuun hin danda'amu!" : "Are you sure you want to delete this parking record? This will permanently remove the record and cannot be undone."
  };

  // Filter state variables
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"ALL" | "RECEIVABLES" | "FULLY_PAID">("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [parkingTypeFilter, setParkingTypeFilter] = useState<"ALL" | "DAY" | "NIGHT" | "BOTH">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PARKED" | "COMPLETED">("ALL");

  // Dynamic payment methods list with cache fallback
  const [paymentMethods, setPaymentMethods] = useState<{ name: string; code: string; allTimeBalance?: number }[]>(() => {
    const cached = localStorage.getItem("cattlehaven_cached_payment_methods");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [
      { name: "Cash", code: "CASH" },
      { name: "CBE", code: "CBE" },
      { name: "Telebirr", code: "TELEBIRR" },
      { name: "Bank of Abyssinia", code: "ABYSSINIA" },
      { name: "Awash Bank", code: "AWASH" }
    ];
  });

  // Receivable Settlement state
  const [settleRecord, setSettleRecord] = useState<ParkingRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settleMethod, setSettleMethod] = useState<string>("CASH");
  const [settleLoading, setSettleLoading] = useState<boolean>(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [settleSuccess, setSettleSuccess] = useState<string | null>(null);

  // Edit & Delete states
  const [editRecord, setEditRecord] = useState<ParkingRecord | null>(null);
  const [editCattleCount, setEditCattleCount] = useState<number>(0);
  const [editPricePerCattle, setEditPricePerCattle] = useState<number>(0);
  const [editAmountPaid, setEditAmountPaid] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>("CASH");
  const [editParkingType, setEditParkingType] = useState<"DAY" | "NIGHT">("DAY");
  const [editStatus, setEditStatus] = useState<"PARKED" | "COMPLETED">("PARKED");
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let query = `?type=${filterType}`;
      if (filterType === "custom" && startDate && endDate) {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(`/api/reports${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        // Cache reports data for fast offline viewing
        localStorage.setItem(`cattlehaven_cached_reports_${filterType}`, JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      // Fast offline-first loading from cache
      const cached = localStorage.getItem(`cattlehaven_cached_reports_${filterType}`);
      if (cached) {
        setRecords(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/payment-methods", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
        localStorage.setItem("cattlehaven_cached_payment_methods", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error fetching payment methods in Reports:", err);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [filterType, startDate, endDate]);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Handle excel download securely with bearer auth header
  const handleDownloadExcel = async () => {
    setExporting(true);
    try {
      let query = `?type=${filterType}`;
      if (filterType === "custom" && startDate && endDate) {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(`/api/reports/export${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to export Excel spreadsheet");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `cattlehaven_report_${filterType}_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Excel download failure:", err);
      setExportError(language === "am" ? "የሪፖርት ኤክሴል ማውረድ አልተሳካም። እባክዎ እንደገና ይሞክሩ።" : "Failed to export report. Please try again.");
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    setDeleteError(null);
    setDeleteLoadingId(id);
    try {
      const res = await fetch(`/api/parking/record/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        localStorage.removeItem("cattlehaven_cached_dashboard_stats");
        localStorage.removeItem("cattlehaven_cached_active_records");
        localStorage.removeItem("cattlehaven_cached_weekly_trend");
        fetchReportData();
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete record");
        setTimeout(() => setDeleteError(null), 5000);
      }
    } catch (err) {
      console.error("Delete record error:", err);
      setDeleteError("Network error while deleting record");
      setTimeout(() => setDeleteError(null), 5000);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Filter records by customer name, phone query AND payment status, payment method, shift type, and record status filters
  const filteredRecords = records.filter((r) => {
    // 1. Search filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const nameMatch = r.customer.fullName.toLowerCase().includes(query);
      const phoneMatch = r.customer.phone.toLowerCase().includes(query);
      if (!nameMatch && !phoneMatch) return false;
    }

    // 2. Payment status filter
    if (paymentStatusFilter === "RECEIVABLES") {
      if (r.balanceDue <= 0) return false;
    } else if (paymentStatusFilter === "FULLY_PAID") {
      if (r.balanceDue > 0) return false;
    }

    // 3. Payment Method filter
    if (paymentMethodFilter !== "ALL") {
      if (r.paymentMethod !== paymentMethodFilter) return false;
    }

    // 4. Shift Type filter (DAY vs NIGHT)
    if (parkingTypeFilter !== "ALL") {
      if (r.parkingType !== parkingTypeFilter) return false;
    }

    // 5. Record Status filter (PARKED vs COMPLETED)
    if (statusFilter !== "ALL") {
      if (r.status !== statusFilter) return false;
    }

    return true;
  });

  // 1. Prepare data for weekly breakdown
  const getWeeklyChartData = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const data = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      const dayRecords = records.filter((r) => {
        const entryDate = new Date(r.entryTime).toISOString().split("T")[0];
        return entryDate === dateStr;
      });

      const oxen = dayRecords.reduce((sum, r) => sum + r.cattleCount, 0);
      const money = dayRecords.reduce((sum, r) => sum + r.amountPaid, 0);
      const receivables = dayRecords.reduce((sum, r) => sum + r.balanceDue, 0);

      data.push({
        name: d.toLocaleDateString(language === "am" ? "am-ET" : "en-US", { weekday: "short" }),
        dateStr,
        oxen,
        money,
        receivables,
        label: d.toLocaleDateString(language === "am" ? "am-ET" : "en-US", { month: "short", day: "numeric" }),
      });
    }
    return data;
  };

  // 2. Prepare data for monthly breakdown
  const getMonthlyChartData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const data = [];
    for (let i = 1; i <= 5; i++) {
      const start = new Date(year, month, (i - 1) * 7 + 1);
      let end = new Date(year, month, i * 7);
      if (i === 5) {
        end = new Date(year, month + 1, 0); // last day of month
      }

      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      const weekRecords = records.filter((r) => {
        const entryDate = new Date(r.entryTime);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate >= new Date(startStr) && entryDate <= new Date(endStr + "T23:59:59");
      });

      const oxen = weekRecords.reduce((sum, r) => sum + r.cattleCount, 0);
      const money = weekRecords.reduce((sum, r) => sum + r.amountPaid, 0);
      const receivables = weekRecords.reduce((sum, r) => sum + r.balanceDue, 0);

      data.push({
        name: `W${i}`,
        startDateStr: startStr,
        endDateStr: endStr,
        oxen,
        money,
        receivables,
        label: `${language === "am" ? "ሳምንት" : "Week"} ${i} (${start.getDate()}-${end.getDate()})`,
      });
    }
    return data;
  };

  // 3. Prepare data for yearly breakdown
  const getYearlyChartData = () => {
    const year = new Date().getFullYear();
    const data = [];

    for (let i = 0; i < 12; i++) {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 0);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      const monthRecords = records.filter((r) => {
        const entryDate = new Date(r.entryTime);
        return entryDate.getFullYear() === year && entryDate.getMonth() === i;
      });

      const oxen = monthRecords.reduce((sum, r) => sum + r.cattleCount, 0);
      const money = monthRecords.reduce((sum, r) => sum + r.amountPaid, 0);
      const receivables = monthRecords.reduce((sum, r) => sum + r.balanceDue, 0);

      data.push({
        name: start.toLocaleDateString(language === "am" ? "am-ET" : "en-US", { month: "short" }),
        startDateStr: startStr,
        endDateStr: endStr,
        oxen,
        money,
        receivables,
        label: start.toLocaleDateString(language === "am" ? "am-ET" : "en-US", { month: "long" }),
      });
    }
    return data;
  };

  const handleBarClick = (data: any, clickedType?: "money" | "receivables" | "oxen") => {
    if (!data) return;

    if (chartGrouping === "weekly" && data.dateStr) {
      setStartDate(data.dateStr);
      setEndDate(data.dateStr);
      setFilterType("custom");
    } else if (chartGrouping === "monthly" && data.startDateStr && data.endDateStr) {
      setStartDate(data.startDateStr);
      setEndDate(data.endDateStr);
      setFilterType("custom");
    } else if (chartGrouping === "yearly" && data.startDateStr && data.endDateStr) {
      setStartDate(data.startDateStr);
      setEndDate(data.endDateStr);
      setFilterType("custom");
    }

    if (clickedType === "receivables") {
      setPaymentStatusFilter("RECEIVABLES");
    } else if (clickedType === "money") {
      setPaymentStatusFilter("FULLY_PAID");
    } else if (clickedType === "oxen") {
      setPaymentStatusFilter("ALL");
    }

    setActiveSubTab("list");
  };

  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="text-xs font-semibold" style={{ color: item.color }}>
              {item.name}: <span className="font-mono">{unit === "ETB" ? "ETB " : ""}{item.value.toLocaleString()} {unit === "ETB" ? "" : (language === "am" ? "ራስ" : "Head")}</span>
            </p>
          ))}
          <p className="text-[10px] text-amber-600 dark:text-emerald-400 mt-2 font-medium animate-pulse">
            💡 {language === "am" ? "ታሪኩን ለማየት ገበታውን ይጫኑ" : "Click bar to drill down into logs"}
          </p>
        </div>
      );
    }
    return null;
  };

  // Metrics summary
  const totalCattle = filteredRecords.reduce((sum, r) => sum + r.cattleCount, 0);
  const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalOutstanding = filteredRecords.reduce((sum, r) => sum + r.balanceDue, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header and Download */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Audit & Reports</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Audit historical data, filter entries, and download Excel-format backups.</p>
        </div>

        <button
          onClick={handleDownloadExcel}
          disabled={exporting || records.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-amber-600 hover:bg-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          {exporting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Generating Excel...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{t("exportExcel")}</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Control Board */}
      <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mr-2">
            {t("filterPreset")}
          </span>
          {(["all", "daily", "weekly", "monthly", "custom"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer border-0 ${
                filterType === type
                  ? "bg-amber-500 text-white shadow-xs dark:bg-emerald-500 dark:text-black"
                  : "bg-gray-50 text-gray-600 border border-gray-150 hover:bg-gray-100 dark:bg-bento-bg dark:text-slate-300 dark:border-bento-border dark:hover:bg-zinc-800"
              }`}
            >
              {type === "all" ? t("allHistory") : type === "daily" ? t("daily") : type === "weekly" ? t("weekly") : type === "monthly" ? t("monthly") : t("custom")}
            </button>
          ))}
        </div>

        {/* Custom date range selector if 'custom' filter selected */}
        {filterType === "custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-50 dark:border-bento-border/40"
          >
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white border border-gray-200 dark:border-bento-border rounded-lg text-xs font-semibold focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white border border-gray-200 dark:border-bento-border rounded-lg text-xs font-semibold focus:outline-hidden"
              />
            </div>
          </motion.div>
        )}

        {/* Payment Status Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-bento-border/40">
          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mr-2">
            Payment Status:
          </span>
          {(["ALL", "RECEIVABLES", "FULLY_PAID"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setPaymentStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-0 ${
                paymentStatusFilter === status
                  ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-black font-extrabold"
                  : "bg-gray-50 text-gray-600 border border-gray-150 hover:bg-gray-100 dark:bg-bento-bg dark:text-slate-300 dark:border-bento-border dark:hover:bg-zinc-800"
              }`}
            >
              {status === "ALL" ? "All History" : status === "RECEIVABLES" ? "Receivables (Unpaid Balance)" : "Fully Paid"}
            </button>
          ))}
        </div>

        {/* Payment Method Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-bento-border/40">
          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mr-2">
            Payment Method:
          </span>
          <button
            onClick={() => setPaymentMethodFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-0 ${
              paymentMethodFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-black font-extrabold"
                : "bg-gray-50 text-gray-600 border border-gray-150 hover:bg-gray-100 dark:bg-bento-bg dark:text-slate-300 dark:border-bento-border dark:hover:bg-zinc-800"
            }`}
          >
            All Methods
          </button>
          {paymentMethods.map((m) => (
            <button
              key={m.code}
              onClick={() => setPaymentMethodFilter(m.code)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-0 ${
                paymentMethodFilter === m.code
                  ? "bg-amber-500 text-white shadow-xs dark:bg-emerald-500 dark:text-black font-extrabold"
                  : "bg-gray-50 text-gray-600 border border-gray-150 hover:bg-gray-100 dark:bg-bento-bg dark:text-slate-300 dark:border-bento-border dark:hover:bg-zinc-800"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Shift Type and Status Filters */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-gray-100 dark:border-bento-border/40">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mr-2">
              Shift Type:
            </span>
            {(["ALL", "DAY", "NIGHT", "BOTH"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setParkingTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-0 ${
                  parkingTypeFilter === type
                    ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500 dark:text-black font-extrabold"
                    : "bg-gray-50 text-gray-600 border border-gray-150 hover:bg-gray-100 dark:bg-bento-bg dark:text-slate-300 dark:border-bento-border dark:hover:bg-zinc-800"
                }`}
              >
                {type === "ALL"
                  ? (language === "am" ? "ሁሉም ፈረቃዎች" : language === "om" ? "Ziiqii Hunda" : "All Shifts")
                  : type === "DAY"
                  ? (language === "am" ? "የቀን ፈረቃ" : language === "om" ? "Ziiqii Guyyaa" : "Day Shift")
                  : type === "NIGHT"
                  ? (language === "am" ? "የማታ ፈረቃ" : language === "om" ? "Ziiqii Halkan" : "Night Shift")
                  : (language === "am" ? "ሁለቱም ፈረቃ" : language === "om" ? "Lachuu (Guyyaa/Halkan)" : "Both Shifts")
                }
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mr-2">
              Record Status:
            </span>
            {(["ALL", "PARKED", "COMPLETED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-0 ${
                  statusFilter === st
                    ? "bg-violet-600 text-white shadow-xs dark:bg-violet-500 dark:text-black font-extrabold"
                    : "bg-gray-50 text-gray-600 border border-gray-150 hover:bg-gray-100 dark:bg-bento-bg dark:text-slate-300 dark:border-bento-border dark:hover:bg-zinc-800"
                }`}
              >
                {st === "ALL" ? "All Records" : st === "PARKED" ? "Active (Parked)" : "Completed"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Block */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${paymentMethodFilter !== "ALL" ? "lg:grid-cols-4" : ""} gap-6`}>
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t("totalOxenProcessed")}</span>
            <span className="block text-2xl font-black text-gray-900 dark:text-white mt-1 font-mono">{totalCattle} Head</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t("revenueCollected")}</span>
            <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{formatMoney(totalRevenue)}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t("unpaidBalance")}</span>
            <span className="block text-2xl font-black text-red-500 dark:text-red-400 mt-1 font-mono">{formatMoney(totalOutstanding)}</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {paymentMethodFilter !== "ALL" && (
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-emerald-500/10 dark:to-teal-500/5 border border-amber-500/25 dark:border-emerald-500/25 p-5 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-xs font-extrabold text-amber-600 dark:text-emerald-400 uppercase tracking-wider">
                {paymentMethods.find(m => m.code === paymentMethodFilter)?.name || paymentMethodFilter} Balance
              </span>
              <span className="block text-2xl font-black text-gray-950 dark:text-white mt-1 font-mono">
                {formatMoney(paymentMethods.find(m => m.code === paymentMethodFilter)?.allTimeBalance || 0)}
              </span>
              <span className="block text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                All-time account total
              </span>
            </div>
            <div className="p-3 bg-amber-500/20 dark:bg-emerald-500/20 text-amber-600 dark:text-emerald-400 rounded-xl">
              <Coins className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods Summary Panel */}
      <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-md tracking-tight">
            {language === "am" ? "የክፍያ መንገዶች ገቢ ስብስብ" : "Payment Channel Breakdown"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {language === "am" 
              ? "በተመረጠው የጊዜ ገደብ ውስጥ በእያንዳንዱ የክፍያ መንገድ የተሰበሰበ ጠቅላላ ገቢ" 
              : "Total accumulated revenue collected per payment channel based on the active date filters."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {paymentMethods.map((method) => {
            const totalForMethod = records
              .filter((r) => r.paymentMethod === method.code)
              .reduce((sum, r) => sum + r.amountPaid, 0);

            const percentage = totalRevenue > 0 ? (totalForMethod / totalRevenue) * 100 : 0;

            // Define custom color combinations for each method
            const getMethodColors = (code: string) => {
              switch (code) {
                case "CASH":
                  return {
                    bg: "bg-emerald-500/10 dark:bg-emerald-500/5",
                    border: "border-emerald-500/20 dark:border-emerald-500/10",
                    text: "text-emerald-600 dark:text-emerald-400",
                    progress: "bg-emerald-500"
                  };
                case "CBE":
                  return {
                    bg: "bg-purple-500/10 dark:bg-purple-500/5",
                    border: "border-purple-500/20 dark:border-purple-500/10",
                    text: "text-purple-600 dark:text-purple-400",
                    progress: "bg-purple-500"
                  };
                case "TELEBIRR":
                  return {
                    bg: "bg-blue-500/10 dark:bg-blue-500/5",
                    border: "border-blue-500/20 dark:border-blue-500/10",
                    text: "text-blue-600 dark:text-blue-400",
                    progress: "bg-blue-500"
                  };
                case "ABYSSINIA":
                  return {
                    bg: "bg-amber-500/10 dark:bg-amber-500/5",
                    border: "border-amber-500/20 dark:border-amber-500/10",
                    text: "text-amber-600 dark:text-amber-400",
                    progress: "bg-amber-500"
                  };
                case "AWASH":
                  return {
                    bg: "bg-red-500/10 dark:bg-red-500/5",
                    border: "border-red-500/20 dark:border-red-500/10",
                    text: "text-red-600 dark:text-red-400",
                    progress: "bg-red-500"
                  };
                default:
                  return {
                    bg: "bg-gray-500/10 dark:bg-gray-500/5",
                    border: "border-gray-500/20 dark:border-gray-500/10",
                    text: "text-gray-600 dark:text-gray-400",
                    progress: "bg-gray-500"
                  };
              }
            };

            const colors = getMethodColors(method.code);

            return (
              <div 
                key={method.code} 
                className={`p-4 rounded-xl border ${colors.bg} ${colors.border} flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 tracking-tight">
                    {method.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-zinc-900/80 font-mono text-gray-500">
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-1">
                  <span className={`block text-lg font-extrabold font-mono ${colors.text}`}>
                    {formatMoney(totalForMethod)}
                  </span>
                  <div className="w-full h-1.5 bg-gray-200/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${colors.progress} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-gray-150 dark:border-bento-border/50 gap-4 mt-4">
        <button
          onClick={() => setActiveSubTab("list")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "list"
              ? "border-amber-500 text-amber-600 dark:border-emerald-500 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <History className="w-4 h-4" />
          <span>{labels.ledgerTab}</span>
        </button>
        <button
          onClick={() => setActiveSubTab("charts")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "charts"
              ? "border-amber-500 text-amber-600 dark:border-emerald-500 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{labels.chartsTab}</span>
        </button>
      </div>

      {activeSubTab === "list" ? (
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl">
          {deleteError && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {exportError && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-md tracking-tight">{t("historicalRecords")}</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">List of gate transactions for the current preset.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchCustomer") || "Search customer..."}
              aria-label="Search historical transactions by customer name or phone"
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t("loadingRecords")}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-150 dark:border-bento-border/60 rounded-xl" role="status" aria-live="polite">
            <CalendarRange className="w-8 h-8 text-gray-400 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
              {searchQuery ? "No matching records found" : t("noRecordsFound")}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {searchQuery ? "Try refining your customer name or phone filter query." : t("tryAlteringRanges")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-bento-border text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">{t("ownerName")}</th>
                  <th className="py-3.5 px-4">{t("cattleCount")}</th>
                  <th className="py-3.5 px-4">{t("shift")}</th>
                  <th className="py-3.5 px-4">{t("totalCharged")}</th>
                  <th className="py-3.5 px-4">{t("amountCollected")}</th>
                  <th className="py-3.5 px-4">{t("balanceDue")}</th>
                  <th className="py-3.5 px-4">{t("status")}</th>
                  <th className="py-3.5 px-4 text-right">{t("paymentMethod")}</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-bento-border/45 text-xs font-semibold">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-bento-bg/30 transition-colors duration-100">
                    <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-500 font-mono">
                      {new Date(r.entryTime).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-950 dark:text-white font-semibold">
                      <div className="flex flex-col">
                        <span>{r.customer.fullName}</span>
                        <span className="text-[9px] text-gray-400 font-normal font-mono">{r.customer.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-zinc-300">
                      {r.cattleCount} Head
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm font-mono ${
                        r.parkingType === "DAY"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                          : r.parkingType === "BOTH"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400"
                      }`}>
                        {r.parkingType === "DAY"
                          ? (language === "am" ? "ቀን" : language === "om" ? "Guyyaa" : "DAY")
                          : r.parkingType === "BOTH"
                          ? (language === "am" ? "ሁለቱም" : language === "om" ? "Lachuu" : "BOTH")
                          : (language === "am" ? "ማታ" : language === "om" ? "Halkan" : "NIGHT")
                        }
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-zinc-300">
                      {formatMoney(r.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      {formatMoney(r.amountPaid)}
                    </td>
                    <td className={`py-3.5 px-4 font-mono ${r.balanceDue > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-zinc-500"}`}>
                      <div className="flex items-center gap-2">
                        <span>{formatMoney(r.balanceDue)}</span>
                        {r.balanceDue > 0 && (
                           <button
                             onClick={() => {
                               setSettleRecord(r);
                               setSettleAmount(r.balanceDue.toFixed(0));
                               setSettleMethod("CASH");
                               setSettleError(null);
                               setSettleSuccess(null);
                             }}
                             className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-black rounded-md transition-all shrink-0 cursor-pointer animate-pulse"
                           >
                             Collect
                           </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm ${
                        r.status === "PARKED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-gray-500 dark:text-zinc-400 text-[10px]">
                      {r.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditRecord(r);
                          setEditCattleCount(r.cattleCount);
                          setEditPricePerCattle(r.pricePerCattle);
                          setEditAmountPaid(r.amountPaid);
                          setEditPaymentMethod(r.paymentMethod);
                          setEditParkingType(r.parkingType as "DAY" | "NIGHT");
                          setEditStatus(r.status as "PARKED" | "COMPLETED");
                          setEditError(null);
                          setEditSuccess(null);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black rounded-md transition-all cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {deleteConfirmId === r.id ? (
                        <div className="inline-flex items-center gap-1.5 animate-fadeIn">
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            disabled={deleteLoadingId === r.id}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white border border-transparent rounded-md text-[10px] font-extrabold uppercase cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            {deleteLoadingId === r.id ? (
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : null}
                            <span>{language === "am" ? "አዎ" : "Yes"}</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={deleteLoadingId === r.id}
                            className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 border border-transparent rounded-md text-[10px] font-extrabold uppercase cursor-pointer shadow-xs"
                          >
                            {language === "am" ? "የለም" : "No"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setDeleteConfirmId(r.id);
                            setDeleteError(null);
                          }}
                          disabled={deleteLoadingId === r.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-md transition-all cursor-pointer disabled:opacity-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : (
        /* Charts block */
        <div className="space-y-6">
          {/* Timeframe selector */}
          <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mr-2">
                {labels.selectGroup}
              </span>
              <div className="flex flex-wrap gap-2">
                {(["weekly", "monthly", "yearly"] as const).map((group) => (
                  <button
                    key={group}
                    onClick={() => handleChartGroupingChange(group)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer border-0 ${
                      chartGrouping === group
                        ? "bg-amber-500 text-white shadow-xs dark:bg-emerald-500 dark:text-black font-extrabold"
                        : "bg-gray-50 text-gray-600 border border-gray-150 hover:bg-gray-100 dark:bg-bento-bg dark:text-slate-300 dark:border-bento-border dark:hover:bg-zinc-800"
                    }`}
                  >
                    {group === "weekly" ? labels.weeklyReport : group === "monthly" ? labels.monthlyReport : labels.yearlyReport}
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5 font-medium animate-pulse">
              <span>💡</span>
              <span>{labels.clickToFilter}</span>
            </p>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-20 flex flex-col items-center justify-center gap-3 shadow-xl">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Generating visual analytics...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-16 text-center shadow-xl">
              <span className="text-3xl">📊</span>
              <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-3">No data available for charts</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">There are no records in the selected preset timeframe to build graphs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Oxen Processed Chart */}
              <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{labels.oxenProcessedTitle}</h4>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">Total count of oxen processed inside the hub</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartGrouping === "weekly" ? getWeeklyChartData() : chartGrouping === "monthly" ? getMonthlyChartData() : getYearlyChartData()}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-zinc-850" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip unit="Head" />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                      <Bar 
                        dataKey="oxen" 
                        name={labels.oxenCountLabel}
                        fill="#d97706" 
                        radius={[4, 4, 0, 0]} 
                        onClick={(data) => handleBarClick(data, "oxen")}
                        className="cursor-pointer"
                      >
                        {(chartGrouping === "weekly" ? getWeeklyChartData() : chartGrouping === "monthly" ? getMonthlyChartData() : getYearlyChartData()).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.oxen > 0 ? "url(#amberGradient)" : "#e5e7eb"} 
                            className="hover:opacity-85 transition-opacity duration-150 cursor-pointer"
                          />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Financial Breakdown Chart */}
              <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{labels.revenueVsReceivablesTitle}</h4>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">Collected payments stacked with outstanding unpaid balances</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartGrouping === "weekly" ? getWeeklyChartData() : chartGrouping === "monthly" ? getMonthlyChartData() : getYearlyChartData()}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-zinc-850" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip unit="ETB" />} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}
                      />
                      {/* Stacked Bars: Collected Money (Green) + Receivables (Red) */}
                      <Bar 
                        dataKey="money" 
                        name={labels.collectedRevenueLabel} 
                        stackId="a" 
                        fill="#059669"
                        onClick={(data) => handleBarClick(data, "money")}
                        className="cursor-pointer"
                      >
                        {(chartGrouping === "weekly" ? getWeeklyChartData() : chartGrouping === "monthly" ? getMonthlyChartData() : getYearlyChartData()).map((entry, index) => (
                          <Cell 
                            key={`cell-m-${index}`} 
                            fill={entry.money > 0 ? "url(#emeraldGradient)" : "#e5e7eb"} 
                            className="hover:opacity-85 transition-opacity duration-150 cursor-pointer"
                          />
                        ))}
                      </Bar>
                      <Bar 
                        dataKey="receivables" 
                        name={labels.receivablesLabel} 
                        stackId="a" 
                        fill="#ef4444" 
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => handleBarClick(data, "receivables")}
                        className="cursor-pointer"
                      >
                        {(chartGrouping === "weekly" ? getWeeklyChartData() : chartGrouping === "monthly" ? getMonthlyChartData() : getYearlyChartData()).map((entry, index) => (
                          <Cell 
                            key={`cell-r-${index}`} 
                            fill={entry.receivables > 0 ? "url(#redGradient)" : "#e5e7eb"} 
                            className="hover:opacity-85 transition-opacity duration-150 cursor-pointer"
                          />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settle Receivable Modal Panel */}
      <AnimatePresence>
        {settleRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-bento-border flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-md">{labels.settleReceivableTitle}</h3>
                <button
                  onClick={() => setSettleRecord(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSettleLoading(true);
                  setSettleError(null);
                  try {
                    const res = await fetch(`/api/parking/pay-receivable/${settleRecord.id}`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        paymentAmount: Number(settleAmount),
                        paymentMethod: settleMethod,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setSettleSuccess(language === "am" ? "ያልተከፈለ ቀሪ ሂሳብ በተሳካ ሁኔታ ተስተካክሏል!" : language === "om" ? "Idaan haftee sirriitti guutameera!" : "Unpaid balance updated successfully!");
                      setTimeout(() => {
                        setSettleRecord(null);
                        fetchReportData();
                      }, 1000);
                    } else {
                      setSettleError(data.error || "Failed to update payment");
                    }
                  } catch (err) {
                    setSettleError("Failed to communicate with server");
                  } finally {
                    setSettleLoading(false);
                  }
                }}
                className="p-6 space-y-4"
              >
                {settleError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-xs rounded-xl font-semibold">
                    {settleError}
                  </div>
                )}
                {settleSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs rounded-xl font-semibold">
                    {settleSuccess}
                  </div>
                )}

                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-xs font-semibold space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{labels.customerName}:</span>
                    <span className="text-gray-900 dark:text-white font-bold">{settleRecord.customer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{labels.oxenCount}:</span>
                    <span className="text-gray-900 dark:text-white">{settleRecord.cattleCount} {language === "am" ? "ራስ" : "Head"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{labels.totalCharged}:</span>
                    <span className="text-gray-900 dark:text-white font-mono">ETB {settleRecord.totalAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{labels.amountPaidInitially}:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">ETB {settleRecord.amountPaid.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 dark:border-bento-border/50 pt-1.5 mt-1.5">
                    <span className="text-gray-500 font-bold">{labels.outstandingReceivables}:</span>
                    <span className="text-red-500 dark:text-red-400 font-black font-mono">ETB {settleRecord.balanceDue.toFixed(0)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1.5">
                    {labels.amountReceived}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={settleRecord.balanceDue}
                    step="1"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1.5">
                    {labels.paymentMethodLabel}
                  </label>
                  <select
                    value={settleMethod}
                    onChange={(e) => setSettleMethod(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-bento-border/60">
                  <button
                    type="button"
                    onClick={() => setSettleRecord(null)}
                    className="flex-1 py-2 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-bento-bg dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-xs border border-gray-200 dark:border-bento-border rounded-xl transition-all cursor-pointer"
                  >
                    {labels.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={settleLoading}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {settleLoading ? labels.updating : labels.recordPayment}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Record Modal Panel */}
      <AnimatePresence>
        {editRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-bento-border flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-md">{labels.editRecordTitle}</h3>
                <button
                  onClick={() => setEditRecord(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  setEditError(null);
                  setEditSuccess(null);

                  const total = Number(editCattleCount) * Number(editPricePerCattle);
                  const paid = Number(editAmountPaid);
                  if (paid > total) {
                    const validationErr = language === "am"
                      ? `የተስተካከለው ክፍያ (ETB ${paid}) ከአዲሱ ጠቅላላ ሂሳብ (ETB ${total}) ሊበልጥ አይችልም።`
                      : language === "om"
                      ? `Kaffaltiin sirreeffame (ETB ${paid}) gatii guutuu (ETB ${total}) caaluu hin danda'u.`
                      : `Corrected payment (ETB ${paid}) cannot exceed the new total expected amount (ETB ${total}).`;
                    setEditError(validationErr);
                    setEditLoading(false);
                    return;
                  }

                  try {
                    const res = await fetch(`/api/parking/record/${editRecord.id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        cattleCount: Number(editCattleCount),
                        pricePerCattle: Number(editPricePerCattle),
                        amountPaid: Number(editAmountPaid),
                        paymentMethod: editPaymentMethod,
                        parkingType: editParkingType,
                        status: editStatus,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setEditSuccess(language === "am" ? "መዝገቡ በተሳካ ሁኔታ ተስተካክሏል!" : language === "om" ? "Galmeen sirriitti sirreeffameera!" : "Record corrected successfully!");
                      setTimeout(() => {
                        setEditRecord(null);
                        fetchReportData();
                      }, 1000);
                    } else {
                      setEditError(data.error || "Failed to update record");
                    }
                  } catch (err) {
                    setEditError("Failed to communicate with server");
                  } finally {
                    setEditLoading(false);
                  }
                }}
                className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-left"
              >
                {editError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-xs rounded-xl font-semibold">
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs rounded-xl font-semibold">
                    {editSuccess}
                  </div>
                )}

                <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{labels.customerName}:</span>
                    <span className="text-gray-900 dark:text-white font-bold">{editRecord.customer.fullName}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-400">{labels.customerPhone}:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{editRecord.customer.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1">
                      {labels.oxenCount}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editCattleCount}
                      onChange={(e) => setEditCattleCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1">
                      {labels.ratePerOx}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editPricePerCattle}
                      onChange={(e) => setEditPricePerCattle(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1">
                      {labels.shift}
                    </label>
                    <select
                      value={editParkingType}
                      onChange={(e) => setEditParkingType(e.target.value as "DAY" | "NIGHT")}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    >
                      <option value="DAY">{language === "am" ? "ቀን" : language === "om" ? "Guyyaa" : "DAY"}</option>
                      <option value="NIGHT">{language === "am" ? "ማታ" : language === "om" ? "Halkan" : "NIGHT"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1">
                      {labels.status}
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as "PARKED" | "COMPLETED")}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    >
                      <option value="PARKED">{language === "am" ? "ጌት ላይ ያለ" : language === "om" ? "Karra irra" : "PARKED"}</option>
                      <option value="COMPLETED">{language === "am" ? "የወጣ" : language === "om" ? "Gadi lakkifame" : "COMPLETED"}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1">
                      {labels.amountPaidInitially} (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editAmountPaid}
                      onChange={(e) => setEditAmountPaid(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1">
                      {labels.paymentMethodLabel}
                    </label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-gray-150 dark:border-bento-border/50 text-xs font-mono font-bold text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>{labels.newTotalAmount}:</span>
                    <span>ETB {(editCattleCount * editPricePerCattle).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{labels.newBalanceDue}:</span>
                    <span className={editCattleCount * editPricePerCattle - editAmountPaid > 0 ? "text-red-500" : "text-emerald-500"}>
                      ETB {Math.max(0, editCattleCount * editPricePerCattle - editAmountPaid).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-bento-border/60">
                  <button
                    type="button"
                    onClick={() => setEditRecord(null)}
                    className="flex-1 py-2 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-bento-bg dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-xs border border-gray-200 dark:border-bento-border rounded-xl transition-all cursor-pointer"
                  >
                    {labels.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {editLoading ? labels.saving : labels.saveCorrections}
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

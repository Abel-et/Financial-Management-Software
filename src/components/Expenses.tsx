import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Coins, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import { Expense, ParkingRecord } from "../types";

interface ExpensesProps {
  token: string;
  t: (key: any) => string;
  language: string;
  privacyMode: boolean;
}

export default function Expenses({ token, t, language, privacyMode }: ExpensesProps) {
  // State for expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("OPERATIONAL");
  const [date, setDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = [
    { code: "OPERATIONAL", name: language === "am" ? "የስራ ማስኬጃ ወጪ" : language === "om" ? "Baasii Hojii" : "Operational Expense" },
    { code: "WITHDRAWAL", name: language === "am" ? "ወጪ/ማውጣት" : language === "om" ? "Baasii Baanki/Maallaqa" : "Cash Withdrawal" },
    { code: "CATTLE_FEED", name: language === "am" ? "የከብቶች መኖ" : language === "om" ? "Nyaata Loonii" : "Cattle Feed" },
    { code: "SALARY", name: language === "am" ? "ደመወዝ" : language === "om" ? "Mindaa / Kaffaltii" : "Salary / Wages" },
    { code: "MAINTENANCE", name: language === "am" ? "ጥገና እና ዕድሳት" : language === "om" ? "Suphaa fi Haaromsa" : "Maintenance & Repair" },
    { code: "OTHER", name: language === "am" ? "ሌሎች ወጪዎች" : language === "om" ? "Baasii Biroo" : "Other / Misc" }
  ];

  // Fetch all expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current week's revenue
  const fetchWeeklyRevenue = async () => {
    setRevenueLoading(true);
    try {
      const res = await fetch("/api/reports?type=weekly", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const records: ParkingRecord[] = await res.json();
        const total = records.reduce((sum, r) => sum + r.amountPaid, 0);
        setWeeklyRevenue(total);
      }
    } catch (err) {
      console.error("Error fetching weekly revenue:", err);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchWeeklyRevenue();
  }, [token]);

  // Handle register expense
  const handleRegisterExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!description.trim() || amount === "" || amount <= 0) {
      setFormError(language === "am" ? "እባክዎ ትክክለኛ መግለጫ እና መጠን ያስገቡ።" : "Please fill in a valid description and amount.");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description,
          amount: Number(amount),
          category,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(language === "am" ? "ወጪው በተሳካ ሁኔታ ተመዝግቧል!" : "Expense registered successfully!");
        setDescription("");
        setAmount("");
        setCategory("OPERATIONAL");
        setDate("");
        fetchExpenses();
        setTimeout(() => setFormSuccess(null), 3000);
      } else {
        setFormError(data.error || "Failed to register expense.");
      }
    } catch (err) {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (id: string) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchExpenses();
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete expense record.");
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
      setDeleteError("Network error while deleting expense.");
    }
  };

  // Financial Masking Helper
  const formatMoney = (val: number) => {
    if (privacyMode) return "••••••";
    return `ETB ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Filtering expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exp.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats for current active filter
  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate current week's total expenses
  const getWeeklyExpensesTotal = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = today.getDay();
    startOfWeek.setDate(today.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d >= startOfWeek && d <= endOfWeek;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const weeklyExpenses = getWeeklyExpensesTotal();
  const weeklyProfit = weeklyRevenue - weeklyExpenses;

  return (
    <div className="max-w-6xl mx-auto space-y-8" id="expenses-portal">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Coins className="w-8 h-8 text-amber-500 dark:text-emerald-500" aria-hidden="true" />
            <span>{t("expenses")}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {language === "am" 
              ? "የጌት የሥራ ማስኬጃ ወጪዎችን፣ ደመወዝን እና ሌሎች ወጪዎችን ይመዝግቡ እና ይቆጣጠሩ።" 
              : language === "om"
              ? "Baasiiwwan hojii, mindaafi baasiiwwan biroo karra kanaan dhihaatan galmeessi."
              : "Register and audit gate operational expenditures, staff salaries, and other expenses."}
          </p>
        </div>
      </div>

      {/* Analytics Widgets (Weekly breakdown of expenses & profits) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Weekly Revenue */}
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {t("weeklyTotalRevenue")}
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
              {revenueLoading ? (
                <span className="text-sm text-gray-400">Loading...</span>
              ) : (
                formatMoney(weeklyRevenue)
              )}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              {t("weeklyRevenueCollectedDesc")}
            </p>
          </div>
        </div>

        {/* Card 2: Weekly Expenses */}
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {t("weeklyTotalExpenses")}
            </span>
            <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold font-mono text-gray-900 dark:text-white">
              {formatMoney(weeklyExpenses)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              {t("weeklyExpensesRecordedDesc")}
            </p>
          </div>
        </div>

        {/* Card 3: Weekly Net Profit */}
        <div className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
          weeklyProfit >= 0 
            ? "bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" 
            : "bg-red-500/5 border-red-200 dark:border-red-500/20"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {t("weeklyNetProfit")}
            </span>
            <div className={`p-2 rounded-xl ${
              weeklyProfit >= 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-600 dark:text-red-400"
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-extrabold font-mono ${
              weeklyProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}>
              {formatMoney(weeklyProfit)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              {t("weeklyRevenueMinusExpenses")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Column 1: Form to Register Expense */}
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-md tracking-tight">
              {t("registerNewExpense")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              {language === "am" 
                ? "ለጌት አገልግሎት የሚውሉ ወጪዎችን እዚህ ይመዝግቡ" 
                : language === "om"
                ? "Baasiiwwan adda addaa gabaasuu fi galmeessuuf kan gargaaru."
                : "Record gate expenditures or operational payments."}
            </p>
          </div>

          <form onSubmit={handleRegisterExpense} className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

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
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                {t("expenseDescription")} *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Bought 2 bags of cattle feed, Paid daily wages"
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>{submitLoading ? t("saving") : t("registerExpense")}</span>
            </button>
          </form>
        </div>

        {/* Column 2: History & Report of Expenses */}
        <div className="lg:col-span-2 bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-md tracking-tight">
                {t("expenseHistoryLog")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                {t("comprehensiveOutflowLog")}
              </p>
            </div>
            <div className="text-xs font-mono font-extrabold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-amber-600 dark:text-emerald-400">
              {t("totalOutflow")}: {formatMoney(totalFilteredAmount)}
            </div>
          </div>

          {deleteError && (
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {/* Search and Category Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchByDescriptionOrOperator")}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-xs border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden"
            >
              <option value="ALL">{t("allCategories")}</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* List/Table */}
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              <span>{t("loadingRecords")}</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-bento-border/40 rounded-xl">
              <Coins className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                {t("noExpenseRecords")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-100 dark:divide-bento-border/40">
                <thead>
                  <tr className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">{t("date")}</th>
                    <th className="py-3 px-2">{t("category")}</th>
                    <th className="py-3 px-2">{t("description")}</th>
                    <th className="py-3 px-2">{t("amount")}</th>
                    <th className="py-3 px-2">{t("by")}</th>
                    <th className="py-3 px-2 text-center">{t("action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-bento-border/20 font-semibold text-gray-800 dark:text-zinc-200">
                  {filteredExpenses.map((exp) => {
                    const catName = categories.find((c) => c.code === exp.category)?.name || exp.category;
                    return (
                      <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3 px-2 font-mono text-[10px]">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 text-[9px] rounded-md uppercase font-bold tracking-wider font-mono ${
                            exp.category === "WITHDRAWAL" 
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400" 
                              : exp.category === "OPERATIONAL"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}>
                            {catName}
                          </span>
                        </td>
                        <td className="py-3 px-2 max-w-xs truncate" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-3 px-2 font-mono text-red-600 dark:text-red-400 font-bold">
                          -{formatMoney(exp.amount)}
                        </td>
                        <td className="py-3 px-2 text-[10px] text-gray-400 capitalize">
                          {exp.recordedBy}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {deleteConfirmId === exp.id ? (
                            <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-extrabold uppercase cursor-pointer border-0 shadow-xs"
                              >
                                {language === "am" ? "አዎ" : "Yes"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg text-[10px] font-extrabold uppercase cursor-pointer border-0 shadow-xs"
                              >
                                {language === "am" ? "የለም" : "No"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setDeleteConfirmId(exp.id);
                                setDeleteError(null);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border-0 cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

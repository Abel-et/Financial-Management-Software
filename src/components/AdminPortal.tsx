import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  KeyRound, 
  LogOut, 
  Languages, 
  ShieldCheck, 
  User, 
  Moon, 
  Sun,
  Lock,
  ArrowRight,
  Coins,
  Plus,
  Trash2
} from "lucide-react";
import { Language } from "../lib/translations";
import { User as UserType, PaymentMethod } from "../types";

interface AdminPortalProps {
  token: string;
  user: UserType;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: any) => string;
  onChangePasswordClick: () => void;
  autoLogoutMins?: number;
  setAutoLogoutMins?: (mins: number) => void;
}

export default function AdminPortal({
  token,
  user,
  onLogout,
  darkMode,
  toggleDarkMode,
  language,
  setLanguage,
  t,
  onChangePasswordClick,
  autoLogoutMins = 5,
  setAutoLogoutMins,
}: AdminPortalProps) {
  // Payment methods states
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [newMethodName, setNewMethodName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [pError, setPError] = useState<string | null>(null);
  const [pSuccess, setPSuccess] = useState<string | null>(null);

  // System Reset states
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [deleteMethodConfirmId, setDeleteMethodConfirmId] = useState<string | null>(null);

  const handleSystemReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmation.trim().toUpperCase() !== "RESET") {
      setResetError(language === "am" ? "እባክዎ 'RESET' ብለው በትክክል ይፃፉ" : "Please type 'RESET' exactly to confirm.");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess(t("resetSuccess") || "System reset completed successfully! All balances are now 0.00.");
        setResetConfirmation("");
        
        // Clear all local caches
        localStorage.removeItem("cattlehaven_cached_dashboard_stats");
        localStorage.removeItem("cattlehaven_cached_active_records");
        localStorage.removeItem("cattlehaven_cached_weekly_trend");
        
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("cattlehaven_cached_reports_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Reload the application after 1.5 seconds so all states, caches, and contexts reset to 0.00
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setResetError(data.error || "Failed to reset system data.");
      }
    } catch (err) {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Fetch payment methods
  const fetchMethods = async () => {
    setMethodsLoading(true);
    try {
      const res = await fetch("/api/payment-methods", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
        // Cache them locally for offline/fast access
        localStorage.setItem("cattlehaven_cached_payment_methods", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to fetch payment methods:", err);
      // Fallback to cache if offline
      const cached = localStorage.getItem("cattlehaven_cached_payment_methods");
      if (cached) {
        setMethods(JSON.parse(cached));
      }
    } finally {
      setMethodsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [token]);

  // Add new payment method
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;
    setAddLoading(true);
    setPError(null);
    setPSuccess(null);
    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newMethodName }),
      });
      const data = await res.json();
      if (res.ok) {
        setPSuccess("Payment method added successfully!");
        setNewMethodName("");
        fetchMethods();
        setTimeout(() => setPSuccess(null), 2500);
      } else {
        setPError(data.error || "Failed to add payment method");
      }
    } catch (err) {
      setPError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  // Delete payment method
  const handleDeleteMethod = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setDeleteMethodConfirmId(null);
        setPSuccess("Payment method deleted.");
        fetchMethods();
        setTimeout(() => setPSuccess(null), 2000);
      } else {
        const data = await res.json();
        setPError(data.error || "Failed to delete payment method");
      }
    } catch (err) {
      setPError("Failed to communicate with server");
    }
  };

  // Handle space/enter key press for accessibility on interactive divs/buttons
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  const langNames = {
    en: "English",
    am: "አማርኛ (Amharic)",
    om: "Afaan Oromoo"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="admin-portal-container">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-amber-500 dark:text-emerald-500" aria-hidden="true" />
            <span>{t("adminPage")}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {t("adminPortalDesc")}
          </p>
        </div>
      </div>

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="region" aria-label="Administrative controls">
        
        {/* Card 1: Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 dark:bg-emerald-500/10 text-amber-600 dark:text-emerald-400 rounded-xl">
                <Languages className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-gray-950 dark:text-white text-md tracking-tight">
                  {t("language")}
                </h2>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Select your preferred language interface.
                </p>
              </div>
            </div>

            {/* Language Picker List */}
            <div 
              className="space-y-2 pt-3" 
              role="radiogroup" 
              aria-label="System language"
            >
              {(["en", "am", "om"] as const).map((lang) => {
                const isSelected = language === lang;
                return (
                  <div
                    key={lang}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => setLanguage(lang)}
                    onKeyDown={(e) => handleKeyDown(e, () => setLanguage(lang))}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:bg-emerald-500/10 dark:border-emerald-500 dark:text-emerald-400"
                        : "bg-gray-50/50 border-gray-150 hover:bg-gray-100 dark:bg-zinc-900/40 dark:border-bento-border dark:hover:bg-zinc-800 text-gray-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="capitalize">{langNames[lang]}</span>
                    <span className="text-[10px] font-mono tracking-wider uppercase bg-gray-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {lang}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Security & Password */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 dark:bg-emerald-500/10 text-amber-600 dark:text-emerald-400 rounded-xl">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-gray-950 dark:text-white text-md tracking-tight">
                  Security Credentials
                </h2>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Update operator password for secure logins.
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-zinc-900/30 border border-gray-150 dark:border-bento-border/50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-700 dark:text-emerald-400 font-bold text-xs uppercase font-mono">
                    {user.username.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white capitalize flex items-center gap-1.5">
                      <span>{user.username}</span>
                      <span className="px-1.5 py-0.5 text-[8px] tracking-wider font-extrabold uppercase bg-emerald-500/10 text-emerald-600 rounded-sm">
                        {user.role}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400">Current Session Active</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onChangePasswordClick}
                onKeyDown={(e) => handleKeyDown(e, onChangePasswordClick)}
                aria-label="Trigger change password dialog"
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-amber-500/5 dark:bg-bento-bg dark:hover:bg-emerald-500/5 border border-gray-200 dark:border-bento-border text-gray-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-emerald-400 font-semibold text-sm rounded-xl transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-gray-400 group-hover:text-amber-500 dark:group-hover:text-emerald-400" />
                  <span>{t("changePassword")}</span>
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Session & Theme Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between md:col-span-2"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="font-bold text-gray-950 dark:text-white text-md tracking-tight">
                Operator Settings & Session
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Configure interface layout and manage current login session.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleDarkMode}
                onKeyDown={(e) => handleKeyDown(e, toggleDarkMode)}
                aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 border border-gray-200 dark:border-bento-border text-gray-700 dark:text-zinc-300 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-gray-500" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={onLogout}
                onKeyDown={(e) => handleKeyDown(e, onLogout)}
                aria-label="Logout of active session"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold bg-red-500 hover:bg-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/30 text-white dark:text-red-400 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("signOut")}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-bento-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                Idle Session Timeout
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Automatically logout after inactivity to secure your CattleHaven terminal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Duration:</label>
              <select
                value={autoLogoutMins}
                onChange={(e) => setAutoLogoutMins?.(Number(e.target.value))}
                className="px-3.5 py-2 bg-gray-50 dark:bg-zinc-900/60 text-gray-900 dark:text-zinc-300 border border-gray-200 dark:border-bento-border rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/25"
              >
                <option value={1}>1 Minute</option>
                <option value={2}>2 Minutes</option>
                <option value={3}>3 Minutes</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Payment Methods Settings (Admin Only) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between md:col-span-2 space-y-6"
        >
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 dark:bg-emerald-500/10 text-amber-600 dark:text-emerald-400 rounded-xl">
                <Coins className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-gray-950 dark:text-white text-md tracking-tight">
                  Payment Channels Configuration
                </h2>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Manage acceptable payment methods and banking types for cattle releases.
                </p>
              </div>
            </div>

            {/* Form to Add New */}
            <form onSubmit={handleAddPaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  required
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder="e.g. CBE Birr, Hibret Bank, Telebirr Merchant"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-black font-extrabold text-sm rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 border-0"
              >
                {addLoading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Plus className="w-4.5 h-4.5" />
                    <span>Add Method</span>
                  </>
                )}
              </button>
            </form>

            {pError && (
              <p className="text-xs text-red-500 dark:text-red-400 font-bold px-1">{pError}</p>
            )}
            {pSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold px-1">{pSuccess}</p>
            )}

            {/* List of current Methods */}
            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-bento-border/50">
              <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                Active Channels
              </label>
              {methodsLoading && methods.length === 0 ? (
                <div className="text-xs text-gray-400 flex items-center gap-2 py-4">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  <span>Loading payment channels...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {methods.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-150 bg-gray-50/50 dark:bg-zinc-900/40 dark:border-bento-border text-sm font-semibold text-gray-800 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{m.name}</span>
                        <span className="text-[9px] font-mono tracking-wider uppercase bg-gray-200/50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">
                          {m.code}
                        </span>
                      </div>
                      {deleteMethodConfirmId === m.id ? (
                        <div className="flex items-center gap-1.5 animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => handleDeleteMethod(m.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-extrabold uppercase cursor-pointer border-0 shadow-xs"
                          >
                            {language === "am" ? "አዎ" : "Yes"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteMethodConfirmId(null)}
                            className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg text-[10px] font-extrabold uppercase cursor-pointer border-0 shadow-xs"
                          >
                            {language === "am" ? "የለም" : "No"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteMethodConfirmId(m.id);
                            setPError(null);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer border-0"
                          title="Delete payment method"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 5: System Reset (Danger Zone) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="bg-red-50/20 dark:bg-red-950/5 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between md:col-span-2 space-y-6"
        >
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-red-700 dark:text-red-400 text-md tracking-tight">
                  {t("resetSystem")}
                </h2>
                <p className="text-xs text-red-600/80 dark:text-red-400/60 font-semibold">
                  {t("resetSystemDesc")}
                </p>
              </div>
            </div>

            {/* Error & Success display */}
            {resetError && (
              <p className="text-xs text-red-600 dark:text-red-400 font-bold px-1">{resetError}</p>
            )}
            {resetSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold px-1">{resetSuccess}</p>
            )}

            {/* Input field and confirm button */}
            <form onSubmit={handleSystemReset} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  required
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder={t("typeResetToConfirm") || "Type 'RESET' to confirm"}
                  className="w-full px-4 py-2.5 bg-white dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-red-200 dark:border-red-900/30 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500/25 transition-all font-bold font-mono tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={resetLoading || resetConfirmation.trim().toUpperCase() !== "RESET"}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 border-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Trash2 className="w-4.5 h-4.5" />
                    <span>{t("resetSystem")}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

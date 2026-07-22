import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  ShieldAlert, 
  CheckCircle, 
  Loader,
  LayoutDashboard,
  Coins,
  UserPlus,
  Receipt,
  CalendarRange,
  ShieldCheck,
  X,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CheckInForm from "./components/CheckInForm";
import ActiveParking from "./components/ActiveParking";
import Reports from "./components/Reports";
import AdminPortal from "./components/AdminPortal";
import Expenses from "./components/Expenses";
import SyncManager from "./components/SyncManager";
import { User } from "./types";
import { Language, translations } from "./lib/translations";

export default function App() {
  // Session State
  const [token, setToken] = useState<string | null>(localStorage.getItem("cattlehaven_auth_token"));
  const [user, setUser] = useState<User | null>(null);
  const [syncKey, setSyncKey] = useState(0);

  // Privacy Mode State (Masking financial records)
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem("cattlehaven_privacy_mode") === "true";
  });

  // Auto Logout Duration State in minutes (default 5 minutes)
  const [autoLogoutMins, setAutoLogoutMins] = useState<number>(() => {
    const saved = localStorage.getItem("cattlehaven_autologout_mins");
    return saved ? Math.max(1, Number(saved)) : 5;
  });

  // Layout State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => {
    const localTheme = localStorage.getItem("cattlehaven_theme");
    return localTheme === "dark" || (!localTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  
  // Mobile Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("cattlehaven_lang");
    return (saved as Language) || "en";
  });

  // Change Password Modal State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Translation Helper
  const t = (key: keyof typeof translations["en"]) => {
    return translations[language][key] || translations["en"][key] || key;
  };

  // Sync Language preference
  useEffect(() => {
    localStorage.setItem("cattlehaven_lang", language);
  }, [language]);

  // Sync Privacy Mode
  useEffect(() => {
    localStorage.setItem("cattlehaven_privacy_mode", privacyMode ? "true" : "false");
  }, [privacyMode]);

  // Sync Auto Logout mins
  useEffect(() => {
    localStorage.setItem("cattlehaven_autologout_mins", autoLogoutMins.toString());
  }, [autoLogoutMins]);

  // Handle user reload/session restoration
  useEffect(() => {
    const savedUser = localStorage.getItem("cattlehaven_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved session user", e);
      }
    }
  }, []);

  // Sync Dark Mode state to documentElement class list
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("cattlehaven_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cattlehaven_theme", "light");
    }
  }, [darkMode]);

  const handleLoginSuccess = (newToken: string, userInfo: { id: number; username: string; role: string }) => {
    localStorage.setItem("cattlehaven_auth_token", newToken);
    localStorage.setItem("cattlehaven_user", JSON.stringify(userInfo));
    setToken(newToken);
    setUser(userInfo as User);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("cattlehaven_auth_token");
    localStorage.removeItem("cattlehaven_user");
    setToken(null);
    setUser(null);
    setSidebarOpen(false);
  };

  const handleIdleLogout = () => {
    localStorage.setItem("cattlehaven_logged_out_idle", "true");
    handleLogout();
  };

  // Customizable inactivity auto-logout tracker
  useEffect(() => {
    if (!token || !user) return;

    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleIdleLogout();
      }, autoLogoutMins * 60 * 1000); // Customizable minutes in ms
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleEvent = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleEvent);
    });

    // Start timer on mount/active session
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [token, user, autoLogoutMins]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Change Password Submission
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess("");
      }, 1500);

    } catch (err: any) {
      setPasswordError(err.message || "An error occurred.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // If user is not authenticated, show login page
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-slate-200 font-sans transition-colors duration-300">
      {/* Sidebar Navigation - Tablet (Contracted) & Desktop (Expanded) */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-20 lg:w-64 z-40 transition-all duration-300">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          privacyMode={privacyMode}
          togglePrivacyMode={() => setPrivacyMode(!privacyMode)}
          language={language}
          t={t}
        />
      </div>

      {/* Main Panel Content (With margin offset for contracted/expanded sidebar) */}
      <main className="ml-0 md:ml-20 lg:ml-64 p-0 min-h-screen flex flex-col transition-all duration-300">
        {/* Unified Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-bento-sidebar/90 backdrop-blur-md border-b border-gray-200 dark:border-bento-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* On mobile, show the company branding */}
            <div className="md:hidden flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center text-white dark:text-black font-bold text-sm font-mono shadow-xs">
                CH
              </div>
              <span className="font-extrabold text-sm text-gray-900 dark:text-white font-mono tracking-tight">Kiduse Company</span>
            </div>
            {/* On desktop, show current view title */}
            <div className="hidden md:flex flex-col">
              <h2 className="text-md font-extrabold text-gray-900 dark:text-white capitalize tracking-tight">
                {activeTab === "dashboard" && (language === "am" ? "ዳሽቦርድ" : language === "om" ? "Dabshboordii" : "Dashboard")}
                {activeTab === "check-in" && (language === "am" ? "አዲስ ማስገቢያ" : language === "om" ? "Seensa Haaraa" : "New Check-In")}
                {activeTab === "active-parking" && (language === "am" ? "ገባሪ ፓርኪንግ" : language === "om" ? "Hojii Irra Kan Jiru" : "Active Parking")}
                {activeTab === "expenses" && (language === "am" ? "ወጪዎች" : language === "om" ? "Baasii" : "Expenses")}
                {activeTab === "reports" && (language === "am" ? "ታሪክ እና ሪፖርቶች" : language === "om" ? "Gabaasa Seenaa" : "History & Reports")}
                {activeTab === "admin" && (language === "am" ? "አስተዳዳሪ ፖርታል" : language === "om" ? "Gabaasa Giddugaleessaa" : "Admin Portal")}
              </h2>
              <p className="text-[10px] text-amber-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Kiduse Company Gate Portal</p>
            </div>
          </div>

          {/* Top Right Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Privacy Toggle Button (Hide / Show Money) */}
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                privacyMode
                  ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-bold"
                  : "text-gray-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
              title={privacyMode ? "Show Money Amounts" : "Hide Money Amounts"}
              aria-label="Toggle Privacy Mode (Hide Money)"
            >
              {privacyMode ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="hidden lg:inline text-[10px] font-bold uppercase">{language === "am" ? "የተደበቀ" : language === "om" ? "Dhokate" : "Hidden"}</span>
                </>
              ) : (
                <Eye className="w-4 h-4 shrink-0" />
              )}
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 my-auto mx-0.5" />

            {/* History & Reports */}
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-amber-500/15 text-amber-600 dark:bg-emerald-500/15 dark:text-emerald-400 shadow-2xs font-extrabold"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
              title={t("historyReports")}
            >
              <CalendarRange className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === "am" ? "ሪፖርት" : language === "om" ? "Gabaasa" : "Reports"}</span>
            </button>

            {/* Admin Portal */}
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-amber-500/15 text-amber-600 dark:bg-emerald-500/15 dark:text-emerald-400 shadow-2xs font-extrabold"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
              title={t("adminPage") || "Admin"}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === "am" ? "ማስተዳደሪያ" : language === "om" ? "Admin" : "Admin"}</span>
            </button>
          </div>
        </header>

        <SyncManager token={token} onSyncComplete={() => setSyncKey(prev => prev + 1)} t={t} />
        
        <div className="p-4 md:p-8 pb-20 md:pb-8 animate-fade-in flex-1" key={syncKey}>
          {activeTab === "dashboard" && (
            <Dashboard token={token} onNavigateToTab={setActiveTab} t={t} language={language} privacyMode={privacyMode} />
          )}

          {activeTab === "check-in" && (
            <CheckInForm token={token} onSuccess={() => setActiveTab("active-parking")} t={t} language={language} />
          )}

          {activeTab === "active-parking" && (
            <ActiveParking token={token} onRefreshStats={() => {}} t={t} language={language} privacyMode={privacyMode} />
          )}

          {activeTab === "reports" && (
            <Reports token={token} t={t} language={language} privacyMode={privacyMode} />
          )}

          {activeTab === "expenses" && (
            <Expenses token={token} t={t} language={language} privacyMode={privacyMode} />
          )}

          {activeTab === "admin" && (
            <AdminPortal 
              token={token}
              user={user}
              onLogout={handleLogout}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              language={language}
              setLanguage={setLanguage}
              t={t}
              onChangePasswordClick={() => setShowChangePassword(true)}
              autoLogoutMins={autoLogoutMins}
              setAutoLogoutMins={setAutoLogoutMins}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Instagram-like) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-bento-sidebar/95 backdrop-blur-md border-t border-gray-200 dark:border-bento-border pb-safe shadow-lg">
        <nav className="flex justify-around items-center h-16 px-2">
          {[
            { id: "dashboard", label: language === "am" ? "ዳሽቦርድ" : language === "om" ? "Dabshboordii" : "Dashboard", icon: LayoutDashboard },
            { id: "expenses", label: language === "am" ? "ወጪዎች" : language === "om" ? "Baasii" : "Expenses", icon: Coins },
            { id: "check-in", label: language === "am" ? "ማስገቢያ" : language === "om" ? "Seensa" : "Check-In", icon: UserPlus },
            { id: "active-parking", label: language === "am" ? "ገባሪ" : language === "om" ? "Hojii" : "Active", icon: Receipt },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all ${
                  isActive
                    ? "text-amber-600 dark:text-emerald-400 font-extrabold"
                    : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                }`}
              >
                <Icon className={`w-5.5 h-5.5 mb-1 transition-transform ${isActive ? "scale-110 text-amber-500 dark:text-emerald-400" : ""}`} />
                <span className="text-[10px] tracking-tight truncate max-w-[76px] font-semibold">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-bento-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500 dark:text-emerald-400" />
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-md">
                    {t("changePassword")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handlePasswordChangeSubmit} className="p-6 space-y-4">
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                    {t("currentPassword")}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("enterCurrentPassword")}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                    {t("newPassword")}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("enterNewPassword")}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                    {t("confirmNewPassword")}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder={t("confirmNewPasswordPlaceholder")}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-bento-bg dark:hover:bg-bento-bg/80 border border-gray-200 dark:border-bento-border text-gray-700 dark:text-zinc-300 font-semibold text-sm rounded-xl transition-all cursor-pointer text-center"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-black font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{t("saveChanges")}</span>
                    )}
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

import { 
  LayoutDashboard, 
  UserPlus, 
  Receipt, 
  CalendarRange, 
  Sun, 
  Moon,
  ShieldCheck,
  X,
  Coins,
  Eye,
  EyeOff
} from "lucide-react";
import { User } from "../types";
import { Language } from "../lib/translations";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  darkMode: boolean;
  toggleDarkMode: () => void;
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  language: Language;
  t: (key: any) => string;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  darkMode,
  toggleDarkMode,
  privacyMode,
  togglePrivacyMode,
  language,
  t,
  onCloseMobile,
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "check-in", label: t("newCheckIn"), icon: UserPlus },
    { id: "active-parking", label: t("activeParking"), icon: Receipt },
    { id: "expenses", label: t("expenses") || "Expenses", icon: Coins },
  ];

  return (
    <div 
      className="flex flex-col h-full w-full bg-white dark:bg-bento-sidebar border-r border-gray-200 dark:border-bento-border transition-colors duration-300"
      role="navigation"
      aria-label="Main Navigation Menu"
    >
      {/* Branding Header */}
      <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-bento-border flex items-center justify-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 bg-amber-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white dark:text-black font-bold text-lg font-mono shadow-xs shrink-0 transition-colors"
            aria-hidden="true"
          >
            CH
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-gray-900 dark:text-white leading-tight text-md">Kiduse Company</h1>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium tracking-wider uppercase">Gate Manager</p>
          </div>
        </div>
        {/* Mobile close button */}
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 lg:px-4 py-4 lg:py-6 space-y-1.5 overflow-y-auto" aria-label="Main App Views">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Navigate to ${item.label}`}
              title={item.label}
              className={`w-full flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 ${
                isActive
                  ? "bg-amber-500/10 text-amber-600 dark:text-emerald-400 dark:bg-emerald-500/10 font-bold"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-bento-card/50"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} aria-hidden="true" />
              <span className="hidden lg:inline truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Controls & Profile */}
      <div className="p-3 lg:p-4 border-t border-gray-100 dark:border-bento-border bg-linear-to-t from-gray-50/50 to-white dark:from-bento-bg/20 dark:to-bento-sidebar">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5" aria-label="Logged-in operator profile">
            <div 
              className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs uppercase font-mono shrink-0 shadow-2xs" 
              aria-hidden="true"
              title={`${user.username} (${user.role})`}
            >
              {user.username.substring(0, 2)}
            </div>
            <div className="hidden lg:block truncate">
              <p className="text-xs font-semibold text-gray-900 dark:text-white capitalize truncate">{user.username}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider truncate">{user.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={togglePrivacyMode}
              className="p-2 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-xl transition-all cursor-pointer focus:outline-hidden"
              title={privacyMode ? "Show Financial Figures" : "Hide Financial Figures"}
            >
              {privacyMode ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-xl transition-all cursor-pointer focus:outline-hidden"
              aria-label={darkMode ? "Switch to light mode theme" : "Switch to dark mode theme"}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

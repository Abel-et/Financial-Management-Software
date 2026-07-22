import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, User, ShieldAlert, Loader } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, userInfo: { id: number; username: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idleNotice, setIdleNotice] = useState(false);

  React.useEffect(() => {
    const isIdle = localStorage.getItem("cattlehaven_logged_out_idle");
    if (isIdle === "true") {
      setIdleNotice(true);
      localStorage.removeItem("cattlehaven_logged_out_idle");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed. Please check credentials.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Could not reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-8 pb-6 text-center border-b border-gray-100 dark:border-zinc-800 bg-linear-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl mb-4 shadow-xs">
            <span className="font-bold text-2xl font-mono">CH</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">
            Kiduse Company
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Oxen Parking Management System
          </p>
        </div>

        <div className="p-8">
          {idleNotice && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 mb-6 text-xs text-amber-800 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30 rounded-xl font-medium"
            >
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>You have been signed out due to 5 minutes of inactivity.</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 p-3 mb-6 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-950/60 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-950/60 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600 text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          
        </div>
      </motion.div>
    </div>
  );
}

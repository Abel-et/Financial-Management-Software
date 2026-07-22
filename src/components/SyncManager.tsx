import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getOfflineCheckIns, deleteOfflineCheckIn, OfflineCheckIn } from "../lib/offlineDb";

interface SyncManagerProps {
  token: string | null;
  onSyncComplete?: () => void;
  t: (key: any) => string;
}

export default function SyncManager({ token, onSyncComplete, t }: SyncManagerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: ""
  });

  // Track network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus({ type: "success", message: "Internet connection restored. Synchronizing..." });
      triggerSync();
      setTimeout(() => setSyncStatus({ type: null, message: "" }), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus({ type: "error", message: "Internet disconnected. Running in offline resilience mode." });
      setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check of pending records
    checkPendingRecords();

    // Periodic check and background sync helper (runs every 15 seconds)
    const interval = setInterval(() => {
      checkPendingRecords();
      if (navigator.onLine && !isSyncing) {
        triggerSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [token]);

  const checkPendingRecords = async () => {
    try {
      const records = await getOfflineCheckIns();
      setPendingCount(records.length);
    } catch (err) {
      console.error("Failed to check pending records:", err);
    }
  };

  const triggerSync = async () => {
    if (!token) return;
    const records = await getOfflineCheckIns();
    if (records.length === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
      try {
        const finalPhone = record.phone.startsWith("+251") ? record.phone : `+251${record.phone}`;
        const res = await fetch("/api/parking/check-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` // Use current active session token for sync authentication
          },
          body: JSON.stringify({
            fullName: record.fullName,
            phone: finalPhone,
            cattleCount: record.cattleCount,
            pricePerCattle: record.pricePerCattle,
            parkingType: record.parkingType,
            amountPaid: record.amountPaid,
            paymentMethod: record.paymentMethod
          })
        });

        if (res.ok) {
          if (record.id !== undefined) {
            await deleteOfflineCheckIn(record.id);
          }
          successCount++;
        } else {
          const data = await res.json();
          console.warn(`Sync failed for ${record.fullName}:`, data.error);
          failCount++;
        }
      } catch (err) {
        console.error(`Network error syncing record for ${record.fullName}:`, err);
        failCount++;
      }
    }

    // Refresh count
    const updatedRecords = await getOfflineCheckIns();
    setPendingCount(updatedRecords.length);
    setIsSyncing(false);

    if (successCount > 0) {
      setSyncStatus({
        type: "success",
        message: `Successfully synchronized ${successCount} offline check-in records!`
      });
      setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);

      // Trigger callbacks to reload stats and data
      if (onSyncComplete) {
        onSyncComplete();
      }
    } else if (failCount > 0) {
      setSyncStatus({
        type: "error",
        message: `Failed to synchronize ${failCount} pending records. Retrying shortly.`
      });
      setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);
    }
  };

  return (
    <div className="w-full">
      {/* Dynamic Connectivity & Synchronization Status Banner */}
      <AnimatePresence>
        {(!isOnline || pendingCount > 0 || syncStatus.type) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full overflow-hidden border-b transition-all text-xs font-semibold select-none ${
              !isOnline
                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                : pendingCount > 0
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {!isOnline ? (
                  <WifiOff className="w-4 h-4 shrink-0 text-red-500" />
                ) : pendingCount > 0 ? (
                  <Wifi className="w-4 h-4 shrink-0 text-amber-500" />
                ) : (
                  <Wifi className="w-4 h-4 shrink-0 text-emerald-500" />
                )}
                <span>
                  {!isOnline
                    ? "Working Offline. Your connection is unstable or disconnected."
                    : pendingCount > 0
                    ? `Offline Caching active: ${pendingCount} check-in(s) pending background sync.`
                    : syncStatus.message || "Connected to Server"}
                </span>
              </div>

              {pendingCount > 0 && isOnline && (
                <button
                  onClick={triggerSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white dark:text-black hover:bg-amber-600 dark:hover:bg-amber-400 rounded-md text-[10px] font-extrabold transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

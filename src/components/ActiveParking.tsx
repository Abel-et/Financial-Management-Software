import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Receipt, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  X, 
  Coins, 
  Loader,
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone
} from "lucide-react";
import { ParkingRecord } from "../types";

interface ActiveParkingProps {
  token: string;
  onRefreshStats?: () => void;
  t: (key: any) => string;
  language: string;
  privacyMode?: boolean;
}

export default function ActiveParking({ token, onRefreshStats, t, language, privacyMode }: ActiveParkingProps) {
  const [records, setRecords] = useState<ParkingRecord[]>(() => {
    const cached = localStorage.getItem("cattlehaven_cached_active_records");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  const formatMoney = (val: number) => {
    if (privacyMode) return "••••••";
    return `ETB ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  const [loading, setLoading] = useState(() => {
    const cached = localStorage.getItem("cattlehaven_cached_active_records");
    return !cached;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Modal Checkout states
  const [additionalPayment, setAdditionalPayment] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentMethods, setPaymentMethods] = useState<{ name: string; code: string }[]>(() => {
    const cached = localStorage.getItem("cattlehaven_cached_payment_methods");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [
      { name: "Cash", code: "CASH" },
      { name: "CBE", code: "CBE" },
      { name: "Telebirr", code: "TELEBIRR" },
      { name: "Bank of Abyssinia", code: "ABYSSINIA" },
      { name: "Awash Bank", code: "AWASH" }
    ];
  });
  const [overrideUnpaid, setOverrideUnpaid] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchActiveParking = async () => {
    try {
      const res = await fetch("/api/parking/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        localStorage.setItem("cattlehaven_cached_active_records", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error fetching active parking:", err);
      const cached = localStorage.getItem("cattlehaven_cached_active_records");
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
      console.error("Error fetching payment methods:", err);
    }
  };

  useEffect(() => {
    fetchActiveParking();
    fetchPaymentMethods();
  }, []);

  const triggerToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Checkout/Release Modal
  const handleOpenCheckout = (record: ParkingRecord) => {
    setSelectedRecord(record);
    setAdditionalPayment(record.balanceDue); // Pre-fill with the full remaining balance
    setPaymentMethod("CASH");
    setOverrideUnpaid(false);
    setModalError("");
    setShowModal(true);
  };

  // Perform checkout action
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setModalLoading(true);
    setModalError("");

    try {
      const paymentAmount = additionalPayment === "" ? 0 : Number(additionalPayment);
      const remainingBalance = selectedRecord.balanceDue - paymentAmount;

      const res = await fetch(`/api/parking/check-out/${selectedRecord.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          additionalPayment: paymentAmount,
          paymentMethod,
          overrideUnpaid: overrideUnpaid || remainingBalance <= 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process release checkout.");
      }

      triggerToast("success", language === "am"
        ? `${data.cattleCount} በሬዎች ለ ${data.customer.fullName} በተሳካ ሁኔታ ተለቀዋል!`
        : language === "om"
        ? `Loon ${data.cattleCount} kan maqaa ${data.customer.fullName} kootiin milkiidhaan gadi lakkifamaniiru!`
        : `Successfully released ${data.cattleCount} oxen belonging to ${data.customer.fullName}.`);
      setShowModal(false);
      fetchActiveParking(); // Refresh lists
      
      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (err: any) {
      setModalError(err.message || "Something went wrong.");
    } finally {
      setModalLoading(false);
    }
  };

  // Filter active records by owner name or phone number
  const filteredRecords = records.filter(
    (r) =>
      r.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border text-xs font-semibold leading-normal shadow-lg ${
              toastMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border-red-100 dark:border-red-900/30"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t("activeParking")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {language === "am"
              ? "በጌት enclosure ውስጥ የተመዘገቡትን ሁሉንም ከብቶች በቅጽበት መከታተያ።"
              : language === "om"
              ? "Hordoffii yeroo sirrii loon guutuu karra keessatti galmeeffamanii."
              : "Real-time monitoring of all livestock currently registered inside the gate enclosure."}
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-bento-card text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Main Grid Enclosure */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
              {language === "am"
                ? "በጌት ላይ ያሉ የከብት መረጃዎችን በማምጣት ላይ..."
                : language === "om"
                ? "Galmeewwan karra irraa xiinxalamaa jiru..."
                : "Querying Active Enclosure Database..."}
            </p>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-extrabold text-gray-900 dark:text-white text-md">{t("noActiveParking")}</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1.5">{t("noActiveParkingDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700/80 transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header details */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block ${
                      r.parkingType === "DAY" 
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400" 
                        : r.parkingType === "BOTH"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400"
                    }`}>
                      {r.parkingType === "DAY"
                        ? (language === "am" ? "የቀን ፈረቃ" : language === "om" ? "Ziiqii Guyyaa" : "DAY Shift")
                        : r.parkingType === "BOTH"
                        ? (language === "am" ? "ሁለቱም ፈረቃ" : language === "om" ? "Lachuu (Guyyaa/Halkan)" : "BOTH Shifts")
                        : (language === "am" ? "የማታ ፈረቃ" : language === "om" ? "Ziiqii Halkan" : "NIGHT Shift")
                      }
                    </span>
                    <h3 className="font-bold text-gray-950 dark:text-white text-md tracking-tight leading-tight">{r.customer.fullName}</h3>
                  </div>

                  {/* Pricing per Head badge */}
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      {language === "am" ? "የጌት ዋጋ" : language === "om" ? "Gatii Karraa" : "Gate Rate"}
                    </p>
                    <p className="text-xs font-mono font-bold text-gray-800 dark:text-slate-300">{formatMoney(r.pricePerCattle)}/{language === "am" ? "በሬ" : language === "om" ? "ox" : "ox"}</p>
                  </div>
                </div>

                {/* Sub details */}
                <div className="space-y-2 pt-2 border-t border-gray-50 dark:border-bento-border/50">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400">
                    <span>{t("cattleCount")}:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{r.cattleCount} Head</span>
                  </div>

                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400">
                    <span>{t("phone")}:</span>
                    <span className="text-gray-950 dark:text-zinc-300 font-mono flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {r.customer.phone}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400">
                    <span>{language === "am" ? "የገባበት ሰዓት:" : language === "om" ? "Yeroo Seene:" : "Checked In:"}</span>
                    <span className="text-gray-950 dark:text-zinc-300 font-mono">
                      {new Date(r.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(r.entryTime).toLocaleDateString()})
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Status Footer */}
              <div className="px-5 py-4 bg-gray-50/70 dark:bg-bento-bg/30 border-t border-gray-100 dark:border-bento-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                    {language === "am" ? "የክፍያ ሁኔታ" : language === "om" ? "Haala Kaffaltii" : "Financial Status"}
                  </span>
                  {r.balanceDue > 0 ? (
                    <span className="text-xs font-bold text-red-500 dark:text-red-400 flex flex-wrap items-center gap-1 font-mono break-all">
                      {language === "am" ? "ቀሪ እዳ:" : language === "om" ? "Idaa Hafte:" : "Outstanding:"} {formatMoney(r.balanceDue)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex flex-wrap items-center gap-1 font-mono break-all">
                      {language === "am" ? "ሙሉ በሙሉ የተከፈለ:" : language === "om" ? "Guutummaatti Kaffalame:" : "Fully Paid:"} {formatMoney(r.totalAmount)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenCheckout(r)}
                  className="flex items-center justify-center gap-1 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-black font-extrabold text-xs rounded-lg shadow-2xs hover:shadow-sm transition-all cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  <span>{t("releaseParking")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Release/Checkout Modal Panel */}
      <AnimatePresence>
        {showModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-bento-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-md">{t("cattleReleaseTerminal")}</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Release Form */}
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
                {modalError && (
                  <div className="flex items-center gap-2.5 p-3 text-xs text-red-800 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Sub-header details */}
                <div className="space-y-1 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t("ownerName")}</span>
                    <span className="text-gray-900 dark:text-white font-bold">{selectedRecord.customer.fullName}</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-1">
                    <span className="text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t("cattleCount")}</span>
                    <span className="text-gray-950 dark:text-zinc-300 font-bold">{selectedRecord.cattleCount} Head</span>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/50 dark:bg-bento-bg/40 p-4 rounded-xl border border-gray-100 dark:border-bento-border/40 font-semibold text-gray-600 dark:text-zinc-400">
                  <div>
                    <span>{t("totalCharged")}:</span>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white font-mono mt-1">ETB {selectedRecord.totalAmount.toFixed(0)}</span>
                  </div>
                  <div>
                    <span>{language === "am" ? "በመግቢያው የተከፈለ:" : language === "om" ? "Kaffaltii Jalqabaa:" : "Amount Paid Initially:"}</span>
                    <span className="block text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">ETB {selectedRecord.amountPaid.toFixed(0)}</span>
                  </div>
                </div>

                {/* Additional Collection Input */}
                {selectedRecord.balanceDue > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                          {t("additionalPayment")} (ETB)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Coins className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={selectedRecord.balanceDue}
                            step="1"
                            value={additionalPayment}
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : Number(e.target.value);
                              setAdditionalPayment(val);
                            }}
                            className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                          {t("paymentMethod")}
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                        >
                          {paymentMethods.map((m) => (
                            <option key={m.code} value={m.code}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Override Unpaid Balance */}
                    {additionalPayment !== "" && Number(additionalPayment) < selectedRecord.balanceDue && (
                      <div className="flex items-center gap-2.5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <input
                          type="checkbox"
                          id="overrideUnpaid"
                          checked={overrideUnpaid}
                          onChange={(e) => setOverrideUnpaid(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor="overrideUnpaid" className="text-xs font-bold text-amber-800 dark:text-amber-400 cursor-pointer leading-none">
                          {language === "am"
                            ? `ከተቀረው ቀሪ እዳ ETB ${(selectedRecord.balanceDue - Number(additionalPayment)).toFixed(0)} ጋር መውጣቱን አረጋግጥ`
                            : language === "om"
                            ? `Idaa haftee ETB ${(selectedRecord.balanceDue - Number(additionalPayment)).toFixed(0)} waliin gadi lakkisi`
                            : `Confirm checkout with outstanding debt of ETB ${(selectedRecord.balanceDue - Number(additionalPayment)).toFixed(0)}`}
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Panel */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-bento-border/60">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-bento-bg dark:hover:bg-bento-bg/80 border border-gray-200 dark:border-bento-border text-gray-700 dark:text-zinc-300 font-semibold text-sm rounded-xl transition-all cursor-pointer text-center"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  >
                    {modalLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>{t("releasingCattle")}</span>
                      </>
                    ) : (
                      <span>{t("releaseAndCheckOut")}</span>
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

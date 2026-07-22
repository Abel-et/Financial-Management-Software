import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Phone, 
  TrendingUp, 
  Coins, 
  Clock, 
  Receipt, 
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Customer, ParkingRecord } from "../types";
import { saveOfflineCheckIn } from "../lib/offlineDb";

interface CheckInFormProps {
  token: string;
  onSuccess: () => void;
  t: (key: any) => string;
  language: string;
}

export default function CheckInForm({ token, onSuccess, t, language }: CheckInFormProps) {
  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cattleCount, setCattleCount] = useState<number | "">("");
  const [pricePerCattle, setPricePerCattle] = useState<number | "">("");
  const [parkingType, setParkingType] = useState<"DAY" | "NIGHT" | "BOTH">("DAY");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  // Dynamic Payment Methods list with caching fallback
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

  // Auxiliary State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentRecords, setRecentRecords] = useState<ParkingRecord[]>([]);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [loading, setLoading] = useState(false);

  // Clean phone utility to strip country codes for the form display digits
  const cleanPhoneInput = (rawPhone: string) => {
    let cleaned = rawPhone.replace(/\s+/g, "");
    if (cleaned.startsWith("+251")) {
      cleaned = cleaned.slice(4);
    } else if (cleaned.startsWith("251")) {
      cleaned = cleaned.slice(3);
    } else if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    return cleaned;
  };

  // 1. Fetch autocomplete profiles & recent records (for Quick Check-In details)
  const loadData = async () => {
    try {
      const custRes = await fetch("/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const custData = await custRes.json();
      if (custRes.ok) setCustomers(custData);

      const histRes = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const histData = await histRes.json();
      if (histRes.ok) setRecentRecords(histData);

      const pmRes = await fetch("/api/payment-methods", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pmRes.ok) {
        const pmData = await pmRes.json();
        setPaymentMethods(pmData);
        localStorage.setItem("cattlehaven_cached_payment_methods", JSON.stringify(pmData));
      }
    } catch (err) {
      console.error("Error loading customer database:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Draft Autosave for Offline Resilience
  useEffect(() => {
    const draft = localStorage.getItem("cattlehaven_draft_checkin");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFullName(parsed.fullName || "");
        setPhone(cleanPhoneInput(parsed.phone || ""));
        setCattleCount(parsed.cattleCount || "");
        setPricePerCattle(parsed.pricePerCattle || "");
        setParkingType(parsed.parkingType || "DAY");
        setAmountPaid(parsed.amountPaid || "");
        setPaymentMethod(parsed.paymentMethod || "CASH");
      } catch (e) {
        console.error("Failed to parse draft storage", e);
      }
    }
  }, []);

  useEffect(() => {
    const draftState = {
      fullName,
      phone,
      cattleCount,
      pricePerCattle,
      parkingType,
      amountPaid,
      paymentMethod,
    };
    localStorage.setItem("cattlehaven_draft_checkin", JSON.stringify(draftState));
  }, [fullName, phone, cattleCount, pricePerCattle, parkingType, amountPaid, paymentMethod]);

  // Handle name autocomplete with support for name and phone query matches
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);
    if (value.trim().length > 0) {
      const filtered = customers.filter((c) =>
        c.fullName.toLowerCase().includes(value.toLowerCase()) ||
        c.phone.includes(value)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      // Recommend top 5 most recent customers when empty
      setSuggestions(customers.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  // Immediate recommendation dropdown on focus
  const handleNameFocus = () => {
    if (fullName.trim().length === 0) {
      setSuggestions(customers.slice(0, 5));
      setShowSuggestions(true);
    } else {
      const filtered = customers.filter((c) =>
        c.fullName.toLowerCase().includes(fullName.toLowerCase()) ||
        c.phone.includes(fullName)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  // Quick Check-In Trigger
  const selectCustomer = (customer: Customer) => {
    setFullName(customer.fullName);
    setPhone(cleanPhoneInput(customer.phone));
    setShowSuggestions(false);

    // Look up last price used for this customer in records
    const lastRecordForCustomer = recentRecords.find((r) => r.customerId === customer.id);
    if (lastRecordForCustomer) {
      setPricePerCattle(lastRecordForCustomer.pricePerCattle);
      // Give visual feedback or a toast for auto-filling
      const msg = language === "am"
        ? `ፈጣን መግቢያ ንቁ ሆኗል! የመጨረሻውን ዋጋ ተጭኗል: ETB ${lastRecordForCustomer.pricePerCattle} በራስ ከብት።`
        : language === "om"
        ? `Saffisaan galmeessuun danda'ameera! Gatii dhumaa fe'eera: ETB ${lastRecordForCustomer.pricePerCattle} qe'ee tokkoof.`
        : `Quick Check-In activated! Loaded last pricing: ETB ${lastRecordForCustomer.pricePerCattle}/cattle.`;
      setSubmitStatus({
        type: "success",
        message: msg,
      });
      setTimeout(() => setSubmitStatus({ type: null, message: "" }), 4000);
    }
  };

  // Dynamic calculations
  const totalDue = Number(cattleCount || 0) * Number(pricePerCattle || 0);
  const remainingBalance = Math.max(0, totalDue - Number(amountPaid || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !cattleCount || !pricePerCattle || amountPaid === undefined) {
      const msg = language === "am"
        ? "እባክዎ ሁሉንም አስፈላጊ ቦታዎች ይሙሉ"
        : language === "om"
        ? "Maaloo, iddoowwan barbaachisoo hunda guutaa."
        : "Please fill in all required fields.";
      setSubmitStatus({ type: "error", message: msg });
      return;
    }

    const total = Number(cattleCount) * Number(pricePerCattle);
    const paid = Number(amountPaid);
    if (paid > total) {
      const msg = language === "am"
        ? `የመጀመሪያ ክፍያ (ETB ${paid}) ከአጠቃላይ ክፍያ (ETB ${total}) ሊበልጥ አይችልም። እባክዎ ያስተካክሉ።`
        : language === "om"
        ? `Kaffaltii jalqabaa (ETB ${paid}) kaffaltii guutuu (ETB ${total}) caaluu hin danda'u. Maaloo sirreessaa.`
        : `Initial payment (ETB ${paid}) cannot exceed the total expected amount (ETB ${total}). Please correct this false data.`;
      setSubmitStatus({
        type: "error",
        message: msg,
      });
      return;
    }

    const finalPhone = phone.startsWith("+251") ? phone : `+251${phone}`;

    const saveOffline = async (reason: string) => {
      try {
        await saveOfflineCheckIn({
          fullName,
          phone: finalPhone,
          cattleCount: Number(cattleCount),
          pricePerCattle: Number(pricePerCattle),
          parkingType,
          amountPaid: Number(amountPaid),
          paymentMethod,
          timestamp: Date.now(),
          token,
        });

        // Clear draft on successful offline saving
        localStorage.removeItem("cattlehaven_draft_checkin");

        // Reset form fields
        setFullName("");
        setPhone("");
        setCattleCount("");
        setPricePerCattle("");
        setParkingType("DAY");
        setAmountPaid("");
        setPaymentMethod("CASH");

        const offlineReason = language === "am" ? "ከመስመር ውጭ መስሪያ ንቁ ሆኗል።" : language === "om" ? "Tajaajila Al-Sararaa Banameera." : "Offline Mode Active.";
        const offlineMsg = language === "am"
          ? `${offlineReason} መረጃው በአሳሹ ውስጥ በተሳካ ሁኔታ ተቀምጧል! ኢንተርኔት ሲገናኝ በራስ-ሰር ይመሳሰላል።`
          : language === "om"
          ? `${offlineReason} Milkiidhaan galmeeffameera! Interneetiin yoo deebi'u ofumaan wal-simata.`
          : `${offlineReason} Saved offline successfully to IndexedDB! It will automatically synchronize once internet connectivity is restored.`;

        setSubmitStatus({
          type: "success",
          message: offlineMsg,
        });

        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } catch (dbErr: any) {
        const errorMsg = language === "am"
          ? `ከመስመር ውጭ ማስቀመጥ አልተቻለም: ${dbErr.message || dbErr}`
          : language === "om"
          ? `Al-sararaatti olkaahuun hin danda'amne: ${dbErr.message || dbErr}`
          : `Could not save check-in offline: ${dbErr.message || dbErr}`;
        setSubmitStatus({
          type: "error",
          message: errorMsg,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.onLine) {
      setLoading(true);
      const offlineReason = language === "am" ? "ከመስመር ውጭ ማስቀመጥ" : language === "om" ? "Haala Al-Sararaa" : "Offline Mode Active.";
      await saveOffline(offlineReason);
      return;
    }

    setLoading(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/parking/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phone: finalPhone,
          cattleCount: Number(cattleCount),
          pricePerCattle: Number(pricePerCattle),
          parkingType,
          amountPaid: Number(amountPaid),
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process check-in.");
      }

      // Clear draft on successful submission
      localStorage.removeItem("cattlehaven_draft_checkin");

      // Reset form fields
      setFullName("");
      setPhone("");
      setCattleCount("");
      setPricePerCattle("");
      setParkingType("DAY");
      setAmountPaid("");
      setPaymentMethod("CASH");

      const successMsg = language === "am"
        ? `${data.cattleCount} በሬዎች ለ ${data.customer.fullName} በተሳካ ሁኔታ ገብተዋል!`
        : language === "om"
        ? `Loon ${data.cattleCount} maqaa ${data.customer.fullName} kootiin milkiidhaan galmeeffamaniiru!`
        : `Checked in ${data.cattleCount} oxen for ${data.customer.fullName} successfully!`;

      setSubmitStatus({
        type: "success",
        message: successMsg,
      });

      // Reload autocomplete database
      loadData();

      // Trigger navigation or updates
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: any) {
      // If it's a network/connection error, store it in IndexedDB
      const isNetworkError = !navigator.onLine || 
                             err.name === "TypeError" || 
                             err.message?.toLowerCase().includes("failed to fetch") ||
                             err.message?.toLowerCase().includes("network error");
      
      if (isNetworkError) {
        console.warn("Network error encountered. Saving check-in offline to IndexedDB:", err);
        await saveOffline("Connection unstable.");
      } else {
        setSubmitStatus({ type: "error", message: err.message || "Something went wrong." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t("newArrivalCheckIn")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          {language === "am"
            ? "የሚገቡ ከብቶችን ይመዝግቡ፣ ፈረቃዎችን ይያዙ እና የመጀመሪያ ደረጃ ክፍያዎችን ይቀበሉ።"
            : language === "om"
            ? "Loon seenan galmeessi, ziiqii qabadhu, fi kaffaltii jalqabaa sassaabi."
            : "Register incoming cattle, capture shifts, and receive initial parking payments."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl relative">
          {/* Toast Notification Container */}
          <AnimatePresence>
            {submitStatus.type && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-start gap-3 p-4 mb-6 rounded-xl border text-xs font-medium leading-relaxed ${
                  submitStatus.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
                    : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/30"
                }`}
              >
                {submitStatus.type === "success" ? (
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
                )}
                <div>{submitStatus.message}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {t("customerInfo")}
            </h3>

            {/* Customer Name input with Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5" htmlFor="checkin-owner-name">
                {t("ownerName")} *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400" aria-hidden="true">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="checkin-owner-name"
                  type="text"
                  value={fullName}
                  onChange={handleNameChange}
                  onFocus={handleNameFocus}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t("enterOwnerName")}
                  required
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-controls="owner-name-suggestions"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-semibold"
                />
              </div>

              {/* Autocomplete Suggestions Panel */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    id="owner-name-suggestions"
                    role="listbox"
                    aria-label="Owner Name Recommendations"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-bento-border/60"
                  >
                    {suggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        role="option"
                        aria-selected={fullName === c.fullName}
                        onClick={() => selectCustomer(c)}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-amber-500/5 hover:text-amber-600 dark:hover:bg-amber-500/5 dark:hover:text-amber-400 flex items-center justify-between transition-colors cursor-pointer font-medium text-gray-800 dark:text-zinc-200"
                      >
                        <span>{c.fullName}</span>
                        <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {t("phone")}: {c.phone}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Phone Number with Static +251 Prefix */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5" htmlFor="checkin-phone">
                {t("phone")} *
              </label>
              <div className="relative flex rounded-xl border border-gray-200 dark:border-bento-border bg-gray-50 dark:bg-bento-bg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <span className="flex items-center pl-3.5 pr-2.5 text-gray-500 dark:text-zinc-400 text-sm font-semibold border-r border-gray-200 dark:border-bento-border bg-gray-100/50 dark:bg-zinc-850/40 select-none">
                  +251
                </span>
                <input
                  id="checkin-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPhone(val);
                  }}
                  placeholder="983431234"
                  required
                  aria-label="Phone number (without +251 prefix)"
                  className="w-full px-4 py-2.5 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-hidden placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-semibold"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 pl-1">
                {language === "am"
                  ? "ከ +251 ቀጥሎ ያሉትን ቁጥሮች ብቻ ያስገቡ (ለምሳሌ 911000000 ወይም 711000000)"
                  : language === "om"
                  ? "Lakk bilbilaa +251 booda jiru qofa galchi (fkn. 911000000 ykn 711000000)"
                  : "Enter digits starting after +251 (e.g. 911000000 or 711000000)"}
              </p>
            </div>

            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 pt-4 border-t border-gray-50 dark:border-bento-border/40">
              {t("parkingSpecs")}
            </h3>

            {/* Oxen Count & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                  {t("cattleCount")} *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={cattleCount}
                    onChange={(e) => setCattleCount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={t("enterHeadCount")}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                  {t("ratePerHead")} (ETB) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Coins className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pricePerCattle}
                    onChange={(e) => setPricePerCattle(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={language === "am" ? "የአንዱ ዋጋ በብር" : language === "om" ? "Gatii mataa tokkoo" : "Rate in ETB"}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Shift Picker Buttons */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-2">
                {t("shift")} *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setParkingType("DAY")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    parkingType === "DAY"
                      ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:bg-amber-500/5 dark:text-amber-400"
                      : "border-gray-200 hover:border-gray-300 dark:border-bento-border dark:hover:border-slate-700 text-gray-600 dark:text-zinc-400"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{language === "am" ? "የቀን ፈረቃ" : language === "om" ? "Ziiqii Guyyaa" : "Day Shift"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParkingType("NIGHT")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    parkingType === "NIGHT"
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:bg-indigo-500/5 dark:text-indigo-400"
                      : "border-gray-200 hover:border-gray-300 dark:border-bento-border dark:hover:border-slate-700 text-gray-600 dark:text-zinc-400"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>{language === "am" ? "የማታ ፈረቃ" : language === "om" ? "Ziiqii Halkan" : "Night Shift"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParkingType("BOTH")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    parkingType === "BOTH"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:bg-emerald-500/5 dark:text-emerald-400"
                      : "border-gray-200 hover:border-gray-300 dark:border-bento-border dark:hover:border-slate-700 text-gray-600 dark:text-zinc-400"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>{language === "am" ? "ሁለቱም (ቀን/ማታ)" : language === "om" ? "Lachuu (Guyyaa/Halkan)" : "Both (Day/Night)"}</span>
                </button>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 pt-4 border-t border-gray-50 dark:border-bento-border/40">
              {t("initialCollection")}
            </h3>

            {/* Initial Payment & Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                  {language === "am" ? "የመጀመሪያ ክፍያ ተቀብሏል" : language === "om" ? "Kaffaltii Jalqabaa Sassaabame" : "Initial Payment Received"} (ETB) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Coins className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={language === "am" ? "ክፍያ በብር" : language === "om" ? "Kaffaltii ETB" : "Payment in ETB"}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
                  {t("paymentMethod")} *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bento-bg text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-bento-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              <span>{loading ? (language === "am" ? "በመመዝገብ ላይ..." : language === "om" ? "Galmeessaa jira..." : "Registering Check-In...") : t("confirmGateEntry")}</span>
            </button>
          </form>
        </div>

        {/* Dynamic Calculator Column */}
        <div className="bg-white dark:bg-bento-card border border-gray-200 dark:border-bento-border rounded-2xl p-6 shadow-xl sticky top-8">
          <h3 className="font-bold text-gray-900 dark:text-white text-md tracking-tight">{t("receiptEstimate")}</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            {language === "am"
              ? "ለአሁኑ የመግቢያ ሁኔታ ቅጽበታዊ የገንዘብ ስሌት መመልከቻ።"
              : language === "om"
              ? "Herrega herregamu kan yeroo ammaa loon galmeeffamaniif."
              : "Real-time financial calculator for current check-in spec."}
          </p>

          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-bento-border/50">
              <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t("cattleCount")}</span>
              <span className="text-sm font-bold text-gray-800 dark:text-zinc-200 font-mono">
                {cattleCount ? `${cattleCount} ${t("cattleHeadCount")}` : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-bento-border/50">
              <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t("ratePerHead")}</span>
              <span className="text-sm font-bold text-gray-800 dark:text-zinc-200 font-mono">
                {pricePerCattle ? `ETB ${Number(pricePerCattle).toFixed(0)}` : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-bento-border/50">
              <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t("totalCharged")}</span>
              <span className="text-lg font-extrabold text-gray-900 dark:text-white font-mono">
                ETB {totalDue.toFixed(0)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-bento-border/50">
              <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t("amountCollected")}</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ETB {Number(amountPaid || 0).toFixed(0)}
              </span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{t("balanceDue")}</span>
              <span className={`text-xl font-black font-mono ${remainingBalance > 0 ? "text-red-500 dark:text-red-400 animate-pulse" : "text-emerald-600 dark:text-emerald-400"}`}>
                ETB {remainingBalance.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-bento-border/60 bg-linear-to-b from-transparent to-emerald-500/5 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-gray-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              {t("offlineModeEnabled")}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
              {t("offlineModeDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

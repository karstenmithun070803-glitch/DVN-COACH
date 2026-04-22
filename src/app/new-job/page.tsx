"use client";

import { useState, useMemo, useEffect, Suspense, Fragment } from "react";
import { ChevronDown, ChevronUp, Printer, User, Hash, Phone, Key, Calendar, Settings, MapPin, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { BaseModels, DEFAULT_SEATING_ROWS } from "@/data/specs";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { useJobs } from "@/context/JobsContext";
import { t } from "@/data/translation";

const DRAFT_NEW_KEY = "dvn-new-job-draft";
const editDraftKey = (id: string) => `dvn-edit-draft-${id}`;

const fmtPrice = (p: number) => {
  const abs = Math.abs(p);
  if (abs >= 100000) return `${(abs / 100000).toFixed(abs % 100000 === 0 ? 0 : 1)}L`;
  if (abs >= 1000)   return `${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k`;
  return `${abs}`;
};

function wrapStandard(std: Record<string, string>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(std).map(([k, v]) => [k, [v]]));
}

const DEFAULT_BASIC_INFO = {
  customerName: "",
  jobNo: "",
  mobileNo: "",
  address: "",
  chassisNo: "",
  date: new Date().toISOString().split("T")[0],
  engineNo: ""
};

function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const cloneId = searchParams.get("cloneId");

  const { profiles, isLoaded } = useAdminSettings();
  const { addJob, updateJob, jobs } = useJobs();

  const [activeModel, setActiveModel] = useState<BaseModels>("Town");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [fieldNotes, setFieldNotes] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string>("CHASSIS");
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [currentCloneId, setCurrentCloneId] = useState<string | null>(null);
  const [isTamil, setIsTamil] = useState(false);
  const [isStandardBuild, setIsStandardBuild] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [basicInfo, setBasicInfo] = useState(DEFAULT_BASIC_INFO);
  const [seating, setSeating] = useState<Record<string, number>>({});

  // isHydrated is STATE (not ref) so the persist effect only fires on the render
  // AFTER hydration — by which point all setState calls from hydration are applied.
  // Using a ref here causes the race: persist fires same-cycle and reads stale initial values.
  const [isHydrated, setIsHydrated] = useState(false);

  // ─── Exit edit/clone when user clicks "New Job" nav link ──────────────────
  // URL transitions from /new-job?editId=xxx → /new-job without a remount.
  // Directly reset all form state to a clean slate here instead of re-running
  // hydration (which would load DRAFT_NEW_KEY and restore the old new-job draft).
  // localStorage is intentionally left untouched.
  useEffect(() => {
    if (isHydrated && !editId && !cloneId && (currentEditId || currentCloneId)) {
      setCurrentEditId(null);
      setCurrentCloneId(null);
      setActiveModel("Town");
      setBasicInfo({ ...DEFAULT_BASIC_INFO });
      setSelections(wrapStandard(profiles["Town"].standardSelections));
      setFieldNotes({});
      setSeating({});
      setIsStandardBuild(true);
      // Keep isHydrated true — we don't want the hydration effect to run again
    }
  }, [editId, cloneId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Hydration ────────────────────────────────────────────────────────────
  // Runs when: AdminSettings loaded, jobs available, or not yet hydrated.
  // "if (isHydrated) return" ensures this only runs to completion once.
  useEffect(() => {
    if (!isLoaded || isHydrated) return;

    if (editId) {
      // Try persisted mid-edit draft first
      const saved = localStorage.getItem(editDraftKey(editId));
      if (saved) {
        const draft = JSON.parse(saved);
        setCurrentEditId(editId);
        setActiveModel(draft.activeModel ?? "Town");
        setBasicInfo({ ...DEFAULT_BASIC_INFO, ...draft.basicInfo });
        setSelections(draft.selections ?? {});
        setFieldNotes(draft.fieldNotes ?? {});
        setSeating(draft.seating ?? {});
        setIsStandardBuild(false);
        setIsHydrated(true);
        return;
      }
      // Fall back to job record — wait if jobs haven't loaded yet
      const job = jobs.find(j => j.id === editId);
      if (!job) return; // jobs still loading — effect will re-run when jobs changes
      setCurrentEditId(job.id);
      setActiveModel(job.model);
      setBasicInfo({
        customerName: job.customerName || "",
        jobNo: job.jobNo || "",
        mobileNo: job.mobileNo || "",
        address: job.address || "",
        chassisNo: job.chassisNo || "",
        engineNo: job.engineNo || "",
        date: job.startDate || new Date().toISOString().split("T")[0],
      });
      if (job.selections) {
        const normalised = Object.fromEntries(
          Object.entries(job.selections).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
        );
        setSelections(normalised);
      }
      if (job.fieldNotes) setFieldNotes(job.fieldNotes);
      if (job.seatingCapacity) setSeating(job.seatingCapacity);
      setIsStandardBuild(false);
      setIsHydrated(true);
      return;
    }

    if (cloneId) {
      const job = jobs.find(j => j.id === cloneId);
      if (!job) return; // wait for jobs
      setCurrentCloneId(job.id);
      setActiveModel(job.model);
      setBasicInfo({
        customerName: job.customerName || "",
        jobNo: "",
        mobileNo: job.mobileNo || "",
        address: "",
        chassisNo: "",
        engineNo: "",
        date: new Date().toISOString().split("T")[0],
      });
      if (job.selections) {
        const normalised = Object.fromEntries(
          Object.entries(job.selections).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
        );
        setSelections(normalised);
      }
      setIsStandardBuild(false);
      setIsHydrated(true);
      return;
    }

    // New job — restore from draft if available
    const saved = localStorage.getItem(DRAFT_NEW_KEY);
    if (saved) {
      const draft = JSON.parse(saved);
      setActiveModel(draft.activeModel ?? "Town");
      setBasicInfo({ ...DEFAULT_BASIC_INFO, ...draft.basicInfo });
      setSelections(draft.selections ?? {});
      setFieldNotes(draft.fieldNotes ?? {});
      setSeating(draft.seating ?? {});
      setIsStandardBuild(draft.isStandardBuild ?? true);
    } else {
      // Brand new job with no draft
      setBasicInfo(DEFAULT_BASIC_INFO);
      setSelections(wrapStandard(profiles["Town"].standardSelections));
    }
    setIsHydrated(true);
  // jobs (not jobs.length) so effect re-runs when the array reference changes (new load)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isHydrated, jobs, editId, cloneId]);

  // Apply standard selections when user changes the model manually (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    if (isStandardBuild && !currentEditId && !currentCloneId) {
      setSelections(wrapStandard(profiles[activeModel].standardSelections));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModel]);

  // ─── Persist draft ────────────────────────────────────────────────────────
  // isHydrated being STATE (not ref) means this effect only fires on the render
  // AFTER hydration completes — so it always sees the correct hydrated values.
  useEffect(() => {
    if (!isHydrated) return;
    const draft = { basicInfo, activeModel, selections, fieldNotes, seating, isStandardBuild };
    if (editId) {
      localStorage.setItem(editDraftKey(editId), JSON.stringify(draft));
    } else if (!cloneId) {
      localStorage.setItem(DRAFT_NEW_KEY, JSON.stringify(draft));
    }
  }, [isHydrated, basicInfo, activeModel, selections, fieldNotes, seating, isStandardBuild, editId, cloneId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleStandardToggle = (checked: boolean) => {
    setIsStandardBuild(checked);
    if (checked) {
      setSelections(wrapStandard(profiles[activeModel].standardSelections));
    } else {
      setSelections({});
    }
  };

  const handleModelSelect = (model: BaseModels) => {
    setActiveModel(model);
    if (isStandardBuild) {
      setSelections(wrapStandard(profiles[model].standardSelections));
    }
  };

  const handleSelect = (fieldName: string, value: string) => {
    setIsStandardBuild(false);
    setSelections(prev => {
      const current = prev[fieldName] ?? [];
      const already = current.includes(value);
      const next = already ? current.filter(v => v !== value) : [...current, value];
      if (next.length === 0) {
        return Object.fromEntries(Object.entries(prev).filter(([k]) => k !== fieldName));
      }
      return { ...prev, [fieldName]: next };
    });
  };

  const handleClear = () => {
    localStorage.removeItem(DRAFT_NEW_KEY);
    setBasicInfo({ ...DEFAULT_BASIC_INFO, date: new Date().toISOString().split("T")[0] });
    setSelections(wrapStandard(profiles[activeModel].standardSelections));
    setFieldNotes({});
    setSeating({});
    setIsStandardBuild(true);
    setShowClearModal(false);
  };

  const handlePushToLiveFloor = () => {
    const jobData = {
      customerName: basicInfo.customerName || "New Customer",
      jobNo: basicInfo.jobNo || "",
      chassisNo: basicInfo.chassisNo || "",
      engineNo: basicInfo.engineNo || "",
      mobileNo: basicInfo.mobileNo,
      address: basicInfo.address || undefined,
      model: activeModel,
      startDate: basicInfo.date,
      selections: { ...selections },
      fieldNotes: Object.keys(fieldNotes).length > 0 ? { ...fieldNotes } : undefined,
      seatingCapacity: Object.values(seating).some(v => v > 0) ? { ...seating } : undefined,
      totalEstimate: currentEstimate
    };

    if (currentEditId) {
      updateJob(currentEditId, jobData);
      localStorage.removeItem(editDraftKey(currentEditId));
      router.push("/vault");
    } else {
      addJob({
        id: `job-${Date.now()}`,
        ...jobData,
        stage: "Chassis Arrival" as const,
        status: "active" as const,
      });
      localStorage.removeItem(DRAFT_NEW_KEY);
      router.push("/vault");
    }
  };

  // ─── Estimate ─────────────────────────────────────────────────────────────
  const currentEstimate = useMemo(() => {
    if (!isLoaded) return 0;
    const profile = profiles[activeModel];
    let total = profile.basePrice;
    Object.entries(selections).forEach(([key, vals]) => {
      const fieldDef = profile.specGroups.flatMap(s => s.fields).find(f => f.name === key);
      if (fieldDef?.optionPricing) {
        vals.forEach(val => {
          const price = fieldDef.optionPricing![val];
          if (price) total += price;
        });
      }
    });
    return total;
  }, [activeModel, selections, profiles, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const activeProfile = profiles[activeModel];
  const SPEC_CONFIGURATOR = activeProfile.specGroups;
  const seatingTotal = (activeProfile.seatingRows ?? DEFAULT_SEATING_ROWS).reduce(
    (sum, r) => sum + (seating[r.id] || 0) * r.multiplier, 0
  );

  const handleSectionToggle = (sectionName: string) => {
    const isOpening = activeSection !== sectionName;
    setActiveSection(isOpening ? sectionName : "");
    if (isOpening) {
      setTimeout(() => {
        const el = document.getElementById(`section-${sectionName}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const isNewJob = !editId && !cloneId;

  return (
    <div className="bg-[#F8FAFC] text-[#333333] font-sans px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Clear confirmation modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Clear this entry?</h2>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to clear this entry? This will delete all typed information.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Spec modal */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Live Specifications — {activeModel}</h2>
              <button onClick={() => setShowLiveModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {Object.keys(selections).length === 0 && seatingTotal === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">No specifications selected yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {Object.entries(selections).map(([key, vals]) => (
                    <div key={key} className="flex justify-between items-start border-b border-slate-100 py-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wide w-1/2 leading-tight mt-0.5">{key}</span>
                      <span className="text-sm font-semibold text-slate-800 text-right w-1/2">{vals.join(", ")}</span>
                    </div>
                  ))}
                  {seatingTotal > 0 && (
                    <div className="flex justify-between items-start border-b border-slate-100 py-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wide w-1/2 leading-tight mt-0.5">Seating Capacity</span>
                      <span className="text-sm font-semibold text-slate-800 text-right w-1/2">{seatingTotal} Seats</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div className="p-6 flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-xl font-bold text-[#333333] tracking-tight">
            {currentEditId ? "Edit Job" : currentCloneId ? "Clone & Edit" : "New Configurator"}
          </h1>
          <div className="flex gap-4 items-center flex-wrap">

            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setIsTamil(false)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  !isTamil ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                English
              </button>
              <button
                onClick={() => setIsTamil(true)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  isTamil ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                தமிழ்
              </button>
            </div>

            {isNewJob && (
              <button
                onClick={() => setShowClearModal(true)}
                className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-sm font-medium transition-all"
              >
                Clear
              </button>
            )}

            <label className="flex items-center cursor-pointer gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 transition-shadow">
              <span className="font-medium text-[#475569] text-sm">Standard Build</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isStandardBuild}
                  onChange={(e) => handleStandardToggle(e.target.checked)}
                />
                <div className={cn("block w-10 h-6 rounded-full transition-colors", isStandardBuild ? "bg-teal-500" : "bg-slate-200")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm", isStandardBuild ? "transform translate-x-4" : "")}></div>
              </div>
            </label>

            <div className="flex gap-3">
              <button
                onClick={handlePushToLiveFloor}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg uppercase tracking-wide",
                  currentEditId
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
                    : currentCloneId
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                    : "bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20"
                )}
              >
                {currentEditId ? "Update Changes" :
                 currentCloneId ? "Save as New Job" :
                 "Create as a New Job"}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm font-medium transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Spec</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>

        {/* -- PRINT ONLY SPEC SHEET -- */}
        <>
          <style>{`
            @media print {
              @page {
                margin: 1cm;
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; border-top: 1px solid #cbd5e1; }
                @bottom-center { content: ""; border-top: 1px solid #cbd5e1; }
                @bottom-right { content: counter(page) " | Page"; font-size: 8pt; font-family: sans-serif; color: #9ca3af; border-top: 1px solid #cbd5e1; }
              }
              html, body { background: white !important; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}</style>
          <div className="hidden print:block bg-white text-black font-sans">
            {/* Watermark — position:fixed repeats on every printed page */}
            <div style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-45deg)",
              width: "160mm",
              height: "160mm",
              opacity: 0.08,
              zIndex: 0,
              pointerEvents: "none",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/dvn-logo-2.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div className="px-2 py-6" style={{ position: "relative", zIndex: 1 }}>
              <div className="text-center w-full block mb-8">
                <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-1 text-slate-900">Durga Industries</h1>
                <p className="text-base font-bold uppercase tracking-widest text-slate-800">Specifications for Body Building</p>
                <p className="text-xs text-gray-700 mt-1 max-w-lg mx-auto">SF.NO. 1994/2 Madurai New Bye Pass Road Near Periyar Arch, Karur - 639008</p>
              </div>

              <div className="flex justify-between gap-12 text-sm border-b border-slate-400 pb-5 mb-5">
                <div className="flex flex-col gap-5 w-1/2">
                  <div className="flex w-full items-end">
                    <strong className="shrink-0 mr-3">Customer Name:</strong>
                    <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.customerName}</div>
                  </div>
                  <div className="flex w-full items-end">
                    <strong className="shrink-0 mr-3">Mobile No:</strong>
                    <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.mobileNo}</div>
                  </div>
                  <div className="flex w-full items-end">
                    <strong className="shrink-0 mr-3">Address:</strong>
                    <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.address}</div>
                  </div>
                  <div className="flex w-full items-end">
                    <strong className="shrink-0 mr-3">Date:</strong>
                    <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.date}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-5 w-1/2">
                  <div className="flex w-full items-end">
                    <strong className="shrink-0 mr-3">Job No:</strong>
                    <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.jobNo}</div>
                  </div>
                  <div className="flex w-full items-end">
                    <strong className="shrink-0 mr-3">Chassis No:</strong>
                    <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.chassisNo}</div>
                  </div>
                  <div className="flex w-full items-end">
                    <strong className="shrink-0 mr-3">Engine No:</strong>
                    <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.engineNo}</div>
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  {activeProfile.specGroups.map(group => {
                    const groupFields = group.fields.filter(f => selections[f.name]);
                    const isSeatingSlot = group.groupName === "FITTINGS";
                    const hasSeating = isSeatingSlot && Object.values(seating).some(v => v > 0);
                    if (groupFields.length === 0 && !hasSeating) return null;
                    const seatingRows = hasSeating ? (activeProfile.seatingRows ?? DEFAULT_SEATING_ROWS) : [];
                    const printRows = hasSeating
                      ? seatingRows
                          .map(r => ({ location: t(r.location, isTamil), type: t(r.type, isTamil), qty: seating[r.id] ?? 0, mul: r.multiplier }))
                          .filter(r => r.qty > 0)
                      : [];
                    const seatingPrintTotal = printRows.reduce((s, r) => s + r.qty * r.mul, 0);
                    return (
                      <Fragment key={group.groupName}>
                        {groupFields.length > 0 && (
                          <>
                            <tr className="break-after-avoid">
                              <td colSpan={3} className="pt-4 pb-0.5 border-b border-slate-300">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                  {t(group.groupName, isTamil)}
                                </span>
                              </td>
                            </tr>
                            {groupFields.map(field => {
                              const note = field.noteEnabled ? fieldNotes[field.id] : undefined;
                              return (
                                <tr key={field.id} className="break-inside-avoid">
                                  <td className={cn(
                                    "py-[3px] pr-3 align-top font-semibold uppercase text-slate-700",
                                    isTamil && "font-bold text-[13px]"
                                  )}>
                                    {t(field.name, isTamil)}
                                  </td>
                                  <td className="py-[3px] px-1 align-top text-slate-500 font-normal">:</td>
                                  <td className={cn(
                                    "py-[3px] pl-1 align-top font-bold text-slate-900",
                                    isTamil && "font-extrabold text-[14px]"
                                  )}>
                                    {selections[field.name].map((v: string) => t(v, isTamil)).join(", ")}
                                    {note && <span className="block text-xs text-slate-500 font-normal mt-0.5 whitespace-pre-wrap">{note}</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        )}
                        {hasSeating && (
                          <tr className="break-inside-avoid">
                            <td colSpan={3} className="pt-4">
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-300 pb-0.5 mb-1 break-after-avoid">{t("Seating Capacity", isTamil)}</p>
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="text-xs text-slate-500 uppercase">
                                    <th className="text-left pb-1 font-semibold">Location</th>
                                    <th className="text-left pb-1 font-semibold">Type</th>
                                    <th className="text-center pb-1 font-semibold">×</th>
                                    <th className="text-center pb-1 font-semibold">Rows</th>
                                    <th className="text-center pb-1 font-semibold">=</th>
                                    <th className="text-right pb-1 font-semibold">Seats</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {printRows.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                      <td className="py-1">{r.location}</td>
                                      <td className="py-1">{r.type}</td>
                                      <td className="py-1 text-center text-slate-400">×</td>
                                      <td className="py-1 text-center font-bold">{r.qty}</td>
                                      <td className="py-1 text-center text-slate-400">=</td>
                                      <td className="py-1 text-right font-bold">{r.qty * r.mul}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-slate-400">
                                    <td colSpan={5} className="pt-1 font-bold">Total</td>
                                    <td className="pt-1 text-right font-extrabold text-lg">{seatingPrintTotal}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>

              <div className="break-inside-avoid mt-8">
                <div className="pt-4 border-t border-slate-300">
                  <p className="text-sm">
                    <span className="font-bold underline">Extras:</span>
                    &nbsp; 1. Art Work&nbsp;&nbsp; 2. Audio &amp; Videos&nbsp;&nbsp; 3. Decorative Lights&nbsp;&nbsp; 4. Stickers&nbsp;&nbsp; 5. Driver seat
                  </p>
                  <div className="text-sm mt-2">
                    <p className="font-bold underline italic">Note:</p>
                    <ul className="mt-1 space-y-0.5 list-none">
                      <li><span style={{ fontSize: "0.7em" }}>●</span> Advance 50 %</li>
                      <li><span style={{ fontSize: "0.7em" }}>●</span> Full Settlement before two days at the time of delivery</li>
                      <li><span style={{ fontSize: "0.7em" }}>●</span> After 6 PM Vehicle will not be delivered</li>
                      <li><span style={{ fontSize: "0.7em" }}>●</span> If there are any changes, please inform us before the job</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-2">
                  <div>
                    <p className="text-sm">Customer Sign</p>
                    <div style={{ height: "50px" }} />
                    <p className="text-sm">Date:</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">for Durga Industries</p>
                    <div style={{ height: "50px" }} />
                    <p className="text-sm">Manager</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">

          {/* SIDEBAR — contents on tablet (children join grid directly) · flex column on desktop */}
          <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-4 lg:sticky lg:top-6 lg:self-start">

          {/* ACTIVE MODEL */}
          <div className="order-1">

            <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-slate-50 flex flex-col relative overflow-hidden z-10 w-full">
              <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider">ACTIVE MODEL</span>
                <select
                  value={activeModel}
                  onChange={(e) => handleModelSelect(e.target.value as BaseModels)}
                  className="bg-slate-50 border border-slate-200 text-[#333333] text-sm font-bold uppercase rounded-md px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {(["Moffusil", "Town", "College", "Staff", "Kerala Series"] as BaseModels[]).map((model) => (
                    <option key={model} value={model}>{model.endsWith("Series") ? model : `${model} Series`}</option>
                  ))}
                </select>
              </div>
              <div className="h-48 w-full relative flex items-center justify-center p-4 bg-slate-50/50">
                <div className="relative w-[90%] h-full flex items-center justify-center">
                  <Image
                    src={`/images/${activeModel === "Kerala Series" ? "Moffusil" : activeModel}.png`}
                    alt={`${activeModel} Bus Image`}
                    fill
                    className="object-contain drop-shadow-md mix-blend-multiply transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-between items-end bg-white">
                <div>
                  <h2 className="text-xl font-bold text-[#333333]">{activeModel}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Configuration Estimate</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-teal-600">
                    ₹{currentEstimate.toLocaleString('en-IN')}
                  </h2>
                </div>
              </div>
            </div>

          </div>

          {/* LIVE SPEC */}
          <div className="order-3">
            <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-slate-50 p-5 flex flex-col max-h-[450px]">
              <div
                className="text-sm font-semibold text-[#475569] uppercase tracking-wide mb-4 flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer hover:text-teal-600 transition-colors"
                onClick={() => setShowLiveModal(true)}
              >
                <span>Live Specifications</span>
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold">
                  {Object.keys(selections).length + (seatingTotal > 0 ? 1 : 0)} Items
                </span>
              </div>
              {Object.keys(selections).length === 0 && seatingTotal === 0 ? (
                <p className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  No specifications selected.
                </p>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-2">
                  {Object.entries(selections).map(([key, vals]) => (
                    <div key={key} className="flex justify-between items-start border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-[11px] text-[#64748B] uppercase tracking-tight w-1/3 leading-tight font-medium mt-0.5">{t(key, isTamil)}</span>
                      <span className="text-sm font-medium text-[#333333] text-right w-2/3 leading-snug">{vals.map(v => t(v, isTamil)).join(", ")}</span>
                    </div>
                  ))}
                  {seatingTotal > 0 && (
                    <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                      <span className="text-[11px] text-[#64748B] uppercase tracking-tight w-1/3 leading-tight font-medium mt-0.5">{t("Seating Capacity", isTamil)}</span>
                      <span className="text-sm font-medium text-[#333333] text-right w-2/3 leading-snug">{seatingTotal} Seats</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          </div> {/* end SIDEBAR */}

          {/* RIGHT PANEL */}
          <div className="order-2 flex flex-col gap-8 lg:col-span-8">

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="bg-teal-50 p-2 rounded-lg">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Customer Name
                  </label>
                  <input
                    type="text"
                    value={basicInfo.customerName}
                    onChange={(e) => setBasicInfo({...basicInfo, customerName: e.target.value})}
                    placeholder="Enter Customer Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Job No
                  </label>
                  <input
                    type="text"
                    value={basicInfo.jobNo}
                    onChange={(e) => setBasicInfo({...basicInfo, jobNo: e.target.value})}
                    placeholder="e.g. 345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Mobile Number
                  </label>
                  <input
                    type="text"
                    value={basicInfo.mobileNo}
                    onChange={(e) => setBasicInfo({...basicInfo, mobileNo: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-3 h-3" /> Chassis Number
                  </label>
                  <input
                    type="text"
                    value={basicInfo.chassisNo}
                    onChange={(e) => setBasicInfo({...basicInfo, chassisNo: e.target.value})}
                    placeholder="Enter Chassis No."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input
                    type="date"
                    value={basicInfo.date}
                    onChange={(e) => setBasicInfo({...basicInfo, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" /> Engine Number
                  </label>
                  <input
                    type="text"
                    value={basicInfo.engineNo}
                    onChange={(e) => setBasicInfo({...basicInfo, engineNo: e.target.value})}
                    placeholder="Enter Engine No."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <input
                    type="text"
                    value={basicInfo.address}
                    onChange={(e) => setBasicInfo({...basicInfo, address: e.target.value})}
                    placeholder="Enter Customer Address"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {SPEC_CONFIGURATOR.map((section) => {
                const isSeatingSlot = section.groupName === "FITTINGS";
                return (
                  <Fragment key={section.groupName}>
                    <div
                      id={`section-${section.groupName}`}
                      className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-slate-50 overflow-hidden"
                    >
                      <div
                        className={cn(
                          "p-6 flex justify-between items-center cursor-pointer transition-all",
                          activeSection === section.groupName ? "bg-slate-50/50" : "hover:bg-slate-50/80"
                        )}
                        onClick={() => handleSectionToggle(section.groupName)}
                      >
                        <h3 className={cn(
                          "text-base font-semibold",
                          activeSection === section.groupName ? "text-[#333333]" : "text-[#475569]",
                          isTamil && "font-bold text-[17px] tracking-wide"
                        )}>
                          {t(section.groupName, isTamil)}
                        </h3>
                        {activeSection === section.groupName
                          ? <ChevronUp className="w-5 h-5 text-slate-400" />
                          : <ChevronDown className="w-5 h-5 text-slate-400" />
                        }
                      </div>
                      {activeSection === section.groupName && (
                        <div className="p-6 pt-0 border-t border-slate-100 flex flex-col gap-8 bg-white mt-4">
                          {section.fields.map((field) => (
                            <div key={field.id}>
                              <p className={cn(
                                "text-sm font-semibold text-[#64748B] mb-3",
                                isTamil && "font-bold text-[15px]"
                              )}>
                                {t(field.name, isTamil)}
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {field.options.map(opt => {
                                  const isSelected = (selections[field.name] ?? []).includes(opt);
                                  const optionPrice = field.optionPricing?.[opt];
                                  return (
                                    <div
                                      key={opt}
                                      onClick={() => handleSelect(field.name, opt)}
                                      className={cn(
                                        "px-5 py-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-all border",
                                        isSelected
                                          ? "border-teal-500 bg-teal-50"
                                          : "border-slate-200 bg-white hover:border-teal-300"
                                      )}
                                    >
                                      <span className={cn(
                                        "text-sm font-medium",
                                        isSelected ? "text-teal-800" : "text-[#333333]",
                                        isTamil && "font-bold text-[15.5px]"
                                      )}>
                                        {t(opt, isTamil)}
                                      </span>
                                      {optionPrice && optionPrice !== 0 && (
                                        <span className={cn(
                                          "text-xs font-medium ml-3",
                                          isSelected
                                            ? optionPrice > 0 ? "text-teal-600" : "text-orange-500"
                                            : "text-slate-400"
                                        )}>
                                          {optionPrice > 0 ? "+" : "-"}₹{fmtPrice(optionPrice)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {field.noteEnabled && (
                                <textarea
                                  value={fieldNotes[field.id] ?? ""}
                                  onChange={e => setFieldNotes(prev => ({ ...prev, [field.id]: e.target.value }))}
                                  placeholder={`Note for ${field.name}...`}
                                  rows={2}
                                  className="mt-3 w-full px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-slate-700 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all resize-none"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isSeatingSlot && (
                      <div
                        id="section-SEATING CAPACITY"
                        className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-slate-50 overflow-hidden"
                      >
                        <div
                          className={cn("p-6 flex justify-between items-center cursor-pointer transition-all", activeSection === "SEATING CAPACITY" ? "bg-slate-50/50" : "hover:bg-slate-50/80")}
                          onClick={() => handleSectionToggle("SEATING CAPACITY")}
                        >
                          <h3 className="text-base font-semibold text-[#475569]">
                            {t("SEATING CAPACITY", isTamil)}
                            {seatingTotal > 0 && <span className="ml-3 text-teal-600 font-bold">{seatingTotal} Seats</span>}
                          </h3>
                          {activeSection === "SEATING CAPACITY" ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </div>
                        {activeSection === "SEATING CAPACITY" && (
                          <div className="p-6 pt-0 border-t border-slate-100 bg-white mt-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-[14px]">
                                <thead>
                                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="text-left pb-4 min-w-[100px]">Location</th>
                                    <th className="text-left pb-4 min-w-[80px]">Type</th>
                                    <th className="text-center pb-4 w-10">×</th>
                                    <th className="text-center pb-4 min-w-[100px]">Rows (Qty)</th>
                                    <th className="text-center pb-4 w-10">=</th>
                                    <th className="text-right pb-4 min-w-[60px]">Seats</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(activeProfile.seatingRows ?? DEFAULT_SEATING_ROWS).map((row) => {
                                    const qty = seating[row.id] || 0;
                                    const result = qty * row.multiplier;
                                    return (
                                      <tr key={row.id} className="border-b border-slate-50">
                                        <td className="py-4 text-slate-500 font-medium">{t(row.location, isTamil)}</td>
                                        <td className="py-4 text-slate-700 font-semibold">{t(row.type, isTamil)}</td>
                                        <td className="py-4 text-center text-slate-400">×</td>
                                        <td className="py-4 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            value={qty === 0 ? "" : qty}
                                            onChange={e => setSeating(prev => ({ ...prev, [row.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                            placeholder="0"
                                            className="w-24 min-h-[44px] text-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                                          />
                                        </td>
                                        <td className="py-4 text-center text-slate-400">=</td>
                                        <td className="py-4 text-right font-bold text-slate-800">{result > 0 ? result : "—"}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-slate-200">
                                    <td colSpan={5} className="pt-4 text-sm font-bold text-slate-700 uppercase tracking-wide">Total</td>
                                    <td className="pt-4 text-right text-xl font-extrabold text-teal-600">{seatingTotal > 0 ? seatingTotal : "—"}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function NewJobPageWrapper() {
  return (
    <Suspense>
      <NewJobPage />
    </Suspense>
  );
}

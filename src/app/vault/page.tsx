"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Printer, Edit, History, Copy, Trash2, X, Truck } from "lucide-react";
import { cn } from "@/utils/cn";
import { useJobs } from "@/context/JobsContext";
import { JobCard } from "@/data/mockKanbanData";
import { t } from "@/data/translation";

export default function VaultPage() {
  const { jobs, isLoaded, deleteJobPermanently, deliverJob } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "delivered">("all");
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);

  // Printing state
  const [printJob, setPrintJob] = useState<JobCard | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        const matchesSearch =
          job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.jobNo.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && job.status === "active") ||
          (statusFilter === "delivered" && job.status === "delivered");
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [jobs, searchQuery, statusFilter]);

  const handleDelete = (id: string) => {
    deleteJobPermanently(id);
    setDeletingId(null);
  };

  const handlePrint = (job: JobCard) => {
    setPrintJob(job);
    setTimeout(() => {
      window.print();
      setPrintJob(null);
    }, 100);
  };

  // Keep selectedJob in sync with latest job data (e.g. after deliverJob updates status)
  const currentSelectedJob = selectedJob
    ? jobs.find(j => j.id === selectedJob.id) ?? null
    : null;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hidden Print Container */}
      {printJob && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 text-black font-sans leading-relaxed">
           <div className="text-center w-full block mb-8">
             <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-1 text-slate-900">Durga Industries</h1>
             <p className="text-base font-bold uppercase tracking-widest text-slate-800">Specifications for Body Building</p>
             <p className="text-xs text-gray-700 mt-1 max-w-lg mx-auto">SF.NO. 1994/2 Madurai New Bye Pass Road Near Periyar Arch, Karur - 639008</p>
           </div>

           <div className="flex justify-between gap-12 text-sm border-b-2 border-black pb-8 mb-8">
             <div className="flex flex-col gap-5 w-1/2">
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Customer Name:</strong>
                 <div className="border-b border-black flex-grow font-bold px-2">{printJob.customerName}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Mobile No:</strong>
                 <div className="border-b border-black flex-grow font-bold px-2">{printJob.mobileNo}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Date:</strong>
                 <div className="border-b border-black flex-grow font-bold px-2">{printJob.startDate}</div>
               </div>
             </div>
             <div className="flex flex-col gap-5 w-1/2">
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Job No:</strong>
                 <div className="border-b border-black flex-grow font-bold px-2">{printJob.jobNo}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Chassis No:</strong>
                 <div className="border-b border-black flex-grow font-bold px-2">{printJob.chassisNo}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Engine No:</strong>
                 <div className="border-b border-black flex-grow font-bold px-2">{printJob.engineNo}</div>
               </div>
             </div>
           </div>

           <h3 className="text-xl font-bold uppercase mb-6 text-slate-900">
             Blueprint: {printJob.model} Series
           </h3>

           <div className="columns-2 gap-16 text-[15px]">
             {printJob.selections && Object.entries(printJob.selections).map(([key, val]) => (
               <div key={key} className="break-inside-avoid mb-4 border-b border-slate-200 pb-1.5 flex justify-between items-end">
                  <span className="text-slate-600 uppercase font-semibold text-xs tracking-wider">
                    {t(key, false)}
                  </span>
                  <span className="font-bold text-slate-900 text-right">
                    {t(val, false)}
                  </span>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Vault Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-teal-50 p-2 rounded-lg">
                  <History className="w-5 h-5 text-teal-600" />
                </div>
                <h1 className="text-xl font-bold text-[#333333] tracking-tight">The Vault</h1>
              </div>
              <p className="text-slate-500 font-medium max-w-md">
                Historical archives of all units. Permanent storage and template cloning.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group min-w-[280px]">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search Customer or Job No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all w-full font-bold text-slate-700"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(["all", "active", "delivered"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wide",
                      statusFilter === f
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {f === "all" ? "All" : f === "active" ? "Live" : "Delivered"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vault Results Grid */}
      <main className="print:hidden">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 px-4 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No records found</h3>
            <p className="text-slate-400 max-w-xs mx-auto">
              No matching units in the archive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={cn(
                  "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col relative",
                  job.status === "active" ? "ring-2 ring-emerald-500/20 hover:border-teal-100" :
                  job.status === "delivered" ? "ring-2 ring-slate-200 hover:border-slate-200" :
                  "hover:border-teal-100"
                )}
              >
                {/* Delete Trigger */}
                <button
                  onClick={() => setDeletingId(job.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 bg-white hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-10 border border-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Confirm Delete Overlay */}
                {deletingId === job.id && (
                  <div className="absolute inset-0 z-20 bg-rose-500/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-200">
                    <Trash2 className="w-10 h-10 mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold mb-2 tracking-tight">Permanent Deletion?</h3>
                    <p className="text-sm font-medium text-rose-100 mb-6 leading-relaxed">
                      This will remove the record forever from the Vault.
                    </p>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="flex-1 bg-white text-rose-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="flex-1 bg-rose-600 text-white border border-rose-400 py-3 rounded-xl font-bold text-xs uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Top — clickable to open Quick View */}
                <button
                  onClick={() => setSelectedJob(job)}
                  className="p-6 pb-4 flex justify-between items-start border-b border-slate-50 bg-white group-hover:bg-teal-50/10 transition-colors text-left w-full"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded uppercase tracking-[0.1em]">
                        {job.jobNo}
                      </span>
                      {job.status === "active" && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded uppercase tracking-[0.1em]">
                          Live Now
                        </span>
                      )}
                      {job.status === "delivered" && (
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-[0.1em]">
                          Delivered
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-teal-700 transition-colors truncate pr-8">
                       {job.customerName || "Untitled Customer"}
                    </h3>
                  </div>
                </button>

                {/* Card Middle */}
                <div className="p-6 pt-5 grid grid-cols-2 gap-4 flex-grow">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model</p>
                      <p className="text-sm font-bold text-slate-700">{job.model} Series</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</p>
                      <p className="text-sm font-bold text-slate-700">{job.startDate}</p>
                   </div>
                   <div className="space-y-1 col-span-2 mt-2">
                       <div className="flex justify-between text-[10px] font-bold mb-1.5">
                         <span className="text-slate-400 uppercase tracking-widest">Chassis No</span>
                         <span className="text-slate-800 font-mono">{job.chassisNo || "--"}</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-bold">
                         <span className="text-slate-400 uppercase tracking-widest">Engine No</span>
                         <span className="text-slate-800 font-mono">{job.engineNo || "--"}</span>
                       </div>
                   </div>
                </div>

                {/* Card Bottom: Split Actions */}
                <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/50">
                   <Link
                    href={`/new-job?editId=${job.id}`}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-white transition-all text-slate-500 hover:text-teal-600 border-r border-slate-100"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                  </Link>

                  <Link
                    href={`/new-job?cloneId=${job.id}`}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-white transition-all text-slate-500 hover:text-teal-600"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Clone & Edit</span>
                  </Link>
                </div>

                <button
                  onClick={() => handlePrint(job)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white transition-all flex items-center justify-center gap-2 group/btn shadow-inner"
                >
                  <Printer className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Print Specification</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Quick View Modal */}
      {currentSelectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded uppercase tracking-[0.1em]">
                    {currentSelectedJob.jobNo}
                  </span>
                  {currentSelectedJob.status === "active" && (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded uppercase tracking-[0.1em]">
                      Live Now
                    </span>
                  )}
                  {currentSelectedJob.status === "delivered" && (
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-[0.1em]">
                      Delivered
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                  {currentSelectedJob.customerName || "Untitled Customer"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details */}
            <div className="p-6 grid grid-cols-2 gap-5">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model</p>
                <p className="text-sm font-bold text-slate-700">{currentSelectedJob.model} Series</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</p>
                <p className="text-sm font-bold text-slate-700">{currentSelectedJob.startDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chassis No</p>
                <p className="text-sm font-bold text-slate-700 font-mono">{currentSelectedJob.chassisNo || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine No</p>
                <p className="text-sm font-bold text-slate-700 font-mono">{currentSelectedJob.engineNo || "—"}</p>
              </div>
              {currentSelectedJob.mobileNo && (
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile</p>
                  <p className="text-sm font-bold text-slate-700">{currentSelectedJob.mobileNo}</p>
                </div>
              )}
              {currentSelectedJob.deliveredDate && (
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivered On</p>
                  <p className="text-sm font-bold text-slate-700">{currentSelectedJob.deliveredDate}</p>
                </div>
              )}
            </div>

            {/* Modal Footer — Mark as Delivered (active jobs only) */}
            {currentSelectedJob.status === "active" && (
              <div className="px-6 pb-6">
                <button
                  onClick={() => {
                    deliverJob(currentSelectedJob.id);
                    setSelectedJob(null);
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-600/20"
                >
                  <Truck className="w-4 h-4" />
                  Mark as Delivered
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistence Bar */}
      <div className="fixed bottom-8 left-8 right-8 flex justify-center pointer-events-none print:hidden">
        <div className="bg-slate-900/90 backdrop-blur-xl text-white px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-2xl flex items-center gap-4 pointer-events-auto border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            RECORDS: {jobs.length}
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE: {jobs.filter(j => j.status === 'active').length}
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            DELIVERED: {jobs.filter(j => j.status === 'delivered').length}
          </div>
        </div>
      </div>
    </div>
  );
}

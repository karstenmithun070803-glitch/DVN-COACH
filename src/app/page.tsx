"use client";

import React, { useState } from "react";
import { KanbanBoard } from "@/components/live-floor/KanbanBoard";
import { Search, Plus, Filter, LayoutGrid, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { BaseModels } from "@/data/specs";
import { JobCard, ProductionStage } from "@/data/mockKanbanData";
import { useJobs } from "@/context/JobsContext";

export default function LiveFloorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { jobs, addJob } = useJobs();

  const [formData, setFormData] = useState({
    customerName: "",
    jobNo: "",
    chassisNo: "",
    engineNo: "",
    model: "Moffusil" as BaseModels,
  });

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: JobCard = {
      id: `job-${Date.now()}`,
      ...formData,
      stage: "Chassis Arrival" as ProductionStage,
      startDate: new Date().toISOString().split("T")[0],
    };

    addJob(newJob);
    setIsModalOpen(false);
    setFormData({ customerName: "", jobNo: "", chassisNo: "", engineNo: "", model: "Moffusil" });
  };

  const activeCount = jobs.length;

  return (
    <div className="bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Live Floor Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#333333] tracking-tight">Live Floor</h1>
            <p className="text-[11px] text-teal-600 font-bold uppercase tracking-wider">{activeCount} Active Production Units</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* High-visibility Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search Customer or Job No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all w-64 md:w-72 font-medium"
              />
            </div>

            <button className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm uppercase tracking-wide">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 uppercase tracking-wide"
            >
              <Plus className="w-4 h-4" />
              New Quick Job
            </button>
          </div>
        </div>
      </div>

      {/* Main Kanban Content */}
      <div className="w-full overflow-x-auto">
        <KanbanBoard searchQuery={searchQuery} />
      </div>

      {/* Quick Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">New Quick Job</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  placeholder="e.g. VRL Travels"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job No</label>
                  <input 
                    required
                    type="text" 
                    value={formData.jobNo}
                    onChange={e => setFormData({ ...formData, jobNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    placeholder="DVN-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Series</label>
                  <select 
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value as BaseModels })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-medium"
                  >
                    {["Moffusil", "Town", "College", "Staff"].map(m => (
                      <option key={m} value={m}>{m} Series</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chassis No</label>
                <input 
                  type="text" 
                  value={formData.chassisNo}
                  onChange={e => setFormData({ ...formData, chassisNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  placeholder="AL-XXXXXX"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine No</label>
                <input 
                  type="text" 
                  value={formData.engineNo}
                  onChange={e => setFormData({ ...formData, engineNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  placeholder="ENG-XXXX"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to Chassis Arrival
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats footer */}
      <div className="h-12 bg-white rounded-2xl border border-slate-100 px-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest print:hidden">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            Production Active
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            {jobs.filter(j => j.stage === 'Final Inspection & Delivery').length} Near Delivery
          </span>
        </div>
        <div className="flex items-center gap-4">
           Board View
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { X, Check, Edit2 } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { JobCard, MOCK_JOBS, STAGES, ProductionStage } from "@/data/mockKanbanData";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface KanbanBoardProps {
  searchQuery: string;
}

import { useJobs } from "@/context/JobsContext";

export function KanbanBoard({ searchQuery }: KanbanBoardProps) {
  const { jobs, moveJob, isLoaded, updateJob } = useJobs();
  const [activeJob, setActiveJob] = useState<JobCard | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  // Inline editing state for Modal
  const [editingModalField, setEditingModalField] = useState<string | null>(null);
  const [editModalValue, setEditModalValue] = useState("");
  
  const currentJob = jobs.find(j => j.id === selectedJobId);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isLoaded) return null;

  const filteredJobs = jobs.filter(job => 
    job.status === "active" && (
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobNo.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = jobs.find((j) => j.id === active.id);
    if (job) setActiveJob(job);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isOverAColumn = STAGES.includes(overId as ProductionStage);

    if (isOverAColumn) {
      moveJob(activeId as string, overId as ProductionStage);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJob(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full pb-10 overflow-x-auto min-h-[600px] mt-6 select-none scrollbar-hide">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            id={stage}
            title={stage}
            jobs={filteredJobs.filter((job) => job.stage === stage)}
            onCardClick={(job) => setSelectedJobId(job.id)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeJob ? (
          <div className="rotate-3 scale-105 pointer-events-none">
            <KanbanCard job={activeJob} isDragging />
          </div>
        ) : null}
      </DragOverlay>

      {/* Quick View Modal */}
      {currentJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
             <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Job Quick View</h3>
                <button 
                  onClick={() => {
                    setSelectedJobId(null);
                    setEditingModalField(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="p-10 space-y-8">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Customer Name</p>
                   {editingModalField === "customerName" ? (
                     <div className="flex items-center gap-2">
                       <input 
                         ref={inputRef}
                         autoFocus
                         value={editModalValue}
                         onChange={(e) => setEditModalValue(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === "Enter") {
                             updateJob(currentJob.id, { customerName: editModalValue });
                             setEditingModalField(null);
                           }
                           if (e.key === "Escape") setEditingModalField(null);
                         }}
                         className="text-2xl font-extrabold text-slate-800 bg-slate-50 border-b-2 border-teal-500 outline-none w-full"
                       />
                       <button 
                          onClick={() => {
                            updateJob(currentJob.id, { customerName: editModalValue });
                            setEditingModalField(null);
                          }}
                          className="bg-teal-500 text-white p-1.5 rounded-lg shadow-sm"
                       >
                         <Check className="w-4 h-4" />
                       </button>
                     </div>
                   ) : (
                     <h2 
                       onClick={() => {
                         setEditingModalField("customerName");
                         setEditModalValue(currentJob.customerName);
                       }}
                       className="text-3xl font-extrabold text-slate-800 leading-tight cursor-text hover:text-teal-600 transition-colors flex items-center gap-2 group"
                     >
                      {currentJob.customerName || <span className="text-slate-300 italic font-normal">Untitled Customer</span>}
                      <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-20" />
                     </h2>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stage</p>
                      <p className="text-xl font-bold text-teal-700 uppercase">{currentJob.stage}</p>
                   </div>
                   
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job No</p>
                      {editingModalField === "jobNo" ? (
                        <input 
                          autoFocus
                          value={editModalValue}
                          onChange={(e) => setEditModalValue(e.target.value)}
                          onBlur={() => {
                            updateJob(currentJob.id, { jobNo: editModalValue });
                            setEditingModalField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateJob(currentJob.id, { jobNo: editModalValue });
                              setEditingModalField(null);
                            }
                            if (e.key === "Escape") setEditingModalField(null);
                          }}
                          className="text-xl font-bold text-slate-800 border-b border-teal-500 outline-none w-full bg-slate-50"
                        />
                      ) : (
                        <p 
                          onClick={() => {
                            setEditingModalField("jobNo");
                            setEditModalValue(currentJob.jobNo);
                          }}
                          className="text-xl font-bold text-slate-800 cursor-text hover:text-teal-600 transition-colors"
                        >
                          {currentJob.jobNo}
                        </p>
                      )}
                   </div>

                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bus Model</p>
                      {editingModalField === "model" ? (
                        <select 
                          autoFocus
                          value={editModalValue}
                          onChange={(e) => {
                            const newModel = e.target.value as any;
                            updateJob(currentJob.id, { model: newModel });
                            setEditingModalField(null);
                          }}
                          onBlur={() => setEditingModalField(null)}
                          className="text-xl font-bold text-slate-800 border-b border-teal-500 outline-none w-full bg-slate-50 cursor-pointer"
                        >
                          {["Moffusil", "Town", "College", "Staff"].map(m => (
                            <option key={m} value={m}>{m} Series</option>
                          ))}
                        </select>
                      ) : (
                        <p 
                          onClick={() => {
                            setEditingModalField("model");
                            setEditModalValue(currentJob.model);
                          }}
                          className="text-xl font-bold text-slate-800 cursor-pointer hover:text-teal-600 transition-colors"
                        >
                          {currentJob.model} Series
                        </p>
                      )}
                   </div>

                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chassis No</p>
                      {editingModalField === "chassisNo" ? (
                        <input 
                          autoFocus
                          value={editModalValue}
                          onChange={(e) => setEditModalValue(e.target.value)}
                          onBlur={() => {
                            updateJob(currentJob.id, { chassisNo: editModalValue });
                            setEditingModalField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateJob(currentJob.id, { chassisNo: editModalValue });
                              setEditingModalField(null);
                            }
                            if (e.key === "Escape") setEditingModalField(null);
                          }}
                          className="text-xl font-bold text-slate-700 font-mono tracking-tight border-b border-teal-500 outline-none w-full bg-slate-50"
                        />
                      ) : (
                        <p 
                          onClick={() => {
                            setEditingModalField("chassisNo");
                            setEditModalValue(currentJob.chassisNo);
                          }}
                          className="text-xl font-bold text-slate-700 font-mono tracking-tight cursor-text hover:text-teal-600 transition-colors min-h-[1.75rem]"
                        >
                          {currentJob.chassisNo || <span className="text-slate-200">——————</span>}
                        </p>
                      )}
                   </div>

                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine No</p>
                      {editingModalField === "engineNo" ? (
                        <input 
                          autoFocus
                          value={editModalValue}
                          onChange={(e) => setEditModalValue(e.target.value)}
                          onBlur={() => {
                            updateJob(currentJob.id, { engineNo: editModalValue });
                            setEditingModalField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateJob(currentJob.id, { engineNo: editModalValue });
                              setEditingModalField(null);
                            }
                            if (e.key === "Escape") setEditingModalField(null);
                          }}
                          className="text-xl font-bold text-slate-700 font-mono tracking-tight border-b border-teal-500 outline-none w-full bg-slate-50"
                        />
                      ) : (
                        <p 
                          onClick={() => {
                            setEditingModalField("engineNo");
                            setEditModalValue(currentJob.engineNo);
                          }}
                          className="text-xl font-bold text-slate-700 font-mono tracking-tight cursor-text hover:text-teal-600 transition-colors min-h-[1.75rem]"
                        >
                          {currentJob.engineNo || <span className="text-slate-200">——————</span>}
                        </p>
                      )}
                   </div>
                </div>
             </div>

             <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                   LIVE SYNC ACTIVE
                </div>
                <button 
                  onClick={() => setSelectedJobId(null)}
                  className="bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all uppercase tracking-wide"
                >
                  Done
                </button>
             </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}

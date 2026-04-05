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
import { X } from "lucide-react";
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

const LOCAL_STORAGE_KEY = "dvn-live-floor-jobs";

export function KanbanBoard({ searchQuery }: KanbanBoardProps) {
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [activeJob, setActiveJob] = useState<JobCard | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setJobs(JSON.parse(saved));
      } catch (e) {
        setJobs(MOCK_JOBS);
      }
    } else {
      setJobs(MOCK_JOBS);
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobs));
    }
  }, [jobs, isLoaded]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isLoaded) return null;

  const filteredJobs = jobs.filter(job => 
    job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobNo.toLowerCase().includes(searchQuery.toLowerCase())
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

    const isActiveAColumn = STAGES.includes(activeId as ProductionStage);
    const isOverAColumn = STAGES.includes(overId as ProductionStage);

    if (isActiveAColumn) return;

    // Dropping over a column
    if (isOverAColumn) {
      setJobs((prev) => {
        const activeIndex = prev.findIndex((j) => j.id === activeId);
        const updatedJobs = [...prev];
        updatedJobs[activeIndex] = {
          ...updatedJobs[activeIndex],
          stage: overId as ProductionStage,
        };
        return updatedJobs;
      });
      return;
    }

    // Dropping over another card
    const activeJobIndex = jobs.findIndex(j => j.id === activeId);
    const overJobIndex = jobs.findIndex(j => j.id === overId);

    if (jobs[activeJobIndex].stage !== jobs[overJobIndex].stage) {
      setJobs((prev) => {
        const updatedJobs = [...prev];
        updatedJobs[activeJobIndex] = {
          ...updatedJobs[activeJobIndex],
          stage: prev[overJobIndex].stage,
        };
        return arrayMove(updatedJobs, activeJobIndex, overJobIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveJob(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
      const activeIndex = jobs.findIndex((j) => j.id === activeId);
      const overIndex = jobs.findIndex((j) => j.id === overId);

      // Only reorder if in same stage
      if (jobs[activeIndex].stage === (overIndex !== -1 ? jobs[overIndex].stage : overId)) {
        setJobs((prev) => arrayMove(prev, activeIndex, overIndex));
      }
    }

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
            onCardClick={setSelectedJob}
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
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
             <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Job Quick View</h3>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="p-10 space-y-8">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Customer Name</p>
                   <h2 className="text-3xl font-extrabold text-slate-800 leading-tight">
                    {selectedJob.customerName}
                   </h2>
                </div>

                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stage</p>
                      <p className="text-xl font-bold text-teal-700 uppercase">{selectedJob.stage}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job No</p>
                      <p className="text-xl font-bold text-slate-800">{selectedJob.jobNo}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bus Model</p>
                      <p className="text-xl font-bold text-slate-800">{selectedJob.model} Series</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chassis No</p>
                      <p className="text-xl font-bold text-slate-700 font-mono tracking-tight">{selectedJob.chassisNo}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine No</p>
                      <p className="text-xl font-bold text-slate-700 font-mono tracking-tight">{selectedJob.engineNo}</p>
                   </div>
                </div>
             </div>

             <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                {/* Redundant footer button removed */}
             </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}

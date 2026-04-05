"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { cn } from "@/utils/cn";
import { JobCard, ProductionStage } from "@/data/mockKanbanData";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  id: ProductionStage;
  title: string;
  jobs: JobCard[];
  onCardClick?: (job: JobCard) => void;
}

export function KanbanColumn({ id, title, jobs, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-w-[280px] w-full max-w-[320px] bg-slate-50/50 rounded-2xl border border-slate-100/50">
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
          {title}
          <span className="bg-white border border-slate-200 text-slate-500 py-0.5 px-2 rounded-full text-[10px] font-bold shadow-xs">
            {jobs.length}
          </span>
        </h3>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-1.5 pb-4 custom-scrollbar"
      >
        <div className="flex flex-col gap-1 p-1">
          <SortableContext 
            items={jobs.map(j => j.id)} 
            strategy={verticalListSortingStrategy}
          >
            {jobs.map((job) => (
              <KanbanCard key={job.id} job={job} onClick={onCardClick} />
            ))}
          </SortableContext>
          
          {jobs.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center m-2">
              <p className="text-[11px] text-slate-400 font-medium italic">Empty Stage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

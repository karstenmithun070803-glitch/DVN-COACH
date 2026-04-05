"use client";

import React from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/cn";
import { JobCard } from "@/data/mockKanbanData";

interface KanbanCardProps {
  job: JobCard;
  isDragging?: boolean;
  onClick?: (job: JobCard) => void;
}

export function KanbanCard({ job, isDragging, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(job)}
      className={cn(
        "bg-white rounded-xl p-4 mb-3 border border-slate-100 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:border-teal-200 group relative select-none",
        isDragging ? "opacity-30 border-teal-500 shadow-lg" : "opacity-100"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-teal-700 transition-colors">
            {job.customerName}
          </h4>
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">
            {job.jobNo}
          </span>
        </div>
        <div className="relative w-12 h-10 shrink-0 ml-2 rounded-md overflow-hidden bg-slate-50 flex items-center justify-center p-1 border border-slate-50">
          <Image 
             src={`/images/${job.model}.png`} 
             alt={job.model} 
             fill 
             className="object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" 
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400 font-semibold uppercase tracking-tight">Model</span>
          <span className="text-slate-700 font-bold">{job.model} Series</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400 font-semibold uppercase tracking-tight">Chassis/Eng</span>
          <span className="text-slate-700 font-bold truncate ml-2">
            {job.chassisNo} / {job.engineNo}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px]">
         <span className="text-slate-400 font-medium">Started: {job.startDate}</span>
         <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
      </div>
    </div>
  );
}

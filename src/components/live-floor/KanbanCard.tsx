"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/utils/cn";
import { JobCard } from "@/data/mockKanbanData";
import { useJobs } from "@/context/JobsContext";
import { Trash2, Check, X, Edit2 } from "lucide-react";

interface KanbanCardProps {
  job: JobCard;
  isDragging?: boolean;
  onClick?: (job: JobCard) => void;
}

export function KanbanCard({ job, isDragging, onClick }: KanbanCardProps) {
  const { updateJob, archiveJob } = useJobs();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: job.id,
    disabled: !!editingField // Disable drag when editing
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  const startEditing = (e: React.MouseEvent, field: keyof JobCard, value: string) => {
    e.stopPropagation();
    setEditingField(field);
    setEditValue(value || "");
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editingField) {
      updateJob(job.id, { [editingField]: editValue });
      setEditingField(null);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingField(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingDelete) {
      archiveJob(job.id);
    } else {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000); // Reset after 3s
    }
  };

  const renderInlineInput = (field: keyof JobCard, className: string) => (
    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditingField(null);
        }}
        className={cn(
          "bg-slate-50 border border-teal-200 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-teal-500/20 w-full font-bold",
          className
        )}
      />
      <button onClick={handleSave} className="p-1 hover:bg-teal-50 text-teal-600 rounded">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={handleCancel} className="p-1 hover:bg-rose-50 text-rose-500 rounded">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !editingField && onClick?.(job)}
      className={cn(
        "bg-white rounded-xl p-4 mb-3 border border-slate-100 shadow-sm transition-all group relative select-none",
        isDragging ? "opacity-30 border-teal-500 shadow-lg" : "opacity-100 hover:border-teal-200",
        editingField ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        isConfirmingDelete && "border-rose-300 bg-rose-50/30"
      )}
    >
      {/* Quick Delete */}
      <button
        onClick={handleDelete}
        className={cn(
          "absolute top-2 right-2 p-1.5 rounded-lg transition-all z-20",
          isConfirmingDelete 
            ? "bg-rose-500 text-white animate-pulse shadow-lg scale-110" 
            : "text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100"
        )}
      >
        {isConfirmingDelete ? <Check className="w-3 h-3 font-bold" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>

      <div className="flex justify-between items-start mb-2 pr-6">
        <div className="flex-1 min-w-0">
          {editingField === "customerName" ? (
            renderInlineInput("customerName", "text-sm")
          ) : (
            <h4 
              onClick={(e) => startEditing(e, "customerName", job.customerName)}
              className="text-sm font-bold text-slate-800 truncate leading-tight hover:text-teal-700 cursor-text flex items-center gap-1.5"
            >
              {job.customerName || <span className="text-slate-300 italic font-normal text-xs">Untitled Customer</span>}
              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-30" />
            </h4>
          )}

          <div className="mt-1">
            {editingField === "jobNo" ? (
              renderInlineInput("jobNo", "text-[10px]")
            ) : (
              <span 
                onClick={(e) => startEditing(e, "jobNo", job.jobNo)}
                className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1 cursor-text hover:bg-teal-100 transition-colors"
              >
                {job.jobNo || "NO JOB NO"}
                <Edit2 className="w-2.5 h-2.5 opacity-40" />
              </span>
            )}
          </div>
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

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400 font-semibold uppercase tracking-tight">Model</span>
          <span className="text-slate-700 font-bold">{job.model} Series</span>
        </div>
        
        <div className="flex justify-between text-[11px] items-center">
          <span className="text-slate-400 font-semibold uppercase tracking-tight">Chassis/Eng</span>
          <div className="flex items-center gap-1 ml-2 truncate">
            {editingField === "chassisNo" ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSave()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditingField(null);
                }}
                className="w-20 bg-slate-50 border border-teal-200 rounded px-1 py-0.5 text-right font-bold outline-none"
              />
            ) : (
              <span 
                onClick={(e) => startEditing(e, "chassisNo", job.chassisNo)}
                className="text-slate-700 font-bold cursor-text hover:text-teal-600 transition-colors"
              >
                {job.chassisNo || "——"}
              </span>
            )}
            <span className="text-slate-300">/</span>
            {editingField === "engineNo" ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSave()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditingField(null);
                }}
                className="w-20 bg-slate-50 border border-teal-200 rounded px-1 py-0.5 text-right font-bold outline-none"
              />
            ) : (
              <span 
                onClick={(e) => startEditing(e, "engineNo", job.engineNo)}
                className="text-slate-700 font-bold cursor-text hover:text-teal-600 transition-colors"
              >
                {job.engineNo || "——"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px]">
         <span className="text-slate-400 font-medium">Started: {job.startDate}</span>
         {isConfirmingDelete && (
           <span className="text-rose-500 font-bold animate-pulse uppercase tracking-widest">Delete?</span>
         )}
         <div className={cn(
           "w-1.5 h-1.5 rounded-full",
           isConfirmingDelete ? "bg-rose-500" : "bg-teal-500 animate-pulse"
         )}></div>
      </div>
    </div>
  );
}

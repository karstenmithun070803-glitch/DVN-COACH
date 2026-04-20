"use client";

import { useState } from "react";
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { BaseModels, DEFAULT_SEATING_ROWS } from "@/data/specs";
import { useAdminSettings } from "@/context/AdminSettingsContext";

interface Props {
  model: BaseModels;
}

export function SeatingRowsManager({ model }: Props) {
  const { profiles, addSeatingRow, updateSeatingRow, removeSeatingRow } = useAdminSettings();
  const rows = profiles[model]?.seatingRows ?? DEFAULT_SEATING_ROWS;

  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({ location: "", type: "", multiplier: 1 });

  const handleAdd = () => {
    if (!newRow.location.trim() || !newRow.type.trim()) return;
    addSeatingRow(model, { location: newRow.location.trim(), type: newRow.type.trim(), multiplier: newRow.multiplier });
    setNewRow({ location: "", type: "", multiplier: 1 });
    setIsAdding(false);
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden scroll-mt-24",
      )}
    >
      {/* Header — mirrors SortableGroupCard exactly */}
      <div className={cn("flex items-center transition-all", isOpen && "bg-slate-50/80 border-b border-slate-100")}>

        {/* Drag grip (visual only) */}
        <span className="pl-5 pr-3 py-6 text-slate-300 flex-shrink-0">
          <GripVertical className="w-5 h-5" />
        </span>

        {/* Accordion toggle — <button> mirrors SortableGroupCard */}
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          className="flex-1 flex items-center justify-between py-6 pr-8 hover:bg-slate-50/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Seating Capacity
            </span>
            <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {rows.length} Rows
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {/* + button, only when open */}
        {isOpen && (
          <button
            type="button"
            onClick={() => setIsAdding(v => !v)}
            className="pr-5 pl-2 py-6 text-teal-600 hover:text-teal-700 transition-colors flex-shrink-0"
            title={isAdding ? "Cancel" : "Add Row"}
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-8 bg-white space-y-6">

          {/* Add row inline form */}
          {isAdding && (
            <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-xl flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                <input
                  type="text"
                  value={newRow.location}
                  onChange={e => setNewRow(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Rh Side"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                <input
                  type="text"
                  value={newRow.type}
                  onChange={e => setNewRow(p => ({ ...p, type: e.target.value }))}
                  placeholder="e.g. 3 Pass"
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div className="w-28 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multiplier</label>
                <input
                  type="number"
                  min={1}
                  value={newRow.multiplier}
                  onChange={e => setNewRow(p => ({ ...p, multiplier: parseInt(e.target.value) || 1 }))}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
              >
                Add
              </button>
            </div>
          )}

          {/* Rows table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Multiplier</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(row => (
                  <tr key={row.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        defaultValue={row.location}
                        onBlur={e => {
                          const val = e.target.value.trim();
                          if (val && val !== row.location) updateSeatingRow(model, row.id, { location: val });
                        }}
                        className="w-full bg-transparent border-b border-transparent focus:border-teal-400 focus:outline-none text-sm font-bold text-slate-600 uppercase tracking-tight px-1 py-0.5 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        defaultValue={row.type}
                        onBlur={e => {
                          const val = e.target.value.trim();
                          if (val && val !== row.type) updateSeatingRow(model, row.id, { type: val });
                        }}
                        className="w-full bg-transparent border-b border-transparent focus:border-teal-400 focus:outline-none text-sm font-bold text-slate-600 uppercase tracking-tight px-1 py-0.5 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        min={1}
                        defaultValue={row.multiplier}
                        onBlur={e => {
                          const val = parseInt(e.target.value) || 1;
                          if (val !== row.multiplier) updateSeatingRow(model, row.id, { multiplier: val });
                        }}
                        className="w-16 text-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all mx-auto"
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => removeSeatingRow(model, row.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-md transition-all transform active:scale-90"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                      No rows configured. Click + to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

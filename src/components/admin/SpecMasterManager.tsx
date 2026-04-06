"use client";

import React, { useState, useEffect } from "react";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { BaseModels, SpecCategoryGroup } from "@/data/specs";
import { ChevronDown, ChevronUp, Plus, Trash2, Star } from "lucide-react";
import { cn } from "@/utils/cn";
import { t } from "@/data/translation";

interface SpecMasterManagerProps {
  model: BaseModels;
  specGroups: SpecCategoryGroup[];
  standardSelections: Record<string, string>;
}

export function SpecMasterManager({ model, specGroups, standardSelections }: SpecMasterManagerProps) {
  const { addOption, removeOption, setStandardSelection } = useAdminSettings();
  const [activeAccordion, setActiveAccordion] = useState<string>("CHASSIS");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [addingToField, setAddingToField] = useState<string | null>(null);

  // Smart Navigation: Auto-scroll to header when section expands
  useEffect(() => {
    if (activeAccordion) {
      setTimeout(() => {
        const el = document.getElementById(`admin-section-${activeAccordion}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [activeAccordion]);

  const handleAddOption = (groupName: string, fieldId: string) => {
    if (newOptionValue.trim()) {
      addOption(model, groupName, fieldId, newOptionValue.trim());
      setNewOptionValue("");
      setAddingToField(null);
    }
  };

  const handleToggleSelection = (categoryName: string, option: string) => {
    const isCurrentlyActive = standardSelections[categoryName] === option;
    setStandardSelection(model, categoryName, isCurrentlyActive ? "" : option);
  };

  return (
    <div className="space-y-4">
      {specGroups.map((group) => (
        <div 
          key={group.groupName} 
          id={`admin-section-${group.groupName}`}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden scroll-mt-24"
        >
          {/* Group Header */}
          <button
            onClick={() => setActiveAccordion(activeAccordion === group.groupName ? "" : group.groupName)}
            className={cn(
              "w-full px-8 py-6 flex items-center justify-between transition-all hover:bg-slate-50/50",
              activeAccordion === group.groupName && "bg-slate-50/80 border-b border-slate-100"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{t(group.groupName, false)}</span>
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {group.fields.length} Categories
              </span>
            </div>
            {activeAccordion === group.groupName ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Group Fields */}
          {activeAccordion === group.groupName && (
            <div className="p-8 space-y-10 bg-white">
              {group.fields.map((field) => (
                <div key={field.id} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{t(field.name, false)}</h4>
                    <button 
                      onClick={() => setAddingToField(addingToField === field.id ? null : field.id)}
                      className="text-teal-600 hover:text-teal-700 p-1 rounded-md hover:bg-teal-50 transition-all"
                      title="Add New Option"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add Option Input */}
                  {addingToField === field.id && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        autoFocus
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddOption(group.groupName, field.id)}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        placeholder="Type new option name..."
                      />
                      <button 
                        onClick={() => handleAddOption(group.groupName, field.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {field.options.map((opt) => {
                      const isDefault = standardSelections[field.name] === opt;
                      
                      return (
                        <div 
                          key={opt}
                          className={cn(
                            "group px-4 py-3 rounded-xl border flex items-center gap-3 transition-all",
                            isDefault 
                              ? "bg-teal-600 border-teal-600 shadow-lg shadow-teal-600/20" 
                              : "bg-white border-slate-200 hover:border-teal-300"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-bold tracking-tight",
                            isDefault ? "text-white" : "text-slate-700"
                          )}>
                            {t(opt, false)}
                          </span>

                          <div className="flex items-center border-l border-slate-100 pl-3 ml-1 group-hover:border-teal-400 transition-colors">
                            <button 
                              onClick={() => handleToggleSelection(field.name, opt)}
                              className={cn(
                                "p-1.5 rounded-md transition-all",
                                isDefault 
                                  ? "bg-teal-500/50 text-white" 
                                  : "text-slate-300 hover:text-teal-600 hover:bg-teal-50"
                              )}
                              title={isDefault ? "Selected" : "Set as Standard"}
                            >
                              <Star className={cn("w-3.5 h-3.5", isDefault && "fill-current")} />
                            </button>
                            
                            <button 
                              onClick={() => removeOption(model, group.groupName, field.id, opt)}
                              className={cn(
                                "p-1.5 rounded-md transition-all",
                                isDefault
                                  ? "text-white/60 hover:text-white hover:bg-white/10"
                                  : "text-slate-300 hover:text-red-500 hover:bg-red-50"
                              )}
                              title="Delete Option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

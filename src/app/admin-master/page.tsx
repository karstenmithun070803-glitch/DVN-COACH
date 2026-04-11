"use client";

import React, { useState } from "react";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { BaseModels } from "@/data/specs";
import { ModelPriceEditor } from "@/components/admin/ModelPriceEditor";
import { SpecMasterManager } from "@/components/admin/SpecMasterManager";
import { ExtrasPriceTable } from "@/components/admin/ExtrasPriceTable";
import { SeatingRowsManager } from "@/components/admin/SeatingRowsManager";
import { Settings2, Bus, ChevronRight } from "lucide-react";

const MODELS: BaseModels[] = ["Moffusil", "Town", "College", "Staff"];

export default function AdminMasterPage() {
  const { profiles, isLoaded } = useAdminSettings();
  const [selectedModel, setSelectedModel] = useState<BaseModels>("Moffusil");

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const activeProfile = profiles[selectedModel];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
      {/* Header & Model Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-teal-600 font-bold uppercase tracking-widest text-xs">
              <Settings2 className="w-4 h-4" />
              Admin Control Center
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800">Admin Master</h1>
            <p className="text-slate-500 text-sm">Configure model prices, standard specs, and itemized extras.</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <Bus className="w-5 h-5 text-slate-400 ml-2" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as BaseModels)}
              className="bg-transparent border-none text-slate-800 font-bold focus:ring-0 cursor-pointer pr-8"
            >
              {MODELS.map(m => (
                <option key={m} value={m}>{m} Series</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pricing & Extras */}
        <div className="lg:col-span-4 space-y-8">
          <ModelPriceEditor 
            model={selectedModel} 
            basePrice={activeProfile.basePrice} 
          />
          
          <ExtrasPriceTable 
            model={selectedModel} 
            extras={activeProfile.extrasPricing} 
          />
        </div>

        {/* Right Column: Spec Manager + Seating Rows */}
        <div className="lg:col-span-8 space-y-8">
          <SpecMasterManager
            model={selectedModel}
            specGroups={activeProfile.specGroups}
            standardSelections={activeProfile.standardSelections}
          />
          <SeatingRowsManager model={selectedModel} />
        </div>
      </div>
    </div>
  );
}

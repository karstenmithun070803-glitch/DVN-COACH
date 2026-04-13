"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { BaseModels } from "@/data/specs";
import { Save } from "lucide-react";

interface StructurePriceManagerProps {
  model: BaseModels;
}

export function StructurePriceManager({ model }: StructurePriceManagerProps) {
  const { profiles, updateStructurePrice } = useAdminSettings();
  const profile = profiles[model];
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const isFirstMount = useRef(true);
  const draftKey = `dvn-admin-structure-draft-${model}`;

  useEffect(() => {
    const prices: Record<string, string> = {};
    Object.entries(profile.structurePricing ?? {}).forEach(([key, val]) => { prices[key] = val.toString(); });

    if (isFirstMount.current) {
      isFirstMount.current = false;
      try {
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          const parsed = JSON.parse(draft) as Record<string, string>;
          Object.keys(prices).forEach(key => { if (parsed[key] !== undefined) prices[key] = parsed[key]; });
        }
      } catch { /* ignore */ }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditingPrices(prices);
  }, [profile.structurePricing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Object.keys(editingPrices).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(editingPrices));
    }
  }, [editingPrices, draftKey]);

  const structureGroup = profile.specGroups.find(g => g.groupName === "STRUCTURE");
  const entries = Object.keys(profile.structurePricing ?? {}).map(key => {
    const [fieldId, optionValue] = key.split(":") as [string, string];
    const field = structureGroup?.fields.find(f => f.id === fieldId);
    return { key, fieldName: field?.name ?? fieldId, optionValue };
  });

  if (entries.length === 0) return null;

  const handleSave = (key: string) => {
    const [fieldId, optionValue] = key.split(":") as [string, string];
    const price = parseFloat(editingPrices[key]);
    if (!isNaN(price)) updateStructurePrice(model, fieldId, optionValue, price);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-white">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Structural Pricing</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spec / Option</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price Adjustment (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map(({ key, fieldName, optionValue }) => (
              <tr key={key} className="group hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{fieldName}</span>
                  <span className="ml-2 text-xs text-slate-400">— {optionValue}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      step="1"
                      value={editingPrices[key] ?? "0"}
                      onChange={e => setEditingPrices(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                    <button
                      onClick={() => handleSave(key)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-md transition-all transform active:scale-90"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50/80 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 italic text-center">Price adjustments here update the Configurator estimate immediately.</p>
      </div>
    </div>
  );
}

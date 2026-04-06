"use client";

import React, { useState, useEffect } from "react";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { BaseModels } from "@/data/specs";
import { IndianRupee, Save, Plus } from "lucide-react";
import { t } from "@/data/translation";

interface ExtrasPriceTableProps {
  model: BaseModels;
  extras: Record<string, number>;
}

export function ExtrasPriceTable({ model, extras }: ExtrasPriceTableProps) {
  const { updateExtraPrice } = useAdminSettings();
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    const prices: Record<string, string> = {};
    Object.entries(extras).forEach(([key, val]) => {
      prices[key] = val.toString();
    });
    setEditingPrices(prices);
  }, [extras]);

  const handlePriceChange = (key: string, value: string) => {
    setEditingPrices(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const price = parseFloat(editingPrices[key]);
    if (!isNaN(price)) {
      updateExtraPrice(model, key, price);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Extras & Paint</h3>
        <button className="text-teal-600 hover:text-teal-700 transition-colors p-1" title="Add New Item">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Object.entries(editingPrices).map(([key, val]) => (
              <tr key={key} className="group hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{t(key, false)}</span>
                  <p className="text-[10px] text-slate-400 font-medium">Model Specific Override</p>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <div className="relative">
                        <input 
                          type="number"
                          step="0.01"
                          value={val}
                          onChange={(e) => handlePriceChange(key, e.target.value)}
                          className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                     </div>
                     <button 
                        onClick={() => handleSave(key)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-md transition-all transform active:scale-90"
                        title="Save Changes"
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
        <p className="text-[10px] text-slate-400 italic text-center">Changes made here instantly update the Configurator price estimate.</p>
      </div>
    </div>
  );
}

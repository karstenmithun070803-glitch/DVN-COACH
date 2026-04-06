"use client";

import React, { useState, useEffect } from "react";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { BaseModels } from "@/data/specs";
import { IndianRupee, Save } from "lucide-react";

interface ModelPriceEditorProps {
  model: BaseModels;
  basePrice: number;
}

export function ModelPriceEditor({ model, basePrice }: ModelPriceEditorProps) {
  const { updateBasePrice } = useAdminSettings();
  const [localPrice, setLocalPrice] = useState(basePrice.toString());

  useEffect(() => {
    setLocalPrice(basePrice.toString());
  }, [basePrice]);

  const handleSave = () => {
    const price = parseFloat(localPrice);
    if (!isNaN(price)) {
      updateBasePrice(model, price);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Base Pricing</h3>
        <span className="bg-teal-50 text-teal-600 text-[10px] px-2 py-1 rounded-full font-black uppercase">Live</span>
      </div>
      
      <div className="p-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starting Price</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <IndianRupee className="h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
            </div>
            <input
              type="number"
              step="0.01"
              value={localPrice}
              onChange={(e) => setLocalPrice(e.target.value)}
              className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <button 
                onClick={handleSave}
                className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all transform active:scale-95"
                title="Save Price"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

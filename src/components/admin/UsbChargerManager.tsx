"use client";

import { GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";
import { BaseModels } from "@/data/specs";
import { useAdminSettings } from "@/context/AdminSettingsContext";

interface Props {
  model: BaseModels;
  isOpen: boolean;
  onToggle: () => void;
  readOnly?: boolean;
}

export function UsbChargerManager({ model, isOpen, onToggle, readOnly }: Props) {
  const { profiles, updateUsbChargerPrice } = useAdminSettings();
  const price = profiles[model]?.usbCharger?.pricePerUnit ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden scroll-mt-24">
      <div className={cn("flex items-center transition-all", isOpen && "bg-slate-50/80 border-b border-slate-100")}>
        <span className="pl-5 pr-3 py-6 text-slate-300 flex-shrink-0">
          <GripVertical className="w-5 h-5" />
        </span>
        <button
          type="button"
          onPointerDown={e => { e.stopPropagation(); onToggle(); }}
          className="flex-1 flex items-center justify-between py-6 pr-8 hover:bg-slate-50/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
              USB Charger + Wiring
            </span>
            <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              ₹{price} / unit
            </span>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-8 bg-white space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price per unit (₹)</label>
          <div className="flex items-center gap-4">
            <input
              key={`${model}-${price}`}
              type="number"
              min={0}
              defaultValue={price || ""}
              disabled={readOnly}
              placeholder="0"
              onBlur={e => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                if (val !== price) updateUsbChargerPrice(model, val);
              }}
              className="w-40 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all disabled:opacity-60"
            />
            <span className="text-sm text-slate-500">
              Example: 10 units = ₹{(price * 10).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-slate-400">The quantity is entered per job in New Job.</p>
        </div>
      )}
    </div>
  );
}

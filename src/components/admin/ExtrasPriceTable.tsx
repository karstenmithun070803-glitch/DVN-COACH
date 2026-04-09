"use client";

import { useState, useEffect } from "react";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { BaseModels } from "@/data/specs";
import { Save, Plus, Trash2, X } from "lucide-react";

interface ExtrasPriceTableProps {
  model: BaseModels;
  extras: Record<string, number>;
}

export function ExtrasPriceTable({ model, extras }: ExtrasPriceTableProps) {
  const { profiles, updateExtraPrice, addExtraItem, removeExtraItem } = useAdminSettings();
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    const prices: Record<string, string> = {};
    Object.entries(extras).forEach(([key, val]) => {
      prices[key] = val.toString();
    });
    setEditingPrices(prices);
  }, [extras]);

  const extrasGroup = profiles[model]?.specGroups.find(g => g.groupName.includes("EXTRAS"));
  const extrasFields = extrasGroup?.fields ?? [];

  const handleSave = (key: string) => {
    const price = parseFloat(editingPrices[key]);
    if (!isNaN(price)) {
      updateExtraPrice(model, key, price);
    }
  };

  const handleAdd = () => {
    const name = newName.trim();
    const price = parseFloat(newPrice);
    if (!name || isNaN(price)) return;
    addExtraItem(model, name, price);
    setNewName("");
    setNewPrice("");
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Extras & Paint</h3>
        <button
          onClick={() => setIsAdding(v => !v)}
          className="text-teal-600 hover:text-teal-700 transition-colors p-1"
          title={isAdding ? "Cancel" : "Add New Item"}
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <div className="p-4 bg-teal-50/60 border-b border-teal-100 flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Matt Finish"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="w-28 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price ₹</label>
            <input
              type="number"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="22000"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {extrasFields.map((field) => (
              <tr key={field.id} className="group hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{field.name}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={editingPrices[field.id] ?? extras[field.id] ?? "0"}
                        onChange={e => setEditingPrices(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => handleSave(field.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-md transition-all transform active:scale-90"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeExtraItem(model, field.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-md transition-all transform active:scale-90"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {extrasFields.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-sm">
                  No extras added yet. Click + to add items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50/80 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 italic text-center">Changes here instantly update the Configurator price estimate.</p>
      </div>
    </div>
  );
}

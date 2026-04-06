"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  SPEC_CONFIGURATOR, 
  BUS_MODELS_BASE, 
  STANDARD_VARIATIONS, 
  BaseModels,
  SpecCategoryGroup
} from "@/data/specs";

export interface BusModelProfile {
  basePrice: number;
  specGroups: SpecCategoryGroup[];
  standardSelections: Record<string, string>;
  extrasPricing: Record<string, number>;
}

interface AdminContextType {
  profiles: Record<BaseModels, BusModelProfile>;
  updateBasePrice: (model: BaseModels, price: number) => void;
  addOption: (model: BaseModels, groupName: string, fieldId: string, option: string) => void;
  removeOption: (model: BaseModels, groupName: string, fieldId: string, option: string) => void;
  setStandardSelection: (model: BaseModels, categoryName: string, option: string) => void;
  updateExtraPrice: (model: BaseModels, itemId: string, price: number) => void;
  isLoaded: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "dvn-admin-profiles-v1";
const RENAME_MIGRATION_KEY = "dvn-v3-category-rename"; // Keep: one-time rename is safe as a flag

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Record<BaseModels, BusModelProfile>>({} as any);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let currentProfiles: Record<BaseModels, BusModelProfile>;

    if (saved) {
      currentProfiles = JSON.parse(saved);

      // ─── One-time rename migration ─────────────────────────────────────────
      // Renames "CHASSIS & BASIC" → "CHASSIS" across all models.
      const hasRenamed = localStorage.getItem(RENAME_MIGRATION_KEY);
      if (!hasRenamed) {
        Object.keys(currentProfiles).forEach(key => {
          const modelKey = key as BaseModels;
          if (currentProfiles[modelKey]?.specGroups) {
            currentProfiles[modelKey].specGroups = currentProfiles[modelKey].specGroups.map(group =>
              group.groupName === "CHASSIS & BASIC"
                ? { ...group, groupName: "CHASSIS" }
                : group
            );
          }
        });
        localStorage.setItem(RENAME_MIGRATION_KEY, "true");
      }

      // ─── Self-Healing Sync (runs every startup, fixes itself automatically) ──
      // Compares each model's standardSelections count to Moffusil's.
      // If any model is sparse (fewer selections), it is re-synced from STANDARD_VARIATIONS.
      // This requires no version flags and recovers from any future data drift.
      const moffusilCount = Object.keys(
        currentProfiles["Moffusil"]?.standardSelections ?? {}
      ).length;

      const modelsToCheck: BaseModels[] = ["Town", "College", "Staff"];
      modelsToCheck.forEach(model => {
        const modelCount = Object.keys(
          currentProfiles[model]?.standardSelections ?? {}
        ).length;

        if (modelCount < moffusilCount) {
          // Model is sparse — re-apply full baseline with model-specific overrides
          currentProfiles[model] = {
            ...currentProfiles[model],
            standardSelections: structuredClone(STANDARD_VARIATIONS[model]),
          };
        }
      });

      // ─── Spec Groups Sync ──────────────────────────────────────────────────
      // Ensure Town/College/Staff have the same spec groups as Moffusil.
      const moffusilGroups = currentProfiles["Moffusil"]?.specGroups;
      if (moffusilGroups) {
        modelsToCheck.forEach(model => {
          const modelGroupCount = currentProfiles[model]?.specGroups?.length ?? 0;
          if (modelGroupCount < moffusilGroups.length) {
            currentProfiles[model] = {
              ...currentProfiles[model],
              specGroups: structuredClone(moffusilGroups),
            };
          }
        });
      }

    } else {
      // ─── Fresh Install ─────────────────────────────────────────────────────
      // No localStorage found — build full profiles from specs.ts defaults.
      const initialProfiles: Partial<Record<BaseModels, BusModelProfile>> = {};
      const models: BaseModels[] = ["Moffusil", "Town", "College", "Staff"];

      models.forEach(model => {
        initialProfiles[model] = {
          basePrice: BUS_MODELS_BASE[model].basePrice,
          specGroups: structuredClone(SPEC_CONFIGURATOR),
          standardSelections: structuredClone(STANDARD_VARIATIONS[model]),
          extrasPricing: {
            "art-work": 15000,
            "audio-video": 45000,
            "decorative-lights": 25000,
            "stickers": 8000,
          },
        };
      });

      currentProfiles = initialProfiles as Record<BaseModels, BusModelProfile>;
      localStorage.setItem(RENAME_MIGRATION_KEY, "true");
    }

    setProfiles(currentProfiles);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles, isLoaded]);

  const updateBasePrice = (model: BaseModels, price: number) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      newProfiles[model] = { ...newProfiles[model], basePrice: price };
      return newProfiles;
    });
  };

  const addOption = (model: BaseModels, groupName: string, fieldId: string, option: string) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      // Deep clone only the target model — zero bleed-through to other models
      const targetProfile = structuredClone(newProfiles[model]);
      
      const group = targetProfile.specGroups.find((g: any) => g.groupName === groupName);
      if (group) {
        const field = group.fields.find((f: any) => f.id === fieldId);
        if (field && !field.options.includes(option)) {
          field.options = [...field.options, option];
        }
      }
      
      newProfiles[model] = targetProfile;
      return newProfiles;
    });
  };

  const removeOption = (model: BaseModels, groupName: string, fieldId: string, option: string) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      const targetProfile = structuredClone(newProfiles[model]);
      
      const group = targetProfile.specGroups.find((g: any) => g.groupName === groupName);
      if (group) {
        const field = group.fields.find((f: any) => f.id === fieldId);
        if (field) {
          field.options = field.options.filter((o: string) => o !== option);
          if (targetProfile.standardSelections[field.name] === option) {
            delete targetProfile.standardSelections[field.name];
          }
        }
      }
      
      newProfiles[model] = targetProfile;
      return newProfiles;
    });
  };

  const setStandardSelection = (model: BaseModels, categoryName: string, option: string) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      const targetProfile = { 
        ...newProfiles[model], 
        standardSelections: { ...newProfiles[model].standardSelections, [categoryName]: option } 
      };
      
      newProfiles[model] = targetProfile;
      return newProfiles;
    });
  };

  const updateExtraPrice = (model: BaseModels, itemId: string, price: number) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      newProfiles[model] = {
        ...newProfiles[model],
        extrasPricing: { ...newProfiles[model].extrasPricing, [itemId]: price }
      };
      return newProfiles;
    });
  };

  return (
    <AdminContext.Provider value={{
      profiles,
      updateBasePrice,
      addOption,
      removeOption,
      setStandardSelection,
      updateExtraPrice,
      isLoaded
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdminSettings must be used within an AdminSettingsProvider");
  }
  return context;
}

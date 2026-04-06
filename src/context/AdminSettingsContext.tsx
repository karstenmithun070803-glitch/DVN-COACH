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
const V2_SYNC_KEY = "dvn-v2-baseline-sync";
const V3_RENAME_KEY = "dvn-v3-category-rename";

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Record<BaseModels, BusModelProfile>>({} as any);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let currentProfiles: Record<BaseModels, BusModelProfile>;

    if (saved) {
      currentProfiles = JSON.parse(saved);
      
      // Step 1: Baseline Sync (Legacy)
      const hasSyncedV2 = localStorage.getItem(V2_SYNC_KEY);
      if (!hasSyncedV2) {
        const moffusil = currentProfiles["Moffusil"];
        if (moffusil) {
          const models: BaseModels[] = ["Town", "College", "Staff"];
          models.forEach(model => {
             currentProfiles[model] = {
               ...currentProfiles[model],
               specGroups: JSON.parse(JSON.stringify(moffusil.specGroups)),
               standardSelections: JSON.parse(JSON.stringify(moffusil.standardSelections))
             };
          });
          localStorage.setItem(V2_SYNC_KEY, "true");
        }
      }

      // Step 2: Unified Renaming Migration (New)
      const hasSyncedV3 = localStorage.getItem(V3_RENAME_KEY);
      if (!hasSyncedV3) {
        Object.keys(currentProfiles).forEach(key => {
          const modelKey = key as BaseModels;
          if (currentProfiles[modelKey]?.specGroups) {
            currentProfiles[modelKey].specGroups = currentProfiles[modelKey].specGroups.map(group => {
              if (group.groupName === "CHASSIS & BASIC") {
                return { ...group, groupName: "CHASSIS" };
              }
              return group;
            });
          }
        });
        localStorage.setItem(V3_RENAME_KEY, "true");
      }

      setProfiles(currentProfiles);
    } else {
      // Step 0: Manual Migration from specs.ts (First Load)
      const initialProfiles: Partial<Record<BaseModels, BusModelProfile>> = {};
      const models: BaseModels[] = ["Moffusil", "Town", "College", "Staff"];
      
      models.forEach(model => {
        initialProfiles[model] = {
          basePrice: BUS_MODELS_BASE[model].basePrice,
          specGroups: JSON.parse(JSON.stringify(SPEC_CONFIGURATOR)),
          standardSelections: { ...STANDARD_VARIATIONS[model] },
          extrasPricing: {
            "art-work": 15000,
            "audio-video": 45000,
            "decorative-lights": 25000,
            "stickers": 8000,
          }
        };
      });
      setProfiles(initialProfiles as Record<BaseModels, BusModelProfile>);
      localStorage.setItem(V2_SYNC_KEY, "true"); // Mark as synced for first-load installs
    }
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
      // Step 2: Strict Isolation Lock - Only update the specific model's profile
      const newProfiles = { ...prev };
      // Deep clone only the target model's profile to prevent any bleed-through
      const targetProfile = JSON.parse(JSON.stringify(newProfiles[model]));
      
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
      const targetProfile = JSON.parse(JSON.stringify(newProfiles[model]));
      
      const group = targetProfile.specGroups.find((g: any) => g.groupName === groupName);
      if (group) {
        const field = group.fields.find((f: any) => f.id === fieldId);
        if (field) {
          field.options = field.options.filter((o: string) => o !== option);
          // If removed option was standard, clear it
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

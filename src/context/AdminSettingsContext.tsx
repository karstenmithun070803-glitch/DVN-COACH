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

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Record<BaseModels, BusModelProfile>>({} as any);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setProfiles(JSON.parse(saved));
    } else {
      // Manual Migration from specs.ts
      const initialProfiles: Partial<Record<BaseModels, BusModelProfile>> = {};
      const models: BaseModels[] = ["Moffusil", "Town", "College", "Staff"];
      
      models.forEach(model => {
        initialProfiles[model] = {
          basePrice: BUS_MODELS_BASE[model].basePrice,
          specGroups: JSON.parse(JSON.stringify(SPEC_CONFIGURATOR)), // Deep clone
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
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles, isLoaded]);

  const updateBasePrice = (model: BaseModels, price: number) => {
    setProfiles(prev => ({
      ...prev,
      [model]: { ...prev[model], basePrice: price }
    }));
  };

  const addOption = (model: BaseModels, groupName: string, fieldId: string, option: string) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      const group = newProfiles[model].specGroups.find(g => g.groupName === groupName);
      if (group) {
        const field = group.fields.find(f => f.id === fieldId);
        if (field && !field.options.includes(option)) {
          field.options = [...field.options, option];
        }
      }
      return newProfiles;
    });
  };

  const removeOption = (model: BaseModels, groupName: string, fieldId: string, option: string) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      const group = newProfiles[model].specGroups.find(g => g.groupName === groupName);
      if (group) {
        const field = group.fields.find(f => f.id === fieldId);
        if (field) {
          field.options = field.options.filter(o => o !== option);
          // If removed option was standard, clear it
          if (newProfiles[model].standardSelections[field.name] === option) {
            delete newProfiles[model].standardSelections[field.name];
          }
        }
      }
      return newProfiles;
    });
  };

  const setStandardSelection = (model: BaseModels, categoryName: string, option: string) => {
    setProfiles(prev => ({
      ...prev,
      [model]: {
        ...prev[model],
        standardSelections: { ...prev[model].standardSelections, [categoryName]: option }
      }
    }));
  };

  const updateExtraPrice = (model: BaseModels, itemId: string, price: number) => {
    setProfiles(prev => ({
      ...prev,
      [model]: {
        ...prev[model],
        extrasPricing: { ...prev[model].extrasPricing, [itemId]: price }
      }
    }));
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

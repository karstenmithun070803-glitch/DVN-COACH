"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  SPEC_CONFIGURATOR,
  BUS_MODELS_BASE,
  STANDARD_VARIATIONS,
  BaseModels,
  SpecCategoryGroup,
  Category,
  SeatingRowConfig,
  DEFAULT_SEATING_ROWS,
} from "@/data/specs";
import { arrayMove } from "@dnd-kit/sortable";

export interface BusModelProfile {
  basePrice: number;
  specGroups: SpecCategoryGroup[];
  standardSelections: Record<string, string>;
  extrasPricing: Record<string, number>;
  structurePricing: Record<string, number>; // key = "fieldId:optionValue"
  seatingRows: SeatingRowConfig[];
}

interface AdminContextType {
  profiles: Record<BaseModels, BusModelProfile>;
  updateBasePrice: (model: BaseModels, price: number) => void;
  addOption: (model: BaseModels, groupName: string, fieldId: string, option: string, price?: number) => void;
  updateOptionPrice: (model: BaseModels, groupName: string, fieldId: string, optionValue: string, price: number) => void;
  removeOption: (model: BaseModels, groupName: string, fieldId: string, option: string) => void;
  setStandardSelection: (model: BaseModels, categoryName: string, option: string) => void;
  updateExtraPrice: (model: BaseModels, itemId: string, price: number) => void;
  updateStructurePrice: (model: BaseModels, fieldId: string, optionValue: string, price: number) => void;
  addExtraItem: (model: BaseModels, name: string, price: number) => void;
  removeExtraItem: (model: BaseModels, fieldId: string) => void;
  addField: (model: BaseModels, groupName: string, fieldName: string) => void;
  removeField: (model: BaseModels, groupName: string, fieldId: string) => void;
  reorderGroups: (model: BaseModels, fromIndex: number, toIndex: number) => void;
  reorderFields: (model: BaseModels, groupName: string, fromIndex: number, toIndex: number) => void;
  reorderOptions: (model: BaseModels, groupName: string, fieldId: string, fromIndex: number, toIndex: number) => void;
  renameField: (model: BaseModels, groupName: string, fieldId: string, newName: string) => void;
  renameOption: (model: BaseModels, groupName: string, fieldId: string, oldOpt: string, newOpt: string) => void;
  toggleFieldNote: (model: BaseModels, groupName: string, fieldId: string) => void;
  addSeatingRow: (model: BaseModels, row: Omit<SeatingRowConfig, "id">) => void;
  updateSeatingRow: (model: BaseModels, id: string, changes: Partial<Omit<SeatingRowConfig, "id">>) => void;
  removeSeatingRow: (model: BaseModels, id: string) => void;
  isLoaded: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "dvn-admin-profiles-v1";
const RENAME_MIGRATION_KEY = "dvn-v3-category-rename"; // Keep: one-time rename is safe as a flag
const BASELINE_SYNC_KEY = "dvn-v4-baseline-sync"; // One-time forced reset of all standardSelections to STANDARD_VARIATIONS
const FULL_SYNC_KEY = "dvn-v5-full-moffusil-baseline"; // One-time copy of Moffusil specGroups+standardSelections into all other models

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Record<BaseModels, BusModelProfile>>({} as Record<BaseModels, BusModelProfile>);
  const [isLoaded, setIsLoaded] = useState(false);
  const skipNextSave = useRef(false);

  useEffect(() => {
    async function load() {
      // ─── Supabase first (cross-device source of truth) ───────────────────────
      // If Supabase has data, use it on every open so all devices stay in sync.
      // localStorage is used only as a fallback when Supabase is unreachable.
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("profiles")
          .eq("id", "singleton")
          .single();
        if (!error && data?.profiles && Object.keys(data.profiles).length > 0) {
          const loaded = data.profiles as Record<BaseModels, BusModelProfile>;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loaded));
          skipNextSave.current = true;
          setProfiles(loaded);
          setIsLoaded(true);
          return;
        }
      }

      // ─── Fallback: localStorage + migrations ─────────────────────────────────
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

      // ─── One-Time Forced Baseline Sync (v4) ───────────────────────────────
      // Unconditionally resets ALL four models' standardSelections from the
      // canonical STANDARD_VARIATIONS source in specs.ts.
      // Replaces the old count-based self-heal which silently skipped profiles
      // that had the correct key count but stale/wrong values.
      // specGroups and extrasPricing are fully preserved.
      const hasSynced = localStorage.getItem(BASELINE_SYNC_KEY);
      if (!hasSynced) {
        const allModels: BaseModels[] = ["Moffusil", "Town", "College", "Staff"];
        allModels.forEach(model => {
          if (currentProfiles[model]) {
            currentProfiles[model] = {
              ...currentProfiles[model],
              standardSelections: structuredClone(STANDARD_VARIATIONS[model]),
            };
          }
        });
        localStorage.setItem(BASELINE_SYNC_KEY, "true");
      }

      // ─── One-Time Full Moffusil Baseline Sync (v5) ────────────────────────
      // Copies Moffusil's current specGroups and standardSelections verbatim
      // into Town, College, and Staff so Admin Master shows a visually
      // identical starting state for all models. Silo Rule (structuredClone
      // in all mutations) ensures independence after this point.
      const hasFullSynced = localStorage.getItem(FULL_SYNC_KEY);
      if (!hasFullSynced && currentProfiles["Moffusil"]) {
        const moffusilProfile = currentProfiles["Moffusil"];
        const modelsToSync: BaseModels[] = ["Town", "College", "Staff"];
        modelsToSync.forEach(model => {
          if (currentProfiles[model]) {
            currentProfiles[model] = {
              ...currentProfiles[model],
              specGroups: structuredClone(moffusilProfile.specGroups),
              standardSelections: structuredClone(moffusilProfile.standardSelections),
            };
          }
        });
        localStorage.setItem(FULL_SYNC_KEY, "true");
      }

      // ─── One-Time Seating Rows Init (v6) ─────────────────────────────────
      // Adds default seatingRows to any existing profile that doesn't have them.
      const SEATING_ROWS_MIGRATION_KEY = "dvn-v6-seating-rows-init";
      const hasSeatingRows = localStorage.getItem(SEATING_ROWS_MIGRATION_KEY);
      if (!hasSeatingRows) {
        const allModels: BaseModels[] = ["Moffusil", "Town", "College", "Staff"];
        allModels.forEach(model => {
          if (currentProfiles[model] && !currentProfiles[model].seatingRows) {
            currentProfiles[model].seatingRows = structuredClone(DEFAULT_SEATING_ROWS);
          }
        });
        localStorage.setItem(SEATING_ROWS_MIGRATION_KEY, "true");
      }

      // ─── Option Pricing Migration (v8) ───────────────────────────────────
      // Moves extrasPricing and structurePricing into optionPricing on each field.
      const OPTION_PRICING_MIGRATION_KEY = "dvn-v8-option-pricing";
      const hasOptionPricing = localStorage.getItem(OPTION_PRICING_MIGRATION_KEY);
      if (!hasOptionPricing) {
        const allModelKeys = Object.keys(currentProfiles) as BaseModels[];
        allModelKeys.forEach(model => {
          const prof = currentProfiles[model];
          if (!prof) return;
          // Migrate extrasPricing: fieldId → price for "Yes" option
          if (prof.extrasPricing) {
            prof.specGroups.forEach((g: SpecCategoryGroup) => {
              g.fields.forEach((f: Category) => {
                const ep = prof.extrasPricing[f.id];
                if (ep && ep > 0) {
                  if (!f.optionPricing) f.optionPricing = {};
                  f.optionPricing["Yes"] = ep;
                }
              });
            });
          }
          // Migrate structurePricing: "fieldId:optionValue" → price
          if (prof.structurePricing) {
            Object.entries(prof.structurePricing).forEach(([key, price]) => {
              const colonIdx = key.indexOf(":");
              if (colonIdx === -1) return;
              const fieldId = key.slice(0, colonIdx);
              const optionValue = key.slice(colonIdx + 1);
              prof.specGroups.forEach((g: SpecCategoryGroup) => {
                const f = g.fields.find((f: Category) => f.id === fieldId);
                if (f && price > 0) {
                  if (!f.optionPricing) f.optionPricing = {};
                  f.optionPricing[optionValue] = price as number;
                }
              });
            });
          }
        });
        localStorage.setItem(OPTION_PRICING_MIGRATION_KEY, "true");
      }

      // ─── Kerala Series Init (v7) ──────────────────────────────────────────
      // Adds Kerala Series profile and structurePricing to existing installs.
      const KERALA_MIGRATION_KEY = "dvn-v7-kerala-series";
      const hasKerala = localStorage.getItem(KERALA_MIGRATION_KEY);
      if (!hasKerala) {
        // Add structurePricing to existing 4 models
        const existingModels: BaseModels[] = ["Moffusil", "Town", "College", "Staff"];
        existingModels.forEach(model => {
          if (currentProfiles[model] && !currentProfiles[model].structurePricing) {
            currentProfiles[model] = { ...currentProfiles[model], structurePricing: {} };
          }
        });
        // Create Kerala Series if missing
        if (!currentProfiles["Kerala Series"]) {
          const keralaSpecGroups = structuredClone(SPEC_CONFIGURATOR);
          const keralaStructure = keralaSpecGroups.find((g: SpecCategoryGroup) => g.groupName === "STRUCTURE");
          if (keralaStructure) {
            const wbField = keralaStructure.fields.find((f: Category) => f.id === "wheel-base");
            if (wbField) wbField.options = ["5200mm", "210\""];
          }
          const keralaChassis = keralaSpecGroups.find((g: SpecCategoryGroup) => g.groupName === "CHASSIS");
          if (keralaChassis) {
            const btField = keralaChassis.fields.find((f: Category) => f.id === "body-type");
            if (btField && !btField.options.includes("Kerala Series")) btField.options = [...btField.options, "Kerala Series"];
          }
          currentProfiles["Kerala Series"] = {
            basePrice: BUS_MODELS_BASE["Kerala Series"].basePrice,
            specGroups: keralaSpecGroups,
            standardSelections: structuredClone(STANDARD_VARIATIONS["Kerala Series"]),
            extrasPricing: {
              "art-work": 15000,
              "audio-video": 45000,
              "decorative-lights": 25000,
              "stickers": 8000,
              "bottom-aluminium-sheet-extra": 0,
              "black-cobra-plywood-extra": 0,
            },
            structurePricing: { "wheel-base:210\"": 100000, "wheel-base:5200mm": 0 },
            seatingRows: structuredClone(DEFAULT_SEATING_ROWS),
          };
        }
        localStorage.setItem(KERALA_MIGRATION_KEY, "true");
      }

      // ─── Spec Groups Sync ──────────────────────────────────────────────────
      // Ensure all models have the same spec groups as Moffusil.
      // Kerala Series is included but gets a structuredClone so its custom
      // wheel-base options are preserved after the admin edits them.
      const modelsToCheck: BaseModels[] = ["Town", "College", "Staff", "Kerala Series"];
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

      // ─── Extra Price Group Rename (v9) ───────────────────────────────────
      const EXTRA_PRICE_RENAME_KEY = "dvn-v9-extra-price-rename";
      if (!localStorage.getItem(EXTRA_PRICE_RENAME_KEY)) {
        const allModelKeys = Object.keys(currentProfiles) as BaseModels[];
        allModelKeys.forEach(model => {
          if (currentProfiles[model]?.specGroups) {
            currentProfiles[model].specGroups = currentProfiles[model].specGroups.map((g: SpecCategoryGroup) =>
              g.groupName === "EXTRAS & PAINT (PRICED)" ? { ...g, groupName: "EXTRA PRICE" } : g
            );
          }
        });
        localStorage.setItem(EXTRA_PRICE_RENAME_KEY, "true");
      }

    } else {
      // ─── Fresh Install ─────────────────────────────────────────────────────
      // No Supabase data and no localStorage — build from specs.ts defaults.
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
            "bottom-aluminium-sheet-extra": 0,
            "black-cobra-plywood-extra": 0,
          },
          structurePricing: {},
          seatingRows: structuredClone(DEFAULT_SEATING_ROWS),
        };
      });

      const keralaSpecGroups = structuredClone(SPEC_CONFIGURATOR);
      const keralaStructure = keralaSpecGroups.find((g: SpecCategoryGroup) => g.groupName === "STRUCTURE");
      if (keralaStructure) {
        const wbField = keralaStructure.fields.find((f: Category) => f.id === "wheel-base");
        if (wbField) wbField.options = ["5200mm", "210\""];
      }
      const keralaChassis = keralaSpecGroups.find((g: SpecCategoryGroup) => g.groupName === "CHASSIS");
      if (keralaChassis) {
        const btField = keralaChassis.fields.find((f: Category) => f.id === "body-type");
        if (btField && !btField.options.includes("Kerala Series")) btField.options = [...btField.options, "Kerala Series"];
      }
      initialProfiles["Kerala Series"] = {
        basePrice: BUS_MODELS_BASE["Kerala Series"].basePrice,
        specGroups: keralaSpecGroups,
        standardSelections: structuredClone(STANDARD_VARIATIONS["Kerala Series"]),
        extrasPricing: {
          "art-work": 15000,
          "audio-video": 45000,
          "decorative-lights": 25000,
          "stickers": 8000,
          "bottom-aluminium-sheet-extra": 0,
          "black-cobra-plywood-extra": 0,
        },
        structurePricing: { "wheel-base:210\"": 100000, "wheel-base:5200mm": 0 },
        seatingRows: structuredClone(DEFAULT_SEATING_ROWS),
      };

      currentProfiles = initialProfiles as Record<BaseModels, BusModelProfile>;
      localStorage.setItem(RENAME_MIGRATION_KEY, "true");
      localStorage.setItem(FULL_SYNC_KEY, "true");
    }

    // Both the localStorage and fresh-install paths converge here
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentProfiles));
    setProfiles(currentProfiles);
    setIsLoaded(true);
    // Upload to Supabase so other devices pick up the latest state
    if (isSupabaseConfigured) {
      supabase.from("admin_settings")
        .upsert({ id: "singleton", profiles: currentProfiles, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error("[AdminSettings] Initial upload failed:", error.message);
        });
    }
    }
    load();

  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    if (isSupabaseConfigured) {
      supabase.from("admin_settings")
        .upsert({ id: "singleton", profiles, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error("[AdminSettings] Supabase write failed:", error.message);
        });
    }
  }, [profiles, isLoaded]);

  const updateBasePrice = (model: BaseModels, price: number) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      newProfiles[model] = { ...newProfiles[model], basePrice: price };
      return newProfiles;
    });
  };

  const addOption = (model: BaseModels, groupName: string, fieldId: string, option: string, price?: number) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      // Deep clone only the target model — zero bleed-through to other models
      const targetProfile = structuredClone(newProfiles[model]);

      const group = targetProfile.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      if (group) {
        const field = group.fields.find((f: Category) => f.id === fieldId);
        if (field && !field.options.includes(option)) {
          field.options = [...field.options, option];
          if (price !== undefined && price !== 0) {
            if (!field.optionPricing) field.optionPricing = {};
            field.optionPricing[option] = price;
          }
        }
      }

      newProfiles[model] = targetProfile;
      return newProfiles;
    });
  };

  const updateOptionPrice = (model: BaseModels, groupName: string, fieldId: string, optionValue: string, price: number) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      const g = p.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      const f = g?.fields.find((f: Category) => f.id === fieldId);
      if (f) {
        if (!f.optionPricing) f.optionPricing = {};
        if (price !== 0) f.optionPricing[optionValue] = price;
        else delete f.optionPricing[optionValue];
      }
      return { ...prev, [model]: p };
    });
  };

  const removeOption = (model: BaseModels, groupName: string, fieldId: string, option: string) => {
    setProfiles(prev => {
      const newProfiles = { ...prev };
      const targetProfile = structuredClone(newProfiles[model]);
      
      const group = targetProfile.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      if (group) {
        const field = group.fields.find((f: Category) => f.id === fieldId);
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
      // Deep clone the ENTIRE profile — guarantees zero reference bleed between
      // models regardless of how the data arrived (localStorage, spread, etc.).
      const targetProfile = structuredClone(newProfiles[model]);
      targetProfile.standardSelections[categoryName] = option;
      newProfiles[model] = targetProfile;
      return newProfiles;
    });
  };

  const updateStructurePrice = (model: BaseModels, fieldId: string, optionValue: string, price: number) => {
    const key = `${fieldId}:${optionValue}`;
    setProfiles(prev => ({
      ...prev,
      [model]: { ...prev[model], structurePricing: { ...prev[model].structurePricing, [key]: price } }
    }));
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

  const addExtraItem = (model: BaseModels, name: string, price: number) => {
    const id = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setProfiles(prev => {
      const targetProfile = structuredClone(prev[model]);
      const extrasGroup = targetProfile.specGroups.find((g: SpecCategoryGroup) => g.groupName.includes("EXTRAS"));
      if (extrasGroup && !extrasGroup.fields.some((f: Category) => f.id === id)) {
        extrasGroup.fields = [...extrasGroup.fields, { id, name, options: ["Yes", "No"] }];
      }
      targetProfile.extrasPricing = { ...targetProfile.extrasPricing, [id]: price };
      return { ...prev, [model]: targetProfile };
    });
  };

  const reorderGroups = (model: BaseModels, fromIndex: number, toIndex: number) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      p.specGroups = arrayMove(p.specGroups, fromIndex, toIndex);
      return { ...prev, [model]: p };
    });
  };

  const reorderFields = (model: BaseModels, groupName: string, fromIndex: number, toIndex: number) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      const g = p.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      if (g) g.fields = arrayMove(g.fields, fromIndex, toIndex);
      return { ...prev, [model]: p };
    });
  };

  const reorderOptions = (model: BaseModels, groupName: string, fieldId: string, fromIndex: number, toIndex: number) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      const g = p.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      const f = g?.fields.find((f: Category) => f.id === fieldId);
      if (f) f.options = arrayMove(f.options, fromIndex, toIndex);
      return { ...prev, [model]: p };
    });
  };

  const renameField = (model: BaseModels, groupName: string, fieldId: string, newName: string) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      const g = p.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      const f = g?.fields.find((f: Category) => f.id === fieldId);
      if (f) {
        if (p.standardSelections[f.name] !== undefined) {
          p.standardSelections[newName] = p.standardSelections[f.name];
          delete p.standardSelections[f.name];
        }
        f.name = newName;
      }
      return { ...prev, [model]: p };
    });
  };

  const renameOption = (model: BaseModels, groupName: string, fieldId: string, oldOpt: string, newOpt: string) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      const g = p.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      const f = g?.fields.find((f: Category) => f.id === fieldId);
      if (f) {
        f.options = f.options.map((o: string) => o === oldOpt ? newOpt : o);
        if (p.standardSelections[f.name] === oldOpt) p.standardSelections[f.name] = newOpt;
      }
      return { ...prev, [model]: p };
    });
  };

  const toggleFieldNote = (model: BaseModels, groupName: string, fieldId: string) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      const g = p.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      const f = g?.fields.find((f: Category) => f.id === fieldId);
      if (f) f.noteEnabled = !f.noteEnabled;
      return { ...prev, [model]: p };
    });
  };

  const addField = (model: BaseModels, groupName: string, fieldName: string) => {
    const id = fieldName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setProfiles(prev => {
      const targetProfile = structuredClone(prev[model]);
      const group = targetProfile.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      if (group && !group.fields.some((f: Category) => f.id === id)) {
        group.fields = [...group.fields, { id, name: fieldName.trim(), options: [] }];
      }
      return { ...prev, [model]: targetProfile };
    });
  };

  const removeField = (model: BaseModels, groupName: string, fieldId: string) => {
    setProfiles(prev => {
      const targetProfile = structuredClone(prev[model]);
      const group = targetProfile.specGroups.find((g: SpecCategoryGroup) => g.groupName === groupName);
      if (group) {
        const field = group.fields.find((f: Category) => f.id === fieldId);
        if (field) {
          delete targetProfile.standardSelections[field.name];
        }
        group.fields = group.fields.filter((f: Category) => f.id !== fieldId);
      }
      return { ...prev, [model]: targetProfile };
    });
  };

  const addSeatingRow = (model: BaseModels, row: Omit<SeatingRowConfig, "id">) => {
    const id = `${row.location}-${row.type}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + `-${Date.now()}`;
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      p.seatingRows = [...(p.seatingRows ?? []), { id, ...row }];
      return { ...prev, [model]: p };
    });
  };

  const updateSeatingRow = (model: BaseModels, id: string, changes: Partial<Omit<SeatingRowConfig, "id">>) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      p.seatingRows = (p.seatingRows ?? []).map(r => r.id === id ? { ...r, ...changes } : r);
      return { ...prev, [model]: p };
    });
  };

  const removeSeatingRow = (model: BaseModels, id: string) => {
    setProfiles(prev => {
      const p = structuredClone(prev[model]);
      p.seatingRows = (p.seatingRows ?? []).filter(r => r.id !== id);
      return { ...prev, [model]: p };
    });
  };

  const removeExtraItem = (model: BaseModels, fieldId: string) => {
    setProfiles(prev => {
      const targetProfile = structuredClone(prev[model]);
      const extrasGroup = targetProfile.specGroups.find((g: SpecCategoryGroup) => g.groupName.includes("EXTRAS"));
      if (extrasGroup) {
        extrasGroup.fields = extrasGroup.fields.filter((f: Category) => f.id !== fieldId);
      }
      targetProfile.extrasPricing = Object.fromEntries(
        Object.entries(targetProfile.extrasPricing).filter(([k]) => k !== fieldId)
      );
      return { ...prev, [model]: targetProfile };
    });
  };

  return (
    <AdminContext.Provider value={{
      profiles,
      updateBasePrice,
      addOption,
      updateOptionPrice,
      removeOption,
      setStandardSelection,
      updateExtraPrice,
      updateStructurePrice,
      addExtraItem,
      removeExtraItem,
      addField,
      removeField,
      reorderGroups,
      reorderFields,
      reorderOptions,
      renameField,
      renameOption,
      toggleFieldNote,
      addSeatingRow,
      updateSeatingRow,
      removeSeatingRow,
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

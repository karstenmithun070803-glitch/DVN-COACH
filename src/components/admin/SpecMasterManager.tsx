"use client";

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { BaseModels, SpecCategoryGroup, Category } from "@/data/specs";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  GripVertical,
  X,
  StickyNote,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface SpecMasterManagerProps {
  model: BaseModels;
  specGroups: SpecCategoryGroup[];
  standardSelections: Record<string, string>;
}

// ─── Level 1: Sortable Option Chip ────────────────────────────────────────────

const fmtPrice = (p: number) => {
  const abs = Math.abs(p);
  if (abs >= 100000) return `${(abs / 100000).toFixed(abs % 100000 === 0 ? 0 : 1)}L`;
  if (abs >= 1000)   return `${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k`;
  return `${abs}`;
};

type PendingAction =
  | { type: "option"; groupName: string; fieldId: string; option: string; price: number }
  | { type: "field"; groupName: string; fieldName: string }
  | { type: "delete-option"; groupName: string; fieldId: string; option: string }
  | { type: "delete-field"; groupName: string; fieldId: string; fieldName: string };

const ALL_MODELS: BaseModels[] = ["Moffusil", "Town", "College", "Staff", "Kerala Series"];

function BroadcastModal({
  currentModel,
  isDelete,
  onConfirm,
  onCancel,
}: {
  currentModel: BaseModels;
  isDelete: boolean;
  onConfirm: (targets: BaseModels[]) => void;
  onCancel: () => void;
}) {
  const otherModels = ALL_MODELS.filter(m => m !== currentModel);
  const [selected, setSelected] = useState<Set<BaseModels>>(new Set());

  const allChecked = selected.size === otherModels.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(otherModels));
  const toggle = (m: BaseModels) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-sm mx-4">
        <h3 className={cn("text-base font-bold mb-1", isDelete ? "text-rose-700" : "text-slate-800")}>
          {isDelete ? "Delete from other models?" : "Apply to other models?"}
        </h3>
        <p className="text-xs text-slate-500 mb-1">
          <span className={cn("font-semibold", isDelete ? "text-rose-600" : "text-teal-700")}>{currentModel}</span>
          {isDelete ? " will always be affected." : " is always updated."}
          {" "}Choose additional models below.
        </p>
        {isDelete && (
          <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-3">
            This action cannot be undone.
          </p>
        )}

        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-teal-600"
          />
          <span className="text-sm font-semibold text-slate-700">Select All</span>
        </label>
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl mb-5 overflow-hidden">
          {otherModels.map(m => (
            <label key={m} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 select-none">
              <input
                type="checkbox"
                checked={selected.has(m)}
                onChange={() => toggle(m)}
                className="w-4 h-4 rounded accent-teal-600"
              />
              <span className="text-sm text-slate-700">{m}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm([])}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all",
              isDelete ? "bg-rose-500 hover:bg-rose-600" : "bg-slate-500 hover:bg-slate-600"
            )}
          >
            This model only
          </button>
          <button
            onClick={() => onConfirm([...selected])}
            disabled={selected.size === 0}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all",
              selected.size > 0
                ? isDelete ? "bg-rose-600 hover:bg-rose-700" : "bg-teal-600 hover:bg-teal-700"
                : isDelete ? "bg-rose-200 cursor-not-allowed" : "bg-teal-200 cursor-not-allowed"
            )}
          >
            {isDelete ? "Delete from selected" : "Broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SortableOptionChipProps {
  option: string;
  isDefault: boolean;
  optionPrice?: number;
  onToggleStar: () => void;
  onRemove: () => void;
  onRename: (oldOpt: string, newOpt: string) => void;
  onUpdatePrice: (price: number) => void;
}

function SortableOptionChip({
  option,
  isDefault,
  optionPrice,
  onToggleStar,
  onRemove,
  onRename,
  onUpdatePrice,
}: SortableOptionChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(option);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option, disabled: isEditing });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const commitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== option) onRename(option, trimmed);
    setIsEditing(false);
  };

  const handleChipClick = () => {
    if (isEditing) return;
    // Only start editing when clicking on the text area, not action buttons
    setIsEditing(true);
    setEditValue(option);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing touch-none",
        isDragging && "z-50 shadow-xl",
        isDefault
          ? "bg-teal-600 border-teal-600 shadow-lg shadow-teal-600/20"
          : "bg-white border-slate-200 hover:border-teal-300"
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") { setEditValue(option); setIsEditing(false); }
            e.stopPropagation();
          }}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className="text-sm font-bold bg-transparent border-b border-white outline-none w-24 text-white placeholder-white/60"
          autoFocus
        />
      ) : (
        <span
          onClick={handleChipClick}
          onPointerDown={e => e.stopPropagation()}
          className={cn(
            "text-sm font-bold tracking-tight cursor-text select-none",
            isDefault ? "text-white" : "text-slate-700"
          )}
          title="Click to rename"
        >
          {option}
        </span>
      )}

      {/* Inline price badge / editor */}
      <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        {editingPrice ? (
          <input
            autoFocus
            type="number"
            value={priceInput}
            onChange={e => setPriceInput(e.target.value)}
            onBlur={() => { onUpdatePrice(Number(priceInput) || 0); setEditingPrice(false); }}
            onKeyDown={e => {
              if (e.key === "Enter") { onUpdatePrice(Number(priceInput) || 0); setEditingPrice(false); }
              if (e.key === "Escape") setEditingPrice(false);
              e.stopPropagation();
            }}
            className="w-20 text-xs border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-400 text-slate-700 bg-white"
            placeholder="₹ price"
          />
        ) : (
          <button
            onClick={() => { setPriceInput(String(optionPrice ?? "")); setEditingPrice(true); }}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded transition-colors",
              optionPrice && optionPrice !== 0
                ? optionPrice > 0
                  ? "bg-teal-50 text-teal-700 font-medium border border-teal-200"
                  : "bg-orange-50 text-orange-600 font-medium border border-orange-200"
                : isDefault
                  ? "text-white/50 hover:text-white hover:bg-white/10"
                  : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
            )}
            title="Set price for this option"
          >
            {optionPrice && optionPrice !== 0 ? `${optionPrice > 0 ? "+" : "-"}₹${fmtPrice(optionPrice)}` : "+₹"}
          </button>
        )}
      </div>

      <div
        className="flex items-center border-l border-slate-100 pl-3 ml-1 group-hover:border-teal-400 transition-colors"
        onPointerDown={e => e.stopPropagation()}
      >
        <button
          onClick={e => { e.stopPropagation(); onToggleStar(); }}
          className={cn(
            "p-1.5 rounded-md transition-all",
            isDefault
              ? "bg-teal-500/50 text-white"
              : "text-slate-300 hover:text-teal-600 hover:bg-teal-50"
          )}
          title={isDefault ? "Standard" : "Set as Standard"}
        >
          <Star className={cn("w-3.5 h-3.5", isDefault && "fill-current")} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className={cn(
            "p-1.5 rounded-md transition-all",
            isDefault
              ? "text-white/60 hover:text-white hover:bg-white/10"
              : "text-slate-300 hover:text-red-500 hover:bg-red-50"
          )}
          title="Delete Option"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Level 2: Sortable Field Row ───────────────────────────────────────────────

interface SortableFieldRowProps {
  field: Category;
  groupName: string;
  model: BaseModels;
  standardSelections: Record<string, string>;
  sensors: ReturnType<typeof useSensors>;
  onRequestBroadcast: (action: PendingAction) => void;
}

function SortableFieldRow({
  field,
  groupName,
  model,
  standardSelections,
  sensors,
  onRequestBroadcast,
}: SortableFieldRowProps) {
  const {
    updateOptionPrice,
    setStandardSelection,
    reorderOptions,
    renameField,
    renameOption,
    toggleFieldNote,
  } = useAdminSettings();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(field.name);
  const [addingOption, setAddingOption] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState<number | "">("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id, disabled: isEditingName });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const commitFieldRename = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== field.name) renameField(model, groupName, field.id, trimmed);
    setIsEditingName(false);
  };

  const handleAddOption = () => {
    if (newOptionValue.trim()) {
      onRequestBroadcast({
        type: "option",
        groupName,
        fieldId: field.id,
        option: newOptionValue.trim(),
        price: Number(newOptionPrice) || 0,
      });
      setNewOptionValue("");
      setNewOptionPrice("");
      setAddingOption(false);
    }
  };

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = field.options.indexOf(active.id as string);
    const newIndex = field.options.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderOptions(model, groupName, field.id, oldIndex, newIndex);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-4">
      {/* Field Header */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-2 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            {...listeners}
            {...attributes}
            className="text-slate-300 hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={editNameValue}
              onChange={e => setEditNameValue(e.target.value)}
              onBlur={commitFieldRename}
              onKeyDown={e => {
                if (e.key === "Enter") commitFieldRename();
                if (e.key === "Escape") { setEditNameValue(field.name); setIsEditingName(false); }
              }}
              className="text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-50 border border-teal-400 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-teal-500/20 flex-1 min-w-0"
              autoFocus
            />
          ) : (
            <h4
              onClick={() => { setIsEditingName(true); setEditNameValue(field.name); }}
              className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none cursor-text hover:text-teal-600 transition-colors truncate"
              title="Click to rename"
            >
              {field.name}
            </h4>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => toggleFieldNote(model, groupName, field.id)}
            className={cn(
              "p-1 rounded-md transition-all",
              field.noteEnabled
                ? "text-teal-600 bg-teal-50 hover:bg-teal-100"
                : "text-slate-300 hover:text-teal-500 hover:bg-teal-50"
            )}
            title={field.noteEnabled ? "Disable Note Box" : "Enable Note Box"}
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAddingOption(v => !v)}
            className="text-teal-600 hover:text-teal-700 p-1 rounded-md hover:bg-teal-50 transition-all"
            title="Add New Option"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRequestBroadcast({ type: "delete-field", groupName, fieldId: field.id, fieldName: field.name })}
            className="text-slate-300 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 transition-all"
            title="Delete Spec Row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Option Input */}
      {addingOption && (
        <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
          <input
            autoFocus
            type="text"
            value={newOptionValue}
            onChange={e => setNewOptionValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddOption()}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            placeholder="Option name..."
          />
          <input
            type="number"
            value={newOptionPrice}
            onChange={e => setNewOptionPrice(e.target.value === "" ? "" : Number(e.target.value))}
            onKeyDown={e => e.key === "Enter" && handleAddOption()}
            className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            placeholder="₹ price"
          />
          <button
            onClick={handleAddOption}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Add
          </button>
        </div>
      )}

      {/* Option Chips */}
      <DndContext sensors={sensors} onDragEnd={handleOptionDragEnd}>
        <SortableContext items={field.options} strategy={verticalListSortingStrategy}>
          <div className="flex flex-wrap gap-3">
            {field.options.map(opt => (
              <SortableOptionChip
                key={opt}
                option={opt}
                isDefault={standardSelections[field.name] === opt}
                optionPrice={field.optionPricing?.[opt]}
                onToggleStar={() => {
                  const isActive = standardSelections[field.name] === opt;
                  setStandardSelection(model, field.name, isActive ? "" : opt);
                }}
                onRemove={() => onRequestBroadcast({ type: "delete-option", groupName, fieldId: field.id, option: opt })}
                onRename={(oldOpt, newOpt) => renameOption(model, groupName, field.id, oldOpt, newOpt)}
                onUpdatePrice={(price) => updateOptionPrice(model, groupName, field.id, opt, price)}
              />
            ))}
            {field.options.length === 0 && (
              <p className="text-xs text-slate-400 italic">No options yet — click + to add.</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ─── Level 3: Sortable Group Card ─────────────────────────────────────────────

interface SortableGroupCardProps {
  group: SpecCategoryGroup;
  model: BaseModels;
  standardSelections: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  sensors: ReturnType<typeof useSensors>;
  onRequestBroadcast: (action: PendingAction) => void;
}

function SortableGroupCard({
  group,
  model,
  standardSelections,
  isOpen,
  onToggle,
  sensors,
  onRequestBroadcast,
}: SortableGroupCardProps) {
  const { reorderFields } = useAdminSettings();
  const [addingField, setAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.groupName });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleAddField = () => {
    if (newFieldName.trim()) {
      onRequestBroadcast({ type: "field", groupName: group.groupName, fieldName: newFieldName.trim() });
      setNewFieldName("");
      setAddingField(false);
    }
  };

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = group.fields.findIndex(f => f.id === active.id);
    const newIndex = group.fields.findIndex(f => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderFields(model, group.groupName, oldIndex, newIndex);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`admin-section-${group.groupName}`}
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden scroll-mt-24",
        isDragging && "shadow-2xl ring-2 ring-teal-400/30"
      )}
    >
      {/* Group Header */}
      <div
        className={cn(
          "flex items-center transition-all",
          isOpen && "bg-slate-50/80 border-b border-slate-100"
        )}
      >
        {/* Drag grip */}
        <button
          {...listeners}
          {...attributes}
          className="pl-5 pr-3 py-6 text-slate-300 hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          title="Drag to reorder section"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Accordion toggle */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between py-6 pr-8 hover:bg-slate-50/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {group.groupName}
            </span>
            <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {group.fields.length} Categories
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Group Fields */}
      {isOpen && (
        <div className="p-8 space-y-10 bg-white">
          <DndContext sensors={sensors} onDragEnd={handleFieldDragEnd}>
            <SortableContext
              items={group.fields.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.fields.map(field => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  groupName={group.groupName}
                  model={model}
                  standardSelections={standardSelections}
                  sensors={sensors}
                  onRequestBroadcast={onRequestBroadcast}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add New Spec Row */}
          <div className="border-t border-slate-100 pt-6">
            {addingField ? (
              <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                <input
                  autoFocus
                  type="text"
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddField();
                    if (e.key === "Escape") { setAddingField(false); setNewFieldName(""); }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  placeholder="New spec name (e.g. Tyre Type)"
                />
                <button
                  onClick={handleAddField}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingField(false); setNewFieldName(""); }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingField(true)}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors group"
              >
                <div className="w-6 h-6 rounded-lg border-2 border-dashed border-slate-200 group-hover:border-teal-400 flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                Add New Spec
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root: SpecMasterManager ───────────────────────────────────────────────────

export function SpecMasterManager({ model, specGroups, standardSelections }: SpecMasterManagerProps) {
  const { reorderGroups, addOption, addField, removeOption, removeField } = useAdminSettings();
  const [activeAccordion, setActiveAccordion] = useState<string>("CHASSIS");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handleBroadcastConfirm = (extraTargets: BaseModels[]) => {
    if (!pendingAction) return;
    const allTargets = [model, ...extraTargets];
    allTargets.forEach(target => {
      if (pendingAction.type === "option") {
        addOption(target, pendingAction.groupName, pendingAction.fieldId, pendingAction.option, pendingAction.price);
      } else if (pendingAction.type === "field") {
        addField(target, pendingAction.groupName, pendingAction.fieldName);
      } else if (pendingAction.type === "delete-option") {
        removeOption(target, pendingAction.groupName, pendingAction.fieldId, pendingAction.option);
      } else if (pendingAction.type === "delete-field") {
        removeField(target, pendingAction.groupName, pendingAction.fieldId);
      }
    });
    setPendingAction(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (activeAccordion) {
      setTimeout(() => {
        const el = document.getElementById(`admin-section-${activeAccordion}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [activeAccordion]);

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = specGroups.findIndex(g => g.groupName === active.id);
    const newIndex = specGroups.findIndex(g => g.groupName === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderGroups(model, oldIndex, newIndex);
    }
  };

  return (
    <>
      {pendingAction && (
        <BroadcastModal
          currentModel={model}
          isDelete={pendingAction.type === "delete-option" || pendingAction.type === "delete-field"}
          onConfirm={handleBroadcastConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}
      <DndContext sensors={sensors} onDragEnd={handleGroupDragEnd}>
        <SortableContext
          items={specGroups.map(g => g.groupName)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {specGroups.map(group => (
              <SortableGroupCard
                key={group.groupName}
                group={group}
                model={model}
                standardSelections={standardSelections}
                isOpen={activeAccordion === group.groupName}
                onToggle={() =>
                  setActiveAccordion(prev => (prev === group.groupName ? "" : group.groupName))
                }
                sensors={sensors}
                onRequestBroadcast={setPendingAction}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

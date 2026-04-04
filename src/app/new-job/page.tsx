"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, Printer } from "lucide-react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { 
  SPEC_CONFIGURATOR, 
  BaseModels, 
  BUS_MODELS_BASE, 
  STANDARD_VARIATIONS,
} from "@/data/specs";
import { t } from "@/data/translation";
// Reverting to Geist (Inter-like) since we have no easy way of injecting external Google Fonts atm, but using standard Sans.

export default function NewJobPage() {
  const [activeModel, setActiveModel] = useState<BaseModels>("Town");
  const [selections, setSelections] = useState<Record<string, string>>(STANDARD_VARIATIONS["Town"]);
  const [activeSection, setActiveSection] = useState<string>("CHASSIS & BASIC");
  
  const [isTamil, setIsTamil] = useState(false);
  const [isStandardBuild, setIsStandardBuild] = useState(true);

  // Stage 3 updated to Stage 5 logic: Global base fallback
  const handleStandardToggle = (checked: boolean) => {
    setIsStandardBuild(checked);
    if (checked) {
      setSelections({ 
        ...STANDARD_VARIATIONS["Moffusil"], 
        ...(STANDARD_VARIATIONS[activeModel] || {}) 
      });
    } else {
      setSelections({}); 
    }
  };

  useEffect(() => {
    if (isStandardBuild) {
      setSelections({ 
        ...STANDARD_VARIATIONS["Moffusil"], 
        ...(STANDARD_VARIATIONS[activeModel] || {}) 
      });
    }
  }, [activeModel]);

  const extrasPricing: Record<string, number> = {
    "art-work-Yes": 15000,
    "audio-video-Yes": 45000,
    "decorative-lights-Yes": 25000,
    "stickers-Yes": 8000,
  };

  const handleModelSelect = (model: BaseModels) => {
    setActiveModel(model);
  };

  const currentEstimate = useMemo(() => {
    let total = BUS_MODELS_BASE[activeModel].basePrice;
    Object.entries(selections).forEach(([key, val]) => {
      const fieldDef = SPEC_CONFIGURATOR.flatMap(s => s.fields).find(f => f.name === key);
      if (fieldDef) {
        const priceKey = `${fieldDef.id}-${val}`;
        if (extrasPricing[priceKey]) total += extrasPricing[priceKey];
      }
    });
    return total;
  }, [activeModel, selections, extrasPricing]);

  // Add scroll handler for Accordions
  const handleSectionToggle = (sectionName: string) => {
    const isOpening = activeSection !== sectionName;
    setActiveSection(isOpening ? sectionName : "");
    
    if (isOpening) {
      setTimeout(() => {
        const el = document.getElementById(`section-${sectionName}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleSelect = (fieldId: string, value: string) => {
    setIsStandardBuild(false);
    setSelections(prev => {
      const isAlreadySelected = prev[fieldId] === value;
      if (isAlreadySelected) {
        const newSelections = { ...prev };
        delete newSelections[fieldId];
        return newSelections;
      }
      return { ...prev, [fieldId]: value };
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] text-[#333333] -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Action Bar */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 print:hidden">
          <h1 className="text-3xl font-semibold tracking-tight text-[#333333]">New Configurator</h1>
          <div className="flex gap-4 items-center">
            
            {/* Stage 3: Professional Segmented Language Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setIsTamil(false)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  !isTamil ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                English
              </button>
              <button
                onClick={() => setIsTamil(true)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  isTamil ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                தமிழ்
              </button>
            </div>

            {/* Standard Build (Functionality mapped in Stage 3) */}
            <label className="flex items-center cursor-pointer gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 transition-shadow">
              <span className="font-medium text-[#475569] text-sm">Standard Build</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isStandardBuild}
                  onChange={(e) => handleStandardToggle(e.target.checked)} 
                />
                <div className={cn("block w-10 h-6 rounded-full transition-colors", isStandardBuild ? "bg-teal-500" : "bg-slate-200")}></div>
                <div className={cn("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm", isStandardBuild ? "transform translate-x-4" : "")}></div>
              </div>
            </label>
            
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm font-medium transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Spec</span>
            </button>
          </div>
        </div>

        {/* -- PRINT ONLY SPEC SHEET (Outside main layout to prevent scaling bounds) -- */}
        <div className="print-page-container hidden print:block text-black font-sans leading-relaxed absolute top-0 left-0 z-[999]">
           <div className="text-center w-full block mb-8">
             <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-1 text-slate-900">Durga Industries</h1>
             <p className="text-base font-bold uppercase tracking-widest text-slate-800">Specifications for Body Building</p>
             <p className="text-xs text-gray-700 mt-1 max-w-lg mx-auto">SF.NO. 1994/2 Madurai New Bye Pass Road Near Periyar Arch, Karur - 639008</p>
           </div>
             
           <div className="flex justify-between gap-12 text-sm border-b-2 border-black pb-8 mb-8">
             {/* Left Align Block */}
             <div className="flex flex-col gap-5 w-1/2">
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Customer Name:</strong> 
                 <div className="border-b border-black flex-grow"></div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Mobile No:</strong> 
                 <div className="border-b border-black flex-grow"></div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Date:</strong> 
                 <div className="border-b border-black flex-grow"></div>
               </div>
             </div>
             {/* Right Align Block */}
             <div className="flex flex-col gap-5 w-1/2">
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Job No:</strong> 
                 <div className="border-b border-black flex-grow"></div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Chassis No:</strong> 
                 <div className="border-b border-black flex-grow"></div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Engine No:</strong> 
                 <div className="border-b border-black flex-grow"></div>
               </div>
             </div>
           </div>

           <h3 className="text-xl font-bold uppercase mb-6 text-slate-900">
             Blueprint: {activeModel} Series
           </h3>
           
           <div className="columns-2 gap-16 text-[15px]">
             {Object.entries(selections).map(([key, val]) => (
               <div key={key} className="break-inside-avoid mb-4 border-b border-slate-200 pb-1.5 flex justify-between items-end">
                  <span className={cn(
                    "text-slate-600 uppercase font-semibold text-xs tracking-wider",
                    isTamil && "font-bold text-[14px]"
                  )}>
                    {t(key, isTamil)}
                  </span>
                  <span className={cn(
                    "font-bold text-slate-900 text-right",
                    isTamil && "font-extrabold text-[17px] tracking-wide"
                  )}>
                    {t(val, isTamil)}
                  </span>
               </div>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
          
          {/* LEFT PANEL: Summary & Active Build View (Sticky) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24 self-start">
            
            {/* Soft Shadow Graphic Mock Box */}
            <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-slate-50 flex flex-col relative overflow-hidden print:hidden z-10 w-full">
               <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">ACTIVE MODEL</span>
                  <select
                    value={activeModel}
                    onChange={(e) => handleModelSelect(e.target.value as BaseModels)}
                    className="bg-slate-50 border border-slate-200 text-[#333333] text-sm font-bold uppercase rounded-md px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {(["Moffusil", "Town", "College", "Staff"] as BaseModels[]).map((model) => (
                      <option key={model} value={model}>{model} Series</option>
                    ))}
                  </select>
               </div>
               <div className="h-48 w-full relative flex items-center justify-center p-4 bg-slate-50/50">
                  <div className="relative w-[90%] h-full flex items-center justify-center">
                    <Image 
                      src={`/images/${activeModel}.png`} 
                      alt={`${activeModel} Bus Image`} 
                      fill 
                      className="object-contain drop-shadow-md mix-blend-multiply transition-transform duration-300 hover:scale-105"
                    />
                  </div>
               </div>
               
               <div className="p-5 border-t border-slate-100 flex justify-between items-end bg-white">
                  <div>
                    <h2 className="text-xl font-bold text-[#333333]">{activeModel}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Configuration Estimate</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-teal-600">
                      ₹{currentEstimate.toLocaleString('en-IN')}
                    </h2>
                  </div>
               </div>
            </div>

            {/* Stage 4: Live Blueprint Summary Panel */}
            <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-slate-50 p-5 print:hidden flex flex-col max-h-[450px]">
               <h3 className="text-sm font-semibold text-[#475569] uppercase tracking-wide mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                 Live Specifications
                 <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold">
                   {Object.keys(selections).length} Items
                 </span>
               </h3>
               
               {Object.keys(selections).length === 0 ? (
                 <p className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                   No specifications selected.
                 </p>
               ) : (
                 <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-2">
                   {Object.entries(selections).map(([key, val]) => (
                     <div key={key} className="flex justify-between items-start border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <span className="text-[11px] text-[#64748B] uppercase tracking-tight w-1/3 leading-tight font-medium mt-0.5">{t(key, isTamil)}</span>
                        <span className="text-sm font-medium text-[#333333] text-right w-2/3 leading-snug">{t(val, isTamil)}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          {/* RIGHT PANEL: Accordion Steps (Clean Plump Cards) */}
          <div className="lg:col-span-8 flex flex-col gap-4 print:hidden">
            {SPEC_CONFIGURATOR.map((section) => (
              <div 
                key={section.groupName} 
                id={`section-${section.groupName}`}
                className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] border border-slate-50 overflow-hidden"
              >
                <div 
                  className={cn(
                    "p-6 flex justify-between items-center cursor-pointer transition-all",
                    activeSection === section.groupName ? "bg-slate-50/50" : "hover:bg-slate-50/80"
                  )}
                  onClick={() => handleSectionToggle(section.groupName)}
                >
                   <h3 className={cn(
                     "text-base font-semibold",
                     activeSection === section.groupName ? "text-[#333333]" : "text-[#475569]",
                     isTamil && "font-bold text-[17px] tracking-wide"
                   )}>
                     {t(section.groupName, isTamil)}
                   </h3>
                   {activeSection === section.groupName 
                     ? <ChevronUp className="w-5 h-5 text-slate-400" /> 
                     : <ChevronDown className="w-5 h-5 text-slate-400" />
                   }
                </div>
                
                {activeSection === section.groupName && (
                  <div className="p-6 pt-0 border-t border-slate-100 flex flex-col gap-8 bg-white mt-4">
                    {section.fields.map((field) => (
                      <div key={field.id}>
                        <p className={cn(
                          "text-sm font-semibold text-[#64748B] mb-3",
                          isTamil && "font-bold text-[15px]" 
                        )}>
                          {t(field.name, isTamil)}
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                          {field.options.map(opt => {
                            const isSelected = selections[field.name] === opt;
                            const hasExtraPrice = extrasPricing[`${field.id}-${opt}`];
                            
                            return (
                              <div
                                key={opt}
                                onClick={() => handleSelect(field.name, opt)}
                                className={cn(
                                  "px-5 py-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-all border",
                                  isSelected 
                                    ? "border-teal-500 bg-teal-50" 
                                    : "border-slate-200 bg-white hover:border-teal-300"
                                )}
                              >
                                <span className={cn(
                                  "text-sm font-medium", 
                                  isSelected ? "text-teal-800" : "text-[#333333]",
                                  isTamil && "font-bold text-[15.5px]" 
                                )}>
                                  {t(opt, isTamil)}
                                </span>
                                
                                {hasExtraPrice && (
                                  <span className={cn(
                                    "text-xs font-medium ml-4", 
                                    isSelected ? "text-teal-600" : "text-slate-400"
                                  )}>
                                    +₹{(hasExtraPrice/1000).toFixed(1)}k
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, Printer, User, Hash, Phone, Key, Calendar, Settings } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { 
  BaseModels, 
} from "@/data/specs";
import { useAdminSettings } from "@/context/AdminSettingsContext";
import { useJobs } from "@/context/JobsContext";
import { t } from "@/data/translation";

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const cloneId = searchParams.get("cloneId");
  
  const { profiles, isLoaded } = useAdminSettings();
  const { addJob, updateJob, jobs, getNextJobNumber } = useJobs();
  
  const [activeModel, setActiveModel] = useState<BaseModels>("Town");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string>("CHASSIS");
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [currentCloneId, setCurrentCloneId] = useState<string | null>(null);
  
  const [isTamil, setIsTamil] = useState(false);
  const [isStandardBuild, setIsStandardBuild] = useState(true);

  // Basic Information State (Single Source of Truth)
  const [basicInfo, setBasicInfo] = useState({
    customerName: "",
    jobNo: "",
    mobileNo: "",
    chassisNo: "",
    date: new Date().toISOString().split("T")[0],
    engineNo: ""
  });

  // Hydration Logic: Load existing job if editId or cloneId is provided
  useEffect(() => {
    if (isLoaded && (editId || cloneId) && jobs.length > 0) {
      const sourceId = editId || cloneId;
      const existingJob = jobs.find(j => j.id === sourceId);
      
      if (existingJob) {
        if (editId) setCurrentEditId(existingJob.id);
        if (cloneId) setCurrentCloneId(existingJob.id);
        
        setActiveModel(existingJob.model);
        
        // Conditional Reset for Clones vs Exact Copy for Edits
        setBasicInfo({
          customerName: existingJob.customerName || "",
          jobNo: cloneId ? getNextJobNumber() : (existingJob.jobNo || ""),
          mobileNo: existingJob.mobileNo || "",
          chassisNo: cloneId ? "" : (existingJob.chassisNo || ""),
          engineNo: cloneId ? "" : (existingJob.engineNo || ""),
          date: cloneId ? new Date().toISOString().split("T")[0] : (existingJob.startDate || new Date().toISOString().split("T")[0]),
        });
        
        if (existingJob.selections) {
          setSelections(existingJob.selections);
          setIsStandardBuild(false); 
        }
      }
    }
  }, [isLoaded, editId, cloneId, jobs, getNextJobNumber]);

  // Automated numbering for brand NEW jobs (not clone/edit)
  useEffect(() => {
    if (isLoaded && !editId && !cloneId && basicInfo.jobNo === "") {
      setBasicInfo(prev => ({ ...prev, jobNo: getNextJobNumber() }));
    }
  }, [isLoaded, editId, cloneId, getNextJobNumber, basicInfo.jobNo]);

  // Initialize selections once profiles are loaded (only for brand NEW jobs)
  useEffect(() => {
    if (isLoaded && isStandardBuild && !currentEditId && !currentCloneId) {
      setSelections(profiles[activeModel].standardSelections);
    }
  }, [isLoaded, activeModel, isStandardBuild, profiles, currentEditId, currentCloneId]);

  const handleStandardToggle = (checked: boolean) => {
    setIsStandardBuild(checked);
    if (checked && isLoaded) {
      setSelections(profiles[activeModel].standardSelections);
    } else {
      setSelections({}); 
    }
  };

  const handleModelSelect = (model: BaseModels) => {
    setActiveModel(model);
  };

  const currentEstimate = useMemo(() => {
    if (!isLoaded) return 0;
    const profile = profiles[activeModel];
    let total = profile.basePrice;
    
    Object.entries(selections).forEach(([key, val]) => {
      const fieldDef = profile.specGroups.flatMap(s => s.fields).find(f => f.name === key);
      if (fieldDef) {
        if (fieldDef.id.includes("extra") || fieldDef.id === "art-work" || fieldDef.id === "audio-video" || fieldDef.id === "decorative-lights" || fieldDef.id === "stickers") {
           if (val === "Yes" && profile.extrasPricing[fieldDef.id]) {
             total += profile.extrasPricing[fieldDef.id];
           }
        }
      }
    });
    return total;
  }, [activeModel, selections, profiles, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const activeProfile = profiles[activeModel];
  const SPEC_CONFIGURATOR = activeProfile.specGroups;

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

  const handlePushToLiveFloor = () => {
    const jobData = {
      customerName: basicInfo.customerName || "New Customer",
      jobNo: basicInfo.jobNo || getNextJobNumber(),
      chassisNo: basicInfo.chassisNo || "",
      engineNo: basicInfo.engineNo || "",
      mobileNo: basicInfo.mobileNo,
      model: activeModel,
      startDate: basicInfo.date,
      selections: { ...selections },
      totalEstimate: currentEstimate
    };

    if (currentEditId) {
      // Fix mistakes in original record — stay in Vault
      updateJob(currentEditId, jobData);
      router.push("/vault");
    } else {
      // Clone or New Job — push to Vault so user sees the new entry
      addJob({
        id: `job-${Date.now()}`,
        ...jobData,
        stage: "Chassis Arrival",
        status: "active"
      } as any);
      router.push("/vault");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] text-[#333333] -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Action Bar */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 print:hidden">
          <h1 className="text-3xl font-semibold tracking-tight text-[#333333]">New Configurator</h1>
          <div className="flex gap-4 items-center">
            
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
            
            <div className="flex gap-3">
              <button 
                onClick={handlePushToLiveFloor}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg uppercase tracking-wide",
                  currentEditId
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
                    : currentCloneId 
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" 
                    : "bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20"
                )}
              >
                {currentEditId ? "Update Changes" : 
                 currentCloneId ? "Save as New Job" : 
                 "Save & Move to Live Floor"}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm font-medium transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Spec</span>
              </button>
            </div>
          </div>
        </div>

        {/* -- PRINT ONLY SPEC SHEET -- */}
        <div className="print-page-container hidden print:block text-black font-sans leading-relaxed absolute top-0 left-0 z-[999]">
           <div className="text-center w-full block mb-8">
             <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-1 text-slate-900">Durga Industries</h1>
             <p className="text-base font-bold uppercase tracking-widest text-slate-800">Specifications for Body Building</p>
             <p className="text-xs text-gray-700 mt-1 max-w-lg mx-auto">SF.NO. 1994/2 Madurai New Bye Pass Road Near Periyar Arch, Karur - 639008</p>
           </div>
             
           <div className="flex justify-between gap-12 text-sm border-b-2 border-black pb-8 mb-8">
             <div className="flex flex-col gap-5 w-1/2">
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Customer Name:</strong> 
                 <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.customerName}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Mobile No:</strong> 
                 <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.mobileNo}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Date:</strong> 
                 <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.date}</div>
               </div>
             </div>
             <div className="flex flex-col gap-5 w-1/2">
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Job No:</strong> 
                 <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.jobNo}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Chassis No:</strong> 
                 <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.chassisNo}</div>
               </div>
               <div className="flex w-full items-end">
                 <strong className="shrink-0 mr-3">Engine No:</strong> 
                 <div className="border-b border-black flex-grow font-bold px-2">{basicInfo.engineNo}</div>
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

          {/* RIGHT PANEL: Basic Info & Accordion Steps */}
          <div className="lg:col-span-8 flex flex-col gap-8 print:hidden">
            
            {/* New Basic Information Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="bg-teal-50 p-2 rounded-lg">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Row 1 */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Customer Name
                  </label>
                  <input 
                    type="text"
                    value={basicInfo.customerName}
                    onChange={(e) => setBasicInfo({...basicInfo, customerName: e.target.value})}
                    placeholder="Enter Customer Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Job No
                  </label>
                  <input 
                    type="text"
                    value={basicInfo.jobNo}
                    onChange={(e) => setBasicInfo({...basicInfo, jobNo: e.target.value})}
                    placeholder="DVN-XXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Mobile Number
                  </label>
                  <input 
                    type="text"
                    value={basicInfo.mobileNo}
                    onChange={(e) => setBasicInfo({...basicInfo, mobileNo: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-3 h-3" /> Chassis Number
                  </label>
                  <input 
                    type="text"
                    value={basicInfo.chassisNo}
                    onChange={(e) => setBasicInfo({...basicInfo, chassisNo: e.target.value})}
                    placeholder="Enter Chassis No."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>

                {/* Row 3 */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input 
                    type="date"
                    value={basicInfo.date}
                    onChange={(e) => setBasicInfo({...basicInfo, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" /> Engine Number
                  </label>
                  <input 
                    type="text"
                    value={basicInfo.engineNo}
                    onChange={(e) => setBasicInfo({...basicInfo, engineNo: e.target.value})}
                    placeholder="Enter Engine No."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
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
                              const hasExtraPrice = activeProfile.extrasPricing[field.id];
                              
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
                                  
                                  {hasExtraPrice && opt === "Yes" && (
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
    </div>
  );
}

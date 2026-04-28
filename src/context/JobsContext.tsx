"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { JobCard, ProductionStage, MOCK_JOBS } from "@/data/mockKanbanData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface JobsContextType {
  jobs: JobCard[];
  isLoaded: boolean;
  addJob: (job: JobCard) => void;
  updateJob: (id: string, updates: Partial<JobCard>) => void;
  archiveJob: (id: string) => void;
  deliverJob: (id: string) => void;
  deleteJobPermanently: (id: string) => void;
  moveJob: (id: string, newStage: ProductionStage) => void;
  getNextJobNumber: () => string;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "dvn-live-floor-jobs";

function saveToLocal(jobs: JobCard[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // storage quota exceeded — ignore
  }
}

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadJobs() {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from("jobs").select("*");
        if (!error && data) {
          const loaded = data as JobCard[];
          setJobs(loaded);
          saveToLocal(loaded);
          setIsLoaded(true);
          return;
        }
        // Supabase failed — fall through to localStorage
      }

      // Offline / unconfigured fallback
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed: JobCard[] = JSON.parse(saved).map((j: Record<string, any>) => ({
            ...j,
            status: j.status || "active",
          }));
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setJobs(parsed);
        } catch {
          setJobs(MOCK_JOBS);
        }
      } else {
        setJobs(MOCK_JOBS);
      }
      setIsLoaded(true);
    }

    loadJobs();
  }, []);

  const addJob = async (job: JobCard) => {
    const newJob = { ...job, status: job.status || "active" };
    setJobs((prev) => {
      const updated = [...prev, newJob];
      saveToLocal(updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("jobs").insert(newJob);
      if (error) console.error("[Jobs] Supabase insert failed:", error.message);
    }
  };

  const updateJob = async (id: string, updates: Partial<JobCard>) => {
    setJobs((prev) => {
      const updated = prev.map((job) => (job.id === id ? { ...job, ...updates } : job));
      saveToLocal(updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      await supabase.from("jobs").update(updates).eq("id", id);
    }
  };

  const archiveJob = (id: string) => {
    updateJob(id, { status: "archived" });
  };

  const deliverJob = (id: string) => {
    updateJob(id, { status: "delivered", deliveredDate: new Date().toISOString().split("T")[0] });
  };

  const deleteJobPermanently = async (id: string) => {
    setJobs((prev) => {
      const updated = prev.filter((job) => job.id !== id);
      saveToLocal(updated);
      return updated;
    });
    if (isSupabaseConfigured) {
      await supabase.from("jobs").delete().eq("id", id);
    }
  };

  const moveJob = (id: string, newStage: ProductionStage) => {
    updateJob(id, { stage: newStage });
  };

  const getNextJobNumber = () => "";

  return (
    <JobsContext.Provider
      value={{ jobs, isLoaded, addJob, updateJob, archiveJob, deliverJob, deleteJobPermanently, moveJob, getNextJobNumber }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
}

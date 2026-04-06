"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { JobCard, ProductionStage, MOCK_JOBS } from "@/data/mockKanbanData";

interface JobsContextType {
  jobs: JobCard[];
  isLoaded: boolean;
  addJob: (job: JobCard) => void;
  updateJob: (id: string, updates: Partial<JobCard>) => void;
  archiveJob: (id: string) => void;
  deleteJobPermanently: (id: string) => void;
  moveJob: (id: string, newStage: ProductionStage) => void;
  getNextJobNumber: () => string;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "dvn-live-floor-jobs";

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load jobs from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        // Migration: Ensure all jobs have a status
        parsed = parsed.map((j: any) => ({
          ...j,
          status: j.status || "active"
        }));
        setJobs(parsed);
      } catch (e) {
        console.error("Failed to parse jobs from localStorage", e);
        setJobs(MOCK_JOBS);
      }
    } else {
      setJobs(MOCK_JOBS);
    }
    setIsLoaded(true);
  }, []);

  // Persist jobs to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobs));
    }
  }, [jobs, isLoaded]);

  const addJob = (job: JobCard) => {
    setJobs((prev) => [...prev, { ...job, status: job.status || "active" }]);
  };

  const updateJob = (id: string, updates: Partial<JobCard>) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  };

  const archiveJob = (id: string) => {
    updateJob(id, { status: "archived" });
  };

  const deleteJobPermanently = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const moveJob = (id: string, newStage: ProductionStage) => {
    updateJob(id, { stage: newStage });
  };

  const getNextJobNumber = () => {
    if (jobs.length === 0) return "DVN-2024-001";
    
    // Extract numbers from jobNo like "DVN-2024-001"
    const jobNumbers = jobs
      .map(j => {
        const match = j.jobNo.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxNum = jobNumbers.length > 0 ? Math.max(...jobNumbers) : 0;
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    
    // Maintain the prefix DVN-2024- or whatever is standard
    const lastJob = jobs[jobs.length - 1];
    const prefixMatch = lastJob.jobNo.match(/^(.*-)/);
    const prefix = prefixMatch ? prefixMatch[1] : "DVN-2024-";
    
    return `${prefix}${nextNum}`;
  };

  return (
    <JobsContext.Provider
      value={{ jobs, isLoaded, addJob, updateJob, archiveJob, deleteJobPermanently, moveJob, getNextJobNumber }}
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

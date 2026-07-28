import { SpecCategoryGroup, BaseModels } from "@/types/adminTypes";
import { JobCard } from "@/data/mockKanbanData";

export function filterValidSelections(
  selections: Record<string, string[] | string> | undefined,
  specGroups: SpecCategoryGroup[]
): Record<string, string[]> {
  if (!selections) return {};
  const validOptions = new Map<string, Set<string>>();
  for (const f of specGroups.flatMap(g => g.fields)) {
    if (!validOptions.has(f.name)) validOptions.set(f.name, new Set(f.options));
  }
  const result: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(selections)) {
    const allowed = validOptions.get(key);
    if (!allowed) continue;
    const vals = (Array.isArray(val) ? val : [val]).filter(v => allowed.has(v));
    if (vals.length > 0) result[key] = vals;
  }
  return result;
}

export function migrateFieldRename(
  jobs: JobCard[],
  updateJob: (id: string, updates: Partial<JobCard>) => void,
  model: BaseModels,
  oldName: string,
  newName: string
) {
  if (oldName === newName) return;
  jobs.forEach(job => {
    if (job.model === model && job.selections && oldName in job.selections) {
      const { [oldName]: val, ...rest } = job.selections;
      updateJob(job.id, { selections: { ...rest, [newName]: val } });
    }
  });
}

export function migrateOptionRename(
  jobs: JobCard[],
  updateJob: (id: string, updates: Partial<JobCard>) => void,
  model: BaseModels,
  fieldName: string,
  oldOpt: string,
  newOpt: string
) {
  if (oldOpt === newOpt) return;
  jobs.forEach(job => {
    const vals = job.selections?.[fieldName];
    if (job.model === model && vals?.includes(oldOpt)) {
      updateJob(job.id, {
        selections: { ...job.selections, [fieldName]: vals.map(v => (v === oldOpt ? newOpt : v)) }
      });
    }
  });
}

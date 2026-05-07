export type TimeUnit = 'sprint' | 'week' | 'month';

export interface PlannerSettings {
  timeUnit: TimeUnit;
  sprintDays: number;
  startDate: string; // ISO date YYYY-MM-DD
}

export interface SkillSet {
  id: string;
  name: string;
  fte: number; // 1–100 percent
}

export interface Task {
  id: string;
  workPackage: string;
  name: string;
  project: string;
  workload: Record<string, number>; // skillSetId -> planning units
}

export interface Project {
  id: string;
  name: string;
  skillSets: SkillSet[];
  tasks: Task[];
}

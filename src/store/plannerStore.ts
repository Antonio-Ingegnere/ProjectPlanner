import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, SkillSet, Task, PlannerSettings } from '@/types';
import { mockProjects } from '@/mock/data';

const DEFAULT_SETTINGS: PlannerSettings = { timeUnit: 'sprint', sprintDays: 10, startDate: '' };

interface PlannerState {
  projects: Project[];
  selectedProjectId: string | null;
  settings: PlannerSettings;
  wpOrders: Record<string, string[]>; // projectId → ordered WP names
  updateSettings: (updates: Partial<PlannerSettings>) => void;

  selectProject: (id: string | null) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateWorkload: (taskId: string, skillSetId: string, value: number) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;

  renameWorkPackage: (projectId: string, oldName: string, newName: string) => void;
  // Move a task to newWP, inserting before beforeId (null = append after last task of newWP)
  moveTask: (projectId: string, taskId: string, newWP: string, beforeId: string | null) => void;
  setProjectWPOrder: (projectId: string, order: string[]) => void;

  addSkillSet: (projectId: string, skillSet: SkillSet) => void;
  renameSkillSet: (projectId: string, skillSetId: string, name: string) => void;
  updateSkillSetFTE: (projectId: string, skillSetId: string, fte: number) => void;
  removeSkillSet: (projectId: string, skillSetId: string) => void;
  reorderSkillSets: (projectId: string, orderedIds: string[]) => void;

  resetToMock: () => void;

  selectedProject: () => Project | null;
  visibleTasks: () => Task[];
  visibleSkillSets: () => SkillSet[];
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      projects: mockProjects,
      selectedProjectId: mockProjects[0]?.id ?? null,
      settings: DEFAULT_SETTINGS,
      wpOrders: {},

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      selectProject: (id) => set({ selectedProjectId: id }),

      updateTask: (taskId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) => ({
            ...p,
            tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
          })),
        })),

      updateWorkload: (taskId, skillSetId, value) =>
        set((state) => ({
          projects: state.projects.map((p) => ({
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === taskId
                ? { ...t, workload: { ...t.workload, [skillSetId]: value } }
                : t
            ),
          })),
        })),

      addTask: (task) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === task.project ? { ...p, tasks: [...p.tasks, task] } : p
          ),
        })),

      deleteTask: (taskId) =>
        set((state) => ({
          projects: state.projects.map((p) => ({
            ...p,
            tasks: p.tasks.filter((t) => t.id !== taskId),
          })),
        })),

      renameWorkPackage: (projectId, oldName, newName) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId ? p : {
              ...p,
              tasks: p.tasks.map((t) =>
                t.workPackage === oldName ? { ...t, workPackage: newName } : t
              ),
            }
          ),
        })),

      moveTask: (projectId, taskId, newWP, beforeId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const moving = p.tasks.find((t) => t.id === taskId);
            if (!moving) return p;
            const updated = { ...moving, workPackage: newWP };
            const tasks = p.tasks.filter((t) => t.id !== taskId);
            if (beforeId === null) {
              // Append after the last task of newWP in the array
              const lastIdx = tasks.reduce((acc, t, i) => (t.workPackage === newWP ? i : acc), -1);
              tasks.splice(lastIdx + 1, 0, updated);
            } else {
              const insertIdx = tasks.findIndex((t) => t.id === beforeId);
              tasks.splice(insertIdx === -1 ? tasks.length : insertIdx, 0, updated);
            }
            return { ...p, tasks };
          }),
        })),

      setProjectWPOrder: (projectId, order) =>
        set((state) => ({ wpOrders: { ...state.wpOrders, [projectId]: order } })),

      addSkillSet: (projectId, skillSet) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, skillSets: [...(p.skillSets ?? []), skillSet] }
              : p
          ),
        })),

      renameSkillSet: (projectId, skillSetId, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, skillSets: (p.skillSets ?? []).map((s) => s.id === skillSetId ? { ...s, name } : s) }
              : p
          ),
        })),

      updateSkillSetFTE: (projectId, skillSetId, fte) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, skillSets: (p.skillSets ?? []).map((s) => s.id === skillSetId ? { ...s, fte } : s) }
              : p
          ),
        })),

      removeSkillSet: (projectId, skillSetId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, skillSets: (p.skillSets ?? []).filter((s) => s.id !== skillSetId) }
              : p
          ),
        })),

      reorderSkillSets: (projectId, orderedIds) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const map = new Map((p.skillSets ?? []).map((s) => [s.id, s]));
            return { ...p, skillSets: orderedIds.map((id) => map.get(id)!).filter(Boolean) };
          }),
        })),

      resetToMock: () =>
        set({ projects: mockProjects, selectedProjectId: mockProjects[0]?.id ?? null }),

      selectedProject: () => {
        const { projects, selectedProjectId } = get();
        return projects.find((p) => p.id === selectedProjectId) ?? null;
      },

      visibleTasks: () => {
        const { projects, selectedProjectId } = get();
        return projects.find((p) => p.id === selectedProjectId)?.tasks ?? [];
      },

      visibleSkillSets: () => {
        const { projects, selectedProjectId } = get();
        return projects.find((p) => p.id === selectedProjectId)?.skillSets ?? [];
      },
    }),
    {
      name: 'planner-storage',
      version: 3,
      migrate: (stored) => {
        const state = stored as { projects: Project[]; selectedProjectId: string | null; settings?: PlannerSettings; wpOrders?: Record<string, string[]> };
        state.projects = state.projects.map((p) => ({
          ...p,
          skillSets: (p.skillSets ?? []).map((s) => ({ fte: 100, ...s })),
          tasks: p.tasks.map((t) => ({ ...t, workload: (t as Task & { workload?: Record<string, number> }).workload ?? {} })),
        }));
        state.settings = state.settings ?? DEFAULT_SETTINGS;
        state.wpOrders = state.wpOrders ?? {};
        if (!state.selectedProjectId || !state.projects.find((p) => p.id === state.selectedProjectId)) {
          state.selectedProjectId = state.projects[0]?.id ?? null;
        }
        return state;
      },

      partialize: (state) => ({
        projects: state.projects,
        selectedProjectId: state.selectedProjectId,
        settings: state.settings,
        wpOrders: state.wpOrders,
      }),
    }
  )
);

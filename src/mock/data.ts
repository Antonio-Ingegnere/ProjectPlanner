import type { Project } from '@/types';

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    skillSets: [
      { id: 'ss-1', name: 'Design', fte: 100 },
      { id: 'ss-2', name: 'Frontend', fte: 100 },
      { id: 'ss-3', name: 'Backend', fte: 100 },
    ],
    tasks: [
      // Discovery
      { id: 'task-1',  workPackage: 'Discovery',   name: 'Stakeholder Interviews',  project: 'proj-1', workload: { 'ss-1': 1 } },
      { id: 'task-2',  workPackage: 'Discovery',   name: 'Tech Stack Audit',         project: 'proj-1', workload: { 'ss-2': 1, 'ss-3': 1 } },
      // Design
      { id: 'task-3',  workPackage: 'Design',      name: 'Wireframes',               project: 'proj-1', workload: { 'ss-1': 2, 'ss-2': 1 } },
      { id: 'task-4',  workPackage: 'Design',      name: 'Visual Design',            project: 'proj-1', workload: { 'ss-1': 3 } },
      { id: 'task-5',  workPackage: 'Design',      name: 'Design System',            project: 'proj-1', workload: { 'ss-1': 2, 'ss-2': 1 } },
      // Development
      { id: 'task-6',  workPackage: 'Development', name: 'Frontend Components',      project: 'proj-1', workload: { 'ss-2': 4 } },
      { id: 'task-7',  workPackage: 'Development', name: 'API Integration',          project: 'proj-1', workload: { 'ss-2': 2, 'ss-3': 3 } },
      { id: 'task-8',  workPackage: 'Development', name: 'CMS Setup',                project: 'proj-1', workload: { 'ss-3': 2 } },
      // QA
      { id: 'task-9',  workPackage: 'QA',          name: 'Functional Testing',       project: 'proj-1', workload: { 'ss-2': 1, 'ss-3': 1 } },
      { id: 'task-10', workPackage: 'QA',          name: 'Cross-browser Testing',    project: 'proj-1', workload: { 'ss-2': 1 } },
      // Launch
      { id: 'task-11', workPackage: 'Launch',      name: 'Deploy & Go Live',         project: 'proj-1', workload: { 'ss-2': 1, 'ss-3': 1 } },
    ],
  },
  {
    id: 'proj-2',
    name: 'Mobile App v2',
    skillSets: [
      { id: 'ss-4', name: 'iOS', fte: 100 },
      { id: 'ss-5', name: 'Android', fte: 100 },
      { id: 'ss-6', name: 'QA', fte: 100 },
    ],
    tasks: [
      // Discovery
      { id: 'task-12', workPackage: 'Discovery',   name: 'User Research',            project: 'proj-2', workload: { 'ss-4': 1, 'ss-5': 1 } },
      { id: 'task-13', workPackage: 'Discovery',   name: 'Technical Feasibility',    project: 'proj-2', workload: { 'ss-4': 1, 'ss-5': 1 } },
      // Development
      { id: 'task-14', workPackage: 'Development', name: 'Core Features — iOS',      project: 'proj-2', workload: { 'ss-4': 4 } },
      { id: 'task-15', workPackage: 'Development', name: 'Core Features — Android',  project: 'proj-2', workload: { 'ss-5': 4 } },
      { id: 'task-16', workPackage: 'Development', name: 'Push Notifications',       project: 'proj-2', workload: { 'ss-4': 1, 'ss-5': 1 } },
      // Testing
      { id: 'task-17', workPackage: 'Testing',     name: 'Unit & Integration Tests', project: 'proj-2', workload: { 'ss-6': 2 } },
      { id: 'task-18', workPackage: 'Testing',     name: 'Beta Program',             project: 'proj-2', workload: { 'ss-4': 1, 'ss-5': 1, 'ss-6': 2 } },
      // Release
      { id: 'task-19', workPackage: 'Release',     name: 'App Store Submission',     project: 'proj-2', workload: { 'ss-4': 1, 'ss-5': 1 } },
    ],
  },
];

export const getAllTasks = () => mockProjects.flatMap((p) => p.tasks);

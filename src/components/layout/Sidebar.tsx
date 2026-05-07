import { LayoutGrid, GanttChartSquare, BarChart3, Settings, RotateCcw } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';
import type { Project } from '@/types';

type View = 'grid' | 'gantt' | 'dashboard' | 'settings';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'grid', label: 'WBS', icon: <LayoutGrid size={18} /> },
  { view: 'gantt', label: 'Resource Planning', icon: <GanttChartSquare size={18} /> },
  { view: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
  { view: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { projects, selectedProjectId, selectProject, resetToMock } = usePlannerStore();

  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-gray-100 flex flex-col h-screen">
      <div className="px-4 py-5 border-b border-gray-700">
        <h1 className="text-lg font-semibold tracking-tight">Planner</h1>
      </div>

      {/* Navigation */}
      <nav className="px-2 pt-4">
        <p className="px-2 mb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Views</p>
        {navItems.map(({ view, label, icon }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors
              ${activeView === view
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {/* Projects */}
      <div className="px-2 pt-5 flex-1 overflow-y-auto">
        <p className="px-2 mb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</p>
        {projects.map((project: Project) => (
          <button
            key={project.id}
            onClick={() => selectProject(project.id)}
            className={`w-full flex items-start flex-col px-3 py-2 rounded-md text-sm mb-0.5 transition-colors
              ${selectedProjectId === project.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <span className="truncate w-full text-left">{project.name}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-700">
        <button
          onClick={() => {
            if (confirm('Reset all data to mock? This cannot be undone.')) resetToMock();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <RotateCcw size={13} />
          Reset to mock data
        </button>
      </div>
    </aside>
  );
}

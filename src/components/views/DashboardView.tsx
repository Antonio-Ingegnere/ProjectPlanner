import { usePlannerStore } from '@/store/plannerStore';

export function DashboardView() {
  const { visibleTasks } = usePlannerStore();
  const tasks = visibleTasks();

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50">
      <div className="px-6 py-4 border-b bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Overview</p>
      </div>
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 inline-block">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-3xl font-semibold text-gray-800">{tasks.length}</p>
        </div>
      </div>
    </div>
  );
}

import { usePlannerStore } from '@/store/plannerStore';
import type { TimeUnit } from '@/types';

const TIME_UNITS: { value: TimeUnit; label: string; description: string }[] = [
  { value: 'sprint', label: 'Sprint', description: 'Fixed-length iterations (e.g. Scrum sprints)' },
  { value: 'week',   label: 'Week',   description: '7-day calendar weeks' },
  { value: 'month',  label: 'Month',  description: 'Calendar months' },
];

export function SettingsView() {
  const { settings, updateSettings } = usePlannerStore();

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b bg-white shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure planning preferences</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Planning Time Unit
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Choose the unit used for workload columns in WBS and Resource Planning.
            </p>

            <div className="space-y-3">
              {TIME_UNITS.map(({ value, label, description }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    settings.timeUnit === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeUnit"
                    value={value}
                    checked={settings.timeUnit === value}
                    onChange={() => updateSettings({ timeUnit: value })}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                  </div>
                </label>
              ))}
            </div>

            {settings.timeUnit === 'sprint' && (
              <div className="mt-5 pt-5 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint duration
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={settings.sprintDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= 90) {
                        updateSettings({ sprintDays: val });
                      }
                    }}
                    className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500">days per sprint</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Default is 10 days (2 work weeks). Allowed range: 1–90 days.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border p-6 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Planning Start Date
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              The date from which Sprint 1 (or Week 1 / Month 1) begins. If left empty, the earliest task date is used.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={settings.startDate}
                onChange={(e) => updateSettings({ startDate: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {settings.startDate && (
                <button
                  onClick={() => updateSettings({ startDate: '' })}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

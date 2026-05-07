import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GridView } from '@/components/views/GridView';
import { GanttView } from '@/components/views/GanttView';
import { DashboardView } from '@/components/views/DashboardView';
import { SettingsView } from '@/components/views/SettingsView';

type View = 'grid' | 'gantt' | 'dashboard' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<View>('grid');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'grid' && <GridView />}
        {activeView === 'gantt' && <GanttView />}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default App;

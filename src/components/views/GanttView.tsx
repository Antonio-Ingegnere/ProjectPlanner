import { useMemo, useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';
import type { SkillSet } from '@/types';

const UNIT_PX = 80;   // pixels per sprint/week/month
const LEFT_W = 160;
const ROW_H = 48;
const WP_HEADER_H = 30;
const UNIT_HEADER_H = 30;
const TOTAL_HEADER_H = WP_HEADER_H + UNIT_HEADER_H;

const WP_BG = ['#eff6ff', '#f5f3ff', '#f0fdf4', '#fffbeb', '#fff1f2'];
const WP_BORDER = ['#bfdbfe', '#ddd6fe', '#bbf7d0', '#fde68a', '#fecdd3'];
const BAR_COLOR = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#f43f5e'];

export function GanttView() {
  const { visibleTasks, visibleSkillSets, selectedProjectId, reorderSkillSets, settings, wpOrders } = usePlannerStore();
  const { timeUnit, sprintDays } = settings;

  const [orderedSkillSets, setOrderedSkillSets] = useState<SkillSet[]>([]);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const allTasks = visibleTasks().filter((t) => t.name);
  const skillSets = visibleSkillSets();

  useEffect(() => {
    setOrderedSkillSets(skillSets);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillSets.map((s) => s.id).join(',')]);

  const handleDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragEnd = () => { dragIndexRef.current = null; setDragOverIndex(null); };
  const handleDrop = (toIndex: number) => {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === toIndex) { setDragOverIndex(null); return; }
    const reordered = [...orderedSkillSets];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setOrderedSkillSets(reordered);
    if (selectedProjectId) reorderSkillSets(selectedProjectId, reordered.map((s) => s.id));
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const unitName = timeUnit === 'sprint' ? `Sprint` : timeUnit === 'week' ? 'Week' : 'Month';
  const unitAbbr = timeUnit === 'sprint' ? 'sp' : timeUnit === 'week' ? 'wk' : 'mo';
  const unitDetail = timeUnit === 'sprint' ? ` · ${sprintDays} days` : '';

  // Ordered unique work packages — respects manual order set in WBS tab
  const storedWPOrder = wpOrders[selectedProjectId ?? ''] ?? null;
  const workPackages = useMemo(() => {
    const seen = new Set<string>();
    const taskOrder: string[] = [];
    for (const task of allTasks) {
      if (task.workPackage && !seen.has(task.workPackage)) {
        seen.add(task.workPackage);
        taskOrder.push(task.workPackage);
      }
    }
    if (!storedWPOrder || storedWPOrder.length === 0) return taskOrder;
    // Apply stored order; append any new WPs not yet in it
    const result = storedWPOrder.filter((wp) => taskOrder.includes(wp));
    for (const wp of taskOrder) {
      if (!result.includes(wp)) result.push(wp);
    }
    return result;
  }, [allTasks, storedWPOrder]);

  // matrix[wp][skillId] = total workload for that skill in that WP
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const wp of workPackages) {
      m[wp] = {};
      for (const ss of orderedSkillSets) {
        m[wp][ss.id] = allTasks
          .filter((t) => t.workPackage === wp)
          .reduce((sum, t) => sum + (t.workload?.[ss.id] ?? 0), 0);
      }
    }
    return m;
  }, [allTasks, orderedSkillSets, workPackages]);

  // Each WP block: duration = max skill load in that WP, placed sequentially
  const wpBlocks = useMemo(() => {
    let cursor = 0;
    return workPackages.map((wp, i) => {
      const skillLoads = orderedSkillSets.map((ss) => matrix[wp]?.[ss.id] ?? 0);
      const duration = Math.max(1, ...skillLoads);
      const block = { wp, duration, startUnit: cursor, index: i };
      cursor += duration;
      return block;
    });
  }, [workPackages, matrix, orderedSkillSets]);

  const totalUnits = wpBlocks.reduce((sum, b) => sum + b.duration, 0);
  const totalWidth = totalUnits * UNIT_PX;

  const isEmpty = skillSets.length === 0 || workPackages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Resource Planning</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Unit: <span className="font-medium text-gray-700">{unitName}{unitDetail}</span>
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          {skillSets.length === 0
            ? 'No skill sets defined — add skill sets in the WBS tab first.'
            : 'No work packages defined — assign work packages to tasks in the WBS tab.'}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">

          {/* ── Double-row sticky header ── */}
          <div
            className="sticky top-0 z-20 bg-white border-b"
            style={{ minWidth: LEFT_W + totalWidth }}
          >
            {/* Row 1: Work package names */}
            <div className="flex" style={{ height: WP_HEADER_H }}>
              <div
                className="sticky left-0 z-30 bg-white border-r border-b shrink-0"
                style={{ width: LEFT_W }}
              />
              {wpBlocks.map((block, i) => (
                <div
                  key={block.wp}
                  className="border-r border-b flex items-center px-2 gap-1.5 shrink-0 overflow-hidden"
                  style={{
                    width: block.duration * UNIT_PX,
                    backgroundColor: WP_BG[i % WP_BG.length],
                    borderLeftColor: WP_BORDER[i % WP_BORDER.length],
                    borderLeftWidth: 2,
                  }}
                >
                  <span className="text-xs text-gray-400 font-medium shrink-0">WP {i + 1}</span>
                  <span className="text-xs font-semibold text-gray-700 truncate">{block.wp}</span>
                  <span className="text-xs text-gray-400 shrink-0 ml-auto">{block.duration}{unitAbbr}</span>
                </div>
              ))}
            </div>

            {/* Row 2: Sequential unit numbers */}
            <div className="flex" style={{ height: UNIT_HEADER_H }}>
              <div
                className="sticky left-0 z-30 bg-white border-r shrink-0"
                style={{ width: LEFT_W }}
              />
              {wpBlocks.map((block, i) =>
                Array.from({ length: block.duration }, (_, u) => (
                  <div
                    key={`${block.wp}-${u}`}
                    className="border-r shrink-0 flex items-center px-2"
                    style={{
                      width: UNIT_PX,
                      backgroundColor: WP_BG[i % WP_BG.length],
                    }}
                  >
                    <span className="text-xs text-gray-500 font-medium">
                      {unitName} {block.startUnit + u + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Skill rows ── */}
          {orderedSkillSets.map((ss, index) => {
            const isDragOver = dragOverIndex === index;
            return (
              <div
                key={ss.id}
                className={`flex border-b transition-colors ${isDragOver ? 'bg-blue-50' : ''}`}
                style={{ minWidth: LEFT_W + totalWidth, height: ROW_H }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                {/* Sticky skill label */}
                <div
                  className={`sticky left-0 z-10 border-r shrink-0 flex items-center gap-1 px-2 text-sm font-medium text-gray-700 transition-colors ${isDragOver ? 'bg-blue-50' : 'bg-gray-50'}`}
                  style={{ width: LEFT_W }}
                >
                  <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" />
                  <span className="truncate">{ss.name}</span>
                </div>

                {/* Timeline area */}
                <div className="relative" style={{ width: totalWidth, height: ROW_H }}>
                  {/* WP background bands + unit grid lines */}
                  {wpBlocks.map((block, i) => (
                    <div
                      key={block.wp}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: block.startUnit * UNIT_PX,
                        width: block.duration * UNIT_PX,
                        backgroundColor: WP_BG[i % WP_BG.length],
                        borderLeft: `2px solid ${WP_BORDER[i % WP_BORDER.length]}`,
                      }}
                    >
                      {/* Unit dividers */}
                      {Array.from({ length: block.duration }, (_, u) => (
                        <div
                          key={u}
                          className="absolute top-0 bottom-0 border-r border-gray-200"
                          style={{ left: u * UNIT_PX, width: UNIT_PX }}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Workload bars — one per WP */}
                  {wpBlocks.map((block, i) => {
                    const load = matrix[block.wp]?.[ss.id] ?? 0;
                    if (load === 0) return null;
                    const barWidth = load * UNIT_PX;
                    return (
                      <div
                        key={block.wp}
                        title={`${ss.name} · ${block.wp}: ${load} ${unitAbbr}`}
                        className="absolute rounded-sm flex items-center px-2 overflow-hidden"
                        style={{
                          left: block.startUnit * UNIT_PX + 2,
                          top: 8,
                          width: barWidth - 4,
                          height: ROW_H - 16,
                          backgroundColor: BAR_COLOR[i % BAR_COLOR.length],
                          opacity: 0.85,
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '1')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '0.85')}
                      >
                        <span className="text-xs text-white font-semibold leading-none">
                          {load}<span className="font-normal opacity-80 ml-0.5">{unitAbbr}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';
import type { SkillSet } from '@/types';

const UNIT_PX = 80;   // pixels per sprint/week/month
const LEFT_W = 160;
const SUM_W = 64;
const FTE_W = 72;
const FIXED_W = LEFT_W + SUM_W + FTE_W;
const ROW_H = 48;
const WP_HEADER_H = 30;
const UNIT_HEADER_H = 30;
const TOTAL_HEADER_H = WP_HEADER_H + UNIT_HEADER_H;

const WP_BG = ['#eff6ff', '#f5f3ff', '#f0fdf4', '#fffbeb', '#fff1f2'];
const WP_BORDER = ['#bfdbfe', '#ddd6fe', '#bbf7d0', '#fde68a', '#fecdd3'];

export function GanttView() {
  const { visibleTasks, visibleSkillSets, selectedProjectId, reorderSkillSets, updateSkillSetFTE, settings, wpOrders } = usePlannerStore();
  const { timeUnit, sprintDays } = settings;

  const [orderedSkillSets, setOrderedSkillSets] = useState<SkillSet[]>([]);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const allTasks = visibleTasks().filter((t) => t.name);
  const skillSets = visibleSkillSets();

  useEffect(() => {
    setOrderedSkillSets(skillSets);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillSets.map((s) => `${s.id}:${s.fte}`).join(',')]);

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
            style={{ minWidth: FIXED_W + totalWidth }}
          >
            {/* Row 1: Work package names */}
            <div className="flex" style={{ height: WP_HEADER_H }}>
              <div
                className="sticky left-0 z-30 bg-white border-r border-b shrink-0"
                style={{ width: FIXED_W }}
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
                className="sticky left-0 z-30 bg-white border-r shrink-0 flex"
                style={{ width: FIXED_W }}
              >
                <div style={{ width: LEFT_W }} className="border-r" />
                <div style={{ width: SUM_W }} className="border-r flex items-center justify-end px-2 text-xs text-gray-400 font-medium">Sum</div>
                <div style={{ width: FTE_W }} className="flex items-center justify-end px-2 text-xs text-gray-400 font-medium">FTE %</div>
              </div>
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
            const totalLoad = wpBlocks.reduce((sum, block) => sum + (matrix[block.wp]?.[ss.id] ?? 0), 0);
            const fte = ss.fte ?? 100;
            return (
              <div
                key={ss.id}
                className={`flex border-b transition-colors ${isDragOver ? 'bg-blue-50' : ''}`}
                style={{ minWidth: FIXED_W + totalWidth, height: ROW_H }}
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

                {/* Sum column */}
                <div
                  className={`sticky z-10 border-r shrink-0 flex items-center justify-end px-2 text-sm text-gray-700 tabular-nums transition-colors ${isDragOver ? 'bg-blue-50' : 'bg-gray-50'}`}
                  style={{ left: LEFT_W, width: SUM_W }}
                >
                  {totalLoad > 0 ? <span>{totalLoad}<span className="text-gray-400 text-xs ml-0.5">{unitAbbr}</span></span> : <span className="text-gray-300">—</span>}
                </div>

                {/* FTE % column — editable */}
                <div
                  className={`sticky z-10 border-r shrink-0 flex items-center justify-end px-2 gap-0.5 transition-colors ${isDragOver ? 'bg-blue-50' : 'bg-gray-50'}`}
                  style={{ left: LEFT_W + SUM_W, width: FTE_W }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={fte}
                    onChange={(e) => {
                      const v = Math.min(100, Math.max(1, Number(e.target.value) || 1));
                      if (selectedProjectId) updateSkillSetFTE(selectedProjectId, ss.id, v);
                    }}
                    className="w-10 text-right text-sm font-medium text-gray-700 bg-transparent border-none outline-none tabular-nums"
                  />
                  <span className="text-gray-400 text-xs">%</span>
                </div>

                {/* Timeline area */}
                <div className="relative" style={{ width: totalWidth, height: ROW_H }}>
                  {/* Colored unit cells: green = calendar time needed at given FTE, red = idle */}
                  {wpBlocks.map((block, i) => {
                    const load = matrix[block.wp]?.[ss.id] ?? 0;
                    // How many calendar units this skill occupies at the given FTE
                    const greenCount = load > 0 ? Math.min(Math.ceil(load / (fte / 100)), block.duration) : 0;
                    return Array.from({ length: block.duration }, (_, u) => (
                      <div
                        key={`${block.wp}-${u}`}
                        className="absolute top-0 bottom-0"
                        style={{
                          left: (block.startUnit + u) * UNIT_PX,
                          width: UNIT_PX,
                          backgroundColor: u < greenCount ? (fte < 100 ? '#fef9c3' : '#dcfce7') : '#fee2e2',
                          borderLeft: u === 0
                            ? `2px solid ${WP_BORDER[i % WP_BORDER.length]}`
                            : '1px solid #e5e7eb',
                          borderRight: '1px solid #e5e7eb',
                        }}
                      />
                    ));
                  })}

                  {/* Load label centered over the green (covered) section */}
                  {wpBlocks.map((block) => {
                    const load = matrix[block.wp]?.[ss.id] ?? 0;
                    if (load === 0) return null;
                    const greenCount = Math.min(Math.ceil(load / (fte / 100)), block.duration);
                    return (
                      <div
                        key={block.wp}
                        title={`${ss.name} · ${block.wp}: ${load} ${unitAbbr} @ ${fte}% FTE`}
                        className="absolute flex items-center justify-center pointer-events-none"
                        style={{
                          left: block.startUnit * UNIT_PX,
                          width: greenCount * UNIT_PX,
                          top: 0,
                          height: ROW_H,
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: fte < 100 ? '#854d0e' : '#166534' }}>
                          {load}<span className="font-normal opacity-70 ml-0.5">{unitAbbr}</span>
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

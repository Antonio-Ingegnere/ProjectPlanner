import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef, CellValueChangedEvent, GetRowIdParams, IsFullWidthRowParams, RowDragMoveEvent, RowDragEndEvent } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';
import type { Task } from '@/types';
import { SkillSetHeader } from '@/components/grid/SkillSetHeader';

ModuleRegistry.registerModules([AllCommunityModule]);

// ── Row type discrimination ───────────────────────────────────────────────────

interface WPHeaderRow { _rowType: 'wp-header'; _wp: string }
interface BlankRow    { _rowType: 'blank';     _wp: string }
type GridRow = Task | WPHeaderRow | BlankRow;

const isWPHeader = (r: GridRow): r is WPHeaderRow => (r as WPHeaderRow)._rowType === 'wp-header';
const isBlank    = (r: GridRow): r is BlankRow    => (r as BlankRow)._rowType    === 'blank';
const isTask     = (r: GridRow): r is Task        => !isWPHeader(r) && !isBlank(r);

// ── WP header full-width renderer ─────────────────────────────────────────────

interface GridContext {
  collapsedWPs: Set<string>;
  toggleWP: (wp: string) => void;
  renamingWP: string | null;
  startRenaming: (wp: string) => void;
  commitRename: (oldWP: string, newName: string) => void;
  cancelRename: () => void;
  draggingWP: string | null;
  dragOverWP: string | null;
  onWPDragStart: (wp: string) => void;
  onWPDragOver: (wp: string) => void;
  onWPDrop: (wp: string) => void;
  onWPDragEnd: () => void;
  taskDragOverWP: string | null;
}

function WPFullWidthRenderer({ data, context }: { data: WPHeaderRow; context: GridContext }) {
  const {
    collapsedWPs, toggleWP, renamingWP, startRenaming, commitRename, cancelRename,
    draggingWP, dragOverWP, onWPDragStart, onWPDragOver, onWPDrop, onWPDragEnd, taskDragOverWP,
  } = context;
  const isCollapsed    = collapsedWPs.has(data._wp);
  const isRenaming     = renamingWP === data._wp;
  const isDragging     = draggingWP === data._wp;
  const isDragOver     = dragOverWP === data._wp && draggingWP !== data._wp;
  const isTaskDragOver = taskDragOverWP === data._wp;
  const inputRef    = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(data._wp);

  useEffect(() => {
    if (isRenaming) { setDraft(data._wp); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [isRenaming, data._wp]);

  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', height: '100%',
    padding: '0 12px',
    background: isTaskDragOver ? '#dbeafe' : '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    borderTop: isDragOver ? '2px solid #3b82f6' : '2px solid transparent',
    gap: 8,
    opacity: isDragging ? 0.4 : 1,
    transition: 'opacity 0.1s, background 0.15s',
  };

  if (isRenaming) {
    return (
      <div style={base}>
        <GripVertical size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename(data._wp, draft.trim()); }
            if (e.key === 'Escape') cancelRename();
          }}
          style={{ fontSize: 13, fontWeight: 600, border: '1px solid #3b82f6', borderRadius: 4, padding: '2px 6px', outline: 'none', width: 220 }}
        />
        <button onClick={() => commitRename(data._wp, draft.trim())} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
        <button onClick={cancelRename} style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
      </div>
    );
  }

  return (
    <div
      style={{ ...base, userSelect: 'none' }}
      draggable
      onMouseDown={(e) => e.stopPropagation()}
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('wp-drag', data._wp); onWPDragStart(data._wp); }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('wp-drag')) return;
        e.preventDefault(); e.stopPropagation();
        onWPDragOver(data._wp);
      }}
      onDrop={(e) => {
        const src = e.dataTransfer.getData('wp-drag');
        if (!src) return;
        e.preventDefault(); e.stopPropagation();
        onWPDrop(data._wp);
      }}
      onDragEnd={() => onWPDragEnd()}
    >
      <GripVertical
        size={14}
        style={{ color: '#94a3b8', flexShrink: 0, cursor: 'grab' }}
      />
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flex: 1 }} onClick={() => toggleWP(data._wp)}>
        {isCollapsed
          ? <ChevronRight size={14} style={{ color: '#64748b', flexShrink: 0 }} />
          : <ChevronDown  size={14} style={{ color: '#64748b', flexShrink: 0 }} />}
        <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{data._wp || '(No Work Package)'}</span>
      </div>
      <button
        title="Rename work package"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94a3b8')}
        onClick={(e) => { e.stopPropagation(); startRenaming(data._wp); }}
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTask(projectId: string, workPackage: string, name: string): Task {
  return { id: `task-${Date.now()}`, workPackage, name, project: projectId, workload: {} };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GridView() {
  const {
    visibleTasks, visibleSkillSets, projects, selectedProjectId,
    updateTask, updateWorkload, addTask, addSkillSet, renameWorkPackage, moveTask, setProjectWPOrder, wpOrders, settings,
  } = usePlannerStore();

  const unitLabel = settings.timeUnit === 'sprint'
    ? `Sprint (${settings.sprintDays}d)`
    : settings.timeUnit === 'week' ? 'Week' : 'Month';

  // Only named tasks with a WP live in the grid; blank rows are virtual
  const rawTasks = useMemo(
    () => visibleTasks().filter((t) => t.name && t.workPackage),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, selectedProjectId],
  );
  const skillSets = visibleSkillSets();

  const newSkillSetIdRef    = useRef<string | null>(null);
  const gridContainerRef    = useRef<HTMLDivElement>(null);
  const rawTasksRef         = useRef(rawTasks);
  rawTasksRef.current       = rawTasks;
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number; task: Task } | null>(null);
  const [collapsedWPs, setCollapsedWPs] = useState<Set<string>>(new Set());
  const [newWPName, setNewWPName]       = useState('');
  const [isAddingWP, setIsAddingWP]     = useState(false);
  const newWPInputRef                   = useRef<HTMLInputElement>(null);
  const [renamingWP, setRenamingWP]     = useState<string | null>(null);
  // Extra WPs created via "+ New WP" that may have no tasks yet
  const [extraWPs, setExtraWPs]         = useState<string[]>([]);
  const [draggingWP, setDraggingWP]     = useState<string | null>(null);
  const [dragOverWP, setDragOverWP]     = useState<string | null>(null);
  const [taskDragOverWP, setTaskDragOverWP] = useState<string | null>(null);

  const wpOrderManual = wpOrders[selectedProjectId ?? ''] ?? null;

  const toggleWP = useCallback((wp: string) => {
    setCollapsedWPs((prev) => {
      const next = new Set(prev);
      next.has(wp) ? next.delete(wp) : next.add(wp);
      return next;
    });
  }, []);

  // WP order: task-derived first appearance, then extraWPs; manual order overrides when set
  const wpOrder = useMemo(() => {
    const seen   = new Set<string>();
    const taskOrder: string[] = [];
    for (const t of rawTasks) {
      if (t.workPackage && !seen.has(t.workPackage)) {
        seen.add(t.workPackage);
        taskOrder.push(t.workPackage);
      }
    }
    for (const wp of extraWPs) {
      if (!seen.has(wp)) { seen.add(wp); taskOrder.push(wp); }
    }
    if (!wpOrderManual) return taskOrder;
    // Apply manual order: keep only known WPs in user's order, append any new ones
    const result = wpOrderManual.filter((wp) => taskOrder.includes(wp));
    for (const wp of taskOrder) {
      if (!result.includes(wp)) result.push(wp);
    }
    return result;
  }, [rawTasks, extraWPs, wpOrderManual]);

  // Stable ref so drag handlers always see current wpOrder without recreating callbacks
  const wpOrderRef = useRef(wpOrder);
  wpOrderRef.current = wpOrder;

  // Remove extraWPs that now have real tasks
  useEffect(() => {
    const wpWithTasks = new Set(rawTasks.map((t) => t.workPackage));
    setExtraWPs((prev) => prev.filter((wp) => !wpWithTasks.has(wp)));
  }, [rawTasks]);

  // Build row data: header → named tasks → virtual blank row (per WP)
  const rowData = useMemo<GridRow[]>(() => {
    const rows: GridRow[] = [];
    for (const wp of wpOrder) {
      rows.push({ _rowType: 'wp-header', _wp: wp });
      if (!collapsedWPs.has(wp)) {
        rows.push(...rawTasks.filter((t) => t.workPackage === wp));
        rows.push({ _rowType: 'blank', _wp: wp });
      }
    }
    return rows;
  }, [rawTasks, wpOrder, collapsedWPs]);

  const handleAddSkillSet = () => {
    const projectId = selectedProjectId ?? projects[0]?.id;
    if (!projectId) return;
    const id = `ss-${Date.now()}`;
    newSkillSetIdRef.current = id;
    addSkillSet(projectId, { id, name: 'New Skill' });
  };

  const handleAddWPSubmit = useCallback(() => {
    const wp = newWPName.trim();
    if (!wp) { setIsAddingWP(false); return; }
    if (!wpOrder.includes(wp)) setExtraWPs((prev) => [...prev, wp]);
    setNewWPName('');
    setIsAddingWP(false);
  }, [newWPName, wpOrder]);

  useEffect(() => {
    if (isAddingWP) newWPInputRef.current?.focus();
  }, [isAddingWP]);

  const startRenaming  = useCallback((wp: string) => setRenamingWP(wp), []);
  const cancelRename   = useCallback(() => setRenamingWP(null), []);
  const commitRename   = useCallback((oldWP: string, newName: string) => {
    if (newName && newName !== oldWP) {
      const projectId = selectedProjectId ?? projects[0]?.id;
      if (projectId) {
        renameWorkPackage(projectId, oldWP, newName);
        setExtraWPs((prev) => prev.map((wp) => wp === oldWP ? newName : wp));
        const currentOrder = wpOrders[projectId] ?? [];
        if (currentOrder.includes(oldWP)) {
          setProjectWPOrder(projectId, currentOrder.map((wp) => wp === oldWP ? newName : wp));
        }
      }
    }
    setRenamingWP(null);
  }, [selectedProjectId, projects, renameWorkPackage, wpOrders, setProjectWPOrder]);

  // Drag-and-drop handlers for WP reordering
  const onWPDragStart = useCallback((wp: string) => setDraggingWP(wp), []);
  const onWPDragOver  = useCallback((wp: string) => setDragOverWP(wp), []);
  const onWPDragEnd   = useCallback(() => { setDraggingWP(null); setDragOverWP(null); }, []);
  const onWPDrop      = useCallback((targetWP: string) => {
    setDraggingWP((source) => {
      if (source && source !== targetWP) {
        const order = [...wpOrderRef.current];
        const from  = order.indexOf(source);
        const to    = order.indexOf(targetWP);
        if (from !== -1 && to !== -1) {
          order.splice(from, 1);
          order.splice(to, 0, source);
          const projectId = selectedProjectId ?? projects[0]?.id;
          if (projectId) setProjectWPOrder(projectId, order);
        }
      }
      return null;
    });
    setDragOverWP(null);
  }, [selectedProjectId, projects, setProjectWPOrder]);

  const columnDefs = useMemo<ColDef<GridRow>[]>(() => {
    const skillSetCols: ColDef<GridRow>[] = skillSets.map((ss) => {
      const ownerProject = projects.find((p) => p.skillSets.some((s) => s.id === ss.id));
      const projectId = ownerProject?.id ?? selectedProjectId ?? '';
      return {
        colId: `skill-${ss.id}`,
        headerName: ss.name,
        headerComponent: SkillSetHeader,
        headerComponentParams: { skillSetId: ss.id, projectId, startEditing: newSkillSetIdRef.current === ss.id },
        width: 110,
        editable: (params) => isTask(params.data as GridRow),
        type: 'numericColumn',
        valueGetter: (params) => {
          const row = params.data;
          if (!row || !isTask(row)) return '';
          return row.workload?.[ss.id] ?? '';
        },
        valueSetter: (params) => {
          const row = params.data;
          if (!row || !isTask(row)) return false;
          const num = params.newValue === '' ? 0 : Number(params.newValue);
          if (!isNaN(num)) updateWorkload(row.id, ss.id, num);
          return true;
        },
      };
    });

    return [
      {
        headerName: 'Work Package',
        width: 200,
        editable: false,
        rowDrag: (params) => isTask(params.data as GridRow),
        rowDragText: (params) => {
          const data = params.rowNode.data as GridRow;
          return isTask(data) ? data.name : '';
        },
        valueGetter: (params) => {
          const row = params.data;
          if (!row || isWPHeader(row)) return '';
          return row._wp ?? (row as Task).workPackage;
        },
      },
      {
        field: 'name' as keyof GridRow,
        headerName: 'Task',
        flex: 1,
        minWidth: 200,
        editable: (params) => !isWPHeader(params.data as GridRow),
        valueGetter: (params) => {
          const row = params.data;
          if (!row || !isTask(row)) return '';
          return row.name;
        },
        valueSetter: (params) => {
          const row = params.data as GridRow;
          if (!row || isWPHeader(row)) return false;
          if (isBlank(row)) {
            const newName = (params.newValue as string)?.trim() ?? '';
            if (newName) {
              const projectId = selectedProjectId ?? projects[0]?.id;
              if (projectId) addTask(makeTask(projectId, row._wp, newName));
            }
            return false; // blank row stays; new task row appears via React re-render
          }
          // Task row: mutate so valueGetter sees new value → onCellValueChanged fires
          (row as Task).name = params.newValue as string;
          return true;
        },
      },
      ...skillSetCols,
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillSets, selectedProjectId, projects, addTask]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true, sortable: false, suppressMovable: true, suppressHeaderMenuButton: true,
  }), []);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent<GridRow>) => {
    const row = event.data;
    if (!row || isWPHeader(row) || !event.colDef.field) return;

    if (isBlank(row)) {
      // Blank row — create a real task only when name is filled
      if (event.colDef.field === 'name' && event.newValue?.trim()) {
        const projectId = selectedProjectId ?? projects[0]?.id;
        if (projectId) addTask(makeTask(projectId, row._wp, event.newValue.trim()));
      }
      return;
    }

    updateTask((row as Task).id, { [event.colDef.field as keyof Task]: event.newValue });
  }, [selectedProjectId, projects, addTask, updateTask]);


  const isFullWidthRow = useCallback(
    (params: IsFullWidthRowParams<GridRow>) => isWPHeader(params.rowNode.data as GridRow),
    [],
  );

  const getRowId = useCallback((params: GetRowIdParams<GridRow>) => {
    const row = params.data;
    if (isWPHeader(row)) return `wp-header-${row._wp}`;
    if (isBlank(row))    return `blank-${row._wp}`;
    return (row as Task).id;
  }, []);

  const onRowDragMove = useCallback((e: RowDragMoveEvent<GridRow>) => {
    const over = e.overNode?.data as GridRow | undefined;
    let wp: string | null = null;
    if (over) {
      if (isWPHeader(over)) wp = over._wp;
      else if (isBlank(over)) wp = over._wp;
      else if (isTask(over)) wp = over.workPackage;
    }
    setTaskDragOverWP((prev) => prev === wp ? prev : wp);

    const dragged = e.node.data as GridRow;
    if (isTask(dragged)) {
      setDragGhost({ x: e.event.clientX, y: e.event.clientY, task: dragged });
    }
  }, []);

  const onRowDragEnd = useCallback((e: RowDragEndEvent<GridRow>) => {
    const dragged = e.node.data as GridRow;
    const over    = e.overNode?.data as GridRow | undefined;

    if (!isTask(dragged) || !over) { setTaskDragOverWP(null); return; }

    const projectId = selectedProjectId ?? projects[0]?.id;
    if (!projectId) { setTaskDragOverWP(null); return; }

    if (isWPHeader(over) || isBlank(over)) {
      // Append to end of the target WP
      moveTask(projectId, dragged.id, over._wp, null);
    } else if (isTask(over) && over.id !== dragged.id) {
      const draggedRowIdx = e.node.rowIndex ?? 0;
      const overRowIdx    = e.overNode!.rowIndex ?? 0;

      if (draggedRowIdx < overRowIdx) {
        // Dragging downward: place after 'over' within its WP
        const wpTasks  = rawTasks.filter((t) => t.workPackage === over.workPackage);
        const overPos  = wpTasks.findIndex((t) => t.id === over.id);
        const nextTask = wpTasks[overPos + 1]; // task immediately after 'over' in this WP
        moveTask(projectId, dragged.id, over.workPackage, nextTask?.id ?? null);
      } else {
        // Dragging upward: place before 'over'
        moveTask(projectId, dragged.id, over.workPackage, over.id);
      }
    }

    setTaskDragOverWP(null);
    setDragGhost(null);
  }, [selectedProjectId, projects, moveTask, rawTasks]);

  const context = useMemo<GridContext>(() => ({
    collapsedWPs, toggleWP, renamingWP, startRenaming, commitRename, cancelRename,
    draggingWP, dragOverWP, onWPDragStart, onWPDragOver, onWPDrop, onWPDragEnd, taskDragOverWP,
  }), [collapsedWPs, toggleWP, renamingWP, startRenaming, commitRename, cancelRename,
       draggingWP, dragOverWP, onWPDragStart, onWPDragOver, onWPDrop, onWPDragEnd, taskDragOverWP]);

  useEffect(() => {
    if (newSkillSetIdRef.current && skillSets.some((s) => s.id === newSkillSetIdRef.current)) {
      newSkillSetIdRef.current = null;
    }
  }, [skillSets]);

  const canAddSkillSet = selectedProjectId !== null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">WBS</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {rawTasks.length} tasks · workload in <span className="font-medium text-gray-700">{unitLabel}</span>s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingWP(true)}
            disabled={!canAddSkillSet}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={15} />New WP
          </button>
          <button
            onClick={handleAddSkillSet}
            disabled={!canAddSkillSet}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={15} />Add skill
          </button>
        </div>
      </div>

      {isAddingWP && (
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-2">
          <span className="text-sm text-gray-600 shrink-0">Work package name:</span>
          <input
            ref={newWPInputRef}
            type="text"
            value={newWPName}
            onChange={(e) => setNewWPName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddWPSubmit();
              if (e.key === 'Escape') { setIsAddingWP(false); setNewWPName(''); }
            }}
            placeholder="e.g. Discovery"
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
          />
          <button onClick={handleAddWPSubmit} className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">Add</button>
          <button onClick={() => { setIsAddingWP(false); setNewWPName(''); }} className="px-3 py-1 text-sm rounded-md text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
        </div>
      )}

      {dragGhost && (
        <div
          style={{
            position: 'fixed',
            left: dragGhost.x + 16,
            top: dragGhost.y - 22,
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'stretch',
            height: 44,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            fontFamily: 'inherit',
            fontSize: 13,
            color: '#1e293b',
            overflow: 'hidden',
          }}
        >
          {[
            { text: dragGhost.task.workPackage, width: 200, bold: false, right: false },
            { text: dragGhost.task.name,        width: 240, bold: true,  right: false },
            ...skillSets.map((ss) => ({
              text: dragGhost.task.workload?.[ss.id] ? String(dragGhost.task.workload[ss.id]) : '—',
              width: 110, bold: false, right: true,
            })),
          ].map((cell, i) => (
            <div
              key={i}
              style={{
                width: cell.width, minWidth: cell.width,
                padding: '0 12px',
                display: 'flex', alignItems: 'center',
                justifyContent: cell.right ? 'flex-end' : 'flex-start',
                borderRight: '1px solid #e2e8f0',
                fontWeight: cell.bold ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {cell.text}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 p-4" ref={gridContainerRef}>
        <AgGridReact<GridRow>
          theme={themeQuartz}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          onRowDragMove={onRowDragMove}
          onRowDragEnd={onRowDragEnd}
          onRowDragLeave={() => { setTaskDragOverWP(null); setDragGhost(null); }}
          rowHeight={44}
          headerHeight={40}
          isFullWidthRow={isFullWidthRow}
          fullWidthCellRenderer={WPFullWidthRenderer}
          context={context}
          getRowId={getRowId}
        />
      </div>
    </div>
  );
}

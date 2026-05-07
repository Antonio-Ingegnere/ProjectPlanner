import { useEffect, useRef, useState } from 'react';
import type { CustomHeaderProps } from 'ag-grid-react';
import { Trash2 } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';

interface SkillSetHeaderParams {
  skillSetId: string;
  projectId: string;
  startEditing?: boolean;
}

type Props = CustomHeaderProps & SkillSetHeaderParams;

export function SkillSetHeader({ displayName, skillSetId, projectId, startEditing }: Props) {
  const { renameSkillSet, removeSkillSet } = usePlannerStore();
  const [editing, setEditing] = useState(startEditing ?? false);
  const [value, setValue] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== displayName) {
      renameSkillSet(projectId, skillSetId, trimmed);
    } else {
      setValue(displayName); // revert if empty
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      setValue(displayName);
      setEditing(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove skill set "${displayName}"? Workload values for this skill will be lost.`)) {
      removeSkillSet(projectId, skillSetId);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-full px-1 py-0.5 text-sm font-medium border border-blue-500 rounded outline-none bg-white"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-between w-full gap-1 group cursor-pointer select-none"
      onDoubleClick={() => setEditing(true)}
      title="Double-click to rename"
    >
      <span className="text-sm font-medium truncate">{displayName}</span>
      <button
        type="button"
        onClick={handleRemove}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
        title="Remove column"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

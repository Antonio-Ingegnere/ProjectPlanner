import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGridCellEditor, type CustomCellEditorProps } from 'ag-grid-react';
import type { Task } from '@/types';
import { ChevronDown } from 'lucide-react';

interface WorkPackageEditorProps extends CustomCellEditorProps<Task, string> {
  projectOptions: string[];
}

export function WorkPackageEditor({ value, onValueChange, projectOptions }: WorkPackageEditorProps) {
  const [inputValue, setInputValue] = useState<string>(value ?? '');
  const [isOpen, setIsOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // AG Grid v35 hook — registers this component as a cell editor
  useGridCellEditor({});

  const setValue = (v: string) => {
    setInputValue(v);
    onValueChange(v);
  };

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Position the portal dropdown below the input
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 2,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = inputValue
    ? projectOptions.filter((opt) => opt.toLowerCase().includes(inputValue.toLowerCase()))
    : projectOptions;

  const select = (opt: string) => {
    setValue(opt);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div className="flex items-center h-full border border-blue-500 rounded bg-white">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="flex-1 px-2 text-sm outline-none bg-transparent min-w-0 h-full"
          placeholder="Type or choose…"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsOpen((v) => !v);
            inputRef.current?.focus();
          }}
          className="px-1.5 text-gray-400 hover:text-gray-600 shrink-0"
        >
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filtered.length > 0 && createPortal(
        <ul
          style={dropdownStyle}
          className="bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                select(opt);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700
                ${opt === inputValue ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
            >
              {opt}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}

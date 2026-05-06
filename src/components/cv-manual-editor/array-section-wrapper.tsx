"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface ArraySectionWrapperProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (value: T) => void) => React.ReactNode;
  createEmpty: () => T;
  getPreview: (item: T) => string;
  label: string;
}

export function ArraySectionWrapper<T>({ items, onChange, renderItem, createEmpty, getPreview, label }: ArraySectionWrapperProps<T>) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const updateItem = (index: number, value: T) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
    if (expandedIndex === index) setExpandedIndex(index - 1);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
    if (expandedIndex === index) setExpandedIndex(index + 1);
  };

  const add = () => {
    onChange([...items, createEmpty()]);
    setExpandedIndex(items.length);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div
            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
          >
            <ChevronDown className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${expandedIndex === i ? "rotate-180" : ""}`} />
            <span className="flex-1 truncate text-xs text-zinc-300">{getPreview(item) || `${label} ${i + 1}`}</span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => moveUp(i)} disabled={i === 0} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 p-0.5">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => moveDown(i)} disabled={i === items.length - 1} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 p-0.5">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(i)} className="text-zinc-600 hover:text-rose-400 p-0.5 ml-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {expandedIndex === i && (
            <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
              {renderItem(item, i, (value) => updateItem(i, value))}
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300 pt-1">
        <Plus className="h-3 w-3" />
        Añadir {label.toLowerCase()}
      </button>
    </div>
  );
}

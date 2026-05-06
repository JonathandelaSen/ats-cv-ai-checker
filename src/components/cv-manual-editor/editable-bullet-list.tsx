"use client";

import { Plus, Trash2 } from "lucide-react";

interface EditableBulletListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function EditableBulletList({ items, onChange, placeholder = "Escribe aquí..." }: EditableBulletListProps) {
  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => onChange([...items, ""]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === items.length - 1) {
        add();
        setTimeout(() => {
          const inputs = e.currentTarget.parentElement?.parentElement?.querySelectorAll("input");
          inputs?.[inputs.length - 1]?.focus();
        }, 0);
      }
    }
    if (e.key === "Backspace" && items[index] === "" && items.length > 1) {
      e.preventDefault();
      remove(index);
    }
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="group flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 w-3 shrink-0">{i + 1}.</span>
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder={placeholder}
            className="flex-1 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500/30 focus:outline-none"
          />
          <button type="button" onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300 pt-1">
        <Plus className="h-3 w-3" />
        Añadir punto
      </button>
    </div>
  );
}

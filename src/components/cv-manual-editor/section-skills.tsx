"use client";

import type { StandardCVSkillGroup } from "@/lib/cv-profile";
import { Plus, Trash2, X } from "lucide-react";

const inputClass = "w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500/30 focus:outline-none";
const labelClass = "text-[11px] font-medium text-zinc-500 uppercase tracking-wider";

interface Props {
  items: StandardCVSkillGroup[];
  onChange: (items: StandardCVSkillGroup[]) => void;
}

export function SectionSkills({ items, onChange }: Props) {
  const updateGroup = (index: number, group: StandardCVSkillGroup) => {
    const next = [...items];
    next[index] = group;
    onChange(next);
  };

  const addGroup = () => onChange([...items, { name: "", items: [] }]);
  const removeGroup = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const addSkill = (groupIndex: number) => {
    const group = items[groupIndex];
    updateGroup(groupIndex, { ...group, items: [...(group.items ?? []), ""] });
  };

  const removeSkill = (groupIndex: number, skillIndex: number) => {
    const group = items[groupIndex];
    updateGroup(groupIndex, { ...group, items: (group.items ?? []).filter((_, i) => i !== skillIndex) });
  };

  const updateSkill = (groupIndex: number, skillIndex: number, value: string) => {
    const group = items[groupIndex];
    const skills = [...(group.items ?? [])];
    skills[skillIndex] = value;
    updateGroup(groupIndex, { ...group, items: skills });
  };

  return (
    <div className="space-y-4">
      {items.map((group, gi) => (
        <div key={gi} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={group.name ?? ""}
              onChange={(e) => updateGroup(gi, { ...group, name: e.target.value })}
              placeholder="Nombre del grupo"
              className={`${inputClass} flex-1`}
            />
            <button onClick={() => removeGroup(gi)} className="text-zinc-600 hover:text-rose-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(group.items ?? []).map((skill, si) => (
              <div key={si} className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/5 px-2 py-1">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => updateSkill(gi, si, e.target.value)}
                  placeholder="Skill"
                  className="bg-transparent text-xs text-white w-20 focus:outline-none placeholder:text-zinc-600"
                  style={{ width: `${Math.max(3, skill.length + 1)}ch` }}
                />
                <button onClick={() => removeSkill(gi, si)} className="text-zinc-600 hover:text-rose-400">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button onClick={() => addSkill(gi)} className="rounded-lg border border-dashed border-white/10 px-2 py-1 text-[11px] text-teal-400 hover:text-teal-300 hover:border-teal-500/30">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      <button onClick={addGroup} className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300">
        <Plus className="h-3 w-3" />
        Añadir grupo
      </button>
    </div>
  );
}

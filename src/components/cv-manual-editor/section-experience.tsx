"use client";

import type { StandardCVExperience } from "@/lib/cv-profile";
import { ArraySectionWrapper } from "./array-section-wrapper";
import { EditableBulletList } from "./editable-bullet-list";

const inputClass = "w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500/30 focus:outline-none";
const labelClass = "text-[11px] font-medium text-zinc-500 uppercase tracking-wider";

interface Props {
  items: StandardCVExperience[];
  onChange: (items: StandardCVExperience[]) => void;
}

function ExperienceFields({ item, update }: { item: StandardCVExperience; update: (v: StandardCVExperience) => void }) {
  const set = (key: string, value: unknown) => update({ ...item, [key]: value });
  const setDate = (key: string, value: unknown) => update({ ...item, dates: { ...item.dates, [key]: value } });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Puesto</label><input type="text" value={item.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="Software Engineer" className={inputClass} /></div>
        <div><label className={labelClass}>Empresa</label><input type="text" value={item.company ?? ""} onChange={(e) => set("company", e.target.value)} placeholder="Acme Inc." className={inputClass} /></div>
      </div>
      <div><label className={labelClass}>Ubicación</label><input type="text" value={item.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Madrid" className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Inicio</label><input type="text" value={item.dates?.start ?? ""} onChange={(e) => setDate("start", e.target.value)} placeholder="Ene 2020" className={inputClass} /></div>
        <div>
          <label className={labelClass}>Fin</label>
          <input type="text" value={item.dates?.current ? "Actualidad" : (item.dates?.end ?? "")} onChange={(e) => { const v = e.target.value; if (v.toLowerCase() === "actualidad") { setDate("current", true); } else { update({ ...item, dates: { ...item.dates, end: v, current: false } }); } }} placeholder="Dic 2023 / Actualidad" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Logros</label>
        <EditableBulletList items={item.bullets ?? []} onChange={(bullets) => set("bullets", bullets)} placeholder="Describe un logro..." />
      </div>
    </>
  );
}

export function SectionExperience({ items, onChange }: Props) {
  return (
    <ArraySectionWrapper
      items={items}
      onChange={onChange}
      createEmpty={() => ({ role: "", company: "", bullets: [] })}
      getPreview={(item) => [item.role, item.company].filter(Boolean).join(" @ ")}
      label="Experiencia"
      renderItem={(item, _, update) => <ExperienceFields item={item} update={update} />}
    />
  );
}

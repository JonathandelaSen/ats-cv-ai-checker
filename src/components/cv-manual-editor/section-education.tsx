"use client";

import type { StandardCVEducation } from "@/lib/cv-profile";
import { ArraySectionWrapper } from "./array-section-wrapper";
import { EditableBulletList } from "./editable-bullet-list";

const inputClass = "w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500/30 focus:outline-none";
const labelClass = "text-[11px] font-medium text-zinc-500 uppercase tracking-wider";

interface Props {
  items: StandardCVEducation[];
  onChange: (items: StandardCVEducation[]) => void;
}

function EducationFields({ item, update }: { item: StandardCVEducation; update: (v: StandardCVEducation) => void }) {
  const set = (key: string, value: unknown) => update({ ...item, [key]: value });
  const setDate = (key: string, value: unknown) => update({ ...item, dates: { ...item.dates, [key]: value } });

  return (
    <>
      <div><label className={labelClass}>Institución</label><input type="text" value={item.institution ?? ""} onChange={(e) => set("institution", e.target.value)} placeholder="Universidad..." className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Título</label><input type="text" value={item.degree ?? ""} onChange={(e) => set("degree", e.target.value)} placeholder="Grado en..." className={inputClass} /></div>
        <div><label className={labelClass}>Campo</label><input type="text" value={item.field ?? ""} onChange={(e) => set("field", e.target.value)} placeholder="Informática" className={inputClass} /></div>
      </div>
      <div><label className={labelClass}>Ubicación</label><input type="text" value={item.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Madrid" className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>Inicio</label><input type="text" value={item.dates?.start ?? ""} onChange={(e) => setDate("start", e.target.value)} placeholder="2016" className={inputClass} /></div>
        <div><label className={labelClass}>Fin</label><input type="text" value={item.dates?.current ? "Actualidad" : (item.dates?.end ?? "")} onChange={(e) => { const v = e.target.value; if (v.toLowerCase() === "actualidad") { setDate("current", true); } else { update({ ...item, dates: { ...item.dates, end: v, current: false } }); } }} placeholder="2020" className={inputClass} /></div>
      </div>
      <div>
        <label className={labelClass}>Detalles</label>
        <EditableBulletList items={item.details ?? []} onChange={(details) => set("details", details)} placeholder="Detalle adicional..." />
      </div>
    </>
  );
}

export function SectionEducation({ items, onChange }: Props) {
  return (
    <ArraySectionWrapper
      items={items}
      onChange={onChange}
      createEmpty={() => ({ institution: "", degree: "", details: [] })}
      getPreview={(item) => [item.degree, item.institution].filter(Boolean).join(" — ")}
      label="Educación"
      renderItem={(item, _, update) => <EducationFields item={item} update={update} />}
    />
  );
}

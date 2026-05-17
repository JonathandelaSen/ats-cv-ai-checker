"use client";

import type { StandardCVEducation } from "@/lib/cv-profile";
import { ArraySectionWrapper } from "./array-section-wrapper";
import { EditableBulletList } from "./editable-bullet-list";
import { useTranslations } from "next-intl";

const inputClass = "w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500/30 focus:outline-none";
const labelClass = "text-[11px] font-medium text-zinc-500 uppercase tracking-wider";

interface Props {
  items: StandardCVEducation[];
  onChange: (items: StandardCVEducation[]) => void;
}

function EducationFields({ item, update }: { item: StandardCVEducation; update: (v: StandardCVEducation) => void }) {
  const t = useTranslations("cvEditor.manual.education");
  const set = (key: string, value: unknown) => update({ ...item, [key]: value });
  const setDate = (key: string, value: unknown) => update({ ...item, dates: { ...item.dates, [key]: value } });

  return (
    <>
      <div><label className={labelClass}>{t("institution")}</label><input type="text" value={item.institution ?? ""} onChange={(e) => set("institution", e.target.value)} placeholder={t("institutionPlaceholder")} className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>{t("degree")}</label><input type="text" value={item.degree ?? ""} onChange={(e) => set("degree", e.target.value)} placeholder={t("degreePlaceholder")} className={inputClass} /></div>
        <div><label className={labelClass}>{t("field")}</label><input type="text" value={item.field ?? ""} onChange={(e) => set("field", e.target.value)} placeholder={t("fieldPlaceholder")} className={inputClass} /></div>
      </div>
      <div><label className={labelClass}>{t("location")}</label><input type="text" value={item.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder={t("locationPlaceholder")} className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>{t("start")}</label><input type="text" value={item.dates?.start ?? ""} onChange={(e) => setDate("start", e.target.value)} placeholder="2016" className={inputClass} /></div>
        <div><label className={labelClass}>{t("end")}</label><input type="text" value={item.dates?.current ? t("current") : (item.dates?.end ?? "")} onChange={(e) => { const v = e.target.value; if (v.toLowerCase() === t("current").toLowerCase()) { setDate("current", true); } else { update({ ...item, dates: { ...item.dates, end: v, current: false } }); } }} placeholder="2020" className={inputClass} /></div>
      </div>
      <div>
        <label className={labelClass}>{t("details")}</label>
        <EditableBulletList items={item.details ?? []} onChange={(details) => set("details", details)} placeholder={t("detailsPlaceholder")} />
      </div>
    </>
  );
}

export function SectionEducation({ items, onChange }: Props) {
  const t = useTranslations("cvEditor.manual.sections");
  return (
    <ArraySectionWrapper
      items={items}
      onChange={onChange}
      createEmpty={() => ({ institution: "", degree: "", details: [] })}
      getPreview={(item) => [item.degree, item.institution].filter(Boolean).join(" — ")}
      label={t("education")}
      renderItem={(item, _, update) => <EducationFields item={item} update={update} />}
    />
  );
}

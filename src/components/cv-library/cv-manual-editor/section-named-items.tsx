"use client";

import type { StandardCVNamedItem } from "@/lib/cv-profile";
import { ArraySectionWrapper } from "./array-section-wrapper";
import { EditableBulletList } from "./editable-bullet-list";
import { useTranslations } from "next-intl";

const inputClass = "w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500/30 focus:outline-none";
const labelClass = "text-[11px] font-medium text-zinc-500 uppercase tracking-wider";

interface Props {
  items: StandardCVNamedItem[];
  onChange: (items: StandardCVNamedItem[]) => void;
  sectionLabel: string;
}

function NamedItemFields({ item, update }: { item: StandardCVNamedItem; update: (v: StandardCVNamedItem) => void }) {
  const t = useTranslations("cvEditor.manual.named");
  const set = (key: string, value: unknown) => update({ ...item, [key]: value });

  return (
    <>
      <div><label className={labelClass}>{t("name")}</label><input type="text" value={item.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder={t("name")} className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelClass}>{t("organization")}</label><input type="text" value={item.organization ?? item.issuer ?? ""} onChange={(e) => set("organization", e.target.value)} placeholder={t("organizationPlaceholder")} className={inputClass} /></div>
        <div><label className={labelClass}>{t("date")}</label><input type="text" value={item.date ?? ""} onChange={(e) => set("date", e.target.value)} placeholder="2024" className={inputClass} /></div>
      </div>
      <div><label className={labelClass}>{t("description")}</label><input type="text" value={item.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder={t("descriptionPlaceholder")} className={inputClass} /></div>
      <div><label className={labelClass}>URL</label><input type="url" value={item.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://..." className={inputClass} /></div>
      {(item.bullets?.length ?? 0) > 0 && (
        <div>
          <label className={labelClass}>{t("details")}</label>
          <EditableBulletList items={item.bullets ?? []} onChange={(bullets) => set("bullets", bullets)} />
        </div>
      )}
    </>
  );
}

export function SectionNamedItems({ items, onChange, sectionLabel }: Props) {
  return (
    <ArraySectionWrapper
      items={items}
      onChange={onChange}
      createEmpty={() => ({ name: "" })}
      getPreview={(item) => [item.name, item.organization || item.issuer].filter(Boolean).join(" — ")}
      label={sectionLabel}
      renderItem={(item, _, update) => <NamedItemFields item={item} update={update} />}
    />
  );
}

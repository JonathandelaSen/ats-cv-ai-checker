"use client";

import type { StandardCVBasics, StandardCVLink } from "@/lib/cv-profile";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface SectionBasicsProps {
  basics: StandardCVBasics;
  onChange: (basics: StandardCVBasics) => void;
}

const inputClass = "w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-teal-500/30 focus:outline-none";
const labelClass = "text-[11px] font-medium text-zinc-500 uppercase tracking-wider";

export function SectionBasics({ basics, onChange }: SectionBasicsProps) {
  const t = useTranslations("cvEditor.manual.basics");
  const set = (key: keyof StandardCVBasics, value: string) => onChange({ ...basics, [key]: value });

  const updateLink = (index: number, field: keyof StandardCVLink, value: string) => {
    const links = [...(basics.links ?? [])];
    links[index] = { ...links[index], [field]: value };
    onChange({ ...basics, links });
  };

  const addLink = () => onChange({ ...basics, links: [...(basics.links ?? []), { label: "", url: "" }] });
  const removeLink = (i: number) => onChange({ ...basics, links: (basics.links ?? []).filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>{t("name")}</label>
        <input type="text" value={basics.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder={t("namePlaceholder")} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>{t("headline")}</label>
        <input type="text" value={basics.headline ?? ""} onChange={(e) => set("headline", e.target.value)} placeholder={t("headlinePlaceholder")} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t("email")}</label>
          <input type="email" value={basics.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="tu@email.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t("phone")}</label>
          <input type="tel" value={basics.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+34 600..." className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t("location")}</label>
        <input type="text" value={basics.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder={t("locationPlaceholder")} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>{t("links")}</label>
        <div className="space-y-2 mt-1">
          {(basics.links ?? []).map((link, i) => (
            <div key={i} className="group flex items-center gap-2">
              <input type="text" value={link.label ?? ""} onChange={(e) => updateLink(i, "label", e.target.value)} placeholder={t("linkLabel")} className={`${inputClass} w-1/3`} />
              <input type="url" value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} placeholder="https://..." className={`${inputClass} flex-1`} />
              <button onClick={() => removeLink(i)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addLink} className="flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300">
            <Plus className="h-3 w-3" />
            {t("addLink")}
          </button>
        </div>
      </div>
    </div>
  );
}

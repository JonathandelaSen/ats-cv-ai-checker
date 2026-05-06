"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Briefcase, Code, GraduationCap, Languages, Save, User, FileText, Wrench, Award, FolderOpen, Heart, Trophy, BookOpen } from "lucide-react";
import type { StandardCVProfile } from "@/lib/cv-profile";
import { normalizeStandardCVProfile } from "@/lib/cv-profile";
import { SectionBasics } from "./section-basics";
import { SectionSummary } from "./section-summary";
import { SectionExperience } from "./section-experience";
import { SectionEducation } from "./section-education";
import { SectionSkills } from "./section-skills";
import { SectionLanguages } from "./section-languages";
import { SectionNamedItems } from "./section-named-items";
import { EditableBulletList } from "./editable-bullet-list";

interface ManualEditorProps {
  profile: StandardCVProfile;
  cvId: string;
  onProfileUpdated: () => void;
}

export function ManualEditor({ profile, cvId, onProfileUpdated }: ManualEditorProps) {
  const [local, setLocal] = useState<StandardCVProfile>(() => structuredClone(profile));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const savedRef = useRef(JSON.stringify(profile));
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const incoming = JSON.stringify(profile);
    if (incoming !== savedRef.current) {
      setLocal(structuredClone(profile));
      savedRef.current = incoming;
      setSaveState("idle");
    }
  }, [profile]);

  const save = useCallback(async (data: StandardCVProfile) => {
    const normalized = normalizeStandardCVProfile(data);
    const json = JSON.stringify(normalized);
    if (json === savedRef.current) return;

    setSaveState("saving");
    try {
      const res = await fetch(`/api/cvs/${cvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: normalized }),
      });
      if (!res.ok) throw new Error("Save failed");
      const result = await res.json();
      savedRef.current = json;
      setSaveState("saved");
      onProfileUpdated();
    } catch {
      setSaveState("idle");
    }
  }, [cvId, onProfileUpdated]);

  const handleChange = useCallback((updater: (prev: StandardCVProfile) => StandardCVProfile) => {
    setLocal((prev) => {
      const next = updater(prev);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(next), 1500);
      setSaveState("idle");
      return next;
    });
  }, [save]);

  const sections = [
    { id: "basics", label: "Datos personales", icon: User, content: <SectionBasics basics={local.basics ?? {}} onChange={(basics) => handleChange((p) => ({ ...p, basics }))} /> },
    { id: "summary", label: "Resumen", icon: FileText, content: <SectionSummary summary={local.summary ?? ""} onChange={(summary) => handleChange((p) => ({ ...p, summary }))} /> },
    { id: "experience", label: "Experiencia", icon: Briefcase, count: local.experience?.length, content: <SectionExperience items={local.experience ?? []} onChange={(experience) => handleChange((p) => ({ ...p, experience }))} /> },
    { id: "education", label: "Educación", icon: GraduationCap, count: local.education?.length, content: <SectionEducation items={local.education ?? []} onChange={(education) => handleChange((p) => ({ ...p, education }))} /> },
    { id: "skills", label: "Habilidades", icon: Wrench, count: local.skills?.length, content: <SectionSkills items={local.skills ?? []} onChange={(skills) => handleChange((p) => ({ ...p, skills }))} /> },
    { id: "technicalSkills", label: "Habilidades técnicas", icon: Code, count: local.technicalSkills?.length, content: <EditableBulletList items={local.technicalSkills ?? []} onChange={(technicalSkills) => handleChange((p) => ({ ...p, technicalSkills }))} placeholder="Ej: React, Node.js, Python..." /> },
    { id: "languages", label: "Idiomas", icon: Languages, count: local.languages?.length, content: <SectionLanguages items={local.languages ?? []} onChange={(languages) => handleChange((p) => ({ ...p, languages }))} /> },
    { id: "certifications", label: "Certificaciones", icon: Award, count: local.certifications?.length, content: <SectionNamedItems items={local.certifications ?? []} onChange={(certifications) => handleChange((p) => ({ ...p, certifications }))} sectionLabel="Certificación" /> },
    { id: "projects", label: "Proyectos", icon: FolderOpen, count: local.projects?.length, content: <SectionNamedItems items={local.projects ?? []} onChange={(projects) => handleChange((p) => ({ ...p, projects }))} sectionLabel="Proyecto" /> },
    { id: "awards", label: "Premios", icon: Trophy, count: local.awards?.length, content: <SectionNamedItems items={local.awards ?? []} onChange={(awards) => handleChange((p) => ({ ...p, awards }))} sectionLabel="Premio" /> },
    { id: "publications", label: "Publicaciones", icon: BookOpen, count: local.publications?.length, content: <SectionNamedItems items={local.publications ?? []} onChange={(publications) => handleChange((p) => ({ ...p, publications }))} sectionLabel="Publicación" /> },
    { id: "volunteering", label: "Voluntariado", icon: Heart, count: local.volunteering?.length, content: <SectionNamedItems items={local.volunteering ?? []} onChange={(volunteering) => handleChange((p) => ({ ...p, volunteering }))} sectionLabel="Voluntariado" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Editor manual</h3>
        <div className="flex items-center gap-2">
          {saveState === "saving" && <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400 animate-pulse">Guardando...</span>}
          {saveState === "saved" && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Guardado ✓</span>}
          <button
            onClick={() => save(local)}
            className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/5 px-2 py-1 text-[11px] text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <Save className="h-3 w-3" />
          </button>
        </div>
      </div>

      <Accordion defaultValue={[0]} className="space-y-1">
        {sections.map((section) => (
          <AccordionItem key={section.id} className="border-none">
            <AccordionTrigger className="rounded-xl px-3 py-2.5 hover:bg-white/[0.03] hover:no-underline data-[state=open]:bg-white/[0.03] [&>svg]:text-zinc-600">
              <div className="flex items-center gap-2">
                <section.icon className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-300">{section.label}</span>
                {section.count !== undefined && section.count > 0 && (
                  <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">{section.count}</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-1 pt-2 pb-1">
              {section.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowDown, ArrowUp, Briefcase, Code, GraduationCap, GripVertical, Languages, Palette, RotateCcw, Save, User, FileText, Wrench, Award, FolderOpen, Heart, Trophy, BookOpen } from "lucide-react";
import type { StandardCVProfile } from "@/lib/cv-profile";
import { normalizeStandardCVProfile } from "@/lib/cv-profile";
import {
  DEFAULT_SECTION_ORDER,
  getOrderedRenderableSections,
  getSectionTitle,
  getTemplateAccentColor,
  type CVRenderableSectionId,
  type CVTemplateId,
  type CVTemplateLocale,
} from "@/lib/cv-templates";
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
  templateId: CVTemplateId;
  locale: CVTemplateLocale;
  onProfileUpdated: () => void;
}

export function ManualEditor({ profile, cvId, templateId, locale, onProfileUpdated }: ManualEditorProps) {
  const [local, setLocal] = useState<StandardCVProfile>(() => structuredClone(profile));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [draggedSection, setDraggedSection] = useState<CVRenderableSectionId | null>(null);
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
      await res.json();
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

  const updatePresentation = useCallback((
    updater: (prev: NonNullable<StandardCVProfile["presentation"]>) => StandardCVProfile["presentation"]
  ) => {
    handleChange((prev) => {
      const nextPresentation = updater(prev.presentation ?? {});
      return { ...prev, presentation: nextPresentation };
    });
  }, [handleChange]);

  const sectionOrder = getOrderedRenderableSections(local);
  const sectionTitles = local.presentation?.sectionTitles ?? {};
  const accentColor = local.presentation?.accentColor ?? getTemplateAccentColor(templateId);

  const moveSection = (section: CVRenderableSectionId, direction: -1 | 1) => {
    const index = sectionOrder.indexOf(section);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sectionOrder.length) return;

    moveSectionToIndex(section, targetIndex);
  };

  const moveSectionToIndex = (section: CVRenderableSectionId, targetIndex: number) => {
    const index = sectionOrder.indexOf(section);
    if (index < 0 || targetIndex < 0 || targetIndex >= sectionOrder.length || index === targetIndex) {
      return;
    }

    const nextOrder = [...sectionOrder];
    nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, section);
    updatePresentation((presentation) => ({
      ...presentation,
      sectionOrder: nextOrder,
    }));
  };

  const updateSectionTitle = (section: CVRenderableSectionId, title: string) => {
    updatePresentation((presentation) => {
      const nextTitles = { ...(presentation.sectionTitles ?? {}) };
      const trimmedTitle = title.trim();
      if (trimmedTitle) {
        nextTitles[section] = title;
      } else {
        delete nextTitles[section];
      }
      return {
        ...presentation,
        sectionTitles: Object.keys(nextTitles).length > 0 ? nextTitles : undefined,
      };
    });
  };

  const updateAccentColor = (accentColor: string) => {
    updatePresentation((presentation) => ({
      ...presentation,
      accentColor,
    }));
  };

  const handleDropSection = (targetIndex: number) => {
    if (!draggedSection) return;
    moveSectionToIndex(draggedSection, targetIndex);
    setDraggedSection(null);
  };

  const resetPresentation = () => {
    handleChange((prev) => {
      const next = { ...prev };
      delete next.presentation;
      return next;
    });
  };

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

      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-teal-400" />
            <h4 className="text-xs font-semibold text-white tracking-wide">Presentación</h4>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">Color de acento</span>
              <div className="relative flex items-center gap-1.5">
                <div 
                  className="h-3.5 w-3.5 rounded-full border border-white/10 shadow-inner" 
                  style={{ backgroundColor: accentColor }} 
                />
                <span className="text-[9px] font-mono text-zinc-500">{accentColor}</span>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(event) => updateAccentColor(event.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Color de acento"
                />
              </div>
            </label>
            <div className="h-3 w-px bg-white/10" />
            <button
              onClick={resetPresentation}
              className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              title="Restablecer presentación"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {sectionOrder.map((section, index) => (
            <div
              key={section}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropSection(index)}
              className={`group grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 py-1.5 border-b border-white/[0.03] last:border-0 transition-colors ${
                draggedSection === section
                  ? "bg-teal-500/5 relative z-10"
                  : "hover:bg-white/[0.01]"
              }`}
            >
              <button
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", section);
                  setDraggedSection(section);
                }}
                onDragEnd={() => setDraggedSection(null)}
                className="inline-flex h-6 w-6 cursor-grab items-center justify-center text-zinc-600 hover:text-zinc-300 active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
                title="Arrastrar sección"
                type="button"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-left text-[10px] font-mono text-zinc-600 opacity-60">{index + 1}.</span>
              <input
                value={sectionTitles[section] ?? ""}
                onChange={(event) => updateSectionTitle(section, event.target.value)}
                placeholder={getSectionTitle(section, locale)}
                className="h-6 min-w-0 bg-transparent px-1 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:text-white focus:outline-none transition-colors border-b border-transparent focus:border-teal-500/30"
              />
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveSection(section, -1)}
                  disabled={index === 0}
                  className="inline-flex h-6 w-6 items-center justify-center text-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-20"
                  title="Subir sección"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveSection(section, 1)}
                  disabled={index === DEFAULT_SECTION_ORDER.length - 1}
                  className="inline-flex h-6 w-6 items-center justify-center text-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-20"
                  title="Bajar sección"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

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

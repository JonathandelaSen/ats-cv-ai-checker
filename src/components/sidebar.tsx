"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Sparkles,
  Clock,
  UserCircle,
  FileSearch,
  Briefcase,
  FolderOpen,
  Settings,
  ShieldCheck,
  Menu,
  LayoutTemplate,
  Wand2,
  MessageSquareQuote,
  BookOpenText,
  NotebookPen,
  Inbox,
  Target,
} from "lucide-react";
import type { AnalysisMode, OfferStatus } from "@/lib/analysis-types";

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  interesante: "Interesante",
  aplicado: "Aplicado",
  entrevista: "Entrevista",
  oferta: "Oferta",
  rechazado: "Rechazado",
  descartado: "Descartado",
};

const OFFER_STATUS_BADGE_CLASS: Record<OfferStatus, string> = {
  interesante: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  aplicado: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  entrevista: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  oferta: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  rechazado: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  descartado: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
};

export interface AnalysisSummary {
  id: string;
  cv_id: string | null;
  title: string;
  filename: string;
  created_at: string;
  analysis_mode: AnalysisMode;
  ai_score: number | null;
  ai_analyzed_at: string | null;
  job_url: string | null;
  offer_status: OfferStatus | null;
  offer_next_action_at: string | null;
}

interface SidebarProps {
  generalAnalyses: AnalysisSummary[];
  jobMatchAnalyses: AnalysisSummary[];
  activeId: string | null;
  activeView:
    | "new"
    | "analysis"
    | "cv-analyses"
    | "job-analyses"
    | "cvs"
    | "templates"
    | "editor"
    | "questions"
    | "journal"
    | "objectives"
    | "received-feedback"
    | "feedback-notes"
    | "settings"
    | "admin";
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
  onOpenCVAnalyses: () => void;
  onOpenJobAnalyses: () => void;
  onOpenCVs: () => void;
  onOpenTemplates: () => void;
  onOpenEditor: () => void;
  onOpenQuestions: () => void;
  onOpenJournal: () => void;
  onOpenObjectives: () => void;
  onOpenReceivedFeedback: () => void;
  onOpenFeedbackNotes: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onDelete: (id: string) => void;
  userEmail: string | null;
  isAdmin?: boolean;
  isForceCollapsed?: boolean;
}

export default function Sidebar({
  generalAnalyses,
  jobMatchAnalyses,
  activeId,
  activeView,
  onSelect,
  onNewAnalysis,
  onOpenCVAnalyses,
  onOpenJobAnalyses,
  onOpenCVs,
  onOpenTemplates,
  onOpenEditor,
  onOpenQuestions,
  onOpenJournal,
  onOpenObjectives,
  onOpenReceivedFeedback,
  onOpenFeedbackNotes,
  onOpenSettings,
  onOpenAdmin,
  onDelete,
  userEmail,
  isAdmin = false,
  isForceCollapsed = false,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cvSectionOpen, setCvSectionOpen] = useState(true);
  const [jobSectionOpen, setJobSectionOpen] = useState(true);

  const collapsed = isForceCollapsed || internalCollapsed;

  const setCollapsed = (val: boolean) => {
    if (isForceCollapsed) return;
    setInternalCollapsed(val);
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hasAnalyses = generalAnalyses.length > 0 || jobMatchAnalyses.length > 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Ahora";
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "";
    if (score >= 80) return "text-emerald-400 bg-emerald-500/15";
    if (score >= 60) return "text-amber-400 bg-amber-500/15";
    return "text-rose-400 bg-rose-500/15";
  };

  return (
    <>
      <AnimatePresence>
        {isMobile && collapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setCollapsed(false)}
            className="md:hidden fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-900/30 active:scale-95 transition-transform"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && !collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCollapsed(true)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? (collapsed ? 0 : 280) : collapsed ? 56 : 280,
          x: isMobile && collapsed ? -280 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`h-screen flex flex-col border-r border-white/[0.06] bg-[#0d0d14]/95 backdrop-blur-xl shrink-0 overflow-hidden z-50 ${
          isMobile ? "fixed left-0 top-0 bottom-0" : "relative"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 h-14 shrink-0">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 min-w-0"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-sm text-zinc-100 truncate">
                  ATS CV AI Checker
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* New Analysis Button */}
        <div className="px-2 pb-2 shrink-0">
          <button
            onClick={onNewAnalysis}
            className={`
            w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
            bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
            text-white shadow-lg shadow-indigo-900/30 active:scale-[0.97]
            ${collapsed ? "justify-center p-2" : "px-3 py-2.5 text-sm"}
          `}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Nuevo Análisis</span>}
          </button>
        </div>

        {/* Nav Sections */}
        <div className="px-2 pb-2 shrink-0 space-y-1">
          {/* ── Sección: Tu CV ── */}
          {!collapsed && (
            <button
              onClick={() => setCvSectionOpen((o) => !o)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.03] transition-colors"
            >
              <FolderOpen className="w-3 h-3 shrink-0" />
              <span className="flex-1 text-left">Tu CV</span>
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform duration-200 ${cvSectionOpen ? "" : "-rotate-90"}`}
              />
            </button>
          )}
          <AnimatePresence initial={false}>
            {(collapsed || cvSectionOpen) && (
              <motion.div
                key="cv-section"
                initial={collapsed ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className={`space-y-0.5 ${!collapsed ? "pl-2" : ""}`}>
                  <button
                    onClick={onOpenCVAnalyses}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "cv-analyses" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <FileSearch className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex-1 text-left">Análisis de CV</span>
                    )}
                    {!collapsed && generalAnalyses.length > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-400">
                        {generalAnalyses.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={onOpenCVs}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "cvs" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Mis CVs</span>}
                  </button>
                  <button
                    onClick={onOpenTemplates}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "templates" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <LayoutTemplate className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Plantillas</span>}
                  </button>
                  <button
                    onClick={onOpenEditor}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "editor" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <Wand2 className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Editor</span>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Sección: Búsqueda de empleo ── */}
          {!collapsed && (
            <button
              onClick={() => setJobSectionOpen((o) => !o)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.03] transition-colors mt-1"
            >
              <Briefcase className="w-3 h-3 shrink-0" />
              <span className="flex-1 text-left">Búsqueda de empleo</span>
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform duration-200 ${jobSectionOpen ? "" : "-rotate-90"}`}
              />
            </button>
          )}
          <AnimatePresence initial={false}>
            {(collapsed || jobSectionOpen) && (
              <motion.div
                key="job-section"
                initial={collapsed ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className={`space-y-0.5 ${!collapsed ? "pl-2" : ""}`}>
                  <button
                    onClick={onOpenJobAnalyses}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "job-analyses" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex-1 text-left">Análisis de Ofertas</span>
                    )}
                    {!collapsed && jobMatchAnalyses.length > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-400">
                        {jobMatchAnalyses.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={onOpenQuestions}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "questions" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <MessageSquareQuote className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Preguntas</span>}
                  </button>
                  <button
                    onClick={onOpenJournal}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "journal" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <BookOpenText className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Diario</span>}
                  </button>
                  <button
                    onClick={onOpenObjectives}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "objectives" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <Target className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Objectives</span>}
                  </button>
                  <button
                    onClick={onOpenReceivedFeedback}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "received-feedback" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <Inbox className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Received Feedback</span>}
                  </button>
                  <button
                    onClick={onOpenFeedbackNotes}
                    className={`
                    w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
                    ${activeView === "feedback-notes" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    ${collapsed ? "justify-center p-2" : "px-3 py-2 text-sm"}
                  `}
                  >
                    <NotebookPen className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Feedback Notes</span>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.06] shrink-0 space-y-3">
          <button
            onClick={onOpenSettings}
            className={`
            w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
            ${activeView === "settings" ? "bg-white/[0.08] text-zinc-100" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
            ${collapsed ? "justify-center p-2" : "px-3 py-2.5 text-sm"}
          `}
            title="Configuración"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Configuración</span>}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`
              w-full flex items-center gap-2 rounded-lg font-medium transition-all duration-150
              ${activeView === "admin" ? "bg-emerald-500/10 text-emerald-200" : "text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"}
              ${collapsed ? "justify-center p-2" : "px-3 py-2.5 text-sm"}
            `}
              title="Observabilidad"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Observabilidad</span>}
            </button>
          )}
          {!collapsed && (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 min-w-0 text-[11px] text-zinc-500">
                <UserCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}

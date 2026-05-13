"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Cpu,
  Briefcase,
  FileDown,
  FileSearch,
  FileText,
  ExternalLink,
  Trash2,
  Loader2,
  Check,
  X,
  Plus,
  Pencil,
} from "lucide-react";
import type { AnalysisMode } from "@/lib/analysis-types";

interface ScoreHeroProps {
  score: number;
  title: string;
  feedback: string;
  model: string;
  analyzedAt: string;
  analysisMode: AnalysisMode;
  jobDescription: string | null;
  jobUrl: string | null;
  cv: { id: string; name: string; filename: string; type?: string } | null;
  cvId: string | null;
  filename: string;
  onExport: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onSaveUrl: (url: string) => Promise<void>;
  isSavingUrl: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80)
    return {
      text: "text-emerald-400",
      stroke: "stroke-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    };
  if (score >= 60)
    return {
      text: "text-amber-400",
      stroke: "stroke-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    };
  return {
    text: "text-rose-400",
    stroke: "stroke-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  };
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Mejorable";
  return "Necesita Trabajo";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScoreHero({
  score,
  title,
  feedback,
  model,
  analyzedAt,
  analysisMode,
  jobDescription,
  jobUrl,
  cv,
  cvId,
  filename,
  onExport,
  onDelete,
  isDeleting,
  onSaveUrl,
  isSavingUrl,
}: ScoreHeroProps) {
  const colors = getScoreColor(score);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editedUrl, setEditedUrl] = useState(jobUrl || "");

  const handleSaveUrl = async () => {
    await onSaveUrl(editedUrl.trim());
    setIsEditingUrl(false);
  };

  const cvHref =
    cv?.type === "template"
      ? `/api/cvs/${cv.id}/template-pdf`
      : `/api/cvs/${cv?.id ?? cvId}/pdf`;

  const hasCv = cv || cvId;

  return (
    <div
      className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 backdrop-blur-sm`}
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Score Circle */}
        <div className="relative shrink-0 w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="fill-none stroke-white/[0.06]"
              strokeWidth="6"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              className={`fill-none ${colors.stroke}`}
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 264" }}
              animate={{ strokeDasharray: `${score * 2.64} 264` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className={`text-4xl font-black ${colors.text}`}
            >
              {score}
            </motion.span>
            <span className="text-zinc-500 text-[10px] font-semibold tracking-wider mt-0.5">
              / 100
            </span>
          </div>
        </div>

        {/* Score Info */}
        <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${colors.bg} ${colors.text} ${colors.border} border`}
              >
                {getScoreLabel(score)}
              </span>
              {analysisMode === "general" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  <FileSearch className="w-3 h-3" />
                  Análisis General
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <Briefcase className="w-3 h-3" />
                  Match con Oferta
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-zinc-100">
              {title ||
                (analysisMode === "general"
                  ? "CV Quality Score"
                  : "ATS Match Score")}
            </h3>
          </div>
          <p className="text-zinc-400 leading-relaxed text-sm line-clamp-3">
            {feedback}
          </p>

          {/* Meta row: model, date, CV, URL */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">
              <Cpu className="w-3 h-3" />
              {model}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">
              <Clock className="w-3 h-3" />
              {formatDate(analyzedAt)}
            </span>
            {jobDescription && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">
                <Briefcase className="w-3 h-3" />
                Con oferta
              </span>
            )}

            {/* CV link inline */}
            {hasCv && (
              <>
                <span className="text-zinc-700 text-[10px]">|</span>
                <a
                  href={cvHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-2 py-1 rounded-md transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  {cv?.name ?? filename}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </>
            )}

            {/* Job URL inline */}
            {analysisMode === "job_match" && (
              <>
                <span className="text-zinc-700 text-[10px]">|</span>
                {isEditingUrl ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="url"
                      value={editedUrl}
                      onChange={(e) => setEditedUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-6 w-48 rounded-md bg-[#0a0a12] border border-white/[0.06] px-2 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/40"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUrl}
                      disabled={isSavingUrl}
                      className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                    >
                      {isSavingUrl ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUrl(false);
                        setEditedUrl(jobUrl || "");
                      }}
                      disabled={isSavingUrl}
                      className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : jobUrl ? (
                  <span className="inline-flex items-center gap-1">
                    <a
                      href={jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded-md transition-colors max-w-[180px] truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {new URL(jobUrl).hostname}
                    </a>
                    <button
                      onClick={() => {
                        setEditedUrl(jobUrl);
                        setIsEditingUrl(true);
                      }}
                      className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setEditedUrl("");
                      setIsEditingUrl(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    URL oferta
                  </button>
                )}
              </>
            )}
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-md transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              Exportar
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1 rounded-md transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {isDeleting ? "Borrando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

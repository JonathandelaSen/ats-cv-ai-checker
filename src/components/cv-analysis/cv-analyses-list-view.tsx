"use client";

import { FileSearch, Clock, Sparkles, Trash2, Plus, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInterfaceLanguage } from "@/components/shared/i18n-provider";
import { CVAnalysesListSkeleton } from "./cv-analyses-list-skeleton";
import type { AnalysisSummary } from "@/lib/analysis-types";

interface CVAnalysesListViewProps {
  analyses: AnalysisSummary[];
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const getScoreColor = (score: number | null) => {
  if (score === null) return "";
  if (score >= 80) return "text-emerald-400 bg-emerald-500/15 border-emerald-500/20";
  if (score >= 60) return "text-amber-400 bg-amber-500/15 border-amber-500/20";
  return "text-rose-400 bg-rose-500/15 border-rose-500/20";
};

const formatDate = (dateStr: string, locale: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function CVAnalysesListView({
  analyses,
  onSelect,
  onNewAnalysis,
  onDelete,
  isLoading = false,
}: CVAnalysesListViewProps) {
  const t = useTranslations("analysisFlow.lists");
  const common = useTranslations("common");
  const { locale } = useInterfaceLanguage();
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">{t("cvTitle")}</h1>
              <p className="text-xs text-zinc-500">
                {t("cvCount", { count: analyses.length })}
              </p>
            </div>
          </div>
          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/30 active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            {t("newAnalysis")}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {isLoading ? (
          <CVAnalysesListSkeleton />
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
              <FileText className="w-8 h-8 text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-400">{t("cvEmptyTitle")}</p>
              <p className="text-xs text-zinc-600 mt-1">
                {t("cvEmptyDescription")}
              </p>
            </div>
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all"
            >
              <Plus className="w-4 h-4" />
              {t("newAnalysis")}
            </button>
          </div>
        ) : (
          analyses.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.10] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <FileSearch className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {a.title || a.filename.replace(/\.pdf$/i, "")}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(a.created_at, dateLocale)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {a.ai_score !== null ? (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getScoreColor(a.ai_score)}`}
                  >
                    {a.ai_score}
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-600 flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/50">
                    <Sparkles className="w-3 h-3" />
                    {common("states.pending")}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(a.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}


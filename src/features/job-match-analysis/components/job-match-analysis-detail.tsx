"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  MessageCircle,
  MessageSquareQuote,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import type { JobKeyData } from "@/lib/analysis-types";
import type { OfferStatus } from "@/lib/analysis-types";
import type { InterviewQuestionSummary } from "../types";
import type { JobMatchAnalysisDetail as JobMatchAnalysisDetailType } from "../api/job-match-analysis-api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ScoreHero from "./score-hero";
import TabResumen from "./tab-resumen";
import TabOferta from "./tab-oferta";
import TabEntrevista from "./tab-entrevista";
import TabSeguimiento from "./tab-seguimiento";
import TabChatOferta from "./tab-chat-oferta";
import { useInterfaceLanguage } from "@/components/shared/i18n-provider";

type DetailTab = "summary" | "offer" | "questions" | "chat" | "tracking";

interface JobMatchAnalysisDetailProps {
  analysis: JobMatchAnalysisDetailType;
  aiProvider?: "gemini" | "mock";
  aiApiKey?: string;
  aiModel?: string;
  hasAIApiKey?: boolean;
  activeTab?: DetailTab;
  onTabChange?: (tab: DetailTab) => void;
  interviewQuestions?: InterviewQuestionSummary[];
  onInterviewQuestionCreated?: () => void;
  onOpenQuestions?: () => void;
  onUpdateUrl: (url: string) => Promise<void>;
  onUpdateTracking: (updates: {
    offerStatus: OfferStatus;
    offerNotes: string;
    offerNextAction: string;
    offerNextActionAt: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function safeParseArray(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function safeParseJobKeyData(value: string | null): JobKeyData | null {
  try {
    const parsed = JSON.parse(value || "null");
    return parsed && typeof parsed === "object" ? (parsed as JobKeyData) : null;
  } catch {
    return null;
  }
}

const TAB_URL_TO_INTERNAL: Record<string, string> = {
  summary: "resumen",
  offer: "oferta",
  questions: "entrevista",
  chat: "chat",
  tracking: "seguimiento",
};

const TAB_INTERNAL_TO_URL: Record<string, DetailTab> = {
  resumen: "summary",
  oferta: "offer",
  entrevista: "questions",
  chat: "chat",
  seguimiento: "tracking",
};

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function JobMatchAnalysisDetail({
  analysis,
  aiProvider = "gemini",
  aiApiKey = "",
  aiModel = "gemini-3.1-pro-preview",
  hasAIApiKey = false,
  activeTab = "summary",
  onTabChange,
  interviewQuestions = [],
  onInterviewQuestionCreated,
  onOpenQuestions,
  onUpdateUrl,
  onUpdateTracking,
  onDelete,
}: JobMatchAnalysisDetailProps) {
  const t = useTranslations("analysisDetail");
  const { locale } = useInterfaceLanguage();
  const dateLocale = locale === "es" ? "es-ES" : "en-US";
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatus>(
    analysis.offerStatus ?? "interesante",
  );
  const [offerNotes, setOfferNotes] = useState(analysis.offerNotes ?? "");
  const [offerNextAction, setOfferNextAction] = useState(
    analysis.offerNextAction ?? "",
  );
  const [offerNextActionAt, setOfferNextActionAt] = useState(
    toDateTimeLocalValue(analysis.offerNextActionAt),
  );
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState("");
  const [quickQuestionContext, setQuickQuestionContext] = useState("");
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [quickQuestionModel, setQuickQuestionModel] = useState(
    "gemini-3.1-pro-preview",
  );

  const keywords = safeParseArray(analysis.aiKeywords);
  const improvements = safeParseArray(analysis.aiImprovements);
  const jobKeywords = safeParseArray(analysis.jobKeywords);
  const cvKeywords = safeParseArray(analysis.cvKeywords);
  const matchingKeywords = safeParseArray(analysis.matchingKeywords);
  const missingKeywords = safeParseArray(analysis.missingKeywords);
  const jobKeyData = safeParseJobKeyData(analysis.jobKeyData);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExport = () => {
    const cvName = analysis.cv?.name ?? analysis.filename;
    const cvUrl = analysis.cv
      ? `${window.location.origin}/api/cvs/${analysis.cv.id}/${analysis.cv.type === "template" ? "template-pdf" : "pdf"}`
      : null;
    const report = `
${t("export.title")}
-----------------------
${t("export.file")}: ${analysis.filename}
${t("export.name")}: ${analysis.title}
${t("export.cvUsed")}: ${cvName}
${cvUrl ? `${t("export.cvLink")}: ${cvUrl}` : ""}
${t("export.analysisId")}: ${analysis.id}
${t("export.date")}: ${formatDate(analysis.aiAnalyzedAt!)}
${t("export.model")}: ${analysis.aiModel}

${t("export.score")}: ${analysis.aiScore}/100

${t("export.feedback")}:
${analysis.aiFeedback}

${t("export.detectedKeywords")}:
${keywords.join(", ") || t("export.none")}

${t("export.jobKeywords")}:
${jobKeywords.join(", ") || t("export.none")}

${t("export.cvKeywords")}:
${cvKeywords.join(", ") || t("export.none")}

${t("export.missingKeywords")}:
${missingKeywords.join(", ") || t("export.none")}

${t("export.improvements")}:
${improvements.map((imp) => `- ${imp}`).join("\n") || t("export.noSuggestions")}

${analysis.jobDescription ? `${t("export.jobDescription")}:\n${analysis.jobDescription}` : ""}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ATS_Report_${(analysis.aiAnalyzedAt ?? "").replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        t("alerts.confirmDelete"),
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(analysis.id);
    } catch (error) {
      console.error("Error deleting analysis:", error);
      alert(t("alerts.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveUrl = async (url: string) => {
    setIsSavingUrl(true);
    try {
      await onUpdateUrl(url);
    } catch (err) {
      console.error(err);
      alert(t("alerts.saveUrlFailed"));
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleSaveTracking = async () => {
    setIsSavingTracking(true);
    try {
      await onUpdateTracking({
        offerStatus,
        offerNotes,
        offerNextAction,
        offerNextActionAt,
      });
    } catch (err) {
      console.error(err);
      alert(t("alerts.saveTrackingFailed"));
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleCreateInterviewQuestion = async (generateAfter = false) => {
    if (!quickQuestion.trim()) return;
    if (generateAfter && !hasAIApiKey) {
      alert(t("alerts.missingApiKeyForAnswer"));
      return;
    }
    if (generateAfter && !quickQuestionContext.trim()) {
      alert(t("alerts.missingContextForAnswer"));
      return;
    }
    setIsCreatingQuestion(true);
    try {
      const res = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: quickQuestion.trim(),
          context: quickQuestionContext.trim() || null,
          cv_id: analysis.cvId ?? null,
          analysis_id: analysis.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("alerts.createQuestionFailed"));
      }
      const created = await res.json();
      if (generateAfter) {
        const generateRes = await fetch(
          `/api/interview-questions/${created.id}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: aiProvider,
              apiKey: aiApiKey,
              model: quickQuestionModel,
              context: quickQuestionContext,
              cv_id: analysis.cvId,
              analysis_id: analysis.id,
            }),
          },
        );
        if (!generateRes.ok) {
          const data = await generateRes.json().catch(() => ({}));
          throw new Error(data.error || t("alerts.generateAnswerFailed"));
        }
      }
      setQuickQuestion("");
      setQuickQuestionContext("");
      onInterviewQuestionCreated?.();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : t("alerts.createLinkedQuestionFailed"),
      );
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 overflow-y-auto p-6"
    >
      <div className="flex flex-1 min-h-0">
        <div className="w-full space-y-5">
          {/* Score Hero */}
          <ScoreHero
            score={analysis.aiScore!}
            title={analysis.title}
            feedback={analysis.aiFeedback!}
            model={analysis.aiModel!}
            analyzedAt={analysis.aiAnalyzedAt!}
            jobDescription={analysis.jobDescription}
            jobUrl={analysis.jobUrl}
            cv={analysis.cv}
            cvId={analysis.cvId}
            filename={analysis.filename}
            onExport={handleExport}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            onSaveUrl={handleSaveUrl}
            isSavingUrl={isSavingUrl}
          />

          {/* Tabs */}
          <Tabs
            value={TAB_URL_TO_INTERNAL[activeTab] ?? "resumen"}
            onValueChange={(val) => {
              const urlTab = TAB_INTERNAL_TO_URL[val];
              if (urlTab) onTabChange?.(urlTab);
            }}
            className="w-full"
          >
            <div className="sticky top-[-24px] z-20 -mx-6 px-6 py-4 backdrop-blur-md mb-8">
              <TabsList className="bg-white/[0.03] border-white/[0.05] p-1 rounded-2xl gap-1">
                <TabsTrigger
                  value="resumen"
                  className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <Sparkles className="size-4" />
                  {t("tabs.summary")}
                </TabsTrigger>
                <TabsTrigger
                  value="oferta"
                  className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <Briefcase className="size-4" />
                  {t("tabs.offer")}
                </TabsTrigger>
                <TabsTrigger
                  value="entrevista"
                  className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <MessageSquareQuote className="size-4" />
                  {t("tabs.questions")}
                  {interviewQuestions.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5">
                      {interviewQuestions.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <MessageCircle className="size-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="seguimiento"
                  className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <CalendarClock className="size-4" />
                  {t("tabs.tracking")}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0">
              <TabsContent value="resumen">
                <TabResumen
                  improvements={improvements}
                  keywords={keywords}
                  jobKeywords={jobKeywords}
                  cvKeywords={cvKeywords}
                  matchingKeywords={matchingKeywords}
                  missingKeywords={missingKeywords}
                />
              </TabsContent>

              <TabsContent value="oferta">
                <TabOferta
                  jobKeyData={jobKeyData}
                  jobDescription={analysis.jobDescription}
                />
              </TabsContent>

              <TabsContent value="entrevista">
                <TabEntrevista
                  interviewQuestions={interviewQuestions}
                  onOpenQuestions={onOpenQuestions}
                  quickQuestion={quickQuestion}
                  onQuickQuestionChange={setQuickQuestion}
                  quickQuestionContext={quickQuestionContext}
                  onQuickQuestionContextChange={setQuickQuestionContext}
                  quickQuestionModel={quickQuestionModel}
                  onQuickQuestionModelChange={setQuickQuestionModel}
                  isCreatingQuestion={isCreatingQuestion}
                  onCreateQuestion={handleCreateInterviewQuestion}
                />
              </TabsContent>

              <TabsContent value="chat">
                <TabChatOferta
                  analysisId={analysis.id}
                  aiProvider={aiProvider ?? "gemini"}
                  aiApiKey={aiApiKey}
                  aiModel={aiModel ?? "gemini-3.1-pro-preview"}
                  hasAIApiKey={hasAIApiKey}
                />
              </TabsContent>

              <TabsContent value="seguimiento">
                <TabSeguimiento
                  offerStatus={offerStatus}
                  onOfferStatusChange={setOfferStatus}
                  offerNotes={offerNotes}
                  onOfferNotesChange={setOfferNotes}
                  offerNextAction={offerNextAction}
                  onOfferNextActionChange={setOfferNextAction}
                  offerNextActionAt={offerNextActionAt}
                  onOfferNextActionAtChange={setOfferNextActionAt}
                  isSavingTracking={isSavingTracking}
                  onSaveTracking={handleSaveTracking}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}

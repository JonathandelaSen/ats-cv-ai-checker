"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AnalysisSummary } from "@/lib/analysis-types";
import Sidebar from "@/components/shell/sidebar";
import NewAnalysisFlow from "@/components/cv-library/new-analysis-flow";
import CVLibrary from "@/components/cv-library/cv-library";
import TemplatesView from "@/components/cv-library/templates-view";
import CVEditorView from "@/components/cv-library/cv-editor-view";
import InterviewQuestionsView from "@/components/selection-process/interview-questions-view";
import WorkJournalView from "@/components/work-journal/work-journal-view";
import ObjectivesView from "@/components/commitments/objectives-view";
import { FeedbackNotesView } from "@/features/feedback-notes";
import { ReceivedFeedbackView } from "@/features/received-feedback";
import ExtractionView from "@/components/cv-analysis/extraction-view";
import AIAnalysisView from "@/components/cv-analysis/analysis-view";
import CVAnalysesListView from "@/components/cv-analysis/cv-analyses-list-view";
import JobAnalysesListView from "@/components/job-match-analysis/job-analyses-list-view";
import SettingsView from "@/components/settings/settings-view";
import AdminObservabilityDashboard from "@/components/observability/admin-observability-dashboard";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import { AnalysisDetailSkeleton } from "@/components/shared/skeletons";
import { createClient } from "@/lib/supabase/client";
import type {
  AnalysisMode,
  AIContext,
  OfferStatus,
} from "@/lib/analysis-types";
import type { CVDocumentSummaryResponse as CVSummary } from "@/modules/cv-library/client";
import type { ProcessQuestionResponse as InterviewQuestionSummary } from "@/modules/selection-process";
import { getStoredGeminiApiKey } from "@/lib/browser-preferences";

type ViewTab = "extraction" | "analysis";
type AppView =
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

interface FullAnalysis {
  id: string;
  cv_id: string | null;
  cv: {
    id: string;
    name: string;
    filename: string;
    type?: string;
  } | null;
  title: string;
  filename: string;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  text_python: string | null;
  text_pdfjs: string | null;
  text_node: string | null;
  extract_error_python: string | null;
  extract_error_pdfjs: string | null;
  extract_error_node: string | null;
  analysis_mode: AnalysisMode;
  ai_model: string | null;
  job_description: string | null;
  job_url: string | null;
  offer_status: OfferStatus | null;
  offer_notes: string | null;
  offer_next_action: string | null;
  offer_next_action_at: string | null;
  ai_context: AIContext | null;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_keywords: string | null;
  ai_improvements: string | null;
  job_key_data: string | null;
  job_keywords: string | null;
  cv_keywords: string | null;
  matching_keywords: string | null;
  missing_keywords: string | null;
  ai_analyzed_at: string | null;
}

interface AppShellProps {
  initialView?: AppView;
  initialUserEmail?: string | null;
  initialIsAdmin?: boolean;
}

export default function AppShell({
  initialView = "new",
  initialUserEmail = null,
  initialIsAdmin = false,
}: AppShellProps) {
  const router = useRouter();
  const common = useTranslations("common");
  const analysisFlow = useTranslations("analysisFlow.appShell");
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [cvs, setCVs] = useState<CVSummary[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestionSummary[]
  >([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<FullAnalysis | null>(
    null,
  );
  const [viewTab, setViewTab] = useState<ViewTab>("extraction");
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [activeEditorCvId, setActiveEditorCvId] = useState<string | null>(null);
  const [activeQuestionCvId, setActiveQuestionCvId] = useState<string | null>(
    null,
  );
  const [activeQuestionAnalysisId, setActiveQuestionAnalysisId] = useState<
    string | null
  >(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(initialUserEmail);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const lastFeedbackNotesHrefRef = useRef("/feedback-notes");
  const lastReceivedFeedbackHrefRef = useRef("/received-feedback");

  // Fetch analyses list
  const fetchAnalyses = useCallback(async () => {
    setAnalysesLoading(true);
    try {
      const [cvRes, jobMatchRes] = await Promise.all([
        fetch("/api/cv-analyses"),
        fetch("/api/job-match-analyses"),
      ]);
      if (cvRes.ok && jobMatchRes.ok) {
        const [cvAnalyses, jobMatchAnalyses] = await Promise.all([
          cvRes.json(),
          jobMatchRes.json(),
        ]);
        setAnalyses(
          [...cvAnalyses, ...jobMatchAnalyses].sort((a, b) =>
            b.created_at.localeCompare(a.created_at),
          ),
        );
      }
    } catch {
      // silent
    } finally {
      setAnalysesLoading(false);
    }
  }, []);

  const fetchCVs = useCallback(async () => {
    try {
      const res = await fetch("/api/cvs");
      if (res.ok) {
        const data = await res.json();
        setCVs(data);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchInterviewQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/interview-questions");
      if (res.ok) {
        const data = await res.json();
        setInterviewQuestions(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() =>
      Promise.all([fetchAnalyses(), fetchCVs(), fetchInterviewQuestions()]),
    );
  }, [fetchAnalyses, fetchCVs, fetchInterviewQuestions]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    const syncGeminiApiKey = () => setGeminiApiKey(getStoredGeminiApiKey());

    syncGeminiApiKey();
    window.addEventListener("storage", syncGeminiApiKey);

    return () => window.removeEventListener("storage", syncGeminiApiKey);
  }, []);

  const rememberFeedbackNotesLocation = useCallback(() => {
    if (window.location.pathname.startsWith("/feedback-notes")) {
      lastFeedbackNotesHrefRef.current = `${window.location.pathname}${window.location.search}`;
    }
  }, []);

  const rememberReceivedFeedbackLocation = useCallback(() => {
    if (window.location.pathname.startsWith("/received-feedback")) {
      lastReceivedFeedbackHrefRef.current = `${window.location.pathname}${window.location.search}`;
    }
  }, []);

  // Fetch single analysis detail
  const fetchAnalysisDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const knownMode = analyses.find((analysis) => analysis.id === id)
        ?.analysis_mode;
      const endpoints =
        knownMode === "job_match"
          ? [`/api/job-match-analyses/${id}`]
          : knownMode === "general"
            ? [`/api/cv-analyses/${id}`]
            : [`/api/cv-analyses/${id}`, `/api/job-match-analyses/${id}`];

      let data: FullAnalysis | null = null;
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint);
        if (res.ok) {
          data = await res.json();
          break;
        }
      }
      if (data) {
        setActiveAnalysis(data);
        setViewTab(data.ai_score !== null ? "analysis" : "extraction");
        setActiveView("analysis");
      }
    } catch {
      // silent
    } finally {
      setLoadingDetail(false);
    }
  }, [analyses]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const analysisId = params.get("analysis");
    const view = params.get("view");

    if (analysisId) {
      queueMicrotask(() => {
        setActiveAnalysisId(analysisId);
        setActiveView("analysis");
        void fetchAnalysisDetail(analysisId);
      });
    } else if (view === "cvs") {
      queueMicrotask(() => {
        setActiveView("cvs");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "templates") {
      queueMicrotask(() => {
        setActiveView("templates");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "editor") {
      queueMicrotask(() => {
        setActiveView("editor");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
        setActiveEditorCvId(params.get("cv"));
      });
    } else if (view === "questions") {
      queueMicrotask(() => {
        setActiveView("questions");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
        setActiveQuestionCvId(params.get("cv"));
        setActiveQuestionAnalysisId(params.get("offer"));
      });
    } else if (view === "journal") {
      queueMicrotask(() => {
        setActiveView("journal");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "objectives") {
      queueMicrotask(() => {
        setActiveView("objectives");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "feedback-notes") {
      queueMicrotask(() => {
        router.replace("/feedback-notes");
      });
    } else if (window.location.pathname.startsWith("/feedback-notes")) {
      queueMicrotask(() => {
        setActiveView("feedback-notes");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "cv-analyses") {
      queueMicrotask(() => {
        setActiveView("cv-analyses");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "job-analyses") {
      queueMicrotask(() => {
        setActiveView("job-analyses");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "received-feedback") {
      queueMicrotask(() => {
        router.replace("/received-feedback");
      });
    } else if (window.location.pathname.startsWith("/received-feedback")) {
      queueMicrotask(() => {
        setActiveView("received-feedback");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (view === "settings") {
      queueMicrotask(() => {
        setActiveView("settings");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    } else if (window.location.pathname === "/admin" || view === "admin") {
      queueMicrotask(() => {
        setActiveView("admin");
        setActiveAnalysisId(null);
        setActiveAnalysis(null);
      });
    }
  }, [fetchAnalysisDetail, router]);

  // Handle selecting an analysis
  const handleSelect = (id: string) => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveAnalysisId(id);
    setActiveView("analysis");
    window.history.replaceState(
      null,
      "",
      `/?analysis=${encodeURIComponent(id)}`,
    );
    fetchAnalysisDetail(id);
  };

  // Handle new analysis
  const handleNewAnalysis = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("new");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/");
  };

  const handleOpenCVs = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("cvs");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/?view=cvs");
    fetchCVs();
  };

  const handleOpenTemplates = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("templates");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/?view=templates");
    fetchCVs();
  };

  const handleOpenEditor = (cvId?: string | null) => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    const targetCvId = cvId !== undefined ? cvId : null;
    setActiveView("editor");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    setActiveEditorCvId(targetCvId);
    const suffix = targetCvId ? `&cv=${encodeURIComponent(targetCvId)}` : "";
    window.history.replaceState(null, "", `/?view=editor${suffix}`);
    fetchCVs();
  };

  const handleOpenQuestions = (options?: {
    cvId?: string | null;
    analysisId?: string | null;
  }) => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    const cvId = options?.cvId ?? null;
    const analysisId = options?.analysisId ?? null;
    setActiveView("questions");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    setActiveQuestionCvId(cvId);
    setActiveQuestionAnalysisId(analysisId);
    const params = new URLSearchParams("view=questions");
    if (cvId) params.set("cv", cvId);
    if (analysisId) params.set("offer", analysisId);
    window.history.replaceState(null, "", `/?${params.toString()}`);
    void fetchInterviewQuestions();
  };

  const handleOpenJournal = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("journal");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/?view=journal");
  };

  const handleOpenObjectives = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("objectives");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/?view=objectives");
  };

  const handleOpenFeedbackNotes = () => {
    rememberReceivedFeedbackLocation();
    setActiveView("feedback-notes");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    router.push(lastFeedbackNotesHrefRef.current);
  };

  const handleOpenReceivedFeedback = () => {
    rememberFeedbackNotesLocation();
    setActiveView("received-feedback");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    router.push(lastReceivedFeedbackHrefRef.current);
  };

  const handleOpenCVAnalyses = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("cv-analyses");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/?view=cv-analyses");
  };

  const handleOpenJobAnalyses = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("job-analyses");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/?view=job-analyses");
  };

  const handleOpenSettings = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("settings");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/?view=settings");
  };

  const handleOpenAdmin = () => {
    rememberFeedbackNotesLocation();
    rememberReceivedFeedbackLocation();
    setActiveView("admin");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
    window.history.replaceState(null, "", "/admin");
  };

  // Handle analysis creation complete
  const handleAnalysisCreated = (id: string) => {
    setActiveAnalysisId(id);
    setActiveView("analysis");
    window.history.replaceState(
      null,
      "",
      `/?analysis=${encodeURIComponent(id)}`,
    );
    fetchAnalysisDetail(id);
    fetchAnalyses();
    fetchCVs();
    fetchInterviewQuestions();
  };

  // Handle AI analysis complete
  const handleAIComplete = () => {
    if (activeAnalysisId) {
      fetchAnalysisDetail(activeAnalysisId);
      fetchAnalyses();
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const mode =
        analyses.find((analysis) => analysis.id === id)?.analysis_mode ??
        activeAnalysis?.analysis_mode;
      const endpoint =
        mode === "job_match"
          ? `/api/job-match-analyses/${id}`
          : `/api/cv-analyses/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        await fetchAnalyses();
        if (activeAnalysisId === id) {
          setActiveAnalysisId(null);
          setActiveAnalysis(null);
          setActiveView("new");
          window.history.replaceState(null, "", "/");
        }
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090f]">
      {/* Background ambient gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[130px]" />
      </div>

      {/* Sidebar */}
      <Sidebar
        generalAnalyses={analyses.filter(
          (analysis) => analysis.analysis_mode === "general",
        )}
        jobMatchAnalyses={analyses.filter(
          (analysis) => analysis.analysis_mode === "job_match",
        )}
        activeId={activeAnalysisId}
        activeView={activeView}
        onSelect={handleSelect}
        onNewAnalysis={handleNewAnalysis}
        onOpenCVAnalyses={handleOpenCVAnalyses}
        onOpenJobAnalyses={handleOpenJobAnalyses}
        onOpenCVs={handleOpenCVs}
        onOpenTemplates={handleOpenTemplates}
        onOpenEditor={() => handleOpenEditor()}
        onOpenQuestions={() => handleOpenQuestions()}
        onOpenJournal={handleOpenJournal}
        onOpenObjectives={handleOpenObjectives}
        onOpenReceivedFeedback={handleOpenReceivedFeedback}
        onOpenFeedbackNotes={handleOpenFeedbackNotes}
        onOpenSettings={handleOpenSettings}
        onOpenAdmin={handleOpenAdmin}
        onDelete={handleDelete}
        userEmail={userEmail}
        isAdmin={isAdmin}
        isForceCollapsed={activeView === "editor"}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
        <AnimatePresence mode="wait">
          {activeView === "new" ? (
            <motion.div
              key="new-analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <NewAnalysisFlow
                cvs={cvs}
                onCVCreated={fetchCVs}
                onAnalysisCreated={handleAnalysisCreated}
              />
            </motion.div>
          ) : activeView === "cv-analyses" ? (
            <motion.div
              key="cv-analyses-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <CVAnalysesListView
                analyses={analyses.filter((a) => a.analysis_mode === "general")}
                isLoading={analysesLoading && analyses.length === 0}
                onSelect={handleSelect}
                onNewAnalysis={handleNewAnalysis}
                onDelete={handleDelete}
              />
            </motion.div>
          ) : activeView === "job-analyses" ? (
            <motion.div
              key="job-analyses-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <JobAnalysesListView
                analyses={analyses.filter((a) => a.analysis_mode === "job_match")}
                isLoading={analysesLoading && analyses.length === 0}
                onSelect={handleSelect}
                onNewAnalysis={handleNewAnalysis}
                onDelete={handleDelete}
              />
            </motion.div>
          ) : activeView === "cvs" ? (
            <motion.div
              key="cv-library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <CVLibrary
                cvs={cvs}
                analyses={analyses}
                onRefresh={fetchCVs}
                onOpenAnalysis={handleSelect}
                onOpenEditor={handleOpenEditor}
                interviewQuestions={interviewQuestions}
                onOpenQuestions={(cvId) => handleOpenQuestions({ cvId })}
              />
            </motion.div>
          ) : activeView === "templates" ? (
            <motion.div
              key="templates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <TemplatesView
                cvs={cvs}
                geminiApiKey={geminiApiKey}
                hasGeminiApiKey={geminiApiKey.length > 0}
                onOpenSettings={handleOpenSettings}
                onOpenEditor={handleOpenEditor}
                onOpenUpload={handleNewAnalysis}
                onCVUpdated={fetchCVs}
              />
            </motion.div>
          ) : activeView === "editor" ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <CVEditorView
                cvs={cvs.filter((c) => c.type === "template")}
                hasOriginalCVs={cvs.some((c) => c.type === "uploaded")}
                activeVersionId={activeEditorCvId}
                geminiApiKey={geminiApiKey}
                hasGeminiApiKey={geminiApiKey.length > 0}
                onOpenTemplates={handleOpenTemplates}
                onOpenSettings={handleOpenSettings}
                onStartAnalysis={handleNewAnalysis}
                onCVUpdated={fetchCVs}
                onBackToLibrary={handleOpenCVs}
              />
            </motion.div>
          ) : activeView === "questions" ? (
            <motion.div
              key="interview-questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <InterviewQuestionsView
                key={`${activeQuestionCvId ?? "all"}:${activeQuestionAnalysisId ?? "all"}`}
                questions={interviewQuestions}
                cvs={cvs}
                analyses={analyses}
                geminiApiKey={geminiApiKey}
                hasGeminiApiKey={geminiApiKey.length > 0}
                initialCvId={activeQuestionCvId}
                initialAnalysisId={activeQuestionAnalysisId}
                onRefresh={fetchInterviewQuestions}
                onOpenSettings={handleOpenSettings}
                onOpenAnalysis={handleSelect}
              />
            </motion.div>
          ) : activeView === "journal" ? (
            <motion.div
              key="work-journal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <WorkJournalView
                geminiApiKey={geminiApiKey}
                hasGeminiApiKey={geminiApiKey.length > 0}
                onOpenSettings={handleOpenSettings}
              />
            </motion.div>
          ) : activeView === "objectives" ? (
            <motion.div
              key="objectives"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <ObjectivesView />
            </motion.div>
          ) : activeView === "feedback-notes" ? (
            <motion.div
              key="feedback-notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <FeedbackNotesView
                geminiApiKey={geminiApiKey}
                hasGeminiApiKey={geminiApiKey.length > 0}
                onOpenSettings={handleOpenSettings}
              />
            </motion.div>
          ) : activeView === "received-feedback" ? (
            <motion.div
              key="received-feedback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <ReceivedFeedbackView />
            </motion.div>
          ) : activeView === "settings" ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <SettingsView
                geminiApiKey={geminiApiKey}
                onGeminiApiKeyChange={setGeminiApiKey}
                userEmail={userEmail}
              />
            </motion.div>
          ) : activeView === "admin" && isAdmin ? (
            <motion.div
              key="admin-observability"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <AdminObservabilityDashboard userEmail={userEmail} />
            </motion.div>
          ) : loadingDetail ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-6"
            >
              <AnalysisDetailSkeleton />
            </motion.div>
          ) : activeAnalysis ? (
            <motion.div
              key={activeAnalysis.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              {/* Tabs - Extraction / Analysis */}
              {activeAnalysis.ai_score !== null && (
                <div className="shrink-0 flex items-center gap-1 px-4 sm:px-6 pt-4">
                  <button
                    onClick={() => setViewTab("extraction")}
                    className={`
                      flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all
                      ${
                        viewTab === "extraction"
                          ? "bg-white/[0.08] text-zinc-100 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                      }
                    `}
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {analysisFlow("extractionTab")}
                  </button>
                  <button
                    onClick={() => setViewTab("analysis")}
                    className={`
                      flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all
                      ${
                        viewTab === "analysis"
                          ? "bg-white/[0.08] text-zinc-100 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                      }
                    `}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {analysisFlow("analysisTab")}
                  </button>
                </div>
              )}

              {/* View Content */}
              <AnimatePresence mode="wait">
                {viewTab === "extraction" ? (
                  <motion.div
                    key="extraction-view"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex flex-col overflow-hidden min-h-0"
                  >
                    <ExtractionView
                      analysis={activeAnalysis}
                      onAIAnalysisComplete={handleAIComplete}
                      geminiApiKey={geminiApiKey}
                      hasGeminiApiKey={geminiApiKey.length > 0}
                      onOpenSettings={handleOpenSettings}
                    />
                  </motion.div>
                ) : activeAnalysis.ai_score !== null ? (
                  <motion.div
                    key="analysis-view"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 flex flex-col overflow-hidden min-h-0"
                  >
                    <AIAnalysisView
                      analysis={{
                        ai_score: activeAnalysis.ai_score,
                        ai_feedback: activeAnalysis.ai_feedback!,
                        ai_keywords: activeAnalysis.ai_keywords!,
                        ai_improvements: activeAnalysis.ai_improvements!,
                        ai_model: activeAnalysis.ai_model!,
                        ai_analyzed_at: activeAnalysis.ai_analyzed_at!,
                        analysis_mode: activeAnalysis.analysis_mode,
                        job_description: activeAnalysis.job_description,
                        job_url: activeAnalysis.job_url,
                        offer_status: activeAnalysis.offer_status,
                        offer_notes: activeAnalysis.offer_notes,
                        offer_next_action: activeAnalysis.offer_next_action,
                        offer_next_action_at:
                          activeAnalysis.offer_next_action_at,
                        ai_context: activeAnalysis.ai_context,
                        job_key_data: activeAnalysis.job_key_data,
                        job_keywords: activeAnalysis.job_keywords,
                        cv_keywords: activeAnalysis.cv_keywords,
                        matching_keywords: activeAnalysis.matching_keywords,
                        missing_keywords: activeAnalysis.missing_keywords,
                        id: activeAnalysis.id,
                        cv_id: activeAnalysis.cv_id,
                        cv: activeAnalysis.cv,
                        title: activeAnalysis.title,
                        filename: activeAnalysis.filename,
                      }}
                      geminiApiKey={geminiApiKey}
                      hasGeminiApiKey={geminiApiKey.length > 0}
                      onDelete={handleDelete}
                      onUpdate={() => fetchAnalysisDetail(activeAnalysis.id)}
                      interviewQuestions={interviewQuestions.filter(
                        (question) =>
                          question.analysis_id === activeAnalysis.id,
                      )}
                      onInterviewQuestionCreated={fetchInterviewQuestions}
                      onOpenQuestions={() =>
                        handleOpenQuestions({
                          cvId: activeAnalysis.cv_id,
                          analysisId: activeAnalysis.id,
                        })
                      }
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center text-zinc-600">
                <p>{analysisFlow("empty")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

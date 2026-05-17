"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  UploadCloud,
  Zap,
} from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import type { CVDocumentSummaryResponse as CVSummary } from "@/modules/cv-library/client";

interface NewAnalysisFlowProps {
  cvs: CVSummary[];
  onCVCreated: () => void;
  onAnalysisCreated: (analysisId: string) => void;
}

type CVSource = "existing" | "upload";

export default function NewAnalysisFlow({
  cvs,
  onCVCreated,
  onAnalysisCreated,
}: NewAnalysisFlowProps) {
  const t = useTranslations("analysisFlow.newExtraction");
  const [source, setSource] = useState<CVSource>(
    cvs.length > 0 ? "existing" : "upload",
  );
  const [selectedCvId, setSelectedCvId] = useState(cvs[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [cvName, setCvName] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCv = useMemo(
    () => cvs.find((cv) => cv.id === selectedCvId) ?? null,
    [cvs, selectedCvId],
  );

  const getCVSourceLabel = (cv: CVSummary) => {
    if (cv.type === "template") return t("template");
    return cv.filename ?? t("originalPdf");
  };

  const handleFile = (nextFile: File) => {
    if (nextFile.type !== "application/pdf") {
      setError(t("selectPdfOnly"));
      return;
    }
    setFile(nextFile);
    setCvName((current) => current || nextFile.name.replace(/\.pdf$/i, ""));
    setError(null);
  };

  const uploadCV = async () => {
    if (!file) throw new Error(t("selectPdf"));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", cvName.trim() || file.name.replace(/\.pdf$/i, ""));

    const res = await fetch("/api/cvs", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || t("uploadFailed"));
    }
    onCVCreated();
    return data.id as string;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    if (source === "existing" && !selectedCvId) {
      setError(t("chooseSource"));
      return;
    }
    if (source === "upload" && !file) {
      setError(t("selectPdf"));
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const cvId = source === "upload" ? await uploadCV() : selectedCvId;

      const res = await fetch("/api/cv-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvId,
          title: title.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || t("createFailed"));
      }

      onAnalysisCreated(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex w-full max-w-5xl flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
            <Zap className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h1 className="text-3xl font-bold text-zinc-100">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            {t("description")}
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setSource("existing")}
            disabled={cvs.length === 0}
            className={`rounded-xl border p-5 text-left transition-all ${
              source === "existing"
                ? "border-indigo-500/40 bg-indigo-500/10 text-zinc-100"
                : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
            } ${cvs.length === 0 ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <FileText className="mb-4 h-6 w-6 text-indigo-300" />
            <p className="font-semibold">{t("existing")}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {t("existingDescription", { count: cvs.length })}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setSource("upload")}
            data-testid="new-analysis-upload-source"
            className={`rounded-xl border p-5 text-left transition-all ${
              source === "upload"
                ? "border-emerald-500/40 bg-emerald-500/10 text-zinc-100"
                : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
            }`}
          >
            <UploadCloud className="mb-4 h-6 w-6 text-emerald-300" />
            <p className="font-semibold">{t("upload")}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {t("uploadDescription")}
            </p>
          </button>
        </section>

        {source === "existing" ? (
          <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <label className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
              <FileText className="h-4 w-4" />
              CV
            </label>
            <div className="relative">
              <select
                value={selectedCvId}
                onChange={(event) => setSelectedCvId(event.target.value)}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/[0.06] bg-[#0a0a12] px-4 text-sm text-zinc-200 focus:border-indigo-500/40 focus:outline-none"
              >
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name} · {getCVSourceLabel(cv)}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 rotate-90 text-zinc-500" />
            </div>
            {selectedCv && (
              <p className="mt-2 text-xs text-zinc-600">
                {selectedCv.type === "template"
                  ? t("templateVersion")
                  : t("originalPdfName", { filename: selectedCv.filename ?? t("noFilename") })}
              </p>
            )}
          </section>
        ) : (
          <section className="grid gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 md:grid-cols-[1fr_260px]">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                const droppedFile = event.dataTransfer.files[0];
                if (droppedFile) handleFile(droppedFile);
              }}
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                file
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : dragActive
                    ? "border-emerald-400/60 bg-emerald-500/10"
                    : "border-zinc-800/70 hover:border-zinc-700"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                data-testid="new-analysis-file-input"
                className="hidden"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0];
                  if (nextFile) handleFile(nextFile);
                }}
              />
              {file ? (
                <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-300" />
              ) : (
                <UploadCloud className="mb-3 h-8 w-8 text-zinc-500" />
              )}
              <p className="font-medium text-zinc-200">
                {file ? file.name : t("dropPdf")}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : t("clickToSelect")}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                {t("cvName")}
              </label>
              <input
                value={cvName}
                onChange={(event) => setCvName(event.target.value)}
                placeholder={t("cvNamePlaceholder")}
                className="h-11 w-full rounded-xl border border-white/[0.06] bg-[#0a0a12] px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none"
              />
            </div>
          </section>
        )}

        <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <label className="mb-2 block text-sm text-zinc-400">
            {t("extractionName")}
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("extractionNamePlaceholder")}
            className="h-11 w-full rounded-xl border border-white/[0.06] bg-[#0a0a12] px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/40 focus:outline-none"
          />
        </section>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="new-analysis-submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("creating")}
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              {t("create")}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

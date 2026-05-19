"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Star, ChevronRight, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface TabResumenProps {
  improvements: string[];
  keywords: string[];
  jobKeywords: string[];
  cvKeywords: string[];
  matchingKeywords: string[];
  missingKeywords: string[];
}

export default function TabResumen({
  improvements,
  keywords,
  jobKeywords,
  cvKeywords,
  matchingKeywords,
  missingKeywords,
}: TabResumenProps) {
  const t = useTranslations("analysisDetail.summary");

  return (
    <div className="space-y-6">
      {/* Improvements & Keywords */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 shadow-lg shadow-amber-500/[0.02]"
        >
          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-4">
            <Star className="w-4 h-4" />
            {t("improvements")}
          </h4>
          <ul className="space-y-3">
            {improvements.length > 0 ? (
              improvements.map((imp, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-start gap-2.5 text-sm text-zinc-300"
                >
                  <ChevronRight className="w-4 h-4 mt-0.5 text-amber-500/70 shrink-0" />
                  <span>{imp}</span>
                </motion.li>
              ))
            ) : (
              <span className="text-zinc-500 text-sm italic">
                {t("noImprovements")}
              </span>
            )}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            {t("keywordsFound")}
          </h4>
          <div className="mb-4 grid gap-3">
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-500">
                {t("offer")}
              </p>
              <div className="flex flex-wrap gap-2">
                {jobKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-500">{t("cv")}</p>
              <div className="flex flex-wrap gap-2">
                {cvKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.length > 0 ? (
              keywords.map((kw, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                >
                  {kw}
                </motion.span>
              ))
            ) : (
              <span className="text-zinc-500 text-sm italic">
                {t("noKeywords")}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Matching & Missing Keywords */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            {t("matchingKeywords")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {matchingKeywords.length > 0 ? (
              matchingKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
                >
                  {kw}
                </span>
              ))
            ) : (
              <span className="text-sm italic text-zinc-500">
                {t("noMatches")}
              </span>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4" />
            {t("missingKeywords")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.length > 0 ? (
              missingKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300"
                >
                  {kw}
                </span>
              ))
            ) : (
              <span className="text-sm italic text-zinc-500">
                {t("noMissingKeywords")}
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Globe2 } from "lucide-react";
import { useInterfaceLanguage } from "@/components/i18n-provider";
import type { InterfaceLanguage } from "@/i18n/config";

export function InterfaceLanguageSelect({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("settings.language");
  const { locale, setInterfaceLanguage } = useInterfaceLanguage();
  const [pending, setPending] = useState(false);

  async function handleChange(nextLocale: InterfaceLanguage) {
    setPending(true);
    try {
      await setInterfaceLanguage(nextLocale);
    } finally {
      setPending(false);
    }
  }

  return (
    <label className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"} text-zinc-400`}>
      <Globe2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span className="sr-only">{t("label")}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(event) => void handleChange(event.target.value as InterfaceLanguage)}
        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-zinc-200 outline-none transition-colors focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-60"
      >
        <option value="en">{t("options.en")}</option>
        <option value="es">{t("options.es")}</option>
      </select>
    </label>
  );
}

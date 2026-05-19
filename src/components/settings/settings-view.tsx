"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
  UserX,
} from "lucide-react";
import {
  changePasswordWithCurrent,
  deleteAccount,
  signOut,
  type AuthFormState,
} from "@/app/login/actions";
import {
  removeStoredAISettings,
  saveStoredAISettings,
  type StoredAIProvider,
} from "@/lib/browser-preferences";
import { useInterfaceLanguage } from "@/components/shared/i18n-provider";
import type { InterfaceLanguage } from "@/i18n/config";

const INITIAL_STATE: AuthFormState = {};

interface SettingsViewProps {
  aiProvider: StoredAIProvider;
  aiApiKey: string;
  aiModel: string;
  onAISettingsChange: (settings: {
    provider: StoredAIProvider;
    apiKey: string;
    model: string;
  }) => void;
  userEmail: string | null;
}

export default function SettingsView({
  aiProvider,
  aiApiKey,
  aiModel,
  onAISettingsChange,
  userEmail,
}: SettingsViewProps) {
  const t = useTranslations("settings");
  const common = useTranslations("common");
  const { locale, setInterfaceLanguage } = useInterfaceLanguage();
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const [draftProvider, setDraftProvider] = useState<StoredAIProvider>(aiProvider);
  const [draftModel, setDraftModel] = useState(aiModel);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [languageSaved, setLanguageSaved] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordWithCurrent,
    INITIAL_STATE
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccount,
    INITIAL_STATE
  );
  const inputValue = draftValue ?? aiApiKey;

  const keySummary = useMemo(() => {
    if (!aiApiKey) return common("states.notConfigured");
    if (aiApiKey.length <= 12) return common("states.configured");
    return `${aiApiKey.slice(0, 6)}...${aiApiKey.slice(-4)}`;
  }, [common, aiApiKey]);

  const handleLanguageChange = async (nextLocale: InterfaceLanguage) => {
    setLanguageSaved(false);
    setLanguageError(false);
    try {
      await setInterfaceLanguage(nextLocale);
      setLanguageSaved(true);
      window.setTimeout(() => setLanguageSaved(false), 2200);
    } catch {
      setLanguageError(true);
    }
  };

  const handleSave = () => {
    const settings = saveStoredAISettings({
      provider: draftProvider,
      apiKey: inputValue,
      model: draftModel,
    });
    onAISettingsChange(settings);
    setDraftValue(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const handleRemove = () => {
    removeStoredAISettings();
    onAISettingsChange({
      provider: "gemini",
      apiKey: "",
      model: "gemini-3.1-pro-preview",
    });
    setDraftValue("");
    setSaved(false);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-5 border-b border-white/[0.06] pb-6"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
              <KeyRound className="h-3.5 w-3.5" />
              {t("badge")}
            </div>
            <h1 className="text-2xl font-semibold text-zinc-100">
              {t("title")}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <div className="mb-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
              <Globe2 className="h-5 w-5 text-sky-300" />
              {t("language.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {t("language.description")}
            </p>
          </div>
          <label className="block text-sm font-medium text-zinc-300" htmlFor="interface-language">
            {t("language.label")}
          </label>
          <select
            id="interface-language"
            value={locale}
            onChange={(event) => void handleLanguageChange(event.target.value as InterfaceLanguage)}
            className="mt-2 h-11 w-full max-w-xs rounded-xl border border-white/[0.08] bg-[#0a0a12] px-4 text-sm text-zinc-200 outline-none transition-all focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="en">{t("language.options.en")}</option>
            <option value="es">{t("language.options.es")}</option>
          </select>
          {(languageSaved || languageError) && (
            <p className={`mt-3 text-sm ${languageError ? "text-rose-300" : "text-emerald-300"}`}>
              {languageError ? t("language.error") : t("language.saved")}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              {t("apiKey.title")}
            </h2>
            <div className="w-fit rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                {t("apiKey.status")}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-200">
                {keySummary}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-100">
                    {t("apiKey.warningTitle")}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-amber-100/75">
                    {t("apiKey.warningBody")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#0a0a12] p-4">
              <p className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-200">
                <KeyRound className="h-4 w-4 text-indigo-300" />
                {t("apiKey.fieldLabel")}
              </p>
              <div className="mb-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                <select
                  value={draftProvider}
                  onChange={(event) => setDraftProvider(event.target.value as StoredAIProvider)}
                  className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-zinc-200 outline-none transition-all focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"
                >
                  <option value="gemini">Gemini</option>
                  {process.env.NODE_ENV !== "production" && (
                    <option value="mock">Mock</option>
                  )}
                </select>
                <input
                  value={draftModel}
                  onChange={(event) => setDraftModel(event.target.value)}
                  placeholder="gemini-3.1-pro-preview"
                  className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={inputValue}
                    onChange={(event) => {
                      setDraftValue(event.target.value);
                      setSaved(false);
                    }}
                    placeholder={t("apiKey.placeholder")}
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 pr-12 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((value) => !value)}
                    className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
                    title={showKey ? common("actions.hideKey") : common("actions.showKey")}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={draftProvider !== "mock" && !inputValue.trim()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      {common("actions.saved")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {common("actions.save")}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={!aiApiKey && !inputValue}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 text-sm font-semibold text-rose-300 transition-all hover:bg-rose-500/15 hover:text-rose-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                  {common("actions.delete")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <div className="mb-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
              <UserX className="h-5 w-5 text-zinc-400" />
              {t("account.title")}
            </h2>
          </div>

          <div className="space-y-5">
            <form
              action={signOut}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#0a0a12] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <input type="hidden" name="interfaceLanguage" value={locale} />
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {t("account.signOut")}
                </p>
              </div>
              <button
                type="submit"
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-semibold text-zinc-200 transition-all hover:bg-white/[0.07] active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                {t("account.signOut")}
              </button>
            </form>

            <form
              action={passwordAction}
              className="rounded-xl border border-white/[0.06] bg-[#0a0a12] p-4"
            >
              <input type="hidden" name="interfaceLanguage" value={locale} />
              <div className="mb-4">
                <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <LockKeyhole className="h-4 w-4 text-indigo-300" />
                  {t("account.changePassword")}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("account.currentPassword")}
                  required
                  className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"
                />
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("account.newPassword")}
                  minLength={6}
                  required
                  className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"
                />
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("account.repeatNewPassword")}
                  minLength={6}
                  required
                  className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>

              {(passwordState.error || passwordState.message) && (
                <div
                  className={`mt-3 flex gap-2 rounded-xl border px-3 py-2 text-sm ${
                    passwordState.error
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {passwordState.error ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{passwordState.error || passwordState.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={passwordPending}
                className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("account.changePassword")}
              </button>
            </form>

            <form
              action={deleteAction}
              className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4"
            >
              <input type="hidden" name="interfaceLanguage" value={locale} />
              <div className="mb-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-rose-100">
                  <Trash2 className="h-4 w-4" />
                  {t("account.deleteAccount")}
                </p>
                <p className="mt-1 text-xs leading-5 text-rose-100/70">
                  {t("account.deleteWarning")}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  name="emailConfirmation"
                  type="email"
                  autoComplete="email"
                  placeholder={userEmail || t("account.accountEmail")}
                  required
                  className="h-11 rounded-xl border border-rose-500/20 bg-[#0a0a12] px-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-rose-400/40 focus:ring-2 focus:ring-rose-500/10"
                />
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("account.currentPassword")}
                  required
                  className="h-11 rounded-xl border border-rose-500/20 bg-[#0a0a12] px-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-rose-400/40 focus:ring-2 focus:ring-rose-500/10"
                />
              </div>

              {deleteState.error && (
                <div className="mt-3 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{deleteState.error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={deletePending}
                className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 text-sm font-semibold text-rose-100 transition-all hover:bg-rose-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t("account.deleteForever")}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

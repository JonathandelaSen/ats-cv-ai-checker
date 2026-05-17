"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/i18n/messages";
import {
  INTERFACE_LANGUAGE_COOKIE,
  isInterfaceLanguage,
  type InterfaceLanguage,
} from "@/i18n/config";

type InterfaceLanguageContextValue = {
  locale: InterfaceLanguage;
  setInterfaceLanguage: (locale: InterfaceLanguage) => Promise<void>;
};

const InterfaceLanguageContext = createContext<InterfaceLanguageContextValue | null>(null);

function setLanguageCookie(locale: InterfaceLanguage) {
  document.cookie = `${INTERFACE_LANGUAGE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: InterfaceLanguage;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const messages = useMemo(() => getMessages(locale), [locale]);

  const value = useMemo<InterfaceLanguageContextValue>(
    () => ({
      locale,
      async setInterfaceLanguage(nextLocale) {
        if (!isInterfaceLanguage(nextLocale)) return;
        setLocale(nextLocale);
        document.documentElement.lang = nextLocale;
        setLanguageCookie(nextLocale);
        const response = await fetch("/api/user-preferences/interface-language", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        });
        if (!response.ok && response.status !== 401) {
          throw new Error("Could not save interface language preference");
        }
      },
    }),
    [locale],
  );

  return (
    <InterfaceLanguageContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </InterfaceLanguageContext.Provider>
  );
}

export function useInterfaceLanguage() {
  const context = useContext(InterfaceLanguageContext);
  if (!context) {
    throw new Error("useInterfaceLanguage must be used inside I18nProvider");
  }
  return context;
}

"use client";

import { useTranslations } from "next-intl";

export function AuthHeroTitle() {
  const t = useTranslations("auth");

  return (
    <h1 className="text-3xl font-black leading-tight tracking-normal text-zinc-50">
      {t("hero")}
    </h1>
  );
}

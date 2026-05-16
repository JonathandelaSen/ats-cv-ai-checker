import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_INTERFACE_LANGUAGE,
  INTERFACE_LANGUAGE_COOKIE,
  isInterfaceLanguage,
  resolveBrowserLanguage,
  type InterfaceLanguage,
} from "./config";

export async function getUserInterfaceLanguagePreference(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("interface_language")
    .eq("user_id", userId)
    .maybeSingle();

  return isInterfaceLanguage(data?.interface_language)
    ? data.interface_language
    : null;
}

export async function resolveInterfaceLanguage(): Promise<InterfaceLanguage> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const preference = await getUserInterfaceLanguagePreference(user.id);
    if (preference) return preference;
  }

  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(INTERFACE_LANGUAGE_COOKIE)?.value;
  if (isInterfaceLanguage(cookieLanguage)) return cookieLanguage;

  const headersList = await headers();
  return (
    resolveBrowserLanguage(headersList.get("accept-language")) ??
    DEFAULT_INTERFACE_LANGUAGE
  );
}

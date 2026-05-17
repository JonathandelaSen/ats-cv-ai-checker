import { AuthForm } from "@/components/auth/auth-form";
import { AuthHeroTitle } from "@/components/auth/auth-hero-title";
import { getMessages } from "@/i18n/messages";
import { resolveInterfaceLanguage } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{
    accountDeleted?: string;
    resetError?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = await resolveInterfaceLanguage();
  const messages = getMessages(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="min-h-screen overflow-hidden bg-[#09090f] text-zinc-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 top-[-280px] mx-auto h-[520px] max-w-4xl bg-indigo-600/[0.08] blur-[150px]" />
        <div className="absolute inset-x-0 bottom-[-320px] mx-auto h-[520px] max-w-3xl bg-violet-600/[0.06] blur-[150px]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-10">
        <section className="w-full max-w-[460px]">
          <div className="mb-7 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">JulyLog</span>
          </div>

          <div className="mb-6 text-center">
            <AuthHeroTitle />
          </div>

          <AuthForm
            initialError={
              params.resetError
                ? messages.auth.resetInvalid
                : undefined
            }
            initialMessage={
              params.accountDeleted
                ? messages.auth.accountDeleted
                : undefined
            }
          />
        </section>
      </div>
    </main>
  );
}

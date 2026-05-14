import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type RequestSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type AuthenticatedRequestContext =
  | {
      ok: true;
      supabase: RequestSupabaseClient;
      user: User;
    }
  | {
      ok: false;
      supabase: RequestSupabaseClient;
      user: null;
      response: NextResponse<{ error: string }>;
    };

export async function getAuthenticatedRequestContext(): Promise<AuthenticatedRequestContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      supabase,
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, supabase, user };
}

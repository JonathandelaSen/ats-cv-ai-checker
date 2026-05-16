import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { errorResponse, handleApiError, ok } from "@/modules/shared";
import { isInterfaceLanguage } from "@/i18n/config";

export async function PUT(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    if (!isInterfaceLanguage(body?.locale)) {
      return errorResponse({
        message: "Invalid interface language.",
        status: 400,
      });
    }

    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        interface_language: body.locale,
      },
      { onConflict: "user_id" },
    );

    if (error) throw error;

    return ok({ interface_language: body.locale });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  isAdminUser,
  listProcessingEvents,
} from "@/lib/observability";
import { parseListProcessingEventsRequest } from "./validation";
import { ok, forbidden, handleApiError } from "@/modules/shared";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { user } = authContext;

    const isAdmin = await isAdminUser(user.id);
    if (!isAdmin) {
      throw forbidden("Forbidden");
    }

    const parsed = parseListProcessingEventsRequest(req.nextUrl.searchParams);
    const events = await listProcessingEvents(parsed.value);

    return ok({ events });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

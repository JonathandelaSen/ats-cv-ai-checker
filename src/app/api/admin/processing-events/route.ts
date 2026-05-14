import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  isAdminUser,
  listProcessingEvents,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { parseListProcessingEventsRequest } from "./validation";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { user } = authContext;

    const isAdmin = await isAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = parseListProcessingEventsRequest(req.nextUrl.searchParams);
    const events = await listProcessingEvents(parsed.value);

    return NextResponse.json({ events });
  } catch (error: unknown) {
    console.error("Admin processing events error:", error);
    return NextResponse.json(
      { error: "Failed to load processing events", details: sanitizeErrorMessage(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { ContextNotFoundError } from "@/modules/work-journal/domain/errors/context-not-found.error";
import { ContextArchivedError } from "@/modules/work-journal/domain/errors/context-archived.error";
import { EntryNotFoundError } from "@/modules/work-journal/domain/errors/entry-not-found.error";
import { getErrorMessage } from "@/lib/errors";

export function handleDomainError(error: unknown): NextResponse {
  if (error instanceof ContextNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ContextArchivedError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof EntryNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
}

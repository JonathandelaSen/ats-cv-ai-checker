import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";

export function handleDomainError(error: unknown): NextResponse {
  if (hasErrorName(error, "ContextNotFoundError")) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (hasErrorName(error, "ContextArchivedError")) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (hasErrorName(error, "EntryNotFoundError")) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
}

function hasErrorName(error: unknown, name: string): error is Error {
  return error instanceof Error && error.name === name;
}

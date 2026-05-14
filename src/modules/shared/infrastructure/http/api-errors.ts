import { NextResponse } from "next/server";
import { DomainError } from "../../domain/errors/domain-error";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function notFound(message: string): never {
  throw new HttpError(404, message);
}

export function badRequest(message: string): never {
  throw new HttpError(400, message);
}

export function forbidden(message: string): never {
  throw new HttpError(403, message);
}

export function conflict(message: string): never {
  throw new HttpError(409, message);
}

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

export function errorResponse(error: {
  message: string;
  status: number;
}): NextResponse<{ error: string }> {
  return NextResponse.json({ error: error.message }, { status: error.status });
}

export function handleApiError(error: unknown): NextResponse<{ error: string }> {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof DomainError) {
    const status = error.name.endsWith("NotFoundError") ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}

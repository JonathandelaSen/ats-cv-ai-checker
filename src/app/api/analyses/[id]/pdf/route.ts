import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      error:
        "Use /api/cv-analyses/:id/pdf or /api/job-match-analyses/:id/pdf for typed analysis PDFs.",
    },
    { status: 410 },
  );
}

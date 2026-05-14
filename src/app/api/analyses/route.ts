import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      error:
        "Use /api/cv-analyses and /api/job-match-analyses for typed analysis lists.",
    },
    { status: 410 },
  );
}

export function POST() {
  return NextResponse.json(
    {
      error:
        "Use /api/cv-analyses or /api/job-match-analyses to create typed analyses.",
    },
    { status: 410 },
  );
}

export function DELETE() {
  return NextResponse.json(
    {
      error:
        "Use /api/cv-analyses or /api/job-match-analyses to delete typed analysis lists.",
    },
    { status: 410 },
  );
}

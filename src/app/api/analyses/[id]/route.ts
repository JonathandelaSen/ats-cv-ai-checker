import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      error:
        "Use /api/cv-analyses/:id or /api/job-match-analyses/:id for typed analysis detail.",
    },
    { status: 410 },
  );
}

export function PATCH() {
  return NextResponse.json(
    {
      error:
        "Use /api/job-match-analyses/:id for job match analysis updates.",
    },
    { status: 410 },
  );
}

export function DELETE() {
  return NextResponse.json(
    {
      error:
        "Use /api/cv-analyses/:id or /api/job-match-analyses/:id for typed analysis deletion.",
    },
    { status: 410 },
  );
}

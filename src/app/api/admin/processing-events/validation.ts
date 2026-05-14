export function parseListProcessingEventsRequest(params: URLSearchParams) {
  const limit = Number(params.get("limit") ?? "100");
  return {
    ok: true,
    value: {
      status: params.get("status"),
      stage: params.get("stage"),
      cvId: params.get("cvId"),
      analysisId: params.get("analysisId"),
      requestId: params.get("requestId"),
      limit: Number.isFinite(limit) ? limit : 100,
    },
  } as const;
}

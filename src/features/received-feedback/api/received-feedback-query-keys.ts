export const receivedFeedbackQueryKeys = {
  all: ["received-feedback"] as const,
  feedback: () => [...receivedFeedbackQueryKeys.all, "feedback"] as const,
  contexts: () => [...receivedFeedbackQueryKeys.all, "contexts"] as const,
};

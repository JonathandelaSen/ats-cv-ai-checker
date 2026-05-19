export const activityContextQueryKeys = {
  all: ["activity-contexts"] as const,
  lists: () => [...activityContextQueryKeys.all, "list"] as const,
};

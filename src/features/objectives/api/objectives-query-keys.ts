export const objectivesQueryKeys = {
  all: ["objectives"] as const,
  workspace: () => [...objectivesQueryKeys.all, "workspace"] as const,
};

export type ActivityContextResponseType =
  | "project"
  | "employment"
  | "personal"
  | "other";
export type ActivityContextResponseStatus = "active" | "archived";

export interface ActivityContextResponse {
  id: string;
  userId: string;
  name: string;
  type: ActivityContextResponseType;
  status: ActivityContextResponseStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ListActivityContextsResponse = {
  contexts: ActivityContextResponse[];
};

export type CreateActivityContextResponse = ActivityContextResponse;

interface ActivityContextPresenterOutput {
  id: string;
  userId: string;
  name: string;
  type: ActivityContextResponseType;
  status: ActivityContextResponseStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toActivityContextResponse(
  input: ActivityContextPresenterOutput
): ActivityContextResponse {
  return {
    id: input.id,
    userId: input.userId,
    name: input.name,
    type: input.type,
    status: input.status,
    isDefault: input.isDefault,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

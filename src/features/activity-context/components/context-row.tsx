"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Archive,
  Briefcase,
  Check,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ActivityContext,
  ActivityContextType,
  UpdateActivityContextInput,
} from "../api/activity-context-api";

const TYPE_OPTIONS: [ActivityContextType, string][] = [
  ["employment", "employment"],
  ["project", "project"],
  ["personal", "personal"],
  ["other", "other"],
];

const TYPE_ICONS: Record<ActivityContextType, React.ReactNode> = {
  employment: <Briefcase className="h-3.5 w-3.5" />,
  project: <FolderOpen className="h-3.5 w-3.5" />,
  personal: <User className="h-3.5 w-3.5" />,
  other: <MoreHorizontal className="h-3.5 w-3.5" />,
};

interface ContextRowProps {
  context: ActivityContext;
  hasReturnTo: boolean;
  onSelect: (ctx: ActivityContext) => void;
  onUpdate: (id: string, updates: UpdateActivityContextInput) => Promise<unknown>;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

export function ContextRow({
  context,
  hasReturnTo,
  onSelect,
  onUpdate,
  onDelete,
  isUpdating,
}: ContextRowProps) {
  const t = useTranslations("activityContexts");
  const [editState, setEditState] = useState<{
    name: string;
    type: ActivityContextType;
  } | null>(null);

  const handleSaveEdit = async () => {
    if (!editState || !editState.name.trim()) return;
    await onUpdate(context.id, { name: editState.name.trim(), type: editState.type });
    setEditState(null);
  };

  if (editState) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <select
          className="h-8 w-28 shrink-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          value={editState.type}
          onChange={(e) =>
            setEditState({ ...editState, type: e.target.value as ActivityContextType })
          }
        >
          {TYPE_OPTIONS.map(([value, key]) => (
            <option key={value} value={value} className="bg-zinc-900">
              {t(`contextTypes.${key}`)}
            </option>
          ))}
        </select>
        <input
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          value={editState.name}
          onChange={(e) => setEditState({ ...editState, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSaveEdit();
            if (e.key === "Escape") setEditState(null);
          }}
          autoFocus
        />
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => void handleSaveEdit()}
          disabled={isUpdating || !editState.name.trim()}
          className="shrink-0 text-emerald-400 hover:text-emerald-300"
        >
          {isUpdating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setEditState(null)}
          className="shrink-0 text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-500">
        {TYPE_ICONS[context.type]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-100">
            {context.name}
          </span>
          {context.isDefault && (
            <Badge
              variant="outline"
              className="border-sky-500/30 px-1.5 py-0 text-[10px] text-sky-300"
            >
              {t("badges.default")}
            </Badge>
          )}
          {context.status === "archived" && (
            <Badge
              variant="outline"
              className="border-zinc-600/40 px-1.5 py-0 text-[10px] text-zinc-500"
            >
              {t("badges.archived")}
            </Badge>
          )}
        </div>
        <span className="text-xs text-zinc-600">
          {t(`contextTypes.${context.type}`)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {hasReturnTo && context.status === "active" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelect(context)}
            className="gap-1 text-zinc-400 hover:text-emerald-300"
          >
            <Check className="h-3.5 w-3.5" />
            {t("selectAndReturn")}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-zinc-500 hover:text-zinc-200"
              />
            }
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem
              onClick={() =>
                setEditState({ name: context.name, type: context.type })
              }
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                void onUpdate(context.id, {
                  status: context.status === "active" ? "archived" : "active",
                })
              }
            >
              {context.status === "active" ? (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  {t("actions.archive")}
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("actions.restore")}
                </>
              )}
            </DropdownMenuItem>
            {!context.isDefault && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(context.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

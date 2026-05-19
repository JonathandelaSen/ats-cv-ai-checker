"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityContextType } from "../api/activity-context-api";

const TYPE_OPTIONS: [ActivityContextType, string][] = [
  ["employment", "employment"],
  ["project", "project"],
  ["personal", "personal"],
  ["other", "other"],
];

interface CreateContextFormProps {
  isPending: boolean;
  hasReturnTo: boolean;
  onCreate: (input: { name: string; type: ActivityContextType }) => void;
}

export function CreateContextForm({ isPending, hasReturnTo, onCreate }: CreateContextFormProps) {
  const t = useTranslations("activityContexts");
  const [name, setName] = useState("");
  const [type, setType] = useState<ActivityContextType>("project");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), type });
    setName("");
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-8 w-28 shrink-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        value={type}
        onChange={(e) => setType(e.target.value as ActivityContextType)}
      >
        {TYPE_OPTIONS.map(([value, key]) => (
          <option key={value} value={value} className="bg-zinc-900">
            {t(`contextTypes.${key}`)}
          </option>
        ))}
      </select>
      <input
        className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        placeholder={t("placeholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
        }}
      />
      <Button
        size="default"
        onClick={handleCreate}
        disabled={isPending || !name.trim()}
        className="shrink-0 gap-1.5"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        {hasReturnTo ? t("createAndReturn") : t("create")}
      </Button>
    </div>
  );
}

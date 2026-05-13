"use client";

import { motion } from "framer-motion";
import { CalendarClock, Loader2, Check } from "lucide-react";
import { OFFER_STATUSES, type OfferStatus } from "@/lib/analysis-types";

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  interesante: "Interesante",
  aplicado: "Aplicado",
  entrevista: "Entrevista",
  oferta: "Oferta",
  rechazado: "Rechazado",
  descartado: "Descartado",
};

interface TabSeguimientoProps {
  offerStatus: OfferStatus;
  onOfferStatusChange: (status: OfferStatus) => void;
  offerNotes: string;
  onOfferNotesChange: (notes: string) => void;
  offerNextAction: string;
  onOfferNextActionChange: (action: string) => void;
  offerNextActionAt: string;
  onOfferNextActionAtChange: (date: string) => void;
  isSavingTracking: boolean;
  onSaveTracking: () => void;
}

export default function TabSeguimiento({
  offerStatus,
  onOfferStatusChange,
  offerNotes,
  onOfferNotesChange,
  offerNextAction,
  onOfferNextActionChange,
  offerNextActionAt,
  onOfferNextActionAtChange,
  isSavingTracking,
  onSaveTracking,
}: TabSeguimientoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <section className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.025] p-5 max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-300">
                Seguimiento de oferta
              </h4>
              <p className="text-xs text-zinc-500">Estado y próxima acción.</p>
            </div>
          </div>
          <button
            onClick={onSaveTracking}
            disabled={isSavingTracking}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {isSavingTracking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {isSavingTracking ? "Guardando..." : "Guardar"}
          </button>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Estado
              </span>
              <select
                value={offerStatus}
                onChange={(event) =>
                  onOfferStatusChange(event.target.value as OfferStatus)
                }
                className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#0a0a12] px-3 text-sm text-zinc-200 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              >
                {OFFER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {OFFER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Fecha
              </span>
              <input
                type="datetime-local"
                value={offerNextActionAt}
                onChange={(event) =>
                  onOfferNextActionAtChange(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#0a0a12] px-3 text-sm text-zinc-200 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              />
            </label>
          </div>
          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Próxima acción
            </span>
            <input
              type="text"
              value={offerNextAction}
              onChange={(event) => onOfferNextActionChange(event.target.value)}
              placeholder="Ej. Enviar follow-up al recruiter"
              className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#0a0a12] px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Nota
            </span>
            <textarea
              value={offerNotes}
              onChange={(event) => onOfferNotesChange(event.target.value)}
              placeholder="Añade contexto del proceso, recruiter, condiciones o dudas."
              rows={7}
              className="w-full resize-none rounded-lg border border-white/[0.06] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
          </label>
        </div>
      </section>
    </motion.div>
  );
}

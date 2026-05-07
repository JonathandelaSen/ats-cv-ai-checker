"use client";

import { motion } from "framer-motion";
import { ListChecks, Briefcase, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { JobKeyData } from "@/lib/db";

interface TabOfertaProps {
  jobKeyData: JobKeyData | null;
  jobDescription: string | null;
}

export default function TabOferta({
  jobKeyData,
  jobDescription,
}: TabOfertaProps) {
  return (
    <div className="space-y-6">
      {jobKeyData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <h4 className="text-sm font-semibold text-sky-300 flex items-center gap-2 mb-4">
            <ListChecks className="w-4 h-4" />
            Datos clave de la oferta
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            {(
              [
                ["Puesto", jobKeyData.title],
                ["Empresa", jobKeyData.company],
                ["Ubicación", jobKeyData.location],
                ["Modalidad", jobKeyData.remote],
                ["Salario", jobKeyData.salary],
                ["Seniority", jobKeyData.seniority],
                ["Contrato", jobKeyData.contractType],
              ] as Array<[string, string | null | undefined]>
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.04] bg-[#0a0a12] p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {label}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  {value || "No indicado"}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(
              [
                ["Requisitos", jobKeyData.requirements],
                ["Responsabilidades", jobKeyData.responsibilities],
                ["Beneficios", jobKeyData.benefits],
                ["Puntos relevantes", jobKeyData.notablePoints],
              ] as Array<[string, string[] | undefined]>
            ).map(([label, values]) => {
              const list = Array.isArray(values) ? values : [];
              return (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.04] bg-[#0a0a12] p-4"
                >
                  <p className="mb-3 text-xs font-semibold text-zinc-300">
                    {label}
                  </p>
                  {list.length > 0 ? (
                    <ul className="space-y-2">
                      {list.map((item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="flex gap-2 text-xs text-zinc-400"
                        >
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-zinc-600">No indicado.</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {jobDescription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-6"
        >
          <Accordion>
            <AccordionItem
              className="border-none"
            >
              <AccordionTrigger className="py-0 hover:no-underline">
                <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Descripción completa de la oferta
                </h4>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="text-sm text-zinc-400 bg-[#0a0a12] rounded-xl p-4 border border-white/[0.04] whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {jobDescription}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@kostas/ui";
import type { ProjectViewData } from "../types";

interface Section {
  id: string;
  title: string;
  render: (project: ProjectViewData) => React.ReactNode;
}

export function DesktopAccordion({
  project,
  sections,
}: {
  project: ProjectViewData;
  sections: Section[];
}) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div className="hidden flex-col gap-2 md:flex" data-testid="desktop-accordion">
      {sections.map((section) => {
        const open = openId === section.id;
        return (
          <div key={section.id} className="rounded-lg border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
              onClick={() => setOpenId(open ? null : section.id)}
              aria-expanded={open}
            >
              {section.title}
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
                <ChevronDown className="size-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("overflow-hidden")}
                >
                  <div className="border-t border-border px-4 py-3 text-sm">
                    {section.render(project)}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

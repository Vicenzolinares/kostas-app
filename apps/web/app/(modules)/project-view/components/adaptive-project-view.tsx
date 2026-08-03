"use client";

import { motion } from "framer-motion";
import { DesktopAccordion } from "./desktop-accordion";
import { MobileCardSlider } from "./mobile-card-slider";
import { PROJECT_VIEW_SECTIONS } from "../lib/sections";
import type { ProjectViewData } from "../types";

export function AdaptiveProjectView({ project }: { project: ProjectViewData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4"
    >
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.clientName}</p>
      </div>
      <DesktopAccordion project={project} sections={PROJECT_VIEW_SECTIONS} />
      <MobileCardSlider project={project} sections={PROJECT_VIEW_SECTIONS} />
    </motion.div>
  );
}

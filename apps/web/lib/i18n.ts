import type { DepartmentKey, BlockedReason } from "@kostas/shared/schemas";

/**
 * Minimal EN/ES dictionary for the shop-floor and employee-facing screens.
 *
 * Deliberately not a full i18n library: the bilingual requirement covers a
 * fixed set of operational screens (department TVs, employee portal), not
 * the whole office app, and the mockups call for a third "EN + ES" mode
 * that shows both languages at once — something react-intl/next-intl model
 * awkwardly. A typed record plus `label()` covers it in a few lines, with
 * the compiler catching any key that's missing a translation.
 *
 * Content that the office authors per job (task names, project titles,
 * notes) is NOT translated here — it's stored per-language on the row
 * itself. See ProductionTask in @kostas/shared/schemas.
 */

export type Language = "en" | "es" | "both";

export const LANGUAGES: { value: Language; short: string; label: string }[] = [
  { value: "en", short: "EN", label: "English" },
  { value: "es", short: "ES", label: "Español" },
  { value: "both", short: "EN + ES", label: "English + Español" },
];

const DICTIONARY = {
  // Board columns
  workingNow: ["Working Now", "Trabajando Ahora"],
  upNext: ["Up Next", "Siguiente"],
  needsAttention: ["Needs Attention", "Requiere Atención"],
  // Cards
  todaysTasks: ["Today's Tasks", "Tareas de Hoy"],
  progress: ["Progress", "Progreso"],
  due: ["Due", "Vence"],
  rush: ["Rush", "Urgente"],
  more: ["more", "más"],
  unassigned: ["Unassigned", "Sin Asignar"],
  // Department progress
  departmentProgress: ["Department Progress", "Progreso del Departamento"],
  today: ["Today", "Hoy"],
  tasksCompleted: ["Tasks Completed", "Tareas Completadas"],
  // Notifications
  liveNotifications: ["Live Notifications", "Notificaciones en Vivo"],
  notificationsExpire: [
    "New messages will disappear in 10 seconds.",
    "Los nuevos mensajes desaparecerán en 10 segundos.",
  ],
  noNotifications: ["No recent activity.", "Sin actividad reciente."],
  // Blocked reasons
  waitingForFabric: ["Waiting for Fabric", "Esperando Tela"],
  waitingForHardware: ["Waiting for Hardware", "Esperando Herrajes"],
  waitingForOfficeApproval: [
    "Waiting for Office Approval",
    "Esperando Aprobación de Oficina",
  ],
  waitingForMaterials: ["Waiting for Materials", "Esperando Materiales"],
  waitingOther: ["On Hold", "En Espera"],
  // Legend
  key: ["Key", "Leyenda"],
  onSchedule: ["On Schedule", "Al Día"],
  dueSoon: ["Due Soon", "Vence Pronto"],
  behindSchedule: ["Behind Schedule", "Atrasado"],
  waiting: ["Waiting", "Esperando"],
  officeHold: ["Office Hold", "En Espera (Oficina)"],
  completed: ["Completed", "Completado"],
  language: ["Language", "Idioma"],
  selectLanguage: ["Select Language", "Seleccionar Idioma"],
  // States
  // Notification sentence frames. `{project}` and `{room}` are substituted
  // at render time; keeping the whole sentence per-language avoids the
  // word-order assumptions that string concatenation would bake in.
  noteDone: [
    "{project} completed in {room}.",
    "{project} completado en {room}.",
  ],
  noteBlocked: [
    "{project} is waiting in {room}.",
    "{project} está esperando en {room}.",
  ],
  noteStarted: ["{project} started in {room}.", "{project} comenzó en {room}."],
  noteMoved: ["{project} queued for {room}.", "{project} en cola para {room}."],
  nothingHere: ["Nothing here right now.", "Nada por ahora."],
  loading: ["Loading…", "Cargando…"],
  loadFailed: ["Could not load the board.", "No se pudo cargar el tablero."],
  allDepartments: ["All Departments", "Todos los Departamentos"],
  updated: ["Updated", "Actualizado"],
  exitFullscreen: ["Exit Fullscreen", "Salir de Pantalla Completa"],
  fullscreen: ["Fullscreen", "Pantalla Completa"],
} satisfies Record<string, readonly [string, string]>;

export type MessageKey = keyof typeof DICTIONARY;

/** Room names, kept here so the TV header can render them bilingually. */
const DEPARTMENT_NAMES: Record<DepartmentKey, readonly [string, string]> = {
  seamstress: ["Seamstress Room", "Sala de Costura"],
  upholstery: ["Upholstery Room", "Sala de Tapicería"],
  carpentry: ["Carpentry Room", "Sala de Carpintería"],
  paint: ["Paint Department", "Departamento de Pintura"],
  warehouse: ["Warehouse", "Almacén"],
  office: ["In The Office", "En la Oficina"],
};

const BLOCKED_REASON_KEYS: Record<BlockedReason, MessageKey> = {
  fabric: "waitingForFabric",
  hardware: "waitingForHardware",
  office_approval: "waitingForOfficeApproval",
  materials: "waitingForMaterials",
  other: "waitingOther",
};

/** Joins the two languages the way the mockup's "EN + ES" mode shows them. */
function render(pair: readonly [string, string], lang: Language): string {
  if (lang === "en") return pair[0];
  if (lang === "es") return pair[1];
  return `${pair[0]} / ${pair[1]}`;
}

export function label(key: MessageKey, lang: Language): string {
  return render(DICTIONARY[key], lang);
}

export function departmentName(key: DepartmentKey, lang: Language): string {
  return render(DEPARTMENT_NAMES[key], lang);
}

export function blockedReasonLabel(
  reason: BlockedReason,
  lang: Language,
): string {
  return label(BLOCKED_REASON_KEYS[reason], lang);
}

/**
 * Renders a notification sentence in each requested language, substituting
 * the project title and room name. Returns one line per language so "both"
 * mode can stack them.
 */
export function notificationLines(
  key: Extract<MessageKey, `note${string}`>,
  values: { project: string; departmentKey: DepartmentKey },
  lang: Language,
): string[] {
  const langs: ("en" | "es")[] = lang === "both" ? ["en", "es"] : [lang];
  return langs.map((one) => {
    const index = one === "en" ? 0 : 1;
    return DICTIONARY[key][index]
      .replace("{project}", values.project)
      .replace("{room}", DEPARTMENT_NAMES[values.departmentKey][index]);
  });
}

/** Picks the right side of a per-row bilingual string (e.g. a task name). */
export function bilingual(
  value: { en: string; es: string },
  lang: Language,
): string {
  return render([value.en, value.es], lang);
}

/** Locale for date/time formatting — "both" follows English. */
export function localeFor(lang: Language): string {
  return lang === "es" ? "es-ES" : "en-US";
}

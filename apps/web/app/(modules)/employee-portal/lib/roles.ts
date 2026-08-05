import type { UserRole } from "@kostas/shared/schemas";
import type { Language } from "@/lib/i18n";

/**
 * Shop-floor job titles, bilingual.
 *
 * Separate from the office app's role labels: a `shop_floor` account reads
 * as "Shop Floor" in Settings, but the deck's kiosk shows the trade —
 * Upholsterer / Tapicero. Same enum, different audience.
 */
const TITLES: Record<UserRole, readonly [string, string]> = {
  admin: ["Office Admin", "Administrador"],
  manager: ["Supervisor", "Supervisor"],
  sales: ["Sales", "Ventas"],
  designer: ["Designer", "Diseñador"],
  shop_floor: ["Upholsterer", "Tapicero"],
  employee: ["Employee", "Empleado"],
};

export function roleTitle(role: UserRole, lang: Language): string {
  const pair = TITLES[role];
  if (lang === "en") return pair[0];
  if (lang === "es") return pair[1];
  // Spanish and English coincide for some titles; showing "Supervisor /
  // Supervisor" reads as a rendering bug, so identical pairs collapse.
  return pair[0] === pair[1] ? pair[0] : `${pair[0]} / ${pair[1]}`;
}

import { label, type Language, type MessageKey } from "@/lib/i18n";

/** Colour key from the mockup, so a new hire can read the board unaided. */
const ENTRIES: { key: MessageKey; dot: string }[] = [
  { key: "onSchedule", dot: "bg-emerald-500" },
  { key: "dueSoon", dot: "bg-amber-400" },
  { key: "behindSchedule", dot: "bg-red-500" },
  { key: "waiting", dot: "bg-sky-400" },
  { key: "officeHold", dot: "bg-indigo-400" },
  { key: "completed", dot: "bg-slate-400" },
];

export function BoardLegend({ lang }: { lang: Language }) {
  return (
    <section
      className="rounded-lg bg-slate-800/60 p-3"
      data-testid="board-legend"
    >
      <h2 className="text-xs font-bold uppercase tracking-wide text-white">
        {label("key", lang)}
      </h2>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {ENTRIES.map((entry) => (
          <li
            key={entry.key}
            className="flex items-center gap-2 text-xs text-slate-300"
          >
            <span
              className={`size-2.5 shrink-0 rounded-full ${entry.dot}`}
              aria-hidden
            />
            <span className="truncate">{label(entry.key, lang)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

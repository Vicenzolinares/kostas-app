"use client";

import { LANGUAGES, type Language } from "@/lib/i18n";

/**
 * Persistent EN / ES / EN+ES switch.
 *
 * The deck puts this at the top of every employee screen rather than in
 * settings — staff share tablets mid-shift, so the language has to be
 * switchable in one tap by whoever picked the device up.
 */
export function LanguageToggle({
  value,
  onChange,
  tone = "light",
}: {
  value: Language;
  onChange: (next: Language) => void;
  tone?: "light" | "dark";
}) {
  const base =
    tone === "dark"
      ? {
          shell: "bg-white/10",
          active: "bg-white text-[#101a33]",
          idle: "text-white/70 hover:text-white",
        }
      : {
          shell: "bg-muted",
          active: "bg-card text-foreground shadow-sm",
          idle: "text-muted-foreground hover:text-foreground",
        };

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-1 rounded-full p-1 ${base.shell}`}
    >
      {LANGUAGES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === option.value ? base.active : base.idle
          }`}
        >
          {option.value === "both" ? option.short : option.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Delete, User } from "lucide-react";
import type { UserRole } from "@kostas/shared/schemas";
import { KostasMonogram } from "@/components/kostas-logo";
import { label, labelWith, type Language } from "@/lib/i18n";
import { signInWithPinAction } from "@/app/employee-login/actions";
import { LanguageToggle } from "./language-toggle";
import { roleTitle } from "../lib/roles";

interface KioskEmployee {
  id: string;
  name: string;
  role: UserRole;
}

const PIN_LENGTH = 4;

/** Letters under each digit, as on a phone keypad — the deck shows them. */
const KEYPAD = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

/** Initials avatar. The deck shows photographs; there are no employee photos in the schema. */
function Avatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-white/15 font-semibold text-white ${className}`}
    >
      {initials}
    </span>
  );
}

export function KioskLogin({ employees }: { employees: KioskEmployee[] }) {
  const [lang, setLang] = useState<Language>("both");
  const [selected, setSelected] = useState<KioskEmployee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(nextPin: string) {
    if (!selected) return;
    startTransition(async () => {
      const result = await signInWithPinAction({
        userId: selected.id,
        pin: nextPin,
      });
      // A successful sign-in redirects, so reaching here means it failed.
      if (result?.error) {
        setError(label("incorrectPin", lang));
        setPin("");
      }
    });
  }

  function press(digit: string) {
    if (pin.length >= PIN_LENGTH || pending) return;
    const next = pin + digit;
    setError(null);
    setPin(next);
    if (next.length === PIN_LENGTH) submit(next);
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#101a33] px-5 py-10 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <KostasMonogram className="h-16 w-16 text-white" />
          <p
            className="text-lg font-semibold tracking-[0.1em]"
            style={{ fontKerning: "none" }}
          >
            KOSTAS
          </p>
          <p className="text-[0.65rem] tracking-[0.25em] text-white/60">
            UPHOLSTERY
          </p>
        </div>

        <LanguageToggle value={lang} onChange={setLang} tone="dark" />

        {selected === null ? (
          <section className="w-full">
            <h1 className="mb-3 text-center text-sm font-medium text-white/80">
              {label("employeeLogin", lang)}
            </h1>
            <ul className="flex flex-col gap-2">
              {employees.map((employee) => (
                <li key={employee.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(employee);
                      setPin("");
                      setError(null);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
                  >
                    <Avatar
                      name={employee.name}
                      className="h-10 w-10 text-sm"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {employee.name}
                      </span>
                      <span className="block text-xs text-white/60">
                        {roleTitle(employee.role, lang)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="/login"
                  className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">
                    {label("otherEmployee", lang)}
                  </span>
                </a>
              </li>
            </ul>
          </section>
        ) : (
          <section className="w-full">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setPin("");
                setError(null);
              }}
              className="mb-4 flex items-center gap-1 text-xs text-white/60 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              {label("back", lang)}
            </button>

            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-semibold">
                {labelWith(
                  "welcomeBack",
                  { name: selected.name.split(" ")[0] ?? selected.name },
                  lang,
                )}
              </p>
              <p className="text-xs text-white/60">
                {label("enterYourPin", lang)}
              </p>
            </div>

            <div className="my-6 flex justify-center gap-3" aria-hidden>
              {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    index < pin.length ? "bg-white" : "bg-white/25"
                  }`}
                />
              ))}
            </div>

            {error ? (
              <p
                role="alert"
                className="mb-4 text-center text-xs font-medium text-red-300"
              >
                {error}
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-3">
              {KEYPAD.map((key) => (
                <button
                  key={key.digit}
                  type="button"
                  disabled={pending}
                  onClick={() => press(key.digit)}
                  className="flex h-16 flex-col items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/15 disabled:opacity-50"
                >
                  <span className="text-xl font-medium">{key.digit}</span>
                  <span className="text-[0.6rem] tracking-widest text-white/45">
                    {key.letters}
                  </span>
                </button>
              ))}
              <span />
              <button
                type="button"
                disabled={pending}
                onClick={() => press("0")}
                className="flex h-16 items-center justify-center rounded-xl bg-white/5 text-xl font-medium transition-colors hover:bg-white/15 disabled:opacity-50"
              >
                0
              </button>
              <button
                type="button"
                aria-label="Delete"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  setPin((value) => value.slice(0, -1));
                }}
                className="flex h-16 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/15 disabled:opacity-50"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>
          </section>
        )}

        <div className="mt-2 text-center text-xs text-white/45">
          <p>{label("forgotPin", lang)}</p>
          <p className="mt-1">{label("askSupervisorForPin", lang)}</p>
        </div>
      </div>
    </main>
  );
}

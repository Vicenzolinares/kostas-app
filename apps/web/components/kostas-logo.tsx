import { cn } from "@kostas/ui";

/**
 * The Kostas monogram — an ornamental "K" in a circular frame, taken from
 * the mockup deck's title slide.
 *
 * The asset (public/kostas-monogram.png) is stored as an alpha mask rather
 * than a picture of black ink on white: the deck ships it as a JPEG with a
 * white background, which would sit in a white box on any surface that
 * isn't also white. Painting it as a CSS mask over `currentColor` instead
 * means it inherits whatever colour its context sets, so the same file
 * works on the light sidebar, on a dark header, and inverted inside the
 * primary-filled avatar without shipping three variants.
 */
export function KostasMonogram({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Kostas Upholstery"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: "url(/kostas-monogram.png)",
        maskImage: "url(/kostas-monogram.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

/** Monogram plus wordmark, as it appears top-left of every screen in the deck. */
export function KostasLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <KostasMonogram className="h-9 w-9 text-foreground" />
      <div className="leading-tight">
        {/* GeistSans' kern pair for "OS" opens a gap wide enough that the
            wordmark reads as "KO STAS" at this size. The glyphs and string
            are correct — only the kerning is — so it's switched off here
            and even tracking applied instead, which is how the deck sets
            the wordmark anyway. */}
        <p
          className="text-sm font-semibold tracking-[0.1em]"
          style={{ fontKerning: "none" }}
        >
          KOSTAS
        </p>
        <p className="text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground">
          UPHOLSTERY
        </p>
      </div>
    </div>
  );
}

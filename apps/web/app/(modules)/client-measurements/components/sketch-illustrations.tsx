/**
 * The two standard sketches from deck p4, drawn as inline SVG.
 *
 * Fixed illustrations with a callout overlay rather than something the
 * Konva canvas generates: the deck shows a consistent reference drawing
 * that every measurement sheet reuses, and a freehand canvas can't
 * guarantee that. Both use the same 0–100 viewBox so `sheet-definitions`
 * can place markers in percentage coordinates against either one.
 *
 * `currentColor` throughout so the line work inherits the surrounding text
 * colour and stays legible in both themes.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 0.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SofaSketch() {
  return (
    <g className="text-muted-foreground">
      {/* back cushion / roll */}
      <path {...STROKE} d="M22 30 Q50 22 78 30 L78 42 Q50 36 22 42 Z" />
      {/* arms */}
      <path {...STROKE} d="M14 38 Q13 34 18 33 Q22 33 22 38 L22 68 L14 68 Z" />
      <path {...STROKE} d="M86 38 Q87 34 82 33 Q78 33 78 38 L78 68 L86 68 Z" />
      {/* seat cushions */}
      <path {...STROKE} d="M22 44 L78 44 L78 58 L22 58 Z" />
      <path {...STROKE} d="M50 44 L50 58" />
      {/* base rail */}
      <path {...STROKE} d="M14 68 L86 68 L86 76 L14 76 Z" />
      {/* legs */}
      <path {...STROKE} d="M19 76 L18 84 M24 76 L25 84" />
      <path {...STROKE} d="M76 76 L75 84 M81 76 L82 84" />
      {/* throw pillows */}
      <path {...STROKE} d="M26 34 L36 32 L38 42 L28 44 Z" />
      <path {...STROKE} d="M74 34 L64 32 L62 42 L72 44 Z" />
    </g>
  );
}

export function WindowSketch() {
  return (
    <g className="text-muted-foreground">
      {/* curtain rod with finials */}
      <path {...STROKE} d="M10 14 L90 14" />
      <circle {...STROKE} cx="8" cy="14" r="2" />
      <circle {...STROKE} cx="92" cy="14" r="2" />
      {/* window frame + sill */}
      <path {...STROKE} d="M28 22 L72 22 L72 74 L28 74 Z" />
      <path {...STROKE} d="M24 74 L76 74 L76 78 L24 78 Z" />
      {/* panes */}
      <path {...STROKE} d="M50 22 L50 74 M28 48 L72 48" />
      {/* curtain panels, gathered either side */}
      <path
        {...STROKE}
        d="M14 16 Q12 45 15 82 M19 16 Q17 45 20 82 M24 16 Q22 45 25 82"
      />
      <path
        {...STROKE}
        d="M86 16 Q88 45 85 82 M81 16 Q83 45 80 82 M76 16 Q78 45 75 82"
      />
      <path {...STROKE} d="M14 82 Q19 84 25 82" />
      <path {...STROKE} d="M86 82 Q81 84 75 82" />
    </g>
  );
}

import type { CornerSquareType, DotType, Options } from "qr-code-styling"

export interface QrStyle {
  name: string
  dots: DotType
  corners: CornerSquareType
  /** Start and end of a diagonal gradient. */
  colors: [string, string]
  /** Eye color. Derived from `colors` when unset. */
  eye?: string
}

export const DOTS: DotType[] = ["square", "rounded", "extra-rounded", "dots", "classy", "classy-rounded"]
export const CORNERS: CornerSquareType[] = ["square", "extra-rounded", "dot"]

export const STYLES: QrStyle[] = [
  { name: "Ink", dots: "extra-rounded", corners: "extra-rounded", colors: ["#1e3a8a", "#0284c7"] },
  { name: "Sunset", dots: "dots", corners: "extra-rounded", colors: ["#f97316", "#db2777"] },
  { name: "Orchid", dots: "classy-rounded", corners: "dot", colors: ["#7c3aed", "#db2777"] },
  { name: "Grove", dots: "rounded", corners: "extra-rounded", colors: ["#047857", "#4d7c0f"] },
]

/** Blend two #rrggbb colors; `t` is how far to move from `a` toward `b`. */
const mix = (a: string, b: string, t: number) =>
  "#" +
  [1, 3, 5]
    .map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")

/**
 * The tile and, unless set, the eyes are derived from the two gradient colors,
 * so any pair works. Light: a pale tile and deep eyes. Dark: a night tile and
 * lightened modules.
 */
export function palette(style: QrStyle, dark: boolean) {
  const [from, to] = style.colors
  const mid = mix(from, to, 0.5)
  if (!dark) {
    return { colors: [from, to], eye: style.eye ?? mix(mid, "#000000", 0.45), background: mix(from, "#ffffff", 0.94) }
  }

  const lift = (c: string) => mix(c, "#ffffff", 0.5)
  return {
    colors: [lift(from), lift(to)],
    eye: lift(style.eye ?? mid),
    background: mix(from, "#09090b", 0.9),
  }
}

/** The `qr-code-styling` options that vary with the chosen style and scheme. */
export function look(style: QrStyle, dark: boolean): Options {
  const { colors, eye, background } = palette(style, dark)
  return {
    dotsOptions: {
      type: style.dots,
      gradient: {
        type: "linear",
        rotation: Math.PI / 4,
        colorStops: colors.map((color, offset) => ({ offset, color })),
      },
    },
    cornersSquareOptions: { type: style.corners, color: eye },
    cornersDotOptions: { type: "dot", color: eye },
    backgroundOptions: { color: background },
  }
}

import QRCodeStyling, { type CornerSquareType, type DotType, type Options } from "qr-code-styling"
import { CORNERS, DOTS, look, palette, STYLES, type QrStyle } from "./styles"
import "./style.css"

const SAMPLE = "https://example.com"
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const input = $<HTMLInputElement>("link")
const picker = $("styles")
const from = $<HTMLInputElement>("from")
const to = $<HTMLInputElement>("to")
const eye = $<HTMLInputElement>("eye")
const dots = $<HTMLSelectElement>("dots")
const corners = $<HTMLSelectElement>("corners")
const preview = $("code")
const caption = $("caption")

const root = document.documentElement
const system = matchMedia("(prefers-color-scheme: dark)")
const isDark = () => (root.dataset.theme || (system.matches ? "dark" : "light")) === "dark"

const SIZE = 280
const MARGIN = 12
const EXPORT_SCALE = 4

const base: Options = {
  type: "svg",
  width: SIZE,
  height: SIZE,
  margin: MARGIN,
  data: SAMPLE,
  qrOptions: { errorCorrectionLevel: "H" },
}
let options = base

const qr = new QRCodeStyling(base)
qr.append(preview)

// A preset, plus whatever the controls have changed since.
let style: QrStyle = { ...STYLES[1]! }

function render() {
  const data = input.value.trim() || SAMPLE
  const dark = isDark()
  options = { ...base, data, ...look(style, dark) }
  qr.update(options)
  caption.textContent = data
  preview.setAttribute("aria-label", `QR code for ${data}`)

  const [a, b] = style.colors
  root.style.setProperty("--accent", a)
  root.style.setProperty("--accent2", b)
  root.style.setProperty("--tint", palette(style, false).background)
  root.style.setProperty("--tile", palette(style, dark).background)
}

/** Show the current style in the controls. The eye picker shows the derived color until overridden. */
function sync() {
  ;[from.value, to.value] = style.colors
  eye.value = palette(style, false).eye
  dots.value = style.dots
  corners.value = style.corners
}

function choose(preset: QrStyle) {
  style = { ...preset }
  sync()
  render()
}

function update(patch: Partial<QrStyle>) {
  style = { ...style, ...patch }
  if (!style.eye) eye.value = palette(style, false).eye
  render()
}

for (const [select, values] of [[dots, DOTS], [corners, CORNERS]] as const) {
  select.innerHTML = values
    .map((v) => `<option value="${v}">${v[0]!.toUpperCase() + v.slice(1).replace("-", " ")}</option>`)
    .join("")
}

for (const preset of STYLES) {
  const [a, b] = preset.colors
  const pill = document.createElement("label")
  pill.style.setProperty("--swatch", a)
  pill.style.setProperty("--swatch2", b)
  pill.innerHTML = `<input type="radio" name="style"${preset.name === style.name ? " checked" : ""}>${preset.name}`
  pill.firstElementChild!.addEventListener("change", () => choose(preset))
  picker.append(pill)
}

for (const color of [from, to]) color.addEventListener("input", () => update({ colors: [from.value, to.value] }))
eye.addEventListener("input", () => update({ eye: eye.value }))
dots.addEventListener("change", () => update({ dots: dots.value as DotType }))
corners.addEventListener("change", () => update({ corners: corners.value as CornerSquareType }))

$("theme").addEventListener("click", () => {
  root.dataset.theme = localStorage.theme = isDark() ? "light" : "dark"
  render()
})
system.addEventListener("change", render)

input.placeholder = input.value = SAMPLE
input.addEventListener("input", render)

$("downloads").addEventListener("click", ({ target }) => {
  const extension = (target as HTMLElement).dataset.ext as "png" | "svg" | undefined
  if (!extension) return
  // Export from a larger copy so the preview stays put. The margin scales with it.
  new QRCodeStyling({
    ...options,
    width: SIZE * EXPORT_SCALE,
    height: SIZE * EXPORT_SCALE,
    margin: MARGIN * EXPORT_SCALE,
  }).download({ name: "qr", extension })
})

choose(style)

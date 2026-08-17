import { useRef, useState } from "react";
import { ArrowDownUp, Upload, Trash2, AlertTriangle, Palette, Sparkles } from "lucide-react";
import type { ECLevel, DotStyle, CornerStyle, QRRenderOptions } from "../lib/qr";
import { EC_INFO } from "../lib/qr";
import { ColorField, IndustrialCard, Pill, Seg, SelectField, SliderRow, Tele, Tip, useToast } from "./ui";

/** Map the user-facing style state onto the renderer's options. */
export function toRenderOptions(
  s: StyleState,
  logoGrid: Uint8Array | null,
  logoN: number,
  bgOverride?: string,
): QRRenderOptions {
  return {
    ec: s.ec,
    margin: s.margin,
    fg: s.fg,
    bg: bgOverride ?? s.bg,
    dotStyle: s.dotStyle,
    cornerStyle: s.cornerStyle,
    logoGrid,
    logoN,
    logoRes: s.logoMode === "stitch" ? 3 : 1,
    logoMode: s.logoMode,
    logoScale: s.logoScale,
  };
}

export interface StyleState {
  ec: ECLevel;
  /** quiet zone in modules */
  margin: number;
  fg: string;
  bg: string;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  /** uploaded mark, as a data URL */
  logo: string | null;
  /**
   * "stitch" — the mark is dithered at 3× the module grid and the complete
   * code is repainted over it (nothing is erased, any EC level works).
   * "inlay" — the mark replaces the data modules (needs level H).
   */
  logoMode: "stitch" | "inlay";
  /** logo region as a fraction of the code width (0.1 – 0.5) */
  logoScale: number;
  /** luminance cutoff — below it, a pixel becomes dark */
  logoThreshold: number;
  /** pre-exposure applied before thresholding (1 = unchanged) */
  logoBrightness: number;
  /** contrast about the midpoint, after brightness (1 = unchanged) */
  logoContrast: number;
  /**
   * "dither" spreads quantisation error to neighbouring pixels (halftone —
   * keeps gradients and thin strokes legible); "crisp" is a hard 1-bit cut.
   */
  logoEdge: "dither" | "crisp";
  exportPx: number;
}

export const DEFAULT_STYLE: StyleState = {
  ec: "Q",
  margin: 4,
  fg: "#1c1c1a",
  bg: "#ffffff",
  dotStyle: "square",
  cornerStyle: "square",
  logo: null,
  logoMode: "stitch",
  logoScale: 0.34,
  logoThreshold: 0.5,
  logoBrightness: 1.3,
  logoContrast: 1.2,
  logoEdge: "dither",
  exportPx: 1024,
};

/**
 * Bundled high-contrast sample mark — lets people try the merge instantly.
 * Carries explicit width/height (not just a viewBox) so every browser reports
 * real intrinsic dimensions when it's rasterised onto the module grid.
 */
const SAMPLE_LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="30" fill="#141412"/><path fill="#fff" d="M78 12 36 70h22L46 116l46-62H68l10-42z"/></svg>`,
  );

const PRESETS: Array<{ name: string; fg: string; bg: string }> = [
  { name: "Press black", fg: "#1c1c1a", bg: "#ffffff" },
  { name: "Vermillion", fg: "#c22e12", bg: "#fff6f0" },
  { name: "Cobalt", fg: "#16336f", bg: "#eef2fb" },
  { name: "Pine", fg: "#132a22", bg: "#eaf6ee" },
  { name: "Espresso", fg: "#3e2417", bg: "#f7e9d7" },
  { name: "Slate", fg: "#1f2937", bg: "#f6f7f8" },
  { name: "Amber press", fg: "#7a4a00", bg: "#ffe9b8" },
  { name: "Deep sea", fg: "#073042", bg: "#dff3f2" },
];

export function StylePanel({
  style,
  setStyle,
  mergePct,
  logoWarning,
}: {
  style: StyleState;
  setStyle: (fn: (s: StyleState) => StyleState) => void;
  /** % of the code's modules the merged mark currently replaces, or null */
  mergePct: number | null;
  /** diagnostic when the uploaded mark can't produce a visible merge */
  logoWarning?: string | null;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const patch = (p: Partial<StyleState>) => setStyle((s) => ({ ...s, ...p }));

  const applyLogo = (logo: string, doneMsg: string) => {
    /* Stitch needs no extra redundancy; Inlay erases data, so raise to H */
    if (style.logoMode === "inlay" && style.ec !== "H") {
      patch({ logo, ec: "H" });
      toast("success", `${doneMsg} — error correction raised to H for the inlay`);
    } else {
      patch({ logo });
      toast("success", doneMsg);
    }
  };

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    /* some browsers report an empty MIME type for .svg — fall back to the extension */
    const looksSvg = /\.svg$/i.test(file.name);
    if (!file.type.startsWith("image/") && !looksSvg) {
      toast("error", "That file isn't an image");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast("error", "Logo too large — keep it under 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => applyLogo(String(reader.result), "Logo merged into the centre");
    reader.readAsDataURL(file);
  };

  return (
    <IndustrialCard id="style" stripe="var(--t-accent)">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-[17px] font-black tracking-tight text-ink">02 · Ink & stock</h2>
          <Tele tone="accent">
            <Palette size={11} /> live proof
          </Tele>
        </div>

        {/* colours */}
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Module ink" value={style.fg} onChange={(v) => patch({ fg: v })} />
          <ColorField label="Field / stock" value={style.bg} onChange={(v) => patch({ bg: v })} />
        </div>
        <button
          onClick={() => patch({ fg: style.bg, bg: style.fg })}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink-dim transition-colors hover:border-ink hover:text-ink"
        >
          <ArrowDownUp size={12} /> Swap ink & stock
        </button>

        {/* presets */}
        <div className="mt-4">
          <span className="mb-2 block text-[12px] font-bold text-ink-dim">Ink presets</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const active = style.fg === p.fg && style.bg === p.bg;
              return (
                <button
                  key={p.name}
                  title={p.name}
                  onClick={() => patch({ fg: p.fg, bg: p.bg })}
                  className={`flex items-center gap-1 rounded-full border-[1.5px] py-1 pl-1 pr-2.5 text-[10.5px] font-extrabold transition-all ${
                    active
                      ? "border-ink bg-ink text-bg shadow-brutal-accent"
                      : "border-line bg-surface text-ink-dim hover:border-ink hover:text-ink"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-ink/40"
                    style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }}
                  />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* module geometry */}
        <div className="mt-5 space-y-3.5">
          <div>
            <span className="mb-1.5 block text-[12px] font-bold text-ink-dim">Dot shape</span>
            <Seg<DotStyle>
              value={style.dotStyle}
              onChange={(v) => patch({ dotStyle: v })}
              options={[
                { value: "square", label: "Square" },
                { value: "rounded", label: "Rounded" },
                { value: "dots", label: "Dots" },
              ]}
            />
          </div>
          <div>
            <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-ink-dim">
              Corner squares
              <Tip text="The three big squares cameras lock onto first. Square reads fastest — rounding is purely a style choice." />
            </span>
            <Seg<CornerStyle>
              value={style.cornerStyle}
              onChange={(v) => patch({ cornerStyle: v })}
              options={[
                { value: "square", label: "Square" },
                { value: "rounded", label: "Rounded" },
              ]}
            />
          </div>
        </div>

        {/* error correction */}
        <div className="mt-5">
          <SelectField<ECLevel>
            label="Error correction"
            tip="How much of the code can be damaged or covered and still decode. Use Q or H for print and anything with a logo."
            value={style.ec}
            onChange={(v) => patch({ ec: v })}
            options={(Object.keys(EC_INFO) as ECLevel[]).map((k) => ({
              value: k,
              label: `Level ${k} — ${EC_INFO[k].label} · ${EC_INFO[k].recovery}`,
            }))}
          />
          <p className="mt-1.5 text-[11px] font-semibold text-ink-muted">
            Holds {EC_INFO[style.ec].capacity.toLowerCase()} · survives {EC_INFO[style.ec].recovery.toLowerCase()}
          </p>
        </div>

        {/* quiet zone */}
        <div className="mt-5">
          <SliderRow
            label="Clear margin"
            tip="The blank border around the code. The standard asks for at least 4 squares — never let artwork or edges print into it."
            value={style.margin}
            min={0}
            max={10}
            onChange={(v) => patch({ margin: v })}
            format={(v) => `${v} squares`}
          />
          {style.margin < 4 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-warn">
              <AlertTriangle size={12} /> Below the safe minimum of 4
            </p>
          )}
        </div>

        {/* merged logo */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onLogoFile(e.dataTransfer.files?.[0]);
          }}
          className={`mt-5 rounded-[12px] border-[1.5px] border-dashed p-3.5 transition-all duration-200 ${
            dragging
              ? "scale-[1.015] border-accent2 bg-accent2/10 shadow-brutal-sm"
              : "border-line bg-surface2/50"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink-dim">
              Logo in the code
              <Tip text="Your mark becomes part of the code itself — never a sticker on top. Stitch dithers the image under the complete code (nothing erased); Inlay pixelates it into real modules that replace data (level H restores it)." />
            </span>
            {style.logo ? (
              <Pill variant="ghost" className="!px-3.5 !py-1.5 !text-[10.5px]" onClick={() => patch({ logo: null })}>
                <Trash2 size={12} /> Remove
              </Pill>
            ) : (
              <span className="flex items-center gap-1.5">
                <Pill variant="ghost" className="!px-3.5 !py-1.5 !text-[10.5px]" onClick={() => applyLogo(SAMPLE_LOGO, "Sample mark merged")}>
                  <Sparkles size={12} /> Try sample
                </Pill>
                <Pill variant="dark" className="!px-3.5 !py-1.5 !text-[10.5px]" onClick={() => fileRef.current?.click()}>
                  <Upload size={12} /> Upload
                </Pill>
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={(e) => {
                onLogoFile(e.target.files?.[0]);
                /* reset so re-picking the very same file fires again */
                e.target.value = "";
              }}
            />
          </div>
          {style.logo && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={style.logo}
                alt="Logo merged into the code"
                className="h-11 w-11 rounded-[8px] border-[1.5px] border-ink object-contain"
              />
              <div className="flex-1 space-y-3">
                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-ink-dim">
                    Technique
                    <Tip text="Stitch lays a fine halftone of the image down and redraws the complete code over it — nothing is erased, so it scans at any error-correction level. Inlay turns the image into real modules that replace the data underneath — level H restores what's lost." />
                  </span>
                  <Seg<"stitch" | "inlay">
                    value={style.logoMode}
                    onChange={(v) => patch({ logoMode: v })}
                    options={[
                      { value: "stitch", label: "Stitch" },
                      { value: "inlay", label: "Inlay" },
                    ]}
                  />
                </div>
                <SliderRow
                  label="Image size"
                  tip="How wide the logo region is. The whole mark always fits — it's never cropped. Inlay should stay under half the code width so level H can restore the replaced data."
                  value={Math.round(style.logoScale * 100)}
                  min={10}
                  max={50}
                  onChange={(v) => patch({ logoScale: v / 100 })}
                  format={(v) => `${v}%`}
                />
                <SliderRow
                  label="Ink threshold"
                  tip="The luminance midpoint: pixels darker than this become dark. With dithering on it acts like a halftone's exposure — tune it until the mark reads clearly."
                  value={Math.round(style.logoThreshold * 100)}
                  min={15}
                  max={85}
                  step={5}
                  onChange={(v) => patch({ logoThreshold: v / 100 })}
                  format={(v) => `${v}%`}
                />
                <SliderRow
                  label="Brightness"
                  tip="Pre-exposure applied before dithering. Raise it to open up shadows and make the image read lighter under the code."
                  value={Math.round(style.logoBrightness * 100)}
                  min={40}
                  max={260}
                  step={5}
                  onChange={(v) => patch({ logoBrightness: v / 100 })}
                  format={(v) => `${v}%`}
                />
                <SliderRow
                  label="Contrast"
                  tip="Pushes tones away from the midpoint after brightness — separates the image from the modules so both stay legible."
                  value={Math.round(style.logoContrast * 100)}
                  min={50}
                  max={260}
                  step={5}
                  onChange={(v) => patch({ logoContrast: v / 100 })}
                  format={(v) => `${v}%`}
                />
                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-ink-dim">
                    Edge style
                    <Tip text="Dithered spreads each pixel's error to its neighbours — the halftone effect that keeps gradients, shadows and thin strokes legible at QR resolution. Crisp is a hard 1-bit cut." />
                  </span>
                  <Seg<"dither" | "crisp">
                    value={style.logoEdge}
                    onChange={(v) => patch({ logoEdge: v })}
                    options={[
                      { value: "dither", label: "Dithered" },
                      { value: "crisp", label: "Crisp" },
                    ]}
                  />
                </div>
                {style.logoMode === "stitch" ? (
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink-muted">
                    No modules replaced — the full code is redrawn over the image
                  </p>
                ) : (
                  mergePct !== null && (
                    <p
                      className={`flex items-center gap-1.5 text-[11px] font-bold ${
                        mergePct > 25 ? "text-danger" : mergePct > 20 ? "text-warn" : "text-ink-muted"
                      }`}
                    >
                      {mergePct > 25 ? <AlertTriangle size={12} /> : null}
                      Replaces ≈ {mergePct}% of the code's modules · level H restores ~30%
                    </p>
                  )
                )}
              </div>
            </div>
          )}
          {style.logo && style.logoMode === "inlay" && style.ec !== "H" && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-danger">
              <AlertTriangle size={12} /> An inlay replaces data — switch error correction up to H, or use Stitch.
            </p>
          )}
          {style.logo && logoWarning && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] font-bold leading-snug text-warn">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {logoWarning}
            </p>
          )}
          {!style.logo && (
            <p className="mt-2 text-[10.5px] font-medium leading-snug text-ink-muted">
              Upload a mark — or drop it right here — and it's worked into the matrix, never pasted
              on top. Stitch keeps every module in place over a fine halftone of the image; Inlay
              turns the mark itself into modules.
            </p>
          )}
        </div>

        {/* export size */}
        <div className="mt-5">
          <SelectField<string>
            label="PNG target size"
            tip="Pixels per side. 1024px covers most print; 2048px for large-format posters."
            value={String(style.exportPx)}
            onChange={(v) => patch({ exportPx: Number(v) })}
            options={[
              { value: "256", label: "256 px — screens & receipts" },
              { value: "512", label: "512 px — web & small print" },
              { value: "1024", label: "1024 px — standard print" },
              { value: "2048", label: "2048 px — posters & signage" },
            ]}
          />
        </div>
      </div>
    </IndustrialCard>
  );
}

import { useRef } from "react";
import { ArrowDownUp, Upload, Trash2, AlertTriangle, Palette } from "lucide-react";
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
  /** merged-logo region as a fraction of the code width */
  logoScale: number;
  /** luminance cutoff — below it, a pixel becomes a dark module */
  logoThreshold: number;
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
  logoScale: 0.2,
  logoThreshold: 0.5,
  exportPx: 1024,
};

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
}: {
  style: StyleState;
  setStyle: (fn: (s: StyleState) => StyleState) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<StyleState>) => setStyle((s) => ({ ...s, ...p }));

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("error", "That file isn't an image");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast("error", "Logo too large — keep it under 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const logo = String(reader.result);
      if (style.ec !== "H") {
        patch({ logo, ec: "H" });
        toast("success", "Logo added — error correction raised to H");
      } else {
        patch({ logo });
        toast("success", "Logo embedded in the centre");
      }
    };
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
        <div className="mt-5 rounded-[12px] border-[1.5px] border-dashed border-line bg-surface2/50 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink-dim">
              Merged logo
              <Tip text="Your mark is pixelated into the matrix and becomes real modules — dark pixels turn into dark squares, light ones into the field. It's part of the code, not a sticker on top." />
            </span>
            {style.logo ? (
              <Pill variant="ghost" className="!px-3.5 !py-1.5 !text-[10.5px]" onClick={() => patch({ logo: null })}>
                <Trash2 size={12} /> Remove
              </Pill>
            ) : (
              <Pill variant="dark" className="!px-3.5 !py-1.5 !text-[10.5px]" onClick={() => fileRef.current?.click()}>
                <Upload size={12} /> Upload
              </Pill>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onLogoFile(e.target.files?.[0])}
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
                <SliderRow
                  label="Merge size"
                  value={Math.round(style.logoScale * 100)}
                  min={10}
                  max={30}
                  onChange={(v) => patch({ logoScale: v / 100 })}
                  format={(v) => `${v}%`}
                />
                <SliderRow
                  label="Ink threshold"
                  tip="How dark a pixel must be to become a dark module. Lower values keep only the strongest ink — a sparser, more open merge."
                  value={Math.round(style.logoThreshold * 100)}
                  min={15}
                  max={85}
                  step={5}
                  onChange={(v) => patch({ logoThreshold: v / 100 })}
                  format={(v) => `${v}%`}
                />
              </div>
            </div>
          )}
          {style.logo && style.ec !== "H" && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-danger">
              <AlertTriangle size={12} /> A merged mark replaces data — switch error correction up to H.
            </p>
          )}
          {!style.logo && (
            <p className="mt-2 text-[10.5px] font-medium leading-snug text-ink-muted">
              Upload a mark and it's woven into the matrix — the logo becomes real modules, and
              level H restores the data underneath. Bold, high-contrast marks merge best.
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

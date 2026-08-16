import { useRef } from "react";
import type { QROptions } from "../lib/qr";
import { EC_INFO } from "../lib/qr";
import { ColorField, Field, PanelHeading, Seg, SliderRow, useToast } from "./ui";
import { IconSwap, IconTrash, IconUpload, IconAlert } from "./icons";

export interface StyleState extends QROptions {
  exportPx: number;
}

export const DEFAULT_STYLE: StyleState = {
  ec: "Q",
  margin: 4,
  fg: "#141412",
  bg: "#F3F2EA",
  dotStyle: "square",
  cornerStyle: "square",
  logo: null,
  logoScale: 0.22,
  exportPx: 1024,
};

const PRESETS: Array<{ name: string; fg: string; bg: string }> = [
  { name: "Ink on cream", fg: "#141412", bg: "#F3F2EA" },
  { name: "Cobalt", fg: "#14279E", bg: "#F2F4FF" },
  { name: "Forest", fg: "#14351F", bg: "#EAF5E4" },
  { name: "Crimson", fg: "#8E1D2C", bg: "#FFF1EE" },
  { name: "Espresso", fg: "#3E2417", bg: "#F7E9D7" },
  { name: "Slate", fg: "#1F2937", bg: "#F9FAFB" },
  { name: "Amber press", fg: "#7A4A00", bg: "#FFE9B8" },
  { name: "Deep sea", fg: "#073042", bg: "#DFF3F2" },
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
    <section className="card p-5" id="style">
      <PanelHeading
        kicker="02 · Appearance"
        title="Style & scan safety"
        right={
          <span className="chip">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-moss" />
            live
          </span>
        }
      />

      {/* Colours */}
      <div className="mb-2 flex items-center gap-2">
        <ColorField label="Modules" value={style.fg} onChange={(v) => patch({ fg: v })} />
        <button
          className="btn btn-ghost mt-[22px] !p-2"
          onClick={() => patch({ fg: style.bg, bg: style.fg })}
          title="Swap colours"
          aria-label="Swap foreground and background colours"
        >
          <IconSwap size={15} />
        </button>
        <ColorField label="Background" value={style.bg} onChange={(v) => patch({ bg: v })} />
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = style.fg === p.fg && style.bg === p.bg;
          return (
            <button
              key={p.name}
              title={p.name}
              onClick={() => patch({ fg: p.fg, bg: p.bg })}
              className={`group flex items-center overflow-hidden rounded-[8px] border-[1.5px] transition-all duration-150 hover:-translate-y-0.5 ${
                active
                  ? "border-amber shadow-[2px_2px_0_0_var(--color-ink-950)]"
                  : "border-line-soft hover:border-line"
              }`}
              aria-label={`Preset ${p.name}`}
            >
              <span className="h-6 w-6" style={{ background: p.fg }} />
              <span className="h-6 w-6" style={{ background: p.bg }} />
            </button>
          );
        })}
      </div>

      {/* Shapes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Module shape">
          <Seg
            options={[
              { value: "square", label: "Square" },
              { value: "rounded", label: "Rounded" },
              { value: "dots", label: "Dots" },
            ]}
            value={style.dotStyle}
            onChange={(v) => patch({ dotStyle: v })}
          />
        </Field>
        <Field label="Finder corners">
          <Seg
            options={[
              { value: "square", label: "Square" },
              { value: "rounded", label: "Rounded" },
            ]}
            value={style.cornerStyle}
            onChange={(v) => patch({ cornerStyle: v })}
          />
        </Field>
      </div>

      {/* Error correction */}
      <div className="mt-5">
        <Field
          label="Error correction"
          hint={
            style.logo ? "H is required with a logo" : "Q balances size & resilience"
          }
        >
          <Seg
            options={(["L", "M", "Q", "H"] as const).map((l) => ({
              value: l,
              label: (
                <span>
                  {l}
                  <span className="ml-1 hidden font-medium text-[10px] opacity-60 sm:inline">
                    {EC_INFO[l].recovery.replace("≈ ", "")}
                  </span>
                </span>
              ),
              title: `${EC_INFO[l].label} — recovers ${EC_INFO[l].recovery}`,
            }))}
            value={style.ec}
            onChange={(v) => {
              if (style.logo && v !== "H") {
                toast("error", "Keep level H while a logo is embedded");
                return;
              }
              patch({ ec: v });
            }}
          />
        </Field>
      </div>

      {/* Quiet zone + export size */}
      <div className="mt-5 space-y-5">
        <SliderRow
          label="Quiet zone"
          value={style.margin}
          display={`${style.margin} mod`}
          min={0}
          max={10}
          onChange={(v) => patch({ margin: v })}
          warn={
            style.margin < 4
              ? "Spec requires ≥ 4 modules of clear margin"
              : undefined
          }
        />
        <SliderRow
          label="PNG export size"
          value={style.exportPx}
          display={`${style.exportPx}px`}
          min={256}
          max={2048}
          step={128}
          onChange={(v) => patch({ exportPx: v })}
        />
      </div>

      {/* Logo */}
      <div className="mt-5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onLogoFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {!style.logo ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="group flex w-full items-center gap-3.5 rounded-[12px] border-[1.5px] border-dashed border-line bg-ink-850/50 px-4 py-4 text-left transition-all hover:border-amber/70 hover:bg-ink-850"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-line bg-ink-700 text-amber transition-transform group-hover:-translate-y-0.5">
              <IconUpload size={17} />
            </span>
            <span>
              <span className="block text-[13.5px] font-bold text-cream">
                Embed a logo
              </span>
              <span className="block text-[12px] font-medium text-muted">
                PNG / JPG / SVG · sits on a padded plate · auto-switches to EC level H
              </span>
            </span>
          </button>
        ) : (
          <div className="rounded-[12px] border-[1.5px] border-line-soft bg-ink-850/60 p-3.5">
            <div className="flex items-center gap-3">
              <span
                className="h-11 w-11 shrink-0 rounded-[9px] border-[1.5px] border-line bg-center bg-cover"
                style={{ backgroundImage: `url(${style.logo})`, backgroundSize: "cover" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-cream">Logo embedded</p>
                <p className="text-[11.5px] font-medium text-muted">
                  Covered modules are recovered by level-H redundancy
                </p>
              </div>
              <button
                className="btn btn-ghost !p-2 !text-rust hover:!border-rust/50"
                onClick={() => patch({ logo: null })}
                aria-label="Remove logo"
                title="Remove logo"
              >
                <IconTrash size={15} />
              </button>
            </div>
            <div className="mt-3.5">
              <SliderRow
                label="Logo size"
                value={Math.round(style.logoScale * 100)}
                display={`${Math.round(style.logoScale * 100)}%`}
                min={10}
                max={30}
                onChange={(v) => patch({ logoScale: v / 100 })}
                warn={
                  style.logoScale > 0.26
                    ? "Above ~26% you risk covering recoverable data"
                    : undefined
                }
              />
            </div>
            {style.logoScale > 0.26 && (
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-bold text-amber">
                <IconAlert size={11} /> Test the scan after resizing — larger logos need
                bigger print sizes.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

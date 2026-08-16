import { useMemo, useState } from "react";
import { Download, Image as ImageIcon, Copy, ScanLine, Layers, Gauge } from "lucide-react";
import type { QRMatrix } from "../lib/qr";
import {
  byteLength,
  canvasToBlob,
  contrastRatio,
  downloadBlob,
  luminance,
  renderCanvas,
  renderSVG,
} from "../lib/qr";
import type { StyleState } from "./StylePanel";
import { IndustrialCard, PassFail, Pill, SpecCell, Tele, useToast } from "./ui";

const SUBSTRATES = [
  { id: "white", label: "White", cls: "sub-white", color: "#ffffff" },
  { id: "kraft", label: "Kraft", cls: "sub-kraft", color: "#bd8a52" },
  { id: "knit", label: "Poly Knit", cls: "sub-knit", color: "#dfe3e7" },
  { id: "cotton", label: "Woven Cotton", cls: "sub-cotton", color: "#efebe0" },
  { id: "nylon", label: "Nylon", cls: "sub-nylon", color: "#d3d9e1" },
] as const;
type SubstrateId = (typeof SUBSTRATES)[number]["id"];

interface Check {
  label: string;
  detail: string;
  pass: boolean;
}

export function PreviewPanel({
  payload,
  matrix,
  style,
  filenameBase,
}: {
  payload: string;
  matrix: QRMatrix | null;
  style: StyleState;
  filenameBase: string;
}) {
  const toast = useToast();
  const [substrate, setSubstrate] = useState<SubstrateId>("white");
  const sub = SUBSTRATES.find((s) => s.id === substrate)!;
  const bytes = byteLength(payload);

  /* transparent-bg render so the code sits ON the substrate */
  const printed = useMemo(
    () => (matrix ? renderSVG(matrix, { ...style, bg: "transparent" }, 640) : ""),
    [matrix, style],
  );

  const subContrast = useMemo(
    () => (matrix ? contrastRatio(style.fg, sub.color) : 0),
    [matrix, style.fg, sub.color],
  );

  const checks = useMemo<Check[]>(() => {
    if (!matrix) return [];
    const ratio = contrastRatio(style.fg, style.bg);
    const polarity = luminance(style.fg) < luminance(style.bg);
    const list: Check[] = [
      {
        label: "Quiet zone",
        detail:
          style.margin >= 4
            ? `${style.margin} modules of clear margin`
            : `${style.margin} modules — spec needs ≥ 4`,
        pass: style.margin >= 4,
      },
      {
        label: "Ink / stock contrast",
        detail: `${ratio.toFixed(1)} : 1 between module and field`,
        pass: ratio >= 4.5,
      },
      {
        label: "Polarity",
        detail: polarity ? "Dark modules on light field" : "Inverted — many scanners refuse this",
        pass: polarity,
      },
    ];
    if (style.logo) {
      const okLogo = style.ec === "H" && style.logoScale <= 0.26;
      list.push({
        label: "Logo embed",
        detail: okLogo
          ? `${Math.round(style.logoScale * 100)}% cover · level H redundancy`
          : style.ec !== "H"
            ? "Needs error correction level H"
            : "Logo covers too much data — shrink it",
        pass: okLogo,
      });
    }
    if (payload.startsWith("http://")) {
      list.push({ label: "Link protocol", detail: "Plain HTTP — browsers will flag it", pass: false });
    }
    list.push({
      label: "Density",
      detail:
        matrix.version <= 10
          ? `Version ${matrix.version} — comfortably sparse`
          : matrix.version <= 20
            ? `Version ${matrix.version} — keep prints ≥ 3 cm`
            : `Version ${matrix.version} — very dense, test scans essential`,
      pass: matrix.version <= 20,
    });
    return list;
  }, [matrix, style, payload]);

  const passed = checks.filter((c) => c.pass).length;
  const verified = matrix !== null && passed === checks.length && checks.length > 0;

  const modulePx = matrix ? style.exportPx / (matrix.size + style.margin * 2) : 0;
  const printCm = ((style.exportPx / 300) * 2.54).toFixed(1);

  const doPng = async (): Promise<Blob | null> => {
    if (!matrix) return null;
    const canvas = await renderCanvas(matrix, style, style.exportPx);
    return canvasToBlob(canvas);
  };

  const onDownloadPng = async () => {
    try {
      const blob = await doPng();
      if (!blob) return;
      downloadBlob(blob, `${filenameBase}.png`);
      toast("success", `PNG saved at ${style.exportPx} × ${style.exportPx}px`);
    } catch {
      toast("error", "PNG export failed — try again");
    }
  };

  const onDownloadSvg = () => {
    if (!matrix) return;
    const blob = new Blob([renderSVG(matrix, style, style.exportPx)], { type: "image/svg+xml" });
    downloadBlob(blob, `${filenameBase}.svg`);
    toast("success", "Vector SVG saved — infinite scale for print");
  };

  const onCopy = async () => {
    try {
      const blob = await doPng();
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast("success", "Image copied to clipboard");
    } catch {
      toast("error", "Clipboard blocked — use Download instead");
    }
  };

  return (
    <div className="sticky top-[92px] space-y-4">
      <IndustrialCard id="preview" stripe={verified ? "var(--t-ok)" : "var(--t-accent)"}>
        {/* header strip */}
        <div className="flex items-center justify-between gap-2 border-b-[1.5px] border-line bg-surface2/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full bg-ok" />
            <h2 className="font-display text-[15px] font-black tracking-tight text-ink">Live proof</h2>
          </div>
          {verified ? (
            <Tele tone="ok">✓ scannable payload verified</Tele>
          ) : (
            <Tele tone="warn">checking…</Tele>
          )}
        </div>

        {/* telemetry row */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4">
          <Tele tone="accent">ECC level {style.ec}</Tele>
          {matrix && <Tele>V{matrix.version}</Tele>}
          {matrix && <Tele>{matrix.size}×{matrix.size} mod</Tele>}
          <Tele>{bytes} B</Tele>
          <Tele tone="ok">100% offline</Tele>
        </div>

        {/* substrate selector */}
        <div className="px-5 pt-3.5">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            <Layers size={12} /> Substrate simulation
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUBSTRATES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubstrate(s.id)}
                className={`flex items-center gap-1.5 rounded-full border-[1.5px] py-1 pl-1 pr-2.5 text-[10.5px] font-extrabold transition-all ${
                  substrate === s.id
                    ? "border-ink bg-ink text-bg shadow-brutal-accent"
                    : "border-line bg-surface text-ink-dim hover:border-ink hover:text-ink"
                }`}
              >
                <span className={`h-4 w-4 rounded-full border border-ink/40 ${s.cls}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* QR viewport on substrate */}
        <div className={`relative mx-5 mt-3.5 flex items-center justify-center rounded-[12px] border-[1.5px] border-ink p-6 ${sub.cls}`}>
          {matrix ? (
            <div
              key={`${payload.length}:${payload}:${style.fg}:${style.margin}:${style.dotStyle}:${style.cornerStyle}:${style.ec}:${style.logoScale}:${style.logo?.length ?? 0}`}
              className="qr-pop qr-live w-full max-w-[300px]"
              dangerouslySetInnerHTML={{ __html: printed }}
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[300px] flex-col items-center justify-center gap-3 rounded-[10px] border-[1.5px] border-dashed border-ink/30 bg-surface/70 text-center backdrop-blur-[1px]">
              <ScanLine size={28} className="text-accent" />
              <p className="px-8 text-[13px] font-bold text-ink-dim">
                {payload
                  ? "Payload exceeds this error-correction level's capacity — shorten it or drop to level L."
                  : "Fill the form and your code materialises here instantly."}
              </p>
            </div>
          )}
        </div>

        {/* 2×2 spec grid */}
        {matrix && (
          <div className="grid grid-cols-2 gap-2 px-5 pt-4">
            <SpecCell
              label="Target dimension"
              value={`${style.exportPx}px²`}
              hint={`${printCm} × ${printCm} cm @ 300 DPI`}
            />
            <SpecCell label="Module size" value={`${modulePx.toFixed(1)}px`} hint="per module at target" />
            <SpecCell
              label="Substrate contrast"
              value={`${subContrast.toFixed(1)}:1`}
              tone={subContrast >= 4.5 ? "ok" : subContrast >= 3 ? "warn" : "danger"}
              hint={`on ${sub.label.toLowerCase()}`}
            />
            <SpecCell
              label="Quiet zone"
              value={`${style.margin} mod`}
              tone={style.margin >= 4 ? "ok" : "danger"}
              hint={style.margin >= 4 ? "spec ≥ 4 ✓" : "below 4-module min"}
            />
          </div>
        )}

        {/* scan-safety report */}
        {matrix && (
          <div className="mx-5 mt-4 overflow-hidden rounded-[12px] border-[1.5px] border-line">
            <div className="flex items-center justify-between border-b-[1.5px] border-line bg-surface2/60 px-4 py-2">
              <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-ink-muted">
                <Gauge size={12} /> Scan-safety report
              </span>
              <span
                className={`font-mono text-[11.5px] font-bold ${
                  passed === checks.length ? "text-ok" : passed >= checks.length / 2 ? "text-warn" : "text-danger"
                }`}
              >
                {passed}/{checks.length}
              </span>
            </div>
            <ul className="divide-y divide-line-soft bg-surface">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-3 px-4 py-2">
                  <PassFail pass={c.pass}>{c.pass ? "pass" : "risk"}</PassFail>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-ink">{c.label}</p>
                    <p className="truncate text-[11px] font-medium text-ink-muted">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* export */}
        <div className="p-5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Pill onClick={onDownloadPng} disabled={!matrix} className="flex-1">
              <Download size={15} /> Download PNG
            </Pill>
            <Pill variant="dark" onClick={onDownloadSvg} disabled={!matrix} className="flex-1">
              <ImageIcon size={15} /> SVG vector
            </Pill>
            <Pill
              variant="ghost"
              onClick={onCopy}
              disabled={!matrix}
              title="Copy PNG to clipboard"
              className="!px-4"
            >
              <Copy size={15} />
            </Pill>
          </div>
          {matrix && (
            <p className="mt-2.5 flex items-center justify-between text-[10.5px] font-semibold text-ink-muted">
              <span>
                PNG → <span className="font-bold text-ink-dim">{printCm} cm</span> @ 300 DPI
              </span>
              <span className={Number(printCm) < 2 ? "font-bold text-danger" : ""}>
                {Number(printCm) < 2 ? "below 2 cm minimum" : "above 2 cm print minimum"}
              </span>
            </p>
          )}
        </div>
      </IndustrialCard>
    </div>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Download, Image as ImageIcon, Copy, ScanLine, Layers, Gauge, Printer } from "lucide-react";
import type { QRMatrix } from "../lib/qr";
import {
  canvasToBlob,
  contrastRatio,
  downloadBlob,
  luminance,
  renderCanvas,
  renderSVG,
} from "../lib/qr";
import { toRenderOptions, type StyleState } from "./StylePanel";
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
  logoGrid,
  logoN,
}: {
  payload: string;
  matrix: QRMatrix | null;
  style: StyleState;
  filenameBase: string;
  logoGrid: Uint8Array | null;
  logoN: number;
}) {
  const toast = useToast();
  const [substrate, setSubstrate] = useState<SubstrateId>("white");
  const [sheet, setSheet] = useState(false);
  const sub = SUBSTRATES.find((s) => s.id === substrate)!;

  /* style state → renderer options (merged-logo grid included) */
  const renderOpts = (bg: string) => toRenderOptions(style, logoGrid, logoN, bg);

  /* transparent-bg render so the code sits ON the substrate */
  const printed = useMemo(
    () => (matrix ? renderSVG(matrix, renderOpts("transparent"), 640) : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matrix, style, logoGrid, logoN],
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
        label: "Clear margin",
        detail:
          style.margin >= 4
            ? "Enough blank space around the code"
            : "Too little blank space — cameras may miss the code",
        pass: style.margin >= 4,
      },
      {
        label: "Contrast",
        detail:
          ratio >= 4.5
            ? "Strong difference between code and background"
            : "Too low — darken the code or lighten the background",
        pass: ratio >= 4.5,
      },
      {
        label: "Orientation",
        detail: polarity
          ? "Dark on light — the way cameras expect it"
          : "Light on dark — most phone cameras struggle with this",
        pass: polarity,
      },
    ];
    if (style.logo) {
      const area = logoN > 0 ? (logoN * logoN) / (matrix.size * matrix.size) : 0;
      const areaPct = Math.round(area * 100);
      const okLogo = style.ec === "H" && area <= 0.25;
      list.push({
        label: "Merged logo",
        detail: okLogo
          ? logoN > 0
            ? `Woven in as ${logoN}×${logoN} modules — ${areaPct}% of the code${
                area > 0.2 ? ", near the safe limit" : ", well within the safe limit"
              }`
            : "Rasterising the mark into modules…"
          : style.ec !== "H"
            ? "Switch error correction to High first"
            : "It replaces too much of the code — shrink the merge size",
        pass: okLogo,
      });
    }
    if (payload.startsWith("http://")) {
      list.push({ label: "Link safety", detail: "Plain HTTP — browsers will warn people", pass: false });
    }
    list.push({
      label: "Density",
      detail:
        matrix.version <= 10
          ? "Nice and sparse — scans quickly, even small"
          : matrix.version <= 20
            ? "Medium density — keep printed copies 3 cm or larger"
            : "Very dense — large prints only, and test before you commit",
      pass: matrix.version <= 20,
    });
    return list;
  }, [matrix, style, payload, logoN]);

  const passed = checks.filter((c) => c.pass).length;
  const verified = matrix !== null && passed === checks.length && checks.length > 0;

  const modulePx = matrix ? style.exportPx / (matrix.size + style.margin * 2) : 0;
  const printCm = ((style.exportPx / 300) * 2.54).toFixed(1);

  const doPng = async (): Promise<Blob | null> => {
    if (!matrix) return null;
    const canvas = await renderCanvas(matrix, renderOpts(style.bg), style.exportPx);
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
    const blob = new Blob([renderSVG(matrix, renderOpts(style.bg), style.exportPx)], {
      type: "image/svg+xml",
    });
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
          {matrix && verified && <Tele tone="ok">✓ ready to scan</Tele>}
          {matrix && !verified && <Tele tone="warn">needs attention</Tele>}
        </div>

        {/* substrate selector */}
        <div className="px-5 pt-4">
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
              key={`${payload.length}:${payload}:${style.fg}:${style.margin}:${style.dotStyle}:${style.cornerStyle}:${style.ec}:${style.logoScale}:${style.logoThreshold}:${style.logoEdge}:${logoN}:${printed.length}`}
              className="qr-pop qr-live w-full max-w-[300px]"
              dangerouslySetInnerHTML={{ __html: printed }}
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[300px] flex-col items-center justify-center gap-3 rounded-[10px] border-[1.5px] border-dashed border-ink/30 bg-surface/70 text-center backdrop-blur-[1px]">
              <ScanLine size={28} className="text-accent2" />
              <p className="px-8 text-[13px] font-bold text-ink-dim">
                {payload
                  ? "This content is too long for the chosen error-correction level — shorten it, or pick a lower level under Style."
                  : "Fill in the form and your code appears here instantly."}
              </p>
            </div>
          )}
        </div>

        {/* 2×2 spec grid */}
        {matrix && (
          <div className="grid grid-cols-2 gap-2 px-5 pt-4">
            <SpecCell
              label="Export size"
              value={`${style.exportPx} px`}
              hint={`prints ${printCm} × ${printCm} cm at 300 DPI`}
            />
            <SpecCell label="Square size" value={`${modulePx.toFixed(1)} px`} hint="each dot at export size" />
            <SpecCell
              label="Surface contrast"
              value={`${subContrast.toFixed(1)}:1`}
              tone={subContrast >= 4.5 ? "ok" : subContrast >= 3 ? "warn" : "danger"}
              hint={`on ${sub.label.toLowerCase()}`}
            />
            <SpecCell
              label="Clear margin"
              value={`${style.margin}×`}
              tone={style.margin >= 4 ? "ok" : "danger"}
              hint={style.margin >= 4 ? "safe margin ✓" : "too little margin"}
            />
          </div>
        )}

        {/* scan-safety report */}
        {matrix && (
          <div className="mx-5 mt-4 overflow-hidden rounded-[12px] border-[1.5px] border-line">
            <div className="flex items-center justify-between border-b-[1.5px] border-line bg-surface2/60 px-4 py-2">
              <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-ink-muted">
                <Gauge size={12} /> Scan checks
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
            <Pill
              variant="ghost"
              onClick={() => setSheet(true)}
              disabled={!matrix}
              title="Open a crop-marked print proof"
            >
              <Printer size={15} /> <span className="hidden sm:inline">Print proof</span>
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

      {sheet && matrix && (
        <PrintSheet
          matrix={matrix}
          style={style}
          payload={payload}
          logoGrid={logoGrid}
          logoN={logoN}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Print proof sheet — portal'd so only the paper reaches the printer  */
/* ------------------------------------------------------------------ */
const TICKS = [
  "-top-2 -left-2 border-t border-l",
  "-top-2 -right-2 border-t border-r",
  "-bottom-2 -left-2 border-b border-l",
  "-bottom-2 -right-2 border-b border-r",
];

function PrintSheet({
  matrix,
  style,
  payload,
  logoGrid,
  logoN,
  onClose,
}: {
  matrix: QRMatrix;
  style: StyleState;
  payload: string;
  logoGrid: Uint8Array | null;
  logoN: number;
  onClose: () => void;
}) {
  const cm = ((style.exportPx / 300) * 2.54).toFixed(1);
  const svg = renderSVG(matrix, toRenderOptions(style, logoGrid, logoN), 640);
  const date = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const excerpt = payload.length > 64 ? `${payload.slice(0, 61)}…` : payload;

  useEffect(() => {
    const after = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("afterprint", after);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("afterprint", after);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const framed = (width: string, key: string) => (
    <div className="relative" key={key}>
      {TICKS.map((t) => (
        <span key={t} className={`pointer-events-none absolute h-3.5 w-3.5 border-neutral-400 ${t}`} />
      ))}
      <div className="qr-live" style={{ width }} dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );

  return createPortal(
    <div
      className="print-overlay fixed inset-0 z-[100] overflow-y-auto bg-ink/70 px-4 py-10 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Print proof sheet"
    >
      <div
        className="print-toolbar sticky top-4 z-10 mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border-[1.5px] border-bg/30 bg-ink px-2 py-2 shadow-brutal-accent"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent-ink transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Printer size={14} /> Print this sheet
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-bg/80 transition-colors hover:text-bg"
        >
          Close
        </button>
      </div>

      <div
        className="print-paper mx-auto w-full max-w-[620px] border-[1.5px] border-ink bg-white text-neutral-900 shadow-brutal-accent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-[22px] font-black leading-none tracking-tight">QRsmith</p>
              <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-neutral-500">
                Print proof
              </p>
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">{date}</p>
          </div>
          <div className="mt-4 border-t-2 border-neutral-900" />

          <div className="flex justify-center py-10">{framed(`${cm}cm`, "main")}</div>
          <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
            {cm} × {cm} cm — your selected export size at 300 DPI
          </p>

          <div className="mt-9 grid grid-cols-[auto_1fr] items-center gap-6 border-t border-dashed border-neutral-300 pt-7">
            {framed("2cm", "min")}
            <div>
              <p className="font-display text-[13px] font-black uppercase tracking-tight">
                Minimum check — 2.0 cm
              </p>
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-neutral-600">
                Scan this small copy from about 25 cm away. If it reads, the code is print-safe at
                every size above it.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 border-t-2 border-neutral-900 pt-4 sm:grid-cols-4">
            <Meta
              label="Ink"
              value={
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-[3px] border border-neutral-400"
                    style={{ background: style.fg }}
                  />
                  {style.fg}
                </span>
              }
            />
            <Meta label="Correction" value={`Level ${style.ec}`} />
            <Meta label="Clear margin" value={`${style.margin} squares`} />
            <Meta label="Content" value={excerpt} />
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
            <span>Print at 100% scale — never “fit to page”</span>
            <span>generated locally · nothing sent</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-[11px] font-bold text-neutral-800">{value}</p>
    </div>
  );
}

import { useMemo } from "react";
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
import { IconArrowRight, IconCopy, IconDownload, IconImage, IconAlert } from "./icons";
import { PassFail, useToast } from "./ui";

interface Check {
  label: string;
  detail: string;
  pass: boolean;
  warn?: boolean;
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
  const bytes = byteLength(payload);

  const svg = useMemo(
    () => (matrix ? renderSVG(matrix, style, 640) : ""),
    [matrix, style],
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
        label: "Contrast",
        detail: `${ratio.toFixed(1)} : 1 module-to-background`,
        pass: ratio >= 4.5,
      },
      {
        label: "Polarity",
        detail: polarity
          ? "Dark modules on light field"
          : "Inverted — many scanners will refuse this",
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
            : "Logo covers a lot of data — shrink it",
        pass: okLogo,
      });
    }
    if (payload.startsWith("http://")) {
      list.push({
        label: "Link protocol",
        detail: "Plain HTTP — browsers will flag it",
        pass: false,
        warn: true,
      });
    }
    list.push({
      label: "Density",
      detail:
        matrix.version <= 10
          ? `Version ${matrix.version} — comfortably sparse`
          : matrix.version <= 20
            ? `Version ${matrix.version} — medium density, keep prints ≥ 3 cm`
            : `Version ${matrix.version} — very dense, scan tests essential`,
      pass: matrix.version <= 20,
      warn: matrix.version > 20,
    });
    return list;
  }, [matrix, style, payload]);

  const passed = checks.filter((c) => c.pass).length;
  const score = checks.length ? Math.round((passed / checks.length) * 100) : 0;

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
    const blob = new Blob([renderSVG(matrix, style, style.exportPx)], {
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

  const printCm = ((style.exportPx / 300) * 2.54).toFixed(1);

  return (
    <section className="card overflow-hidden" id="preview">
      {/* header strip */}
      <div className="flex items-center justify-between border-b-[1.5px] border-line-soft bg-ink-700/50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="pulse-dot h-2 w-2 rounded-full bg-moss" />
          <h2 className="font-display text-[15px] font-semibold text-cream">
            Live proof
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {matrix && (
            <>
              <span className="chip font-mono !text-[10.5px]">V{matrix.version}</span>
              <span className="chip font-mono !text-[10.5px]">
                {matrix.size}×{matrix.size}
              </span>
              <span className="chip font-mono !text-[10.5px]">{bytes} B</span>
              <span className="chip !border-amber/40 !bg-amber/10 font-mono !text-[10.5px] !text-amber">
                EC {style.ec}
              </span>
            </>
          )}
        </div>
      </div>

      {/* QR stage */}
      <div className="relative flex items-center justify-center bg-[radial-gradient(460px_300px_at_50%_38%,rgba(242,193,78,0.06),transparent_70%)] px-6 pb-2 pt-6">
        {matrix ? (
          <div
            key={`${payload.length}:${payload}:${style.fg}:${style.bg}:${style.margin}:${style.dotStyle}:${style.cornerStyle}:${style.ec}:${style.logoScale}:${style.logo?.length ?? 0}`}
            className="qr-pop qr-live w-full max-w-[330px] rounded-[18px] p-[10px] shadow-hard-lg"
            style={{ background: style.bg, border: "1.5px solid var(--color-line-soft)" }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex aspect-square w-full max-w-[330px] flex-col items-center justify-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-line bg-ink-850/60 text-center">
            <IconAlert size={26} className="text-amber" />
            <p className="px-8 text-[13.5px] font-bold text-cream-dim">
              {payload
                ? "Payload exceeds this error-correction level's capacity — shorten it or drop to level L."
                : "Fill the form and your code materialises here instantly."}
            </p>
          </div>
        )}
      </div>

      {/* scan report */}
      {matrix && (
        <div className="mx-5 mb-4 mt-3 rounded-[12px] border-[1.5px] border-line-soft bg-ink-850/70">
          <div className="flex items-center justify-between border-b-[1.5px] border-line-soft px-4 py-2.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Scan-safety report
            </p>
            <span
              className={`font-mono text-[12px] font-bold ${
                score === 100 ? "text-moss" : score >= 60 ? "text-amber" : "text-rust"
              }`}
            >
              {passed}/{checks.length} checks
            </span>
          </div>
          <ul className="divide-y divide-line-soft/70">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-3 px-4 py-2.5">
                <PassFail pass={c.pass}>{c.pass ? "pass" : c.warn ? "warn" : "risk"}</PassFail>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-cream">{c.label}</p>
                  <p className="truncate text-[11.5px] font-medium text-muted">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* export */}
      <div className="border-t-[1.5px] border-line-soft bg-ink-700/40 p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button className="btn btn-amber flex-1" onClick={onDownloadPng} disabled={!matrix}>
            <IconDownload size={15} />
            Download PNG
            <span className="arrow-key">
              <IconArrowRight size={11} />
            </span>
          </button>
          <button className="btn btn-dark flex-1" onClick={onDownloadSvg} disabled={!matrix}>
            <IconImage size={15} />
            SVG vector
          </button>
          <button
            className="btn btn-dark"
            onClick={onCopy}
            disabled={!matrix}
            title="Copy PNG to clipboard"
            aria-label="Copy image to clipboard"
          >
            <IconCopy size={15} />
          </button>
        </div>
        <p className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-muted">
          <span>
            {style.exportPx}px PNG → <span className="font-bold text-cream-dim">{printCm} × {printCm} cm</span> at 300 DPI
          </span>
          <span className={Number(printCm) < 2 ? "font-bold text-rust" : ""}>
            {Number(printCm) < 2 ? "below 2 cm minimum" : "above 2 cm minimum"}
          </span>
        </p>
      </div>
    </section>
  );
}

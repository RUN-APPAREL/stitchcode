import { useEffect, useMemo, useRef, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import { QrCode, WifiOff, History, Trash2, RotateCcw, ArrowDown, ScanLine } from "lucide-react";
import {
  THEMES,
  applyTheme,
  getInitialTheme,
  persistTheme,
  type ThemeId,
} from "./lib/themes";
import type { QRType, FormState } from "./lib/payloads";
import { DEFAULT_FORMS, buildPayload, summarize } from "./lib/payloads";
import { createMatrix, renderSVG, type QRMatrix } from "./lib/qr";
import { ToastProvider, Reveal, Pill, Tele, Tip, useToast } from "./components/ui";
import { ContentForms } from "./components/ContentForms";
import { StylePanel, DEFAULT_STYLE, toRenderOptions, type StyleState } from "./components/StylePanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { useLogoGrid } from "./lib/useLogoGrid";
import { Checklist, FAQ } from "./components/Sections";

/* ------------------------------------------------------------------ */
/* History persistence                                                 */
/* ------------------------------------------------------------------ */
interface HistoryItem {
  id: string;
  ts: number;
  type: QRType;
  forms: FormState;
  style: StyleState;
  payload: string;
}
const HISTORY_KEY = "qrsmith:history";

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [theme, setTheme] = useState<ThemeId>(getInitialTheme);

  const switchTheme = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    persistTheme(id);
  };

  return (
    <ToastProvider>
      <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-bg text-ink">
        {/* ambient layers */}
        <div className="bg-blueprint pointer-events-none fixed inset-0 z-0" aria-hidden />
        <div className="bg-noise pointer-events-none fixed inset-0 z-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none fixed -top-40 left-1/2 z-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.16] blur-[110px]"
          style={{ background: "var(--t-accent)" }}
          aria-hidden
        />

        <div className="relative z-10">
          <Header theme={theme} onTheme={switchTheme} />
          <Opener />
          <Workbench />
          <Checklist />
          <FAQ />
          <Footer />
        </div>
      </div>
      </MotionConfig>
    </ToastProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Header with quick-theme selector                                    */
/* ------------------------------------------------------------------ */
function Header({ theme, onTheme }: { theme: ThemeId; onTheme: (t: ThemeId) => void }) {
  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-ink bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border-[1.5px] border-ink bg-ink text-bg shadow-brutal-accent">
            <QrCode size={19} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[17px] font-black tracking-tight">QRsmith</span>
            <span className="block font-mono text-[8.5px] font-bold uppercase tracking-[0.28em] text-ink-muted">
              code studio
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-5 md:flex">
          {[
            ["Studio", "#studio"],
            ["Field manual", "#checklist"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-ink-dim transition-colors hover:text-accent"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Tele tone="ok" className="hidden sm:inline-flex">
            <WifiOff size={11} /> 100% offline
          </Tele>
          <div className="flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-surface p-1 shadow-brutal-sm">
            {THEMES.map((t) => (
              <Tip key={t.id} text={`${t.name} · ${t.tag}`}>
                <motion.button
                  aria-label={`Switch to ${t.name} theme`}
                  onClick={() => onTheme(t.id)}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  className={`relative h-6 w-6 overflow-hidden rounded-full border-[1.5px] ${
                    theme === t.id ? "border-ink ring-2 ring-accent ring-offset-1 ring-offset-bg" : "border-ink/40"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.bg} 0 50%, ${t.accent} 50% 100%)`,
                  }}
                >
                  {theme === t.id && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.ink }} />
                    </span>
                  )}
                </motion.button>
              </Tip>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Opener — characteristic of the subject                              */
/* ------------------------------------------------------------------ */
function Opener() {
  const sample = useMemo(() => {
    const m = createMatrix("https://qrsmith.studio", "Q");
    return renderSVG(m, toRenderOptions(DEFAULT_STYLE, null, 0, "transparent"), 420);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
        <Reveal>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Tele tone="accent">QR code studio</Tele>
            <Tele tone="ok">no signup</Tele>
            <Tele tone="ok">works offline</Tele>
          </div>
          <h1 className="font-display text-[clamp(42px,7vw,84px)] font-black leading-[0.95] tracking-[-0.025em] text-ink">
            Codes that scan
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">first try,</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.45, type: "spring", stiffness: 120, damping: 20 }}
                className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.28em] origin-left bg-accent"
                style={{ transform: "skewX(-8deg)" }}
              />
            </span>
            <br />
            every time.
          </h1>
          <p className="mt-6 max-w-[440px] text-[15px] font-semibold leading-relaxed text-ink-dim">
            QRsmith encodes, styles and proofs your QR codes entirely in-browser — with a live
            scan-safety report that enforces quiet zones, contrast and error correction before
            anything hits the press.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Pill onClick={() => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" })}>
              Open the studio <ArrowDown size={14} />
            </Pill>
            <Pill
              variant="ghost"
              onClick={() => document.getElementById("checklist")?.scrollIntoView({ behavior: "smooth" })}
            >
              <ScanLine size={14} /> Field manual
            </Pill>
          </div>
          <div className="mt-10 grid max-w-[440px] grid-cols-3 gap-3">
            {[
              ["7", "content types"],
              ["5", "print previews"],
              ["0", "data sent out"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-[12px] border-[1.5px] border-ink bg-surface px-4 py-3 shadow-brutal-sm">
                <span className="block font-display text-[26px] font-black leading-none text-accent2">{n}</span>
                <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* floating specimen */}
        <Reveal className="relative hidden justify-center lg:flex">
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="animate-floaty relative w-[330px]"
            style={{ ["--fl-rot" as string]: "-4deg" }}
          >
            <div className="absolute -left-8 top-10 h-full w-full rounded-[16px] border-[1.5px] border-ink bg-accent2" />
            <div className="relative overflow-hidden rounded-[16px] border-[1.5px] border-ink bg-white p-7 shadow-brutal">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  live preview
                </span>
                <span className="h-2.5 w-2.5 rotate-45 bg-accent" />
              </div>
              <div className="qr-live" dangerouslySetInnerHTML={{ __html: sample }} />
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-neutral-200 pt-3">
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  clear margins
                </span>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  strong contrast
                </span>
              </div>
            </div>
            <div className="absolute -right-6 -top-5 rotate-6 rounded-full border-[1.5px] border-ink bg-accent px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent-ink shadow-brutal-sm">
              scans ✓
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Workbench + history                                                 */
/* ------------------------------------------------------------------ */
function Workbench() {
  const toast = useToast();
  const [type, setType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [style, setStyle] = useState<StyleState>(DEFAULT_STYLE);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const saveTimer = useRef<number | null>(null);

  const payload = useMemo(() => buildPayload(type, forms), [type, forms]);

  const matrix: QRMatrix | null = useMemo(() => {
    if (!payload) return null;
    try {
      return createMatrix(payload, style.ec);
    } catch {
      return null; // payload over capacity for this EC level
    }
  }, [payload, style.ec]);

  /* rasterise the uploaded mark into a module grid for the merge */
  const { grid: logoGrid, n: logoN } = useLogoGrid(
    style.logo,
    matrix,
    style.logoScale,
    style.logoThreshold,
    style.bg,
  );

  /* autosave history (debounced) */
  useEffect(() => {
    if (!payload || !matrix) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setHistory((h) => {
        const sig = JSON.stringify({ p: payload, s: { ...style, logo: style.logo ? "1" : "0" } });
        if (h[0] && JSON.stringify({ p: h[0].payload, s: { ...h[0].style, logo: h[0].style.logo ? "1" : "0" } }) === sig)
          return h;
        const item: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ts: Date.now(),
          type,
          forms,
          style,
          payload,
        };
        const next = [item, ...h].slice(0, 8);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* storage full — skip */
        }
        return next;
      });
    }, 600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [payload, matrix, type, forms, style]);

  const restore = (item: HistoryItem) => {
    setType(item.type);
    setForms(item.forms);
    setStyle(item.style);
    toast("success", "Build restored from history");
    document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });
  };

  const removeItem = (id: string) => {
    setHistory((h) => {
      const next = h.filter((x) => x.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const clearAll = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    toast("info", "History cleared");
  };

  const filenameBase = `qrsmith-${type}-${summarize(type, forms).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) || "code"}`;

  return (
    <section id="studio" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8">
      <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Tele tone="accent" className="mb-3">the workbench</Tele>
          <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-black leading-[1.02] tracking-tight text-ink">
            Compose, style, proof.
          </h2>
        </div>
        <p className="max-w-[300px] text-[13px] font-semibold leading-relaxed text-ink-dim">
          Everything you change re-encodes in real time. The proof panel re-runs every safety check on each keystroke.
        </p>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Reveal className="space-y-6">
          <ContentForms type={type} setType={setType} forms={forms} patch={setForms} />
          <StylePanel style={style} setStyle={setStyle} />
        </Reveal>
        <Reveal>
          <PreviewPanel
            payload={payload}
            matrix={matrix}
            style={style}
            filenameBase={filenameBase}
            logoGrid={logoGrid}
            logoN={logoN}
          />
        </Reveal>
      </div>

      {/* history */}
      {history.length > 0 && (
        <Reveal className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-[17px] font-black tracking-tight text-ink">
              <History size={16} className="text-accent" /> Recent builds
              <span className="rounded-full border border-line bg-surface2 px-2 py-0.5 font-mono text-[10px] font-bold text-ink-dim">
                {history.length}
              </span>
            </h3>
            <Pill variant="ghost" className="!px-3.5 !py-1.5 !text-[10.5px]" onClick={clearAll}>
              <Trash2 size={12} /> Clear all
            </Pill>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {history.map((item) => {
              let thumb = "";
              try {
                const m = createMatrix(item.payload, item.style.ec);
                thumb = renderSVG(m, { ...toRenderOptions(item.style, null, 0), margin: 2 }, 96);
              } catch {
                thumb = "";
              }
              return (
                <div
                  key={item.id}
                  className="group relative w-[124px] shrink-0 overflow-hidden rounded-[12px] border-[1.5px] border-ink bg-surface shadow-brutal-sm transition-transform hover:-translate-y-1"
                >
                  <button
                    onClick={() => restore(item)}
                    title="Restore this build"
                    className="block w-full p-2.5 text-left"
                    style={{ background: item.style.bg }}
                  >
                    <div className="qr-live" dangerouslySetInnerHTML={{ __html: thumb }} />
                  </button>
                  <div className="flex items-center justify-between border-t-[1.5px] border-line bg-surface2/70 px-2.5 py-1.5">
                    <span className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-ink-dim">
                      {item.type} · {timeAgo(item.ts)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Delete from history"
                      className="text-ink-muted transition-colors hover:text-danger"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <span className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase text-bg">
                      <RotateCcw size={9} /> restore
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="border-t-[1.5px] border-ink bg-ink text-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border-[1.5px] border-bg/40 bg-bg text-ink">
            <QrCode size={16} />
          </span>
          <div>
            <span className="block font-display text-[15px] font-black tracking-tight">QRsmith</span>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-bg/50">
              built local-first
            </span>
          </div>
        </div>
        <p className="max-w-[380px] text-[12.5px] font-semibold leading-relaxed text-bg/70">
          Everything is generated right in your browser.
          <span className="text-accent"> Nothing you create ever leaves this device.</span>
        </p>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-bg/35 px-2 py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-bg/85">
            ✓ no trackers
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-bg/35 px-2 py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-bg/85">
            ✓ no cloud
          </span>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { createMatrix, renderSVG } from "./lib/qr";
import {
  buildPayload,
  DEFAULT_FORMS,
  QR_TYPE_META,
  summarize,
  validate,
  type FormState,
  type QRType,
} from "./lib/payloads";
import { ContentForm, PayloadInspector } from "./components/ContentForms";
import { DEFAULT_STYLE, StylePanel, type StyleState } from "./components/StylePanel";
import { PreviewPanel } from "./components/PreviewPanel";
import {
  ChecklistSection,
  FaqSection,
  Footer,
  SpecSection,
  TickerStrip,
} from "./components/Sections";
import {
  PanelHeading,
  Reveal,
  ToastProvider,
  useDebounced,
  useLocalStorage,
  useToast,
} from "./components/ui";
import {
  IconArrowUpRight,
  IconBolt,
  IconContact,
  IconHistory,
  IconLink,
  IconMail,
  IconPhone,
  IconRefresh,
  IconShield,
  IconSms,
  IconText,
  IconTrash,
  IconWifi,
  IconX,
  LogoMark,
} from "./components/icons";

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

interface HistoryEntry {
  id: string;
  ts: number;
  type: QRType;
  title: string;
  payload: string;
  forms: FormState;
  style: StyleState;
  sig: string;
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

function MiniQR({
  payload,
  style,
  px,
}: {
  payload: string;
  style: StyleState;
  px: number;
}) {
  const svg = useMemo(() => {
    try {
      return renderSVG(createMatrix(payload, style.ec), style, px);
    } catch {
      return "";
    }
  }, [payload, style, px]);
  if (!svg) return null;
  return (
    <div
      className="rounded-[10px] p-[6px]"
      style={{ background: style.bg, border: "1.5px solid var(--color-line-soft)" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Type tabs                                                           */
/* ------------------------------------------------------------------ */

const TYPE_ICONS: Record<QRType, React.ReactNode> = {
  url: <IconLink size={15} />,
  text: <IconText size={15} />,
  wifi: <IconWifi size={15} />,
  vcard: <IconContact size={15} />,
  email: <IconMail size={15} />,
  sms: <IconSms size={15} />,
  phone: <IconPhone size={15} />,
};

function TypeTabs({
  type,
  onChange,
}: {
  type: QRType;
  onChange: (t: QRType) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {(Object.keys(QR_TYPE_META) as QRType[]).map((t) => {
        const active = t === type;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`flex items-center gap-2 rounded-[10px] border-[1.5px] px-3.5 py-2.5 text-[13px] font-bold transition-all duration-150 ${
              active
                ? "border-ink-950 bg-cream text-ink-950 shadow-hard-sm"
                : "border-line-soft bg-ink-700 text-cream-dim hover:-translate-y-0.5 hover:border-line hover:text-cream"
            }`}
          >
            {TYPE_ICONS[t]}
            {QR_TYPE_META[t].short}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* History rail                                                        */
/* ------------------------------------------------------------------ */

function HistoryRail({
  history,
  onRestore,
  onDelete,
  onClear,
}: {
  history: HistoryEntry[];
  onRestore: (e: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <Reveal className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconHistory size={16} className="text-amber" />
          <h3 className="font-display text-[17px] font-semibold text-cream">
            Recent codes
          </h3>
          <span className="chip font-mono !text-[10.5px]">{history.length}</span>
        </div>
        {history.length > 0 && (
          <button className="btn btn-ghost !px-3 !py-1.5 !text-[12px]" onClick={onClear}>
            <IconTrash size={13} /> Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[12px] border-[1.5px] border-dashed border-line bg-ink-850/50 px-5 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border-[1.5px] border-line bg-ink-700 text-amber">
            <IconBolt size={15} />
          </span>
          <p className="text-[13px] font-medium leading-relaxed text-muted">
            Everything you forge is bookmarked here automatically — stored in
            this browser only, never uploaded.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {history.map((e) => (
            <div
              key={e.id}
              className="card card-hover group w-[218px] shrink-0 p-3.5"
            >
              <div className="mb-3 flex justify-center rounded-[10px] bg-ink-850/70 p-2.5">
                <MiniQR payload={e.payload} style={e.style} px={140} />
              </div>
              <p className="truncate text-[12.5px] font-bold text-cream" title={e.title}>
                {e.title}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-muted">
                {QR_TYPE_META[e.type].short} · {timeAgo(e.ts)}
              </p>
              <div className="mt-3 flex gap-1.5">
                <button
                  className="btn btn-primary flex-1 !px-2 !py-1.5 !text-[12px]"
                  onClick={() => onRestore(e)}
                >
                  <IconRefresh size={12} /> Restore
                </button>
                <button
                  className="btn btn-ghost !p-2 !text-muted hover:!text-rust"
                  onClick={() => onDelete(e.id)}
                  aria-label="Delete entry"
                  title="Delete"
                >
                  <IconX size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

function Studio() {
  const toast = useToast();
  const [qrType, setQrType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [style, setStyle] = useState<StyleState>(DEFAULT_STYLE);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>(
    "qrsmith.history.v1",
    [],
  );

  const issues = useMemo(() => validate(qrType, forms), [qrType, forms]);
  const payload = issues.length === 0 ? buildPayload(qrType, forms) : "";
  const matrix = useMemo(() => {
    if (!payload) return null;
    try {
      return createMatrix(payload, style.ec);
    } catch {
      return null;
    }
  }, [payload, style.ec]);

  /* autosave snapshots — debounced so typing settles first */
  const sig = payload ? JSON.stringify([qrType, payload, style]) : "";
  const settledSig = useDebounced(sig, 900);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!settledSig) return;
    setHistory((h) => {
      if (h[0]?.sig === settledSig) return h;
      const entry: HistoryEntry = {
        id: uid(),
        ts: Date.now(),
        type: qrType,
        title: summarize(qrType, forms),
        payload,
        forms,
        style,
        sig: settledSig,
      };
      return [entry, ...h.filter((e) => e.sig !== settledSig)].slice(0, 18);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledSig]);

  const restore = (e: HistoryEntry) => {
    setQrType(e.type);
    setForms(e.forms);
    setStyle({ ...DEFAULT_STYLE, ...e.style });
    document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });
    toast("info", `Restored “${e.title}”`);
  };

  const filenameBase = `qrsmith-${qrType}-v${matrix?.version ?? "x"}`;

  return (
    <section id="studio" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8">
      <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
            The studio
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-cream sm:text-[38px]">
            Pick a payload.
            <br />
            The proof updates live.
          </h2>
        </div>
        <p className="max-w-sm text-[14px] leading-relaxed text-muted">
          Seven encoders, one spec-safe pipeline. Every change re-encodes the
          matrix and re-runs the scan-safety checks in the same breath.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_404px]">
        {/* left column */}
        <div className="space-y-5">
          <Reveal className="card p-5">
            <PanelHeading
              kicker="01 · Payload"
              title={QR_TYPE_META[qrType].label}
              right={
                <span className="chip font-mono !text-[10.5px]">
                  {issues.length === 0 ? "valid" : "drafting"}
                </span>
              }
            />
            <TypeTabs type={qrType} onChange={setQrType} />
            <ContentForm type={qrType} forms={forms} setForms={setForms} />
            <PayloadInspector type={qrType} forms={forms} />
          </Reveal>

          <Reveal delay={80}>
            <StylePanel style={style} setStyle={setStyle} />
          </Reveal>
        </div>

        {/* right column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal delay={120}>
            <PreviewPanel
              payload={payload}
              matrix={matrix}
              style={style}
              filenameBase={filenameBase}
            />
          </Reveal>
        </div>
      </div>

      <HistoryRail
        history={history}
        onRestore={restore}
        onDelete={(id) => setHistory((h) => h.filter((e) => e.id !== id))}
        onClear={() => {
          setHistory([]);
          toast("info", "History cleared");
        }}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const heroStyle: StyleState = { ...DEFAULT_STYLE, ec: "M" };
  return (
    <header className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Reveal className="mb-6 flex flex-wrap items-center gap-2">
            <span className="chip !border-amber/50 !bg-amber/10 !text-amber">
              <IconBolt size={11} /> QR STUDIO
            </span>
            <span className="chip">
              <IconShield size={11} /> runs entirely in your browser
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.01em] text-cream sm:text-[64px]">
              Forge QR codes
              <br />
              that{" "}
              <span className="relative inline-block">
                scan
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 220 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10.5C60 3.5 150 2.5 216 7.5"
                    stroke="var(--color-amber)"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    className="draw-underline"
                  />
                </svg>
              </span>{" "}
              on the
              <br />
              first try.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-7 max-w-lg text-[15.5px] leading-relaxed text-muted">
              A local-first workbench for spec-safe codes: seven payload types,
              logo embedding with automatic level-H protection, live WCAG
              contrast and quiet-zone checks, and vector-perfect SVG exports —
              nothing ever leaves your machine.
            </p>
          </Reveal>

          <Reveal delay={240} className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#studio" className="btn btn-primary">
              Open the studio
              <span className="arrow-key">
                <IconArrowUpRight size={11} />
              </span>
            </a>
            <a href="#checklist" className="btn btn-dark">
              Read the field manual
            </a>
          </Reveal>

          <Reveal delay={320} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
            {[
              ["7", "payload types"],
              ["ISO", "18004 : 2015"],
              ["0", "bytes uploaded"],
            ].map(([n, l]) => (
              <div key={l} className="flex items-baseline gap-2.5">
                <span className="font-display text-[26px] font-semibold text-amber">
                  {n}
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
                  {l}
                </span>
              </div>
            ))}
          </Reveal>
        </div>

        {/* specimen card */}
        <Reveal delay={200} className="relative hidden lg:block">
          <div
            className="absolute -right-3 top-8 h-64 w-64 rotate-6 rounded-[20px] border-[1.5px] border-ink-950 bg-amber shadow-hard-lg"
            aria-hidden="true"
          />
          <div
            className="absolute -left-6 bottom-2 h-24 w-24 -rotate-12 rounded-[16px] border-[1.5px] border-line bg-ink-700 shadow-hard"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-[340px] -rotate-2">
            <div
              className="float-slow rounded-[22px] border-[1.5px] border-ink-950 bg-cream p-4 shadow-hard-lg"
              style={{ ["--tilt" as string]: "0deg" }}
            >
              <MiniQR
                payload="https://qrsmith.studio/hello"
                style={heroStyle}
                px={300}
              />
              <div className="mt-3 flex items-center justify-between px-1">
                <p className="text-[12px] font-bold text-ink-950">
                  qrsmith.studio/hello
                </p>
                <span className="rounded-full border-[1.5px] border-ink-950 px-2 py-0.5 font-mono text-[10px] font-bold text-ink-950">
                  V2 · 25×25
                </span>
              </div>
            </div>
            <div className="absolute -right-9 top-10 rotate-3 rounded-[10px] border-[1.5px] border-ink-950 bg-ink-950 px-3.5 py-2 shadow-hard">
              <p className="flex items-center gap-2 text-[12px] font-bold text-amber">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amber" />
                decodes in &lt; 0.1 s
              </p>
            </div>
            <div className="absolute -left-12 bottom-16 -rotate-6 rounded-[10px] border-[1.5px] border-line bg-ink-700 px-3.5 py-2 shadow-hard">
              <p className="text-[12px] font-bold text-cream-dim">quiet zone: 4 mod ✓</p>
            </div>
          </div>
        </Reveal>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b-[1.5px] border-line-soft bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-3">
          <LogoMark size={30} />
          <span className="font-display text-[18px] font-semibold tracking-tight text-cream">
            QRsmith
          </span>
          <span className="ml-1 hidden rounded-full border-[1.5px] border-line px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted sm:inline">
            QR studio
          </span>
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {[
            ["Studio", "#studio"],
            ["Checklist", "#checklist"],
            ["Specs", "#specs"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[13px] font-bold text-muted transition-colors hover:text-cream"
            >
              {label}
            </a>
          ))}
        </div>
        <a href="#studio" className="btn btn-primary !px-4 !py-2.5 !text-[13px]">
          Start forging
        </a>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <div id="top" className="bg-stage relative min-h-screen overflow-x-clip">
        <div className="bg-gridlines pointer-events-none absolute inset-x-0 top-0 h-[850px]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-24 top-[46%] hidden opacity-[0.045] xl:block"
          aria-hidden="true"
        >
          <MiniQR payload="QRsmith ambient watermark 2026" style={DEFAULT_STYLE} px={340} />
        </div>

        <div className="relative">
          <Nav />
          <Hero />
          <TickerStrip />
          <Studio />
          <ChecklistSection />
          <SpecSection />
          <FaqSection />
          <Footer />
        </div>
      </div>
    </ToastProvider>
  );
}

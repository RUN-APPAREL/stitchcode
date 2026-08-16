import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, ShieldCheck, Ruler, Contrast, Aperture, Printer, BookOpen } from "lucide-react";
import { EC_INFO, type ECLevel } from "../lib/qr";
import { IndustrialCard, Reveal, Tele } from "./ui";

/* ------------------------------------------------------------------ */
/* Telemetry marquee                                                   */
/* ------------------------------------------------------------------ */
const TICKS = [
  "QUIET ZONE ≥ 4 MODULES",
  "ISO/IEC 18004 COMPLIANT",
  "ECC LEVEL H FOR LOGOS",
  "MIN CONTRAST 4.5 : 1",
  "DARK ON LIGHT POLARITY",
  "300 DPI FOR PRINT",
  "TEST ON REAL HARDWARE",
  "KEEP PRINTS ≥ 2 CM",
  "ZERO NETWORK CALLS",
];

export function Ticker() {
  const row = [...TICKS, ...TICKS];
  return (
    <div className="relative overflow-hidden border-y-[1.5px] border-ink bg-ink py-2.5">
      <div className="animate-marquee flex w-max items-center gap-6">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-bg">
            {t}
            <span className="inline-block h-[7px] w-[7px] rotate-45 bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field manual — numbered print rules                                 */
/* ------------------------------------------------------------------ */
const RULES = [
  {
    icon: Aperture,
    title: "Guard the quiet zone",
    body: "Four modules of clear space on every side is the ISO minimum. Artwork, die-cuts and fold lines that creep into it are the number-one cause of dead codes.",
  },
  {
    icon: Contrast,
    title: "Ink dark, field light",
    body: "Scanners expect positive polarity with at least 4.5:1 contrast. Neon ink on a black tee looks great and scans nowhere.",
  },
  {
    icon: Ruler,
    title: "Size for the distance",
    body: "Rule of thumb: 10× the scan distance. A code read from a table needs ~2 cm; from across a counter, 4–5 cm. Never print below 2 cm.",
  },
  {
    icon: ShieldCheck,
    title: "Redundancy is cheap",
    body: "Level Q or H costs a few extra modules and buys tolerance for scuffs, creases and sticky fingers. Print always means Q minimum.",
  },
  {
    icon: Printer,
    title: "Print, then test",
    body: "Screen proofs lie. Print the actual material, scan it with at least two different phones, from an angle, in dim light.",
  },
  {
    icon: BookOpen,
    title: "Keep the payload lean",
    body: "Every byte adds modules. Short links, compact vCards and level-appropriate text keep codes sparse, fast and forgiving.",
  },
];

export function Checklist() {
  return (
    <section id="checklist" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Tele tone="accent" className="mb-3">the field manual</Tele>
          <h2 className="font-display text-[clamp(28px,4vw,44px)] font-black leading-[1.02] tracking-tight text-ink">
            Six rules that keep
            <br />
            every code <span className="text-accent">scannable.</span>
          </h2>
        </div>
        <p className="max-w-[300px] text-[13.5px] font-semibold leading-relaxed text-ink-dim">
          Distilled from ISO/IEC 18004 and a decade of print failures — the checks QRsmith runs live while you build.
        </p>
      </Reveal>

      <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RULES.map((r, i) => (
          <article
            key={r.title}
            className="group relative overflow-hidden rounded-[14px] border-[1.5px] border-ink bg-surface p-5 shadow-brutal-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-brutal"
          >
            <div className="absolute inset-x-0 top-0 h-[5px] bg-accent opacity-70 transition-opacity group-hover:opacity-100" />
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-ink bg-accent/15 text-accent2">
                <r.icon size={19} />
              </span>
              <span className="font-mono text-[26px] font-bold leading-none text-line">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mb-2 text-[15px] font-black tracking-tight text-ink">{r.title}</h3>
            <p className="text-[12.5px] font-medium leading-relaxed text-ink-dim">{r.body}</p>
          </article>
        ))}
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Error-correction spec table                                         */
/* ------------------------------------------------------------------ */
export function ECSection() {
  return (
    <section id="specs" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Reveal>
          <Tele tone="accent" className="mb-3">error correction</Tele>
          <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-black leading-[1.05] tracking-tight text-ink">
            Four grades of damage tolerance.
          </h2>
          <p className="mt-4 text-[13.5px] font-semibold leading-relaxed text-ink-dim">
            Reed–Solomon codes weave recovery data through the matrix. The more you reserve, the more of the label can be torn, faded or stickered over — and the denser the code becomes.
          </p>
          <ul className="mt-5 space-y-2.5">
            {[
              ["Screens & ephemera", "Level M"],
              ["Everyday print", "Level Q"],
              ["Logos & harsh surfaces", "Level H"],
            ].map(([use, lvl]) => (
              <li key={use} className="flex items-center gap-3 text-[13px] font-bold text-ink-dim">
                <span className="h-[7px] w-[7px] rotate-45 bg-accent" />
                {use}
                <span className="ml-auto rounded-full border border-line bg-surface2 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-ink">
                  {lvl}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <IndustrialCard stripe="var(--t-accent2)">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b-[1.5px] border-ink bg-surface2/70">
                    {["Level", "Grade", "Recovers", "Data capacity", "Recovery budget"].map((h) => (
                      <th key={h} className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {(Object.keys(EC_INFO) as ECLevel[]).map((k) => {
                    const e = EC_INFO[k];
                    return (
                      <tr key={k} className="transition-colors hover:bg-accent/8">
                        <td className="px-5 py-3.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border-[1.5px] border-ink bg-ink font-mono text-[13px] font-bold text-bg">
                            {k}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-black text-ink">{e.label}</td>
                        <td className="px-5 py-3.5 text-[12.5px] font-semibold text-ink-dim">{e.recovery}</td>
                        <td className="px-5 py-3.5 text-[12.5px] font-semibold text-ink-dim">{e.capacity}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-[7px] w-24 overflow-hidden rounded-full border border-line bg-surface2">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${100 - e.pct}%` }} />
                            </div>
                            <span className="font-mono text-[10.5px] font-bold text-ink-muted">{100 - e.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </IndustrialCard>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordion                                                       */
/* ------------------------------------------------------------------ */
const FAQS = [
  {
    q: "Are my codes generated on a server?",
    a: "No. QRsmith is 100% local-first — encoding, styling and export all happen in your browser via a spec-compliant ISO/IEC 18004 engine. Nothing you type ever leaves the device, which is why the tool works fully offline.",
  },
  {
    q: "How big can I print my code?",
    a: "As large as you like. The SVG export is true vector, so a billboard is as sharp as a business card. For PNG, pick 2048px for large-format work and check the 300-DPI size readout under the proof.",
  },
  {
    q: "Will my logo break the scan?",
    a: "Only if it's greedy. QRsmith forces error correction to level H when you add a logo and flags coverage above ~26%. Keep the mark small, centred, and away from the three finder eyes and it will decode everywhere.",
  },
  {
    q: "Why does the app insist on a light background?",
    a: "Positive polarity — dark modules on a light field — is what camera pipelines are tuned for. Inverted codes fail on a meaningful share of real hardware, so the scan report calls them out as a risk.",
  },
  {
    q: "What's the quiet zone, really?",
    a: "It's the empty margin that tells a scanner where the code begins. The standard sets it at four modules minimum; QRsmith measures yours live and warns the moment you dip below spec.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 pb-24 sm:px-8">
      <Reveal className="mb-8 text-center">
        <Tele tone="accent" className="mb-3">straight answers</Tele>
        <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-black tracking-tight text-ink">
          Before you ask the internet.
        </h2>
      </Reveal>
      <Reveal stagger className="space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={`overflow-hidden rounded-[12px] border-[1.5px] transition-shadow ${
                isOpen ? "border-ink bg-surface shadow-brutal" : "border-line bg-surface/70"
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-[14px] font-black tracking-tight text-ink">{f.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                    isOpen ? "border-ink bg-accent text-accent-ink" : "border-line text-ink-dim"
                  }`}
                >
                  <Plus size={14} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-[13px] font-medium leading-relaxed text-ink-dim">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}

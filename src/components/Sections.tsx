import { useState, type ReactNode } from "react";
import { Reveal } from "./ui";
import {
  IconBolt,
  IconChevron,
  IconContrast,
  IconLayers,
  IconLink,
  IconRuler,
  IconShield,
  LogoMark,
} from "./icons";

/* ------------------------------------------------------------------ */
/* Tips ticker (ProjectOne-style marquee)                              */
/* ------------------------------------------------------------------ */

const TICKER_TIPS = [
  "Quiet zone ≥ 4 modules",
  "EC level H when embedding logos",
  "Minimum print size 2 × 2 cm",
  "Contrast ratio ≥ 4.5 : 1",
  "Dark on light — never invert",
  "Test on 3 different phones",
  "SVG for print, PNG for screens",
  "Short payloads scan faster",
  "Keep 10× the code size as read distance",
  "No gradients across modules",
  "ISO/IEC 18004 : 2015 compliant",
  "Avoid glossy laminates at eye level",
];

export function TickerStrip() {
  const row = (ariaHidden: boolean) => (
    <div className="flex items-center gap-3 pr-3" aria-hidden={ariaHidden}>
      {TICKER_TIPS.map((tip, i) => (
        <span
          key={i}
          className="flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-line bg-ink-700 px-4 py-2.5 text-[13px] font-bold text-cream-dim"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber" />
          {tip}
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee overflow-hidden border-y-[1.5px] border-line-soft bg-ink-850/80 py-4">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Checklist                                                           */
/* ------------------------------------------------------------------ */

const CHECKLIST: Array<{
  n: string;
  icon: ReactNode;
  title: string;
  body: string;
  span?: string;
}> = [
  {
    n: "01",
    icon: <IconLayers size={19} />,
    title: "Respect the quiet zone",
    body: "Scanners locate the code by its blank border. Keep at least 4 modules of breathing room on every side — and never let design elements, die-cut lines or fold creases eat into it.",
    span: "lg:col-span-4",
  },
  {
    n: "02",
    icon: <IconContrast size={19} />,
    title: "Contrast is non-negotiable",
    body: "Cameras read luminance, not colour. Dark modules on a light background with a contrast ratio of 4.5 : 1 or higher decode fastest. Inverted codes fail on a surprising number of readers.",
    span: "lg:col-span-4",
  },
  {
    n: "03",
    icon: <IconRuler size={19} />,
    title: "Size for the scan distance",
    body: "The rule of thumb is 10 : 1 — a code scanned from 50 cm should be at least 5 cm wide. Nothing printed should ever be smaller than 2 × 2 cm.",
    span: "lg:col-span-4",
  },
  {
    n: "04",
    icon: <IconShield size={19} />,
    title: "Match error correction to reality",
    body: "Level Q is the everyday sweet spot. Jump to H the moment you embed a logo, print on curved packaging, or expect wear and tear — it recovers up to 30% damage.",
    span: "lg:col-span-6",
  },
  {
    n: "05",
    icon: <IconBolt size={19} />,
    title: "Test where it will actually live",
    body: "Scan the real print, in situ, with three different phones — tilted, from the edge, in bright light. A two-minute test catches what a thousand pixels of preview never will.",
    span: "lg:col-span-6",
  },
];

export function ChecklistSection() {
  return (
    <section id="checklist" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
              Field manual
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-cream sm:text-[40px]">
              Five rules that decide
              <br />
              if it scans.
            </h2>
          </div>
          <p className="max-w-xs text-[14px] leading-relaxed text-muted">
            Every QRsmith export is checked against these automatically — the
            report sits right under your live proof.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {CHECKLIST.map((item, i) => (
          <Reveal
            key={item.n}
            delay={i * 70}
            className={`card card-hover p-6 ${item.span ?? ""}`}
            as="article"
          >
            <div className="mb-5 flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border-[1.5px] border-ink-950 bg-amber text-ink-950 shadow-hard-sm">
                {item.icon}
              </span>
              <span className="font-display text-[26px] font-semibold text-line">
                {item.n}
              </span>
            </div>
            <h3 className="font-display text-[19px] font-semibold text-cream">
              {item.title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* EC spec table                                                       */
/* ------------------------------------------------------------------ */

const EC_ROWS = [
  {
    level: "L",
    name: "Low",
    recovery: "≈ 7%",
    capacity: "100%",
    best: "Clean digital surfaces, short-lived campaigns",
    rec: false,
  },
  {
    level: "M",
    name: "Medium",
    recovery: "≈ 15%",
    capacity: "≈ 86%",
    best: "Screen display where space is tight",
    rec: false,
  },
  {
    level: "Q",
    name: "Quartile",
    recovery: "≈ 25%",
    capacity: "≈ 66%",
    best: "Print, packaging, everyday workhorse",
    rec: true,
  },
  {
    level: "H",
    name: "High",
    recovery: "≈ 30%",
    capacity: "≈ 56%",
    best: "Logo embeds, outdoor & high-wear placements",
    rec: false,
  },
];

export function SpecSection() {
  return (
    <section id="specs" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20 sm:px-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Reveal className="card overflow-hidden lg:col-span-3">
          <div className="border-b-[1.5px] border-line-soft px-6 py-5">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
              Reference
            </p>
            <h2 className="font-display text-2xl font-semibold text-cream">
              Error-correction levels
            </h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-[1.5px] border-line-soft text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                <th className="px-6 py-3">Level</th>
                <th className="px-3 py-3">Recovers</th>
                <th className="px-3 py-3">Capacity</th>
                <th className="px-6 py-3">Best for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft/70">
              {EC_ROWS.map((r) => (
                <tr
                  key={r.level}
                  className={`transition-colors hover:bg-ink-700/60 ${
                    r.rec ? "bg-amber/[0.05]" : ""
                  }`}
                >
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] border-[1.5px] font-display text-[15px] font-semibold ${
                        r.rec
                          ? "border-ink-950 bg-amber text-ink-950 shadow-hard-sm"
                          : "border-line bg-ink-700 text-cream-dim"
                      }`}
                    >
                      {r.level}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-[13px] text-cream-dim">
                    {r.recovery}
                  </td>
                  <td className="px-3 py-3.5 font-mono text-[13px] text-cream-dim">
                    {r.capacity}
                  </td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-muted">
                    {r.best}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <Reveal delay={100} className="card p-6 lg:col-span-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
            Anatomy
          </p>
          <h2 className="font-display text-2xl font-semibold text-cream">
            What the squares mean
          </h2>
          <ul className="mt-5 space-y-4">
            {[
              [
                "Finder patterns",
                "The three big corner squares. Cameras lock onto these to find, orient and size the code — always leave them untouched.",
              ],
              [
                "Timing tracks",
                "The alternating dots between finders. They tell the decoder the module grid pitch, which is why they stay square here.",
              ],
              [
                "Alignment marks",
                "Smaller squares on larger codes that correct lens distortion when scanning big prints at an angle.",
              ],
              [
                "Data modules",
                "Everything else — your payload, interleaved with Reed–Solomon parity that makes damage recovery possible.",
              ],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-[7px] h-2 w-2 shrink-0 rounded-[3px] bg-amber" />
                <div>
                  <p className="text-[14px] font-bold text-cream">{t}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Why does my QR code sometimes fail to scan?",
    a: "Almost always one of three things: the quiet zone got eaten by surrounding design, contrast dropped below ~4 : 1 (tinted backgrounds are the usual culprit), or the code is too small for the scan distance. QRsmith's scan-safety report flags all three before you export.",
  },
  {
    q: "PNG or SVG — which should I export?",
    a: "SVG for anything printed or scaled — it's pure vector, so a billboard and a business card come from the same file. PNG for screens, documents and chat. Export at 1024px or higher so it stays crisp when shrunk.",
  },
  {
    q: "Does adding a logo make the code unreliable?",
    a: "Not if done by the book: level-H error correction recovers up to ~30% of lost modules, and a centred logo covering under ~25% of the surface sits well inside that budget. QRsmith enforces both rules automatically and pads the logo so it never touches live modules.",
  },
  {
    q: "Where does my data go?",
    a: "Nowhere. The entire encoder runs in your browser tab — payloads are built, encoded and rendered locally, and history lives in your own localStorage. There is no server, no tracking pixel, no link rewriting.",
  },
  {
    q: "Will my QR code expire?",
    a: "The pattern itself never expires — it's mathematics, not a service. What can expire is the destination. For anything long-lived, point the code at a stable URL you control and redirect behind it, so you can change the target without reprinting.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 pb-24 sm:px-8">
      <Reveal className="mb-8 text-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
          Straight answers
        </p>
        <h2 className="font-display text-3xl font-semibold text-cream sm:text-[36px]">
          Asked at every print shop.
        </h2>
      </Reveal>
      <div className="space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={f.q} delay={i * 50}>
              <div
                className={`card overflow-hidden transition-colors ${
                  isOpen ? "!border-line" : ""
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-[16px] font-semibold text-cream">
                    {f.q}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 border-ink-950 bg-amber text-ink-950"
                        : "border-line bg-ink-700 text-cream-dim"
                    }`}
                  >
                    <IconChevron size={14} />
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[14px] leading-relaxed text-muted">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export function Footer() {
  return (
    <footer className="border-t-[1.5px] border-line-soft bg-ink-850/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark size={30} />
          <div>
            <p className="font-display text-[16px] font-semibold text-cream">QRsmith</p>
            <p className="text-[11.5px] font-medium text-muted">
              Encodes locally · nothing ever leaves your browser
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">
            <IconShield size={11} /> ISO/IEC 18004
          </span>
          <span className="chip">
            <IconLink size={11} /> Reed–Solomon ECC
          </span>
          <span className="chip font-mono">v1.0</span>
        </div>
      </div>
    </footer>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconCheck, IconInfo, IconAlert, IconX } from "./icons";

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export function useDebounced<T>(value: T, ms = 700): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/* Scroll reveal                                                       */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-reveal
      className={`${className} ${shown ? "revealed" : ""}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

export interface Toast {
  id: number;
  kind: "success" | "info" | "error";
  text: string;
}

const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-ink-950 bg-cream text-ink-950 pl-3 pr-2 py-2.5 shadow-hard max-w-xs"
            role="status"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                t.kind === "success"
                  ? "bg-ink-950 text-moss"
                  : t.kind === "error"
                    ? "bg-rust text-ink-950"
                    : "bg-ink-950 text-amber"
              }`}
            >
              {t.kind === "error" ? <IconAlert size={11} /> : <IconCheck size={11} />}
            </span>
            <p className="text-[13px] font-bold leading-tight">{t.text}</p>
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="ml-1 rounded p-1 text-ink-950/50 hover:text-ink-950 transition-colors"
              aria-label="Dismiss"
            >
              <IconX size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

export function Seg<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex rounded-[10px] border-[1.5px] border-line-soft bg-ink-850 p-1 gap-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-[7px] font-bold transition-all duration-150 ${
              size === "sm" ? "px-2 py-1 text-[11.5px]" : "px-2.5 py-1.5 text-[12.5px]"
            } ${
              active
                ? "bg-cream text-ink-950 shadow-[2px_2px_0_0_var(--color-ink-950)]"
                : "text-muted hover:text-cream"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  trailing,
}: {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-cream-dim">
          {label}
        </span>
        {trailing ??
          (hint && <span className="text-[11px] font-medium text-muted">{hint}</span>)}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-rust">
          <IconAlert size={12} /> {error}
        </p>
      )}
    </label>
  );
}

export function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
  warn,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  warn?: string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-cream-dim">
          {label}
        </span>
        <span className="chip !py-1 font-mono !text-[11px] !text-amber">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {warn && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-rust">
          <IconAlert size={12} /> {warn}
        </p>
      )}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const commit = (v: string) => {
    const t = v.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) onChange(t);
    else if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) onChange(`#${t}`);
  };

  return (
    <div className="flex-1">
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.08em] text-cream-dim">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-line-soft bg-ink-850 p-1.5 pl-2">
        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[7px] border border-line">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)]"
            aria-label={`${label} colour`}
          />
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(text)}
          onKeyDown={(e) => e.key === "Enter" && commit(text)}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-[13px] font-medium text-cream outline-none"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

export function PanelHeading({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber">
          {kicker}
        </p>
        <h2 className="font-display text-[19px] font-semibold leading-tight text-cream">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

export function PassFail({ pass, children }: { pass: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
        pass ? "bg-moss/15 text-moss" : "bg-rust/15 text-rust"
      }`}
    >
      {pass ? <IconCheck size={9} /> : <IconInfo size={9} />}
      {children}
    </span>
  );
}

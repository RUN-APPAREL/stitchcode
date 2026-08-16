import type { FormState, QRType } from "../lib/payloads";
import { buildPayload, normalizeUrl, validate } from "../lib/payloads";
import { byteLength } from "../lib/qr";
import { Field, Seg } from "./ui";
import { IconAlert, IconCheck } from "./icons";

export function ContentForm({
  type,
  forms,
  setForms,
}: {
  type: QRType;
  forms: FormState;
  setForms: (fn: (f: FormState) => FormState) => void;
}) {
  const patch = (p: Partial<FormState>) => setForms((f) => ({ ...f, ...p }));

  switch (type) {
    case "url":
      return (
        <div className="space-y-4">
          <Field label="Destination URL" hint="https:// is added automatically">
            <input
              className="input font-mono !text-[13.5px]"
              placeholder="yourshop.com/menu"
              value={forms.url}
              onChange={(e) => patch({ url: e.target.value })}
              autoFocus
              spellCheck={false}
            />
          </Field>
          <div className="rounded-[10px] border-[1.5px] border-dashed border-line-soft bg-ink-850/60 px-3.5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
              Pro move — keep it short
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-cream-dim">
              Every character adds modules. Route long URLs through a redirect
              service so the code stays sparse and scannable from a distance.
            </p>
          </div>
        </div>
      );

    case "text":
      return (
        <Field label="Text to encode" hint={`${forms.text.length} chars`}>
          <textarea
            className="input min-h-[132px] resize-y leading-relaxed"
            placeholder="Wi-Fi password, serial number, secret note…"
            value={forms.text}
            onChange={(e) => patch({ text: e.target.value })}
          />
        </Field>
      );

    case "wifi":
      return (
        <div className="space-y-4">
          <Field label="Network name (SSID)">
            <input
              className="input"
              placeholder="Cafe Luna Guest"
              value={forms.wifi.ssid}
              onChange={(e) =>
                patch({ wifi: { ...forms.wifi, ssid: e.target.value } })
              }
              autoFocus
            />
          </Field>
          <Field label="Security" hint="WPA covers WPA2 & WPA3">
            <Seg
              options={[
                { value: "WPA", label: "WPA" },
                { value: "WEP", label: "WEP" },
                { value: "nopass", label: "Open" },
              ]}
              value={forms.wifi.encryption}
              onChange={(v) => patch({ wifi: { ...forms.wifi, encryption: v } })}
            />
          </Field>
          {forms.wifi.encryption !== "nopass" && (
            <Field label="Password">
              <input
                className="input font-mono !text-[13.5px]"
                placeholder="••••••••••"
                value={forms.wifi.password}
                onChange={(e) =>
                  patch({ wifi: { ...forms.wifi, password: e.target.value } })
                }
              />
            </Field>
          )}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border-[1.5px] border-line-soft bg-ink-850 px-3.5 py-2.5 transition-colors hover:border-line">
            <input
              type="checkbox"
              className="accent-[var(--color-amber)] h-4 w-4"
              checked={forms.wifi.hidden}
              onChange={(e) =>
                patch({ wifi: { ...forms.wifi, hidden: e.target.checked } })
              }
            />
            <span className="text-[13px] font-bold text-cream-dim">
              Network is hidden (not broadcast)
            </span>
          </label>
        </div>
      );

    case "vcard":
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input
              className="input"
              placeholder="Ada"
              value={forms.vcard.firstName}
              onChange={(e) =>
                patch({ vcard: { ...forms.vcard, firstName: e.target.value } })
              }
              autoFocus
            />
          </Field>
          <Field label="Last name">
            <input
              className="input"
              placeholder="Lovelace"
              value={forms.vcard.lastName}
              onChange={(e) =>
                patch({ vcard: { ...forms.vcard, lastName: e.target.value } })
              }
            />
          </Field>
          <Field label="Company">
            <input
              className="input"
              placeholder="Analytical Engines Ltd."
              value={forms.vcard.org}
              onChange={(e) =>
                patch({ vcard: { ...forms.vcard, org: e.target.value } })
              }
            />
          </Field>
          <Field label="Job title">
            <input
              className="input"
              placeholder="Chief Algorithm Officer"
              value={forms.vcard.title}
              onChange={(e) =>
                patch({ vcard: { ...forms.vcard, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Phone">
            <input
              className="input font-mono !text-[13.5px]"
              placeholder="+44 7700 900123"
              value={forms.vcard.phone}
              onChange={(e) =>
                patch({ vcard: { ...forms.vcard, phone: e.target.value } })
              }
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              placeholder="ada@engines.co"
              value={forms.vcard.email}
              onChange={(e) =>
                patch({ vcard: { ...forms.vcard, email: e.target.value } })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Website">
              <input
                className="input font-mono !text-[13.5px]"
                placeholder="analyticalengines.co"
                value={forms.vcard.website}
                onChange={(e) =>
                  patch({ vcard: { ...forms.vcard, website: e.target.value } })
                }
              />
            </Field>
          </div>
        </div>
      );

    case "email":
      return (
        <div className="space-y-4">
          <Field label="Recipient">
            <input
              className="input"
              placeholder="bookings@cafeluna.co"
              value={forms.email.to}
              onChange={(e) =>
                patch({ email: { ...forms.email, to: e.target.value } })
              }
              autoFocus
            />
          </Field>
          <Field label="Subject">
            <input
              className="input"
              placeholder="Table for four, Saturday"
              value={forms.email.subject}
              onChange={(e) =>
                patch({ email: { ...forms.email, subject: e.target.value } })
              }
            />
          </Field>
          <Field label="Message body">
            <textarea
              className="input min-h-[96px] resize-y leading-relaxed"
              placeholder="Prefilled draft the scanner can edit before sending…"
              value={forms.email.body}
              onChange={(e) =>
                patch({ email: { ...forms.email, body: e.target.value } })
              }
            />
          </Field>
        </div>
      );

    case "sms":
      return (
        <div className="space-y-4">
          <Field label="Phone number">
            <input
              className="input font-mono !text-[13.5px]"
              placeholder="+44 7700 900123"
              value={forms.sms.number}
              onChange={(e) =>
                patch({ sms: { ...forms.sms, number: e.target.value } })
              }
              autoFocus
            />
          </Field>
          <Field label="Prefilled message">
            <textarea
              className="input min-h-[96px] resize-y leading-relaxed"
              placeholder="Hi! I scanned the code on your window…"
              value={forms.sms.message}
              onChange={(e) =>
                patch({ sms: { ...forms.sms, message: e.target.value } })
              }
            />
          </Field>
        </div>
      );

    case "phone":
      return (
        <div className="space-y-4">
          <Field label="Phone number" hint="digits and + only">
            <input
              className="input font-mono !text-[15px]"
              placeholder="+44 7700 900123"
              value={forms.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              autoFocus
            />
          </Field>
          <div className="rounded-[10px] border-[1.5px] border-dashed border-line-soft bg-ink-850/60 px-3.5 py-3">
            <p className="text-[13px] leading-relaxed text-cream-dim">
              Scanning opens the dialler with this number ready. Great for
              reception desks, delivery vans and event badges.
            </p>
          </div>
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Raw payload inspector                                               */
/* ------------------------------------------------------------------ */

export function PayloadInspector({ type, forms }: { type: QRType; forms: FormState }) {
  const issues = validate(type, forms);
  const payload = issues.length === 0 ? buildPayload(type, forms) : "";
  const bytes = byteLength(payload);
  const url = type === "url" && payload ? normalizeUrl(forms.url) : "";

  return (
    <div className="mt-5 overflow-hidden rounded-[10px] border-[1.5px] border-line-soft bg-ink-950/70">
      <div className="flex items-center justify-between border-b-[1.5px] border-line-soft px-3.5 py-2">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
          Encoded payload
        </p>
        <div className="flex items-center gap-2">
          {payload && bytes > 180 && (
            <span className="flex items-center gap-1 text-[10.5px] font-bold text-amber">
              <IconAlert size={10} /> dense
            </span>
          )}
          <span className="font-mono text-[11px] font-medium text-cream-dim">
            {bytes} B
          </span>
        </div>
      </div>
      {payload ? (
        <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all px-3.5 py-3 font-mono text-[12px] leading-relaxed text-moss">
          {payload}
        </pre>
      ) : (
        <p className="px-3.5 py-3 text-[12.5px] font-medium text-muted">
          {issues[0] ?? "Waiting for input…"}
        </p>
      )}
      {url && !url.startsWith("https://") && (
        <p className="flex items-center gap-1.5 border-t-[1.5px] border-line-soft px-3.5 py-2 text-[11.5px] font-bold text-amber">
          <IconAlert size={11} /> Non-HTTPS link — some scanners will warn users.
        </p>
      )}
      {payload && (
        <p className="flex items-center gap-1.5 border-t-[1.5px] border-line-soft px-3.5 py-2 text-[11.5px] font-bold text-moss/90">
          <IconCheck size={11} /> Valid {type === "vcard" ? "vCard 3.0" : type.toUpperCase()} payload
        </p>
      )}
    </div>
  );
}

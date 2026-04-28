// Shared email template primitives for Irregular Pearl transactional and
// digest mail. Pure TypeScript, no Deno-specific APIs — importable from
// edge functions and from bun-based unit tests alike.
//
// Aesthetic follows DESIGN.md's Claude-kit direction:
//   - purple accent #6B4E7C, used sparingly
//   - Source Serif 4 for editorial prose (Georgia email-safe fallback)
//   - Inter for UI/meta (Arial email-safe fallback)
//   - neutral white background #FFFFFF
//   - 1px borders in #E5E3DE (0.5px is the web ideal; email clients round it up)
//   - wordmark: "IrregularPearl" in Inter medium, non-italic
//
// Keep the shape narrow — add primitives only when a real email surface needs
// them. Every added knob is an email client quirk waiting to happen.

export const TOKENS = {
  bg: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#6F6F6F",
  hint: "#9A9A9A",
  border: "#E5E3DE",
  borderStrong: "#CCC9C2",
  accent: "#6B4E7C",
  accentSoft: "#F2EEF5",
  serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  sans: "Inter, Arial, sans-serif",
} as const;

export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================
// Primitives
// ============================================================

/** A small-caps section label. Accent-purple, Inter, letter-spaced. */
export function kicker(text: string): string {
  return `<div style="font-family:${TOKENS.sans};font-size:11px;font-weight:500;color:${TOKENS.accent};letter-spacing:0.08em;text-transform:uppercase;">${esc(text)}</div>`;
}

/** Editorial heading (Source Serif). Sizes 18/22/28 cover most uses. */
export function heading(text: string, opts: { level?: "h1" | "h2" | "h3"; href?: string } = {}): string {
  const size = opts.level === "h1" ? 28 : opts.level === "h3" ? 18 : 22;
  const lineHeight = 1.25;
  const content = opts.href
    ? `<a href="${esc(opts.href)}" style="text-decoration:none;color:${TOKENS.ink};" target="_blank" rel="noopener">${esc(text)}</a>`
    : esc(text);
  return `<div style="font-family:${TOKENS.serif};font-size:${size}px;color:${TOKENS.ink};line-height:${lineHeight};">${content}</div>`;
}

/** Body paragraph. Serif for editorial prose, sans for UI/meta. */
export function paragraph(text: string, opts: { family?: "serif" | "sans"; muted?: boolean } = {}): string {
  const family = opts.family === "serif" ? TOKENS.serif : TOKENS.sans;
  const size = opts.family === "serif" ? 15 : 14;
  const lineHeight = opts.family === "serif" ? 1.68 : 1.55;
  const color = opts.muted ? TOKENS.muted : TOKENS.ink;
  return `<div style="font-family:${family};font-size:${size}px;color:${color};line-height:${lineHeight};">${esc(text)}</div>`;
}

/** Primary CTA button. Dark-ink solid, not accent-purple (matches web convention). */
export function primaryButton(opts: { text: string; href: string }): string {
  return `<a href="${esc(opts.href)}" style="display:inline-block;font-family:${TOKENS.sans};font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;background:${TOKENS.ink};" target="_blank" rel="noopener">${esc(opts.text)}</a>`;
}

/** Secondary link. Muted, underlined. */
export function link(opts: { text: string; href: string; muted?: boolean }): string {
  const color = opts.muted ? TOKENS.hint : TOKENS.accent;
  return `<a href="${esc(opts.href)}" style="color:${color};text-decoration:underline;" target="_blank" rel="noopener">${esc(opts.text)}</a>`;
}

/** Thin divider rule — matches the web's 0.5px border (1px is the email minimum). */
export function divider(opts: { color?: string } = {}): string {
  return `<div style="border-top:1px solid ${opts.color ?? TOKENS.border};"></div>`;
}

/**
 * Card block. White, 1px border, 12px radius, 16px padding. Signed notes and
 * other accent-emphasis uses pass `accent: true` for a 2px purple left border.
 */
export function card(opts: { html: string; accent?: boolean }): string {
  const borderLeft = opts.accent ? `border-left:2px solid ${TOKENS.accent};` : "";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;background:${TOKENS.bg};border:1px solid ${TOKENS.border};${borderLeft}border-radius:8px;">
<tr><td style="padding:16px 20px;">${opts.html}</td></tr>
</table>`;
}

// ============================================================
// Layout
// ============================================================

export interface EmailLayoutOpts {
  /** <title> and default subject fallback. */
  title: string;
  /** Preheader — the preview snippet most clients show next to the subject. */
  preheader?: string;
  /** Subtitle under the wordmark, e.g. "Weekly Digest". Inter caps. */
  subtitle?: string;
  /** Main body HTML, stacked inside the centered 600px column. */
  bodyHtml: string;
  /** Optional small footer note above the divider (e.g. "You're receiving…"). */
  footerNote?: string;
  /** Optional footer action link (e.g. unsubscribe). Rendered muted. */
  footerLink?: { text: string; href: string };
}

/** Wraps a body in the full email HTML layout with wordmark header + footer. */
export function renderEmailLayout(opts: EmailLayoutOpts): string {
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(opts.preheader)}</div>`
    : "";

  const subtitle = opts.subtitle
    ? `<div style="font-family:${TOKENS.sans};font-size:11px;font-weight:500;color:${TOKENS.hint};letter-spacing:0.12em;text-transform:uppercase;padding:8px 0 16px;">${esc(opts.subtitle)}</div>`
    : "";

  const footer = (opts.footerNote || opts.footerLink)
    ? `<tr><td class="wi" align="center" style="padding:24px 24px 0;">${divider()}</td></tr>
<tr><td class="wi" align="center" style="padding:16px 24px 0;">
  ${opts.footerNote ? `<div style="font-family:${TOKENS.sans};font-size:11px;color:${TOKENS.hint};line-height:1.6;">${esc(opts.footerNote)}</div>` : ""}
  ${opts.footerLink ? `<div style="font-family:${TOKENS.sans};font-size:11px;margin-top:6px;">${link({ ...opts.footerLink, muted: true })}</div>` : ""}
</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>${esc(opts.title)}</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%}table,td{border-collapse:collapse}body{margin:0;padding:0;background:${TOKENS.bg}}
@media only screen and (max-width:620px){.w{width:100%!important}.wi{padding:0 16px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${TOKENS.bg};-webkit-font-smoothing:antialiased;">
${preheader}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${TOKENS.bg};">
<tr><td align="center" valign="top" style="padding:32px 0 48px;">
<table role="presentation" class="w" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">

<!-- HEADER -->
<tr><td class="wi" align="center" style="padding:0 24px 20px;">
  <div style="font-family:${TOKENS.sans};font-size:22px;font-weight:500;color:${TOKENS.ink};padding:12px 0 0;">
    <a href="https://irregularpearl.org" style="text-decoration:none;color:${TOKENS.ink};" target="_blank" rel="noopener">IrregularPearl</a>
  </div>
  ${subtitle}
  ${divider()}
</td></tr>

<!-- BODY -->
<tr><td class="wi" style="padding:20px 24px 0;">
${opts.bodyHtml}
</td></tr>

${footer}

</table>
</td></tr></table>
</body></html>`;
}

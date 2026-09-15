const HTML_ESCAPE_PATTERN = /[&<>"']/g;
const LINE_BREAK_PATTERN = /\r?\n/g;

export function escapeHtml(value: string): string {
  return value.replace(HTML_ESCAPE_PATTERN, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

export function escapeWithBreaks(value: string): string {
  return escapeHtml(value).replace(LINE_BREAK_PATTERN, "<br />");
}

export function escapeInlineStyle(value: string): string {
  return value.replace(/<\/style/giu, "<\\/style");
}

export function fallbackText(value: string | undefined): string {
  return value && value.trim() !== "" ? value : "—";
}

export function toAnchorId(value: string): string {
  const token = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `if-op-${token || "item"}`;
}

export function toClassToken(value: string): string {
  const token = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return token || "generic";
}

export function toDepth(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(6, Math.trunc(value)));
}

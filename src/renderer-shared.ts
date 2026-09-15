import {
  escapeAttribute,
  escapeHtml,
  escapeWithBreaks,
  toAnchorId,
  toClassToken,
} from "./renderer-escape.ts";

export function buildOperationAnchorId(
  operationId: string,
  idPrefix = "",
): string {
  return `${idPrefix}${toAnchorId(operationId)}`;
}

export function renderSection(title: string, body: string): string {
  return [
    '<section class="if-section">',
    `  <h4 class="if-section__title">${escapeHtml(title)}</h4>`,
    body,
    "</section>",
  ].join("\n");
}

export function renderTextBlock(
  value: string | undefined,
  className: string,
): string {
  if (!value) {
    return "";
  }
  return `<p class="${escapeAttribute(className)}">${escapeWithBreaks(value)}</p>`;
}

export function renderCode(value: string): string {
  return `<code class="if-code">${escapeHtml(value)}</code>`;
}

export function renderChip(label: string, modifier?: string): string {
  return renderPill("if-chip", label, modifier);
}

export function renderBadge(label: string, modifier?: string): string {
  return renderPill("if-badge", label, modifier);
}

export function renderStatus(status: string): string {
  const tone = resolveStatusTone(status);
  return `<span class="if-status if-status--${tone}">${escapeHtml(status)}</span>`;
}

export function renderOperationLink(
  label: string,
  operationId: string,
  idPrefix = "",
): string {
  const anchorId = escapeAttribute(buildOperationAnchorId(operationId, idPrefix));
  return `<a class="if-link" href="#${anchorId}">${escapeHtml(label)}</a>`;
}

export function retryableLabel(retryable: boolean | undefined): string {
  if (retryable === true) return "Retryable";
  if (retryable === false) return "Non-retryable";
  return "—";
}

export function renderRetryableBadge(retryable: boolean | undefined): string {
  if (retryable === true) return renderBadge("Retryable", "retryable-yes");
  if (retryable === false) return renderBadge("Non-retryable", "retryable-no");
  return renderBadge("—", "retryable-unspecified");
}

export function renderTransportChip(transport: string): string {
  return renderChip(transport, toClassToken(transport));
}

function renderPill(
  baseClassName: string,
  label: string,
  modifier?: string,
): string {
  const classNames = modifier
    ? `${baseClassName} ${baseClassName}--${escapeAttribute(modifier)}`
    : baseClassName;
  return `<span class="${classNames}">${escapeHtml(label)}</span>`;
}

function resolveStatusTone(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (/^2/.test(normalized)) {
    return "2xx";
  }
  if (/^3/.test(normalized)) {
    return "3xx";
  }
  if (/^4/.test(normalized)) {
    return "4xx";
  }
  if (/^5/.test(normalized)) {
    return "5xx";
  }
  return "default";
}

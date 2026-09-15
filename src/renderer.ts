import type {
  NormalizedExample,
  NormalizedOperation,
  NormalizedSpec,
  RenderOptions,
} from "./model-normalized.ts";
import {
  escapeAttribute,
  escapeHtml,
  escapeInlineStyle,
} from "./renderer-escape.ts";
import {
  buildOperationAnchorId,
  renderBadge,
  renderChip,
  renderCode,
  renderSection,
  renderTextBlock,
  renderTransportChip,
} from "./renderer-shared.ts";
import {
  renderAddressTable,
  renderErrorTable,
  renderFieldTable,
  renderGenericTable,
  renderKeyValueTable,
  renderOverviewTable,
  renderResponseTable,
} from "./renderer-tables.ts";

export function renderSpecFragment(
  spec: NormalizedSpec,
  options: RenderOptions = {},
): string {
  const operations = filterOperations(spec.operations, options);
  const intro = [
    '<header class="if-spec__header if-section">',
    `  <h2 class="if-spec__title">${escapeHtml(spec.info.title)}</h2>`,
    `  <div class="if-spec__meta">${renderCode(spec.info.id)} ${renderBadge(spec.info.version, "version")}</div>`,
    renderTextBlock(spec.info.description, "if-spec__description"),
    "</header>",
  ].filter((value) => value !== "");
  const overview =
    operations.length > 0
      ? renderOverviewTable(operations)
      : renderSection(
          "Operation Overview",
          '<p class="if-empty">No operations matched the current filter.</p>',
        );

  return [
    '<section class="if-spec">',
    ...intro,
    overview,
    ...operations.map((operation) =>
      renderOperationCard(operation, options.idPrefix ?? ""),
    ),
    "</section>",
  ].join("\n");
}

export function renderSpecHtml(
  spec: NormalizedSpec,
  options: RenderOptions = {},
): string {
  const title = escapeHtml(options.title ?? spec.info.title);
  const lang = escapeAttribute(options.lang ?? "en");
  const styleTag =
    options.inlineCss && options.cssText
      ? `<style>${escapeInlineStyle(options.cssText)}</style>`
      : "";

  return [
    "<!DOCTYPE html>",
    `<html lang="${lang}">`,
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${title}</title>`,
    styleTag ? `  ${styleTag}` : "",
    "</head>",
    "<body>",
    renderSpecFragment(spec, options),
    "</body>",
    "</html>",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function renderOperationCard(
  operation: NormalizedOperation,
  idPrefix = "",
): string {
  const anchorId = escapeAttribute(
    buildOperationAnchorId(operation.id, idPrefix),
  );
  const sections = [
    operation.address ? renderAddressTable(operation.address) : "",
    renderKeyValueTable("Operation Metadata", operation.metaRows),
    renderKeyValueTable("Bindings", operation.bindingRows),
    renderKeyValueTable("Delivery", operation.deliveryRows),
    renderKeyValueTable("Retry", operation.retryRows),
    ...operation.genericTables.map(renderGenericTable),
    ...operation.parameterTables.map(renderFieldTable),
    ...operation.messageTables.map(renderFieldTable),
    renderResponseTable(operation.responseRows),
    renderErrorTable(operation.errorRows),
    renderExamples(operation.examples),
  ].filter((value) => value !== "");

  return [
    `<article class="if-operation" id="${anchorId}">`,
    '  <header class="if-operation__header">',
    `    <div class="if-kicker">${renderOperationKicker(operation)}</div>`,
    `    <h3 class="if-operation__title">${escapeHtml(operation.title)}</h3>`,
    `    <div class="if-subtle">${renderCode(operation.id)}</div>`,
    `    ${renderTextBlock(operation.summary, "if-operation__summary")}`,
    `    ${renderTextBlock(operation.description, "if-operation__description")}`,
    "  </header>",
    ...sections,
    "</article>",
  ].join("\n");
}

function renderOperationKicker(operation: NormalizedOperation): string {
  return [
    renderTransportChip(operation.transport),
    renderChip(operation.interfaceType, "interface"),
    renderChip(operation.pattern, "pattern"),
    ...operation.tags.map((tag) => renderChip(tag, "tag")),
  ].join("");
}

function renderExamples(examples: readonly NormalizedExample[]): string {
  if (examples.length === 0) {
    return "";
  }
  const body = examples
    .map((example) => {
      const role = example.role
        ? renderBadge(example.role, "example-role")
        : "";
      return [
        '<div class="if-example-card">',
        `  <div class="if-example-card__header"><strong>${escapeHtml(example.title)}</strong>${role}</div>`,
        `  <pre class="if-example"><code>${escapeHtml(example.value)}</code></pre>`,
        "</div>",
      ].join("\n");
    })
    .join("\n");
  return renderSection(
    "Examples",
    `<div class="if-example-grid">${body}</div>`,
  );
}

function filterOperations(
  operations: readonly NormalizedOperation[],
  options: RenderOptions,
): readonly NormalizedOperation[] {
  return operations.filter((operation) => matchesOperation(operation, options));
}

function matchesOperation(
  operation: NormalizedOperation,
  options: RenderOptions,
): boolean {
  if (
    options.includeOperations &&
    !options.includeOperations.includes(operation.id)
  ) {
    return false;
  }
  if (!options.include) {
    return true;
  }
  if (
    options.include.transport &&
    options.include.transport !== operation.transport
  ) {
    return false;
  }
  if (
    options.include.interfaceType &&
    options.include.interfaceType !== operation.interfaceType
  ) {
    return false;
  }
  if (
    options.include.pattern &&
    options.include.pattern !== operation.pattern
  ) {
    return false;
  }
  if (
    options.include.tags &&
    !options.include.tags.every((tag) => operation.tags.includes(tag))
  ) {
    return false;
  }
  return true;
}

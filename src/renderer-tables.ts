import type {
  KeyValueRow,
  NormalizedAddress,
  NormalizedErrorRow,
  NormalizedFieldTable,
  NormalizedGenericTable,
  NormalizedOperation,
  NormalizedResponseRow,
} from "./model-normalized.ts";
import {
  escapeAttribute,
  escapeHtml,
  fallbackText,
  toClassToken,
  toDepth,
} from "./renderer-escape.ts";
import {
  renderBadge,
  renderCode,
  renderOperationLink,
  renderRetryableBadge,
  renderSection,
  renderStatus,
  renderTransportChip,
} from "./renderer-shared.ts";

type TableConfig = {
  readonly title: string;
  readonly tableClass: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
};

export function renderOverviewTable(
  operations: readonly NormalizedOperation[],
  idPrefix = "",
): string {
  return renderTable({
    title: "Operation Overview",
    tableClass: "if-overview-table",
    headers: ["Operation", "Transport", "Pattern", "Address"],
    rows: operations.map((operation) => [
      [
        `<div class="if-stack">${renderOperationLink(operation.title, operation.id, idPrefix)}</div>`,
        `<div class="if-subtle">${renderCode(operation.id)}</div>`,
      ].join(""),
      renderTransportChip(operation.transport),
      escapeHtml(operation.pattern),
      operation.address
        ? `${escapeHtml(operation.address.label)}<br />${renderCode(operation.address.value)}`
        : "—",
    ]),
  });
}

export function renderAddressTable(address: NormalizedAddress): string {
  return renderTable({
    title: "Address",
    tableClass: "if-address-table",
    headers: ["Label", "Kind", "Method", "Value"],
    rows: [
      [
        escapeHtml(address.label),
        escapeHtml(address.kind),
        escapeHtml(fallbackText(address.method)),
        renderCode(address.value),
      ],
    ],
  });
}

export function renderKeyValueTable(
  title: string,
  rows: readonly KeyValueRow[],
): string {
  if (rows.length === 0) {
    return "";
  }
  return renderTable({
    title,
    tableClass: "if-meta-table",
    headers: ["Key", "Value"],
    rows: rows.map((row) => [
      escapeHtml(row.key),
      row.code ? renderCode(row.value) : escapeHtml(row.value),
    ]),
  });
}

export function renderGenericTable(table: NormalizedGenericTable): string {
  return renderTable({
    title: table.title,
    tableClass: "if-generic-table",
    headers: table.columns.map((column) => column.label),
    rows: table.rows.map((row) =>
      table.columns.map((column) => {
        const value = row[column.key] ?? "";
        return column.code ? renderCode(value) : escapeHtml(value);
      }),
    ),
  });
}

export function renderFieldTable(table: NormalizedFieldTable): string {
  return renderTable({
    title: table.title,
    tableClass: "if-field-table",
    headers: ["Field", "Type", "Required", "Description", "Example"],
    rows: table.rows.map((row) => [
      `<span class="if-field-path" style="--if-depth:${toDepth(row.depth)}">${escapeHtml(row.path)}</span>`,
      [
        renderCode(row.type),
        renderInlineMetadata(row.enumValues, row.unit),
      ].join(""),
      row.required
        ? renderBadge("Required", "required")
        : renderBadge("Optional", "optional"),
      escapeHtml(
        [
          fallbackText(row.description),
          row.enumValues ? `Enum: ${row.enumValues}` : "",
        ]
          .filter((value) => value !== "")
          .join(" · "),
      ),
      escapeHtml(fallbackText(row.example)),
    ]),
  });
}

export function renderResponseTable(
  rows: readonly NormalizedResponseRow[],
): string {
  if (rows.length === 0) {
    return "";
  }
  return renderTable({
    title: "Responses",
    tableClass: "if-response-table",
    headers: ["Status", "Schema", "Content Type", "Description"],
    rows: rows.map((row) => [
      renderStatus(row.status),
      row.schema ? renderCode(row.schema) : "—",
      escapeHtml(fallbackText(row.contentType)),
      escapeHtml(fallbackText(row.description)),
    ]),
  });
}

export function renderErrorTable(rows: readonly NormalizedErrorRow[]): string {
  if (rows.length === 0) {
    return "";
  }
  return renderTable({
    title: "Errors",
    tableClass: "if-error-table",
    headers: ["Code", "Status", "Retryable", "Description"],
    rows: rows.map((row) => [
      renderCode(row.code),
      row.status ? renderStatus(row.status) : "—",
      renderRetryableBadge(row.retryable),
      escapeHtml(row.description),
    ]),
  });
}

function renderInlineMetadata(
  enumValues: string | undefined,
  unit: string | undefined,
): string {
  const details = [
    enumValues
      ? `<span class="if-inline-meta">Enum: ${escapeHtml(enumValues)}</span>`
      : "",
    unit ? `<span class="if-inline-meta">Unit: ${escapeHtml(unit)}</span>` : "",
  ].filter((value) => value !== "");
  return details.length > 0
    ? `<div class="if-inline-list">${details.join("")}</div>`
    : "";
}

function renderTable({
  title,
  tableClass,
  headers,
  rows,
}: TableConfig): string {
  const tableTitleClass = toClassToken(title);
  const tableRows = rows
    .map(
      (row) =>
        `    <tr>\n${row
          .map((cell) => `      <td>${cell}</td>`)
          .join("\n")}\n    </tr>`,
    )
    .join("\n");
  const headerHtml = headers
    .map((header) => `      <th scope="col">${escapeHtml(header)}</th>`)
    .join("\n");
  const body = [
    `  <div class="if-table-wrap if-table-wrap--${escapeAttribute(tableTitleClass)}">`,
    `  <table class="${escapeAttribute(tableClass)} if-table--${escapeAttribute(tableTitleClass)}">`,
    `    <caption>${escapeHtml(title)}</caption>`,
    "    <thead>",
    "    <tr>",
    headerHtml,
    "    </tr>",
    "    </thead>",
    "    <tbody>",
    tableRows,
    "    </tbody>",
    "  </table>",
    "  </div>",
  ].join("\n");
  return renderSection(title, body);
}

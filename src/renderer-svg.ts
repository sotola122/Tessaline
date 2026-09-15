import { escapeXml } from "./svg-xml.ts";
import { retryableLabel } from "./renderer-shared.ts";
import type {
  NormalizedAddress,
  NormalizedErrorRow,
  NormalizedExample,
  NormalizedFieldTable,
  NormalizedGenericTable,
  NormalizedOperation,
  NormalizedResponseRow,
  NormalizedSpec,
  RenderOptions,
  KeyValueRow,
} from "./model-normalized.ts";

export interface InterfaceSvgResult {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
}

type TableModel = {
  readonly title: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
};

const FONT =
  "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const PAGE_WIDTH = 1200;
const MARGIN = 24;
const TITLE_SIZE = 22;
const SECTION_SIZE = 14;
const CELL_SIZE = 12;
const PAD_X = 10;
const PAD_Y = 8;
const LINE = 1.35;
const GAP = 18;
const HEADER_FILL = "#005ead";
const ROW_ALT = "#f6fbff";
const BORDER = "#8fb6d6";
const TEXT = "#182230";
const MUTED = "#4b6478";

function measure(text: string, fontSize: number): number {
  let width = 0;
  for (const char of Array.from(text)) {
    const code = char.codePointAt(0) ?? 0;
    width += code > 0x2e80 ? fontSize : fontSize * 0.58;
  }
  return Math.max(width, fontSize * 0.4);
}

function wrap(text: string, width: number, fontSize: number): string[] {
  const capacity = Math.max(1, Math.floor(width / Math.max(fontSize * 0.5, 1)));
  const source = text.length > 0 ? text : "—";
  const lines: string[] = [];
  for (const paragraph of source.split(/\r?\n/)) {
    const points = Array.from(paragraph);
    if (points.length === 0) {
      lines.push("");
      continue;
    }
    for (let i = 0; i < points.length; i += capacity) {
      lines.push(points.slice(i, i + capacity).join(""));
    }
  }
  return lines.length > 0 ? lines : ["—"];
}

function columnWidths(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
  available: number,
): number[] {
  const mins = headers.map((header, index) => {
    const widest = Math.max(
      measure(header, CELL_SIZE),
      ...rows.map((row) => measure(row[index] ?? "", CELL_SIZE)),
    );
    return Math.min(available, Math.max(64, widest + PAD_X * 2));
  });
  const total = mins.reduce((sum, width) => sum + width, 0);
  if (total <= available) {
    const extra = available - total;
    return mins.map((width, index) =>
      index === mins.length - 1 ? width + extra : width,
    );
  }
  const scale = available / total;
  return mins.map((width) => width * scale);
}

function tableModels(operation: NormalizedOperation): TableModel[] {
  const tables: TableModel[] = [];
  if (operation.address) tables.push(addressTable(operation.address));
  pushKeyValue(tables, "Operation Metadata", operation.metaRows);
  pushKeyValue(tables, "Bindings", operation.bindingRows);
  pushKeyValue(tables, "Delivery", operation.deliveryRows);
  pushKeyValue(tables, "Retry", operation.retryRows);
  for (const table of operation.genericTables) tables.push(genericTable(table));
  for (const table of operation.parameterTables) tables.push(fieldTable(table));
  for (const table of operation.messageTables) tables.push(fieldTable(table));
  if (operation.responseRows.length > 0) {
    tables.push(responseTable(operation.responseRows));
  }
  if (operation.errorRows.length > 0) tables.push(errorTable(operation.errorRows));
  if (operation.examples.length > 0) tables.push(exampleTable(operation.examples));
  return tables;
}

function addressTable(address: NormalizedAddress): TableModel {
  return {
    title: "Address",
    headers: ["Label", "Kind", "Method", "Value"],
    rows: [[address.label, address.kind, address.method ?? "—", address.value]],
  };
}

function pushKeyValue(
  tables: TableModel[],
  title: string,
  rows: readonly KeyValueRow[],
): void {
  if (rows.length === 0) return;
  tables.push({
    title,
    headers: ["Key", "Value"],
    rows: rows.map((row) => [row.key, row.value]),
  });
}

function genericTable(table: NormalizedGenericTable): TableModel {
  return {
    title: table.title,
    headers: table.columns.map((column) => column.label),
    rows: table.rows.map((row) =>
      table.columns.map((column) => row[column.key] ?? ""),
    ),
  };
}

function fieldTable(table: NormalizedFieldTable): TableModel {
  return {
    title: table.title,
    headers: ["Field", "Type", "Required", "Description", "Example"],
    rows: table.rows.map((row) => [
      row.path,
      row.type,
      row.required ? "Required" : "Optional",
      row.description ?? "—",
      row.example ?? "—",
    ]),
  };
}

function responseTable(rows: readonly NormalizedResponseRow[]): TableModel {
  return {
    title: "Responses",
    headers: ["Status", "Schema", "Content Type", "Description"],
    rows: rows.map((row) => [
      row.status,
      row.schema ?? "—",
      row.contentType ?? "—",
      row.description ?? "—",
    ]),
  };
}

function errorTable(rows: readonly NormalizedErrorRow[]): TableModel {
  return {
    title: "Errors",
    headers: ["Code", "Status", "Retryable", "Description"],
    rows: rows.map((row) => [
      row.code,
      row.status ?? "—",
      retryableLabel(row.retryable),
      row.description,
    ]),
  };
}

function exampleTable(examples: readonly NormalizedExample[]): TableModel {
  return {
    title: "Examples",
    headers: ["Title", "Role", "Value"],
    rows: examples.map((example) => [
      example.title,
      example.role ?? "—",
      example.value,
    ]),
  };
}

function emitText(
  x: number,
  y: number,
  body: string,
  options: { size: number; fill?: string; weight?: number },
): string {
  return `<text x="${x}" y="${y}" font-size="${options.size}" font-weight="${options.weight ?? 400}" fill="${options.fill ?? TEXT}" font-family="${FONT}">${escapeXml(body)}</text>`;
}

function emitTable(table: TableModel, x: number, y: number, width: number): { svg: string; height: number } {
  const inner = width;
  const widths = columnWidths(table.headers, table.rows, inner);
  const headerLines = table.headers.map((header, index) =>
    wrap(header, widths[index]! - PAD_X * 2, CELL_SIZE),
  );
  const headerHeight =
    Math.max(1, ...headerLines.map((lines) => lines.length)) * CELL_SIZE * LINE +
    PAD_Y * 2;
  const body = table.rows.map((row) =>
    row.map((cell, index) => wrap(cell, widths[index]! - PAD_X * 2, CELL_SIZE)),
  );
  const rowHeights = body.map(
    (row) =>
      Math.max(1, ...row.map((lines) => lines.length)) * CELL_SIZE * LINE +
      PAD_Y * 2,
  );
  const titleHeight = SECTION_SIZE * LINE + 8;
  let cursor = y + titleHeight;
  const parts: string[] = [
    emitText(x, y + SECTION_SIZE, table.title, {
      size: SECTION_SIZE,
      weight: 700,
      fill: HEADER_FILL,
    }),
    `<rect x="${x}" y="${cursor}" width="${inner}" height="${headerHeight}" fill="${HEADER_FILL}"/>`,
  ];
  let colX = x;
  table.headers.forEach((header, index) => {
    let textY = cursor + PAD_Y + CELL_SIZE;
    for (const line of headerLines[index] ?? [header]) {
      parts.push(
        emitText(colX + PAD_X, textY, line, {
          size: CELL_SIZE,
          fill: "#ffffff",
          weight: 700,
        }),
      );
      textY += CELL_SIZE * LINE;
    }
    colX += widths[index]!;
  });
  cursor += headerHeight;
  body.forEach((row, rowIndex) => {
    const height = rowHeights[rowIndex]!;
    const fill = rowIndex % 2 === 1 ? ROW_ALT : "#ffffff";
    parts.push(
      `<rect x="${x}" y="${cursor}" width="${inner}" height="${height}" fill="${fill}" stroke="${BORDER}" stroke-width="1"/>`,
    );
    colX = x;
    row.forEach((lines, index) => {
      let textY = cursor + PAD_Y + CELL_SIZE;
      for (const line of lines) {
        parts.push(
          emitText(colX + PAD_X, textY, line, { size: CELL_SIZE, fill: TEXT }),
        );
        textY += CELL_SIZE * LINE;
      }
      colX += widths[index]!;
    });
    cursor += height;
  });
  return { svg: parts.join("\n"), height: cursor - y + 4 };
}

export function renderSpecSvg(
  spec: NormalizedSpec,
  options: RenderOptions = {},
): InterfaceSvgResult {
  const operations = spec.operations;
  const innerWidth = PAGE_WIDTH - MARGIN * 2;
  const parts: string[] = [];
  let y = MARGIN;
  parts.push(
    emitText(MARGIN, y + TITLE_SIZE, spec.info.title, {
      size: TITLE_SIZE,
      weight: 700,
    }),
  );
  y += TITLE_SIZE + 10;
  parts.push(
    emitText(MARGIN, y + 14, `${spec.info.id} · ${spec.info.version}`, {
      size: 13,
      fill: MUTED,
    }),
  );
  y += 28;
  if (spec.info.description) {
    for (const line of wrap(spec.info.description, innerWidth, 13)) {
      parts.push(emitText(MARGIN, y + 13, line, { size: 13, fill: MUTED }));
      y += 13 * LINE;
    }
    y += 8;
  }

  const overview: TableModel = {
    title: "Operation Overview",
    headers: ["Operation", "Transport", "Pattern", "Address"],
    rows: operations.map((operation) => [
      `${operation.title} (${operation.id})`,
      operation.transport,
      operation.pattern,
      operation.address?.value ?? "—",
    ]),
  };
  const overviewDrawn = emitTable(overview, MARGIN, y, innerWidth);
  parts.push(overviewDrawn.svg);
  y += overviewDrawn.height + GAP;

  for (const operation of operations) {
    if (options.operation && options.operation !== operation.id) continue;
    parts.push(
      emitText(MARGIN, y + 16, operation.title, {
        size: 16,
        weight: 700,
        fill: HEADER_FILL,
      }),
    );
    y += 26;
    parts.push(
      emitText(
        MARGIN,
        y + 13,
        `${operation.transport} · ${operation.interfaceType} · ${operation.pattern}`,
        { size: 12, fill: MUTED },
      ),
    );
    y += 22;
    for (const table of tableModels(operation)) {
      const drawn = emitTable(table, MARGIN, y, innerWidth);
      parts.push(drawn.svg);
      y += drawn.height + GAP;
    }
  }

  const height = Math.max(y + MARGIN, 120);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_WIDTH} ${height.toFixed(2)}" width="${PAGE_WIDTH}" height="${height.toFixed(2)}" role="img" aria-label="${escapeXml(spec.info.title)}" class="tessaline-svg">`,
    `<rect width="${PAGE_WIDTH}" height="${height.toFixed(2)}" fill="#ffffff"/>`,
    ...parts,
    "</svg>",
  ].join("\n");
  return { svg, width: PAGE_WIDTH, height };
}

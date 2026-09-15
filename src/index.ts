import { TessalineError, type DiagramDiagnostic } from "./errors.ts";
import { parseSpec, parseJsonOrYamlObject } from "./parser.ts";
import { assertValidSpec, validateSpec } from "./validator.ts";
import { filterOperations, normalizeSpec } from "./normalizer.ts";
import { renderSpecFragment, renderSpecHtml } from "./renderer.ts";
import { renderSpecSvg } from "./renderer-svg.ts";
import type { InterfaceSpec } from "./model.ts";
import type { RenderOptions, ValidationIssue } from "./model-normalized.ts";

export type {
  InterfaceSpec,
  Operation,
  Transport,
} from "./model.ts";
export type {
  NormalizedSpec,
  ValidationIssue,
  RenderOptions,
} from "./model-normalized.ts";
export { parseSpec, parseJsonOrYamlObject } from "./parser.ts";
export { validateSpec, assertValidSpec } from "./validator.ts";
export { normalizeSpec, filterOperations } from "./normalizer.ts";
export { renderSpecFragment, renderSpecHtml } from "./renderer.ts";
export { renderSpecSvg } from "./renderer-svg.ts";
export { TessalineError, DiagramRenderError } from "./errors.ts";
export type { DiagramDiagnostic } from "./errors.ts";

export interface InterfaceParseContext {
  readonly sourceName?: string;
}

export interface InterfaceParseResult {
  readonly spec: InterfaceSpec;
  readonly diagnostics: readonly DiagramDiagnostic[];
}

export interface InterfaceHtmlResult {
  readonly html: string;
  readonly operationIds: readonly string[];
  readonly sectionIds: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly diagnostics: readonly DiagramDiagnostic[];
}

export interface InterfaceSvgRenderResult {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
  readonly operationIds: readonly string[];
  readonly sectionIds: readonly string[];
  readonly sourcePaths: readonly string[];
  readonly diagnostics: readonly DiagramDiagnostic[];
}

export interface InterfaceRenderOptions extends RenderOptions {
  readonly context?: InterfaceParseContext;
  readonly sourcePath?: string;
  readonly renderer?: "html" | "svg";
}

function fromIssues(issues: readonly ValidationIssue[]): DiagramDiagnostic[] {
  return issues.map((issue) => ({
    code: issue.severity === "error" ? "IF_E_VALIDATE" : "IF_W_VALIDATE",
    severity: issue.severity,
    message: issue.message,
    path: issue.path,
  }));
}

export function parseInterfaceSpec(
  source: string,
  context: InterfaceParseContext = {},
): InterfaceParseResult {
  const sourceName = context.sourceName ?? "<inline>";
  try {
    const spec = parseSpec(source, sourceName);
    const diagnostics = fromIssues(validateSpec(spec));
    return { spec, diagnostics };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const diagnostic: DiagramDiagnostic = {
      code: "IF_E_PARSE",
      severity: "error",
      message,
    };
    throw new TessalineError(`${sourceName}: ${message}`, [diagnostic]);
  }
}

function compileFiltered(
  source: string,
  options: InterfaceRenderOptions,
) {
  const parsed = parseInterfaceSpec(source, options.context);
  const errors = parsed.diagnostics.filter((item) => item.severity === "error");
  if (errors.length > 0) {
    throw new TessalineError(errors[0]?.message ?? "interface spec invalid", errors);
  }
  assertValidSpec(parsed.spec);
  const filtered = filterOperations(parsed.spec, {
    operation: options.operation,
    include: options.include,
    includeOperations: options.includeOperations,
  });
  const sourcePaths = options.sourcePath ? [options.sourcePath] : [];
  return { parsed, filtered, sourcePaths };
}

function sectionIdsFrom(
  normalized: ReturnType<typeof normalizeSpec>,
): string[] {
  return normalized.operations.flatMap((operation) => [
    operation.id,
    ...operation.genericTables.map((table) => table.title),
    ...operation.parameterTables.map((table) => table.title),
    ...operation.messageTables.map((table) => table.title),
  ]);
}

export function renderInterfaceHTML(
  source: string,
  options: InterfaceRenderOptions = {},
): InterfaceHtmlResult {
  const { parsed, filtered, sourcePaths } = compileFiltered(source, options);
  if (filtered.operations.length === 0) {
    return {
      html: "",
      operationIds: [],
      sectionIds: [],
      sourcePaths,
      diagnostics: [
        {
          code: "IF_E_EMPTY_FILTER",
          severity: "error",
          message: "No operations matched the current filter",
        },
      ],
    };
  }

  const normalized = normalizeSpec(filtered);
  const html = renderSpecFragment(normalized, options);
  return {
    html,
    operationIds: normalized.operations.map((operation) => operation.id),
    sectionIds: sectionIdsFrom(normalized),
    sourcePaths,
    diagnostics: parsed.diagnostics.filter((item) => item.severity === "warning"),
  };
}

export function renderInterfaceSVG(
  source: string,
  options: InterfaceRenderOptions = {},
): InterfaceSvgRenderResult {
  const { parsed, filtered, sourcePaths } = compileFiltered(source, options);
  if (filtered.operations.length === 0) {
    return {
      svg: "",
      width: 0,
      height: 0,
      operationIds: [],
      sectionIds: [],
      sourcePaths,
      diagnostics: [
        {
          code: "IF_E_EMPTY_FILTER",
          severity: "error",
          message: "No operations matched the current filter",
        },
      ],
    };
  }
  if (filtered.operations.length > 1) {
    throw new TessalineError(
      "SVG output is limited to a single operation. Use renderer: html for the full spec, or set operation: <id> to export one operation as SVG.",
      [
        {
          code: "IF_E_SVG_MULTI_OP",
          severity: "error",
          message:
            "SVG output is limited to a single operation. Use renderer: html for the full spec, or set operation: <id> to export one operation as SVG.",
        },
      ],
    );
  }
  const normalized = normalizeSpec(filtered);
  const rendered = renderSpecSvg(normalized, options);
  return {
    svg: rendered.svg,
    width: rendered.width,
    height: rendered.height,
    operationIds: normalized.operations.map((operation) => operation.id),
    sectionIds: sectionIdsFrom(normalized),
    sourcePaths,
    diagnostics: parsed.diagnostics.filter((item) => item.severity === "warning"),
  };
}

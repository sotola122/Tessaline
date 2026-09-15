export type DiagramDiagnosticSeverity = "error" | "warning";

export interface DiagramDiagnostic {
  readonly code: string;
  readonly severity: DiagramDiagnosticSeverity;
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly path?: string;
}

export class TessalineError extends Error {
  readonly name = "TessalineError";
  readonly diagnostics: readonly DiagramDiagnostic[];

  constructor(message: string, diagnostics: readonly DiagramDiagnostic[] = []) {
    super(message);
    this.diagnostics = diagnostics;
  }
}

/** @deprecated Use TessalineError */
export const DiagramRenderError = TessalineError;

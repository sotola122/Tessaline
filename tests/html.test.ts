import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseInterfaceSpec, renderInterfaceHTML } from "../src/index.ts";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../src/styles.css"),
  "utf8",
);

const yaml = `apiVersion: interface-spec/v1
info:
  id: sample
  title: Sample
  version: 0.1.0
operations:
  - id: getItem
    title: Get item
    interfaceType: api
    transport: http
    pattern: requestResponse
    address:
      kind: path
      method: GET
      value: /items/{id}
    parameters:
      path:
        id:
          type: string
          required: true
          description: Item identifier
`;

describe("interface HTML API", () => {
  test("parseInterfaceSpec accepts interface-spec/v1", () => {
    const parsed = parseInterfaceSpec(yaml);
    expect(parsed.spec.apiVersion).toBe("interface-spec/v1");
  });

  test("renderInterfaceHTML returns fragment metadata", () => {
    const result = renderInterfaceHTML(yaml, { sourcePath: "spec.yml" });
    expect(result.html).toContain("Get item");
    expect(result.operationIds).toEqual(["getItem"]);
    expect(result.sourcePaths).toEqual(["spec.yml"]);
    expect(result.html).not.toContain("<script");
  });

  test("empty filter returns diagnostics and empty html", () => {
    const result = renderInterfaceHTML(yaml, { operation: "missing" });
    expect(result.html).toBe("");
    expect(result.diagnostics.some((item) => item.code === "IF_E_EMPTY_FILTER")).toBe(true);
  });

  test("print CSS keeps at least 8pt", () => {
    const print = css.split("@media print")[1] ?? "";
    expect(print).not.toMatch(/font-size:\s*(?:[0-7](?:\.\d+)?pt)/);
    expect(print).not.toMatch(/font-size:\s*[0-9.]+(?:em|rem)/);
    expect(print).toContain("8pt");
    expect(print).toContain("table-header-group");
  });

  test("overview links include idPrefix", () => {
    const result = renderInterfaceHTML(yaml, { idPrefix: "doc-" });
    expect(result.html).toContain('href="#doc-');
    expect(result.html).toContain('id="doc-');
    expect(result.html).not.toContain('href="#getItem"');
  });

  test("retryable tri-state uses unspecified badge when omitted", () => {
    const withErrors = `${yaml}
    errors:
      - code: E_TIMEOUT
        description: Timed out
        retryable: true
      - code: E_PERM
        description: Forbidden
        retryable: false
      - code: E_UNKNOWN
        description: Unknown
`;
    const result = renderInterfaceHTML(withErrors);
    expect(result.html).toContain("if-badge--retryable-yes");
    expect(result.html).toContain("if-badge--retryable-no");
    expect(result.html).toContain("if-badge--retryable-unspecified");
  });
});

import { describe, expect, test } from "vitest";
import { renderInterfaceSVG, TessalineError } from "../src/index.ts";

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

describe("interface SVG renderer", () => {
  test("emits one svg root without Yoga or foreignObject", () => {
    const result = renderInterfaceSVG(yaml);
    expect(result.svg).toContain("<svg");
    expect((result.svg.match(/<svg\b/g) ?? []).length).toBe(1);
    expect(result.svg).not.toContain("foreignObject");
    expect(result.svg).not.toContain("yoga");
    expect(result.svg).toContain("Get item");
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  test("rejects multi-operation SVG and keeps single-operation export", () => {
    const multi = `${yaml}
  - id: listItems
    title: List items
    interfaceType: api
    transport: http
    pattern: requestResponse
    address:
      kind: path
      method: GET
      value: /items
`;
    expect(() => renderInterfaceSVG(multi)).toThrow(/single operation/);
    try {
      renderInterfaceSVG(multi);
    } catch (error) {
      expect(error).toBeInstanceOf(TessalineError);
      expect((error as TessalineError).diagnostics[0]?.code).toBe("IF_E_SVG_MULTI_OP");
    }
    const one = renderInterfaceSVG(multi, { operation: "getItem" });
    expect(one.operationIds).toEqual(["getItem"]);
    expect(one.svg).toContain("Get item");
  });
});

# @sotola122/tessaline

Interface Spec tables for hardware/API docs. YAML in, **HTML tables by default**, optional SVG table layout (no Yoga).

## Install

```bash
npm install @sotola122/tessaline
```

## HTML (default)

```ts
import { parseInterfaceSpec, renderInterfaceHTML } from "@sotola122/tessaline";
import css from "@sotola122/tessaline/styles.css";

const { html } = renderInterfaceHTML(yamlSource, { sourcePath: "spec.yml" });
```

Kept compat APIs: `parseInterfaceSpec`, `renderInterfaceHTML`, `parseJsonOrYamlObject`, `styles.css`.

Errors throw `TessalineError`.

## SVG tables

`renderInterfaceSVG()` is a **single-operation** preview/export. It does not
paginate. Full Interface Specs belong on the HTML/CSS path so the PDF engine
can break tables across pages.

```ts
import { renderInterfaceSVG } from "@sotola122/tessaline";

const { svg } = renderInterfaceSVG(yamlSource, { operation: "getItem" });
```

md-docs `apidoc` fences default to HTML. `renderer: svg` is allowed only when
the filtered spec has exactly one operation (`operation:` or an include that
leaves one). Multiple operations raise `IF_E_SVG_MULTI_OP` and should use
`renderer: html`.

The SVG renderer measures columns and wraps cell text. It does not use Yoga or `foreignObject`.

Full-spec SVGs under `examples/` are stress/reference only and are not a PDF baseline.

## Examples

Complex REST / MQTT / BLE GATT / JSON-RPC / webhook / WebSocket specs live in
[`examples/`](./examples/). `tests/examples.test.ts` parses each YAML and renders
HTML plus SVG.

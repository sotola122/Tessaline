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

```ts
import { renderInterfaceSVG } from "@sotola122/tessaline";

const { svg } = renderInterfaceSVG(yamlSource);
```

The SVG renderer measures columns and wraps cell text. It does not use Yoga or `foreignObject`.

md-docs `apidoc` fences can set `renderer: svg` to take this path.

## Examples

Complex REST / MQTT / BLE GATT / JSON-RPC / webhook / WebSocket specs live in
[`examples/`](./examples/). `tests/examples.test.ts` parses each YAML and renders
HTML plus SVG.

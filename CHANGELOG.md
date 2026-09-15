# Changelog

## 0.1.2

- `renderInterfaceSVG()` rejects multi-operation specs (`IF_E_SVG_MULTI_OP`); full specs stay on HTML for PDF pagination
- Document SVG as single-operation preview/export only

## 0.1.1

- Overview operation links honor `options.idPrefix`
- Retryable column is tri-state: Retryable / Non-retryable / —
- Print CSS keeps `code`, chips, and badges at 8pt (no nested `em`/`rem`)
- Narrow viewports keep `min-width: 640px` and horizontal scroll for general tables

## 0.1.0

- Extract Interface Spec HTML from the md-docs beautiful-mermaid fork into `@sotola122/tessaline`.
- Keep YAML as the spec language (`yaml` package).
- HTML tables remain the default renderer.
- Add a Yoga-free SVG table layout renderer (`renderInterfaceSVG`).
- Throw `TessalineError` with diagnostics.
- Add multi-pattern Interface Spec YAML under `examples/` (REST, MQTT, BLE GATT, JSON-RPC, webhook, WebSocket; rendered by `tests/examples.test.ts`).

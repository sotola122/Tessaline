# Tessaline examples

Complex Interface Spec YAML used as renderer test data. Each file must parse with
zero error diagnostics and render both HTML (default) and SVG
(`tests/examples.test.ts`).

| File | Transport / pattern |
| --- | --- |
| `rest-device-fleet.yml` | HTTP REST, `requestResponse`, nested schemas, pagination, commands |
| `mqtt-telemetry-command.yml` | MQTT pub/sub, retained status, telemetry, command, ACK, OTA progress |
| `ble-gatt-environment.yml` | BLE GATT `attributeAccess`, 128-bit custom service + Battery, CCCD `0x2902` |
| `jsonrpc-firmware.yml` | JSON-RPC `requestResponse`, identify / DFU / NVS wipe / calibration |
| `webhook-lifecycle.yml` | Webhook `callback`, provisioned / online / OTA / fault |
| `websocket-live-log.yml` | WebSocket `stream`, framed logs, filter + dump + backpressure |

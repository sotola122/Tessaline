// ─── Interface Spec — Root Model Types ──────────────────────────────────────
// Core types for the interface-spec generator: transport-agnostic operations,
// schemas, fields, messages, errors, and transport bindings.
// BLE GATT types and normalized/render types live in separate files.

export type InterfaceType =
  | "api"
  | "event"
  | "stream"
  | "rpc"
  | "batch"
  | "callback"
  | "device"
  | "profile"
  | string;

export type Transport =
  | "http"
  | "mqtt"
  | "webhook"
  | "websocket"
  | "sse"
  | "kafka"
  | "amqp"
  | "grpc"
  | "graphql"
  | "jsonrpc"
  | "file"
  | "cloudevents"
  | "ble-gatt"
  | string;

export type InteractionPattern =
  | "requestResponse"
  | "publishSubscribe"
  | "stream"
  | "callback"
  | "batch"
  | "attributeAccess"
  | string;

// ─── Root Spec ──────────────────────────────────────────────────────────────

export interface InterfaceSpec {
  apiVersion: string;
  info: SpecInfo;
  servers?: Record<string, unknown>;
  auth?: Record<string, unknown>;
  components?: Components;
  operations: Operation[];
}

export interface SpecInfo {
  id: string;
  title: string;
  version: string;
  description?: string;
  [key: string]: unknown;
}

export interface Components {
  schemas?: Record<string, SchemaSpec>;
  eventEnvelopes?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Operation ───────────────────────────────────────────────────────────────

export interface Operation {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  interfaceType: InterfaceType | string;
  transport: Transport;
  pattern: InteractionPattern;
  tags?: string[];
  auth?: string | string[];
  address?: AddressSpec;
  parameters?: ParameterGroups;
  bindings?: Record<string, unknown>;
  request?: MessageSpec;
  response?: MessageSpec;
  responses?: Record<string, ResponseSpec>;
  message?: MessageSpec;
  messages?: MessageSpec[];
  errors?: ErrorSpec[];
  examples?: ExampleSpec[];
  delivery?: DeliverySpec;
  retry?: RetrySpec;
  [key: string]: unknown;
}

export interface AddressSpec {
  kind: string;
  value: string;
  method?: string;
  [key: string]: unknown;
}

export type ParameterGroups = Record<string, Record<string, FieldSpec>>;

// ─── Messages ────────────────────────────────────────────────────────────────

export interface MessageSpec {
  id?: string;
  title?: string;
  role?: string;
  direction?: string;
  contentType?: string;
  schema: string | SchemaSpec;
  [key: string]: unknown;
}

export interface ResponseSpec {
  description?: string;
  contentType?: string;
  schema?: string | SchemaSpec;
  [key: string]: unknown;
}

// ─── Schema & Field ──────────────────────────────────────────────────────────

export interface SchemaSpec {
  type: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  unit?: string;
  fields?: Record<string, FieldSpec>;
  items?: string | SchemaSpec;
  enum?: Array<string | number | boolean>;
  example?: unknown;
  format?: string;
  [key: string]: unknown;
}

export interface FieldSpec extends SchemaSpec {
  unit?: string;
}

// ─── Errors & Examples ───────────────────────────────────────────────────────

export interface ErrorSpec {
  code: string | number;
  status?: string | number;
  message?: string;
  retryable?: boolean;
  description: string;
  [key: string]: unknown;
}

export interface ExampleSpec {
  title: string;
  role?: string;
  value: unknown;
  [key: string]: unknown;
}

// ─── Delivery & Retry ────────────────────────────────────────────────────────

export interface DeliverySpec {
  mode?: string;
  ttl?: string;
  persistence?: string;
  ordering?: string;
  [key: string]: unknown;
}

export interface RetrySpec {
  maxAttempts?: number;
  backoff?: string;
  strategy?: string;
  [key: string]: unknown;
}

// ─── Transport Bindings ──────────────────────────────────────────────────────

/** Generic transport binding placeholder. Extended per transport. */
export interface BindingSpec {
  transport: Transport;
  [key: string]: unknown;
}

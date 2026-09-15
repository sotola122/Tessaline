import type { InterfaceSpec, Operation } from "./model.ts";
import type {
  KeyValueRow,
  NormalizedOperation,
  NormalizedSpec,
  RenderOptions,
} from "./model-normalized.ts";
import {
  normalizeAddress,
  normalizeBindingRows,
  normalizeDeliveryRows,
  normalizeRetryRows,
} from "./normalizer-bindings.ts";
import {
  normalizeBleGenericTables,
  normalizeBleMessageTables,
} from "./normalizer-ble.ts";
import {
  normalizeExamples,
  normalizeMessageTables,
  normalizeParameterTables,
  normalizeResponseRows,
} from "./normalizer-schema.ts";

type FilterOptions = Pick<RenderOptions, "include" | "includeOperations"> & {
  readonly operation?: string;
};

export function normalizeSpec(spec: InterfaceSpec): NormalizedSpec {
  return {
    info: spec.info,
    operations: spec.operations.map((operation) =>
      normalizeOperation(spec, operation),
    ),
  };
}

export function filterOperations(
  spec: InterfaceSpec,
  options: FilterOptions,
): InterfaceSpec {
  return {
    ...spec,
    operations: spec.operations.filter((operation) =>
      matchesFilter(operation, options),
    ),
  };
}

function normalizeOperation(
  spec: InterfaceSpec,
  operation: Operation,
): NormalizedOperation {
  return {
    id: operation.id,
    title: operation.title,
    summary: operation.summary,
    description: operation.description,
    interfaceType: operation.interfaceType,
    transport: operation.transport,
    pattern: operation.pattern,
    tags: operation.tags ?? [],
    address: normalizeAddress(operation),
    metaRows: normalizeMetaRows(operation),
    bindingRows: normalizeBindingRows(operation),
    deliveryRows: normalizeDeliveryRows(operation),
    retryRows: normalizeRetryRows(operation),
    genericTables: normalizeBleGenericTables(spec, operation),
    parameterTables: normalizeParameterTables(operation),
    messageTables: normalizeMessageTables(spec, operation).concat(
      normalizeBleMessageTables(spec, operation),
    ),
    responseRows: normalizeResponseRows(spec, operation),
    errorRows: (operation.errors ?? []).map((error) => ({
      code: String(error.code),
      status: error.status === undefined ? undefined : String(error.status),
      retryable: error.retryable,
      description: error.description || error.message || "",
    })),
    examples: normalizeExamples(operation.examples),
  };
}

function normalizeMetaRows(operation: Operation): KeyValueRow[] {
  const rows: KeyValueRow[] = [
    { key: "Operation ID", value: operation.id, code: true },
    { key: "Interface Type", value: operation.interfaceType, code: true },
    { key: "Transport", value: operation.transport, code: true },
    { key: "Pattern", value: operation.pattern, code: true },
  ];
  if (operation.auth) {
    rows.push({
      key: "Auth",
      value: Array.isArray(operation.auth)
        ? operation.auth.join(", ")
        : operation.auth,
      code: true,
    });
  }
  if (operation.tags?.length) {
    rows.push({ key: "Tags", value: operation.tags.join(", ") });
  }
  if (operation.description) {
    rows.push({ key: "Description", value: operation.description });
  }
  return rows;
}

function matchesFilter(operation: Operation, options: FilterOptions): boolean {
  if (options.operation && operation.id !== options.operation) {
    return false;
  }
  if (
    options.includeOperations?.length &&
    !options.includeOperations.includes(operation.id)
  ) {
    return false;
  }
  if (
    options.include?.transport &&
    operation.transport !== options.include.transport
  ) {
    return false;
  }
  if (
    options.include?.interfaceType &&
    operation.interfaceType !== options.include.interfaceType
  ) {
    return false;
  }
  if (
    options.include?.pattern &&
    operation.pattern !== options.include.pattern
  ) {
    return false;
  }
  if (!options.include?.tags?.length) {
    return true;
  }
  const tags = new Set(operation.tags ?? []);
  return options.include.tags.some((tag) => tags.has(tag));
}

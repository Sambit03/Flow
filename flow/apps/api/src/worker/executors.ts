import type { Node, HttpActionConfig, TransformConfig, ConditionConfig } from "@/db/schema/nodes";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce(
      (acc: unknown, key) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj,
    );
}

function interpolate(template: string, input: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, path) =>
    String(getNestedValue(input, path) ?? ""),
  );
}

// ── Executors ─────────────────────────────────────────────────────────────────

async function executeHttpRequest(
  config: HttpActionConfig,
  input: Record<string, unknown>,
): Promise<unknown> {
  const timeoutMs = config.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let body: string | undefined;
    if (config.body) {
      body = interpolate(config.body, input);
    } else if (config.method !== "GET" && config.method !== "DELETE") {
      body = JSON.stringify(input);
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers: { "Content-Type": "application/json", ...(config.headers ?? {}) },
      body,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { body: await response.text(), status: response.status };

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

function executeTransform(
  config: TransformConfig,
  input: Record<string, unknown>,
): unknown {
  try {
    // Runs the expression in strict mode with `input` in scope.
    // The expression must evaluate to a value, e.g. "{ name: input.firstName }"
    const fn = new Function("input", `"use strict"; return (${config.expression})`);
    return fn(input);
  } catch (err) {
    throw new Error(
      `Transform error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function executeCondition(
  config: ConditionConfig,
  input: Record<string, unknown>,
): unknown {
  const value = getNestedValue(input, config.field);
  let passes: boolean;

  switch (config.operator) {
    case "eq":
      passes = value == config.value;
      break;
    case "neq":
      passes = value != config.value;
      break;
    case "gt":
      passes = Number(value) > Number(config.value);
      break;
    case "lt":
      passes = Number(value) < Number(config.value);
      break;
    case "contains":
      passes = String(value).includes(String(config.value));
      break;
    case "exists":
      passes = value !== undefined && value !== null;
      break;
    default:
      passes = false;
  }

  return { ...input, _branch: passes ? "true" : "false" };
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function executeNode(
  node: Node,
  input: Record<string, unknown>,
): Promise<unknown> {
  const config = node.config as Record<string, unknown>;

  switch (node.type) {
    case "trigger":
      return input;

    case "action": {
      const subtype = config.subtype as string;
      if (subtype === "http_request") {
        return executeHttpRequest(config as unknown as HttpActionConfig, input);
      }
      if (subtype === "transform") {
        return executeTransform(config as unknown as TransformConfig, input);
      }
      if (subtype === "log") {
        console.log(`[Flow Log] ${node.label}:`, JSON.stringify(input, null, 2));
        return input;
      }
      return input;
    }

    case "condition":
      return executeCondition(config as unknown as ConditionConfig, input);

    case "delay": {
      const ms = Math.min(Number(config.durationMs ?? 1_000), 86_400_000);
      await new Promise((r) => setTimeout(r, ms));
      return input;
    }

    default:
      return input;
  }
}

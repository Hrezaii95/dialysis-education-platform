/** xAPI 1.0.3 statement emitter — client-local store (static export, no API routes) */

import type { KnowledgeType } from "@/lib/competencies";

export type XapiVerb =
  | "initialized"
  | "experienced"
  | "answered"
  | "completed"
  | "interacted"
  | "mastered"
  // ── new verbs ──────────────────────────────────────────────────────────────
  | "placement_completed"
  | "daily5_reviewed"
  | "path_rewritten";

const STORAGE_KEY = "raouf-xapi-log";

/**
 * Optional context extensions that can accompany any statement.
 * Kept optional so all existing callers remain valid without change.
 */
export interface XapiExtensions {
  /** The competency id (e.g. "c1") this statement relates to */
  competencyId?: string;
  /** The knowledge type being exercised ("declarative" | "procedural" | "conditional") */
  knowledgeType?: KnowledgeType;
  [key: string]: unknown;
}

export interface XapiStatement {
  id: string;
  timestamp: string;
  verb: XapiVerb;
  objectId: string;
  objectName: string;
  result?: {
    score?: number;
    success?: boolean;
    durationMs?: number;
    extensions?: XapiExtensions;
  };
}

/**
 * Emit an xAPI statement.
 *
 * Backward-compatible: the `result` parameter shape is unchanged.
 * New callers can pass `result.extensions.competencyId` /
 * `result.extensions.knowledgeType` for richer telemetry.
 */
export function emitStatement(
  verb: XapiVerb,
  objectId: string,
  objectName: string,
  result?: XapiStatement["result"]
) {
  const stmt: XapiStatement = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    verb,
    objectId,
    objectName,
    result,
  };

  const log = getStatements();
  log.push(stmt);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(-500)));
    } catch {
      // storage unavailable/full — keep in-memory only
    }
  }
  recordStatement(stmt);
  return stmt;
}

// ── Client-side statement sink (replaces the former /api/xapi route) ────────

const SINK_STORAGE_KEY = "xapi-statements";
const SINK_LIMIT = 1000;

const statementSink: Array<XapiStatement & { receivedAt: string }> = [];

function recordStatement(stmt: XapiStatement) {
  statementSink.push({ ...stmt, receivedAt: new Date().toISOString() });
  if (statementSink.length > SINK_LIMIT) statementSink.shift();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SINK_STORAGE_KEY, JSON.stringify(statementSink.slice(-SINK_LIMIT)));
    } catch {
      // storage unavailable/full — keep in-memory sink only
    }
  }
}

export function getStatements(): XapiStatement[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

import type {
  Alert,
  AlertFilters,
  AlertsListResponse,
  AlertStats,
  AnalyseResult,
  IngestResult,
} from "@/types";

const BASE = "/api/alerts";

const json = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const result = await res.json();
  return result as T;
};

const qs = (
  params: Record<string, string | number | boolean | undefined>,
): string => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
};

export const fetchAlerts = async (
  filters: AlertFilters = {},
  limit = 500,
  offset = 0,
): Promise<AlertsListResponse> => {
  const url = `${BASE}/${qs({ ...filters, limit, offset })}`;

  return json<AlertsListResponse>(await fetch(url));
};

export const fetchAlert = async (id: number): Promise<Alert> => {
  return json<Alert>(await fetch(`${BASE}/${id}`));
};

export const fetchStats = async (): Promise<AlertStats> => {
  return json<AlertStats>(await fetch(`${BASE}/stats`));
};

export const triggerFetch = async (): Promise<IngestResult> => {
  return json<IngestResult>(await fetch(`${BASE}/fetch`, { method: "POST" }));
};

export const triggerAnalyse = async (limit = 10): Promise<AnalyseResult> => {
  return json<AnalyseResult>(
    await fetch(`${BASE}/analyse${qs({ limit })}`, { method: "POST" }),
  );
};

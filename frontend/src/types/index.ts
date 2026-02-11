export interface Alert {
  id: number;
  title: string;
  link: string;
  source: string;
  feed_category: string;
  published_date: string;
  raw_content: string;

  // LLM classification content
  summary: string;
  category: string;
  subcategories: string[];
  severity: string;
  affected_sectors: string[];
  action_items: string[];
  effective_date: string;
  key_entities: string[];

  // Metadata
  analysed: boolean;
  created_at: string;
}

export interface AlertsListResponse {
  count: number;
  alerts: Alert[];
}

export interface AlertStats {
  total: number;
  analysed: number;
  pending: number;
  by_feed_category: { feed_category: string; count: number }[];
  by_severity: { severity: string; count: number }[];
  by_category: { category: string; count: number }[];
}

export interface IngestResult {
  feeds_fetched: number;
  entries_found: number;
  new_alerts: number;
  duplicates_skipped: number;
  errors: string[];
}

export interface AnalyseResult {
  analysed_count: number;
  analysed_ids: number[];
}

export interface AlertFilters {
  feed_category?: string;
  category?: string;
  severity?: string;
  analysed?: boolean;
}

export type AlertSortKey = "published_date" | "severity" | "effective_date";

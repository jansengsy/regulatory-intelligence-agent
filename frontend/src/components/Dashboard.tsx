import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import type { Alert, AlertFilters, AlertSortKey, AlertStats } from "@/types";
import { fetchAlerts, fetchStats, triggerAnalyse, triggerFetch } from "@/api";
import { StatsBar } from "./StatsBar";
import { AlertsToolbar } from "./AlertsToolbar";
import { AlertsList } from "./AlertsList";
import { AlertDetail } from "./AlertDetail";

const SEVERITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  "": 4,
};

export function Dashboard() {
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [sortKey, setSortKey] = useState<AlertSortKey>("published_date");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Toast state: visible controls DOM presence, exiting triggers slide-out
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setToastExiting(false);
    setToastMsg(msg);
    setToastVisible(true);

    // Start exit after 3.5s, then remove from DOM after animation
    toastTimer.current = setTimeout(() => {
      setToastExiting(true);
      setTimeout(() => {
        setToastVisible(false);
        setToastExiting(false);
        setToastMsg(null);
      }, 250);
    }, 3500);
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      setStats(await fetchStats());
    } catch (err) {
      showToast(`Failed to load stats: ${err}`);
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetchAlerts(filters, 200);
      setAlerts(res.alerts);
    } catch (err) {
      showToast(`Failed to load alerts: ${err}`);
    } finally {
      setLoadingAlerts(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleFetch = async () => {
    setFetching(true);
    try {
      const result = await triggerFetch();
      showToast(
        `Fetched ${result.feeds_fetched} feeds — ${result.new_alerts} new alerts, ${result.duplicates_skipped} duplicates skipped`,
      );
      setLastFetched(new Date());
      await Promise.all([loadStats(), loadAlerts()]);
    } catch (err) {
      showToast(`Fetch failed: ${err}`);
    } finally {
      setFetching(false);
    }
  };

  const handleAnalyse = async () => {
    setAnalysing(true);
    try {
      const result = await triggerAnalyse(stats?.pending ?? 10);
      showToast(`Analysed ${result.analysed_count} alerts`);
      await Promise.all([loadStats(), loadAlerts()]);
      if (selectedAlert && result.analysed_ids.includes(selectedAlert.id)) {
        const updated = alerts.find((a) => a.id === selectedAlert.id);
        if (updated) setSelectedAlert(updated);
      }
    } catch (err) {
      showToast(`Analysis failed: ${err}`);
    } finally {
      setAnalysing(false);
    }
  };

  // Sort alerts client-side
  const sortedAlerts = useMemo(() => {
    const sorted = [...alerts];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "published_date": {
          // Newest first — parse the RSS date strings
          const da = new Date(a.published_date || 0).getTime();
          const db = new Date(b.published_date || 0).getTime();
          return db - da;
        }
        case "severity": {
          // Critical first, then High, Medium, Low, unclassified last
          const sa = SEVERITY_ORDER[a.severity] ?? 4;
          const sb = SEVERITY_ORDER[b.severity] ?? 4;
          return sa - sb;
        }
        case "effective_date": {
          // Alerts with effective dates first, then by date
          if (!a.effective_date && !b.effective_date) return 0;
          if (!a.effective_date) return 1;
          if (!b.effective_date) return -1;
          return a.effective_date.localeCompare(b.effective_date);
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [alerts, sortKey]);

  const handleSelect = (id: number) => {
    const alert = alerts.find((a) => a.id === id) ?? null;
    setSelectedAlert(alert);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden gap-5">
      {/* Toast */}
      {toastVisible && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm rounded border border-gray-300 bg-white px-4 py-3 shadow-md text-sm text-gray-800 ${
            toastExiting ? "toast-exit" : "toast-enter"
          }`}
        >
          {toastMsg}
        </div>
      )}

      {/* Fixed top section */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Regulatory Alerts
          </h1>
          {lastFetched && (
            <span className="text-xs text-gray-400">
              Last updated{" "}
              {lastFetched.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Stats */}
        <StatsBar stats={stats} loading={loadingStats} />

        {/* Toolbar */}
        <AlertsToolbar
          filters={filters}
          onFilterChange={setFilters}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onFetch={handleFetch}
          onAnalyse={handleAnalyse}
          fetching={fetching}
          analysing={analysing}
          stats={stats}
        />
      </div>

      {/* Scrollable content: list + detail — takes remaining height */}
      <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Alerts list */}
        <div className="col-span-2 min-h-0">
          <AlertsList
            alerts={sortedAlerts}
            loading={loadingAlerts}
            selectedId={selectedAlert?.id ?? null}
            onSelect={handleSelect}
          />
        </div>

        {/* Detail panel */}
        <Card className="col-span-3 border-gray-200 bg-white p-5 min-h-0 shadow-sm">
          <AlertDetail
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
          />
        </Card>
      </div>
    </div>
  );
}

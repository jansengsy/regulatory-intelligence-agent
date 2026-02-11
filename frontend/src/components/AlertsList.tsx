import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Alert } from "@/types";
import { formatDate } from "@/lib/utils";
import { SeverityBadge } from "./SeverityBadge";

interface Props {
  alerts: Alert[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function AlertsList({ alerts, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded bg-gray-100" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm font-medium">No alerts found</p>
        <p className="text-xs mt-1">
          Try fetching feeds or adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1.5 pr-3">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => onSelect(alert.id)}
            className={`w-full text-left rounded border p-3 transition-colors duration-100 cursor-pointer ${
              selectedId === alert.id
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                {alert.title}
              </h3>
              {alert.analysed && <SeverityBadge severity={alert.severity} />}
            </div>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] bg-gray-50 text-gray-500 border-gray-200"
              >
                {alert.feed_category}
              </Badge>
              {alert.analysed && alert.category && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                >
                  {alert.category}
                </Badge>
              )}
              <span className="ml-auto text-[10px] text-gray-400">
                {formatDate(alert.published_date)}
              </span>
            </div>

            {alert.analysed && alert.summary && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {alert.summary}
              </p>
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

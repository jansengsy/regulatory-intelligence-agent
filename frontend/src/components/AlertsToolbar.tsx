import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SparklesIcon } from "lucide-react";
import type { AlertFilters, AlertSortKey, AlertStats } from "@/types";

const SORT_OPTIONS: { value: AlertSortKey; label: string }[] = [
  { value: "published_date", label: "Published Date" },
  { value: "severity", label: "Severity" },
  { value: "effective_date", label: "Effective Date" },
];

interface Props {
  filters: AlertFilters;
  onFilterChange: (filters: AlertFilters) => void;
  sortKey: AlertSortKey;
  onSortChange: (key: AlertSortKey) => void;
  onFetch: () => void;
  onAnalyse: () => void;
  fetching: boolean;
  analysing: boolean;
  stats: AlertStats | null;
}

export function AlertsToolbar({
  filters,
  onFilterChange,
  sortKey,
  onSortChange,
  onFetch,
  onAnalyse,
  fetching,
  analysing,
  stats,
}: Props) {
  const feedCategories =
    stats?.by_feed_category.map((c) => c.feed_category) ?? [];
  const categories = stats?.by_category.map((c) => c.category) ?? [];
  const severities = stats?.by_severity.map((s) => s.severity) ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filters */}
      <FilterSelect
        placeholder="All Feeds"
        value={filters.feed_category ?? ""}
        options={feedCategories}
        onChange={(v) =>
          onFilterChange({ ...filters, feed_category: v || undefined })
        }
      />
      <FilterSelect
        placeholder="All Categories"
        value={filters.category ?? ""}
        options={categories}
        onChange={(v) =>
          onFilterChange({ ...filters, category: v || undefined })
        }
      />
      <FilterSelect
        placeholder="All Severities"
        value={filters.severity ?? ""}
        options={severities}
        onChange={(v) =>
          onFilterChange({ ...filters, severity: v || undefined })
        }
      />
      <FilterSelect
        placeholder="All Status"
        value={
          filters.analysed === undefined
            ? ""
            : filters.analysed
              ? "true"
              : "false"
        }
        options={["true", "false"]}
        labels={["Analysed", "Pending"]}
        onChange={(v) =>
          onFilterChange({
            ...filters,
            analysed: v === "" ? undefined : v === "true",
          })
        }
      />

      {/* Sort */}
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <Select
        value={sortKey}
        onValueChange={(v) => onSortChange(v as AlertSortKey)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs border-gray-300 text-gray-700 bg-white">
          <SelectValue placeholder="Sort by…" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <Button
        variant="outline"
        size="sm"
        onClick={onFetch}
        disabled={fetching}
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        {fetching ? "Fetching…" : "Fetch Feeds"}
      </Button>
      <Button
        size="sm"
        onClick={onAnalyse}
        disabled={analysing || !stats?.pending}
        className="bg-gray-700 text-white hover:bg-gray-600 gap-1.5"
      >
        <SparklesIcon className="w-3.5 h-3.5" />
        {analysing ? "Analysing…" : `Analyse Pending (${stats?.pending ?? 0})`}
      </Button>
    </div>
  );
}

const FilterSelect = ({
  placeholder,
  value,
  options,
  labels,
  onChange,
}: {
  placeholder: string;
  value: string;
  options: string[];
  labels?: string[];
  onChange: (value: string) => void;
}) => {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v === "__all__" ? "" : v)}
    >
      <SelectTrigger className="w-[150px] h-8 text-xs border-gray-300 text-gray-700 bg-white cursor-pointer">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border-gray-200">
        <SelectItem value="__all__" className="text-xs text-gray-400">
          {placeholder}
        </SelectItem>
        {options.map((opt, i) => (
          <SelectItem key={opt} value={opt} className="text-xs">
            {labels ? labels[i] : opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

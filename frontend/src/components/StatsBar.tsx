import type { AlertStats } from "@/types";

interface Props {
  stats: AlertStats | null;
  loading: boolean;
}

export function StatsBar({ stats, loading }: Props) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Total Alerts" value={stats.total} />
      <StatCard
        label="Analysed"
        value={stats.analysed}
        accent="text-green-700"
      />
      <StatCard label="Pending" value={stats.pending} accent="text-amber-700" />
    </div>
  );
}

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) => {
  return (
    <div className="rounded border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-semibold mt-1 ${accent ?? "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
};

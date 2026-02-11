import { Badge } from "@/components/ui/badge";

const SEVERITY_VARIANTS: Record<string, { className: string }> = {
  Critical: {
    className: "bg-red-50 text-red-800 border-red-200",
  },
  High: {
    className: "bg-orange-50 text-orange-800 border-orange-200",
  },
  Medium: {
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  Low: {
    className: "bg-green-50 text-green-800 border-green-200",
  },
};

export function SeverityBadge({ severity }: { severity: string }) {
  if (!severity) return null;

  const style = SEVERITY_VARIANTS[severity];

  return (
    <Badge
      variant="outline"
      className={
        style?.className ?? "bg-gray-50 text-gray-600 border-gray-200"
      }
    >
      {severity}
    </Badge>
  );
}

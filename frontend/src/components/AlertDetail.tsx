import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Alert } from "@/types";
import { SeverityBadge } from "./SeverityBadge";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface Props {
  alert: Alert | null;
  onClose: () => void;
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
};

export function AlertDetail({ alert, onClose }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  if (!alert) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-sm">Select an alert to view details</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 pr-3">
        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <h2 className="text-base font-semibold text-gray-900 leading-snug">
              {alert.title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 shrink-0 -mt-1"
            >
              &times;
            </Button>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-600 border-gray-200"
            >
              {alert.source}
            </Badge>
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-600 border-gray-200"
            >
              {alert.feed_category}
            </Badge>
            {alert.analysed && <SeverityBadge severity={alert.severity} />}
            {alert.category && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {alert.category}
              </Badge>
            )}
            {alert.published_date && (
              <span className="text-xs text-gray-500 ml-auto">
                {new Date(alert.published_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </header>

        <Separator className="bg-gray-200" />

        {/* Not yet analysed */}
        {!alert.analysed && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-3 px-4">
              <p className="text-sm text-amber-800">
                This alert has not been analysed yet. Click "Analyse Alerts" to
                classify it.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {alert.summary && (
          <Section title="Summary">
            <p className="text-sm text-gray-700 leading-relaxed">
              {alert.summary}
            </p>
          </Section>
        )}

        {/* Affected Sectors */}
        {alert.affected_sectors.length > 0 && (
          <Section title="Affected Sectors">
            <div className="flex flex-wrap gap-1.5">
              {alert.affected_sectors.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Subcategories */}
        {alert.subcategories.length > 0 && (
          <Section title="Subcategories">
            <div className="flex flex-wrap gap-1.5">
              {alert.subcategories.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Action Items */}
        {alert.action_items.length > 0 && (
          <Section title="Action Items">
            <ul className="space-y-2">
              {alert.action_items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-gray-700"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Key Entities */}
        {alert.key_entities.length > 0 && (
          <Section title="Key Entities">
            <div className="flex flex-wrap gap-1.5">
              {alert.key_entities.map((e) => (
                <Badge
                  key={e}
                  variant="outline"
                  className="bg-gray-50 text-gray-600 border-gray-200"
                >
                  {e}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Effective Date */}
        {alert.effective_date && (
          <Section title="Effective Date">
            <p className="text-sm text-gray-700">{alert.effective_date}</p>
          </Section>
        )}

        {/* Link */}
        <Section title="Source Link">
          <a
            href={alert.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all"
          >
            {alert.link}
          </a>
        </Section>

        {/* Raw Content */}
        {alert.raw_content && (
          <footer>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-gray-500 hover:text-gray-700 px-0!"
            >
              {showRaw ? "Hide" : "Show"} raw content{" "}
              {showRaw ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </Button>
            {showRaw && (
              <div
                className="mt-2 rounded border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 overflow-auto max-h-64"
                dangerouslySetInnerHTML={{ __html: alert.raw_content }}
              />
            )}
          </footer>
        )}
      </div>
    </ScrollArea>
  );
}

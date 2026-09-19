import { Badge } from "@/components/ui/badge";
import type { CompetitionFormat, CompetitionStatus } from "@/lib/competitions/types";
import type { MatchState } from "@/lib/competitions/social/social-types";
import { es } from "@/lib/i18n/es";

export function FormatBadge({ format }: { format: CompetitionFormat }) {
  return <Badge tone="brand">{es.formats[format]}</Badge>;
}

export function CompetitionStatusBadge({ status }: { status: CompetitionStatus }) {
  if (status === "live") {
    return (
      <Badge tone="live">
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
        {es.statuses[status]}
      </Badge>
    );
  }
  return <Badge tone={status === "cancelled" ? "danger" : "neutral"}>{es.statuses[status]}</Badge>;
}

export function MatchStatusBadge({ status }: { status: MatchState }) {
  return (
    <Badge tone={status === "completed" ? "brand" : status === "void" ? "danger" : "neutral"}>
      {es.matchStatuses[status]}
    </Badge>
  );
}

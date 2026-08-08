import { Badge } from "@/components/ui/badge";
import type { CompetitionFormat, CompetitionStatus } from "@/lib/competitions/types";
import { es } from "@/lib/i18n/es";

export function FormatBadge({ format }: { format: CompetitionFormat }) {
  return <Badge>{es.formats[format]}</Badge>;
}

export function CompetitionStatusBadge({ status }: { status: CompetitionStatus }) {
  return (
    <Badge className={status === "live" ? "bg-lime-100 text-lime-950" : undefined}>
      {es.statuses[status]}
    </Badge>
  );
}

import { cn } from "@/lib/utils";
import type { SocialStanding } from "@/lib/competitions/social/social-types";
import type { StandingsRanking } from "@/lib/competitions/social/standings";

const columns = [
  { key: "pointsFor", label: "GF", title: "Games a favor" },
  { key: "played", label: "PJ", title: "Partidos jugados" },
  { key: "wins", label: "G", title: "Ganados" },
  { key: "pointDiff", label: "+/-", title: "Diferencia de games" },
  { key: "sitOuts", label: "Desc.", title: "Descansos" },
] as const;

/**
 * En móvil la tabla se rompe: una tabla de 7 columnas a 360 px no se lee.
 * Por eso hay dos presentaciones del mismo dato, no un scroll horizontal.
 */
export function StandingsTable({
  ranking = "POINTS_FIRST",
  standings,
}: {
  ranking?: StandingsRanking;
  standings: SocialStanding[];
}) {
  if (standings.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay clasificación.</p>;
  }

  return (
    <>
      <ol className="space-y-2 sm:hidden">
        {standings.map((row, index) => (
          <li
            className={cn(
              "flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2",
              index === 0 && "border-brand/40 bg-brand-soft",
            )}
            key={row.entryId}
          >
            <span className="tabular grid size-8 shrink-0 place-items-center rounded-md bg-surface-muted text-sm font-bold text-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{row.displayName}</p>
              <p className="tabular text-xs text-muted-foreground">
                {row.played} PJ · {row.wins} G · {row.pointDiff >= 0 ? "+" : ""}
                {row.pointDiff} · {row.sitOuts} desc.
              </p>
            </div>
            <span className="tabular text-xl font-bold text-foreground">{row.pointsFor}</span>
          </li>
        ))}
      </ol>
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Clasificación ordenada por {ranking === "WINS_FIRST" ? "victorias" : "games a favor"}, con
            desempate por enfrentamiento directo.
          </caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase text-muted-foreground">
              <th className="w-10 py-2" scope="col">
                #
              </th>
              <th className="py-2" scope="col">
                Jugador
              </th>
              {columns.map((column) => (
                <th className="py-2 text-right" key={column.key} scope="col">
                  <abbr className="no-underline" title={column.title}>
                    {column.label}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr className="border-b border-line/70 last:border-0" key={row.entryId}>
                <td className="tabular py-2 font-semibold text-muted-foreground">{index + 1}</td>
                <td className="py-2 font-medium text-foreground">{row.displayName}</td>
                {columns.map((column) => (
                  <td className="tabular py-2 text-right" key={column.key}>
                    {column.key === "pointDiff" && row.pointDiff > 0 ? "+" : ""}
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

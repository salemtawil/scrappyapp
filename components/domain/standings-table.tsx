import type { SocialStanding } from "@/lib/competitions/social/social-types";

export function StandingsTable({ standings }: { standings: SocialStanding[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="w-10 py-3">#</th>
            <th>Jugador</th>
            <th className="text-right">GF</th>
            <th className="text-right">PJ</th>
            <th className="text-right">G</th>
            <th className="text-right">+/-</th>
            <th className="text-right">Desc.</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr key={row.entryId} className="border-t border-emerald-950/10">
              <td className="py-3 font-semibold text-slate-500">{index + 1}</td>
              <td className="font-medium">{row.displayName}</td>
              <td className="text-right font-semibold">{row.pointsFor}</td>
              <td className="text-right">{row.played}</td>
              <td className="text-right">{row.wins}</td>
              <td className="text-right">{row.pointDiff}</td>
              <td className="text-right">{row.sitOuts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

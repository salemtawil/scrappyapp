import { NextResponse } from "next/server";
import { demoStandings } from "@/lib/demo-data";

export async function GET() {
  const rows = [
    ["posicion", "jugador", "puntos", "pj", "g", "diferencia"],
    ...demoStandings.map((row, index) => [
      index + 1,
      row.displayName,
      row.pointsFor,
      row.played,
      row.wins,
      row.pointDiff,
    ]),
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=standings.csv",
    },
  });
}

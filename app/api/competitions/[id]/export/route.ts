import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getOwnedCompetition } from "@/lib/competitions/service/queries";

/** Exporta la clasificación real de una competición propia. Nunca datos de demostración. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminSession();

  if (!admin.user) {
    return NextResponse.json({ error: "Inicia sesión para exportar." }, { status: 401 });
  }

  const competition = await getOwnedCompetition(id);
  if (!competition) {
    return NextResponse.json({ error: "Competición no encontrada." }, { status: 404 });
  }

  const header = [
    "posicion",
    "jugador",
    "games_favor",
    "games_contra",
    "diferencia",
    "jugados",
    "ganados",
    "empatados",
    "perdidos",
    "descansos",
  ];
  const rows = competition.standings.map((row, index) => [
    index + 1,
    row.displayName,
    row.pointsFor,
    row.pointsAgainst,
    row.pointDiff,
    row.played,
    row.wins,
    row.ties,
    row.losses,
    row.sitOuts,
  ]);
  // BOM para que Excel abra los acentos correctamente.
  const csv = `﻿${[header, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\r\n")}`;
  const filename = `clasificacion-${competition.competition.roomCode}.csv`;

  return new NextResponse(csv, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="${filename}"`,
      "content-type": "text/csv; charset=utf-8",
    },
  });
}

function toCsvCell(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

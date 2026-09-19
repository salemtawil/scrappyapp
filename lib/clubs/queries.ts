import { getAdminSession } from "@/lib/auth/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { CompetitionSummary } from "@/lib/competitions/types";

export type ClubListItem = {
  city: string | null;
  id: string;
  name: string;
  slug: string;
};

type ClubRow = {
  city: string | null;
  id: string;
  name: string;
  slug: string;
};

export type ClubPageData = {
  club: ClubListItem;
  competitions: CompetitionSummary[];
};

export async function getOwnedClubs(): Promise<ClubListItem[]> {
  const { configured, isAdmin, user } = await getAdminSession();

  if (!configured || !user || !isAdmin) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("id,name,slug,city")
    .eq("owner_user_id", user.id)
    .order("name");

  if (error) {
    throw new Error(`Unable to load organizations: ${error.message}`);
  }

  return ((data ?? []) as ClubRow[]).map(toClub);
}

export async function getClubBySlug(slug: string): Promise<ClubPageData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  // Función saneada: la página de organización es pública y no debe leer las tablas
  // directamente (expondría owner_user_id y el resto de columnas administrativas).
  const { data, error } = await supabase.rpc("public_club_snapshot", { p_slug: slug });

  if (error) {
    throw new Error(`No pudimos cargar la organización: ${error.message}`);
  }
  if (!data) return null;

  const snapshot = data as {
    club: { city: string | null; name: string; slug: string };
    competitions: Array<{
      category: CompetitionSummary["category"];
      format: CompetitionSummary["format"];
      name: string;
      roomCode: string;
      startsAt: string | null;
      status: CompetitionSummary["status"];
    }>;
  };

  return {
    club: { city: snapshot.club.city, id: snapshot.club.slug, name: snapshot.club.name, slug: snapshot.club.slug },
    competitions: snapshot.competitions.map((competition) => ({
      category: competition.category,
      format: competition.format,
      id: competition.roomCode,
      name: competition.name,
      roomCode: competition.roomCode,
      startsAt: competition.startsAt ?? new Date().toISOString(),
      status: competition.status,
      timezone: "America/Caracas",
      visibility: "public" as const,
    })),
  };
}

function toClub(row: ClubRow): ClubListItem {
  return {
    city: row.city,
    id: row.id,
    name: row.name,
    slug: String(row.slug),
  };
}

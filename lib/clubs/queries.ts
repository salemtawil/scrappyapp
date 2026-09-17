import { getCurrentUser } from "@/lib/auth/session";
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

type CompetitionRow = {
  category: CompetitionSummary["category"];
  format: CompetitionSummary["format"];
  id: string;
  name: string;
  public_room_code: string;
  starts_at: string | null;
  status: CompetitionSummary["status"];
  timezone: string;
  visibility: CompetitionSummary["visibility"];
};

export type ClubPageData = {
  club: ClubListItem;
  competitions: CompetitionSummary[];
};

export async function getOwnedClubs(): Promise<ClubListItem[]> {
  const { configured, user } = await getCurrentUser();

  if (!configured || !user) {
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
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id,name,slug,city")
    .eq("slug", slug)
    .maybeSingle();

  if (clubError) {
    throw new Error(`Unable to load organization: ${clubError.message}`);
  }

  if (!club) return null;

  const { data: competitions, error: competitionError } = await supabase
    .from("competitions")
    .select("id,name,category,format,status,visibility,public_room_code,starts_at,timezone")
    .eq("club_id", club.id)
    .eq("visibility", "public")
    .order("starts_at", { ascending: false, nullsFirst: false });

  if (competitionError) {
    throw new Error(`Unable to load organization competitions: ${competitionError.message}`);
  }

  return {
    club: toClub(club as ClubRow),
    competitions: ((competitions ?? []) as CompetitionRow[]).map((competition) => ({
      category: competition.category,
      format: competition.format,
      id: competition.id,
      name: competition.name,
      roomCode: competition.public_room_code,
      startsAt: competition.starts_at ?? new Date().toISOString(),
      status: competition.status,
      timezone: competition.timezone,
      visibility: competition.visibility,
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

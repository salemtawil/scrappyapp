import { getCurrentUser } from "@/lib/auth/session";
import { demoEntries } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

export type PlayerListItem = {
  active: boolean;
  displayName: string;
  id: string;
  rating: number | null;
};

type PlayerRow = {
  active: boolean;
  display_name: string;
  id: string;
  rating: number | string | null;
};

export type PlayersData = {
  configured: boolean;
  players: PlayerListItem[];
  user: { email?: string; id: string } | null;
};

function toPlayer(row: PlayerRow): PlayerListItem {
  return {
    active: row.active,
    displayName: row.display_name,
    id: row.id,
    rating: row.rating === null ? null : Number(row.rating),
  };
}

export async function getPlayersData(): Promise<PlayersData> {
  const { configured, user } = await getCurrentUser();

  if (!configured) {
    return {
      configured: false,
      players: demoEntries.map((entry) => ({
        active: true,
        displayName: entry.displayName,
        id: entry.id,
        rating: entry.initialRating ?? null,
      })),
      user: null,
    };
  }

  if (!user) {
    return { configured: true, players: [], user: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("id,display_name,rating,active")
    .eq("linked_user_id", user.id)
    .order("display_name");

  if (error) {
    throw new Error(`Unable to load players: ${error.message}`);
  }

  return {
    configured: true,
    players: ((data ?? []) as PlayerRow[]).map(toPlayer),
    user: { email: user.email ?? undefined, id: user.id },
  };
}

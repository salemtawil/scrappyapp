import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getAvailableFormat } from "@/lib/competitions/formats/registry";
import { toRoundPayload } from "@/lib/competitions/service/round-payload";
import type { SocialEntry } from "@/lib/competitions/social/social-types";

/**
 * Comprueba contra un Postgres real que el calendario que genera el dominio se
 * persiste tal cual mediante las funciones transaccionales, y que el bloqueo
 * optimista de marcadores funciona. Se salta si no hay base de pruebas:
 *
 *   tests/sql/run.sh && PADEL_TEST_DATABASE_URL=postgres://... pnpm test
 */
const connectionString = process.env.PADEL_TEST_DATABASE_URL;
const maybeDescribe = connectionString ? describe : describe.skip;

const ORGANIZER = "33333333-3333-3333-3333-333333333333";

/**
 * `postgres.JSONValue` exige una firma de índice que una interfaz declarada no tiene,
 * aunque su forma sea JSON válido. El puente es solo de tipos: no toca los datos.
 */
const asJson = (value: unknown) => value as postgres.JSONValue;
const scoring = { mode: "FIXED_TOTAL", targetPoints: 24 } as const;

maybeDescribe("Persistencia transaccional", () => {
  const sql = postgres(connectionString!, { max: 1, prepare: false });
  let entries: SocialEntry[] = [];

  beforeAll(async () => {
    await sql`insert into auth.users (id, email) values (${ORGANIZER}, 'integration@test.local')
              on conflict (id) do nothing`;
    await sql`insert into profiles (id, display_name) values (${ORGANIZER}, 'Integración')
              on conflict (id) do nothing`;
    await sql.unsafe(`set role authenticated`);
    await sql`select set_config('request.jwt.claim.sub', ${ORGANIZER}, false)`;

    const players = await sql`
      insert into players (linked_user_id, display_name, rating)
      select ${ORGANIZER}::uuid, 'Integración ' || g, 3 from generate_series(1, 9) g
      returning id, display_name`;
    entries = players.map((player, index) => ({
      displayName: player.display_name as string,
      id: player.id as string,
      initialRating: null,
      seed: index + 1,
    }));
  });

  afterAll(async () => {
    await sql.end({ timeout: 5 });
  });

  it("guarda un Americano completo en una sola transacción", async () => {
    const americano = getAvailableFormat("AMERICANO");
    const rounds = americano.generateInitialRounds({
      courtCount: 2,
      entries,
      roundCount: 3,
      scoring,
      seed: "integration",
    });

    const [created] = await sql`
      select * from create_social_competition(
        ${"Americano de integración"}, 'SOCIAL', 'AMERICANO', 'public', 'America/Caracas', now(),
        ${sql.json({ courtCount: 2, roundCount: 3, targetPoints: 24, scoringMode: "FIXED_TOTAL", seed: "integration" })},
        null,
        ${sql.json(entries.map((entry) => ({
          displayName: entry.displayName,
          initialRating: null,
          playerId: entry.id,
          seed: entry.seed,
        })))},
        ${sql.json(asJson(toRoundPayload(rounds, entries)))}
      )`;

    expect(created.room_code).toMatch(/^[0-9A-F]{6}$/);

    const stored = await sql`
      select m.round_number, m.court_number,
             (select array_agg(e.seed order by ord)
              from unnest(m.side_a_entry_ids) with ordinality as t(id, ord)
              join competition_entries e on e.id = t.id) as side_a,
             (select array_agg(e.seed order by ord)
              from unnest(m.side_b_entry_ids) with ordinality as t(id, ord)
              join competition_entries e on e.id = t.id) as side_b
      from matches m
      where m.competition_id = ${created.competition_id}
      order by m.round_number, m.court_number`;

    const expected = rounds.flatMap((round) =>
      round.matches.map((match) => ({
        court: match.courtNumber,
        round: round.roundNumber,
        sideA: match.sideA.entryIds.map((id) => entries.find((e) => e.id === id)!.seed),
        sideB: match.sideB.entryIds.map((id) => entries.find((e) => e.id === id)!.seed),
      })),
    );

    expect(stored).toHaveLength(expected.length);
    stored.forEach((row, index) => {
      expect(row.round_number).toBe(expected[index].round);
      expect(row.court_number).toBe(expected[index].court);
      expect(row.side_a).toEqual(expected[index].sideA);
      expect(row.side_b).toEqual(expected[index].sideB);
    });

    const [{ count: sitOutRounds }] = await sql`
      select count(*)::int from rounds
      where competition_id = ${created.competition_id} and cardinality(sit_out_entry_ids) = 1`;
    expect(sitOutRounds).toBe(3);
  });

  it("no deja competiciones a medias si el calendario es inválido", async () => {
    const before = await sql`select count(*)::int as count from competitions`;

    await expect(
      sql`select * from create_social_competition(
            ${"Debe fallar"}, 'SOCIAL', 'AMERICANO', 'public', 'America/Caracas', now(),
            ${sql.json({})}, null,
            ${sql.json(entries.slice(0, 2).map((entry) => ({
              displayName: entry.displayName, playerId: entry.id, seed: entry.seed, initialRating: null,
            })))},
            ${sql.json([])}
          )`,
    ).rejects.toThrow(/TOO_FEW_ENTRIES/);

    const after = await sql`select count(*)::int as count from competitions`;
    expect(after[0].count).toBe(before[0].count);
  });

  it("rechaza el segundo dispositivo que guarda con una versión vieja", async () => {
    const [competition] = await sql`
      select id from competitions where owner_user_id = ${ORGANIZER}::uuid order by created_at limit 1`;
    const [match] = await sql`
      select id, state_version from matches where competition_id = ${competition.id}
      order by round_number, court_number limit 1`;

    const [first] = await sql`
      select record_match_score(${competition.id}, ${match.id}, 14, 10, ${match.state_version}) as result`;
    expect(first.result.stateVersion).toBe(match.state_version + 1);

    // Segundo dispositivo: sigue con la versión anterior en pantalla.
    await expect(
      sql`select record_match_score(${competition.id}, ${match.id}, 12, 12, ${match.state_version})`,
    ).rejects.toThrow(/STALE_MATCH_VERSION/);

    const [current] = await sql`select score, status from matches where id = ${match.id}`;
    expect(current.score).toEqual({ sideAScore: 14, sideBScore: 10 });
    expect(current.status).toBe("completed");
  });

  it("regenera la ronda siguiente de un Mexicano sin tocar las anteriores", async () => {
    const mexicano = getAvailableFormat("MEXICANO");
    const first = mexicano.generateInitialRounds({
      courtCount: 2,
      entries,
      firstRoundSeeding: "MANUAL",
      roundCount: 4,
      scoring,
      seed: "mx-integration",
    });

    const [created] = await sql`
      select * from create_social_competition(
        ${"Mexicano de integración"}, 'SOCIAL', 'MEXICANO', 'public', 'America/Caracas', now(),
        ${sql.json({ courtCount: 2, roundCount: 4, targetPoints: 24, scoringMode: "FIXED_TOTAL", seed: "mx-integration", firstRoundSeeding: "MANUAL" })},
        null,
        ${sql.json(entries.map((entry) => ({
          displayName: entry.displayName, initialRating: null, playerId: entry.id, seed: entry.seed,
        })))},
        ${sql.json(asJson(toRoundPayload(first, entries)))}
      )`;

    const priorResults = first[0].matches.map((match) => ({
      matchId: match.id,
      sideAScore: 16,
      sideBScore: 8,
    }));
    const next = mexicano.generateNextRound!({
      courtCount: 2,
      entries,
      firstRoundSeeding: "MANUAL",
      priorResults,
      priorRounds: first,
      roundCount: 4,
      scoring,
      seed: "mx-integration",
    });

    const [{ replace_rounds_from: added }] = await sql`
      select replace_rounds_from(${created.competition_id}, 1, ${sql.json(asJson(toRoundPayload([next], entries)))}, 'round.generated')`;
    expect(added).toBe(1);

    const rounds = await sql`
      select round_number from rounds where competition_id = ${created.competition_id} order by round_number`;
    expect(rounds.map((row) => row.round_number)).toEqual([1, 2]);

    const [log] = await sql`
      select count(*)::int as count from activity_logs
      where competition_id = ${created.competition_id} and action = 'round.generated'`;
    expect(log.count).toBe(1);
  });
});

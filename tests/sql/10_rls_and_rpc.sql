-- Pruebas de las funciones y de RLS contra un Postgres real.
-- Se ejecutan con `tests/sql/run.sh`, que reconstruye la base desde cero.
\set ON_ERROR_STOP on
\pset pager off

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'org1@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'org2@test.local');

-- ---------------------------------------------------------------- organizador 1
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into players (linked_user_id, display_name, rating)
select '11111111-1111-1111-1111-111111111111', 'Jugador ' || g, 3
from generate_series(1, 5) g;

select 'players_visible' as check, count(*) = 5 as ok from players;

create temporary table created as
select * from create_social_competition(
  'Americano de prueba',
  'SOCIAL', 'AMERICANO', 'public', 'America/Caracas', now(),
  jsonb_build_object('courtCount', 1, 'roundCount', 2, 'targetPoints', 24,
                     'scoringMode', 'FIXED_TOTAL', 'seed', 'testseed'),
  null,
  (select jsonb_agg(jsonb_build_object('playerId', s.id, 'displayName', s.display_name,
                                       'seed', s.seed, 'initialRating', s.rating)
                    order by s.seed)
   from (select p.id, p.display_name, p.rating,
                row_number() over (order by p.display_name) as seed
         from players p) s),
  jsonb_build_array(
    jsonb_build_object('id', 'americano-r1', 'roundNumber', 1, 'sitOutSeeds', jsonb_build_array(5),
      'matches', jsonb_build_array(jsonb_build_object('id','americano-r1-m1','courtNumber',1,'courtLabel','Pista 1',
        'sideASeeds', jsonb_build_array(1,2), 'sideBSeeds', jsonb_build_array(3,4)))),
    jsonb_build_object('id', 'americano-r2', 'roundNumber', 2, 'sitOutSeeds', jsonb_build_array(1),
      'matches', jsonb_build_array(jsonb_build_object('id','americano-r2-m1','courtNumber',1,'courtLabel','Pista 1',
        'sideASeeds', jsonb_build_array(2,5), 'sideBSeeds', jsonb_build_array(3,4))))
  )
);

select 'competition_created' as check, count(*) = 1 as ok from created;
select 'entries_created' as check, count(*) = 5 as ok
  from competition_entries where competition_id = (select competition_id from created);
select 'rounds_created' as check, count(*) = 2 as ok
  from rounds where competition_id = (select competition_id from created);
select 'matches_created' as check, count(*) = 2 as ok
  from matches where competition_id = (select competition_id from created);
select 'sit_outs_persisted' as check, array_length(sit_out_entry_ids, 1) = 1 as ok
  from rounds where competition_id = (select competition_id from created) and round_number = 1;
select 'sides_have_two_players' as check,
       bool_and(array_length(side_a_entry_ids,1) = 2 and array_length(side_b_entry_ids,1) = 2) as ok
  from matches where competition_id = (select competition_id from created);
select 'creation_logged' as check, count(*) = 1 as ok
  from activity_logs where competition_id = (select competition_id from created) and action = 'competition.created';

-- Bloqueo optimista -----------------------------------------------------------
create temporary table target as
select m.id, m.state_version from matches m
where m.competition_id = (select competition_id from created) and m.round_number = 1;

do $$
declare v_ok boolean := false;
begin
  begin
    perform record_match_score(
      (select competition_id from created), (select id from target), 12, 12, 99);
  exception when others then
    v_ok := sqlerrm like '%STALE_MATCH_VERSION%';
  end;
  if not v_ok then raise exception 'FALLO: se aceptó una versión obsoleta'; end if;
  raise notice 'stale_version_rejected ok';
end $$;

select 'score_recorded' as check,
       (record_match_score((select competition_id from created), (select id from target), 14, 10,
                           (select state_version from target)) ->> 'stateVersion')::int
       = (select state_version from target) + 1 as ok;

select 'match_completed' as check, status = 'completed' and winner_side = 'A' as ok
  from matches where id = (select id from target);
select 'score_logged' as check, count(*) = 1 as ok
  from activity_logs where competition_id = (select competition_id from created) and action = 'match.scored';

-- Rondas dinámicas ------------------------------------------------------------
select 'rounds_replaced' as check,
  replace_rounds_from(
    (select competition_id from created), 1,
    jsonb_build_array(jsonb_build_object('id','mexicano-r2','roundNumber',2,'sitOutSeeds', jsonb_build_array(2),
      'matches', jsonb_build_array(jsonb_build_object('id','mexicano-r2-m1','courtNumber',1,'courtLabel','Pista 1',
        'sideASeeds', jsonb_build_array(1,5), 'sideBSeeds', jsonb_build_array(3,4))))),
    'round.generated') = 1 as ok;

select 'replacement_kept_round_one' as check, count(*) = 2 as ok
  from rounds where competition_id = (select competition_id from created);
select 'replacement_new_pairing' as check, count(*) = 1 as ok
  from matches where competition_id = (select competition_id from created)
   and round_number = 2 and engine_matchup_id = 'mexicano-r2-m1';

select competition_id::text as shared_competition_id, room_code as shared_room_code from created
\gset

-- ---------------------------------------------------------------- organizador 2
reset role;
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select 'other_owner_cannot_see_competition' as check, count(*) = 0 as ok
  from competitions where id = :'shared_competition_id'::uuid;
select 'other_owner_cannot_see_matches' as check, count(*) = 0 as ok
  from matches where competition_id = :'shared_competition_id'::uuid;
select 'other_owner_cannot_see_players' as check, count(*) = 0 as ok from players;

-- psql no sustituye variables dentro de bloques con comillas de dólar: la pasamos por GUC.
select set_config('test.competition_id', :'shared_competition_id', false) is not null as _;

do $$
declare v_ok boolean := false;
begin
  begin
    perform record_match_score(current_setting('test.competition_id')::uuid,
                               (select id from matches limit 1), 12, 12, 0);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO: otro organizador pudo puntuar'; end if;
  raise notice 'cross_owner_score_blocked ok';
end $$;

do $$
declare v_ok boolean := false;
begin
  begin
    perform replace_rounds_from(current_setting('test.competition_id')::uuid, 0, '[]'::jsonb);
  exception when others then v_ok := sqlerrm like '%COMPETITION_NOT_OWNED%';
  end;
  if not v_ok then raise exception 'FALLO: otro organizador pudo rehacer rondas'; end if;
  raise notice 'cross_owner_rounds_blocked ok';
end $$;

-- ---------------------------------------------------------------------- anónimo
reset role;
set role anon;
reset request.jwt.claim.sub;

select 'anon_cannot_read_competitions' as check, count(*) = 0 as ok from competitions;
select 'anon_cannot_read_matches' as check, count(*) = 0 as ok from matches;
select 'anon_cannot_read_entries' as check, count(*) = 0 as ok from competition_entries;
select 'anon_cannot_read_players' as check, count(*) = 0 as ok from players;


select 'snapshot_has_name' as check, doc -> 'competition' ->> 'name' = 'Americano de prueba' as ok from (select public_competition_snapshot(:'shared_room_code') as doc) snap;
select 'snapshot_has_participants' as check, jsonb_array_length(doc -> 'participants') = 5 as ok from (select public_competition_snapshot(:'shared_room_code') as doc) snap;
select 'snapshot_has_rounds' as check, jsonb_array_length(doc -> 'rounds') = 2 as ok from (select public_competition_snapshot(:'shared_room_code') as doc) snap;
select 'snapshot_hides_internal_ids' as check, doc::text !~* '[0-9a-f]{8}-[0-9a-f]{4}-' as ok from (select public_competition_snapshot(:'shared_room_code') as doc) snap;
select 'snapshot_hides_settings' as check,
       doc::text not like '%testseed%' and doc::text not like '%owner_user_id%' as ok from (select public_competition_snapshot(:'shared_room_code') as doc) snap;
select 'snapshot_hides_ratings' as check, doc -> 'participants' -> 0 ? 'rating' = false as ok from (select public_competition_snapshot(:'shared_room_code') as doc) snap;
select 'snapshot_unknown_code_is_null' as check, public_competition_snapshot('NOPE12') is null as ok;
select 'resolve_code_finds_competition' as check,
       resolve_public_code(:'shared_room_code') ->> 'kind' = 'competition' as ok;
select 'resolve_code_unknown_is_null' as check, resolve_public_code('NOPE12') is null as ok;

reset role;

-- Competiciones atómicas, marcadores con bloqueo optimista y DTOs públicos saneados.
-- Aditiva: no reescribe migraciones ya aplicadas y tolera datos existentes.

-- ---------------------------------------------------------------------------
-- 1. Esquema: descansos y numeración de pista como datos de primera clase
-- ---------------------------------------------------------------------------

alter table rounds add column if not exists sit_out_entry_ids uuid[] not null default '{}'::uuid[];
alter table matches add column if not exists court_number integer;

-- Los descansos vivían dentro de competitions.engine_record; los movemos a su ronda.
update rounds r
set sit_out_entry_ids = coalesce(
  (
    select array_agg(sit_out.entry_id::uuid)
    from competitions c
    cross join lateral jsonb_array_elements(coalesce(c.engine_record -> 'rounds', '[]'::jsonb)) as er(round_json)
    cross join lateral jsonb_array_elements_text(coalesce(er.round_json -> 'sitOutEntryIds', '[]'::jsonb)) as sit_out(entry_id)
    where c.id = r.competition_id
      and (er.round_json ->> 'roundNumber')::int = r.round_number
  ),
  '{}'::uuid[]
)
where r.sit_out_entry_ids = '{}'::uuid[];

-- "Pista 10" se ordenaba antes que "Pista 2" al ordenar por texto.
update matches
set court_number = nullif(regexp_replace(coalesce(court_label, ''), '\D', '', 'g'), '')::integer
where court_number is null;

update matches set court_number = 1 where court_number is null;

create index if not exists matches_round_court_idx on matches (round_id, court_number);
create unique index if not exists matches_round_court_unique on matches (round_id, court_number)
  where court_number is not null;

-- ---------------------------------------------------------------------------
-- 2. Políticas faltantes: tablas con RLS activo y cero políticas eran inaccesibles
-- ---------------------------------------------------------------------------

drop policy if exists "owner_courts_all" on courts;
create policy "owner_courts_all" on courts
for all using (
  exists (select 1 from clubs c where c.id = club_id and c.owner_user_id = auth.uid())
) with check (
  exists (select 1 from clubs c where c.id = club_id and c.owner_user_id = auth.uid())
);

drop policy if exists "owner_pairs_all" on competition_pairs;
create policy "owner_pairs_all" on competition_pairs
for all using (
  exists (select 1 from competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
) with check (
  exists (select 1 from competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
);

drop policy if exists "owner_pair_members_all" on pair_members;
create policy "owner_pair_members_all" on pair_members
for all using (
  exists (
    select 1 from competition_pairs p
    join competitions c on c.id = p.competition_id
    where p.id = pair_id and c.owner_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from competition_pairs p
    join competitions c on c.id = p.competition_id
    where p.id = pair_id and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "owner_activity_logs_select" on activity_logs;
create policy "owner_activity_logs_select" on activity_logs
for select using (
  exists (select 1 from competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
);

drop policy if exists "owner_activity_logs_insert" on activity_logs;
create policy "owner_activity_logs_insert" on activity_logs
for insert with check (
  actor_user_id = auth.uid()
  and exists (select 1 from competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- 3. Lectura pública: fuera el acceso directo a las tablas
--    Las salas públicas pasan a leerse por funciones que devuelven solo lo mostrable.
--    Antes, cualquier anónimo podía leer settings, engine_record y owner_user_id.
-- ---------------------------------------------------------------------------

drop policy if exists "public_competitions_read" on competitions;
drop policy if exists "public_rounds_read" on rounds;
drop policy if exists "public_matches_read" on matches;
drop policy if exists "public_standings_read" on standings;
drop policy if exists "public_entries_read" on competition_entries;
drop policy if exists "public_active_clubs_read" on clubs;

-- ---------------------------------------------------------------------------
-- 4. Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.generate_room_code()
returns text
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_attempt integer := 0;
begin
  loop
    v_attempt := v_attempt + 1;
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from competitions where public_room_code = v_code);
    if v_attempt > 20 then
      raise exception 'ROOM_CODE_EXHAUSTED';
    end if;
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Creación atómica de una competición social
--    security invoker: las políticas RLS del organizador siguen aplicando.
-- ---------------------------------------------------------------------------

create or replace function public.create_social_competition(
  p_name text,
  p_category competition_category,
  p_format competition_format,
  p_visibility competition_visibility,
  p_timezone text,
  p_starts_at timestamptz,
  p_settings jsonb,
  p_club_id uuid,
  p_entries jsonb,
  p_rounds jsonb
)
returns table (competition_id uuid, room_code text)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_competition_id uuid;
  v_room_code text;
  v_entry_count integer;
  v_owned_players integer;
  v_requested_players integer;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  v_entry_count := jsonb_array_length(coalesce(p_entries, '[]'::jsonb));
  if v_entry_count < 4 then
    raise exception 'TOO_FEW_ENTRIES';
  end if;

  -- Los jugadores enviados tienen que ser del propio organizador.
  select count(*) into v_requested_players
  from jsonb_array_elements(p_entries) e
  where e ->> 'playerId' is not null;

  select count(*) into v_owned_players
  from players pl
  where pl.linked_user_id = v_user
    and pl.id in (
      select (e ->> 'playerId')::uuid
      from jsonb_array_elements(p_entries) e
      where e ->> 'playerId' is not null
    );

  if v_owned_players <> v_requested_players then
    raise exception 'PLAYER_NOT_OWNED';
  end if;

  if p_club_id is not null
     and not exists (select 1 from clubs c where c.id = p_club_id and c.owner_user_id = v_user) then
    raise exception 'CLUB_NOT_OWNED';
  end if;

  v_room_code := generate_room_code();

  insert into competitions (
    owner_user_id, club_id, name, category, format, status, visibility,
    public_room_code, timezone, starts_at, settings, engine_provider, state_version
  ) values (
    v_user, p_club_id, p_name, p_category, p_format, 'live', p_visibility,
    v_room_code, p_timezone, p_starts_at, p_settings, 'custom', 1
  )
  returning id into v_competition_id;

  insert into competition_entries (
    competition_id, player_id, display_name_snapshot, seed, initial_rating, sort_order
  )
  select
    v_competition_id,
    nullif(e ->> 'playerId', '')::uuid,
    e ->> 'displayName',
    (e ->> 'seed')::integer,
    nullif(e ->> 'initialRating', '')::numeric,
    (e ->> 'seed')::integer
  from jsonb_array_elements(p_entries) e;

  perform insert_competition_rounds(v_competition_id, p_rounds);

  insert into activity_logs (competition_id, actor_user_id, action, payload)
  values (
    v_competition_id, v_user, 'competition.created',
    jsonb_build_object('format', p_format, 'entries', v_entry_count,
                       'rounds', jsonb_array_length(coalesce(p_rounds, '[]'::jsonb)))
  );

  return query select v_competition_id, v_room_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Inserción de rondas resolviendo participantes por `seed`
-- ---------------------------------------------------------------------------

create or replace function public.insert_competition_rounds(
  p_competition_id uuid,
  p_rounds jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_round jsonb;
  v_round_id uuid;
  v_round_number integer;
  v_inserted integer := 0;
begin
  for v_round in select * from jsonb_array_elements(coalesce(p_rounds, '[]'::jsonb))
  loop
    v_round_number := (v_round ->> 'roundNumber')::integer;

    insert into rounds (competition_id, round_number, name, engine_structure_id, sit_out_entry_ids)
    select
      p_competition_id,
      v_round_number,
      'Ronda ' || v_round_number,
      v_round ->> 'id',
      coalesce(
        (
          select array_agg(ce.id order by ce.seed)
          from jsonb_array_elements_text(coalesce(v_round -> 'sitOutSeeds', '[]'::jsonb)) s
          join competition_entries ce
            on ce.competition_id = p_competition_id and ce.seed = s::integer
        ),
        '{}'::uuid[]
      )
    returning id into v_round_id;

    insert into matches (
      competition_id, round_id, round_number, court_number, court_label,
      engine_matchup_id, side_a_entry_ids, side_b_entry_ids, status
    )
    select
      p_competition_id,
      v_round_id,
      v_round_number,
      (m ->> 'courtNumber')::integer,
      m ->> 'courtLabel',
      m ->> 'id',
      (
        select array_agg(ce.id order by ord)
        from jsonb_array_elements_text(m -> 'sideASeeds') with ordinality as t(seed, ord)
        join competition_entries ce
          on ce.competition_id = p_competition_id and ce.seed = t.seed::integer
      ),
      (
        select array_agg(ce.id order by ord)
        from jsonb_array_elements_text(m -> 'sideBSeeds') with ordinality as t(seed, ord)
        join competition_entries ce
          on ce.competition_id = p_competition_id and ce.seed = t.seed::integer
      ),
      'pending'
    from jsonb_array_elements(coalesce(v_round -> 'matches', '[]'::jsonb)) m;

    v_inserted := v_inserted + 1;
  end loop;

  return v_inserted;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Rondas dinámicas: añadir la siguiente o rehacer desde una ronda editada
-- ---------------------------------------------------------------------------

create or replace function public.replace_rounds_from(
  p_competition_id uuid,
  p_from_round integer,
  p_rounds jsonb,
  p_reason text default 'round.replaced'
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_removed integer;
  v_added integer;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not exists (
    select 1 from competitions c where c.id = p_competition_id and c.owner_user_id = v_user
  ) then
    raise exception 'COMPETITION_NOT_OWNED';
  end if;

  with deleted as (
    delete from rounds
    where competition_id = p_competition_id and round_number > p_from_round
    returning 1
  )
  select count(*) into v_removed from deleted;

  v_added := insert_competition_rounds(p_competition_id, p_rounds);

  update competitions
  set state_version = state_version + 1, updated_at = now()
  where id = p_competition_id;

  insert into activity_logs (competition_id, actor_user_id, action, payload)
  values (
    p_competition_id, v_user, p_reason,
    jsonb_build_object('fromRound', p_from_round, 'removed', v_removed, 'added', v_added)
  );

  return v_added;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Marcador con bloqueo optimista
--    Evita que dos dispositivos se pisen el resultado sin avisar.
-- ---------------------------------------------------------------------------

create or replace function public.record_match_score(
  p_competition_id uuid,
  p_match_id uuid,
  p_side_a integer,
  p_side_b integer,
  p_expected_version integer
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_current matches%rowtype;
  v_winner text;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_side_a < 0 or p_side_b < 0 or p_side_a > 99 or p_side_b > 99 then
    raise exception 'SCORE_OUT_OF_RANGE';
  end if;

  select * into v_current
  from matches
  where id = p_match_id and competition_id = p_competition_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;

  if v_current.state_version <> p_expected_version then
    raise exception 'STALE_MATCH_VERSION'
      using detail = jsonb_build_object(
        'stateVersion', v_current.state_version,
        'sideAScore', v_current.score -> 'sideAScore',
        'sideBScore', v_current.score -> 'sideBScore'
      )::text;
  end if;

  v_winner := case
    when p_side_a = p_side_b then null
    when p_side_a > p_side_b then 'A'
    else 'B'
  end;

  update matches
  set score = jsonb_build_object('sideAScore', p_side_a, 'sideBScore', p_side_b),
      winner_side = v_winner,
      status = 'completed',
      state_version = state_version + 1,
      completed_at = now(),
      updated_at = now()
  where id = p_match_id and competition_id = p_competition_id and state_version = p_expected_version
  returning * into v_current;

  if not found then
    raise exception 'STALE_MATCH_VERSION';
  end if;

  update competitions
  set state_version = state_version + 1, updated_at = now()
  where id = p_competition_id;

  insert into activity_logs (competition_id, actor_user_id, action, payload)
  values (
    p_competition_id, v_user, 'match.scored',
    jsonb_build_object('matchId', p_match_id, 'sideAScore', p_side_a, 'sideBScore', p_side_b,
                       'roundNumber', v_current.round_number)
  );

  return jsonb_build_object(
    'matchId', v_current.id,
    'stateVersion', v_current.state_version,
    'sideAScore', p_side_a,
    'sideBScore', p_side_b
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. DTOs públicos
--    security definer para poder leer sin abrir las tablas a `anon`.
--    Solo salen datos mostrables: ni correos, ni teléfonos, ni notas, ni
--    ratings, ni identificadores internos, ni ajustes de motor.
-- ---------------------------------------------------------------------------

create or replace function public.public_competition_snapshot(p_room_code text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_competition competitions%rowtype;
  v_result jsonb;
begin
  select * into v_competition
  from competitions
  where public_room_code = upper(trim(p_room_code)) and visibility = 'public';

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'competition', jsonb_build_object(
      'name', v_competition.name,
      'category', v_competition.category,
      'format', v_competition.format,
      'status', v_competition.status,
      'roomCode', v_competition.public_room_code,
      'startsAt', v_competition.starts_at,
      'timezone', v_competition.timezone,
      'stateVersion', v_competition.state_version,
      'scoringMode', coalesce(v_competition.settings ->> 'scoringMode', 'FIXED_TOTAL'),
      'targetPoints', coalesce((v_competition.settings ->> 'targetPoints')::int, 24),
      'plannedRounds', coalesce((v_competition.settings ->> 'roundCount')::int, 0),
      'organization', (
        select jsonb_build_object('name', cl.name, 'slug', cl.slug::text)
        from clubs cl where cl.id = v_competition.club_id and cl.active
      )
    ),
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('ref', 'e' || ce.seed, 'name', ce.display_name_snapshot, 'seed', ce.seed)
                       order by ce.seed)
      from competition_entries ce
      where ce.competition_id = v_competition.id and ce.status = 'active'
    ), '[]'::jsonb),
    'rounds', coalesce((
      select jsonb_agg(round_json order by round_number)
      from (
        select
          r.round_number,
          jsonb_build_object(
            'roundNumber', r.round_number,
            'sitOutRefs', coalesce((
              select jsonb_agg('e' || ce.seed order by ce.seed)
              from competition_entries ce
              where ce.id = any (r.sit_out_entry_ids)
            ), '[]'::jsonb),
            'matches', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'ref', 'r' || m.round_number || 'c' || coalesce(m.court_number, 1),
                  'courtNumber', coalesce(m.court_number, 1),
                  'courtLabel', coalesce(m.court_label, 'Pista ' || coalesce(m.court_number, 1)),
                  'status', m.status,
                  'sideARefs', entry_refs(v_competition.id, m.side_a_entry_ids),
                  'sideBRefs', entry_refs(v_competition.id, m.side_b_entry_ids),
                  'sideAScore', m.score -> 'sideAScore',
                  'sideBScore', m.score -> 'sideBScore'
                ) order by coalesce(m.court_number, 1)
              )
              from matches m
              where m.round_id = r.id
            ), '[]'::jsonb)
          ) as round_json
        from rounds r
        where r.competition_id = v_competition.id
      ) rounds_source
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.entry_refs(p_competition_id uuid, p_entry_ids uuid[])
returns jsonb
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg('e' || ce.seed order by ord),
    '[]'::jsonb
  )
  from unnest(coalesce(p_entry_ids, '{}'::uuid[])) with ordinality as t(entry_id, ord)
  join competition_entries ce on ce.id = t.entry_id and ce.competition_id = p_competition_id;
$$;

create or replace function public.public_club_snapshot(p_slug text)
returns jsonb
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'club', jsonb_build_object('name', c.name, 'slug', c.slug::text, 'city', c.city),
    'competitions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', comp.name,
          'format', comp.format,
          'category', comp.category,
          'status', comp.status,
          'roomCode', comp.public_room_code,
          'startsAt', comp.starts_at
        ) order by comp.starts_at desc nulls last
      )
      from competitions comp
      where comp.club_id = c.id and comp.visibility = 'public'
    ), '[]'::jsonb)
  )
  from clubs c
  where c.slug = lower(trim(p_slug))::citext and c.active;
$$;

create or replace function public.resolve_public_code(p_code text)
returns jsonb
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select jsonb_build_object('kind', 'competition', 'code', c.public_room_code)
      from competitions c
      where c.public_room_code = upper(trim(p_code)) and c.visibility = 'public'
      limit 1
    ),
    (
      select jsonb_build_object('kind', 'club', 'slug', cl.slug::text)
      from clubs cl
      where cl.slug = lower(trim(p_code))::citext and cl.active
      limit 1
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- 10. Permisos de ejecución
-- ---------------------------------------------------------------------------

revoke all on function public.entry_refs(uuid, uuid[]) from public;
revoke all on function public.public_competition_snapshot(text) from public;
revoke all on function public.public_club_snapshot(text) from public;
revoke all on function public.resolve_public_code(text) from public;

grant execute on function public.public_competition_snapshot(text) to anon, authenticated;
grant execute on function public.public_club_snapshot(text) to anon, authenticated;
grant execute on function public.resolve_public_code(text) to anon, authenticated;

grant execute on function public.create_social_competition(
  text, competition_category, competition_format, competition_visibility,
  text, timestamptz, jsonb, uuid, jsonb, jsonb
) to authenticated;
grant execute on function public.insert_competition_rounds(uuid, jsonb) to authenticated;
grant execute on function public.replace_rounds_from(uuid, integer, jsonb, text) to authenticated;
grant execute on function public.record_match_score(uuid, uuid, integer, integer, integer) to authenticated;
grant execute on function public.generate_room_code() to authenticated;

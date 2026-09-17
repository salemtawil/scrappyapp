create policy "owner_entries_all" on competition_entries
for all using (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
);

create policy "public_entries_read" on competition_entries
for select using (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.visibility = 'public'
  )
);

create policy "owner_rounds_all" on rounds
for all using (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
);

create policy "owner_matches_all" on matches
for all using (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
);

create policy "owner_standings_all" on standings
for all using (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from competitions c
    where c.id = competition_id and c.owner_user_id = auth.uid()
  )
);

create policy "public_active_clubs_read" on clubs
for select using (active = true);

create policy "club_members_owner_insert" on club_members
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from clubs c
    where c.id = club_id and c.owner_user_id = auth.uid()
  )
);

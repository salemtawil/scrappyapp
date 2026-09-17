create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Organizador')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create policy "personal_players_select" on players
for select using (auth.uid() = linked_user_id);

create policy "personal_players_insert" on players
for insert with check (auth.uid() = linked_user_id and club_id is null);

create policy "personal_players_update" on players
for update using (auth.uid() = linked_user_id) with check (auth.uid() = linked_user_id);

create policy "personal_players_delete" on players
for delete using (auth.uid() = linked_user_id);

create policy "clubs_owner_all" on clubs
for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create policy "club_members_self_select" on club_members
for select using (auth.uid() = user_id);

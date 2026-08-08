insert into profiles (id, display_name, locale, timezone)
values ('00000000-0000-0000-0000-000000000001', 'Organizador Demo', 'es', 'Europe/Madrid')
on conflict (id) do nothing;

insert into clubs (id, owner_user_id, name, slug, timezone, city)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Club Demo Centro',
  'club-demo',
  'Europe/Madrid',
  'Madrid'
) on conflict (slug) do nothing;

# Padel Organizer

Aplicación web mobile-first para organizar competiciones de pádel: Americano y Mexicano de
extremo a extremo, marcador en vivo con bloqueo optimista, salas públicas con código y QR, y
exportación de la clasificación.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript estricto
- Tailwind CSS 4 con tokens propios y primitivos ligeros; iconos Lucide
- Supabase Auth/Postgres/RLS vía `@supabase/ssr`
- Zod para validar en servidor y en cliente desde el mismo esquema
- `tods-competition-factory@6.19.0` aislado en `lib/competitions/courthive` (solo servidor)
- Vitest (dominio e integración) y Playwright (E2E)

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Sin credenciales de Supabase la aplicación arranca en **modo demostración**: la portada, el panel,
los jugadores y la sala `/r/PADEL8` funcionan con datos de ejemplo claramente etiquetados, y no se
puede crear ni guardar nada.

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
APP_SECRET=
ADMIN_EMAILS=            # correos autorizados a administrar, separados por comas
```

No antepongas `NEXT_PUBLIC_` a ningún secreto de servidor.

## Supabase

1. Crea el proyecto y copia `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Aplica **todas** las migraciones de `supabase/migrations` en orden.
3. Revisa las políticas antes de producción.

### Qué cambia la migración `202609190001`

Es aditiva y tolera datos existentes, pero cambia el modelo de acceso público, así que conviene
leerla antes de aplicarla:

- Añade `rounds.sit_out_entry_ids` y `matches.court_number`, y rellena ambos desde los datos
  actuales (los descansos estaban dentro de `competitions.engine_record`; la pista se deducía del
  texto de `court_label`, que ordenaba «Pista 10» antes que «Pista 2»).
- Añade políticas a `courts`, `competition_pairs`, `pair_members` y `activity_logs`, que tenían RLS
  activado y ninguna política: eran inaccesibles.
- **Retira el acceso directo de lectura pública** a `competitions`, `rounds`, `matches`,
  `standings`, `competition_entries` y `clubs`. Antes, cualquier anónimo podía leer `settings`,
  `engine_record` y `owner_user_id`. Las salas públicas pasan a leerse por funciones
  `security definer` que devuelven solo lo mostrable: `public_competition_snapshot`,
  `public_club_snapshot` y `resolve_public_code`.
- Añade funciones `security invoker` (RLS intacto) para operar en una sola transacción:
  `create_social_competition`, `insert_competition_rounds`, `replace_rounds_from` y
  `record_match_score`, esta última con bloqueo optimista sobre `state_version`.

Si actualizas un despliegue existente, aplica la migración **antes** de desplegar la aplicación:
sin ella, crear competiciones y guardar marcadores devuelve un error explicando que falta.

Realtime es opcional; si lo activas, publica `matches`, `rounds` y `activity_logs`.

## Vercel

1. Importa el repositorio como proyecto Next.js.
2. Configura las variables de entorno anteriores.
3. Node.js 22 o superior.

## Controles de calidad

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

### Pruebas de base de datos

Las políticas RLS y las funciones SQL se prueban contra un Postgres real, no de memoria:

```bash
# Requiere un Postgres accesible (PGHOST/PGPORT/PGUSER) con las extensiones pgcrypto y citext
./tests/sql/run.sh

# Pruebas de integración del contrato dominio <-> SQL (se saltan si falta la variable)
PADEL_TEST_DATABASE_URL=postgres://usuario@host:5432/padel_test pnpm test
```

`tests/sql/00_supabase_stub.sql` emula el esquema `auth` y los roles `anon`/`authenticated` de
Supabase; solo se usa en local y nunca se aplica al proyecto real.

Si el entorno ya tiene un Chromium instalado, `PLAYWRIGHT_CHROMIUM_PATH` evita la descarga de
navegadores en `pnpm e2e`.

## Arquitectura

- `lib/competitions/social` — algoritmos puros: generación de Americano y Mexicano, reparto de
  descansos, validación de marcadores y clasificación con desempates. Sin dependencias de React ni
  de la base de datos, y reproducibles mediante semilla.
- `lib/competitions/formats` — registro tipado de formatos. Cada formato declara disponibilidad,
  requisitos de participantes, configuración permitida, esquema Zod, generador de calendario,
  estrategia de clasificación, si admite rondas dinámicas y sus textos para la interfaz. La
  interfaz y las acciones consultan el registro en vez de repartir `if (format === ...)`.
- `lib/competitions/service` — lectura (organizador y sala pública) y escritura vía las funciones
  transaccionales. Es el único sitio que habla con la base de datos.
- `components/` — presentación. No importa tipos de librerías externas ni consulta la base.

### Decisiones que no son evidentes en el código

- **Un Mexicano no se puede editar hacia atrás sin consecuencias.** Cada ronda se empareja con la
  clasificación del momento, así que corregir un resultado antiguo invalida todo lo posterior. La
  consola pide confirmación diciendo cuántas rondas y resultados se perderán, borra las rondas
  afectadas y deja que el organizador genere la siguiente.
- **El marcador usa bloqueo optimista, no el último que escribe gana.** Cada partido lleva
  `state_version`; si otro dispositivo guardó antes, la segunda escritura se rechaza y la interfaz
  pide revisar en vez de sobrescribir en silencio.
- **Los descansos se reparten por equidad, no por clasificación.** En Mexicano el reparto salía del
  último tramo de la tabla y los peores no volvían a jugar; ahora descansa quien menos ha
  descansado, evitando dos rondas seguidas, y solo después se agrupa por nivel.
- **El emparejamiento de Americano corrige el resultado voraz.** Tras formar las parejas se hace
  una pasada de intercambios que solo acepta mejoras estrictas, así sigue siendo determinista para
  una misma semilla pero deja de repetir compañeros cuando aún quedan combinaciones nuevas.
- **Las salas públicas no leen tablas.** Pasan por funciones que devuelven referencias opacas
  (`e1`, `r2c1`) en vez de UUID internos, y nunca exponen correos, teléfonos, notas, valoraciones
  ni ajustes del motor.
- **CourtHive es servidor puro** y devuelve proyecciones propias; sus tipos no llegan a React.

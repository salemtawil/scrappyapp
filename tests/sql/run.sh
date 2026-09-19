#!/usr/bin/env bash
# Reconstruye una base local y ejecuta las pruebas de RLS y de las funciones.
# Requiere un Postgres accesible; PGHOST/PGPORT/PGUSER se toman del entorno.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="${PADEL_TEST_DB:-padel_test}"
psql -q -c "drop database if exists ${DB};"
psql -q -c "create database ${DB};"
psql -v ON_ERROR_STOP=1 -q -d "${DB}" -f tests/sql/00_supabase_stub.sql
for migration in supabase/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "${DB}" -f "${migration}"
done
psql -v ON_ERROR_STOP=1 -d "${DB}" -f tests/sql/10_rls_and_rpc.sql

import postgres from "postgres";

let client: postgres.Sql | undefined;

export function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for server database operations.");
  }
  client ??= postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 3,
  });
  return client;
}

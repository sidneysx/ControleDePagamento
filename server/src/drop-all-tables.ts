import 'dotenv/config'
import { pool } from './db.js'

const confirmed = process.argv.includes('--yes')

const { rows } = await pool.query<{ tablename: string }>(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
)

if (rows.length === 0) {
  console.log('No tables found in schema "public". Nothing to drop.')
  await pool.end()
  process.exit(0)
}

console.log(`Database: ${process.env.DB_DATABASE} @ ${process.env.DB_HOST}`)
console.log('Tables that will be dropped:')
for (const { tablename } of rows) console.log(`  - ${tablename}`)

if (!confirmed) {
  console.log('\nDry run only. Re-run with --yes to actually drop these tables.')
  await pool.end()
  process.exit(0)
}

for (const { tablename } of rows) {
  await pool.query(`DROP TABLE IF EXISTS public."${tablename}" CASCADE`)
  console.log(`Dropped: ${tablename}`)
}

console.log('\nAll tables dropped.')
await pool.end()

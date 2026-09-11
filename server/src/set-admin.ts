import 'dotenv/config'
import { pool } from './db.js'

const username = process.argv[2]

if (!username) {
  console.log('Usage: npm run set-admin -- <username>')
  process.exit(1)
}

const result = await pool.query<{ id: number; username: string; role: string }>(
  `UPDATE users SET role = 'adm' WHERE username = $1 RETURNING id, username, role`,
  [username],
)

const user = result.rows[0]
if (!user) {
  console.log(`User "${username}" not found.`)
  await pool.end()
  process.exit(1)
}

console.log(`User "${user.username}" (id ${user.id}) is now role "${user.role}".`)
await pool.end()

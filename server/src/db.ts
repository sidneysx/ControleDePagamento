import { Pool, types } from 'pg'

// return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date objects
// (pg's default parsing shifts them by the server's timezone, corrupting the date)
types.setTypeParser(1082, (value: string) => value)

const required = ['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'] as const
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set`)
  }
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
})

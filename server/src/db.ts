import { Pool } from 'pg'

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

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { SESSION_COOKIE, signSession } from '../auth.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const authRouter = Router()

const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60 * 1000
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000
const PASSWORD_RULE = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_HINT = 'A senha deve ter ao menos 8 caracteres, incluindo um número e um caractere especial.'

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

type UserRow = {
  id: number
  username: string
  email: string
  regional: string
  seccional: string
  setor: string | null
  role: string
  status: string
}

authRouter.post('/register', async (req, res) => {
  const { username, email, password, regional, seccional } = req.body ?? {}

  if (
    typeof username !== 'string' ||
    !username.trim() ||
    typeof email !== 'string' ||
    typeof regional !== 'string' ||
    !regional.trim() ||
    typeof seccional !== 'string' ||
    !seccional.trim()
  ) {
    res.status(400).json({
      error: 'Usuário, e-mail, senha, regional e seccional são obrigatórios.',
    })
    return
  }

  if (typeof password !== 'string' || !PASSWORD_RULE.test(password)) {
    res.status(400).json({ error: PASSWORD_HINT })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    await pool.query(
      `INSERT INTO users (username, email, password_hash, regional, seccional, status)
       VALUES ($1, $2, $3, $4, $5, 'pendente')`,
      [username.trim(), email.toLowerCase().trim(), passwordHash, regional.trim(), seccional.trim()],
    )
    res.status(201).json({
      message: 'Solicitação de acesso enviada. Um administrador precisa aprovar antes que você possa entrar.',
    })
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'Usuário ou e-mail já cadastrado.' })
      return
    }
    throw err
  }
})

authRouter.post('/login', async (req, res) => {
  const { username, password, remember } = req.body ?? {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios.' })
    return
  }

  const result = await pool.query<UserRow & { password_hash: string }>(
    'SELECT id, username, email, regional, seccional, setor, role, status, password_hash FROM users WHERE username = $1',
    [username.trim()],
  )
  const row = result.rows[0]

  const passwordMatches = row ? await bcrypt.compare(password, row.password_hash) : false
  if (!row || !passwordMatches) {
    res.status(401).json({ error: 'Usuário ou senha inválidos.' })
    return
  }

  if (row.status !== 'aprovado') {
    res.status(403).json({ error: 'Sua solicitação de acesso ainda está pendente de aprovação por um administrador.' })
    return
  }

  const token = signSession({ userId: row.id }, remember ? '30d' : '1d')
  res.cookie(SESSION_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: remember ? REMEMBER_MAX_AGE : DEFAULT_MAX_AGE,
  })
  res.json({
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      regional: row.regional,
      seccional: row.seccional,
      setor: row.setor,
      role: row.role,
      status: row.status,
    },
  })
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, baseCookieOptions())
  res.status(204).end()
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query<UserRow>(
    'SELECT id, username, email, regional, seccional, setor, role, status FROM users WHERE id = $1',
    [req.userId],
  )
  const user = result.rows[0]
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  res.json({ user })
})

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505'
}

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { requireAdmin, requireAuth } from '../middleware/requireAuth.js'

export const usersRouter = Router()
usersRouter.use(requireAuth, requireAdmin)

const PASSWORD_RULE = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_HINT = 'A senha deve ter ao menos 8 caracteres, incluindo um número e um caractere especial.'
const ROLES = ['adm', 'user_padrao'] as const

type UserRow = {
  id: number
  username: string
  email: string
  regional: string
  seccional: string
  setor: string | null
  role: string
  status: string
  created_at: string
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505'
}

usersRouter.get('/', async (_req, res) => {
  const result = await pool.query<UserRow>(
    `SELECT id, username, email, regional, seccional, setor, role, status, created_at FROM users
     ORDER BY (status = 'pendente') DESC, username`,
  )
  res.json({ data: result.rows })
})

usersRouter.post('/', async (req, res) => {
  const b = req.body ?? {}
  const username = str(b.username)
  const email = str(b.email).toLowerCase()
  const password = str(b.password)
  const regional = str(b.regional)
  const seccional = str(b.seccional)
  const setor = str(b.setor)
  const role = str(b.role)

  if (!username || !email || !regional || !seccional || !setor || !role) {
    res.status(400).json({ error: 'Usuário, e-mail, senha, regional, seccional, setor e papel são obrigatórios.' })
    return
  }
  if (!PASSWORD_RULE.test(password)) {
    res.status(400).json({ error: PASSWORD_HINT })
    return
  }
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    res.status(400).json({ error: 'Papel inválido.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const inserted = await pool.query<UserRow>(
      `INSERT INTO users (username, email, password_hash, regional, seccional, setor, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, username, email, regional, seccional, setor, role, status, created_at`,
      [username, email, passwordHash, regional, seccional, setor, role],
    )
    res.status(201).json({ user: inserted.rows[0] })
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'Usuário ou e-mail já cadastrado.' })
      return
    }
    throw err
  }
})

usersRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }

  const b = req.body ?? {}
  const username = str(b.username)
  const email = str(b.email).toLowerCase()
  const regional = str(b.regional)
  const seccional = str(b.seccional)
  const setor = str(b.setor)
  const role = str(b.role)

  if (!username || !email || !regional || !seccional || !setor || !role) {
    res.status(400).json({ error: 'Usuário, e-mail, regional, seccional, setor e papel são obrigatórios.' })
    return
  }
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    res.status(400).json({ error: 'Papel inválido.' })
    return
  }
  if (id === req.userId && role !== 'adm') {
    res.status(400).json({ error: 'Você não pode remover seu próprio acesso de administrador.' })
    return
  }

  try {
    const updated = await pool.query<UserRow>(
      `UPDATE users SET username = $1, email = $2, regional = $3, seccional = $4, setor = $5, role = $6
       WHERE id = $7
       RETURNING id, username, email, regional, seccional, setor, role, status, created_at`,
      [username, email, regional, seccional, setor, role, id],
    )
    const user = updated.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' })
      return
    }
    res.json({ user })
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'Usuário ou e-mail já cadastrado.' })
      return
    }
    throw err
  }
})

usersRouter.put('/:id/aprovar', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }

  const updated = await pool.query<UserRow>(
    `UPDATE users SET status = 'aprovado' WHERE id = $1
     RETURNING id, username, email, regional, seccional, setor, role, status, created_at`,
    [id],
  )
  const user = updated.rows[0]
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' })
    return
  }
  res.json({ user })
})

usersRouter.put('/:id/senha', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }

  const password = str(req.body?.password)
  if (!PASSWORD_RULE.test(password)) {
    res.status(400).json({ error: PASSWORD_HINT })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const updated = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [
    passwordHash,
    id,
  ])
  if (updated.rowCount === 0) {
    res.status(404).json({ error: 'Usuário não encontrado.' })
    return
  }
  res.status(204).end()
})

usersRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }
  if (id === req.userId) {
    res.status(400).json({ error: 'Você não pode apagar sua própria conta.' })
    return
  }

  const deleted = await pool.query('DELETE FROM users WHERE id = $1', [id])
  if (deleted.rowCount === 0) {
    res.status(404).json({ error: 'Usuário não encontrado.' })
    return
  }
  res.status(204).end()
})

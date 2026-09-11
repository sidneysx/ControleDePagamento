import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const regionaisRouter = Router()

// listagem é pública: a tela de solicitação de acesso (sem login) precisa exibir as regionais
regionaisRouter.get('/', async (_req, res) => {
  const result = await pool.query<{ id: number; nome: string }>('SELECT id, nome FROM regionais ORDER BY nome')
  res.json({ data: result.rows })
})

regionaisRouter.post('/', requireAuth, async (req, res) => {
  const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : ''
  if (!nome) {
    res.status(400).json({ error: 'Nome da regional é obrigatório.' })
    return
  }

  const inserted = await pool.query<{ id: number; nome: string }>(
    `INSERT INTO regionais (nome) VALUES ($1)
     ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome
     RETURNING id, nome`,
    [nome],
  )
  res.status(201).json({ regional: inserted.rows[0] })
})

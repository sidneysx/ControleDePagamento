import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const seccionaisRouter = Router()

// listagem é pública: a tela de solicitação de acesso (sem login) precisa exibir as seccionais
seccionaisRouter.get('/', async (req, res) => {
  const regional = typeof req.query.regional === 'string' ? req.query.regional.trim() : ''
  if (!regional) {
    res.json({ data: [] })
    return
  }

  const result = await pool.query<{ id: number; nome: string }>(
    `SELECT s.id, s.nome FROM seccionais s
     JOIN regionais r ON r.id = s.regional_id
     WHERE r.nome = $1
     ORDER BY s.nome`,
    [regional],
  )
  res.json({ data: result.rows })
})

seccionaisRouter.post('/', requireAuth, async (req, res) => {
  const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : ''
  const regional = typeof req.body?.regional === 'string' ? req.body.regional.trim() : ''
  if (!nome || !regional) {
    res.status(400).json({ error: 'Nome da seccional e regional são obrigatórios.' })
    return
  }

  const regionalRes = await pool.query<{ id: number }>('SELECT id FROM regionais WHERE nome = $1', [regional])
  const regionalRow = regionalRes.rows[0]
  if (!regionalRow) {
    res.status(400).json({ error: 'Regional não encontrada.' })
    return
  }

  const inserted = await pool.query<{ id: number; nome: string }>(
    `INSERT INTO seccionais (nome, regional_id) VALUES ($1, $2)
     ON CONFLICT (regional_id, nome) DO UPDATE SET nome = EXCLUDED.nome
     RETURNING id, nome`,
    [nome, regionalRow.id],
  )
  res.status(201).json({ seccional: inserted.rows[0] })
})

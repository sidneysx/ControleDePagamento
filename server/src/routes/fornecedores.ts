import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const fornecedoresRouter = Router()
fornecedoresRouter.use(requireAuth)

type FornecedorRow = {
  id: number
  cpf_cnpj: string
  razao_social: string
  favorecido: string
  cidade: string
  uf: string
  banco: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: string | null
  pix_favorecido: string | null
  pix_cpf_cnpj: string | null
  pix_tipo_chave: string | null
  pix_chave: string | null
  created_at: Date
}

const SORT_COLUMNS: Record<string, string> = {
  razao_social: 'razao_social',
  cidade: 'cidade',
  uf: 'uf',
  created_at: 'created_at',
}

const PAGE_SIZES = [10, 20, 50, 100]

fornecedoresRouter.get('/', async (req, res) => {
  // fetch current user's role and regional to apply visibility rules
  const userRes = await pool.query<{ role: string; regional: string }>('SELECT role, regional FROM users WHERE id = $1', [
    req.userId,
  ])
  const currentUser = userRes.rows[0]
  if (!currentUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const uf = typeof req.query.uf === 'string' ? req.query.uf.trim() : ''
  const cidade = typeof req.query.cidade === 'string' ? req.query.cidade.trim() : ''
  const banco = typeof req.query.banco === 'string' ? req.query.banco.trim() : ''

  const sortKey = typeof req.query.sort === 'string' ? req.query.sort : 'razao_social'
  const sortColumn = SORT_COLUMNS[sortKey] ?? 'razao_social'
  const order = req.query.order === 'desc' ? 'DESC' : 'ASC'

  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = PAGE_SIZES.includes(Number(req.query.pageSize)) ? Number(req.query.pageSize) : 20
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: unknown[] = []

  if (search) {
    const searchDigits = search.replace(/\D/g, '')
    params.push(`%${search}%`)
    const textMatch = `(razao_social ILIKE $${params.length} OR cidade ILIKE $${params.length})`
    if (searchDigits) {
      params.push(`%${searchDigits}%`)
      conditions.push(`(cpf_cnpj ILIKE $${params.length} OR ${textMatch})`)
    } else {
      conditions.push(textMatch)
    }
  }
  if (uf) {
    params.push(uf.toUpperCase())
    conditions.push(`uf = $${params.length}`)
  }
  if (cidade) {
    params.push(cidade)
    conditions.push(`cidade = $${params.length}`)
  }
  if (banco) {
    params.push(banco)
    conditions.push(`banco = $${params.length}`)
  }

  // If user is regional admin, restrict to their regional (match UF or city text)
  if (currentUser.role === 'user_adm_regional') {
    const regionalVal = currentUser.regional || ''
    if (regionalVal) {
      params.push(regionalVal.toUpperCase())
      conditions.push(`(uf = $${params.length} OR cidade = $${params.length})`)
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await pool.query<{ count: string }>(`SELECT count(*) FROM fornecedores ${whereClause}`, params)
  const total = Number(countResult.rows[0].count)

  params.push(pageSize, offset)
  const dataResult = await pool.query<FornecedorRow>(
    `SELECT * FROM fornecedores ${whereClause} ORDER BY ${sortColumn} ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )

  res.json({ data: dataResult.rows, total, page, pageSize })
})

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function validatePayload(body: unknown): { error: string } | { value: Omit<FornecedorRow, 'id' | 'created_at'> } {
  const b = (body ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const cpf_cnpj = onlyDigits(str(b.cpf_cnpj))
  const razao_social = str(b.razao_social)
  const favorecido = str(b.favorecido)
  const cidade = str(b.cidade)
  const uf = str(b.uf).toUpperCase()

  if (!cpf_cnpj || !razao_social || !favorecido || !cidade || !uf) {
    return { error: 'CPF/CNPJ, Razão Social, Favorecido, Cidade e UF são obrigatórios.' }
  }
  if (uf.length !== 2) {
    return { error: 'UF deve ter 2 letras.' }
  }
  if (cpf_cnpj.length !== 11 && cpf_cnpj.length !== 14) {
    return { error: 'CPF/CNPJ deve ter 11 (CPF) ou 14 (CNPJ) dígitos.' }
  }

  const pix_cpf_cnpj = onlyDigits(str(b.pix_cpf_cnpj))
  if (pix_cpf_cnpj && pix_cpf_cnpj.length !== 11 && pix_cpf_cnpj.length !== 14) {
    return { error: 'CPF/CNPJ PIX deve ter 11 (CPF) ou 14 (CNPJ) dígitos.' }
  }

  const tipo_conta = str(b.tipo_conta) || null
  if (tipo_conta && tipo_conta !== 'corrente' && tipo_conta !== 'poupanca') {
    return { error: 'Tipo da Conta deve ser "corrente" ou "poupanca".' }
  }

  return {
    value: {
      cpf_cnpj,
      razao_social,
      favorecido,
      cidade,
      uf,
      banco: str(b.banco) || null,
      agencia: str(b.agencia) || null,
      conta: str(b.conta) || null,
      tipo_conta,
      pix_favorecido: str(b.pix_favorecido) || null,
      pix_cpf_cnpj: pix_cpf_cnpj || null,
      pix_tipo_chave: str(b.pix_tipo_chave) || null,
      pix_chave: str(b.pix_chave) || null,
    },
  }
}

fornecedoresRouter.post('/', async (req, res) => {
  const result = validatePayload(req.body)
  if ('error' in result) {
    res.status(400).json({ error: result.error })
    return
  }
  const v = result.value

  try {
    const inserted = await pool.query<FornecedorRow>(
      `INSERT INTO fornecedores
        (cpf_cnpj, razao_social, favorecido, cidade, uf, banco, agencia, conta, tipo_conta,
         pix_favorecido, pix_cpf_cnpj, pix_tipo_chave, pix_chave)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        v.cpf_cnpj,
        v.razao_social,
        v.favorecido,
        v.cidade,
        v.uf,
        v.banco,
        v.agencia,
        v.conta,
        v.tipo_conta,
        v.pix_favorecido,
        v.pix_cpf_cnpj,
        v.pix_tipo_chave,
        v.pix_chave,
      ],
    )
    res.status(201).json({ fornecedor: inserted.rows[0] })
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'Já existe um fornecedor com esse CPF/CNPJ.' })
      return
    }
    throw err
  }
})

fornecedoresRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }

  const result = validatePayload(req.body)
  if ('error' in result) {
    res.status(400).json({ error: result.error })
    return
  }
  const v = result.value

  try {
    const updated = await pool.query<FornecedorRow>(
      `UPDATE fornecedores SET
        cpf_cnpj = $1, razao_social = $2, favorecido = $3, cidade = $4, uf = $5,
        banco = $6, agencia = $7, conta = $8, tipo_conta = $9,
        pix_favorecido = $10, pix_cpf_cnpj = $11, pix_tipo_chave = $12, pix_chave = $13
       WHERE id = $14
       RETURNING *`,
      [
        v.cpf_cnpj,
        v.razao_social,
        v.favorecido,
        v.cidade,
        v.uf,
        v.banco,
        v.agencia,
        v.conta,
        v.tipo_conta,
        v.pix_favorecido,
        v.pix_cpf_cnpj,
        v.pix_tipo_chave,
        v.pix_chave,
        id,
      ],
    )
    if (updated.rows.length === 0) {
      res.status(404).json({ error: 'Fornecedor não encontrado.' })
      return
    }
    res.json({ fornecedor: updated.rows[0] })
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: 'Já existe um fornecedor com esse CPF/CNPJ.' })
      return
    }
    throw err
  }
})

fornecedoresRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }

  const deleted = await pool.query('DELETE FROM fornecedores WHERE id = $1', [id])
  if (deleted.rowCount === 0) {
    res.status(404).json({ error: 'Fornecedor não encontrado.' })
    return
  }
  res.status(204).end()
})

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505'
}

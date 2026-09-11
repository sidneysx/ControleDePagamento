import path from 'path'
import { promises as fs } from 'fs'
import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { isCategoriaValida, isCentroCustoValido } from '../centrosCusto.js'
import { UPLOADS_DIR, uploadNotaArquivos } from '../uploads.js'

export const notasRouter = Router()
notasRouter.use(requireAuth)

export const OPERACOES = ['Administrativo', 'Comercial', 'Logística', 'Perdas', 'PLPT', 'Técnica'] as const
export const CONTRATOS = ['Âncora', 'DPL', 'LV AT', 'PLPT', 'Transmissão', 'Transporte'] as const
export const TIPOS_PAGAMENTO = ['Boleto', 'Pix', 'Transferência'] as const

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '')
}

function normalizeNumeroNota(v: string): string {
  return onlyDigits(v).slice(0, 9).padStart(9, '0')
}

function includes<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value)
}

const ADMIN_ROLE = 'adm'

function isAdmin(role: string): boolean {
  return role === ADMIN_ROLE
}

async function getCurrentUser(userId: number | undefined): Promise<{ role: string; regional: string } | null> {
  if (!userId) return null
  const result = await pool.query<{ role: string; regional: string }>('SELECT role, regional FROM users WHERE id = $1', [
    userId,
  ])
  return result.rows[0] ?? null
}

function uploadMiddleware(req: Request, res: Response, next: NextFunction) {
  uploadNotaArquivos(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erro ao enviar arquivo.' })
      return
    }
    next()
  })
}

function getUploadedFile(req: Request, field: string): Express.Multer.File | undefined {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined
  const file = files?.[field]?.[0]
  if (file) {
    // busboy decodes multipart filenames as latin1; recover the original UTF-8 bytes
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
  }
  return file
}

async function cleanupFiles(...files: (Express.Multer.File | undefined)[]) {
  await Promise.all(files.filter((f): f is Express.Multer.File => !!f).map((f) => fs.unlink(f.path).catch(() => {})))
}

notasRouter.post('/', uploadMiddleware, async (req, res) => {
  const b = req.body ?? {}
  const boletoArquivo = getUploadedFile(req, 'boleto_arquivo')
  const notaFiscalArquivo = getUploadedFile(req, 'nota_fiscal_arquivo')

  const numero = str(b.numero)
  const operacao = str(b.operacao)
  const regional = str(b.regional)
  const seccional = str(b.seccional)
  const cidade = str(b.cidade)
  const uf = str(b.uf).toUpperCase()
  const fornecedor_id = Number(b.fornecedor_id)
  const numeroNotaDigits = onlyDigits(str(b.numero_nota))
  const valor = Number(b.valor)
  const data_emissao = str(b.data_emissao)
  const placa = str(b.placa)
  const descricao = str(b.descricao)
  const contrato = str(b.contrato)
  const centro_custo = str(b.centro_custo)
  const categoria = str(b.categoria)
  const observacao = str(b.observacao)
  const tipo_pagamento = str(b.tipo_pagamento)
  const pagamento_favorecido = str(b.pagamento_favorecido)
  const pagamento_cpf_cnpj = str(b.pagamento_cpf_cnpj)
  const pagamento_banco = str(b.pagamento_banco)
  const pagamento_agencia = str(b.pagamento_agencia)
  const pagamento_conta = str(b.pagamento_conta)
  const pagamento_pix_tipo_chave = str(b.pagamento_pix_tipo_chave)
  const pagamento_pix_chave = str(b.pagamento_pix_chave)
  const data_programacao = str(b.data_programacao)

  if (
    !numero ||
    !operacao ||
    !regional ||
    !seccional ||
    !cidade ||
    !uf ||
    !Number.isInteger(fornecedor_id) ||
    fornecedor_id <= 0 ||
    !numeroNotaDigits ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    !data_emissao ||
    !contrato ||
    !centro_custo ||
    !categoria ||
    !tipo_pagamento ||
    !pagamento_favorecido ||
    !pagamento_cpf_cnpj ||
    !data_programacao
  ) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({
      error:
        'N° do arquivo, operação, regional, seccional, cidade, UF, fornecedor, n° da nota, valor, data de emissão, contrato, centro de custo, categoria, tipo de pagamento, favorecido, CPF/CNPJ e data da programação são obrigatórios.',
    })
    return
  }
  if (!includes(OPERACOES, operacao)) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Operação inválida.' })
    return
  }
  if (!includes(CONTRATOS, contrato)) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Contrato inválido.' })
    return
  }
  if (!isCentroCustoValido(centro_custo)) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Centro de custo inválido.' })
    return
  }
  if (!isCategoriaValida(centro_custo, categoria)) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Categoria inválida para o centro de custo selecionado.' })
    return
  }
  if (!includes(TIPOS_PAGAMENTO, tipo_pagamento)) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Tipo de pagamento inválido.' })
    return
  }
  if (tipo_pagamento === 'Transferência' && (!pagamento_banco || !pagamento_agencia || !pagamento_conta)) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Banco, agência e conta são obrigatórios para pagamento por transferência.' })
    return
  }
  if (tipo_pagamento === 'Pix' && (!pagamento_pix_tipo_chave || !pagamento_pix_chave)) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Tipo de chave e chave PIX são obrigatórios para pagamento por PIX.' })
    return
  }
  if (uf.length !== 2) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'UF deve ter 2 letras.' })
    return
  }
  if (Number.isNaN(Date.parse(data_emissao))) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Data de emissão inválida.' })
    return
  }
  if (Number.isNaN(Date.parse(data_programacao))) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    res.status(400).json({ error: 'Data da programação inválida.' })
    return
  }

  const numero_nota = normalizeNumeroNota(numeroNotaDigits)

  try {
    const inserted = await pool.query(
      `INSERT INTO notas_fiscais
        (numero, operacao, regional, seccional, cidade, uf, fornecedor_id, numero_nota, valor,
         data_emissao, placa, descricao, contrato, centro_custo, categoria, observacao,
         tipo_pagamento, pagamento_favorecido, pagamento_cpf_cnpj, pagamento_banco, pagamento_agencia,
         pagamento_conta, pagamento_pix_tipo_chave, pagamento_pix_chave, boleto_arquivo, boleto_arquivo_nome,
         data_programacao, nota_fiscal_arquivo, nota_fiscal_arquivo_nome, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
       RETURNING *`,
      [
        numero,
        operacao,
        regional,
        seccional,
        cidade,
        uf,
        fornecedor_id,
        numero_nota,
        valor,
        data_emissao,
        placa || null,
        descricao || null,
        contrato,
        centro_custo,
        categoria,
        observacao || null,
        tipo_pagamento,
        pagamento_favorecido,
        pagamento_cpf_cnpj,
        pagamento_banco || null,
        pagamento_agencia || null,
        pagamento_conta || null,
        pagamento_pix_tipo_chave || null,
        pagamento_pix_chave || null,
        boletoArquivo?.filename ?? null,
        boletoArquivo?.originalname ?? null,
        data_programacao,
        notaFiscalArquivo?.filename ?? null,
        notaFiscalArquivo?.originalname ?? null,
        req.userId,
      ],
    )
    res.status(201).json({ nota: inserted.rows[0] })
  } catch (err: unknown) {
    await cleanupFiles(boletoArquivo, notaFiscalArquivo)
    if (isForeignKeyViolation(err)) {
      res.status(400).json({ error: 'Fornecedor não encontrado.' })
      return
    }
    throw err
  }
})

notasRouter.get('/', async (req, res) => {
  const currentUser = await getCurrentUser(req.userId)
  if (!currentUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const search = str(req.query.search)
  const dataProgramacao = str(req.query.data_programacao)
  let regional = str(req.query.regional)
  const seccional = str(req.query.seccional)

  if (!isAdmin(currentUser.role)) {
    regional = currentUser.regional
  }

  const conditions: string[] = []
  const params: unknown[] = []

  if (search) {
    const searchDigits = onlyDigits(search)
    params.push(`%${search}%`)
    const parts = [`n.numero ILIKE $${params.length}`]
    if (searchDigits) {
      params.push(`%${searchDigits}%`)
      parts.push(`n.numero_nota ILIKE $${params.length}`)
      parts.push(`f.cpf_cnpj ILIKE $${params.length}`)
    }
    conditions.push(`(${parts.join(' OR ')})`)
  }
  if (dataProgramacao) {
    params.push(dataProgramacao)
    conditions.push(`n.data_programacao = $${params.length}`)
  }
  if (regional) {
    params.push(regional)
    conditions.push(`n.regional = $${params.length}`)
  }
  if (seccional) {
    params.push(seccional)
    conditions.push(`n.seccional = $${params.length}`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await pool.query(
    `SELECT n.*, f.razao_social AS fornecedor_razao_social, f.cpf_cnpj AS fornecedor_cpf_cnpj, u.username AS created_by_username
    FROM notas_fiscais n
    LEFT JOIN fornecedores f ON f.id = n.fornecedor_id
    LEFT JOIN users u ON u.id = n.created_by
    ${whereClause}
    ORDER BY n.created_at DESC`,
    params,
  )
  res.json({ data: result.rows })
})

notasRouter.get('/programacoes', async (req, res) => {
  const currentUser = await getCurrentUser(req.userId)
  if (!currentUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const params: unknown[] = []
  let whereClause = 'WHERE data_programacao IS NOT NULL'
  if (!isAdmin(currentUser.role)) {
    params.push(currentUser.regional)
    whereClause += ` AND regional = $${params.length}`
  }

  const result = await pool.query<{ data_programacao: string; total_notas: string; valor_total: string }>(
    `SELECT data_programacao, count(*) AS total_notas, sum(valor) AS valor_total
     FROM notas_fiscais
     ${whereClause}
     GROUP BY data_programacao
     ORDER BY data_programacao DESC`,
    params,
  )
  res.json({ data: result.rows })
})

notasRouter.put('/:id/data-programacao', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }

  const currentUser = await getCurrentUser(req.userId)
  if (!currentUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  if (!isAdmin(currentUser.role)) {
    res.status(403).json({ error: 'Apenas administradores podem editar a data da programação.' })
    return
  }

  const data_programacao = str(req.body?.data_programacao)
  if (!data_programacao || Number.isNaN(Date.parse(data_programacao))) {
    res.status(400).json({ error: 'Data da programação inválida.' })
    return
  }

  const updated = await pool.query(
    `UPDATE notas_fiscais SET data_programacao = $1 WHERE id = $2
     RETURNING *`,
    [data_programacao, id],
  )
  const row = updated.rows[0]
  if (!row) {
    res.status(404).json({ error: 'Nota fiscal não encontrada.' })
    return
  }
  res.json({ nota: row })
})

notasRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'ID inválido.' })
    return
  }

  const currentUser = await getCurrentUser(req.userId)
  if (!currentUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const conditions = ['id = $1']
  const params: unknown[] = [id]
  if (!isAdmin(currentUser.role)) {
    params.push(currentUser.regional)
    conditions.push(`regional = $${params.length}`)
  }

  const deleted = await pool.query<{ boleto_arquivo: string | null; nota_fiscal_arquivo: string | null }>(
    `DELETE FROM notas_fiscais WHERE ${conditions.join(' AND ')} RETURNING boleto_arquivo, nota_fiscal_arquivo`,
    params,
  )
  const row = deleted.rows[0]
  if (!row) {
    res.status(404).json({ error: 'Nota fiscal não encontrada.' })
    return
  }

  await Promise.all(
    [row.boleto_arquivo, row.nota_fiscal_arquivo]
      .filter((f): f is string => !!f)
      .map((f) => fs.unlink(path.join(UPLOADS_DIR, f)).catch(() => {})),
  )

  res.status(204).end()
})

notasRouter.get('/:id/arquivo/:campo', async (req, res) => {
  const id = Number(req.params.id)
  const campo = req.params.campo
  if (!Number.isInteger(id) || (campo !== 'boleto' && campo !== 'nota_fiscal')) {
    res.status(400).json({ error: 'Parâmetros inválidos.' })
    return
  }

  const currentUser = await getCurrentUser(req.userId)
  if (!currentUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const column = campo === 'boleto' ? 'boleto_arquivo' : 'nota_fiscal_arquivo'
  const nameColumn = campo === 'boleto' ? 'boleto_arquivo_nome' : 'nota_fiscal_arquivo_nome'
  const result = await pool.query<{ arquivo: string | null; nome: string | null; regional: string }>(
    `SELECT ${column} AS arquivo, ${nameColumn} AS nome, regional FROM notas_fiscais WHERE id = $1`,
    [id],
  )
  const row = result.rows[0]
  if (!row?.arquivo) {
    res.status(404).json({ error: 'Arquivo não encontrado.' })
    return
  }
  if (!isAdmin(currentUser.role) && row.regional !== currentUser.regional) {
    res.status(404).json({ error: 'Arquivo não encontrado.' })
    return
  }

  const filename = row.nome ?? row.arquivo
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'")
  const disposition = req.query.download ? 'attachment' : 'inline'
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  )
  res.sendFile(path.join(UPLOADS_DIR, row.arquivo))
})

function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23503'
}

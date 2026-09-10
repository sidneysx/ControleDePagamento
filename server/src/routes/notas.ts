import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const notasRouter = Router()
notasRouter.use(requireAuth)

export const OPERACOES = ['Administrativo', 'Comercial', 'Logística', 'Perdas', 'PLPT', 'Técnica'] as const
export const CONTRATOS = ['Âncora', 'DPL', 'LV AT', 'PLPT', 'Transmissão', 'Transporte'] as const
export const CENTROS_CUSTO = [
  'ALIMENTAÇÃO_HOSPEDAGEM',
  'ALMOXARIFADO',
  'DESP_ADMINISTRATIVA',
  'DESP_FIXA',
  'DP_PESSOAL',
  'FROTA',
  'MANUTENÇÃO_PREDIAL',
  'OBRA_OPERACIONAL',
  'OBRA_TRANSMISSAO',
  'TAXAS_E_TRIBUTOS',
  'TI',
] as const
export const CATEGORIAS = ['ALIMENTAÇÃO', 'HOSPEDAGEM', 'ALIMENTAÇÃO_HOSPEDAGEM'] as const

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function includes<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value)
}

notasRouter.post('/', async (req, res) => {
  const b = req.body ?? {}
  const numero = str(b.numero)
  const operacao = str(b.operacao)
  const regional = str(b.regional)
  const seccional = str(b.seccional)
  const cidade = str(b.cidade)
  const uf = str(b.uf).toUpperCase()
  const fornecedor_id = Number(b.fornecedor_id)
  const numero_nota = str(b.numero_nota)
  const valor = Number(b.valor)
  const data_emissao = str(b.data_emissao)
  const placa = str(b.placa)
  const descricao = str(b.descricao)
  const contrato = str(b.contrato)
  const centro_custo = str(b.centro_custo)
  const categoria = str(b.categoria)
  const observacao = str(b.observacao)

  if (
    !numero ||
    !operacao ||
    !regional ||
    !seccional ||
    !cidade ||
    !uf ||
    !Number.isInteger(fornecedor_id) ||
    fornecedor_id <= 0 ||
    !numero_nota ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    !data_emissao ||
    !contrato ||
    !centro_custo ||
    !categoria
  ) {
    res.status(400).json({
      error:
        'N° do arquivo, operação, regional, seccional, cidade, UF, fornecedor, n° da nota, valor, data de emissão, contrato, centro de custo e categoria são obrigatórios.',
    })
    return
  }
  if (!includes(OPERACOES, operacao)) {
    res.status(400).json({ error: 'Operação inválida.' })
    return
  }
  if (!includes(CONTRATOS, contrato)) {
    res.status(400).json({ error: 'Contrato inválido.' })
    return
  }
  if (!includes(CENTROS_CUSTO, centro_custo)) {
    res.status(400).json({ error: 'Centro de custo inválido.' })
    return
  }
  if (!includes(CATEGORIAS, categoria)) {
    res.status(400).json({ error: 'Categoria inválida.' })
    return
  }
  if (uf.length !== 2) {
    res.status(400).json({ error: 'UF deve ter 2 letras.' })
    return
  }
  if (Number.isNaN(Date.parse(data_emissao))) {
    res.status(400).json({ error: 'Data de emissão inválida.' })
    return
  }

  try {
    const inserted = await pool.query(
      `INSERT INTO notas_fiscais
        (numero, operacao, regional, seccional, cidade, uf, fornecedor_id, numero_nota, valor,
         data_emissao, placa, descricao, contrato, centro_custo, categoria, observacao, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
        req.userId,
      ],
    )
    res.status(201).json({ nota: inserted.rows[0] })
  } catch (err: unknown) {
    if (isForeignKeyViolation(err)) {
      res.status(400).json({ error: 'Fornecedor não encontrado.' })
      return
    }
    throw err
  }
})

notasRouter.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM notas_fiscais ORDER BY created_at DESC')
  res.json({ data: result.rows })
})

function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23503'
}

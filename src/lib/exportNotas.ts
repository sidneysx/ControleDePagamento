import * as XLSX from 'xlsx'
import type { Nota } from './api'
import { formatCodeLabel, formatCpfCnpj, formatCurrency, formatDate, formatNumeroNota } from './format'

export function exportNotasToExcel(notas: Nota[]) {
  const rows = notas.map((n) => ({
    'N° do Arquivo': n.numero,
    Operação: n.operacao,
    Regional: n.regional,
    Seccional: n.seccional,
    UF: n.uf,
    Cidade: n.cidade,
    Fornecedor: n.fornecedor_razao_social ?? '',
    'CPF/CNPJ do Fornecedor': formatCpfCnpj(n.fornecedor_cpf_cnpj),
    'N° da Nota': formatNumeroNota(n.numero_nota),
    Valor: formatCurrency(n.valor),
    'Data de Emissão': formatDate(n.data_emissao),
    Placa: n.placa ?? '',
    Contrato: n.contrato,
    'Centro de Custo': formatCodeLabel(n.centro_custo),
    Categoria: n.categoria,
    Descrição: n.descricao ?? '',
    Observação: n.observacao ?? '',
    'Tipo de Pagamento': n.tipo_pagamento,
    'Favorecido do Pagamento': n.pagamento_favorecido,
    'CPF/CNPJ do Pagamento': formatCpfCnpj(n.pagamento_cpf_cnpj),
    Banco: n.pagamento_banco ?? '',
    Agência: n.pagamento_agencia ?? '',
    Conta: n.pagamento_conta ?? '',
    'Tipo da Chave PIX': n.pagamento_pix_tipo_chave ?? '',
    'Chave PIX': n.pagamento_pix_chave ?? '',
    'Arquivo do Boleto': n.boleto_arquivo_nome ?? '',
    'Data da Programação': formatDate(n.data_programacao),
    'Arquivo da Nota Fiscal': n.nota_fiscal_arquivo_nome ?? '',
    'Lançado por': n.created_by_username ?? '',
    'Data do Lançamento': formatDate(n.created_at),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas Fiscais')

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `notas-fiscais-${today}.xlsx`)
}

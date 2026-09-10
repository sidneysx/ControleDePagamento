import data from './data/centros-custo.json' with { type: 'json' }

export type CentroCustoEntry = {
  centro_custo: string
  categorias: string[]
}

export const centrosCusto: CentroCustoEntry[] = data

const categoriasPorCentroCusto = new Map<string, Set<string>>(
  centrosCusto.map((entry) => [entry.centro_custo, new Set(entry.categorias)]),
)

export function isCentroCustoValido(centroCusto: string): boolean {
  return categoriasPorCentroCusto.has(centroCusto)
}

export function isCategoriaValida(centroCusto: string, categoria: string): boolean {
  return categoriasPorCentroCusto.get(centroCusto)?.has(categoria) ?? false
}

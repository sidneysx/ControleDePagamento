// adm e financeiro têm privilégios elevados (editar programação, apagar, marcar como paga);
// financeiro fica restrito à própria regional no backend, mas a UI trata os dois como "privilegiados"
export function isPrivilegedRole(role: string | undefined): boolean {
  return role === 'adm' || role === 'financeiro'
}

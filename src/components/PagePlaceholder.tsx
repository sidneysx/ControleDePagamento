export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white text-center">
      <h1 className="text-xl font-semibold text-[#0e7c86]">{title}</h1>
      <p className="text-sm text-gray-500">Em construção — o conteúdo desta página será adicionado em breve.</p>
    </div>
  )
}

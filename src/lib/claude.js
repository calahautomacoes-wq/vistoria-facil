/**
 * Envia uma foto para a Claude API e retorna a descrição do estado do cômodo/item.
 * A chave da API fica no backend (Supabase Edge Function) para não expor no frontend.
 */
export async function descreverFoto(base64Image, mimeType = 'image/jpeg', contexto = '') {
  const response = await fetch('/api/descrever-foto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mimeType, contexto }),
  })

  if (!response.ok) {
    const erro = await response.json()
    throw new Error(erro.message || 'Erro ao processar imagem com IA')
  }

  const data = await response.json()
  return data.descricao
}

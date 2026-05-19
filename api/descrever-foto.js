/**
 * Vercel Serverless Function — /api/descrever-foto
 * Substitui o server/index.js em produção.
 * A chave ANTHROPIC_API_KEY fica nas env vars do Vercel (nunca exposta ao browser).
 */
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' })

  const { base64Image, mimeType = 'image/jpeg', contexto = '' } = req.body

  if (!base64Image) {
    return res.status(400).json({ message: 'Imagem não enviada.' })
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64Image },
            },
            {
              type: 'text',
              text: `Você é um assistente especializado em laudos de vistoria imobiliária.
Analise esta foto${contexto ? ` do(a) ${contexto}` : ''} e descreva objetivamente o estado de conservação do que está visível.

Regras:
- Seja técnico e objetivo (ex: "Parede com pintura em bom estado, sem rachaduras visíveis")
- Mencione materiais, cores e condições quando relevante
- Aponte danos, manchas, desgastes ou irregularidades se houver
- Máximo de 3 frases curtas
- Responda apenas com a descrição, sem introdução ou explicação`,
            },
          ],
        },
      ],
    })

    const descricao = response.content[0].text.trim()
    return res.status(200).json({ descricao })
  } catch (err) {
    console.error('Erro Claude API:', err.message)
    return res.status(500).json({ message: 'Erro ao processar imagem com IA.' })
  }
}

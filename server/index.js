import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Lê o .env manualmente para evitar filtragem do ambiente
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch (e) {
  console.warn('Aviso: não foi possível ler .env:', e.message)
}

import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
const PORT = 3001

// Aceita localhost E o IP da rede local (para testes no iOS)
app.use(cors({ origin: /^http:\/\/(localhost|192\.168\.\d+\.\d+)(:\d+)?$/ }))
app.use(express.json({ limit: '20mb' }))

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.post('/api/descrever-foto', async (req, res) => {
  const { base64Image, mimeType = 'image/jpeg', contexto = '' } = req.body

  if (!base64Image) {
    return res.status(400).json({ message: 'Imagem não enviada.' })
  }

  try {
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
    res.json({ descricao })
  } catch (err) {
    console.error('Erro Claude API:', err.message)
    res.status(500).json({ message: 'Erro ao processar imagem com IA.' })
  }
})

app.get('/api/health', (_, res) => {
  res.json({ ok: true, keyCarregada: !!process.env.ANTHROPIC_API_KEY })
})

app.listen(PORT, () => {
  const keyOk = !!process.env.ANTHROPIC_API_KEY
  console.log(`✅ Servidor IA rodando em http://localhost:${PORT}`)
  console.log(`🔑 Chave Anthropic: ${keyOk ? 'carregada ✓' : 'NÃO ENCONTRADA ✗'}`)
})

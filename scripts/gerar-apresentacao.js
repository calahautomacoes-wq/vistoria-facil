/**
 * Apresentação de Vendas — CAH Vistoria Fácil
 * Gerado com PptxGenJS
 */
const pptxgen = require('pptxgenjs')

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'
pres.title  = 'CAH Vistoria Fácil — Apresentação Comercial'
pres.author = 'CAH Automações'

// ── Paleta de cores ────────────────────────────────────────────────────────────
const C = {
  preto:    '0A0A0A',
  escuro:   '141414',
  dourado:  'C9A227',
  dourado2: 'E8C547',
  branco:   'FFFFFF',
  cinzaClaro: 'F7F6F3',
  cinza:    '7A756C',
  cinzaMed: 'E4E0D8',
  verde:    '22C55E',
  azul:     '3B82F6',
}

const mkShadow = () => ({ type: 'outer', blur: 8, offset: 3, angle: 135, color: '000000', opacity: 0.18 })

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — CAPA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.preto }

  // Faixa dourada lateral esquerda
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.dourado } })

  // Retângulo de destaque do logo
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 1.5, h: 1.5,
    fill: { color: C.dourado }, shadow: mkShadow(),
  })
  s.addText('CAH', {
    x: 0.5, y: 1.0, w: 1.5, h: 1.5,
    fontSize: 36, bold: true, color: C.preto,
    align: 'center', valign: 'middle', fontFace: 'Georgia',
  })

  // Título principal
  s.addText('Vistoria Fácil', {
    x: 2.3, y: 1.05, w: 7.2, h: 1.0,
    fontSize: 48, bold: true, color: C.branco, fontFace: 'Georgia',
    margin: 0,
  })

  // Linha dourada
  s.addShape(pres.shapes.RECTANGLE, { x: 2.3, y: 2.12, w: 6.5, h: 0.035, fill: { color: C.dourado } })

  // Subtítulo
  s.addText('Laudos imobiliários profissionais\ngerados com Inteligência Artificial', {
    x: 2.3, y: 2.25, w: 7.2, h: 1.1,
    fontSize: 20, color: 'C8C2B8', fontFace: 'Calibri', margin: 0,
  })

  // Tag inferior
  s.addShape(pres.shapes.RECTANGLE, { x: 2.3, y: 3.7, w: 4.5, h: 0.52, fill: { color: C.dourado }, shadow: mkShadow() })
  s.addText('Solução completa para vistoriadores e imobiliárias', {
    x: 2.3, y: 3.7, w: 4.5, h: 0.52,
    fontSize: 13, bold: true, color: C.preto, align: 'center', valign: 'middle', fontFace: 'Calibri', margin: 0,
  })

  // Versão
  s.addText('v1.0  —  2026', {
    x: 8.5, y: 5.1, w: 1.2, h: 0.35, fontSize: 10, color: '555555', fontFace: 'Calibri', margin: 0,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — O DESAFIO
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.cinzaClaro }

  // Topo escuro
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.preto } })
  s.addText('O DESAFIO', {
    x: 0.5, y: 0, w: 9, h: 1.1,
    fontSize: 11, bold: true, color: C.dourado, fontFace: 'Calibri',
    charSpacing: 4, valign: 'middle', margin: 0,
  })
  s.addText('Vistoria tradicional: lenta, trabalhosa e sem padrão', {
    x: 0.5, y: 1.25, w: 9, h: 0.7,
    fontSize: 26, bold: true, color: C.preto, fontFace: 'Georgia', margin: 0,
  })

  // 3 cartões de dor
  const dores = [
    { emoji: '⏱', titulo: 'Horas perdidas', desc: 'Preencher um laudo manualmente leva de 2 a 4 horas de trabalho por imóvel.' },
    { emoji: '📋', titulo: 'Sem padrão visual', desc: 'Laudos feitos no Word ou à mão perdem credibilidade e causam contestações.' },
    { emoji: '💸', titulo: 'Receita limitada', desc: 'Com processos lentos, o vistoriador consegue atender poucos clientes por semana.' },
  ]

  dores.forEach((d, i) => {
    const x = 0.4 + i * 3.1
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.2, w: 2.85, h: 2.8,
      fill: { color: C.branco }, shadow: mkShadow(),
    })
    // Borda topo vermelha
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: 2.85, h: 0.07, fill: { color: 'E74C3C' } })

    s.addText(d.emoji, { x, y: 2.35, w: 2.85, h: 0.65, fontSize: 28, align: 'center', margin: 0 })
    s.addText(d.titulo, {
      x: x + 0.15, y: 3.05, w: 2.55, h: 0.45,
      fontSize: 15, bold: true, color: C.preto, fontFace: 'Georgia', margin: 0,
    })
    s.addText(d.desc, {
      x: x + 0.15, y: 3.55, w: 2.55, h: 1.3,
      fontSize: 12, color: C.cinza, fontFace: 'Calibri', margin: 0,
    })
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — A SOLUÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.preto }

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.dourado } })

  s.addText('A SOLUÇÃO', {
    x: 0.5, y: 0.5, w: 9, h: 0.45,
    fontSize: 11, bold: true, color: C.dourado, fontFace: 'Calibri', charSpacing: 4, margin: 0,
  })
  s.addText('CAH Vistoria Fácil', {
    x: 0.5, y: 1.05, w: 7, h: 0.9,
    fontSize: 40, bold: true, color: C.branco, fontFace: 'Georgia', margin: 0,
  })

  // Stat central
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.1, w: 2.8, h: 2.0,
    fill: { color: C.dourado }, shadow: mkShadow(),
  })
  s.addText('De horas\npara\nminutos', {
    x: 0.5, y: 2.1, w: 2.8, h: 2.0,
    fontSize: 22, bold: true, color: C.preto, fontFace: 'Georgia',
    align: 'center', valign: 'middle', margin: 0,
  })

  // Benefícios à direita
  const beneficios = [
    '🤖  IA analisa as fotos e descreve cada ambiente automaticamente',
    '📄  Laudo profissional em PDF e Word com sua marca',
    '📱  Funciona no celular — use direto na vistoria',
    '☁️  Dados salvos na nuvem, seguros e acessíveis em qualquer lugar',
  ]
  beneficios.forEach((b, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 3.7, y: 2.1 + i * 0.5, w: 5.8, h: 0.42,
      fill: { color: '1C1C1C' },
    })
    s.addText(b, {
      x: 3.85, y: 2.1 + i * 0.5, w: 5.5, h: 0.42,
      fontSize: 13, color: 'D0CAC0', fontFace: 'Calibri', valign: 'middle', margin: 0,
    })
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — COMO FUNCIONA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.cinzaClaro }

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.preto } })
  s.addText('COMO FUNCIONA', {
    x: 0.5, y: 0, w: 9, h: 1.1,
    fontSize: 11, bold: true, color: C.dourado, fontFace: 'Calibri', charSpacing: 4, valign: 'middle', margin: 0,
  })
  s.addText('4 passos simples, do início ao laudo finalizado', {
    x: 0.5, y: 1.25, w: 9, h: 0.55,
    fontSize: 22, bold: true, color: C.preto, fontFace: 'Georgia', margin: 0,
  })

  const passos = [
    { num: '1', titulo: 'Cadastre', desc: 'Dados do imóvel, proprietário, inquilino e contrato', emoji: '🏠' },
    { num: '2', titulo: 'Fotografe', desc: 'Tire fotos de cada cômodo diretamente pelo celular', emoji: '📸' },
    { num: '3', titulo: 'IA descreve', desc: 'Claude Vision analisa cada foto e gera a descrição automaticamente', emoji: '🤖' },
    { num: '4', titulo: 'Baixe o laudo', desc: 'Gere PDF ou Word profissional em segundos', emoji: '📄' },
  ]

  passos.forEach((p, i) => {
    const x = 0.3 + i * 2.38

    // Conector entre cards
    if (i < 3) {
      s.addShape(pres.shapes.RECTANGLE, { x: x + 2.05, y: 2.85, w: 0.35, h: 0.06, fill: { color: C.dourado } })
    }

    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.0, w: 2.1, h: 3.0,
      fill: { color: C.branco }, shadow: mkShadow(),
    })
    // Número no topo
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 2.1, h: 0.65, fill: { color: C.preto } })
    s.addText(p.num, {
      x, y: 2.0, w: 2.1, h: 0.65,
      fontSize: 22, bold: true, color: C.dourado, fontFace: 'Georgia', align: 'center', valign: 'middle', margin: 0,
    })

    s.addText(p.emoji, { x, y: 2.75, w: 2.1, h: 0.65, fontSize: 24, align: 'center', margin: 0 })
    s.addText(p.titulo, {
      x: x + 0.1, y: 3.45, w: 1.9, h: 0.4,
      fontSize: 14, bold: true, color: C.preto, fontFace: 'Georgia', align: 'center', margin: 0,
    })
    s.addText(p.desc, {
      x: x + 0.1, y: 3.9, w: 1.9, h: 1.0,
      fontSize: 11, color: C.cinza, fontFace: 'Calibri', align: 'center', margin: 0,
    })
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — FUNCIONALIDADES
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.cinzaClaro }

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.preto } })
  s.addText('FUNCIONALIDADES', {
    x: 0.5, y: 0, w: 9, h: 1.1,
    fontSize: 11, bold: true, color: C.dourado, fontFace: 'Calibri', charSpacing: 4, valign: 'middle', margin: 0,
  })
  s.addText('Tudo que você precisa em um só lugar', {
    x: 0.5, y: 1.25, w: 9, h: 0.55,
    fontSize: 22, bold: true, color: C.preto, fontFace: 'Georgia', margin: 0,
  })

  const features = [
    { emoji: '🤖', titulo: 'IA com Claude Vision', desc: 'Descreve ambientes e identifica condições automaticamente' },
    { emoji: '📱', titulo: 'Mobile-first', desc: 'Use direto no celular durante a vistoria, sem papel' },
    { emoji: '📄', titulo: 'PDF + Word', desc: 'Laudo profissional exportável em dois formatos' },
    { emoji: '✅', titulo: 'Checklist detalhado', desc: 'Piso, paredes, teto, portas, janelas e muito mais' },
    { emoji: '📷', titulo: 'Câmera integrada', desc: 'Foto diretamente pelo app, sem sair da vistoria' },
    { emoji: '☁️', titulo: 'Nuvem segura', desc: 'Dados protegidos e acessíveis de qualquer dispositivo' },
  ]

  features.forEach((f, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 0.3 + col * 3.2
    const y = 2.05 + row * 1.55

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.0, h: 1.38,
      fill: { color: C.branco }, shadow: mkShadow(),
    })
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.06, h: 1.38, fill: { color: C.dourado } })

    s.addText(f.emoji, { x: x + 0.15, y: y + 0.15, w: 0.5, h: 0.5, fontSize: 22, margin: 0 })
    s.addText(f.titulo, {
      x: x + 0.7, y: y + 0.15, w: 2.2, h: 0.38,
      fontSize: 13, bold: true, color: C.preto, fontFace: 'Georgia', margin: 0,
    })
    s.addText(f.desc, {
      x: x + 0.15, y: y + 0.65, w: 2.75, h: 0.65,
      fontSize: 11, color: C.cinza, fontFace: 'Calibri', margin: 0,
    })
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — PLANOS E PREÇOS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.preto }

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.dourado } })

  s.addText('PLANOS E PREÇOS', {
    x: 0.5, y: 0.35, w: 9, h: 0.45,
    fontSize: 11, bold: true, color: C.dourado, fontFace: 'Calibri', charSpacing: 4, margin: 0,
  })
  s.addText('Escolha o modelo ideal para o seu volume de vistorias', {
    x: 0.5, y: 0.9, w: 9, h: 0.55,
    fontSize: 20, bold: true, color: C.branco, fontFace: 'Georgia', margin: 0,
  })

  // Card: Créditos
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.65, w: 4.2, h: 3.5, fill: { color: '1A1A1A' }, shadow: mkShadow() })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.65, w: 4.2, h: 0.07, fill: { color: C.cinza } })
  s.addText('🎟  Plano Créditos', {
    x: 0.65, y: 1.75, w: 3.9, h: 0.5,
    fontSize: 16, bold: true, color: C.branco, fontFace: 'Georgia', margin: 0,
  })
  s.addText('Pague por vistoria', {
    x: 0.65, y: 2.28, w: 3.9, h: 0.35,
    fontSize: 12, color: C.cinza, fontFace: 'Calibri', margin: 0,
  })

  const itemsCred = [
    '✦  Taxa de setup única',
    '✦  Pacotes de créditos (5, 10, 20, 50)',
    '✦  Ideal para vistoriadores autônomos',
    '✦  Sem mensalidade fixa',
    '✦  Suporte incluso',
  ]
  itemsCred.forEach((item, i) => {
    s.addText(item, {
      x: 0.65, y: 2.75 + i * 0.4, w: 3.9, h: 0.38,
      fontSize: 12, color: 'C0BAB2', fontFace: 'Calibri', margin: 0,
    })
  })

  // Card: Anual (destaque)
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.65, w: 4.4, h: 3.5, fill: { color: C.dourado }, shadow: mkShadow() })
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.65, w: 4.4, h: 0.07, fill: { color: '92700A' } })
  s.addText('⭐  Plano Anual', {
    x: 5.25, y: 1.75, w: 4.1, h: 0.5,
    fontSize: 16, bold: true, color: C.preto, fontFace: 'Georgia', margin: 0,
  })
  s.addText('Assinatura — à vista ou parcelado', {
    x: 5.25, y: 2.28, w: 4.1, h: 0.35,
    fontSize: 12, color: '4A3A00', fontFace: 'Calibri', margin: 0,
  })

  const itemsAnual = [
    '✦  Taxa de setup única',
    '✦  Vistorias ilimitadas',
    '✦  À vista ou parcelado mensal',
    '✦  Ideal para imobiliárias',
    '✦  Suporte prioritário',
  ]
  itemsAnual.forEach((item, i) => {
    s.addText(item, {
      x: 5.25, y: 2.75 + i * 0.4, w: 4.1, h: 0.38,
      fontSize: 12, color: '2A1E00', fontFace: 'Calibri', margin: 0,
    })
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — POR QUE CAH
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.cinzaClaro }

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: C.preto } })
  s.addText('POR QUE ESCOLHER CAH?', {
    x: 0.5, y: 0, w: 9, h: 1.1,
    fontSize: 11, bold: true, color: C.dourado, fontFace: 'Calibri', charSpacing: 4, valign: 'middle', margin: 0,
  })

  // Grande número de destaque
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.2, w: 3.5, h: 4.0, fill: { color: C.preto }, shadow: mkShadow() })
  s.addText('10x', {
    x: 0.4, y: 1.5, w: 3.5, h: 1.5,
    fontSize: 72, bold: true, color: C.dourado, fontFace: 'Georgia', align: 'center', margin: 0,
  })
  s.addText('mais rápido que\no processo manual', {
    x: 0.4, y: 3.1, w: 3.5, h: 1.2,
    fontSize: 16, color: C.branco, fontFace: 'Calibri', align: 'center', margin: 0,
  })

  // Diferenciais
  const difs = [
    { emoji: '🚀', titulo: 'Pronto em minutos', desc: 'Laudo gerado e assinado no mesmo dia da vistoria' },
    { emoji: '🎯', titulo: 'Alta precisão', desc: 'IA treinada para descrever condições de imóveis com detalhes técnicos' },
    { emoji: '🔒', titulo: 'Validade jurídica', desc: 'Laudo com dados completos, assinaturas e prazo de contestação' },
    { emoji: '💼', titulo: 'Imagem profissional', desc: 'Documento no padrão de grandes imobiliárias, com sua marca' },
  ]

  difs.forEach((d, i) => {
    const y = 1.25 + i * 1.0
    s.addShape(pres.shapes.RECTANGLE, { x: 4.2, y, w: 5.4, h: 0.88, fill: { color: C.branco }, shadow: mkShadow() })
    s.addShape(pres.shapes.RECTANGLE, { x: 4.2, y, w: 0.06, h: 0.88, fill: { color: C.dourado } })
    s.addText(d.emoji, { x: 4.3, y: y + 0.18, w: 0.55, h: 0.5, fontSize: 20, margin: 0 })
    s.addText(d.titulo, {
      x: 4.95, y: y + 0.08, w: 4.5, h: 0.35,
      fontSize: 13, bold: true, color: C.preto, fontFace: 'Georgia', margin: 0,
    })
    s.addText(d.desc, {
      x: 4.95, y: y + 0.45, w: 4.5, h: 0.35,
      fontSize: 11, color: C.cinza, fontFace: 'Calibri', margin: 0,
    })
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — PRÓXIMOS PASSOS (CTA)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide()
  s.background = { color: C.preto }

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.dourado } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 4.8, w: 10, h: 0.825, fill: { color: '111111' } })

  s.addText('PRÓXIMOS PASSOS', {
    x: 0.5, y: 0.4, w: 9, h: 0.45,
    fontSize: 11, bold: true, color: C.dourado, fontFace: 'Calibri', charSpacing: 4, margin: 0,
  })
  s.addText('Comece hoje mesmo', {
    x: 0.5, y: 0.95, w: 7, h: 0.8,
    fontSize: 38, bold: true, color: C.branco, fontFace: 'Georgia', margin: 0,
  })

  // 3 passos de ação
  const acoes = [
    { num: '01', texto: 'Entre em contato e conheça os planos disponíveis' },
    { num: '02', texto: 'Configure sua conta e treine em 30 minutos' },
    { num: '03', texto: 'Faça sua primeira vistoria e veja a diferença' },
  ]

  acoes.forEach((a, i) => {
    const y = 2.0 + i * 0.82
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 0.65, h: 0.62, fill: { color: C.dourado } })
    s.addText(a.num, {
      x: 0.5, y, w: 0.65, h: 0.62,
      fontSize: 15, bold: true, color: C.preto, fontFace: 'Georgia', align: 'center', valign: 'middle', margin: 0,
    })
    s.addText(a.texto, {
      x: 1.35, y: y + 0.08, w: 8.2, h: 0.46,
      fontSize: 16, color: 'D0CAC0', fontFace: 'Calibri', valign: 'middle', margin: 0,
    })
  })

  // Contato
  s.addText('📧  calah.automacoes@gmail.com', {
    x: 0.5, y: 4.85, w: 5.0, h: 0.45,
    fontSize: 12, color: C.cinza, fontFace: 'Calibri', valign: 'middle', margin: 0,
  })
  s.addText('🌐  vistoria-facil-dusky.vercel.app', {
    x: 5.5, y: 4.85, w: 4.2, h: 0.45,
    fontSize: 12, color: C.cinza, fontFace: 'Calibri', valign: 'middle', margin: 0,
  })
}

// ── Salvar ─────────────────────────────────────────────────────────────────────
const outPath = 'C:/Users/Ricardo/Desktop/CAH-Vistoria-Facil-Apresentacao.pptx'
pres.writeFile({ fileName: outPath })
  .then(() => console.log('✅ Apresentação salva em:', outPath))
  .catch(e => console.error('❌ Erro:', e.message))

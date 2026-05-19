/**
 * Gerador de Laudo de Vistoria em formato Word (.docx)
 * Usa a biblioteca `docx` (client-side via Packer.toBlob)
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, HeadingLevel,
} from 'docx'
import { supabase } from './supabase'

// ── Constantes A4 ─────────────────────────────────────────────────────────────
const A4_W    = 11906   // DXA (1440 DXA = 1 polegada)
const A4_H    = 16838   // DXA
const MARGEM  = 1000    // ~1,76 cm
const CONT_W  = A4_W - 2 * MARGEM   // 9906 DXA

// ── Cores ─────────────────────────────────────────────────────────────────────
const DOURADO  = 'C9A227'
const ESCURO   = '1A1A1A'
const CINZA    = '7A756C'
const CINZA_CL = 'E4E0D8'
const FUNDO_CL = 'F7F6F3'

// ── Bordas ────────────────────────────────────────────────────────────────────
const borda    = (c = CINZA_CL) => ({ style: BorderStyle.SINGLE, size: 4, color: c })
const bordas   = (c = CINZA_CL) => ({ top: borda(c), bottom: borda(c), left: borda(c), right: borda(c) })
const semBorda = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' })
const semBordas = () => ({ top: semBorda(), bottom: semBorda(), left: semBorda(), right: semBorda() })

// ── Helpers de texto ──────────────────────────────────────────────────────────
const tr = (text, opts = {}) => new TextRun({
  text: text ?? '',
  bold:    opts.bold    || false,
  size:    opts.size    || 20,
  color:   opts.color   || ESCURO,
  font:    'Arial',
  italics: opts.italics || false,
})

function p(children, opts = {}) {
  const kids = Array.isArray(children) ? children : [tr(children, opts)]
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing:   { before: opts.before ?? 0, after: opts.after ?? 100 },
    indent:    opts.indent ? { left: opts.indent } : undefined,
    border:    opts.bordaInferior
      ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: DOURADO, space: 4 } }
      : undefined,
    children: kids,
  })
}

function tituloSecao(texto) {
  return new Paragraph({
    spacing: { before: 260, after: 120 },
    border:  { bottom: { style: BorderStyle.SINGLE, size: 4, color: DOURADO, space: 4 } },
    children: [tr(texto, { bold: true, size: 24, color: ESCURO })],
  })
}

function celula(texto, opts = {}) {
  const largura = opts.w ?? Math.floor(CONT_W / 2)
  return new TableCell({
    borders:       bordas(opts.borderColor ?? CINZA_CL),
    shading:       opts.fundo ? { fill: opts.fundo, type: ShadingType.CLEAR } : undefined,
    width:         { size: largura, type: WidthType.DXA },
    margins:       { top: 80, bottom: 80, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    columnSpan:    opts.span,
    children: [new Paragraph({
      children: [
        ...(opts.label ? [tr(opts.label + ': ', { bold: true, size: 18, color: CINZA })] : []),
        tr(texto || '—', { bold: opts.bold, size: 20, color: ESCURO }),
      ],
    })],
  })
}

// ── Busca imagem como Uint8Array (para o ImageRun do docx) ───────────────────
async function fetchBuffer(url) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return new Uint8Array(arrayBuffer)  // docx exige Uint8Array no browser
  } catch { return null }
}

// ── Formata data ISO → dd/mm/aaaa ─────────────────────────────────────────────
function fmtData(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

// ── Gerador principal ─────────────────────────────────────────────────────────
export async function gerarDOCX(nomeArquivo, { vistoria, imovel, pessoas, testemunhas, comodos, medidores }) {
  let _etapa = 'início'
  try {

  const proprietarios = (pessoas || []).filter((pe) => pe.papel === 'proprietario')
  const inquilinos    = (pessoas || []).filter((pe) => pe.papel === 'inquilino')
  const testemunhasList = testemunhas || []

  const COND_COR    = { bom: '27AE60', regular: 'E67E22', ruim: 'E74C3C' }
  const COND_FUNDO  = { bom: 'EBF8F0', regular: 'FDF3E0', ruim: 'FDECEA' }
  const COND_LABEL  = { bom: 'BOM', regular: 'REGULAR', ruim: 'RUIM' }

  const conteudo = []

  // ── TÍTULO ──────────────────────────────────────────────────────────────────
  _etapa = 'título'
  conteudo.push(
    p([tr('LAUDO DE VISTORIA IMOBILIÁRIA', { bold: true, size: 36, color: ESCURO })],
      { align: AlignmentType.CENTER, after: 60 }),
    p([tr(`Vistoria de ${vistoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}`,
          { bold: true, size: 28, color: DOURADO })],
      { align: AlignmentType.CENTER, bordaInferior: true, after: 200 }),
  )

  // ── DADOS DA VISTORIA ────────────────────────────────────────────────────────
  _etapa = 'dados da vistoria'
  conteudo.push(tituloSecao('Dados da Vistoria'))
  conteudo.push(
    new Table({
      width: { size: CONT_W, type: WidthType.DXA },
      columnWidths: [Math.floor(CONT_W / 2), Math.ceil(CONT_W / 2)],
      rows: [
        new TableRow({ children: [
          celula(vistoria.tipo === 'entrada' ? 'Entrada' : 'Saída', { label: 'Tipo', w: Math.floor(CONT_W / 2) }),
          celula(fmtData(vistoria.data_vistoria),                     { label: 'Data', w: Math.ceil(CONT_W / 2) }),
        ]}),
        new TableRow({ children: [
          celula(vistoria.vistoriador || '—',     { label: 'Vistoriador',  w: Math.floor(CONT_W / 2) }),
          celula(vistoria.numero_contrato || '—', { label: 'Contrato nº',  w: Math.ceil(CONT_W / 2) }),
        ]}),
        ...(vistoria.valor_aluguel ? [new TableRow({ children: [
          celula(
            `R$ ${parseFloat(vistoria.valor_aluguel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            { label: 'Valor Aluguel', w: Math.floor(CONT_W / 2) }
          ),
          celula(`${vistoria.prazo_contestacao || 7} dias`, { label: 'Prazo Contestação', w: Math.ceil(CONT_W / 2) }),
        ]})] : []),
      ],
    }),
    p('', { after: 100 }),
  )

  // ── IMÓVEL ───────────────────────────────────────────────────────────────────
  _etapa = 'imóvel'
  if (imovel) {
    const endereco    = [imovel.logradouro, imovel.numero, imovel.complemento].filter(Boolean).join(', ')
    const cidadeEstado = [imovel.cidade, imovel.estado].filter(Boolean).join('/')

    conteudo.push(tituloSecao('Imóvel'))
    conteudo.push(
      new Table({
        width: { size: CONT_W, type: WidthType.DXA },
        columnWidths: [Math.floor(CONT_W * 0.65), Math.ceil(CONT_W * 0.35)],
        rows: [
          new TableRow({ children: [
            celula(endereco || '—', { label: 'Endereço', w: Math.floor(CONT_W * 0.65) }),
            celula(imovel.cep || '—', { label: 'CEP', w: Math.ceil(CONT_W * 0.35) }),
          ]}),
          new TableRow({ children: [
            celula([imovel.bairro, cidadeEstado].filter(Boolean).join(' — ') || '—',
              { label: 'Bairro/Cidade', w: Math.floor(CONT_W * 0.65) }),
            celula(imovel.tipo_imovel || '—', { label: 'Tipo', w: Math.ceil(CONT_W * 0.35) }),
          ]}),
          new TableRow({ children: [
            celula(imovel.area_m2 ? `${imovel.area_m2} m²` : '—',
              { label: 'Área', w: Math.floor(CONT_W * 0.65) }),
            celula(imovel.mobiliado ? 'Sim' : 'Não', { label: 'Mobiliado', w: Math.ceil(CONT_W * 0.35) }),
          ]}),
        ],
      }),
      p('', { after: 100 }),
    )
  }

  // ── ENVOLVIDOS ───────────────────────────────────────────────────────────────
  _etapa = 'envolvidos'
  if (pessoas?.length) {
    conteudo.push(tituloSecao('Envolvidos'))

    const blocosPessoas = []
    if (proprietarios.length) {
      blocosPessoas.push(new TableRow({ children: [
        new TableCell({
          columnSpan: 2,
          borders: bordas(CINZA_CL),
          shading: { fill: FUNDO_CL, type: ShadingType.CLEAR },
          width: { size: CONT_W, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 140, right: 140 },
          children: [p([tr('Proprietário(s)', { bold: true, size: 18, color: CINZA })])],
        }),
      ]}))
      proprietarios.forEach((pe) => blocosPessoas.push(new TableRow({ children: [
        celula(pe.nome || '—', { label: 'Nome', w: Math.floor(CONT_W / 2) }),
        celula(
          [pe.cpf && `CPF: ${pe.cpf}`, pe.rg && `RG: ${pe.rg}`].filter(Boolean).join(' · ') || '—',
          { w: Math.ceil(CONT_W / 2) }
        ),
      ]})))
    }
    if (inquilinos.length) {
      blocosPessoas.push(new TableRow({ children: [
        new TableCell({
          columnSpan: 2,
          borders: bordas(CINZA_CL),
          shading: { fill: FUNDO_CL, type: ShadingType.CLEAR },
          width: { size: CONT_W, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 140, right: 140 },
          children: [p([tr('Inquilino(s)', { bold: true, size: 18, color: CINZA })])],
        }),
      ]}))
      inquilinos.forEach((pe) => blocosPessoas.push(new TableRow({ children: [
        celula(pe.nome || '—', { label: 'Nome', w: Math.floor(CONT_W / 2) }),
        celula(
          [pe.cpf && `CPF: ${pe.cpf}`, pe.rg && `RG: ${pe.rg}`].filter(Boolean).join(' · ') || '—',
          { w: Math.ceil(CONT_W / 2) }
        ),
      ]})))
    }
    if (testemunhasList.length) {
      blocosPessoas.push(new TableRow({ children: [
        new TableCell({
          columnSpan: 2,
          borders: bordas(CINZA_CL),
          shading: { fill: FUNDO_CL, type: ShadingType.CLEAR },
          width: { size: CONT_W, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 140, right: 140 },
          children: [p([tr('Testemunha(s)', { bold: true, size: 18, color: CINZA })])],
        }),
      ]}))
      testemunhasList.forEach((te) => blocosPessoas.push(new TableRow({ children: [
        celula(te.nome || '—', { label: 'Nome', w: Math.floor(CONT_W / 2) }),
        celula(te.cpf ? `CPF: ${te.cpf}` : '—', { w: Math.ceil(CONT_W / 2) }),
      ]})))
    }

    conteudo.push(
      new Table({
        width: { size: CONT_W, type: WidthType.DXA },
        columnWidths: [Math.floor(CONT_W / 2), Math.ceil(CONT_W / 2)],
        rows: blocosPessoas,
      }),
      p('', { after: 100 }),
    )
  }

  // ── CÔMODOS ──────────────────────────────────────────────────────────────────
  _etapa = 'cômodos'
  for (const comodo of (comodos || [])) {
    conteudo.push(tituloSecao(comodo.nome))

    // Checklist de condições
    const itensComCond = (comodo.itens || []).filter((it) => it.condicao)
    if (itensComCond.length) {
      const colItem = Math.floor(CONT_W * 0.55)
      const colCond = Math.floor(CONT_W * 0.20)
      const colObs  = CONT_W - colItem - colCond

      conteudo.push(
        new Table({
          width: { size: CONT_W, type: WidthType.DXA },
          columnWidths: [colItem, colCond, colObs],
          rows: [
            // Cabeçalho da tabela
            new TableRow({ children: [
              new TableCell({
                borders: bordas(ESCURO),
                shading: { fill: ESCURO, type: ShadingType.CLEAR },
                width: { size: colItem, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 120, right: 60 },
                children: [p([tr('Elemento', { bold: true, size: 18, color: 'FFFFFF' })])],
              }),
              new TableCell({
                borders: bordas(ESCURO),
                shading: { fill: ESCURO, type: ShadingType.CLEAR },
                width: { size: colCond, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                children: [p([tr('Condição', { bold: true, size: 18, color: 'FFFFFF' })], { align: AlignmentType.CENTER })],
              }),
              new TableCell({
                borders: bordas(ESCURO),
                shading: { fill: ESCURO, type: ShadingType.CLEAR },
                width: { size: colObs, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 60, right: 120 },
                children: [p([tr('Observação', { bold: true, size: 18, color: 'FFFFFF' })])],
              }),
            ], tableHeader: true }),
            // Linhas de itens
            ...itensComCond.map((item) => new TableRow({ children: [
              new TableCell({
                borders: bordas(),
                width: { size: colItem, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 120, right: 60 },
                children: [p([tr(item.nome, { size: 18 })])],
              }),
              new TableCell({
                borders: bordas(),
                shading: item.condicao ? { fill: COND_FUNDO[item.condicao], type: ShadingType.CLEAR } : undefined,
                width: { size: colCond, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                verticalAlign: VerticalAlign.CENTER,
                children: [p(
                  [tr(item.condicao ? COND_LABEL[item.condicao] : '—', {
                    bold: true, size: 18,
                    color: item.condicao ? COND_COR[item.condicao] : CINZA,
                  })],
                  { align: AlignmentType.CENTER },
                )],
              }),
              new TableCell({
                borders: bordas(),
                width: { size: colObs, type: WidthType.DXA },
                margins: { top: 60, bottom: 60, left: 60, right: 120 },
                children: [p([tr(item.obs || '—', { size: 18, color: CINZA, italics: !item.obs })])],
              }),
            ]})),
          ],
        }),
        p('', { after: 80 }),
      )
    }

    // Fotos do cômodo
    if (comodo.fotos?.length) {
      for (const foto of comodo.fotos) {
        const url = foto.url_publica || foto.url
        const descricao = foto.descricao_editada || foto.descricao_ia || '—'

        if (url) {
          const buffer = await fetchBuffer(url)
          if (buffer && buffer.byteLength > 0) {
            // Detecta tipo pela extensão ou assume jpeg
            const urlLower = url.toLowerCase()
            const tipo = urlLower.includes('.png') ? 'png'
              : urlLower.includes('.gif') ? 'gif'
              : 'jpg'
            try {
              conteudo.push(
                new Paragraph({
                  spacing: { before: 80, after: 40 },
                  children: [new ImageRun({
                    type: tipo,
                    data: buffer,
                    transformation: { width: 420, height: 260 },
                    altText: { title: 'Foto', description: descricao, name: 'foto' },
                  })],
                }),
              )
            } catch {
              // Se a imagem falhar, registra texto no lugar
              conteudo.push(p(`[Foto não pôde ser incluída]`, { size: 18, color: CINZA, italics: true }))
            }
          } else {
            conteudo.push(p(`[Foto indisponível]`, { size: 18, color: CINZA, italics: true }))
          }
        }

        conteudo.push(
          p([tr(descricao, { size: 18, color: CINZA, italics: true })], { after: 120 }),
        )
      }
    }

    conteudo.push(p('', { after: 60 }))
  }

  // ── MEDIDORES ─────────────────────────────────────────────────────────────────
  _etapa = 'medidores'
  if (medidores) {
    const pares = [
      medidores.agua  !== undefined && ['Água (m³)',  medidores.agua],
      medidores.luz   !== undefined && ['Luz (kWh)',  medidores.luz],
      medidores.gas   !== undefined && ['Gás (m³)',   medidores.gas],
      medidores.chaves !== undefined && ['Chaves',    medidores.chaves],
    ].filter(Boolean)

    if (pares.length) {
      const pares2 = []
      for (let i = 0; i < pares.length; i += 2) pares2.push(pares.slice(i, i + 2))

      conteudo.push(tituloSecao('Medidores e Chaves'))
      conteudo.push(
        new Table({
          width: { size: CONT_W, type: WidthType.DXA },
          columnWidths: [Math.floor(CONT_W / 2), Math.ceil(CONT_W / 2)],
          rows: pares2.map((par) => new TableRow({ children: [
            celula(par[0][1] || '—', { label: par[0][0], w: Math.floor(CONT_W / 2) }),
            par[1]
              ? celula(par[1][1] || '—', { label: par[1][0], w: Math.ceil(CONT_W / 2) })
              : new TableCell({
                  borders: bordas(),
                  width: { size: Math.ceil(CONT_W / 2), type: WidthType.DXA },
                  children: [p('')],
                }),
          ]})),
        }),
        p('', { after: 100 }),
      )
    }
  }

  // ── OBSERVAÇÕES GERAIS ────────────────────────────────────────────────────────
  if (vistoria.observacoes) {
    conteudo.push(tituloSecao('Observações Gerais'))
    conteudo.push(
      new Paragraph({
        spacing: { before: 80, after: 160 },
        children: [tr(vistoria.observacoes, { size: 20 })],
      }),
    )
  }

  if (vistoria.itens_nao_vistoriados) {
    conteudo.push(tituloSecao('Itens Não Vistoriados'))
    conteudo.push(
      new Paragraph({
        spacing: { before: 80, after: 160 },
        children: [tr(vistoria.itens_nao_vistoriados, { size: 20 })],
      }),
    )
  }

  // ── ASSINATURAS ───────────────────────────────────────────────────────────────
  _etapa = 'assinaturas'
  conteudo.push(
    p('', { before: 300 }),
    tituloSecao('Assinaturas'),
  )

  const assinantes = [
    ...proprietarios.map((pe) => ({ tipo: 'Proprietário(a)', nome: pe.nome, cpf: pe.cpf })),
    ...inquilinos.map((pe)    => ({ tipo: 'Inquilino(a)',    nome: pe.nome, cpf: pe.cpf })),
    { tipo: 'Vistoriador(a)', nome: vistoria.vistoriador, cpf: null },
    ...testemunhasList.map((t) => ({ tipo: 'Testemunha', nome: t.nome, cpf: t.cpf })),
  ]

  const pares2 = []
  for (let i = 0; i < assinantes.length; i += 2) pares2.push(assinantes.slice(i, i + 2))

  pares2.forEach((par) => {
    conteudo.push(
      new Table({
        width: { size: CONT_W, type: WidthType.DXA },
        columnWidths: [Math.floor(CONT_W / 2), Math.ceil(CONT_W / 2)],
        rows: [new TableRow({ children: par.map((ass, idx) => new TableCell({
          borders: semBordas(),
          width: { size: idx === 0 ? Math.floor(CONT_W / 2) : Math.ceil(CONT_W / 2), type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [
            new Paragraph({
              spacing: { before: 600, after: 80 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999', space: 4 } },
              children: [],
            }),
            p([tr(ass.tipo,  { size: 16, color: CINZA, bold: true })],  { after: 20, align: AlignmentType.CENTER }),
            p([tr(ass.nome || '', { size: 18, bold: true })],            { after: 20, align: AlignmentType.CENTER }),
            ...(ass.cpf ? [p([tr(`CPF: ${ass.cpf}`, { size: 16, color: CINZA })], { align: AlignmentType.CENTER })] : []),
          ],
        })) })],
      }),
      p('', { after: 100 }),
    )
  })

  // ── MONTAR DOCUMENTO ─────────────────────────────────────────────────────────
  _etapa = 'montar documento'
  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: A4_W, height: A4_H },
          margin: { top: MARGEM, right: MARGEM, bottom: MARGEM, left: MARGEM },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: DOURADO, space: 4 } },
            spacing: { before: 0, after: 120 },
            children: [
              tr('CAH Vistoria Fácil', { bold: true, size: 18, color: DOURADO }),
              tr('  |  Laudo de Vistoria Imobiliária', { size: 18, color: CINZA }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: CINZA_CL, space: 4 } },
            spacing: { before: 80, after: 0 },
            children: [
              tr(`Gerado em ${agora}  |  Página `, { size: 16, color: CINZA }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: CINZA, font: 'Arial' }),
              tr(' de ', { size: 16, color: CINZA }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: CINZA, font: 'Arial' }),
            ],
          })],
        }),
      },
      children: conteudo,
    }],
  })

  _etapa = 'Packer.toBlob'
  return await Packer.toBlob(doc)

  } catch (err) {
    throw new Error(`Falha na etapa "${_etapa}": ${err?.message || err}`)
  }
}

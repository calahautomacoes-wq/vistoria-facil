import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gerarPDF } from '../lib/gerarPDF'
import { gerarDOCX } from '../lib/gerarDOCX'
import PDFTemplate from '../components/PDFTemplate'
import { BYPASS_PAGAMENTO } from '../config'
import {
  ChevronLeft, Download, FileText, MapPin, Users,
  Droplets, Zap, Flame, Key, Camera, CheckCircle, Clock,
  Share2, Mail, MessageCircle, Pencil, Check, X, FileDown,
} from 'lucide-react'

export default function Vistoria() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vistoria,      setVistoria]      = useState(null)
  const [imovel,        setImovel]        = useState(null)
  const [pessoas,       setPessoas]       = useState([])
  const [testemunhas,   setTestemunhas]   = useState([])
  const [comodos,       setComodos]       = useState([])
  const [medidores,     setMedidores]     = useState(null)
  const [pagamento,     setPagamento]     = useState(null)
  const [carregando,    setCarregando]    = useState(true)
  const [gerandoPDF,    setGerandoPDF]    = useState(false)
  const [gerandoDOCX,   setGerandoDOCX]   = useState(false)
  const [pdfBlob,       setPdfBlob]       = useState(null)
  const [pdfNome,       setPdfNome]       = useState('')
  const [compartilhando, setCompartilhando] = useState(false)

  useEffect(() => { carregar() }, [id])

  async function carregar() {
    setCarregando(true)
    const [
      { data: v  },
      { data: im },
      { data: ps },
      { data: ts },
      { data: cs },
      { data: med },
      { data: pag },
    ] = await Promise.all([
      supabase.from('vistorias').select('*').eq('id', id).single(),
      supabase.from('imoveis').select('*').eq('vistoria_id', id).maybeSingle(),
      supabase.from('pessoas').select('*').eq('vistoria_id', id).order('ordem'),
      supabase.from('testemunhas').select('*').eq('vistoria_id', id).order('ordem'),
      supabase.from('comodos').select('*, fotos(*)').eq('vistoria_id', id).order('ordem'),
      supabase.from('medidores').select('*').eq('vistoria_id', id).maybeSingle(),
      supabase.from('pagamentos').select('*').eq('vistoria_id', id).maybeSingle(),
    ])

    const comodosComUrls = await Promise.all(
      (cs || []).map(async (c) => {
        const fotosComUrl = await Promise.all(
          (c.fotos || []).map(async (f) => {
            const { data } = await supabase.storage
              .from('fotos-vistoria')
              .createSignedUrl(f.url, 3600)
            return { ...f, url_publica: data?.signedUrl || '' }
          })
        )
        return { ...c, fotos: fotosComUrl }
      })
    )

    setVistoria(v)
    setImovel(im)
    setPessoas(ps || [])
    setTestemunhas(ts || [])
    setComodos(comodosComUrls)
    setMedidores(med)
    setPagamento(pag)
    setCarregando(false)
  }

  // ── Funções de salvar edições ────────────────────────────────────────────────

  async function salvarDescricaoFoto(comodoId, fotoId, novaDesc) {
    await supabase.from('fotos').update({ descricao_editada: novaDesc }).eq('id', fotoId)
    setComodos((prev) => prev.map((c) =>
      c.id !== comodoId ? c : {
        ...c,
        fotos: c.fotos.map((f) => f.id !== fotoId ? f : { ...f, descricao_editada: novaDesc })
      }
    ))
  }

  async function salvarNomeComodo(comodoId, novoNome) {
    await supabase.from('comodos').update({ nome: novoNome }).eq('id', comodoId)
    setComodos((prev) => prev.map((c) => c.id === comodoId ? { ...c, nome: novoNome } : c))
  }

  async function salvarMedidor(campo, valor) {
    if (!medidores?.id) return
    await supabase.from('medidores').update({ [campo]: valor }).eq('id', medidores.id)
    setMedidores((prev) => ({ ...prev, [campo]: valor }))
  }

  async function salvarObservacoes(obs) {
    await supabase.from('vistorias').update({ observacoes: obs }).eq('id', id)
    setVistoria((prev) => ({ ...prev, observacoes: obs }))
  }

  async function salvarItensNaoVistoriados(v) {
    await supabase.from('vistorias').update({ itens_nao_vistoriados: v }).eq('id', id)
    setVistoria((prev) => ({ ...prev, itens_nao_vistoriados: v }))
  }

  async function salvarCampoVistoria(campo, valor) {
    await supabase.from('vistorias').update({ [campo]: valor }).eq('id', id)
    setVistoria((prev) => ({ ...prev, [campo]: valor }))
  }

  async function salvarImovel(campo, valor) {
    if (!imovel?.id) return
    await supabase.from('imoveis').update({ [campo]: valor }).eq('id', imovel.id)
    setImovel((prev) => ({ ...prev, [campo]: valor }))
  }

  async function salvarPessoa(pessoaId, campo, valor) {
    await supabase.from('pessoas').update({ [campo]: valor }).eq('id', pessoaId)
    setPessoas((prev) => prev.map((p) => p.id === pessoaId ? { ...p, [campo]: valor } : p))
  }

  async function salvarItemComodo(comodoId, itemId, dados) {
    const comodo = comodos.find((c) => c.id === comodoId)
    if (!comodo) return
    const novosItens = comodo.itens.map((it) => it.id === itemId ? { ...it, ...dados } : it)
    await supabase.from('comodos').update({ itens: novosItens }).eq('id', comodoId)
    setComodos((prev) => prev.map((c) =>
      c.id === comodoId ? { ...c, itens: novosItens } : c
    ))
  }

  // ── PDF / DOCX ────────────────────────────────────────────────────────────────

  async function handleGerarPDF() {
    setGerandoPDF(true)
    try {
      const nome = `laudo-vistoria-${imovel?.cidade || 'imovel'}-${vistoria?.data_vistoria || 'sem-data'}`
      const blob = await gerarPDF(nome, true)
      setPdfBlob(blob)
      setPdfNome(nome)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${nome}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
    setGerandoPDF(false)
  }

  async function handleGerarDOCX() {
    setGerandoDOCX(true)
    try {
      const nome = `laudo-vistoria-${imovel?.cidade || 'imovel'}-${vistoria?.data_vistoria || 'sem-data'}`
      const blob = await gerarDOCX(nome, { vistoria, imovel, pessoas, testemunhas, comodos, medidores })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${nome}.docx`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro DOCX:', err)
      alert(`Erro ao gerar Word:\n${err?.message || err}`)
    }
    setGerandoDOCX(false)
  }

  async function handleCompartilhar() {
    if (!pdfBlob) { await handleGerarPDF(); return }
    const arquivo = new File([pdfBlob], `${pdfNome}.pdf`, { type: 'application/pdf' })
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: 'Laudo de Vistoria', text: 'Segue o laudo de vistoria imobiliária.' })
      } catch { /* cancelado */ }
    } else {
      setCompartilhando(true)
    }
  }

  async function abrirWhatsApp() {
    // Garante que o PDF existe
    let blob = pdfBlob
    let nome = pdfNome
    if (!blob) {
      setGerandoPDF(true)
      try {
        nome = `laudo-vistoria-${imovel?.cidade || 'imovel'}-${vistoria?.data_vistoria || 'sem-data'}`
        blob = await gerarPDF(nome, true)
        setPdfBlob(blob)
        setPdfNome(nome)
      } catch { setGerandoPDF(false); return }
      setGerandoPDF(false)
    }

    const arquivo = new File([blob], `${nome || 'laudo-vistoria'}.pdf`, { type: 'application/pdf' })

    // Mobile: usa Web Share API com arquivo → abre menu nativo e usuário escolhe WhatsApp
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({
          files: [arquivo],
          title: 'Laudo de Vistoria',
          text: `Laudo de vistoria — ${imovel?.logradouro || ''}, ${imovel?.cidade || ''}`,
        })
      } catch { /* cancelado pelo usuário */ }
      return
    }

    // Desktop fallback: baixa o PDF + abre WhatsApp com texto
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${nome || 'laudo-vistoria'}.pdf`; a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => {
      const texto = encodeURIComponent(`Olá! Segue o laudo de vistoria do imóvel em ${imovel?.logradouro || ''}, ${imovel?.cidade || ''}. O PDF foi baixado no seu dispositivo — anexe-o na conversa.`)
      window.open(`https://wa.me/?text=${texto}`, '_blank')
    }, 800)
  }

  function abrirEmail() {
    const assunto = encodeURIComponent('Laudo de Vistoria Imobiliária')
    const corpo   = encodeURIComponent(`Olá,\n\nSegue em anexo o laudo de vistoria do imóvel em ${imovel?.logradouro || ''}, ${imovel?.cidade || ''}.\n\nGerado pelo CAH Vistoria Fácil.\n\nAtenciosamente.`)
    window.open(`mailto:?subject=${assunto}&body=${corpo}`, '_blank')
  }

  async function handlePagar() {
    const { data: pag } = await supabase.from('pagamentos').insert({ vistoria_id: id, status: 'pendente', valor: 29.99 }).select().single()
    await supabase.from('pagamentos').update({ status: 'aprovado' }).eq('id', pag.id)
    await supabase.from('vistorias').update({ status: 'concluido' }).eq('id', id)
    await carregar()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Carregando laudo...</p>
    </div>
  )

  if (!vistoria) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Vistoria não encontrada.</p>
    </div>
  )

  const concluido      = BYPASS_PAGAMENTO || pagamento?.status === 'aprovado' || vistoria.status === 'concluido'
  const proprietarios  = pessoas.filter((p) => p.papel === 'proprietario')
  const inquilinos     = pessoas.filter((p) => p.papel === 'inquilino')
  const totalFotos     = comodos.reduce((acc, c) => acc + (c.fotos?.length || 0), 0)

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F3' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={20} />
            <span className="text-sm">Voltar</span>
          </button>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${concluido ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {concluido ? '✓ Concluído' : 'Rascunho'}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Título */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Vistoria de {vistoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}
          </h1>
          {imovel && (
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <MapPin size={14} />
              {imovel.logradouro}, {imovel.numero} — {imovel.cidade}/{imovel.estado}
            </p>
          )}
        </div>

        {/* Dados gerais — editáveis */}
        <Card titulo="Dados Gerais">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">Vistoriador</p>
              <CampoEditavel valor={vistoria.vistoriador || ''} tipo="input"
                placeholder="Nome do vistoriador"
                onSalvar={(v) => salvarCampoVistoria('vistoriador', v)}
                className="text-sm text-gray-800 w-full" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Data</p>
              <CampoEditavel valor={vistoria.data_vistoria || ''} tipo="input"
                placeholder="aaaa-mm-dd"
                onSalvar={(v) => salvarCampoVistoria('data_vistoria', v)}
                className="text-sm text-gray-800 w-full" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Nº Contrato</p>
              <CampoEditavel valor={vistoria.numero_contrato || ''} tipo="input"
                placeholder="—"
                onSalvar={(v) => salvarCampoVistoria('numero_contrato', v)}
                className="text-sm text-gray-800 w-full" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Prazo contestação</p>
              <CampoEditavel valor={vistoria.prazo_contestacao ? String(vistoria.prazo_contestacao) : '7'} tipo="input"
                placeholder="7"
                onSalvar={(v) => salvarCampoVistoria('prazo_contestacao', parseInt(v) || 7)}
                className="text-sm text-gray-800 w-full" />
            </div>
          </div>
        </Card>

        {/* Imóvel — editável */}
        {imovel && (
          <Card titulo="Imóvel">
            <div className="space-y-2">
              {[
                { label: 'Logradouro', campo: 'logradouro' },
                { label: 'Número',     campo: 'numero' },
                { label: 'Complemento', campo: 'complemento' },
                { label: 'Bairro',     campo: 'bairro' },
                { label: 'Cidade',     campo: 'cidade' },
                { label: 'CEP',        campo: 'cep' },
                { label: 'Tipo',       campo: 'tipo_imovel' },
                { label: 'Área (m²)',  campo: 'area_m2' },
              ].map(({ label, campo }) => (
                <div key={campo} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
                  <CampoEditavel valor={imovel[campo] || ''} tipo="input"
                    placeholder="—"
                    onSalvar={(v) => salvarImovel(campo, v)}
                    className="text-sm text-gray-800 flex-1" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <ResumoCard icon={<Users size={18} className="text-blue-500" />}  label="Pessoas"  valor={pessoas.length} />
          <ResumoCard icon={<FileText size={18} className="text-purple-500" />} label="Cômodos" valor={comodos.length} />
          <ResumoCard icon={<Camera size={18} className="text-green-500" />} label="Fotos"    valor={totalFotos} />
        </div>

        {/* Envolvidos — editáveis */}
        {pessoas.length > 0 && (
          <Card titulo="Envolvidos">
            <div className="space-y-4">
              {proprietarios.map((pe, i) => (
                <PessoaEditavel key={pe.id || i} papel="Proprietário" pessoa={pe} onSalvar={salvarPessoa} />
              ))}
              {inquilinos.map((pe, i) => (
                <PessoaEditavel key={pe.id || i} papel="Inquilino" pessoa={pe} onSalvar={salvarPessoa} />
              ))}
            </div>
          </Card>
        )}

        {/* Cômodos — editáveis */}
        {comodos.length > 0 && comodos.map((c) => (
          <Card key={c.id} titulo={
            <CampoEditavel valor={c.nome} onSalvar={(v) => salvarNomeComodo(c.id, v)}
              tipo="input" className="font-semibold text-sm text-gray-800" />
          }>
            {/* Checklist de condições */}
            {c.itens?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Checklist</p>
                <div className="space-y-1.5">
                  {c.itens.map((item) => (
                    <ItemCondicao key={item.id} item={item}
                      onSalvar={(dados) => salvarItemComodo(c.id, item.id, dados)} />
                  ))}
                </div>
              </div>
            )}

            {/* Fotos */}
            {c.fotos?.length > 0 ? (
              <div className="space-y-3">
                {c.fotos.map((f, fi) => (
                  <div key={f.id} className="rounded-xl overflow-hidden bg-white" style={{ border: '1px solid #E4E0D8' }}>
                    <div className="relative">
                      <img src={f.url_publica} alt="foto" className="w-full h-44 object-cover" />
                      <span className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                        Foto {fi + 1}
                      </span>
                    </div>
                    <div className="px-3 py-2.5">
                      <CampoEditavel valor={f.descricao_editada || f.descricao_ia || ''}
                        placeholder="Adicionar descrição..."
                        onSalvar={(v) => salvarDescricaoFoto(c.id, f.id, v)}
                        tipo="textarea" rows={3}
                        className="text-xs text-gray-600 leading-relaxed w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Sem fotos</p>
            )}
          </Card>
        ))}

        {/* Medidores — editáveis */}
        {medidores && (
          <Card titulo="Medidores">
            <div className="grid grid-cols-2 gap-2">
              {medidores.agua   !== undefined && (
                <MedidorEditavel icon={<Droplets size={14} className="text-blue-400" />}  label="Água (m³)"  campo="agua"  valor={medidores.agua}  onSalvar={salvarMedidor} />
              )}
              {medidores.luz    !== undefined && (
                <MedidorEditavel icon={<Zap size={14} className="text-yellow-400" />}     label="Luz (kWh)"  campo="luz"   valor={medidores.luz}   onSalvar={salvarMedidor} />
              )}
              {medidores.gas    !== undefined && (
                <MedidorEditavel icon={<Flame size={14} className="text-orange-400" />}   label="Gás (m³)"   campo="gas"   valor={medidores.gas}   onSalvar={salvarMedidor} />
              )}
              {medidores.chaves !== undefined && (
                <MedidorEditavel icon={<Key size={14} className="text-gray-400" />}       label="Chaves"     campo="chaves" valor={medidores.chaves} onSalvar={salvarMedidor} />
              )}
            </div>
          </Card>
        )}

        {/* Observações gerais — editável */}
        <Card titulo="Observações Gerais">
          <CampoEditavel valor={vistoria.observacoes || ''}
            placeholder="Adicione observações gerais sobre a vistoria..."
            onSalvar={salvarObservacoes}
            tipo="textarea" rows={4}
            className="text-sm text-gray-600 leading-relaxed w-full" />
        </Card>

        {/* Itens não vistoriados — editável */}
        <Card titulo="Itens Não Vistoriados">
          <CampoEditavel valor={vistoria.itens_nao_vistoriados || ''}
            placeholder="Informe itens que não puderam ser vistoriados..."
            onSalvar={salvarItensNaoVistoriados}
            tipo="textarea" rows={3}
            className="text-sm text-gray-600 leading-relaxed w-full" />
        </Card>

        {/* Ação: pagar ou baixar/compartilhar PDF */}
        <div className="pb-6 space-y-3">
          {concluido ? (
            <>
              <div className="flex items-center gap-2 rounded-xl p-4" style={{ background: '#FDF8EC', border: '1px solid #E8C547' }}>
                <CheckCircle size={20} style={{ color: '#C9A227' }} />
                <p className="text-sm font-medium" style={{ color: '#92700A' }}>
                  {pdfBlob ? 'PDF gerado! Compartilhe abaixo.' : 'Laudo disponível para download'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleGerarPDF}
                  disabled={gerandoPDF || gerandoDOCX}
                  className="py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
                  <Download size={18} />
                  {gerandoPDF ? 'Gerando...' : 'Baixar PDF'}
                </button>
                <button
                  onClick={handleGerarDOCX}
                  disabled={gerandoPDF || gerandoDOCX}
                  className="py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                  style={{ background: '#2B579A', color: '#fff' }}>
                  <FileDown size={18} />
                  {gerandoDOCX ? 'Gerando...' : 'Baixar Word'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                  <button onClick={abrirWhatsApp}
                    disabled={gerandoPDF}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                    style={{ background: '#25D366', color: '#fff' }}>
                    <MessageCircle size={18} /> Enviar PDF
                  </button>
                  <button onClick={abrirEmail}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                    style={{ background: '#1a73e8', color: '#fff' }}>
                    <Mail size={18} /> E-mail
                  </button>
                </div>
            </>
          ) : (
            <>
              <div className="rounded-xl p-4" style={{ background: '#FDF8EC', border: '1px solid #E8C547' }}>
                <div className="flex items-start gap-3">
                  <Clock size={20} style={{ color: '#C9A227' }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>Laudo pronto para finalizar</p>
                    <p className="text-xs mt-1" style={{ color: '#7A756C' }}>Pague R$ 29,99 para liberar o PDF profissional.</p>
                  </div>
                </div>
              </div>
              <button onClick={handlePagar}
                className="w-full py-3.5 rounded-xl font-bold text-base"
                style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
                Pagar R$ 29,99 e Baixar PDF
              </button>
              <p className="text-center text-xs" style={{ color: '#7A756C' }}>Pagamento seguro via Mercado Pago</p>
            </>
          )}
        </div>
      </main>

      {/* Template PDF oculto */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -999, opacity: 0, pointerEvents: 'none' }}>
        <PDFTemplate vistoria={vistoria} imovel={imovel} pessoas={pessoas}
          testemunhas={testemunhas} comodos={comodos} medidores={medidores} />
      </div>
    </div>
  )
}

// ─── Campo editável inline ────────────────────────────────────────────────────
function CampoEditavel({ valor, onSalvar, tipo = 'textarea', rows = 2, placeholder = '', className = '' }) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(valor)
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    if (rascunho === valor) { setEditando(false); return }
    setSalvando(true)
    await onSalvar(rascunho)
    setSalvando(false)
    setEditando(false)
  }

  function cancelar() {
    setRascunho(valor)
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="relative">
        {tipo === 'textarea' ? (
          <textarea
            autoFocus
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className={`${className} resize-none focus:outline-none rounded-lg px-2 py-1.5`}
            style={{ border: '1.5px solid #C9A227', background: '#FFFBF0', width: '100%' }}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmar()}
            className={`${className} focus:outline-none rounded-lg px-2 py-1`}
            style={{ border: '1.5px solid #C9A227', background: '#FFFBF0', width: '100%' }}
          />
        )}
        <div className="flex gap-1.5 mt-1.5 justify-end">
          <button onClick={cancelar}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
            style={{ background: '#F3F2F0', color: '#7A756C' }}>
            <X size={12} /> Cancelar
          </button>
          <button onClick={confirmar} disabled={salvando}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold disabled:opacity-60"
            style={{ background: '#C9A227', color: '#fff' }}>
            <Check size={12} /> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative flex items-start gap-2">
      <span className={className} style={{ whiteSpace: 'pre-wrap', flex: 1, minWidth: 0 }}>
        {valor || <span className="italic text-gray-400">{placeholder || 'Sem texto'}</span>}
      </span>
      <button
        onClick={() => { setRascunho(valor); setEditando(true) }}
        className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#C9A227', background: '#FDF8EC', border: '1px solid #E8C547' }}
        title="Editar">
        <Pencil size={13} />
      </button>
    </div>
  )
}

// ─── Medidor editável ─────────────────────────────────────────────────────────
function MedidorEditavel({ icon, label, campo, valor, onSalvar }) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(valor || '')

  async function confirmar() {
    await onSalvar(campo, rascunho)
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-1">
        <div className="flex items-center gap-1 mb-1">
          {icon}
          <span className="text-gray-500 text-xs">{label}</span>
        </div>
        <div className="flex gap-1">
          <input autoFocus type="text" value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmar()}
            className="flex-1 text-xs rounded px-1.5 py-1 focus:outline-none"
            style={{ border: '1.5px solid #C9A227', background: '#FFFBF0' }} />
          <button onClick={confirmar}
            className="p-1 rounded" style={{ background: '#C9A227', color: '#fff' }}>
            <Check size={12} />
          </button>
          <button onClick={() => setEditando(false)}
            className="p-1 rounded" style={{ background: '#F3F2F0', color: '#7A756C' }}>
            <X size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
      {icon}
      <span className="text-gray-500 text-xs">{label}:</span>
      <span className="font-medium text-gray-800 text-xs flex-1">{valor || '—'}</span>
      <button onClick={() => { setRascunho(valor || ''); setEditando(true) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
        style={{ color: '#C9A227' }} title="Editar">
        <Pencil size={11} />
      </button>
    </div>
  )
}

// ─── Pessoa editável ──────────────────────────────────────────────────────────
function PessoaEditavel({ papel, pessoa, onSalvar }) {
  return (
    <div className="rounded-lg p-3" style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#C9A227' }}>{papel}</p>
      <div className="space-y-1.5">
        {[
          { label: 'Nome',     campo: 'nome' },
          { label: 'CPF',      campo: 'cpf' },
          { label: 'RG',       campo: 'rg' },
          { label: 'Telefone', campo: 'telefone' },
          { label: 'E-mail',   campo: 'email' },
        ].map(({ label, campo }) => (
          <div key={campo} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
            <CampoEditavel
              valor={pessoa[campo] || ''}
              tipo="input"
              placeholder="—"
              onSalvar={(v) => onSalvar(pessoa.id, campo, v)}
              className="text-sm text-gray-800 flex-1"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Item de checklist com condição editável ──────────────────────────────────
function ItemCondicao({ item, onSalvar }) {
  const COND = {
    bom:     { bg: '#dcfce7', color: '#15803d', label: 'Bom' },
    regular: { bg: '#fef9c3', color: '#a16207', label: 'Regular' },
    ruim:    { bg: '#fee2e2', color: '#b91c1c', label: 'Ruim' },
  }
  const [editandoObs, setEditandoObs] = useState(false)
  const [rascunhoObs, setRascunhoObs] = useState(item.obs || '')
  const [salvando, setSalvando] = useState(false)

  async function mudarCondicao(nova) {
    setSalvando(true)
    await onSalvar({ condicao: nova === item.condicao ? null : nova })
    setSalvando(false)
  }

  async function salvarObs() {
    await onSalvar({ obs: rascunhoObs })
    setEditandoObs(false)
  }

  return (
    <div className="rounded-lg px-3 py-2" style={{ background: '#fff', border: '1px solid #E4E0D8' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-700 flex-1">{item.nome}</span>
        <div className="flex gap-1 items-center shrink-0">
          {salvando ? (
            <span className="text-xs text-gray-400">...</span>
          ) : (
            ['bom', 'regular', 'ruim'].map((c) => (
              <button key={c}
                onClick={() => mudarCondicao(c)}
                className="text-xs px-2 py-0.5 rounded-full font-semibold transition-all"
                style={{
                  background: item.condicao === c ? COND[c].bg : '#F3F2F0',
                  color:      item.condicao === c ? COND[c].color : '#999',
                  border:     item.condicao === c ? `1.5px solid ${COND[c].color}33` : '1.5px solid transparent',
                  opacity:    item.condicao && item.condicao !== c ? 0.5 : 1,
                }}>
                {COND[c].label}
              </button>
            ))
          )}
          <button onClick={() => setEditandoObs(!editandoObs)}
            className="p-1 rounded transition-opacity ml-1"
            style={{ color: '#C9A227' }} title="Observação">
            <Pencil size={11} />
          </button>
        </div>
      </div>
      {editandoObs && (
        <div className="mt-1.5">
          <input type="text" value={rascunhoObs}
            onChange={(e) => setRascunhoObs(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && salvarObs()}
            placeholder="Observação..."
            autoFocus
            className="w-full text-xs rounded px-2 py-1 focus:outline-none"
            style={{ border: '1.5px solid #C9A227', background: '#FFFBF0' }} />
          <div className="flex gap-1 mt-1 justify-end">
            <button onClick={() => setEditandoObs(false)}
              className="text-xs px-2 py-0.5 rounded" style={{ background: '#F3F2F0', color: '#7A756C' }}>
              Cancelar
            </button>
            <button onClick={salvarObs}
              className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: '#C9A227', color: '#fff' }}>
              Salvar
            </button>
          </div>
        </div>
      )}
      {item.obs && !editandoObs && (
        <p className="text-xs text-gray-400 italic mt-1">{item.obs}</p>
      )}
    </div>
  )
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────
function Card({ titulo, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100">{titulo}</div>
      {children}
    </div>
  )
}

function ResumoCard({ icon, label, valor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-gray-900">{valor}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}


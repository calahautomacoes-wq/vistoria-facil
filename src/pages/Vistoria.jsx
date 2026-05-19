import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gerarPDF } from '../lib/gerarPDF'
import PDFTemplate from '../components/PDFTemplate'
import { BYPASS_PAGAMENTO } from '../config'
import {
  ChevronLeft, Download, FileText, MapPin, Users,
  Droplets, Zap, Flame, Key, Camera, CheckCircle, Clock,
  Share2, Mail, MessageCircle, Pencil, Check, X,
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

  // ── PDF ──────────────────────────────────────────────────────────────────────

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

  function abrirWhatsApp() {
    const texto = encodeURIComponent(`Olá! Segue o laudo de vistoria do imóvel em ${imovel?.logradouro || ''}, ${imovel?.cidade || ''}. Por favor, verifique o PDF em anexo.`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
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

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <ResumoCard icon={<Users size={18} className="text-blue-500" />}  label="Pessoas"  valor={pessoas.length} />
          <ResumoCard icon={<FileText size={18} className="text-purple-500" />} label="Cômodos" valor={comodos.length} />
          <ResumoCard icon={<Camera size={18} className="text-green-500" />} label="Fotos"    valor={totalFotos} />
        </div>

        {/* Envolvidos */}
        {pessoas.length > 0 && (
          <Card titulo="Envolvidos">
            <div className="space-y-2">
              {proprietarios.map((p, i) => <PessoaRow key={i} papel="Proprietário" pessoa={p} />)}
              {inquilinos.map((p, i) => <PessoaRow key={i} papel="Inquilino" pessoa={p} />)}
            </div>
          </Card>
        )}

        {/* Cômodos — editáveis */}
        {comodos.length > 0 && (
          <Card titulo="Cômodos e Fotos">
            <div className="space-y-5">
              {comodos.map((c) => (
                <div key={c.id}>
                  {/* Nome do cômodo editável */}
                  <CampoEditavel
                    valor={c.nome}
                    onSalvar={(v) => salvarNomeComodo(c.id, v)}
                    tipo="input"
                    className="font-semibold text-sm text-gray-800 mb-2"
                  />

                  {c.fotos?.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {c.fotos.map((f, fi) => (
                        <div key={f.id} className="rounded-xl overflow-hidden bg-white" style={{ border: '1px solid #E4E0D8' }}>
                          <div className="relative">
                            <img src={f.url_publica} alt="foto" className="w-full h-44 object-cover" />
                            <span className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                              Foto {fi + 1}
                            </span>
                          </div>
                          {/* Descrição editável */}
                          <div className="px-3 py-2.5">
                            <CampoEditavel
                              valor={f.descricao_editada || f.descricao_ia || ''}
                              placeholder="Adicionar descrição..."
                              onSalvar={(v) => salvarDescricaoFoto(c.id, f.id, v)}
                              tipo="textarea"
                              rows={3}
                              className="text-xs text-gray-600 leading-relaxed w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">Sem fotos</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

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
          <CampoEditavel
            valor={vistoria.observacoes || ''}
            placeholder="Adicione observações gerais sobre a vistoria..."
            onSalvar={salvarObservacoes}
            tipo="textarea"
            rows={4}
            className="text-sm text-gray-600 leading-relaxed w-full"
          />
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

              <button
                onClick={handleGerarPDF}
                disabled={gerandoPDF}
                className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
                <Download size={20} />
                {gerandoPDF ? 'Gerando PDF...' : pdfBlob ? 'Baixar PDF novamente' : 'Gerar e Baixar PDF'}
              </button>

              {pdfBlob && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={abrirWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                    style={{ background: '#25D366', color: '#fff' }}>
                    <MessageCircle size={18} /> WhatsApp
                  </button>
                  <button onClick={abrirEmail}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                    style={{ background: '#1a73e8', color: '#fff' }}>
                    <Mail size={18} /> E-mail
                  </button>
                </div>
              )}

              {pdfBlob && typeof navigator.share === 'function' && (
                <button onClick={handleCompartilhar}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                  style={{ border: '1.5px solid #C9A227', color: '#C9A227', background: 'transparent' }}>
                  <Share2 size={18} /> Compartilhar (outros apps)
                </button>
              )}
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

// ─── Helpers visuais ──────────────────────────────────────────────────────────
function Card({ titulo, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100">{titulo}</h3>
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

function PessoaRow({ papel, pessoa }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium shrink-0 mt-0.5">
        {papel}
      </span>
      <div>
        <p className="font-medium text-gray-800">{pessoa.nome}</p>
        <p className="text-xs text-gray-400">
          {[pessoa.cpf && `CPF: ${pessoa.cpf}`, pessoa.rg && `RG: ${pessoa.rg}`].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}

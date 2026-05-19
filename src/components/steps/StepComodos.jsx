import { useRef, useState, useEffect, useCallback } from 'react'
import { useVistoriaStore } from '../../store/vistoriaStore'
import { Plus, Trash2, Camera, Image as ImageIcon, ChevronDown, ChevronUp, Pencil, X, ZoomIn } from 'lucide-react'
import { descreverFoto } from '../../lib/claude'
import { uuid } from '../../lib/uuid'

// ─── Modal de câmera via getUserMedia ─────────────────────────────────────────
function CameraModal({ onCapturar, onFechar }) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [erro, setErro]         = useState('')
  const [pronto, setPronto]     = useState(false)
  const [facingBack, setFacingBack] = useState(true)

  const iniciarCamera = useCallback(async (traseira = true) => {
    // Para stream anterior se existir
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
    setPronto(false)
    setErro('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: traseira ? 'environment' : 'user',
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setPronto(true)
      }
    } catch (err) {
      setErro(
        err.name === 'NotAllowedError'
          ? 'Permissão de câmera negada. Libere o acesso nas configurações do navegador.'
          : `Câmera indisponível: ${err.message}`
      )
    }
  }, [])

  useEffect(() => {
    iniciarCamera(true)
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [iniciarCamera])

  function capturar() {
    if (!videoRef.current || !pronto) return
    const video  = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const arquivo = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapturar(arquivo)
    }, 'image/jpeg', 0.92)
  }

  function alternarCamera() {
    const nova = !facingBack
    setFacingBack(nova)
    iniciarCamera(nova)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Vídeo */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!pronto && !erro && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-sm">Iniciando câmera...</p>
          </div>
        )}
        {erro && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="rounded-xl p-5 text-center" style={{ background: '#1a1a1a' }}>
              <p className="text-red-400 text-sm mb-4">{erro}</p>
              <button onClick={onFechar}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#C9A227', color: '#000' }}>
                Fechar
              </button>
            </div>
          </div>
        )}
        {/* Botão fechar */}
        <button onClick={onFechar}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
          <X size={20} />
        </button>
        {/* Virar câmera (só aparece se tiver câmera frontal/traseira) */}
        <button onClick={alternarCamera}
          className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          title="Alternar câmera">
          🔄
        </button>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-6 py-6" style={{ background: '#0a0a0a' }}>
        <button onClick={onFechar}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#2a2a2a', color: '#fff' }}>
          Cancelar
        </button>
        <button
          onClick={capturar}
          disabled={!pronto}
          className="w-16 h-16 rounded-full flex items-center justify-center transition disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', boxShadow: '0 0 0 4px #C9A22744' }}>
          <Camera size={28} color="#000" />
        </button>
        <div className="w-20" />{/* espaço para equilíbrio */}
      </div>
    </div>
  )
}

const TIPOS_RAPIDOS = [
  'Sala', 'Quarto', 'Suíte', 'Banheiro', 'Lavabo',
  'Cozinha', 'Área de Serviço', 'Garagem', 'Varanda',
  'Fachada', 'Área Externa',
]

const COR = {
  bom:     { bg: '#16a34a', text: '#fff', label: 'Bom'     },
  regular: { bg: '#d97706', text: '#fff', label: 'Regular' },
  ruim:    { bg: '#dc2626', text: '#fff', label: 'Ruim'    },
  na:      { bg: '#6b7280', text: '#fff', label: 'N/A'     },
}
const CONDICOES = ['bom', 'regular', 'ruim', 'na']

// ─── Step principal ───────────────────────────────────────────────────────────
export default function StepComodos() {
  const {
    comodos, addComodo, removeComodo,
    addFotoComodo, updateFotoComodo, removeFotoComodo,
    updateItemComodo,
  } = useVistoriaStore()

  const [nomeCustom, setNomeCustom]   = useState('')
  const [expandido, setExpandido]     = useState({})
  const [descrevendo, setDescrevendo] = useState({})
  const [cameraAberta, setCameraAberta] = useState(null) // comodoId ou null
  function adicionar(nome) {
    const n = nome.trim()
    if (!n) return
    addComodo(n)
    setNomeCustom('')
    // Auto-expandir o cômodo recém-adicionado
    setTimeout(() => {
      const { comodos: cs } = useVistoriaStore.getState()
      const ultimo = cs[cs.length - 1]
      if (ultimo) setExpandido((prev) => ({ ...prev, [ultimo.id]: true }))
    }, 30)
  }

  async function handleFoto(comodoId, arquivo) {
    const preview = URL.createObjectURL(arquivo)
    const fotoId  = uuid()
    addFotoComodo(comodoId, { id: fotoId, preview, descricaoIa: '', descricaoEditada: '', carregando: true })
    setDescrevendo((prev) => ({ ...prev, [fotoId]: true }))
    try {
      // Converte File → base64 antes de enviar à API
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(arquivo)
      })
      const desc = await descreverFoto(base64, arquivo.type)
      updateFotoComodo(comodoId, fotoId, { descricaoIa: desc, descricaoEditada: desc, carregando: false })
    } catch (err) {
      console.error('Erro ao descrever foto:', err)
      updateFotoComodo(comodoId, fotoId, {
        descricaoIa: 'Não foi possível descrever esta foto.',
        descricaoEditada: '',
        carregando: false,
      })
    }
    setDescrevendo((prev) => ({ ...prev, [fotoId]: false }))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Vistoria por Cômodo</h2>
        <p className="text-sm mt-1" style={{ color: '#7A756C' }}>
          Adicione cada ambiente, preencha as condições e registre as fotos com IA.
        </p>
      </div>

      {/* ── Painel de adição ── */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A756C' }}>
          Adicionar Cômodo
        </p>

        {/* Botões de tipo rápido */}
        <div className="flex flex-wrap gap-2">
          {TIPOS_RAPIDOS.map((tipo) => (
            <button key={tipo} onClick={() => adicionar(tipo)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{ background: '#fff', border: '1px solid #E4E0D8', color: '#3a3a3a' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A227'; e.currentTarget.style.color = '#C9A227' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E4E0D8'; e.currentTarget.style.color = '#3a3a3a' }}>
              + {tipo}
            </button>
          ))}
        </div>

        {/* Nome personalizado */}
        <div className="flex gap-2">
          <input
            type="text"
            value={nomeCustom}
            onChange={(e) => setNomeCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar(nomeCustom)}
            placeholder="Outro ambiente (ex: Escritório, Copa, Despensa...)"
            className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ border: '1px solid #E4E0D8', background: '#fff' }}
          />
          <button onClick={() => adicionar(nomeCustom)}
            className="px-3 py-2 rounded-lg text-sm transition flex items-center"
            style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      {comodos.length === 0 && (
        <p className="text-center text-sm italic py-6" style={{ color: '#B8B0A4' }}>
          Nenhum cômodo adicionado. Use os botões acima para começar.
        </p>
      )}

      {/* ── Cards dos cômodos ── */}
      {comodos.map((comodo) => (
        <ComodoCard
          key={comodo.id}
          comodo={comodo}
          expandido={!!expandido[comodo.id]}
          onToggle={() => setExpandido((prev) => ({ ...prev, [comodo.id]: !prev[comodo.id] }))}
          onRemove={() => removeComodo(comodo.id)}
          onFoto={(arquivo) => handleFoto(comodo.id, arquivo)}
          onAbrirCamera={() => setCameraAberta(comodo.id)}
          onRemoveFoto={(fotoId) => removeFotoComodo(comodo.id, fotoId)}
          onUpdateFoto={(fotoId, dados) => updateFotoComodo(comodo.id, fotoId, dados)}
          onUpdateItem={(itemId, dados) => updateItemComodo(comodo.id, itemId, dados)}
        />
      ))}

      {/* Modal de câmera */}
      {cameraAberta && (
        <CameraModal
          onCapturar={(arquivo) => {
            handleFoto(cameraAberta, arquivo)
            setCameraAberta(null)
          }}
          onFechar={() => setCameraAberta(null)}
        />
      )}
    </div>
  )
}

// ─── Card de cada cômodo ──────────────────────────────────────────────────────
function ComodoCard({
  comodo, expandido, onToggle, onRemove,
  onFoto, onAbrirCamera, onRemoveFoto, onUpdateFoto, onUpdateItem,
}) {
  const galeriaRef = useRef(null)
  const [obsAberta, setObsAberta] = useState({})

  const totalFotos    = comodo.fotos.length
  const itensTotal    = comodo.itens?.length || 0
  const itensRuins    = comodo.itens?.filter((i) => i.condicao === 'ruim').length    || 0
  const itensRegul    = comodo.itens?.filter((i) => i.condicao === 'regular').length || 0
  const itensPreench  = comodo.itens?.filter((i) => i.condicao !== null).length      || 0
  const tudoBom       = itensTotal > 0 && itensPreench === itensTotal && itensRuins === 0 && itensRegul === 0
  const semProblemas  = itensRuins === 0 && itensRegul === 0

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E4E0D8' }}>

      {/* ── Header ── */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition cursor-pointer select-none"
        style={{ background: expandido ? '#0a0a0a' : '#fff' }}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="font-semibold text-sm truncate" style={{ color: expandido ? '#fff' : '#1a1a1a' }}>
            {comodo.nome}
          </span>
          <div className="flex gap-1.5 shrink-0 flex-wrap">
            {totalFotos > 0 && (
              <Chip label={`${totalFotos} 📷`}
                bg={expandido ? '#1a3a1a' : '#dcfce7'} color={expandido ? '#4ade80' : '#16a34a'} />
            )}
            {itensRuins > 0 && (
              <Chip label={`${itensRuins} ruim${itensRuins > 1 ? 'ns' : ''}`}
                bg={expandido ? '#3a1a1a' : '#fee2e2'} color={expandido ? '#f87171' : '#dc2626'} />
            )}
            {itensRegul > 0 && itensRuins === 0 && (
              <Chip label={`${itensRegul} reg.`}
                bg={expandido ? '#3a2a0a' : '#fef3c7'} color={expandido ? '#fbbf24' : '#d97706'} />
            )}
            {tudoBom && (
              <Chip label="✓ Bom" bg={expandido ? '#1a3a1a' : '#dcfce7'} color={expandido ? '#4ade80' : '#16a34a'} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1 rounded transition"
            style={{ color: expandido ? '#7A756C' : '#B8B0A4' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.color = expandido ? '#7A756C' : '#B8B0A4'}>
            <Trash2 size={15} />
          </button>
          {expandido
            ? <ChevronUp size={17} style={{ color: '#C9A227' }} />
            : <ChevronDown size={17} style={{ color: '#7A756C' }} />}
        </div>
      </div>

      {/* ── Body ── */}
      {expandido && (
        <div style={{ borderTop: '1px solid #E4E0D8' }}>

          {/* Checklist de condições */}
          {comodo.itens?.length > 0 && (
            <div className="p-4 space-y-2" style={{ borderBottom: '1px solid #E4E0D8' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#7A756C' }}>
                Condições dos elementos
              </p>
              {comodo.itens.map((item) => {
                const obsOpen = obsAberta[item.id]
                return (
                  <div key={item.id} className="rounded-lg overflow-hidden"
                    style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="text-xs font-medium flex-1 min-w-0" style={{ color: '#1a1a1a' }}>
                        {item.nome}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        {CONDICOES.map((cond) => (
                          <button key={cond}
                            onClick={() => onUpdateItem(item.id, { condicao: item.condicao === cond ? null : cond })}
                            className="px-2 py-0.5 rounded text-xs font-semibold transition"
                            style={{
                              background: item.condicao === cond ? COR[cond].bg : 'transparent',
                              color:      item.condicao === cond ? COR[cond].text : '#9a9690',
                              border:     `1px solid ${item.condicao === cond ? COR[cond].bg : '#D4D0C8'}`,
                            }}>
                            {COR[cond].label}
                          </button>
                        ))}
                        <button
                          onClick={() => setObsAberta((prev) => ({ ...prev, [item.id]: !obsOpen }))}
                          title="Adicionar observação"
                          className="p-1 rounded transition ml-0.5"
                          style={{ color: obsOpen || item.obs ? '#C9A227' : '#B8B0A4' }}>
                          <Pencil size={12} />
                        </button>
                      </div>
                    </div>
                    {(obsOpen || item.obs) && (
                      <div className="px-3 pb-2.5">
                        <textarea
                          value={item.obs}
                          onChange={(e) => onUpdateItem(item.id, { obs: e.target.value })}
                          placeholder="Descreva o problema ou detalhe a condição..."
                          rows={2}
                          className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none resize-none"
                          style={{ border: '1px solid #E4E0D8', background: '#fff', color: '#1a1a1a', lineHeight: '1.5' }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Fotos */}
          <div className="p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A756C' }}>
              Fotos do ambiente
            </p>

            {comodo.fotos.map((foto, fi) => (
              <div key={foto.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #E4E0D8' }}>
                <div className="relative">
                  <img src={foto.preview} alt="" className="w-full h-44 object-cover" />
                  <button onClick={() => onRemoveFoto(foto.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
                    <Trash2 size={13} />
                  </button>
                  <span className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                    Foto {fi + 1}
                  </span>
                </div>
                {foto.carregando ? (
                  <div className="px-3 py-2.5">
                    <span className="text-xs font-medium" style={{ color: '#C9A227' }}>
                      ✦ Analisando com IA...
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <textarea
                      value={foto.descricaoEditada || foto.descricaoIa}
                      onChange={(e) => onUpdateFoto(foto.id, { descricaoEditada: e.target.value })}
                      rows={3}
                      placeholder="Descrição da foto (editável)..."
                      className="w-full text-xs focus:outline-none resize-none"
                      style={{ border: 'none', color: '#2a2a2a', background: 'transparent', lineHeight: '1.6' }}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Input galeria (sem capture — abre seletor de arquivo) */}
            <input ref={galeriaRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { Array.from(e.target.files).forEach((f) => onFoto(f)); e.target.value = '' }} />

            {/* Câmera via getUserMedia | Galeria via file input */}
            <div className="grid grid-cols-2 gap-2">
              <BtnFoto onClick={onAbrirCamera}                     icon={<Camera size={16} />}    label="Câmera" />
              <BtnFoto onClick={() => galeriaRef.current?.click()} icon={<ImageIcon size={16} />} label="Galeria" />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────
function Chip({ label, bg, color }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>
      {label}
    </span>
  )
}

function BtnFoto({ onClick, icon, label }) {
  return (
    <button onClick={onClick}
      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition"
      style={{ border: '1.5px dashed #C9A227', color: '#C9A227', background: '#FDF8EC' }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#FAF0D0'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#FDF8EC'}>
      {icon} {label}
    </button>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, LogOut, FileText, ShieldCheck, AlertTriangle, Key } from 'lucide-react'
import LogoCAH from '../components/LogoCAH'
import { BYPASS_LOGIN } from '../config'
import { buscarLicenca, ativarConta, ADMIN_EMAIL } from '../lib/licenca'

// Usuário fictício para modo sem login
const USUARIO_DEMO = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@cah.com', user_metadata: { nome_completo: 'Vistoriador' } }

const STATUS_LABEL = {
  rascunho:            { label: 'Rascunho',             cor: '#92400E', bg: '#FEF3C7' },
  pendente_pagamento:  { label: 'Aguard. pagamento',    cor: '#9A3412', bg: '#FFEDD5' },
  concluido:           { label: 'Concluído',             cor: '#166534', bg: '#DCFCE7' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [vistorias, setVistorias] = useState([])
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [licenca, setLicenca] = useState(null)
  const [chaveAtivacao, setChaveAtivacao] = useState('')
  const [ativando, setAtivando] = useState(false)
  const [erroAtivacao, setErroAtivacao] = useState('')

  useEffect(() => {
    async function carregar() {
      let user
      if (BYPASS_LOGIN) {
        // Tenta pegar usuário real; se não houver, usa demo
        const { data } = await supabase.auth.getUser()
        user = data?.user || USUARIO_DEMO
      } else {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { navigate('/login'); return }
        user = u
      }
      setUsuario(user)

      if (user.id === USUARIO_DEMO.id) {
        // Sem usuário real, não busca vistorias
        setVistorias([])
        setCarregando(false)
        return
      }

      const { data } = await supabase
        .from('vistorias')
        .select('*, imoveis(logradouro, numero, cidade)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setVistorias(data || [])

      // Carrega licença (exceto admin e demo)
      if (user.id !== USUARIO_DEMO.id && user.email !== ADMIN_EMAIL) {
        const lic = await buscarLicenca()
        setLicenca(lic)
      }
      setCarregando(false)
    }
    carregar()
  }, [navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleAtivarConta() {
    if (!chaveAtivacao.trim()) return
    setAtivando(true); setErroAtivacao('')
    const res = await ativarConta(chaveAtivacao)
    if (res?.ok) {
      const lic = await buscarLicenca()
      setLicenca(lic)
      setChaveAtivacao('')
    } else {
      setErroAtivacao(res?.erro || 'Chave inválida. Verifique e tente novamente.')
    }
    setAtivando(false)
  }

  const isAdmin = usuario?.email === ADMIN_EMAIL
  const nome = usuario?.user_metadata?.nome_completo || usuario?.email || ''

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F3' }}>

      {/* Header */}
      <header style={{ background: '#0a0a0a', borderBottom: '1px solid #2a2a2a' }} className="px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoCAH size={36} />
            <div>
              <span className="font-bold text-white text-sm tracking-wide">CAH</span>
              <span className="text-xs ml-1.5" style={{ color: '#C9A227' }}>Vistoria Fácil <span style={{ fontSize: '9px', opacity: 0.7 }}>v1.0</span></span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs transition"
            style={{ color: '#7A756C' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C9A227'}
            onMouseLeave={e => e.currentTarget.style.color = '#7A756C'}>
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* Saudação */}
        <div className="mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
            Olá, {nome.split(' ')[0]} 👋
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#7A756C' }}>Seus laudos de vistoria</p>
        </div>

        {/* Link admin */}
        {isAdmin && (
          <button onClick={() => navigate('/admin')}
            className="w-full mb-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
            style={{ background: '#0a0a0a', color: '#C9A227', border: '1px solid #2a2a2a' }}>
            <ShieldCheck size={16} /> Painel Admin
          </button>
        )}

        {/* Botão nova vistoria */}
        <button
          onClick={() => navigate('/nova-vistoria')}
          className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition mb-4 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}
        >
          <Plus size={20} />
          Nova Vistoria
        </button>

        {/* Card de licença (apenas para clientes, não admin) */}
        {!isAdmin && licenca !== null && (
          <div className="mb-6">
            {licenca.cliente ? (
              <div className="rounded-xl p-4" style={{
                background: licenca.cliente.status === 'ativo' ? '#F0FDF4' : '#FFF7ED',
                border: `1px solid ${licenca.cliente.status === 'ativo' ? '#BBF7D0' : '#FED7AA'}`,
              }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {licenca.cliente.status === 'ativo'
                      ? <ShieldCheck size={16} style={{ color: '#16A34A' }} />
                      : <AlertTriangle size={16} style={{ color: '#EA580C' }} />
                    }
                    <div>
                      <p className="text-sm font-semibold" style={{ color: licenca.cliente.status === 'ativo' ? '#15803D' : '#C2410C' }}>
                        {licenca.cliente.status === 'ativo' ? 'Licença ativa' : `Conta ${licenca.cliente.status}`}
                      </p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {licenca.cliente.plano === 'creditos'
                          ? `${licenca.cliente.creditos_disponiveis ?? 0} créditos disponíveis · ${licenca.cliente.creditos_usados ?? 0} utilizados`
                          : licenca.cliente.data_expiracao
                            ? `Assinatura até ${new Date(licenca.cliente.data_expiracao + 'T12:00:00').toLocaleDateString('pt-BR')}`
                            : 'Plano anual ativo'
                        }
                      </p>
                    </div>
                  </div>
                  {licenca.cliente.plano === 'creditos' && licenca.cliente.creditos_disponiveis <= 5 && licenca.cliente.creditos_disponiveis > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      Baixo
                    </span>
                  )}
                  {licenca.cliente.plano === 'creditos' && licenca.cliente.creditos_disponiveis <= 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                      Esgotado
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Sem licença vinculada — pedir chave */
              <div className="rounded-xl p-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Key size={16} style={{ color: '#EA580C' }} />
                  <p className="text-sm font-semibold" style={{ color: '#C2410C' }}>Ativar licença</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">Insira a chave de acesso fornecida para ativar sua conta.</p>
                <div className="flex gap-2">
                  <input
                    value={chaveAtivacao}
                    onChange={e => setChaveAtivacao(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleAtivarConta()}
                    placeholder="XXXX-XXXX-XXXX"
                    className="flex-1 rounded-lg px-3 py-2 text-sm font-mono border border-orange-200 focus:outline-none focus:border-orange-400"
                    style={{ background: '#fff', letterSpacing: '0.05em' }}
                    maxLength={14}
                  />
                  <button onClick={handleAtivarConta} disabled={ativando || !chaveAtivacao.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: '#EA580C', color: '#fff' }}>
                    {ativando ? '...' : 'Ativar'}
                  </button>
                </div>
                {erroAtivacao && <p className="text-xs text-red-600 mt-2">{erroAtivacao}</p>}
              </div>
            )}
          </div>
        )}

        {/* Lista */}
        {carregando ? (
          <div className="text-center py-12" style={{ color: '#7A756C' }}>Carregando...</div>
        ) : vistorias.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#EDEAE4' }}>
              <FileText size={28} style={{ color: '#B8B0A4' }} />
            </div>
            <p className="font-medium" style={{ color: '#1a1a1a' }}>Nenhuma vistoria ainda</p>
            <p className="text-sm mt-1" style={{ color: '#7A756C' }}>Clique em "Nova Vistoria" para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vistorias.map((v) => {
              const status = STATUS_LABEL[v.status] || STATUS_LABEL.rascunho
              const endereco = v.imoveis
                ? `${v.imoveis.logradouro}, ${v.imoveis.numero} — ${v.imoveis.cidade}`
                : 'Endereço não informado'
              return (
                <button
                  key={v.id}
                  onClick={() => navigate(`/vistoria/${v.id}`)}
                  className="w-full rounded-xl p-4 text-left transition group"
                  style={{ background: '#fff', border: '1px solid #E4E0D8' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#C9A227'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E4E0D8'}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#1a1a1a' }}>{endereco}</p>
                      <p className="text-xs mt-0.5 capitalize" style={{ color: '#7A756C' }}>
                        Vistoria de {v.tipo} · {new Date(v.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0"
                      style={{ color: status.cor, background: status.bg }}>
                      {status.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

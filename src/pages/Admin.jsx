import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ADMIN_EMAIL } from '../lib/licenca'
import {
  Users, Plus, ChevronLeft, Check, X, Edit2, RefreshCw,
  CreditCard, Ban, BarChart2, Copy, Eye, EyeOff, Calendar,
  TrendingUp, AlertCircle, CheckCircle, Clock, Trash2, KeyRound, Send,
} from 'lucide-react'

const STATUS = {
  ativo:      { label: 'Ativo',     cor: '#166534', bg: '#DCFCE7' },
  pendente:   { label: 'Pendente',  cor: '#92400E', bg: '#FEF3C7' },
  suspenso:   { label: 'Suspenso',  cor: '#9A3412', bg: '#FFEDD5' },
  cancelado:  { label: 'Cancelado', cor: '#6B7280', bg: '#F3F4F6' },
}

const PLANO = {
  creditos: 'Créditos',
  anual:    'Anual',
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.pendente
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ color: s.cor, background: s.bg }}>
      {s.label}
    </span>
  )
}

function StatCard({ icon, label, valor, sub, cor }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: cor + '20' }}>
          {icon}
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Modal Novo/Editar Cliente ────────────────────────────────────────────────
function ModalCliente({ cliente, onSalvar, onFechar }) {
  const editando = !!cliente?.id
  const [form, setForm] = useState({
    nome:           cliente?.nome           || '',
    email:          cliente?.email          || '',
    empresa:        cliente?.empresa        || '',
    telefone:       cliente?.telefone       || '',
    plano:          cliente?.plano          || 'creditos',
    status:         cliente?.status         || 'ativo',
    creditos_disponiveis: cliente?.creditos_disponiveis ?? 0,
    valor_setup:    cliente?.valor_setup    || '',
    valor_plano:    cliente?.valor_plano    || '',
    forma_pagamento: cliente?.forma_pagamento || 'avista',
    data_inicio:    cliente?.data_inicio    || new Date().toISOString().split('T')[0],
    data_expiracao: cliente?.data_expiracao || '',
    observacoes:    cliente?.observacoes    || '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function set(campo, val) { setForm(f => ({ ...f, [campo]: val })) }

  // Auto-calcula expiração para plano anual
  function calcularExpiracao(inicio) {
    if (!inicio) return
    const d = new Date(inicio + 'T12:00:00')
    d.setFullYear(d.getFullYear() + 1)
    d.setDate(d.getDate() - 1)
    set('data_expiracao', d.toISOString().split('T')[0])
  }

  async function salvar() {
    if (!form.nome || !form.email) { setErro('Nome e e-mail são obrigatórios'); return }
    setSalvando(true); setErro('')
    try {
      const dados = {
        nome:           form.nome,
        email:          form.email.toLowerCase().trim(),
        empresa:        form.empresa || null,
        telefone:       form.telefone || null,
        plano:          form.plano,
        status:         form.status,
        creditos_disponiveis: form.plano === 'creditos' ? parseInt(form.creditos_disponiveis) || 0 : 0,
        valor_setup:    form.valor_setup ? parseFloat(form.valor_setup) : null,
        valor_plano:    form.valor_plano ? parseFloat(form.valor_plano) : null,
        forma_pagamento: form.forma_pagamento || null,
        data_inicio:    form.data_inicio || null,
        data_expiracao: form.plano === 'anual' ? (form.data_expiracao || null) : null,
        observacoes:    form.observacoes || null,
      }

      if (editando) {
        const { error } = await supabase.from('clientes').update(dados).eq('id', cliente.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clientes').insert(dados)
        if (error) throw error
      }
      onSalvar()
    } catch (e) {
      setErro(e.message || 'Erro ao salvar')
    }
    setSalvando(false)
  }

  const inp = 'w-full rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-yellow-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{editando ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle size={15} /> {erro}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nome *</label>
              <input className={inp} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">E-mail *</label>
              <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" disabled={editando} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Empresa</label>
              <input className={inp} value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Imobiliária X" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Telefone</label>
              <input className={inp} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Plano */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Plano</label>
            <div className="grid grid-cols-2 gap-2">
              {['creditos', 'anual'].map(pl => (
                <button key={pl} onClick={() => set('plano', pl)}
                  className="p-3 rounded-xl text-left border-2 transition"
                  style={{ borderColor: form.plano === pl ? '#C9A227' : '#E4E0D8', background: form.plano === pl ? '#FDF8EC' : '#fff' }}>
                  <p className="font-semibold text-sm" style={{ color: form.plano === pl ? '#92700A' : '#1a1a1a' }}>
                    {pl === 'creditos' ? '🎟 Créditos' : '📅 Anual'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pl === 'creditos' ? 'Paga por vistoria' : 'Assinatura anual'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {form.plano === 'creditos' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Créditos iniciais</label>
              <input className={inp} type="number" min="0" value={form.creditos_disponiveis} onChange={e => set('creditos_disponiveis', e.target.value)} />
            </div>
          )}

          {form.plano === 'anual' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Início</label>
                <input className={inp} type="date" value={form.data_inicio}
                  onChange={e => { set('data_inicio', e.target.value); calcularExpiracao(e.target.value) }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Expiração</label>
                <input className={inp} type="date" value={form.data_expiracao} onChange={e => set('data_expiracao', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Pagamento</label>
                <select className={inp} value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}>
                  <option value="avista">À vista</option>
                  <option value="mensal">Parcelado mensal</option>
                </select>
              </div>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Setup (R$)</label>
              <input className={inp} type="number" step="0.01" min="0" value={form.valor_setup} onChange={e => set('valor_setup', e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                {form.plano === 'anual' ? (form.forma_pagamento === 'mensal' ? 'Parcela (R$)' : 'Anual (R$)') : 'Pacote (R$)'}
              </label>
              <input className={inp} type="number" step="0.01" min="0" value={form.valor_plano} onChange={e => set('valor_plano', e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
            <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="pendente">Pendente</option>
              <option value="suspenso">Suspenso</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Observações</label>
            <textarea className={inp} rows={2} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Notas internas..." />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-2 justify-end">
          <button onClick={onFechar} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100">Cancelar</button>
          <button onClick={salvar} disabled={salvando}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
            {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Adicionar Créditos ─────────────────────────────────────────────────
function ModalCreditos({ cliente, onSalvar, onFechar }) {
  const [qtd, setQtd] = useState(10)
  const [valor, setValor] = useState('')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    const novos = (cliente.creditos_disponiveis || 0) + parseInt(qtd)
    await supabase.from('clientes').update({ creditos_disponiveis: novos }).eq('id', cliente.id)
    if (valor) {
      await supabase.from('pagamentos_clientes').insert({
        cliente_id: cliente.id,
        tipo: 'creditos',
        descricao: `${qtd} créditos adicionados`,
        valor: parseFloat(valor),
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0],
        creditos_adicionados: parseInt(qtd),
        observacoes: obs || null,
      })
    }
    setSalvando(false)
    onSalvar()
  }

  const inp = 'w-full rounded-lg px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-yellow-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Adicionar Créditos</h2>
          <button onClick={onFechar} className="text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-700">Créditos atuais de <strong>{cliente.nome}</strong></p>
            <p className="text-3xl font-bold text-amber-800">{cliente.creditos_disponiveis ?? 0}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Quantidade a adicionar</label>
            <div className="flex gap-2 mb-2">
              {[5, 10, 20, 50].map(n => (
                <button key={n} onClick={() => setQtd(n)}
                  className="flex-1 py-1.5 rounded-lg text-sm font-semibold border transition"
                  style={{ borderColor: qtd === n ? '#C9A227' : '#E4E0D8', background: qtd === n ? '#FDF8EC' : '#fff', color: qtd === n ? '#92700A' : '#333' }}>
                  {n}
                </button>
              ))}
            </div>
            <input className={inp} type="number" min="1" value={qtd} onChange={e => setQtd(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Valor recebido (R$) — opcional</label>
            <input className={inp} type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Observação</label>
            <input className={inp} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Pix recebido 19/05" />
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-4 flex gap-2 justify-end">
          <button onClick={onFechar} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100">Cancelar</button>
          <button onClick={salvar} disabled={salvando || qtd <= 0}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
            {salvando ? 'Salvando...' : `+ ${qtd} créditos`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detalhe do Cliente ───────────────────────────────────────────────────────
function DetalheCliente({ cliente, onVoltar, onEditar, onAtualizar }) {
  const [pagamentos, setPagamentos] = useState([])
  const [showChave, setShowChave] = useState(false)
  const [modalCreditos, setModalCreditos] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [vistorias, setVistorias] = useState(null)
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false)
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false)
  const [erroRecuperacao, setErroRecuperacao] = useState('')

  useEffect(() => {
    supabase.from('pagamentos_clientes').select('*').eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPagamentos(data || []))

    if (cliente.user_id) {
      supabase.from('vistorias').select('id', { count: 'exact' }).eq('user_id', cliente.user_id)
        .then(({ count }) => setVistorias(count || 0))
    }
  }, [cliente.id, cliente.user_id])

  function copiarChave() {
    navigator.clipboard.writeText(cliente.chave_acesso)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function alterarStatus(novoStatus) {
    await supabase.from('clientes').update({ status: novoStatus }).eq('id', cliente.id)
    onAtualizar()
  }

  async function enviarRecuperacaoSenha() {
    setEnviandoRecuperacao(true)
    setErroRecuperacao('')
    setRecuperacaoEnviada(false)
    const { error } = await supabase.auth.resetPasswordForEmail(cliente.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) {
      setErroRecuperacao('Erro ao enviar: ' + error.message)
    } else {
      setRecuperacaoEnviada(true)
      setTimeout(() => setRecuperacaoEnviada(false), 5000)
    }
    setEnviandoRecuperacao(false)
  }

  async function registrarPagamento(tipo) {
    const valor = prompt(`Valor recebido (R$) — ${tipo}:`)
    if (!valor) return
    await supabase.from('pagamentos_clientes').insert({
      cliente_id: cliente.id,
      tipo,
      descricao: tipo === 'setup' ? 'Taxa de setup' : tipo === 'assinatura' ? 'Assinatura anual' : 'Créditos avulsos',
      valor: parseFloat(valor.replace(',', '.')),
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
    })
    onAtualizar()
    const { data } = await supabase.from('pagamentos_clientes').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false })
    setPagamentos(data || [])
  }

  const expirado = cliente.plano === 'anual' && cliente.data_expiracao && new Date(cliente.data_expiracao) < new Date()
  const semCreditos = cliente.plano === 'creditos' && cliente.creditos_disponiveis <= 0

  return (
    <>
      {modalCreditos && (
        <ModalCreditos
          cliente={cliente}
          onFechar={() => setModalCreditos(false)}
          onSalvar={() => { setModalCreditos(false); onAtualizar() }}
        />
      )}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 truncate">{cliente.nome}</h2>
            <p className="text-xs text-gray-500">{cliente.email}</p>
          </div>
          <Badge status={cliente.status} />
        </div>

        {/* Alertas */}
        {expirado && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <AlertCircle size={16} /> Assinatura expirada em {new Date(cliente.data_expiracao).toLocaleDateString('pt-BR')}
          </div>
        )}
        {semCreditos && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
            <AlertCircle size={16} /> Sem créditos disponíveis
          </div>
        )}

        {/* Chave de acesso */}
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Chave de Acesso</p>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg flex-1" style={{ color: '#C9A227', letterSpacing: '0.1em' }}>
              {showChave ? cliente.chave_acesso : '████-████-████'}
            </span>
            <button onClick={() => setShowChave(!showChave)} className="text-gray-400 hover:text-white">
              {showChave ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={copiarChave} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition"
              style={{ background: copiado ? '#166534' : '#C9A227', color: copiado ? '#fff' : '#0a0a0a' }}>
              {copiado ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {cliente.user_id ? '✓ Conta vinculada ao sistema' : '⏳ Aguardando cliente ativar com essa chave'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-400">Plano</p>
            <p className="font-bold text-gray-800 mt-1">{PLANO[cliente.plano] || cliente.plano}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-400">{cliente.plano === 'creditos' ? 'Créditos' : 'Vistorias'}</p>
            <p className="font-bold text-gray-800 mt-1">
              {cliente.plano === 'creditos'
                ? `${cliente.creditos_disponiveis ?? 0} disp.`
                : vistorias !== null ? vistorias : '—'
              }
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-400">Usadas</p>
            <p className="font-bold text-gray-800 mt-1">{cliente.creditos_usados ?? 0}</p>
          </div>
        </div>

        {/* Valores */}
        {(cliente.valor_setup || cliente.valor_plano) && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Valores</p>
            <div className="space-y-2">
              {cliente.valor_setup > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Setup</span>
                  <span className="font-semibold">R$ {parseFloat(cliente.valor_setup).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {cliente.valor_plano > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {cliente.plano === 'anual'
                      ? (cliente.forma_pagamento === 'mensal' ? 'Parcela mensal' : 'Assinatura anual')
                      : 'Valor pacote'}
                  </span>
                  <span className="font-semibold">R$ {parseFloat(cliente.valor_plano).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {cliente.plano === 'anual' && cliente.data_expiracao && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Validade</span>
                  <span className={`font-semibold ${expirado ? 'text-red-600' : 'text-green-600'}`}>
                    {new Date(cliente.data_expiracao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onEditar}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:border-yellow-400">
            <Edit2 size={15} /> Editar
          </button>
          {cliente.plano === 'creditos' && (
            <button onClick={() => setModalCreditos(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
              <Plus size={15} /> Créditos
            </button>
          )}
          {cliente.status === 'ativo' ? (
            <button onClick={() => alterarStatus('suspenso')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 border border-red-200 text-red-700">
              <Ban size={15} /> Suspender
            </button>
          ) : (
            <button onClick={() => alterarStatus('ativo')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-50 border border-green-200 text-green-700">
              <CheckCircle size={15} /> Ativar
            </button>
          )}
        </div>

        {/* Recuperação de senha */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={15} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recuperação de Senha</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Envia um e-mail de redefinição de senha para <strong>{cliente.email}</strong>. O cliente clica no link e cria uma nova senha.
          </p>
          {erroRecuperacao && (
            <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
              <AlertCircle size={13} /> {erroRecuperacao}
            </p>
          )}
          <button
            onClick={enviarRecuperacaoSenha}
            disabled={enviandoRecuperacao || recuperacaoEnviada}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
            style={{
              background: recuperacaoEnviada ? '#DCFCE7' : '#F3F4F6',
              color: recuperacaoEnviada ? '#166534' : '#374151',
              border: recuperacaoEnviada ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
            }}>
            {enviandoRecuperacao ? (
              <><RefreshCw size={15} className="animate-spin" /> Enviando...</>
            ) : recuperacaoEnviada ? (
              <><Check size={15} /> E-mail enviado com sucesso!</>
            ) : (
              <><Send size={15} /> Enviar link de recuperação</>
            )}
          </button>
        </div>

        {/* Registrar pagamento rápido */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Registrar Pagamento</p>
          <div className="flex gap-2">
            <button onClick={() => registrarPagamento('setup')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
              Setup
            </button>
            <button onClick={() => registrarPagamento('assinatura')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
              Assinatura
            </button>
            <button onClick={() => registrarPagamento('creditos')}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
              Créditos
            </button>
          </div>
        </div>

        {/* Histórico de pagamentos */}
        {pagamentos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide p-4 pb-2">Histórico de Pagamentos</p>
            {pagamentos.map((pg) => (
              <div key={pg.id} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 first:border-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${pg.status === 'pago' ? 'bg-green-500' : pg.status === 'atrasado' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{pg.descricao || pg.tipo}</p>
                  <p className="text-xs text-gray-400">
                    {pg.data_pagamento ? new Date(pg.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR') : new Date(pg.created_at).toLocaleDateString('pt-BR')}
                    {pg.observacoes && ` — ${pg.observacoes}`}
                  </p>
                </div>
                <span className="font-bold text-sm text-gray-900 shrink-0">
                  R$ {parseFloat(pg.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {cliente.observacoes && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm text-amber-900">{cliente.observacoes}</p>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Página Principal Admin ───────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate()
  const [autorizado, setAutorizado] = useState(null)
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modalNovo, setModalNovo] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteDetalhe, setClienteDetalhe] = useState(null)

  useEffect(() => {
    verificarAdmin()
  }, [])

  async function verificarAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      setAutorizado(false)
      return
    }
    setAutorizado(true)
    await carregarClientes()
  }

  async function carregarClientes() {
    setCarregando(true)
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setCarregando(false)
  }

  async function refreshCliente() {
    await carregarClientes()
    if (clienteDetalhe) {
      const { data } = await supabase.from('clientes').select('*').eq('id', clienteDetalhe.id).single()
      if (data) setClienteDetalhe(data)
    }
  }

  if (autorizado === false) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F6F3' }}>
        <div className="text-center p-8">
          <Ban size={40} className="text-red-400 mx-auto mb-3" />
          <p className="font-bold text-gray-900">Acesso restrito</p>
          <p className="text-sm text-gray-500 mt-1">Você não tem permissão para acessar esta página.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 text-sm text-yellow-600 underline">
            Voltar ao dashboard
          </button>
        </div>
      </div>
    )
  }

  if (autorizado === null) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Verificando...</p></div>
  }

  // Stats
  const totalAtivos    = clientes.filter(c => c.status === 'ativo').length
  const totalSuspensos = clientes.filter(c => c.status === 'suspenso').length
  const totalVistorias = clientes.reduce((a, c) => a + (c.creditos_usados || 0), 0)
  const receitaTotal   = 0 // calculada dos pagamentos (simplificado)

  // Filtros
  const clientesFiltrados = clientes.filter(c => {
    const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.email.toLowerCase().includes(busca.toLowerCase()) ||
      (c.empresa || '').toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
    return matchBusca && matchStatus
  })

  const expiradosBreve = clientes.filter(c =>
    c.plano === 'anual' && c.data_expiracao &&
    new Date(c.data_expiracao) > new Date() &&
    new Date(c.data_expiracao) <= new Date(Date.now() + 30 * 86400000)
  )

  return (
    <>
      {modalNovo && (
        <ModalCliente
          cliente={null}
          onFechar={() => setModalNovo(false)}
          onSalvar={() => { setModalNovo(false); carregarClientes() }}
        />
      )}
      {clienteEditando && (
        <ModalCliente
          cliente={clienteEditando}
          onFechar={() => setClienteEditando(null)}
          onSalvar={() => { setClienteEditando(null); refreshCliente() }}
        />
      )}

      <div className="min-h-screen" style={{ background: '#F7F6F3' }}>
        {/* Header */}
        <header style={{ background: '#0a0a0a', borderBottom: '1px solid #2a2a2a' }} className="px-4 py-3 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-300">
                <ChevronLeft size={20} />
              </button>
              <div>
                <span className="font-bold text-white text-sm">Painel Admin</span>
                <span className="text-xs ml-2" style={{ color: '#C9A227' }}>CAH Vistoria Fácil</span>
              </div>
            </div>
            <button onClick={() => setModalNovo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
              <Plus size={14} /> Novo Cliente
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {clienteDetalhe ? (
            <DetalheCliente
              cliente={clienteDetalhe}
              onVoltar={() => setClienteDetalhe(null)}
              onEditar={() => setClienteEditando(clienteDetalhe)}
              onAtualizar={refreshCliente}
            />
          ) : (
            <>
              {/* Alerta de vencimentos */}
              {expiradosBreve.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>{expiradosBreve.length}</strong> assinatura{expiradosBreve.length > 1 ? 's' : ''} vencem em 30 dias:
                    {' '}{expiradosBreve.map(c => c.nome.split(' ')[0]).join(', ')}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={<Users size={16} style={{ color: '#3B82F6' }} />} label="Total" valor={clientes.length} cor="#3B82F6" />
                <StatCard icon={<CheckCircle size={16} style={{ color: '#22C55E' }} />} label="Ativos" valor={totalAtivos} cor="#22C55E" />
                <StatCard icon={<Ban size={16} style={{ color: '#EF4444' }} />} label="Suspensos" valor={totalSuspensos} cor="#EF4444" />
                <StatCard icon={<BarChart2 size={16} style={{ color: '#C9A227' }} />} label="Vistorias" valor={totalVistorias} sub="total geradas" cor="#C9A227" />
              </div>

              {/* Busca e filtros */}
              <div className="flex gap-2">
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou empresa..."
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm border border-gray-200 bg-white focus:outline-none focus:border-yellow-500"
                />
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                  className="rounded-xl px-3 py-2.5 text-sm border border-gray-200 bg-white focus:outline-none">
                  <option value="todos">Todos</option>
                  <option value="ativo">Ativos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="suspenso">Suspensos</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>

              {/* Lista de clientes */}
              {carregando ? (
                <div className="text-center py-12 text-gray-400">Carregando...</div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    {busca || filtroStatus !== 'todos' ? 'Nenhum resultado' : 'Nenhum cliente ainda'}
                  </p>
                  {!busca && filtroStatus === 'todos' && (
                    <button onClick={() => setModalNovo(true)}
                      className="mt-3 text-sm font-semibold underline"
                      style={{ color: '#C9A227' }}>
                      Criar primeiro cliente
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {clientesFiltrados.map((c) => {
                    const expirado = c.plano === 'anual' && c.data_expiracao && new Date(c.data_expiracao) < new Date()
                    const semCred = c.plano === 'creditos' && c.creditos_disponiveis <= 0 && c.status === 'ativo'
                    return (
                      <button key={c.id}
                        onClick={() => setClienteDetalhe(c)}
                        className="w-full bg-white rounded-xl p-4 text-left border border-gray-200 hover:border-yellow-400 transition group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-gray-900 truncate">{c.nome}</p>
                              {c.empresa && <span className="text-xs text-gray-400">· {c.empresa}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{c.email}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-xs text-gray-500">
                                {c.plano === 'creditos'
                                  ? `🎟 ${c.creditos_disponiveis ?? 0} créditos restantes`
                                  : c.data_expiracao
                                    ? `📅 Vence ${new Date(c.data_expiracao + 'T12:00:00').toLocaleDateString('pt-BR')}`
                                    : '📅 Anual'
                                }
                              </span>
                              <span className="text-xs text-gray-400">{c.creditos_usados ?? 0} vistorias geradas</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge status={c.status} />
                            {(expirado || semCred) && (
                              <span className="text-xs text-red-600 font-medium">⚠ Atenção</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}

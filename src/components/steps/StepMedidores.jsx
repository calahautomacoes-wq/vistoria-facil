import { useVistoriaStore } from '../../store/vistoriaStore'
import { Droplets, Zap, Flame, Key, AlertCircle } from 'lucide-react'

const inp = { border: '1px solid #E4E0D8', background: '#fff' }
const onF = (e) => e.target.style.borderColor = '#C9A227'
const onB = (e) => e.target.style.borderColor = '#E4E0D8'

function MedidorCard({ icon, cores, label, unidade, value, onChange }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3.5"
      style={{ background: cores.bg, border: `1px solid ${cores.border}` }}>
      <div className="shrink-0" style={{ color: cores.icon }}>{icon}</div>
      <div className="flex-1">
        <label className="block text-xs font-semibold mb-1.5" style={{ color: cores.label }}>{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder="—"
            className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inp}
            onFocus={onF}
            onBlur={onB}
          />
          <span className="text-xs font-bold" style={{ color: cores.label }}>{unidade}</span>
        </div>
      </div>
    </div>
  )
}

export default function StepMedidores() {
  const {
    medidores, setMedidores, chaves, setChaves,
    observacoes, setObservacoes,
    itensNaoVistoriados, setItensNaoVistoriados,
  } = useVistoriaStore()

  function atualizar(campo, valor) {
    setMedidores({ ...medidores, [campo]: valor })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Medidores e Conclusão</h2>
        <p className="text-sm mt-1" style={{ color: '#7A756C' }}>
          Leituras dos medidores, chaves e informações finais da vistoria.
        </p>
      </div>

      {/* Medidores */}
      <div className="space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A756C' }}>Leituras</p>
        <MedidorCard
          icon={<Droplets size={20} />}
          cores={{ bg: '#EFF6FF', border: '#BFDBFE', icon: '#3b82f6', label: '#1d4ed8' }}
          label="Hidrômetro (Água)"
          unidade="m³"
          value={medidores.agua}
          onChange={(e) => atualizar('agua', e.target.value)}
        />
        <MedidorCard
          icon={<Zap size={20} />}
          cores={{ bg: '#FEFCE8', border: '#FEF08A', icon: '#ca8a04', label: '#854d0e' }}
          label="Relógio de Luz (Energia)"
          unidade="kWh"
          value={medidores.luz}
          onChange={(e) => atualizar('luz', e.target.value)}
        />
        <MedidorCard
          icon={<Flame size={20} />}
          cores={{ bg: '#FFF7ED', border: '#FED7AA', icon: '#f97316', label: '#9a3412' }}
          label="Medidor de Gás"
          unidade="m³"
          value={medidores.gas}
          onChange={(e) => atualizar('gas', e.target.value)}
        />
      </div>

      {/* Chaves */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Key size={15} style={{ color: '#7A756C' }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A756C' }}>
            Chaves Entregues
          </p>
        </div>
        <textarea
          value={chaves}
          onChange={(e) => setChaves(e.target.value)}
          placeholder="Ex: 2 chaves porta principal, 1 chave portão lateral, 1 controle garagem..."
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
          style={inp}
          onFocus={onF}
          onBlur={onB}
        />
      </div>

      {/* Itens não vistoriados */}
      <div className="rounded-xl p-4 space-y-2"
        style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <div className="flex items-center gap-2">
          <AlertCircle size={16} style={{ color: '#D97706' }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#92400E' }}>
            Itens Não Vistoriados
          </p>
        </div>
        <p className="text-xs" style={{ color: '#78350F' }}>
          Registre os itens que não puderam ser verificados e o motivo — importante para resguardar as partes.
        </p>
        <textarea
          value={itensNaoVistoriados}
          onChange={(e) => setItensNaoVistoriados(e.target.value)}
          placeholder="Ex: Caixa d'água (sem acesso), cobertura (sem escada), área de serviço (mobília bloqueando)..."
          rows={3}
          className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
          style={{ border: '1px solid #FDE68A', background: '#fff' }}
          onFocus={(e) => e.target.style.borderColor = '#C9A227'}
          onBlur={(e) => e.target.style.borderColor = '#FDE68A'}
        />
      </div>

      {/* Observações gerais */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#7A756C' }}>
          Observações Gerais
        </p>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Informações adicionais sobre o imóvel ou a vistoria..."
          rows={4}
          className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
          style={inp}
          onFocus={onF}
          onBlur={onB}
        />
      </div>
    </div>
  )
}

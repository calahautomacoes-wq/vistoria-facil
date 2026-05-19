import { useVistoriaStore } from '../../store/vistoriaStore'
import { DoorOpen, DoorClosed } from 'lucide-react'

const inp = { border: '1px solid #E4E0D8', background: '#fff' }
const onF  = (e) => e.target.style.borderColor = '#C9A227'
const onB  = (e) => e.target.style.borderColor = '#E4E0D8'

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function StepTipo() {
  const {
    tipo, setTipo,
    vistoriador, setVistoriador,
    dataVistoria, setDataVistoria,
    numeroContrato, setNumeroContrato,
    valorAluguel, setValorAluguel,
    dataInicio, setDataInicio,
    dataFim, setDataFim,
    prazoContestacao, setPrazoContestacao,
  } = useVistoriaStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Tipo de Vistoria</h2>
        <p className="text-sm mt-1" style={{ color: '#7A756C' }}>Selecione o momento da vistoria e preencha os dados do contrato de locação.</p>
      </div>

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setTipo('entrada')} className="p-5 rounded-xl text-left transition"
          style={{ border: tipo === 'entrada' ? '2px solid #C9A227' : '2px solid #E4E0D8', background: tipo === 'entrada' ? '#FDF8EC' : '#fff' }}>
          <DoorOpen size={28} style={{ color: tipo === 'entrada' ? '#C9A227' : '#B8B0A4' }} />
          <p className="font-semibold mt-2 text-sm" style={{ color: tipo === 'entrada' ? '#92700A' : '#1a1a1a' }}>Entrada</p>
          <p className="text-xs mt-0.5" style={{ color: '#7A756C' }}>Entrega das chaves ao locatário</p>
        </button>
        <button onClick={() => setTipo('saida')} className="p-5 rounded-xl text-left transition"
          style={{ border: tipo === 'saida' ? '2px solid #C9A227' : '2px solid #E4E0D8', background: tipo === 'saida' ? '#FDF8EC' : '#fff' }}>
          <DoorClosed size={28} style={{ color: tipo === 'saida' ? '#C9A227' : '#B8B0A4' }} />
          <p className="font-semibold mt-2 text-sm" style={{ color: tipo === 'saida' ? '#92700A' : '#1a1a1a' }}>Saída</p>
          <p className="text-xs mt-0.5" style={{ color: '#7A756C' }}>Devolução das chaves pelo locatário</p>
        </button>
      </div>

      {/* Dados do vistoriador */}
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nome do Vistoriador">
          <input type="text" value={vistoriador} onChange={(e) => setVistoriador(e.target.value)}
            placeholder="Nome completo" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
        <Campo label="Data da Vistoria">
          <input type="date" value={dataVistoria} onChange={(e) => setDataVistoria(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
      </div>

      {/* Dados do contrato */}
      <div className="rounded-xl p-4 space-y-4" style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A756C' }}>Contrato de Locação</p>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nº do Contrato">
            <input type="text" value={numeroContrato} onChange={(e) => setNumeroContrato(e.target.value)}
              placeholder="Ex: 2024/001" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inp} onFocus={onF} onBlur={onB} />
          </Campo>
          <Campo label="Valor do Aluguel (R$)">
            <input type="number" value={valorAluguel} onChange={(e) => setValorAluguel(e.target.value)}
              placeholder="0,00" step="0.01" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inp} onFocus={onF} onBlur={onB} />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Início do Contrato">
            <input type="date" value={dataInicio}
              onChange={(e) => {
                const inicio = e.target.value
                setDataInicio(inicio)
                if (inicio) {
                  // Calcula fim = início + 30 meses
                  const d = new Date(inicio + 'T12:00:00')
                  d.setMonth(d.getMonth() + 30)
                  // Subtrai 1 dia (fim no último dia antes do próximo período)
                  d.setDate(d.getDate() - 1)
                  setDataFim(d.toISOString().split('T')[0])
                }
              }}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inp} onFocus={onF} onBlur={onB} />
          </Campo>
          <Campo label="Fim do Contrato">
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inp} onFocus={onF} onBlur={onB} />
          </Campo>
        </div>
        {dataInicio && dataFim && (
          <p className="text-xs" style={{ color: '#C9A227' }}>
            ✓ Vigência de 30 meses — fim calculado automaticamente. Ajuste manualmente se necessário.
          </p>
        )}

        <Campo label="Prazo para contestação (dias)">
          <select value={prazoContestacao} onChange={(e) => setPrazoContestacao(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB}>
            <option value="3">3 dias</option>
            <option value="5">5 dias</option>
            <option value="7">7 dias (recomendado)</option>
            <option value="10">10 dias</option>
            <option value="15">15 dias</option>
          </select>
        </Campo>
      </div>
    </div>
  )
}

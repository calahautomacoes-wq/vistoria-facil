import { useVistoriaStore } from '../../store/vistoriaStore'
import { Plus, Trash2 } from 'lucide-react'

const inp = { border: '1px solid #E4E0D8', background: '#fff' }
const onF = (e) => e.target.style.borderColor = '#C9A227'
const onB = (e) => e.target.style.borderColor = '#E4E0D8'

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#7A756C' }}>{label}</label>
      {children}
    </div>
  )
}

function PessoaForm({ pessoa, onChange, onRemove, podeRemover }) {
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A756C' }}>Dados pessoais</span>
        {podeRemover && (
          <button onClick={onRemove} className="transition" style={{ color: '#B8B0A4' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C9A227'}
            onMouseLeave={e => e.currentTarget.style.color = '#B8B0A4'}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <Campo label="Nome completo">
        <input type="text" value={pessoa.nome} onChange={(e) => onChange('nome', e.target.value)}
          placeholder="Nome completo" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={inp} onFocus={onF} onBlur={onB} />
      </Campo>

      <div className="grid grid-cols-2 gap-2">
        <Campo label="CPF">
          <input type="text" value={pessoa.cpf} onChange={(e) => onChange('cpf', e.target.value)}
            placeholder="000.000.000-00" maxLength={14} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
        <Campo label="RG">
          <input type="text" value={pessoa.rg} onChange={(e) => onChange('rg', e.target.value)}
            placeholder="00.000.000-0" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Campo label="Telefone">
          <input type="tel" value={pessoa.telefone} onChange={(e) => onChange('telefone', e.target.value)}
            placeholder="(00) 00000-0000" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
        <Campo label="E-mail">
          <input type="email" value={pessoa.email} onChange={(e) => onChange('email', e.target.value)}
            placeholder="email@exemplo.com" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
      </div>
    </div>
  )
}

function TestemunhaForm({ pessoa, onChange, onRemove }) {
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A756C' }}>Testemunha</span>
        <button onClick={onRemove} className="transition" style={{ color: '#B8B0A4' }}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A227'}
          onMouseLeave={e => e.currentTarget.style.color = '#B8B0A4'}>
          <Trash2 size={16} />
        </button>
      </div>
      <Campo label="Nome completo">
        <input type="text" value={pessoa.nome} onChange={(e) => onChange('nome', e.target.value)}
          placeholder="Nome" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={inp} onFocus={onF} onBlur={onB} />
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="CPF">
          <input type="text" value={pessoa.cpf} onChange={(e) => onChange('cpf', e.target.value)}
            placeholder="000.000.000-00" maxLength={14} className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
        <Campo label="RG">
          <input type="text" value={pessoa.rg} onChange={(e) => onChange('rg', e.target.value)}
            placeholder="00.000.000-0" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
      </div>
    </div>
  )
}

function BtnAdicionar({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm font-semibold transition"
      style={{ color: '#C9A227' }}
      onMouseEnter={e => e.currentTarget.style.color = '#9B7A1A'}
      onMouseLeave={e => e.currentTarget.style.color = '#C9A227'}>
      <Plus size={16} /> {label}
    </button>
  )
}

export default function StepPessoas() {
  const {
    proprietarios, setProprietarios, addProprietario, removeProprietario,
    inquilinos,    setInquilinos,    addInquilino,    removeInquilino,
    testemunhas,   setTestemunhas,   addTestemunha,   removeTestemunha,
  } = useVistoriaStore()

  function atualizar(lista, setLista, index, campo, valor) {
    const nova = [...lista]
    nova[index] = { ...nova[index], [campo]: valor }
    setLista(nova)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Qualificação das Partes</h2>
        <p className="text-sm mt-1" style={{ color: '#7A756C' }}>
          Qualificação completa das partes conforme exigido pela Lei nº 8.245/1991.
        </p>
      </div>

      {/* Locadores (Proprietários) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold" style={{ color: '#1a1a1a' }}>Locador(a) — Proprietário(a)</h3>
            <p className="text-xs mt-0.5" style={{ color: '#7A756C' }}>Quem cede o imóvel para locação</p>
          </div>
          <BtnAdicionar onClick={addProprietario} label="Adicionar" />
        </div>
        {proprietarios.map((p, i) => (
          <PessoaForm key={i} pessoa={p}
            onChange={(campo, valor) => atualizar(proprietarios, setProprietarios, i, campo, valor)}
            onRemove={() => removeProprietario(i)}
            podeRemover={proprietarios.length > 1} />
        ))}
      </section>

      {/* Locatários (Inquilinos) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold" style={{ color: '#1a1a1a' }}>Locatário(a) — Inquilino(a)</h3>
            <p className="text-xs mt-0.5" style={{ color: '#7A756C' }}>Quem ocupa o imóvel</p>
          </div>
          <BtnAdicionar onClick={addInquilino} label="Adicionar" />
        </div>
        {inquilinos.map((p, i) => (
          <PessoaForm key={i} pessoa={p}
            onChange={(campo, valor) => atualizar(inquilinos, setInquilinos, i, campo, valor)}
            onRemove={() => removeInquilino(i)}
            podeRemover={inquilinos.length > 1} />
        ))}
      </section>

      {/* Testemunhas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold" style={{ color: '#1a1a1a' }}>Testemunhas</h3>
            <p className="text-xs mt-0.5" style={{ color: '#7A756C' }}>Opcional, mas recomendado</p>
          </div>
          <BtnAdicionar onClick={addTestemunha} label="Adicionar" />
        </div>
        {testemunhas.length === 0 && (
          <p className="text-xs italic" style={{ color: '#B8B0A4' }}>
            Nenhuma testemunha adicionada. Clique em "Adicionar" para incluir.
          </p>
        )}
        {testemunhas.map((t, i) => (
          <TestemunhaForm key={i} pessoa={t}
            onChange={(campo, valor) => atualizar(testemunhas, setTestemunhas, i, campo, valor)}
            onRemove={() => removeTestemunha(i)} />
        ))}
      </section>
    </div>
  )
}

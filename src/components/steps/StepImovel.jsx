import { useState } from 'react'
import { useVistoriaStore } from '../../store/vistoriaStore'
import { Search } from 'lucide-react'

const inp = { border: '1px solid #E4E0D8', background: '#fff' }
const onF = (e) => e.target.style.borderColor = '#C9A227'
const onB = (e) => e.target.style.borderColor = '#E4E0D8'

function Campo({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>{label}</label>
      {children}
    </div>
  )
}

export default function StepImovel() {
  const { imovel, setImovel } = useVistoriaStore()
  const [buscandoCep, setBuscandoCep] = useState(false)

  function atualizar(campo, valor) {
    setImovel({ ...imovel, [campo]: valor })
  }

  async function buscarCep(cep) {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    setBuscandoCep(true)
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setImovel({ ...imovel, cep: cepLimpo, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf })
      }
    } catch (_) {}
    setBuscandoCep(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Dados do Imóvel</h2>
        <p className="text-sm mt-1" style={{ color: '#7A756C' }}>Endereço completo e características do imóvel.</p>
      </div>

      {/* Tipo e finalidade */}
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Tipo do Imóvel">
          <select value={imovel.tipoImovel} onChange={(e) => atualizar('tipoImovel', e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inp} onFocus={onF} onBlur={onB}>
            <option value="">Selecione...</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Casa em condomínio">Casa em condomínio</option>
            <option value="Sala comercial">Sala comercial</option>
            <option value="Loja">Loja</option>
            <option value="Galpão">Galpão</option>
            <option value="Terreno">Terreno</option>
            <option value="Outro">Outro</option>
          </select>
        </Campo>
        <Campo label="Finalidade">
          <select value={imovel.finalidade} onChange={(e) => atualizar('finalidade', e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inp} onFocus={onF} onBlur={onB}>
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
            <option value="misto">Misto</option>
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Área Total (m²)">
          <input type="number" value={imovel.areaM2} onChange={(e) => atualizar('areaM2', e.target.value)}
            placeholder="Ex: 65" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
        <Campo label="Mobiliado">
          <div className="flex gap-2 mt-0.5">
            {[{ v: false, l: 'Não' }, { v: true, l: 'Sim' }].map(({ v, l }) => (
              <button key={l} type="button"
                onClick={() => atualizar('mobiliado', v)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  border: imovel.mobiliado === v ? '2px solid #C9A227' : '1px solid #E4E0D8',
                  background: imovel.mobiliado === v ? '#FDF8EC' : '#fff',
                  color: imovel.mobiliado === v ? '#92700A' : '#5a5a5a',
                }}>
                {l}
              </button>
            ))}
          </div>
        </Campo>
      </div>

      {/* Endereço */}
      <div className="pt-2" style={{ borderTop: '1px solid #E4E0D8' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#7A756C' }}>Endereço</p>

        <Campo label="CEP">
          <div className="relative">
            <input type="text" value={imovel.cep}
              onChange={(e) => { atualizar('cep', e.target.value); buscarCep(e.target.value) }}
              placeholder="00000-000" maxLength={9}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none pr-10"
              style={inp} onFocus={onF} onBlur={onB} />
            <Search size={16} className="absolute right-3 top-3" style={{ color: buscandoCep ? '#C9A227' : '#B8B0A4' }} />
          </div>
        </Campo>
      </div>

      <Campo label="Logradouro">
        <input type="text" value={imovel.logradouro} onChange={(e) => atualizar('logradouro', e.target.value)}
          placeholder="Rua, Avenida..." className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
          style={inp} onFocus={onF} onBlur={onB} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Número">
          <input type="text" value={imovel.numero} onChange={(e) => atualizar('numero', e.target.value)}
            placeholder="123" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
        <Campo label="Complemento">
          <input type="text" value={imovel.complemento} onChange={(e) => atualizar('complemento', e.target.value)}
            placeholder="Apto, Bloco..." className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
      </div>

      <Campo label="Bairro">
        <input type="text" value={imovel.bairro} onChange={(e) => atualizar('bairro', e.target.value)}
          placeholder="Bairro" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
          style={inp} onFocus={onF} onBlur={onB} />
      </Campo>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Campo label="Cidade">
            <input type="text" value={imovel.cidade} onChange={(e) => atualizar('cidade', e.target.value)}
              placeholder="Cidade" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inp} onFocus={onF} onBlur={onB} />
          </Campo>
        </div>
        <Campo label="UF">
          <input type="text" value={imovel.estado} onChange={(e) => atualizar('estado', e.target.value)}
            placeholder="SP" maxLength={2} className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            style={inp} onFocus={onF} onBlur={onB} />
        </Campo>
      </div>
    </div>
  )
}

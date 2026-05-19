import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useVistoriaStore } from '../store/vistoriaStore'
import { BYPASS_LOGIN } from '../config'
import StepTipo from '../components/steps/StepTipo'
import StepImovel from '../components/steps/StepImovel'
import StepPessoas from '../components/steps/StepPessoas'
import StepComodos from '../components/steps/StepComodos'
import StepMedidores from '../components/steps/StepMedidores'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const USUARIO_DEMO = { id: '00000000-0000-0000-0000-000000000001' }

const STEPS = [
  { id: 'tipo',      label: 'Tipo'      },
  { id: 'imovel',    label: 'Imóvel'    },
  { id: 'pessoas',   label: 'Pessoas'   },
  { id: 'comodos',   label: 'Cômodos'   },
  { id: 'medidores', label: 'Medidores' },
]

export default function NovaVistoria() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const store = useVistoriaStore()
  const preencherDemo = useVistoriaStore((s) => s.preencherDemo)

  function avancar() {
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  function voltar() {
    if (step > 0) setStep(step - 1)
    else navigate('/dashboard')
  }

  async function finalizar() {
    setSalvando(true)
    try {
      // Resolve usuário (respeita BYPASS_LOGIN)
      let user
      if (BYPASS_LOGIN) {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          user = data.user
        } else {
          // Tenta login anônimo para ter sessão real com RLS
          const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously()
          user = anonData?.user || USUARIO_DEMO
          if (anonErr) console.warn('Anon login falhou:', anonErr.message)
        }
      } else {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) { navigate('/login'); return }
        user = u
      }

      // 1. Criar vistoria
      const { data: vistoria, error: errV } = await supabase
        .from('vistorias')
        .insert({
          user_id: user.id,
          tipo: store.tipo,
          status: 'rascunho',
          vistoriador: store.vistoriador,
          data_vistoria: store.dataVistoria,
          observacoes: store.observacoes,
          numero_contrato:        store.numeroContrato        || null,
          valor_aluguel:          store.valorAluguel          ? parseFloat(store.valorAluguel) : null,
          data_inicio:            store.dataInicio            || null,
          data_fim:               store.dataFim               || null,
          prazo_contestacao:      parseInt(store.prazoContestacao) || 7,
          itens_nao_vistoriados:  store.itensNaoVistoriados  || null,
        })
        .select()
        .single()
      if (errV) throw errV

      // 2. Imóvel
      const { tipoImovel, areaM2, mobiliado, ...imovelBase } = store.imovel
      await supabase.from('imoveis').insert({
        vistoria_id: vistoria.id,
        ...imovelBase,
        tipo_imovel: tipoImovel || null,
        area_m2:     areaM2 ? parseFloat(areaM2) : null,
        mobiliado:   !!mobiliado,
      })

      // 3. Pessoas (proprietários e inquilinos)
      const pessoas = [
        ...store.proprietarios.map((p, i) => ({
          vistoria_id: vistoria.id,
          papel: 'proprietario',
          ordem: i,
          nome: p.nome || null,
          cpf:  p.cpf  || null,
          rg:   p.rg   || null,
          telefone: p.telefone || null,
          email:    p.email    || null,
        })),
        ...store.inquilinos.map((p, i) => ({
          vistoria_id: vistoria.id,
          papel: 'inquilino',
          ordem: i,
          nome: p.nome || null,
          cpf:  p.cpf  || null,
          rg:   p.rg   || null,
          telefone: p.telefone || null,
          email:    p.email    || null,
        })),
      ]
      if (pessoas.length > 0) await supabase.from('pessoas').insert(pessoas)

      // 4. Testemunhas
      if (store.testemunhas.length > 0) {
        const testemunhas = store.testemunhas.map((t, i) => ({
          vistoria_id: vistoria.id,
          nome: t.nome || null,
          cpf:  t.cpf  || null,
          rg:   t.rg   || null,
          ordem: i,
        }))
        await supabase.from('testemunhas').insert(testemunhas)
      }

      // 5. Cômodos e fotos
      for (const comodo of store.comodos) {
        const { data: c } = await supabase
          .from('comodos')
          .insert({
            vistoria_id: vistoria.id,
            nome: comodo.nome,
            ordem: store.comodos.indexOf(comodo),
            itens: comodo.itens || [],
          })
          .select()
          .single()

        for (const foto of comodo.fotos) {
          // Upload da foto
          const blob = await fetch(foto.preview).then(r => r.blob())
          const path = `${user.id}/${vistoria.id}/${comodo.id}/${foto.id}`
          await supabase.storage.from('fotos-vistoria').upload(path, blob)
          const { data: urlData } = supabase.storage.from('fotos-vistoria').getPublicUrl(path)

          await supabase.from('fotos').insert({
            comodo_id: c.id,
            url: path,
            descricao_ia: foto.descricaoIa,
            descricao_editada: foto.descricaoEditada || foto.descricaoIa,
          })
        }
      }

      // 6. Medidores
      await supabase.from('medidores').insert({
        vistoria_id: vistoria.id,
        ...store.medidores,
        chaves: store.chaves,
      })

      store.resetVistoria()
      navigate(`/vistoria/${vistoria.id}`)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      const msg = err?.message || err?.error_description || JSON.stringify(err)
      alert(`Erro ao salvar vistoria:\n\n${msg}`)
    }
    setSalvando(false)
  }

  const isUltimo = step === STEPS.length - 1

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F6F3' }}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3" style={{ background: '#0a0a0a', borderBottom: '1px solid #2a2a2a' }}>
        <button onClick={voltar} style={{ color: '#7A756C' }} className="hover:text-white transition">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-white text-sm">Nova Vistoria</h1>
          <p className="text-xs" style={{ color: '#C9A227' }}>{STEPS[step].label} · {step + 1} de {STEPS.length}</p>
        </div>
        <button
          onClick={() => { preencherDemo(); setStep(4) }}
          className="text-xs px-2.5 py-1 rounded-lg font-semibold transition"
          style={{ background: '#1a1a1a', color: '#C9A227', border: '1px solid #C9A227' }}
          title="Preenche todos os campos com dados de exemplo">
          Demo
        </button>
        <button onClick={() => navigate('/dashboard')} style={{ color: '#7A756C' }} className="hover:text-white transition">
          <X size={20} />
        </button>
      </header>

      {/* Barra de progresso dourada */}
      <div className="h-0.5" style={{ background: '#2a2a2a' }}>
        <div
          className="h-0.5 transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #C9A227, #E8C547)' }}
        />
      </div>

      {/* Conteúdo do step */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {step === 0 && <StepTipo />}
          {step === 1 && <StepImovel />}
          {step === 2 && <StepPessoas />}
          {step === 3 && <StepComodos />}
          {step === 4 && <StepMedidores />}
        </div>
      </main>

      {/* Footer com botões */}
      <footer className="px-4 py-4" style={{ background: '#fff', borderTop: '1px solid #E4E0D8' }}>
        <div className="max-w-2xl mx-auto">
          {isUltimo ? (
            <button
              onClick={finalizar}
              disabled={salvando}
              className="w-full py-3 rounded-xl font-semibold transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}
            >
              {salvando ? 'Salvando...' : '✓ Finalizar Vistoria'}
            </button>
          ) : (
            <button
              onClick={avancar}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
              style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}
            >
              Continuar <ChevronRight size={20} />
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

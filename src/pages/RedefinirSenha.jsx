import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LogoCAH from '../components/LogoCAH'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [erro, setErro] = useState('')
  const [sessaoOk, setSessaoOk] = useState(false)

  useEffect(() => {
    // O Supabase processa o token da URL automaticamente via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessaoOk(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleRedefinir(e) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setErro(error.message || 'Erro ao redefinir senha.')
    } else {
      setConcluido(true)
      setTimeout(() => navigate('/dashboard'), 3000)
    }
    setSalvando(false)
  }

  const inp = 'w-full rounded-xl px-4 py-3 text-sm focus:outline-none'
  const inpStyle = { border: '1px solid #E4E0D8', background: '#fff' }

  if (concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F7F6F3' }}>
        <div className="text-center">
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#C9A227' }} />
          <h2 className="text-xl font-bold text-gray-900">Senha redefinida!</h2>
          <p className="text-sm text-gray-500 mt-2">Redirecionando para o sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F6F3' }}>
      <header style={{ background: '#0a0a0a' }} className="px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          <LogoCAH size={32} />
          <div>
            <span className="font-bold text-white text-sm">CAH</span>
            <span className="text-xs ml-1.5" style={{ color: '#C9A227' }}>Vistoria Fácil</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #E4E0D8' }}>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Redefinir senha</h1>
            <p className="text-sm text-gray-500 mb-6">Crie uma nova senha para sua conta.</p>

            {!sessaoOk && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                Aguardando validação do link... Se demorar, feche e clique novamente no e-mail.
              </div>
            )}

            {erro && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={handleRedefinir} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className={inp}
                    style={inpStyle}
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>
                  Confirmar senha
                </label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  className={inp}
                  style={inpStyle}
                />
              </div>

              <button type="submit" disabled={salvando || !sessaoOk}
                className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
                {salvando ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

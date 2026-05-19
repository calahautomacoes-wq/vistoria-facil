import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LogoCAH from '../components/LogoCAH'

export default function Cadastro() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_completo: nome } },
    })
    if (error) {
      setErro(error.message === 'User already registered' ? 'E-mail já cadastrado.' : 'Erro ao criar conta.')
    } else {
      navigate('/dashboard')
    }
    setCarregando(false)
  }

  const inputStyle = { border: '1px solid #E4E0D8', background: '#fff' }
  const inputFocus = (e) => e.target.style.borderColor = '#C9A227'
  const inputBlur = (e) => e.target.style.borderColor = '#E4E0D8'

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #2a2218 100%)' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoCAH size={72} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">CAH</h1>
          <p className="text-sm mt-1" style={{ color: '#C9A227' }}>Vistoria Fácil <span style={{ fontSize: '10px', opacity: 0.7 }}>v1.0</span></p>
        </div>

        <div className="rounded-2xl p-6 shadow-xl" style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
          <h2 className="font-bold text-gray-900 mb-4">Criar conta</h2>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>Nome completo</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                placeholder="Seu nome" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>Senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                placeholder="Mínimo 6 caracteres" minLength={6} required />
            </div>

            {erro && <p className="text-red-600 text-sm">{erro}</p>}

            <button type="submit" disabled={carregando}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}>
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: '#7A756C' }}>
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#C9A227' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

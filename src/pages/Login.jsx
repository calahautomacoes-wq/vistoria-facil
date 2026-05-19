import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import LogoCAH from '../components/LogoCAH'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    else navigate('/dashboard')
    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #2a2218 100%)' }}>
      <div className="w-full max-w-sm">

        {/* Logo + Nome */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoCAH size={72} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">CAH</h1>
          <p className="text-sm mt-1" style={{ color: '#C9A227' }}>Vistoria Fácil</p>
          <p className="text-xs mt-1" style={{ color: '#6b6560' }}>Laudos profissionais com Inteligência Artificial</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-xl" style={{ background: '#F7F6F3', border: '1px solid #E4E0D8' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
                style={{ border: '1px solid #E4E0D8', background: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#C9A227'}
                onBlur={e => e.target.style.borderColor = '#E4E0D8'}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A756C' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition pr-10"
                  style={{ border: '1px solid #E4E0D8', background: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#C9A227'}
                  onBlur={e => e.target.style.borderColor = '#E4E0D8'}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-2.5"
                  style={{ color: '#7A756C' }}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && <p className="text-red-600 text-sm">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #C9A227, #E8C547)', color: '#0a0a0a' }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: '#7A756C' }}>
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-semibold hover:underline" style={{ color: '#C9A227' }}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

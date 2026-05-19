/**
 * Controle de licença — verifica se o usuário pode criar vistorias.
 * Admin (calah.automacoes@gmail.com) sempre passa.
 */
import { supabase } from './supabase'

export const ADMIN_EMAIL = 'calah.automacoes@gmail.com'

export function isAdmin(email) {
  return email === ADMIN_EMAIL
}

/** Busca os dados de licença do usuário logado */
export async function buscarLicenca() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (isAdmin(user.email)) return { ok: true, isAdmin: true }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return cliente ? { ok: true, isAdmin: false, cliente } : { ok: false, isAdmin: false, cliente: null }
}

/**
 * Verifica se pode criar vistoria e, se sim, consome 1 crédito.
 * Retorna { ok: boolean, erro?: string }
 */
export async function verificarEConsumirCredito() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, erro: 'Usuário não autenticado' }
  if (isAdmin(user.email)) return { ok: true }

  const { data, error } = await supabase.rpc('consumir_credito', { p_user_id: user.id })
  if (error) return { ok: false, erro: error.message }
  if (!data?.ok) return { ok: false, erro: data?.erro || 'Licença inválida' }
  return { ok: true }
}

/** Ativa a conta usando a chave de acesso */
export async function ativarConta(chave) {
  const { data, error } = await supabase.rpc('ativar_conta', { p_chave: chave.toUpperCase() })
  if (error) return { ok: false, erro: error.message }
  return data
}

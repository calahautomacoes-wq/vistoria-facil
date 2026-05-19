import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import NovaVistoria from './pages/NovaVistoria'
import Vistoria from './pages/Vistoria'
import { BYPASS_LOGIN } from './config'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Se login desativado, redireciona direto para o dashboard */}
        <Route path="/" element={<Navigate to={BYPASS_LOGIN ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={BYPASS_LOGIN ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/cadastro" element={BYPASS_LOGIN ? <Navigate to="/dashboard" replace /> : <Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nova-vistoria" element={<NovaVistoria />} />
        <Route path="/vistoria/:id" element={<Vistoria />} />
      </Routes>
    </BrowserRouter>
  )
}

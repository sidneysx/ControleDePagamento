import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NotasFiscaisPage from './pages/NotasFiscaisPage'
import FornecedoresPage from './pages/FornecedoresPage'
import ProgramacaoPage from './pages/ProgramacaoPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="notas-fiscais" element={<NotasFiscaisPage />} />
          <Route path="fornecedores" element={<FornecedoresPage />} />
          <Route path="programacao" element={<ProgramacaoPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

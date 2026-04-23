import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/Nav/AppShell'
import CitizenPage from './pages/citizen/CitizenPage'
import HEWPage from './pages/hew/HEWPage'
import AdminPage from './pages/admin/AdminPage'
import LoginPage from './pages/auth/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/citizen" replace />} />
              <Route path="/citizen" element={<CitizenPage />} />
              <Route path="/hew" element={<HEWPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  )
}

export default App

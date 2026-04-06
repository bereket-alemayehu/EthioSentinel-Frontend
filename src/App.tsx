import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import CitizenPage from './pages/CitizenPage'
import HEWPage from './pages/HEWPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/citizen" replace />} />
        <Route path="/citizen" element={<CitizenPage />} />
        <Route path="/hew" element={<HEWPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RecipePage from './pages/RecipePage'
import ShareTarget from './pages/ShareTarget'

function PrivateRoute({ children }) {
  const { authed, loading } = useAuth()
  if (loading) return <div className="app-loading"><div className="spinner" /></div>
  return authed ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/share-target" element={<ShareTarget />} />
          <Route path="/recipe/:slug" element={<RecipePage />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute><Dashboard /></PrivateRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

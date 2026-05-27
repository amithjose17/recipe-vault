import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'rv_auth'
const SESSION_HOURS = 24

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const { expiry } = JSON.parse(stored)
        if (Date.now() < expiry) setAuthed(true)
        else localStorage.removeItem(STORAGE_KEY)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = (password) => {
    const correct = import.meta.env.VITE_VAULT_PASSWORD
    if (password === correct) {
      const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiry }))
      setAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  return (
    <AuthContext.Provider value={{ authed, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

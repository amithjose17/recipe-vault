import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ChefHat } from 'lucide-react'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(password)) {
      navigate('/dashboard')
    } else {
      setError('Wrong password')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setPassword('')
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-icon">
          <ChefHat size={32} />
        </div>
        <h1>Recipe Vault</h1>
        <p className="login-sub">brokeapp.in · private kitchen</p>

        <motion.form
          onSubmit={handleSubmit}
          animate={shaking ? { x: [-8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="input-wrap">
            <Lock size={16} className="input-icon" />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Enter vault password"
              autoFocus
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary">
            Enter Vault
          </button>
        </motion.form>
      </motion.div>
    </div>
  )
}

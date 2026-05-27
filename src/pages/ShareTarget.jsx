import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ChefHat } from 'lucide-react'

// This page handles the PWA Web Share Target
// When user shares from Instagram → your app, they land here
export default function ShareTarget() {
  const navigate = useNavigate()
  const { authed } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url') || params.get('text') || params.get('title')

    if (sharedUrl) {
      // Store the shared URL for the dashboard to pick up
      window._sharedUrl = sharedUrl
    }

    if (authed) {
      navigate('/dashboard')
    } else {
      navigate('/')
    }
  }, [authed])

  return (
    <div className="share-target-loading">
      <ChefHat size={40} />
      <p>Opening Recipe Vault...</p>
    </div>
  )
}

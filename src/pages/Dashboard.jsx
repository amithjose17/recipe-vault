import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import RecipeCard from '../components/RecipeCard'
import AddRecipeModal from '../components/AddRecipeModal'
import { Plus, LogOut, ChefHat, Search, Tag } from 'lucide-react'

export default function Dashboard() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const { logout } = useAuth()
  const navigate = useNavigate()

  // Handle PWA share target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url') || params.get('text')
    if (sharedUrl) {
      setShowAdd(true)
      window._sharedUrl = sharedUrl
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  useEffect(() => { fetchRecipes() }, [])

  const fetchRecipes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setRecipes(data || [])
    setLoading(false)
  }

  const filtered = recipes.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.tags?.includes(filter)
    return matchSearch && matchFilter
  })

  const allTags = [...new Set(recipes.flatMap(r => r.tags || []))]

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-header-left">
          <ChefHat size={24} />
          <div>
            <h1>Recipe Vault</h1>
            <span className="dash-sub">kitchen.brokeapp.in</span>
          </div>
        </div>
        <div className="dash-header-right">
          <button className="btn-add" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> Add Recipe
          </button>
          <button className="btn-icon" onClick={() => { logout(); navigate('/') }} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="dash-controls">
        <div className="search-wrap">
          <Search size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes..."
          />
        </div>
        <div className="tag-filters">
          <button
            className={`tag-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >All</button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-btn ${filter === tag ? 'active' : ''}`}
              onClick={() => setFilter(tag)}
            >
              <Tag size={11} /> {tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <ChefHat size={48} opacity={0.2} />
          <p>{search ? 'No recipes found' : 'Your vault is empty — add your first recipe!'}</p>
          {!search && (
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add from Instagram
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="recipe-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {filtered.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <RecipeCard recipe={recipe} onRefresh={fetchRecipes} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddRecipeModal
            onClose={() => { setShowAdd(false); delete window._sharedUrl }}
            onSaved={fetchRecipes}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

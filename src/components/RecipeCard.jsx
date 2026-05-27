import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import {
  Clock, Users, Globe, Lock, Share2,
  Trash2, ExternalLink, Tag, Timer
} from 'lucide-react'

export default function RecipeCard({ recipe, onRefresh }) {
  const navigate = useNavigate()
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const totalTime = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)

  const togglePublic = async (e) => {
    e.stopPropagation()
    setToggling(true)
    let slug = recipe.share_slug
    if (!recipe.is_public && !slug) {
      slug = Math.random().toString(36).substring(2, 10)
    }
    await supabase
      .from('recipes')
      .update({ is_public: !recipe.is_public, share_slug: slug })
      .eq('id', recipe.id)
    setToggling(false)
    onRefresh()
  }

  const shareRecipe = async (e) => {
    e.stopPropagation()
    if (!recipe.is_public) return
    const url = `${window.location.origin}/recipe/${recipe.share_slug}`
    if (navigator.share) {
      await navigator.share({ title: recipe.title, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const deleteRecipe = async (e) => {
    e.stopPropagation()
    if (!confirm(`Delete "${recipe.title}"?`)) return
    setDeleting(true)
    await supabase.from('recipes').delete().eq('id', recipe.id)
    onRefresh()
  }

  const openRecipe = () => {
    if (recipe.is_public && recipe.share_slug) {
      navigate(`/recipe/${recipe.share_slug}`)
    } else {
      navigate(`/recipe/${recipe.id}?preview=true`)
    }
  }

  return (
    <motion.div
      className={`recipe-card ${deleting ? 'deleting' : ''}`}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rc-body" onClick={openRecipe}>
        <div className="rc-top">
          <div className="rc-tags">
            {recipe.cuisine && <span className="rc-tag cuisine">{recipe.cuisine}</span>}
            {recipe.tags?.slice(0, 2).map(t => (
              <span key={t} className="rc-tag">{t}</span>
            ))}
          </div>
          <span className={`rc-visibility ${recipe.is_public ? 'public' : 'private'}`}>
            {recipe.is_public ? <Globe size={12} /> : <Lock size={12} />}
            {recipe.is_public ? 'Public' : 'Private'}
          </span>
        </div>

        <h3>{recipe.title}</h3>
        {recipe.description && <p className="rc-desc">{recipe.description}</p>}

        <div className="rc-meta">
          {totalTime > 0 && (
            <span><Clock size={12} /> {totalTime}m</span>
          )}
          <span><Users size={12} /> {recipe.base_servings} servings</span>
          <span><ExternalLink size={12} /> View & scale</span>
        </div>
      </div>

      <div className="rc-actions">
        <button
          className={`rc-btn ${recipe.is_public ? 'active' : ''}`}
          onClick={togglePublic}
          disabled={toggling}
          title={recipe.is_public ? 'Make private' : 'Make public'}
        >
          {recipe.is_public ? <Globe size={15} /> : <Lock size={15} />}
          {recipe.is_public ? 'Public' : 'Private'}
        </button>

        {recipe.is_public && (
          <button className="rc-btn share" onClick={shareRecipe} title="Copy share link">
            <Share2 size={15} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        )}

        <button className="rc-btn delete" onClick={deleteRecipe} title="Delete recipe">
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  )
}

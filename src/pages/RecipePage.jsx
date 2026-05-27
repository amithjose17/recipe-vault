import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  Clock, Users, ChefHat, Share2, ArrowLeft,
  CheckCircle2, Circle, Timer, Tag, Globe
} from 'lucide-react'

function scaleAmount(amount, baseServings, currentServings) {
  if (!amount || !baseServings) return amount
  const scaled = (amount / baseServings) * currentServings
  if (scaled % 1 === 0) return scaled
  // Nice fractions
  const rounded = Math.round(scaled * 4) / 4
  return rounded < 0.1 ? '<¼' : rounded
}

function formatAmount(amount, unit) {
  if (!amount) return ''
  return `${amount}${unit ? ' ' + unit : ''}`
}

export default function RecipePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [servings, setServings] = useState(4)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchRecipe()
  }, [slug])

  const fetchRecipe = async () => {
    // A UUID has the form xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.
    // Short share-slugs (e.g. "7rb9w06n") must NOT be used as `id` values
    // because Postgres will reject a non-UUID with a 400 Bad Request.
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true'

    let query = supabase.from('recipes').select('*')

    if (isUUID) {
      // Owner previewing their own recipe by id — skip the is_public filter
      query = query.eq('id', slug)
      if (!isPreview) query = query.eq('is_public', true)
    } else {
      // Public share link via short share_slug
      query = query.eq('share_slug', slug).eq('is_public', true)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      setNotFound(true)
    } else {
      setRecipe(data)
      setServings(data.base_servings)
    }
    setLoading(false)
  }

  const toggleStep = (i) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const shareRecipe = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: recipe.title, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return (
    <div className="recipe-page-loading">
      <div className="spinner" />
    </div>
  )

  if (notFound) return (
    <div className="not-found">
      <ChefHat size={64} opacity={0.2} />
      <h2>Recipe not found</h2>
      <p>This recipe may be private or doesn't exist.</p>
    </div>
  )

  const totalTime = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)

  return (
    <div className="recipe-page">
      <div className="recipe-page-inner">

        {/* Header */}
        <motion.div
          className="rp-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rp-brand">
            <ChefHat size={16} />
            <span>kitchen.brokeapp.in</span>
          </div>
          <button className="btn-share" onClick={shareRecipe}>
            <Share2 size={16} />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </motion.div>

        {/* Title block */}
        <motion.div
          className="rp-title-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="rp-tags">
            {recipe.cuisine && <span className="rp-tag cuisine">{recipe.cuisine}</span>}
            {recipe.tags?.map(t => <span key={t} className="rp-tag">{t}</span>)}
          </div>
          <h1>{recipe.title}</h1>
          {recipe.description && <p className="rp-desc">{recipe.description}</p>}

          <div className="rp-meta">
            {recipe.prep_time_mins && (
              <div className="rp-meta-item">
                <Clock size={15} />
                <span>Prep {recipe.prep_time_mins}m</span>
              </div>
            )}
            {recipe.cook_time_mins && (
              <div className="rp-meta-item">
                <Timer size={15} />
                <span>Cook {recipe.cook_time_mins}m</span>
              </div>
            )}
            {totalTime > 0 && (
              <div className="rp-meta-item total">
                <span>Total {totalTime}m</span>
              </div>
            )}
          </div>

          {recipe.source_url && (
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="rp-source">
              <Globe size={13} /> View original post
            </a>
          )}
        </motion.div>

        {/* Serving Slider */}
        <motion.div
          className="serving-panel"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="serving-header">
            <Users size={18} />
            <span>Servings</span>
            <span className="serving-count">{servings}</span>
            {servings !== recipe.base_servings && (
              <button
                className="serving-reset"
                onClick={() => setServings(recipe.base_servings)}
              >reset</button>
            )}
          </div>
          <div className="slider-wrap">
            <span className="slider-label">1</span>
            <input
              type="range"
              min={1}
              max={20}
              value={servings}
              onChange={e => setServings(Number(e.target.value))}
              className="serving-slider"
            />
            <span className="slider-label">20</span>
          </div>
          {servings !== recipe.base_servings && (
            <p className="serving-note">
              Scaled {servings > recipe.base_servings ? 'up' : 'down'} from {recipe.base_servings} servings
              ({servings > recipe.base_servings
                ? `×${(servings / recipe.base_servings).toFixed(1)}`
                : `÷${(recipe.base_servings / servings).toFixed(1)}`})
            </p>
          )}
        </motion.div>

        {/* Ingredients */}
        <motion.section
          className="rp-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {recipe.ingredients?.map((ing, i) => (
              <motion.li
                key={i}
                className="ingredient-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
              >
                <span className="ing-amount">
                  {formatAmount(
                    scaleAmount(ing.amount, recipe.base_servings, servings),
                    ing.unit
                  )}
                </span>
                <span className="ing-name">{ing.name}</span>
                {ing.notes && <span className="ing-notes">{ing.notes}</span>}
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Steps */}
        <motion.section
          className="rp-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>Method</h2>
          <div className="steps-list">
            {recipe.steps?.map((step, i) => (
              <motion.div
                key={i}
                className={`step-item ${completedSteps.has(i) ? 'done' : ''}`}
                onClick={() => toggleStep(i)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <div className="step-check">
                  {completedSteps.has(i)
                    ? <CheckCircle2 size={22} />
                    : <Circle size={22} />
                  }
                </div>
                <div className="step-content">
                  <div className="step-header">
                    <span className="step-num">Step {i + 1}</span>
                    {step.title && <span className="step-title">{step.title}</span>}
                    {step.timer_mins && (
                      <span className="step-timer">
                        <Timer size={12} /> {step.timer_mins}m
                      </span>
                    )}
                  </div>
                  <p>{step.instruction}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tips */}
        {recipe.tips?.length > 0 && (
          <motion.section
            className="rp-section tips-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2>Chef's Tips</h2>
            <ul className="tips-list">
              {recipe.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </motion.section>
        )}

        <div className="rp-footer">
          <ChefHat size={16} />
          <span>Saved to kitchen.brokeapp.in</span>
        </div>
      </div>
    </div>
  )
}

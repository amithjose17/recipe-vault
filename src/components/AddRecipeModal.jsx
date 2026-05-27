import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  X, Instagram, Sparkles, Save, ChefHat,
  AlertCircle, Plus, Minus, Clock, Users,
  PenLine, FileJson, CheckCircle2
} from 'lucide-react'

export default function AddRecipeModal({ onClose, onSaved }) {
  const [tab, setTab] = useState('instagram') // 'instagram' | 'json' | 'manual'
  const [step, setStep] = useState('paste')

  // Instagram tab state
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')

  // JSON import tab state
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [jsonValid, setJsonValid] = useState(false)

  // Manual entry tab state
  const [manual, setManual] = useState({
    title: '',
    description: '',
    cuisine: '',
    prep_time_mins: '',
    cook_time_mins: '',
    base_servings: 2,
    ingredients: [{ amount: '', unit: '', name: '' }],
    steps: [{ instruction: '' }],
    tags: '',
  })
  const [manualError, setManualError] = useState('')

  // Shared review/save state
  const [recipe, setRecipe] = useState(null)
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (window._sharedUrl) setUrl(window._sharedUrl)
  }, [])

  // ── Tab switch ────────────────────────────────────────────────────────────
  const switchTab = (t) => {
    setTab(t)
    setError('')
    setJsonError('')
    setManualError('')
  }

  // ── JSON Import ───────────────────────────────────────────────────────────
  const validateJson = (text) => {
    setJsonText(text)
    setJsonError('')
    setJsonValid(false)
    if (!text.trim()) return
    try {
      const parsed = JSON.parse(text.trim())
      const required = ['title', 'ingredients', 'steps', 'base_servings']
      const missing = required.filter(k => !parsed[k])
      if (missing.length) {
        setJsonError(`Missing required fields: ${missing.join(', ')}`)
        return
      }
      if (!Array.isArray(parsed.ingredients) || !Array.isArray(parsed.steps)) {
        setJsonError('ingredients and steps must be arrays')
        return
      }
      setJsonValid(true)
    } catch {
      setJsonError('Invalid JSON — check for missing commas or brackets')
    }
  }

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonText.trim())
      setRecipe(parsed)
      setStep('review')
    } catch {
      setJsonError('Could not parse JSON')
    }
  }

  // ── Instagram extraction ──────────────────────────────────────────────────
  const extractRecipe = async () => {
    if (!url.trim() && !caption.trim()) {
      setError('Paste an Instagram URL or add some context')
      return
    }
    setError('')
    setStep('extracting')
    try {
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), caption: caption.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction failed')
      setRecipe({ ...data.recipe, source_url: url.trim() })
      setStep('review')
    } catch (err) {
      setError(err.message)
      setStep('paste')
    }
  }

  // ── Manual entry → review ─────────────────────────────────────────────────
  const submitManual = () => {
    if (!manual.title.trim()) { setManualError('Recipe title is required'); return }
    const filledIngredients = manual.ingredients.filter(i => i.name.trim())
    if (!filledIngredients.length) { setManualError('Add at least one ingredient'); return }
    const filledSteps = manual.steps.filter(s => s.instruction.trim())
    if (!filledSteps.length) { setManualError('Add at least one step'); return }
    setManualError('')
    setRecipe({
      title: manual.title.trim(),
      description: manual.description.trim(),
      cuisine: manual.cuisine.trim(),
      prep_time_mins: parseInt(manual.prep_time_mins) || 0,
      cook_time_mins: parseInt(manual.cook_time_mins) || 0,
      base_servings: parseInt(manual.base_servings) || 2,
      ingredients: filledIngredients.map(i => ({
        amount: parseFloat(i.amount) || 0,
        unit: i.unit.trim(),
        name: i.name.trim(),
      })),
      steps: filledSteps.map((s, idx) => ({ step: idx + 1, instruction: s.instruction.trim() })),
      tags: manual.tags ? manual.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      tips: [],
      source_url: '',
    })
    setStep('review')
  }

  // ── Save to Supabase ──────────────────────────────────────────────────────
  const saveRecipe = async () => {
    setStep('saving')
    try {
      let share_slug = null
      if (isPublic) {
        share_slug = recipe.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 40) + '-' + Math.random().toString(36).substring(2, 6)
      }
      const { error } = await supabase.from('recipes').insert([{
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        prep_time_mins: recipe.prep_time_mins,
        cook_time_mins: recipe.cook_time_mins,
        base_servings: recipe.base_servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        tags: recipe.tags,
        tips: recipe.tips,
        source_url: recipe.source_url,
        is_public: isPublic,
        share_slug
      }])
      if (error) throw error
      setStep('done')
      setTimeout(() => { onSaved(); onClose() }, 1500)
    } catch (err) {
      setError(err.message)
      setStep('review')
    }
  }

  // ── Review helpers ────────────────────────────────────────────────────────
  const updateIngredient = (i, field, value) => {
    const updated = [...recipe.ingredients]
    updated[i] = { ...updated[i], [field]: field === 'amount' ? parseFloat(value) || 0 : value }
    setRecipe({ ...recipe, ingredients: updated })
  }
  const removeIngredient = (i) =>
    setRecipe({ ...recipe, ingredients: recipe.ingredients.filter((_, idx) => idx !== i) })
  const addIngredient = () =>
    setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { amount: 0, unit: '', name: '' }] })
  const updateStep = (i, value) => {
    const updated = [...recipe.steps]
    updated[i] = { ...updated[i], instruction: value }
    setRecipe({ ...recipe, steps: updated })
  }
  const removeStep = (i) =>
    setRecipe({ ...recipe, steps: recipe.steps.filter((_, idx) => idx !== i) })
  const addStep = () =>
    setRecipe({ ...recipe, steps: [...recipe.steps, { step: recipe.steps.length + 1, instruction: '' }] })

  // ── Manual form helpers ───────────────────────────────────────────────────
  const updateManualIng = (i, field, value) => {
    const updated = [...manual.ingredients]
    updated[i] = { ...updated[i], [field]: value }
    setManual({ ...manual, ingredients: updated })
  }
  const removeManualIng = (i) => {
    if (manual.ingredients.length === 1) return
    setManual({ ...manual, ingredients: manual.ingredients.filter((_, idx) => idx !== i) })
  }
  const addManualIng = () =>
    setManual({ ...manual, ingredients: [...manual.ingredients, { amount: '', unit: '', name: '' }] })
  const updateManualStep = (i, value) => {
    const updated = [...manual.steps]
    updated[i] = { instruction: value }
    setManual({ ...manual, steps: updated })
  }
  const removeManualStep = (i) => {
    if (manual.steps.length === 1) return
    setManual({ ...manual, steps: manual.steps.filter((_, idx) => idx !== i) })
  }
  const addManualStep = () =>
    setManual({ ...manual, steps: [...manual.steps, { instruction: '' }] })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="modal-header">
          <div className="modal-title">
            {step === 'extracting' && <><Sparkles size={18} /> Extracting recipe...</>}
            {step === 'review'     && <><ChefHat  size={18} /> Review &amp; save</>}
            {step === 'done'       && <><ChefHat  size={18} /> Saved!</>}
            {step === 'paste'      && <><ChefHat  size={18} /> Add recipe</>}
            {step === 'saving'     && <><Save     size={18} /> Saving...</>}
          </div>
          {step !== 'extracting' && step !== 'saving' && step !== 'done' && (
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
          )}
        </div>

        {/* ── Tab bar (paste step only) ───────────────────────────────────── */}
        {step === 'paste' && (
          <div className="modal-tabs">
            <button
              className={`modal-tab ${tab === 'instagram' ? 'active' : ''}`}
              onClick={() => switchTab('instagram')}
            >
              <Instagram size={15} /> Instagram
            </button>
            <button
              className={`modal-tab ${tab === 'json' ? 'active' : ''}`}
              onClick={() => switchTab('json')}
            >
              <FileJson size={15} /> Import JSON
            </button>
            <button
              className={`modal-tab ${tab === 'manual' ? 'active' : ''}`}
              onClick={() => switchTab('manual')}
            >
              <PenLine size={15} /> Manual
            </button>
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="modal-body">

          {/* ── PASTE: Instagram tab ─────────────────────────────────────── */}
          {step === 'paste' && tab === 'instagram' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="paste-step">
              <div className="field">
                <label>Instagram URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  autoFocus
                />
                <span className="field-hint">Share from Instagram → Copy Link, then paste here</span>
              </div>
              <div className="field">
                <label>Caption / Context <span className="optional">(optional but helps)</span></label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Paste the post caption, or describe the dish..."
                  rows={3}
                />
              </div>
              {error && <div className="error-banner"><AlertCircle size={15} /> {error}</div>}
              <button className="btn-primary full" onClick={extractRecipe}>
                <Sparkles size={16} /> Extract Recipe with AI
              </button>
            </motion.div>
          )}

          {/* ── PASTE: JSON import tab ───────────────────────────────────── */}
          {step === 'paste' && tab === 'json' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="paste-step">
              <div className="json-instructions">
                <p>Use this prompt in Claude or ChatGPT, then paste the JSON output below:</p>
                <div className="json-prompt-box">
                  <code>
                    Give me a detailed recipe for [DISH NAME]. Return only valid JSON with these
                    fields: title, description, cuisine, prep_time_mins, cook_time_mins,
                    base_servings, tags (array), ingredients (array of {'{'} name, amount (number),
                    unit, notes {'}'}), steps (array of {'{'} order, title, instruction,
                    timer_mins {'}'}), tips (array). Use metric units. No markdown, no explanation.
                  </code>
                  <button
                    className="json-copy-btn"
                    onClick={() => navigator.clipboard.writeText(
                      'Give me a detailed recipe for [DISH NAME]. Return only valid JSON with these fields: title, description, cuisine, prep_time_mins, cook_time_mins, base_servings, tags (array), ingredients (array of { name, amount (number), unit, notes }), steps (array of { order, title, instruction, timer_mins }), tips (array). Use metric units. No markdown, no explanation.'
                    )}
                  >
                    Copy prompt
                  </button>
                </div>
              </div>

              <div className="field">
                <label>
                  Paste JSON here
                  {jsonValid && (
                    <span className="json-valid-badge"><CheckCircle2 size={13} /> Valid</span>
                  )}
                </label>
                <textarea
                  value={jsonText}
                  onChange={e => validateJson(e.target.value)}
                  placeholder={'{\n  "title": "Pasta Arrabiata",\n  "ingredients": [...],\n  ...\n}'}
                  rows={10}
                  className={jsonValid ? 'valid' : jsonError ? 'invalid' : ''}
                  spellCheck={false}
                  autoFocus
                />
              </div>

              {jsonError && <div className="error-banner"><AlertCircle size={15} /> {jsonError}</div>}

              <button className="btn-primary full" onClick={importJson} disabled={!jsonValid}>
                <FileJson size={16} /> Import Recipe
              </button>
            </motion.div>
          )}

          {/* ── PASTE: Manual entry tab ──────────────────────────────────── */}
          {step === 'paste' && tab === 'manual' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="paste-step">

              <div className="field">
                <label>Recipe Title <span className="required">*</span></label>
                <input
                  type="text"
                  value={manual.title}
                  onChange={e => setManual({ ...manual, title: e.target.value })}
                  placeholder="e.g. Grandma's Pasta al Pomodoro"
                  autoFocus
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Cuisine</label>
                  <input
                    type="text"
                    value={manual.cuisine}
                    onChange={e => setManual({ ...manual, cuisine: e.target.value })}
                    placeholder="Italian, Indian…"
                  />
                </div>
                <div className="field field-sm">
                  <label>Servings</label>
                  <input
                    type="number" min={1}
                    value={manual.base_servings}
                    onChange={e => setManual({ ...manual, base_servings: e.target.value })}
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label><Clock size={13} /> Prep (min)</label>
                  <input
                    type="number" min={0}
                    value={manual.prep_time_mins}
                    onChange={e => setManual({ ...manual, prep_time_mins: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="field">
                  <label><Clock size={13} /> Cook (min)</label>
                  <input
                    type="number" min={0}
                    value={manual.cook_time_mins}
                    onChange={e => setManual({ ...manual, cook_time_mins: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="field">
                <label>Description <span className="optional">(optional)</span></label>
                <textarea
                  value={manual.description}
                  onChange={e => setManual({ ...manual, description: e.target.value })}
                  placeholder="A short description of the dish..."
                  rows={2}
                />
              </div>

              {/* Ingredients */}
              <div className="manual-section">
                <div className="manual-section-header">
                  <h4>Ingredients <span className="required">*</span></h4>
                  <button className="btn-add-row" onClick={addManualIng}><Plus size={13} /> Add</button>
                </div>
                <div className="ingredients-editor">
                  {manual.ingredients.map((ing, i) => (
                    <div key={i} className="ing-editor-row">
                      <input
                        className="ing-amount" type="number"
                        value={ing.amount}
                        onChange={e => updateManualIng(i, 'amount', e.target.value)}
                        placeholder="qty"
                      />
                      <input
                        className="ing-unit"
                        value={ing.unit}
                        onChange={e => updateManualIng(i, 'unit', e.target.value)}
                        placeholder="unit"
                      />
                      <input
                        className="ing-name"
                        value={ing.name}
                        onChange={e => updateManualIng(i, 'name', e.target.value)}
                        placeholder="ingredient name"
                      />
                      <button
                        className="ing-remove"
                        onClick={() => removeManualIng(i)}
                        disabled={manual.ingredients.length === 1}
                      ><Minus size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="manual-section">
                <div className="manual-section-header">
                  <h4>Steps <span className="required">*</span></h4>
                  <button className="btn-add-row" onClick={addManualStep}><Plus size={13} /> Add</button>
                </div>
                <div className="steps-editor">
                  {manual.steps.map((s, i) => (
                    <div key={i} className="step-editor-row">
                      <span className="step-bubble">{i + 1}</span>
                      <textarea
                        value={s.instruction}
                        onChange={e => updateManualStep(i, e.target.value)}
                        placeholder={`Step ${i + 1}…`}
                        rows={2}
                      />
                      <button
                        className="ing-remove"
                        onClick={() => removeManualStep(i)}
                        disabled={manual.steps.length === 1}
                      ><Minus size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Tags <span className="optional">(comma-separated)</span></label>
                <input
                  type="text"
                  value={manual.tags}
                  onChange={e => setManual({ ...manual, tags: e.target.value })}
                  placeholder="vegetarian, quick, pasta"
                />
              </div>

              {manualError && <div className="error-banner"><AlertCircle size={15} /> {manualError}</div>}

              <button className="btn-primary full" onClick={submitManual}>
                <ChefHat size={16} /> Review &amp; Save
              </button>
            </motion.div>
          )}

          {/* ── EXTRACTING ──────────────────────────────────────────────── */}
          {step === 'extracting' && (
            <motion.div className="extracting-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="extract-animation">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <ChefHat size={48} />
                </motion.div>
              </div>
              <p>Claude is reading the recipe...</p>
              <span className="extract-sub">Extracting ingredients, steps &amp; timing</span>
            </motion.div>
          )}

          {/* ── REVIEW ──────────────────────────────────────────────────── */}
          {step === 'review' && recipe && (
            <motion.div className="review-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="review-title-row">
                <input
                  className="review-title"
                  value={recipe.title}
                  onChange={e => setRecipe({ ...recipe, title: e.target.value })}
                />
              </div>

              <div className="review-meta-row">
                <div className="review-meta-item">
                  <Clock size={14} />
                  <input
                    type="number"
                    value={recipe.prep_time_mins || ''}
                    onChange={e => setRecipe({ ...recipe, prep_time_mins: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                  <span>min prep</span>
                </div>
                <div className="review-meta-item">
                  <Clock size={14} />
                  <input
                    type="number"
                    value={recipe.cook_time_mins || ''}
                    onChange={e => setRecipe({ ...recipe, cook_time_mins: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                  <span>min cook</span>
                </div>
                <div className="review-meta-item">
                  <Users size={14} />
                  <input
                    type="number" min={1} max={20}
                    value={recipe.base_servings}
                    onChange={e => setRecipe({ ...recipe, base_servings: parseInt(e.target.value) })}
                  />
                  <span>servings</span>
                </div>
              </div>

              {/* Ingredients */}
              <div className="review-section">
                <div className="review-section-header">
                  <h4>Ingredients <span>({recipe.ingredients?.length})</span></h4>
                  <button className="btn-add-row" onClick={addIngredient}><Plus size={13} /> Add</button>
                </div>
                <div className="ingredients-editor">
                  {recipe.ingredients?.map((ing, i) => (
                    <div key={i} className="ing-editor-row">
                      <input
                        className="ing-amount" type="number"
                        value={ing.amount}
                        onChange={e => updateIngredient(i, 'amount', e.target.value)}
                      />
                      <input
                        className="ing-unit"
                        value={ing.unit || ''}
                        onChange={e => updateIngredient(i, 'unit', e.target.value)}
                        placeholder="unit"
                      />
                      <input
                        className="ing-name"
                        value={ing.name}
                        onChange={e => updateIngredient(i, 'name', e.target.value)}
                      />
                      <button className="ing-remove" onClick={() => removeIngredient(i)}>
                        <Minus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="review-section">
                <div className="review-section-header">
                  <h4>Steps <span>({recipe.steps?.length})</span></h4>
                  <button className="btn-add-row" onClick={addStep}><Plus size={13} /> Add</button>
                </div>
                <div className="steps-editor">
                  {recipe.steps?.map((s, i) => (
                    <div key={i} className="step-editor-row">
                      <span className="step-bubble">{i + 1}</span>
                      <textarea
                        value={s.instruction}
                        onChange={e => updateStep(i, e.target.value)}
                        rows={2}
                      />
                      <button className="ing-remove" onClick={() => removeStep(i)}>
                        <Minus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="review-public-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                  />
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                  Make publicly shareable
                </label>
                <p className="toggle-hint">
                  {isPublic ? 'Anyone with the link can view this recipe' : 'Only visible to you in the vault'}
                </p>
              </div>

              {error && <div className="error-banner"><AlertCircle size={15} /> {error}</div>}

              <div className="review-actions">
                <button className="btn-secondary" onClick={() => { setStep('paste'); setRecipe(null) }}>
                  ← Back
                </button>
                <button className="btn-primary" onClick={saveRecipe}>
                  <Save size={16} /> Save to Vault
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SAVING ──────────────────────────────────────────────────── */}
          {step === 'saving' && (
            <motion.div className="extracting-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="extract-animation">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Save size={48} />
                </motion.div>
              </div>
              <p>Saving to vault...</p>
            </motion.div>
          )}

          {/* ── DONE ────────────────────────────────────────────────────── */}
          {step === 'done' && (
            <motion.div className="done-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <ChefHat size={64} />
              </motion.div>
              <p>Recipe saved!</p>
            </motion.div>
          )}

        </div>
      </motion.div>
    </motion.div>
  )
}

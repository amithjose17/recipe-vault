# 🍳 Recipe Vault — kitchen.brokeapp.in

A private recipe vault for saving Instagram recipe videos. Extract recipes with Claude AI, customise serving sizes with a slider, and optionally share a public link.

---

## 🚀 Deployment Guide (30–45 minutes)

### Step 1 — Supabase Database (5 mins)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `recipe-vault`, choose a region close to India
3. Once created → **SQL Editor** → **New Query**
4. Paste the contents of `supabase-schema.sql` → **Run**
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `VITE_SUPABASE_URL`
   - `anon public` key → this is your `VITE_SUPABASE_ANON_KEY`

---

### Step 2 — Deploy to Vercel (10 mins)

1. Push this project to a GitHub repo (private is fine)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Framework preset: **Vite**
4. Add these **Environment Variables**:

```
VITE_SUPABASE_URL         = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY    = eyJh...
ANTHROPIC_API_KEY         = sk-ant-...
VITE_VAULT_PASSWORD       = your-secret-password
```

5. Deploy! You'll get a `*.vercel.app` URL — test it works before adding the domain.

---

### Step 3 — Add subdomain on GoDaddy (10 mins)

1. Log in to [GoDaddy](https://godaddy.com) → **My Products** → **brokeapp.in** → **DNS**
2. Add a new **CNAME** record:
   - **Type**: CNAME
   - **Name**: `kitchen`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 600 (or default)
3. Save it

Then in **Vercel**:
1. Go to your project → **Settings → Domains**
2. Add `kitchen.brokeapp.in`
3. Vercel will verify the CNAME (takes 1–30 mins)

✅ Your vault will be live at **https://kitchen.brokeapp.in**

---

### Step 4 — Install as PWA on your phone (2 mins)

**iPhone:**
1. Open `kitchen.brokeapp.in` in Safari
2. Tap **Share** → **Add to Home Screen**
3. Done — it's now an app icon!

**Android:**
1. Open in Chrome
2. Tap the **⋮ menu** → **Add to Home Screen**

---

## 📱 How to share from Instagram

1. Find a recipe video on Instagram
2. Tap **Share** → **Copy Link** (or scroll to find Recipe Vault if you added it as a share target)
3. Open the Recipe Vault app
4. Tap **+ Add Recipe** → paste the URL
5. Optionally paste the caption for better results
6. Tap **Extract Recipe with AI** → review → save!

---

## 🔗 Sharing recipes publicly

In your dashboard, each recipe card has a **Public/Private** toggle.
- Set to **Public** → a share link is generated
- Share the link — anyone can view the recipe + use the serving slider
- Set back to **Private** anytime to revoke access

Public recipe URLs look like: `kitchen.brokeapp.in/recipe/pasta-arrabiata-a1b2`

---

## 🏗️ Project Structure

```
recipe-vault/
├── api/
│   └── extract-recipe.js     # Vercel Edge Function — calls Claude API
├── src/
│   ├── lib/
│   │   ├── supabase.js        # Supabase client
│   │   └── auth.jsx           # Password auth context
│   ├── pages/
│   │   ├── Login.jsx          # Password gate
│   │   ├── Dashboard.jsx      # Private recipe vault
│   │   ├── RecipePage.jsx     # Public recipe view + slider
│   │   └── ShareTarget.jsx    # PWA share handler
│   ├── components/
│   │   ├── RecipeCard.jsx     # Dashboard recipe card
│   │   └── AddRecipeModal.jsx # Add/extract recipe flow
│   ├── App.jsx                # Router
│   ├── main.jsx               # Entry point
│   └── styles.css             # All styles
├── supabase-schema.sql        # Run in Supabase SQL Editor
├── vercel.json                # Vercel routing config
├── vite.config.js             # Vite + PWA config
└── .env.example               # Environment variables template
```

---

## 🔒 Security Notes

- The vault password is stored as a plain string in env vars — fine for personal use
- Supabase RLS is enabled; the anon key only exposes what policies allow
- Public recipes are readable by anyone with the link; private ones are not
- For production hardening, consider adding Supabase Auth

---

## 💡 Tips

- **Better extraction**: Always paste the Instagram caption alongside the URL — Claude gets much more context
- **Serving slider**: Goes from 1–20 servings; all ingredient amounts scale proportionally
- **Step tracking**: Tap any step in the recipe to mark it as done (great for cooking mode)

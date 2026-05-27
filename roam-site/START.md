# Running & Deploying Roam

## Run locally right now (2 steps)

```bash
cd "path/to/roam-site"

# 1. Download the real Supabase library (one-time)
node scripts/vendor-supabase.mjs

# 2. Start the dev server
npm run dev
```

Then open **http://localhost:4173** in your browser.

> The app also works by just double-clicking `index.html` directly —
> but some browsers block local audio file loading over file://,
> so the local server is better.

## Deploy to Vercel (free, permanent URL)

```bash
# Install Vercel CLI once
npm install -g vercel

# Inside roam-site/
node scripts/vendor-supabase.mjs   # get real Supabase first
vercel                              # follow prompts → deploys in ~30 sec
```

Your app will be live at `https://roam-site-xxx.vercel.app`.

## Cloud sync (optional)

1. Create a free Supabase project at https://supabase.com
2. Create a table: `roam_user_state` with columns `user_id` (text PK), `payload` (jsonb), `updated_at` (timestamptz)
3. In the app's **Cloud Sync** card, paste your project URL + anon key, then Sign Up / Sign In
4. Use **Push Sync** to save to cloud, **Pull Sync** to restore on another device

## What works without Supabase

Everything except cloud sync:
- Sessions, dancers, sections, assignments — all saved to localStorage automatically
- Media Lab (music player, video player, A-B loop, speed, BPM)
- References, Takes log, Analytics
- Share Pack (copy/paste JSON to share with teammates)
- i18n (English, 简体中文, 한국어, 日本語, ខ្មែរ)

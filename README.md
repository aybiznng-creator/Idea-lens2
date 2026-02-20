# IdeaLens — Startup Idea Evaluator

> AI-powered startup idea evaluator · Node.js + Express + OpenAI

---

## 📁 Project Structure

```
idealens/
├── server.js          ← Express backend + OpenAI integration
├── package.json       ← Dependencies, scripts, Node engine version
├── railway.toml       ← Railway auto-deploy config
├── .env               ← Local secrets only (never commit this)
├── .gitignore         ← Excludes node_modules/ and .env
└── public/
    └── index.html     ← Full frontend UI  ← MUST be committed to GitHub
```

---

## 🚀 Deploy to Railway (Step-by-Step)

### 1 — Push to GitHub

```bash
# In your project folder:
git init
git add .
git status            # ← Confirm public/index.html appears in the list!
git commit -m "Initial commit: IdeaLens"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> ⚠️ If `public/index.html` is NOT in the `git status` list, the folder is
> not being tracked. Check that `public/` is not in your `.gitignore`.

---

### 2 — Create a Railway Project

1. Go to **https://railway.app** and sign in (GitHub login recommended)
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your repository
5. Railway detects Node.js automatically via `package.json`

---

### 3 — Add Your OpenAI API Key

In your Railway project dashboard:

1. Click your service → **"Variables"** tab
2. Click **"New Variable"** and add:

   | Variable Name    | Value                   |
   |------------------|-------------------------|
   | `OPENAI_API_KEY` | `sk-...your-key-here...`|

3. Railway will **automatically redeploy** after saving

---

### 4 — Get Your Live URL

1. Go to your service → **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. Your app is live at `https://your-app-name.up.railway.app` 🎉

---

## 💻 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Add your API key to .env
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# 3. Start development server
npm run dev
# or: node server.js

# 4. Open in browser
open http://localhost:3000
```

---

## ✅ Startup Log (what to look for)

When the server starts, you should see:

```
─────────────────────────────────────
  🚀 IdeaLens server started
  Port      : 3000
  Env       : development
  Public dir: /path/to/public
  index.html: ✅ found
  API Key   : ✅ set
─────────────────────────────────────
```

If you see `❌` next to `index.html` or `API Key`, fix those before testing.

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot GET /` | `public/index.html` missing from GitHub. Run `git status` to verify it's tracked. |
| `Invalid OpenAI API key` | Add `OPENAI_API_KEY` in Railway → Variables tab |
| App crashes on start | Check Railway logs — look for the startup checklist output |
| Blank page on Railway | Confirm `public/` folder is committed (not in `.gitignore`) |
| Rate limit error | Your OpenAI account has hit its quota — wait or upgrade plan |

// ─────────────────────────────────────────────────────────────
//  IdeaLens — server.js
//  Optimised for Railway.app deployment
// ─────────────────────────────────────────────────────────────

// Load .env only in local development; Railway injects env vars directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const OpenAI  = require('openai');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Railway automatically sets PORT — never hard-code it
const PORT = process.env.PORT || 3000;

// ── Validate API key on startup ────────────────────────────────
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY is not set. Add it in Railway → Variables tab.');
}

// ── OpenAI ────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the public/ folder as static assets
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

// ── Health check ──────────────────────────────────────────────
// Railway can optionally ping this to verify the service is up
app.get('/health', (_req, res) => {
  res.status(200).json({
    status : 'ok',
    service: 'idealens',
    time   : new Date().toISOString(),
  });
});

// ── Root route — serve index.html ─────────────────────────────
app.get('/', (_req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(500).send(`
    <h2 style="font-family:sans-serif;color:#c00">⚠ Setup Error</h2>
    <p style="font-family:sans-serif">
      <code>public/index.html</code> is missing.<br><br>
      Make sure the <strong>public/</strong> folder is committed to your
      GitHub repo and is <em>not</em> listed in <code>.gitignore</code>.
    </p>
  `);
});

// ── POST /evaluate — core AI endpoint ─────────────────────────
app.post('/evaluate', async (req, res) => {
  const { ideaDescription, targetAudience, pricingModel } = req.body;

  // Input validation
  if (!ideaDescription?.trim() || !targetAudience?.trim() || !pricingModel?.trim()) {
    return res.status(400).json({
      error: 'All three fields are required: ideaDescription, targetAudience, pricingModel.',
    });
  }

  const prompt = `
You are an expert startup advisor and business analyst.
Evaluate the startup idea below and respond ONLY with a valid JSON object.
Do NOT include any explanation, markdown, or code fences — pure JSON only.

Startup Idea:
- Description   : ${ideaDescription.trim()}
- Target Audience: ${targetAudience.trim()}
- Pricing Model  : ${pricingModel.trim()}

Required JSON format:
{
  "marketClarityScore": <integer 1-10>,
  "riskFactors": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "monetizationSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "suggestedMVPFeatures": ["<feature 1>", "<feature 2>", "<feature 3>", "<feature 4>"]
}
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model      : 'gpt-3.5-turbo',
      messages   : [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens : 800,
    });

    const raw     = completion.choices[0].message.content.trim();
    // Strip accidental markdown code fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const result  = JSON.parse(cleaned);

    return res.json(result);

  } catch (err) {
    console.error('[/evaluate] Error:', err.message);

    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
    }
    if (err.status === 401) {
      return res.status(500).json({ error: 'Invalid OpenAI API key. Add OPENAI_API_KEY in Railway → Variables.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'OpenAI rate limit hit. Wait a moment and try again.' });
    }
    if (err.status === 500 || err.status === 503) {
      return res.status(502).json({ error: 'OpenAI service is temporarily unavailable. Try again shortly.' });
    }

    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Catch-all (keeps SPA from 404-ing on refresh) ─────────────
app.get('*', (_req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(404).send('Not found');
});

// ── Start server ──────────────────────────────────────────────
// Railway requires listening on 0.0.0.0 (not localhost/127.0.0.1)
app.listen(PORT, '0.0.0.0', () => {
  console.log('─────────────────────────────────────');
  console.log('  🚀 IdeaLens server started');
  console.log(`  Port      : ${PORT}`);
  console.log(`  Env       : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Public dir: ${PUBLIC_DIR}`);
  console.log(`  index.html: ${fs.existsSync(path.join(PUBLIC_DIR, 'index.html')) ? '✅ found' : '❌ MISSING — commit public/ to GitHub'}`);
  console.log(`  API Key   : ${process.env.OPENAI_API_KEY ? '✅ set' : '❌ NOT SET — add in Railway Variables'}`);
  console.log('─────────────────────────────────────');
});

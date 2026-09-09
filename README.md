# 🛡️ Friday — ScreenTime Gatekeeper AI

> **"Think before you scroll."**
> An AI-powered mindful screen-time gatekeeper that challenges doomscrolling, protects your focus, and promotes intentional digital habits using real LLMs (Google Gemini, OpenAI, Groq).

![Theme](https://img.shields.io/badge/Theme-Professional%20White-blue)
![AI Engine](https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI%20%7C%20Groq-purple)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript-emerald)
![Deployment](https://img.shields.io/badge/Deployment-Vercel%20Ready-black)

---

## 🌟 Features

* **🤖 Multi-Provider Real AI Engine**:
  * **Google Gemini** (Gemini 1.5 Flash / 2.0 Flash / 1.5 Pro) with free tier.
  * **Groq** (Llama 3.3 70B, Llama 3.1 8B) for lightning-fast responses.
  * **OpenAI** (GPT-4o Mini, GPT-4o).
  * **Simulated Demo Mode**: Runs locally without requiring any API key.
* **⚙️ In-App API Key Management**:
  * Click **"API Settings"** in the header to select your provider, enter an API key, choose a model, and adjust persona rigor.
  * Live **"🧪 Test Connection"** button for instant connectivity verification.
  * Stored securely in client `localStorage` with zero data leakage.
* **🛡️ Friday (Mindful Guardian AI)**:
  * Injects live daily usage metrics into AI context (Instagram: 52m, YouTube: 1h 15m, Gaming: 35m).
  * Evaluates intentional intent (*"I need Instagram for college project"*) and automatically grants **15-Minute Focus Passes** with live countdown timer.
  * Challenges boredom and suggests 2-minute offline alternatives (hydration, stretching, mindful pause).
* **📊 Today's Screen Time Dashboard**:
  * Real-time Focus Score gauge (**72/100**).
  * App usage breakdown with visual progress meters.
  * Active pass countdown status and gatekeeper rule reminders.
* **💾 Local Database Persistence**:
  * Automatically stores chat histories, pass history, and settings across sessions.

---

## 📁 Project Structure

```
├── index.html       # Semantic HTML layout, Chat panel, Dashboard & AI Settings Modal
├── style.css        # Modern glassmorphic & professional white design system
├── script.js        # Multi-provider AI API engine, SettingsManager & state machine
├── vercel.json      # Clean URL configuration & routing for Vercel
├── api/
│   └── chat.js      # Optional Vercel Serverless Function proxy
└── README.md        # Documentation & Deployment guide
```

---

## 🚀 Getting Started Locally

1. Open `index.html` directly in your browser, or start a local dev server:
   ```powershell
   npx serve .
   # or
   python -m http.server 3000
   ```
2. Open [`http://localhost:3000`](http://localhost:3000).
3. Click **"API Settings"** in the top-right header.
4. Select **Google Gemini**, paste your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey), and click **Save & Apply**.

---

## ⚡ Deploying to Vercel

### Option 1: Via GitHub (Recommended)
1. Commit & push your repository to GitHub:
   ```powershell
   git add .
   git commit -m "Add realistic AI API integration and Vercel support"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. (Optional) Set your environment variables in Vercel project settings:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `OPENAI_API_KEY`: Your OpenAI API key
4. Click **Deploy**.

### Option 2: Via Vercel CLI
```powershell
npx vercel
# To deploy directly to production:
npx vercel --prod
```

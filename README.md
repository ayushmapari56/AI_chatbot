# 🛡️ Friday — ScreenTime Gatekeeper AI

> **"Think before you scroll."**
> A modern, responsive conversational screen-time gatekeeper that challenges doomscrolling and promotes intentional digital habits.

![ScreenTime Gatekeeper Banner](https://img.shields.io/badge/Theme-Professional%20White-blue)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript-emerald)
![Database](https://img.shields.io/badge/Database-LocalStorage%20%2F%20IndexedDB%20%2B%20Firebase%20Ready-indigo)

---

## 🌟 Features

* **🤖 Friday (AI Mindful Guardian)**:
  * Automatic greeting on launch.
  * Natural conversational flows for app requests (*Instagram, YouTube, Gaming*).
  * Challenges boredom and suggests refreshing breaks (water, stretching, 5-minute pauses).
  * Evaluates productive intent (*"I need Instagram for college work"*) and grants **15-Minute Focus Passes** with real-time countdown.
* **📊 Today's Screen Time Dashboard**:
  * Real-time Focus Score ring (**72/100 - Fair Control**).
  * App usage breakdown (Instagram: 52m, YouTube: 1h 15m, Gaming: 35m).
  * Active pass badge & gatekeeper mindfulness tips.
* **💾 Integrated Database**:
  * Persistent storage for chat history, focus scores, and pass history across sessions.
  * Modular `DatabaseManager` with automatic fallback to `localStorage` / `IndexedDB` and ready-to-use Firebase Firestore connector.
* **🎨 Modern Professional White Aesthetic**:
  * Clean Apple / Notion-inspired interface with responsive layout for mobile, tablet, and desktop.
  * Smooth animations, dynamic typing indicator, and quick suggestion prompt pills.

---

## 📁 Project Structure

```
├── index.html       # Semantic HTML layout, Chat container & Usage Dashboard
├── style.css        # Professional white design system, responsive styles & animations
├── script.js        # Conversational engine, DatabaseManager & state management
└── README.md        # Project documentation
```

---

## 🚀 Getting Started

### 1. Run Locally
Simply open `index.html` in any modern web browser, or run a local HTTP server:

```powershell
python -m http.server 3000
```
Then visit [`http://localhost:3000`](http://localhost:3000).

---

## 🗄️ Database Architecture

The application includes an active **DatabaseManager** in `script.js`:
- **Default (Local DB)**: Automatically stores all chat messages, daily app usage logs, and focus pass timestamps in browser storage (`localStorage` / `IndexedDB`).
- **Cloud DB (Firebase Firestore / Supabase)**: Ready for cloud sync by configuring your credentials in `script.js`.

---

## 👤 Author & Repository
* **GitHub**: [ayushmapari56/AI_chatbot](https://github.com/ayushmapari56/AI_chatbot)

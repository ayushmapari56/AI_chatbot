/**
 * ScreenTime Gatekeeper — Interactive Chatbot & Mindful Guardian
 * Pure Vanilla JavaScript implementation with simulated AI logic
 * and extensible architecture for real AI API integration.
 */

// ==========================================
// 1. App Configuration & Demo Screen Time
// ==========================================
const SCREEN_TIME_DATA = {
  instagram: {
    name: 'Instagram',
    usageDisplay: '52 minutes',
    usageMinutes: 52,
    thresholdMinutes: 45,
    tag: 'Social Media'
  },
  youtube: {
    name: 'YouTube',
    usageDisplay: '1 hour 15 minutes',
    usageMinutes: 75,
    thresholdMinutes: 60,
    tag: 'Video Streaming'
  },
  gaming: {
    name: 'Gaming',
    usageDisplay: '35 minutes',
    usageMinutes: 35,
    thresholdMinutes: 30,
    tag: 'Entertainment'
  },
  focusScore: 72
};

// Architecture flag: Set to false and fill your API key in callExternalAIAPI to hook live AI
const CONFIG = {
  USE_SIMULATED_AI: true,
  TYPING_DELAY_MIN: 650,
  TYPING_DELAY_MAX: 1200,
  ENABLE_DB_SYNC: true
};

// ==========================================
// 2. Database Manager (Local + Cloud Connector)
// ==========================================
const DatabaseManager = {
  DB_KEY_MESSAGES: 'screentime_gatekeeper_messages_v1',
  DB_KEY_STATS: 'screentime_gatekeeper_stats_v1',
  DB_KEY_PASSES: 'screentime_gatekeeper_passes_v1',

  init() {
    try {
      if (!localStorage.getItem(this.DB_KEY_STATS)) {
        localStorage.setItem(this.DB_KEY_STATS, JSON.stringify(SCREEN_TIME_DATA));
      }
      this.updateStatusIndicator(true, 'Local Active');
    } catch (e) {
      console.warn('Storage unavailable:', e);
      this.updateStatusIndicator(false, 'DB Offline');
    }
  },

  updateStatusIndicator(online, label) {
    const pill = document.getElementById('dbStatusPill');
    if (pill) {
      pill.innerHTML = `<span class="db-dot" style="background: ${online ? '#22c55e' : '#ef4444'}"></span> DB: ${label}`;
    }
  },

  saveMessage(sender, text, options = {}) {
    try {
      const history = this.getMessages();
      const entry = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        sender,
        text,
        options,
        timestamp: new Date().toISOString()
      };
      history.push(entry);
      localStorage.setItem(this.DB_KEY_MESSAGES, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save message to database:', e);
    }
  },

  getMessages() {
    try {
      const data = localStorage.getItem(this.DB_KEY_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  clearChatHistory() {
    try {
      localStorage.removeItem(this.DB_KEY_MESSAGES);
    } catch (e) {}
  },

  logPassIssued(appName, durationMinutes) {
    try {
      const passes = this.getPasses();
      passes.push({
        id: 'pass_' + Date.now(),
        appName,
        durationMinutes,
        issuedAt: new Date().toISOString()
      });
      localStorage.setItem(this.DB_KEY_PASSES, JSON.stringify(passes));
    } catch (e) {}
  },

  getPasses() {
    try {
      const data = localStorage.getItem(this.DB_KEY_PASSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
};

// Conversation Context State
let conversationState = {
  activeApp: null, // 'instagram' | 'youtube' | 'gaming' | null
  lastTopic: null,
  passActive: false,
  passTimer: null
};

// ==========================================
// 3. DOM Elements
// ==========================================
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const typingIndicator = document.getElementById('typingIndicator');
const quickChips = document.getElementById('quickChips');
const resetChatBtn = document.getElementById('resetChatBtn');
const sessionStatusBadge = document.getElementById('sessionStatusBadge');
const passCardText = document.getElementById('passCardText');
const activePassBadge = document.getElementById('activePassBadge');
const passSubText = document.getElementById('passSubText');

// ==========================================
// 4. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  DatabaseManager.init();
  initChat();
  setupEventListeners();
});

/**
 * Initializes the chat feed (loads from DB or provides initial greeting)
 */
function initChat() {
  chatMessages.innerHTML = '';
  conversationState = {
    activeApp: null,
    lastTopic: null,
    passActive: false,
    passTimer: null
  };
  
  updatePassUI(false);

  const savedMessages = DatabaseManager.getMessages();
  if (savedMessages && savedMessages.length > 0) {
    // Restore persistent messages from database
    savedMessages.forEach(msg => {
      renderMessageNode(msg.sender, msg.text, msg.options, new Date(msg.timestamp));
    });
  } else {
    // Initial greeting required by prompt (with Friday persona)
    const initialGreeting = "Hey! 👋 I’m Friday, your ScreenTime Gatekeeper. Before you open a distracting app, tell me what you want to use it for.";
    
    appendMessage('ai', initialGreeting, {
      highlightText: "Tip: State the specific task you want to accomplish."
    });
  }
}

/**
 * Sets up user interaction listeners
 */
function setupEventListeners() {
  // Chat submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserSendMessage();
  });

  // Quick Chips
  quickChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const promptText = chip.getAttribute('data-prompt');
    if (promptText) {
      userInput.value = promptText;
      handleUserSendMessage();
    }
  });

  // Reset Button (clears DB messages & starts fresh)
  resetChatBtn.addEventListener('click', () => {
    DatabaseManager.clearChatHistory();
    initChat();
  });
}

// ==========================================
// 5. Message Rendering & Chat UI
// ==========================================

/**
 * Adds a chat bubble to the message stream and saves to DB
 */
function appendMessage(sender, text, options = {}) {
  // Save to database
  DatabaseManager.saveMessage(sender, text, options);
  renderMessageNode(sender, text, options, new Date());
}

/**
 * Renders a chat bubble node in the DOM
 */
function renderMessageNode(sender, text, options = {}, timestamp = new Date()) {
  const messageRow = document.createElement('div');
  messageRow.className = `message-row ${sender}-row`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = sender === 'ai' ? '🛡️' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  // Text content
  const textElem = document.createElement('p');
  textElem.textContent = text;
  bubble.appendChild(textElem);

  // Optional callout highlight
  if (options.highlightText) {
    const highlight = document.createElement('div');
    highlight.className = `bubble-highlight ${options.highlightType || ''}`;
    highlight.innerHTML = options.highlightText;
    bubble.appendChild(highlight);
  }

  // Timestamp
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = timeString;
  bubble.appendChild(meta);

  messageRow.appendChild(avatar);
  messageRow.appendChild(bubble);

  chatMessages.appendChild(messageRow);
  scrollToBottom();
}

function showTypingIndicator() {
  typingIndicator.classList.remove('hidden');
  scrollToBottom();
}

function hideTypingIndicator() {
  typingIndicator.classList.add('hidden');
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
// 5. User Input Handling & AI Dispatch
// ==========================================
async function handleUserSendMessage() {
  const rawText = userInput.value.trim();
  if (!rawText) return;

  // Clear input
  userInput.value = '';
  userInput.focus();

  // Render user message
  appendMessage('user', rawText);

  // Show typing indicator
  showTypingIndicator();

  // Random delay for human-like response rhythm
  const delay = Math.floor(Math.random() * (CONFIG.TYPING_DELAY_MAX - CONFIG.TYPING_DELAY_MIN + 1)) + CONFIG.TYPING_DELAY_MIN;

  setTimeout(async () => {
    try {
      let responseObj;
      if (CONFIG.USE_SIMULATED_AI) {
        responseObj = generateSimulatedResponse(rawText);
      } else {
        responseObj = await callExternalAIAPI(rawText);
      }

      hideTypingIndicator();
      
      appendMessage('ai', responseObj.text, {
        highlightText: responseObj.highlight,
        highlightType: responseObj.highlightType
      });

      if (responseObj.grantPass) {
        grantFocusPass(responseObj.appName || 'Selected App', responseObj.durationMinutes || 15);
      }

    } catch (err) {
      hideTypingIndicator();
      appendMessage('ai', "I'm having a little trouble thinking right now, but please take a mindful pause before opening any distracting app!");
    }
  }, delay);
}

// ==========================================
// 6. Intelligent Simulated Gatekeeper Logic
// ==========================================
function generateSimulatedResponse(input) {
  const text = input.toLowerCase();

  // Context: Detect mentioned apps
  if (text.includes('instagram') || text.includes('insta') || text.includes('reels') || text.includes('ig')) {
    conversationState.activeApp = 'instagram';
  } else if (text.includes('youtube') || text.includes('yt') || text.includes('shorts') || text.includes('video')) {
    conversationState.activeApp = 'youtube';
  } else if (text.includes('game') || text.includes('gaming') || text.includes('play')) {
    conversationState.activeApp = 'gaming';
  }

  const currentApp = conversationState.activeApp;

  // 1. Case: Intent is college work / study / work / assignment / project / promotion
  if (
    text.includes('college') ||
    text.includes('study') ||
    text.includes('work') ||
    text.includes('assignment') ||
    text.includes('project') ||
    text.includes('promotion') ||
    text.includes('research') ||
    text.includes('urgent') ||
    text.includes('homework')
  ) {
    const appName = currentApp ? SCREEN_TIME_DATA[currentApp]?.name : 'your app';
    return {
      text: `Got it 👍 If it’s for ${extractGoal(text) || 'college/productive work'}, you can use it. Try to keep the session focused and avoid unnecessary scrolling.`,
      highlight: `✅ <strong>15-Minute Focus Pass Issued</strong> for ${appName}. Notification will remind you when time is up.`,
      highlightType: 'emerald',
      grantPass: true,
      appName: appName,
      durationMinutes: 15
    };
  }

  // 2. Case: Boredom / aimless scrolling
  if (
    text.includes('bored') ||
    text.includes('boring') ||
    text.includes('nothing to do') ||
    text.includes('just scrolling') ||
    text.includes('killing time') ||
    text.includes('pass time')
  ) {
    if (currentApp === 'instagram') {
      return {
        text: `You've already spent ${SCREEN_TIME_DATA.instagram.usageDisplay} on Instagram today. 😅 Do you really want to spend another 20 minutes, or would you like a 10-minute break?`,
        highlight: `🧘 <strong>Gatekeeper Challenge:</strong> Drink a glass of water or stretch for 2 minutes instead.`,
        highlightType: 'amber'
      };
    } else if (currentApp === 'youtube') {
      return {
        text: `You're already at ${SCREEN_TIME_DATA.youtube.usageDisplay} on YouTube today. If you're bored, algorithm rabbit holes will swallow 40+ minutes before you notice.`,
        highlight: `⏳ <strong>Alternative:</strong> Try putting on a 5-minute music playlist without looking at the screen.`,
        highlightType: 'amber'
      };
    } else {
      return {
        text: "Boredom is your brain's cue to rest or create, not just consume. 💡 Take a 5-minute breather without screens, then decide if you really need it.",
        highlight: `🛡️ <strong>Screen Check:</strong> Your focus score is ${SCREEN_TIME_DATA.focusScore}/100 today. Protect it!`,
        highlightType: 'amber'
      };
    }
  }

  // 3. Case: "I want to open Instagram"
  if (text.includes('open instagram') || text.includes('use instagram') || (text.includes('instagram') && !text.includes('for'))) {
    return {
      text: "Sure. What do you need Instagram for?",
      highlight: `📊 <strong>Today's Stats:</strong> ${SCREEN_TIME_DATA.instagram.usageDisplay} used already.`,
      highlightType: ''
    };
  }

  // 4. Case: "I want to watch YouTube"
  if (text.includes('watch youtube') || text.includes('open youtube') || text.includes('youtube')) {
    return {
      text: `You've watched ${SCREEN_TIME_DATA.youtube.usageDisplay} on YouTube today. 🎬 Are you looking for a specific tutorial/lecture, or just browsing?`,
      highlight: `⚠️ You are approaching your 90-minute daily video budget.`,
      highlightType: 'amber'
    };
  }

  // 5. Case: "I want to play games"
  if (text.includes('play games') || text.includes('game') || text.includes('gaming')) {
    return {
      text: `Gaming is at ${SCREEN_TIME_DATA.gaming.usageDisplay} today. 🎮 If you want to unwind, set a hard limit of 20 minutes so you don't lose your evening.`,
      highlight: `⏱️ Tell me: "Give me a 20 min pass" when you are ready to start.`,
      highlightType: ''
    };
  }

  // 6. Case: User asks for a pass or timer directly
  if (text.includes('give me a pass') || text.includes('pass') || text.includes('timer') || text.includes('quick check') || text.includes('20 min') || text.includes('10 min')) {
    return {
      text: "Alright! I've logged an intentional unlock. Keep your session strictly on-task and lock your device once done.",
      highlight: "✅ <strong>15-Minute Pass Granted</strong>",
      highlightType: 'emerald',
      grantPass: true,
      appName: currentApp ? SCREEN_TIME_DATA[currentApp]?.name : 'Session',
      durationMinutes: 15
    };
  }

  // 7. Case: Greetings & pleasantries
  if (text.startsWith('hi') || text.startsWith('hello') || text.startsWith('hey')) {
    return {
      text: "Hey there! Ready to protect your focus? Name an app you want to open and what you plan to do.",
      highlight: null
    };
  }

  if (text.includes('thank') || text.includes('ok') || text.includes('okay') || text.includes('alright')) {
    return {
      text: "Always here to guard your time. Put the phone down and crush what you were doing! 🚀",
      highlight: null
    };
  }

  // Default fallback response
  return {
    text: `I hear you. Before jumping in, ask yourself: is this intentional or just muscle memory? What specific outcome do you need?`,
    highlight: `Current Daily Total: <strong>2h 42m</strong> across Instagram, YouTube & Gaming.`,
    highlightType: ''
  };
}

/**
 * Extracts goal phrasing from the user's message
 */
function extractGoal(str) {
  const match = str.match(/for (.*)/i);
  if (match && match[1]) {
    return match[1].replace(/[.!?]/g, '');
  }
  return null;
}

// ==========================================
// 7. Pass Management & UI State
// ==========================================
function grantFocusPass(appName, durationMinutes) {
  conversationState.passActive = true;
  updatePassUI(true, appName, durationMinutes);

  // Clear existing timer if any
  if (conversationState.passTimer) {
    clearInterval(conversationState.passTimer);
  }

  let remainingSeconds = durationMinutes * 60;
  
  conversationState.passTimer = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      clearInterval(conversationState.passTimer);
      updatePassUI(false);
      appendMessage('ai', `⏰ <strong>Pass Expired:</strong> Your ${durationMinutes}-minute session for ${appName} is up. Please close the app and step away for a minute!`, {
        highlightText: "Lock your screen to protect your focus score.",
        highlightType: 'amber'
      });
    } else {
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      if (passSubText) {
        passSubText.textContent = `Active for ${appName}: ${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`;
      }
    }
  }, 1000);
}

function updatePassUI(isActive, appName = '', minutes = 15) {
  if (isActive) {
    sessionStatusBadge.textContent = '🔓 Pass Granted';
    sessionStatusBadge.classList.add('passed');
    activePassBadge.classList.remove('hidden');
    passSubText.textContent = `Active for ${appName} (${minutes}m limit)`;
    passCardText.textContent = `Permission granted for intentional use. Stay focused on your primary task and avoid algorithmic feeds.`;
  } else {
    sessionStatusBadge.textContent = '🔒 Guarded Mode';
    sessionStatusBadge.classList.remove('passed');
    activePassBadge.classList.add('hidden');
    passCardText.textContent = `"Before reaching for your phone on autopilot, name the single reason for unlocking. 80% of regretful screen time begins with unintentional taps."`;
  }
}

// ==========================================
// 8. Extensible AI API Hook (Gemini / OpenAI)
// ==========================================
/**
 * Hook for plugging in real LLM APIs (e.g. Gemini 1.5 Flash / Pro)
 * Simply change CONFIG.USE_SIMULATED_AI to false when ready.
 */
async function callExternalAIAPI(userMessage) {
  /*
  const API_KEY = "YOUR_GEMINI_OR_OPENAI_API_KEY";
  const systemPrompt = `You are ScreenTime Gatekeeper. You talk to the user before they open distracting apps (Instagram, YouTube, Gaming).
  Current user stats today: Instagram: 52 min, YouTube: 1h 15m, Gaming: 35m. Focus Score: 72/100.
  Respond concisely (1-2 sentences), friendly, mindful, and gatekeep doomscrolling.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\nUser says: ${userMessage}` }]
      }]
    })
  });
  const data = await response.json();
  const reply = data.candidates[0].content.parts[0].text;
  return { text: reply, highlight: null };
  */

  // Fallback if not configured
  return generateSimulatedResponse(userMessage);
}

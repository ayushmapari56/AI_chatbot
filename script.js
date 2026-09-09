/**
 * ScreenTime Gatekeeper — Interactive Chatbot & Mindful Guardian
 * Supports Real AI API Integration (Google Gemini, OpenAI, Groq)
 * with local Key management, context-aware mindful persona, and Pass granting.
 */

// ==========================================
// 1. App Configuration & Live Screen Time Data
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

// Available AI Models Map
const PROVIDER_MODELS = {
  gemini: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast & Free Tier)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning)' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Ultra Fast)' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost-Effective)' },
    { id: 'gpt-4o', name: 'GPT-4o (Flagship Model)' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ],
  simulated: [
    { id: 'simulated-engine', name: 'Built-in Simulated Gatekeeper (No API Key)' }
  ]
};

const PROVIDER_HELP_LINKS = {
  gemini: { url: 'https://aistudio.google.com/app/apikey', text: 'Get free Gemini API Key ↗' },
  groq: { url: 'https://console.groq.com/keys', text: 'Get free Groq API Key ↗' },
  openai: { url: 'https://platform.openai.com/api-keys', text: 'Get OpenAI API Key ↗' },
  simulated: { url: '#', text: 'No API Key required' }
};

// ==========================================
// 2. Settings & API Key Manager
// ==========================================
const SettingsManager = {
  STORAGE_KEY: 'screentime_ai_settings_v2',

  defaults: {
    provider: 'simulated', // 'gemini' | 'groq' | 'openai' | 'simulated'
    apiKey: '',
    model: 'gemini-1.5-flash',
    persona: 'balanced' // 'balanced' | 'strict' | 'coach'
  },

  get() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
    } catch (e) {
      return { ...this.defaults };
    }
  },

  save(settings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings:', e);
    }
    this.updateHeaderUI();
  },

  updateHeaderUI() {
    const s = this.get();
    const pill = document.getElementById('activeProviderPill');
    const headerLabel = document.getElementById('headerProviderLabel');

    if (!pill) return;

    pill.className = 'provider-pill';

    if (s.provider === 'gemini' && s.apiKey) {
      pill.textContent = '✨ Gemini AI';
      pill.classList.add('live-gemini');
      if (headerLabel) headerLabel.textContent = 'Gemini Live';
    } else if (s.provider === 'groq' && s.apiKey) {
      pill.textContent = '⚡ Groq Llama';
      pill.classList.add('live-groq');
      if (headerLabel) headerLabel.textContent = 'Groq Live';
    } else if (s.provider === 'openai' && s.apiKey) {
      pill.textContent = '🤖 OpenAI GPT';
      pill.classList.add('live-openai');
      if (headerLabel) headerLabel.textContent = 'GPT Live';
    } else {
      pill.textContent = '✨ Demo Mode';
      if (headerLabel) headerLabel.textContent = 'API Settings';
    }
  }
};

// ==========================================
// 3. Database Manager (Local Chat History)
// ==========================================
const DatabaseManager = {
  DB_KEY_MESSAGES: 'screentime_gatekeeper_messages_v2',
  DB_KEY_STATS: 'screentime_gatekeeper_stats_v2',
  DB_KEY_PASSES: 'screentime_gatekeeper_passes_v2',

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
  activeApp: null,
  passActive: false,
  passTimer: null
};

// ==========================================
// 4. DOM Elements
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

// Modal Elements
const settingsModal = document.getElementById('settingsModal');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
const apiKeySection = document.getElementById('apiKeySection');
const apiKeyHelpLink = document.getElementById('apiKeyHelpLink');
const modelSelect = document.getElementById('modelSelect');
const modelSelectSection = document.getElementById('modelSelectSection');
const guardPersonaSelect = document.getElementById('guardPersonaSelect');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const testStatusBox = document.getElementById('testStatusBox');
const testStatusIcon = document.getElementById('testStatusIcon');
const testStatusText = document.getElementById('testStatusText');

// ==========================================
// 5. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  DatabaseManager.init();
  SettingsManager.updateHeaderUI();
  initChat();
  setupEventListeners();
  setupSettingsModalEvents();
});

/**
 * Initializes the chat feed (loads from DB or provides initial greeting)
 */
function initChat() {
  chatMessages.innerHTML = '';
  conversationState = {
    activeApp: null,
    passActive: false,
    passTimer: null
  };
  
  updatePassUI(false);

  const savedMessages = DatabaseManager.getMessages();
  if (savedMessages && savedMessages.length > 0) {
    savedMessages.forEach(msg => {
      renderMessageNode(msg.sender, msg.text, msg.options, new Date(msg.timestamp));
    });
  } else {
    const settings = SettingsManager.get();
    const isLiveAI = settings.provider !== 'simulated' && settings.apiKey;
    const initialGreeting = isLiveAI
      ? `Hey! 👋 I’m Friday, your live AI Gatekeeper. Tell me what app you'd like to open and what intentional goal you have.`
      : `Hey! 👋 I’m Friday, your ScreenTime Gatekeeper. Before you open a distracting app, tell me what you want to use it for.`;
    
    appendMessage('ai', initialGreeting, {
      highlightText: "💡 Tip: State a specific task or request a timed focus pass."
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

  // Reset Button
  resetChatBtn.addEventListener('click', () => {
    DatabaseManager.clearChatHistory();
    initChat();
  });
}

// ==========================================
// 6. Settings Modal Logic
// ==========================================
function setupSettingsModalEvents() {
  // Open modal
  openSettingsBtn.addEventListener('click', () => {
    populateSettingsForm();
    settingsModal.classList.remove('hidden');
  });

  // Close modal
  const closeModal = () => settingsModal.classList.add('hidden');
  closeSettingsBtn.addEventListener('click', closeModal);
  cancelSettingsBtn.addEventListener('click', closeModal);

  // Close on outside backdrop click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
  });

  // Toggle API key show/hide
  toggleApiKeyVisibility.addEventListener('click', () => {
    const isPass = apiKeyInput.type === 'password';
    apiKeyInput.type = isPass ? 'text' : 'password';
    toggleApiKeyVisibility.textContent = isPass ? '🙈' : '👁️';
  });

  // Provider Radio Change
  const providerRadios = document.querySelectorAll('input[name="aiProvider"]');
  providerRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      onProviderChange(e.target.value);
    });
  });

  // Test Connection Button
  testConnectionBtn.addEventListener('click', async () => {
    await runConnectionTest();
  });

  // Save Settings
  saveSettingsBtn.addEventListener('click', () => {
    const selectedProvider = document.querySelector('input[name="aiProvider"]:checked')?.value || 'simulated';
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const persona = guardPersonaSelect.value;

    SettingsManager.save({
      provider: selectedProvider,
      apiKey: key,
      model: model,
      persona: persona
    });

    closeModal();
    appendMessage('ai', `⚙️ AI Settings updated! Running on **${getProviderDisplayName(selectedProvider)}** (${model}). Let's keep your screen time mindful!`, {
      highlightText: selectedProvider !== 'simulated' ? '⚡ Live AI Protection Online' : '🛡️ Running on Simulated Demo Engine',
      highlightType: selectedProvider !== 'simulated' ? 'emerald' : ''
    });
  });
}

function getProviderDisplayName(provider) {
  switch (provider) {
    case 'gemini': return 'Google Gemini';
    case 'groq': return 'Groq (Llama 3.3)';
    case 'openai': return 'OpenAI';
    default: return 'Simulated Demo';
  }
}

function populateSettingsForm() {
  const current = SettingsManager.get();
  
  // Set provider radio
  const radio = document.querySelector(`input[name="aiProvider"][value="${current.provider}"]`);
  if (radio) radio.checked = true;

  apiKeyInput.value = current.apiKey || '';
  apiKeyInput.type = 'password';
  toggleApiKeyVisibility.textContent = '👁️';

  guardPersonaSelect.value = current.persona || 'balanced';

  onProviderChange(current.provider, current.model);

  // Reset test box
  testStatusBox.className = 'test-status-box hidden';
}

function onProviderChange(provider, preferredModel = null) {
  // Update help link
  const linkInfo = PROVIDER_HELP_LINKS[provider] || PROVIDER_HELP_LINKS.gemini;
  apiKeyHelpLink.href = linkInfo.url;
  apiKeyHelpLink.textContent = linkInfo.text;

  // Toggle API Key input visibility
  if (provider === 'simulated') {
    apiKeySection.style.display = 'none';
  } else {
    apiKeySection.style.display = 'flex';
  }

  // Populate models
  const models = PROVIDER_MODELS[provider] || [];
  modelSelect.innerHTML = '';
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    modelSelect.appendChild(opt);
  });

  if (preferredModel && models.some(m => m.id === preferredModel)) {
    modelSelect.value = preferredModel;
  }
}

async function runConnectionTest() {
  const provider = document.querySelector('input[name="aiProvider"]:checked')?.value || 'simulated';
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;

  testStatusBox.className = 'test-status-box testing';
  testStatusBox.classList.remove('hidden');
  testStatusIcon.textContent = '⏳';
  testStatusText.textContent = `Pinging ${getProviderDisplayName(provider)} API...`;

  if (provider === 'simulated') {
    setTimeout(() => {
      testStatusBox.className = 'test-status-box success';
      testStatusIcon.textContent = '✅';
      testStatusText.textContent = 'Simulated engine is ready (No key needed).';
    }, 400);
    return;
  }

  if (!apiKey) {
    testStatusBox.className = 'test-status-box error';
    testStatusIcon.textContent = '⚠️';
    testStatusText.textContent = 'Please enter an API key first.';
    return;
  }

  try {
    const result = await testAPIConnection(provider, apiKey, model);
    if (result.success) {
      testStatusBox.className = 'test-status-box success';
      testStatusIcon.textContent = '✅';
      testStatusText.textContent = `Connected successfully to ${result.modelName || model}!`;
    } else {
      testStatusBox.className = 'test-status-box error';
      testStatusIcon.textContent = '❌';
      testStatusText.textContent = `Connection failed: ${result.error}`;
    }
  } catch (e) {
    testStatusBox.className = 'test-status-box error';
    testStatusIcon.textContent = '❌';
    testStatusText.textContent = `Error: ${e.message || 'Network error'}`;
  }
}

// ==========================================
// 7. Message Rendering & Chat UI
// ==========================================
function appendMessage(sender, text, options = {}) {
  DatabaseManager.saveMessage(sender, text, options);
  renderMessageNode(sender, text, options, new Date());
}

function renderMessageNode(sender, text, options = {}, timestamp = new Date()) {
  const messageRow = document.createElement('div');
  messageRow.className = `message-row ${sender}-row`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = sender === 'ai' ? '🛡️' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  // Text content (with basic markdown parsing for bold/italic/links)
  const textElem = document.createElement('div');
  textElem.className = 'msg-text-content';
  textElem.innerHTML = formatMarkdown(text);
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

function formatMarkdown(str) {
  if (!str) return '';
  // Basic markdown formatting for rich responses
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
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
// 8. User Input Handling & AI Dispatch
// ==========================================
async function handleUserSendMessage() {
  const rawText = userInput.value.trim();
  if (!rawText) return;

  userInput.value = '';
  userInput.focus();

  // Render user message
  appendMessage('user', rawText);

  // Show typing indicator
  showTypingIndicator();

  const settings = SettingsManager.get();

  try {
    let responseObj;

    if (settings.provider !== 'simulated' && settings.apiKey) {
      // Call Live LLM
      responseObj = await callLiveAI(settings, rawText);
    } else {
      // Fallback to Simulated AI
      await new Promise(r => setTimeout(r, 650));
      responseObj = generateSimulatedResponse(rawText);
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
    console.error('AI Error:', err);
    appendMessage('ai', `⚠️ **AI Service Notice:** ${err.message || 'Could not connect to AI API.'}\n\nFalling back to simulated guard mode for your session.`, {
      highlightText: 'Tip: Check your API Key in Settings ⚙️',
      highlightType: 'amber'
    });
  }
}

// ==========================================
// 9. Live AI API Clients (Gemini, Groq, OpenAI)
// ==========================================
function buildSystemPrompt(persona) {
  let personaTone = "Balanced, mindful, conversational, and direct.";
  if (persona === 'strict') {
    personaTone = "Strict Stoic Guardian: Firm against mindless dopamine, challenge excuses directly, urge deep work.";
  } else if (persona === 'coach') {
    personaTone = "Empathetic Focus Coach: Warm, encouraging reflection, asking intentional questions.";
  }

  return `You are "Friday", an intelligent ScreenTime Gatekeeper and mindful digital habits AI assistant.
Your goal is to prevent doomscrolling and encourage intentional screen usage.

Current User Live Stats Today:
- Instagram: ${SCREEN_TIME_DATA.instagram.usageDisplay} (Threshold: 45 min)
- YouTube: ${SCREEN_TIME_DATA.youtube.usageDisplay} (Threshold: 60 min)
- Gaming: ${SCREEN_TIME_DATA.gaming.usageDisplay} (Threshold: 30 min)
- Focus Score: ${SCREEN_TIME_DATA.focusScore}/100

Behavior Rules:
1. Tone: ${personaTone}
2. Keep responses brief and punchy (1 to 3 sentences maximum).
3. If the user gives a legitimate, productive reason (e.g., college work, study, important communication, research) or explicitly asks for a timed session, grant them a pass by appending the tag: "[PASS: <appName>, <minutes>m]" (e.g. "[PASS: Instagram, 15m]").
4. If the user is just bored or doomscrolling, kindly challenge them and suggest a 2-minute offline alternative (drink water, stretch, take 3 deep breaths).
5. Address the user directly without robotic boilerplate.`;
}

async function callLiveAI(settings, userMessage) {
  const { provider, apiKey, model, persona } = settings;
  const systemPrompt = buildSystemPrompt(persona);

  // Build history context from last 6 messages
  const recentHistory = DatabaseManager.getMessages().slice(-6);

  if (provider === 'gemini') {
    return await callGeminiAPI(apiKey, model || 'gemini-1.5-flash', systemPrompt, recentHistory, userMessage);
  } else if (provider === 'groq') {
    return await callOpenAICompatibleAPI('https://api.groq.com/openai/v1/chat/completions', apiKey, model || 'llama-3.3-70b-versatile', systemPrompt, recentHistory, userMessage);
  } else if (provider === 'openai') {
    return await callOpenAICompatibleAPI('https://api.openai.com/v1/chat/completions', apiKey, model || 'gpt-4o-mini', systemPrompt, recentHistory, userMessage);
  }

  return generateSimulatedResponse(userMessage);
}

// Google Gemini REST API
async function callGeminiAPI(apiKey, model, systemPrompt, history, userMessage) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [];

  // Add past conversation turns
  history.forEach(msg => {
    contents.push({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    });
  });

  // Add latest user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = errorData.error?.message || `Gemini API returned status ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Let's stay mindful with your screen time.";
  return parseAIResponse(rawReply);
}

// OpenAI & Groq REST API (OpenAI compatible format)
async function callOpenAICompatibleAPI(endpoint, apiKey, model, systemPrompt, history, userMessage) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  history.forEach(msg => {
    messages.push({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.text
    });
  });

  messages.push({
    role: 'user',
    content: userMessage
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 250
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = errorData.error?.message || `API error (${response.status})`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawReply = data.choices?.[0]?.message?.content || "Let's stay mindful with your screen time.";
  return parseAIResponse(rawReply);
}

// Connection test utility
async function testAPIConnection(provider, apiKey, model) {
  if (provider === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping test' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error?.message || `HTTP ${res.status}` };
    }
    return { success: true, modelName: model };
  } else {
    const endpoint = provider === 'groq' 
      ? 'https://api.groq.com/openai/v1/chat/completions' 
      : 'https://api.openai.com/v1/chat/completions';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error?.message || `HTTP ${res.status}` };
    }
    return { success: true, modelName: model };
  }
}

// Parses tags like [PASS: Instagram, 15m] from LLM response
function parseAIResponse(rawText) {
  const passRegex = /\[PASS:\s*([^,\]]+),\s*(\d+)m?\]/i;
  const match = rawText.match(passRegex);

  let cleanText = rawText.replace(passRegex, '').trim();
  let grantPass = false;
  let appName = 'Focus App';
  let durationMinutes = 15;
  let highlight = null;
  let highlightType = '';

  if (match) {
    grantPass = true;
    appName = match[1].trim();
    durationMinutes = parseInt(match[2], 10) || 15;
    highlight = `✅ <strong>${durationMinutes}-Minute Pass Granted</strong> for ${appName}. Keep it intentional!`;
    highlightType = 'emerald';
  } else if (cleanText.toLowerCase().includes('pass granted') || cleanText.toLowerCase().includes('focus pass')) {
    grantPass = true;
    durationMinutes = 15;
    highlight = `✅ <strong>Focus Pass Issued</strong>. Timer activated.`;
    highlightType = 'emerald';
  }

  return {
    text: cleanText,
    highlight: highlight,
    highlightType: highlightType,
    grantPass: grantPass,
    appName: appName,
    durationMinutes: durationMinutes
  };
}

// ==========================================
// 10. Intelligent Simulated Gatekeeper Logic
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
    text.includes('nothing to do') ||
    text.includes('pass time') ||
    text.includes('kill time') ||
    text.includes('scroll')
  ) {
    if (currentApp === 'instagram') {
      return {
        text: `You've already spent ${SCREEN_TIME_DATA.instagram.usageDisplay} on Instagram today. Scrolling because you're bored usually leads to an hour of mindless reels.`,
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

  // 6. Case: Direct pass request
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

  return {
    text: `I hear you. Before jumping in, ask yourself: is this intentional or just muscle memory? What specific outcome do you need?`,
    highlight: `Current Daily Total: <strong>2h 42m</strong> across Instagram, YouTube & Gaming.`,
    highlightType: ''
  };
}

function extractGoal(str) {
  const match = str.match(/for (.*)/i);
  if (match && match[1]) {
    return match[1].replace(/[.!?]/g, '');
  }
  return null;
}

// ==========================================
// 11. Pass Management & Countdown State
// ==========================================
function grantFocusPass(appName, durationMinutes) {
  conversationState.passActive = true;
  updatePassUI(true, appName, durationMinutes);

  DatabaseManager.logPassIssued(appName, durationMinutes);

  if (conversationState.passTimer) {
    clearInterval(conversationState.passTimer);
  }

  let remainingSeconds = durationMinutes * 60;
  
  conversationState.passTimer = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      clearInterval(conversationState.passTimer);
      updatePassUI(false);
      appendMessage('ai', `⏰ <strong>Pass Expired:</strong> Your ${durationMinutes}-minute session for ${appName} is up. Please close the app and take a mindful breather!`, {
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

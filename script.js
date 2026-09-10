/**
 * ScreenTime Gatekeeper — Interactive Mindful AI Digital Coach
 * Supports Real AI API Integration (Google Gemini, OpenAI, Groq)
 * with Multi-Provider Key Storage, Intent Classification,
 * Decision Cards (ALLOW/LIMIT/BLOCK), Session Memory, and Focus Health tracking.
 */

// ==========================================
// 1. App Configuration & Live Screen Time Data
// ==========================================
const SCREEN_TIME_DATA = {
  instagram: {
    name: 'Instagram',
    usageDisplay: '52 min',
    usageMinutes: 52,
    thresholdMinutes: 45,
    tag: 'Social Media',
    reopensCount: 4,
    lastClosedAgo: '2m'
  },
  youtube: {
    name: 'YouTube',
    usageDisplay: '1h 15m',
    usageMinutes: 75,
    thresholdMinutes: 60,
    tag: 'Video Streaming',
    reopensCount: 2,
    lastClosedAgo: '15m'
  },
  gaming: {
    name: 'Gaming',
    usageDisplay: '35 min',
    usageMinutes: 35,
    thresholdMinutes: 30,
    tag: 'Entertainment',
    reopensCount: 1,
    lastClosedAgo: '45m'
  },
  chrome: {
    name: 'Chrome',
    usageDisplay: '42 min',
    usageMinutes: 42,
    thresholdMinutes: 40,
    tag: 'Web Browsing',
    reopensCount: 3,
    lastClosedAgo: '8m'
  },
  totalDisplay: '4h 32m',
  sessions: 18,
  focusScore: 72,
  timeSavedMinutes: 47,
  avoidedSessionsCount: 6,
  personality: 'Frequent Re-opener',
  negotiationPending: false,
  pendingNegotiationApp: null,
  goal: {
    title: 'Study for 3 hours',
    currentMinutes: 130, // 2h 10m
    targetMinutes: 180,  // 3h 00m
    display: '2h 10m / 3h'
  }
};

// Available AI Models Map
const PROVIDER_MODELS = {
  gemini: [
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Fastest & Latest)' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash (Auto-Updated)' }
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

const PROVIDER_METADATA = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    keyPlaceholder: 'Paste Gemini key (e.g. AIzaSy... or AQ...)',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpText: 'Get free Gemini API Key ↗',
    keyPrefixes: ['AQ.', 'AIza']
  },
  groq: {
    id: 'groq',
    name: 'Groq (Llama 3.3)',
    keyPlaceholder: 'Paste Groq key (e.g. gsk_...)',
    helpUrl: 'https://console.groq.com/keys',
    helpText: 'Get free Groq API Key ↗',
    keyPrefixes: ['gsk_']
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    keyPlaceholder: 'Paste OpenAI key (e.g. sk-proj-... or sk-...)',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpText: 'Get OpenAI API Key ↗',
    keyPrefixes: ['sk-proj-', 'sk-']
  },
  simulated: {
    id: 'simulated',
    name: 'Simulated Demo',
    keyPlaceholder: '',
    helpUrl: '#',
    helpText: 'No API Key required',
    keyPrefixes: []
  }
};

/**
 * Auto-detects likely AI provider based on key format/prefix
 */
function detectProviderFromKey(key) {
  if (!key || typeof key !== 'string') return null;
  const clean = key.trim();
  if (clean.startsWith('AQ.') || clean.startsWith('AIza')) return 'gemini';
  if (clean.startsWith('sk-')) return 'openai';
  if (clean.startsWith('gsk_')) return 'groq';
  return null;
}

// ==========================================
// 2. Settings & API Key Manager
// ==========================================
const SettingsManager = {
  STORAGE_KEY: 'screentime_ai_settings_v4',
  LEGACY_KEY: 'screentime_ai_settings_v3',

  defaults: {
    provider: 'gemini',
    keys: {
      gemini: '',
      groq: '',
      openai: ''
    },
    apiKey: '',
    model: 'gemini-3.7-flash',
    persona: 'balanced' // 'balanced' | 'strict' | 'coach'
  },

  get() {
    try {
      let saved = localStorage.getItem(this.STORAGE_KEY);
      let parsed = null;

      if (!saved) {
        const legacy = localStorage.getItem(this.LEGACY_KEY);
        if (legacy) parsed = JSON.parse(legacy);
      } else {
        parsed = JSON.parse(saved);
      }

      const data = {
        ...this.defaults,
        keys: { ...this.defaults.keys },
        ...(parsed || {})
      };

      if (parsed && parsed.apiKey && (!parsed.keys || !Object.keys(parsed.keys).length)) {
        const detected = detectProviderFromKey(parsed.apiKey) || parsed.provider || 'gemini';
        data.keys[detected] = parsed.apiKey;
      }

      data.keys = { ...this.defaults.keys, ...(data.keys || {}) };
      data.apiKey = data.keys[data.provider] || '';

      if (data.model && (data.model.includes('1.5') || data.model.includes('2.5') || data.model.includes('2.0'))) {
        data.model = 'gemini-3.7-flash';
      }
      return data;
    } catch (e) {
      return { ...this.defaults, keys: { ...this.defaults.keys } };
    }
  },

  save(settings) {
    try {
      const current = this.get();
      const updated = { ...current, ...settings };
      if (!updated.keys) updated.keys = { ...current.keys };
      if (settings.provider && settings.apiKey !== undefined) {
        updated.keys[settings.provider] = settings.apiKey.trim();
      }
      updated.apiKey = updated.keys[updated.provider] || '';
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
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
// 3. Conversation Memory & Database Manager
// ==========================================
const MemoryManager = {
  MEMORY_KEY: 'screentime_memory_v2',

  get() {
    try {
      const data = localStorage.getItem(this.MEMORY_KEY);
      return data ? JSON.parse(data) : { facts: [], examMentioned: false, studyGoal: true };
    } catch (e) {
      return { facts: [], examMentioned: false, studyGoal: true };
    }
  },

  set(memory) {
    try {
      localStorage.setItem(this.MEMORY_KEY, JSON.stringify(memory));
    } catch (e) {}
  },

  addFact(fact) {
    const mem = this.get();
    if (!mem.facts.includes(fact)) {
      mem.facts.push(fact);
    }
    this.set(mem);
  },

  setFlag(key, val) {
    const mem = this.get();
    mem[key] = val;
    this.set(mem);
  },

  clear() {
    try {
      localStorage.removeItem(this.MEMORY_KEY);
    } catch (e) {}
  }
};

const DatabaseManager = {
  DB_KEY_MESSAGES: 'screentime_gatekeeper_messages_v3',
  DB_KEY_STATS: 'screentime_gatekeeper_stats_v3',
  DB_KEY_PASSES: 'screentime_gatekeeper_passes_v3',

  init() {
    try {
      if (!localStorage.getItem(this.DB_KEY_STATS)) {
        localStorage.setItem(this.DB_KEY_STATS, JSON.stringify(SCREEN_TIME_DATA));
      }
      this.updateStatusIndicator(true, 'Memory Active');
    } catch (e) {
      console.warn('Storage unavailable:', e);
      this.updateStatusIndicator(false, 'DB Offline');
    }
  },

  updateStatusIndicator(online, label) {
    const pill = document.getElementById('dbStatusPill');
    if (pill) {
      pill.innerHTML = `<span class="db-dot" style="background: ${online ? '#22c55e' : '#ef4444'}"></span> ${label}`;
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
      MemoryManager.clear();
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
const clearInputBtn = document.getElementById('clearInputBtn');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const quickChips = document.getElementById('quickChips');
const resetChatBtn = document.getElementById('resetChatBtn');
const sessionStatusBadge = document.getElementById('sessionStatusBadge');
const passCardText = document.getElementById('passCardText');
const activePassBadge = document.getElementById('activePassBadge');
const activePassTitle = document.getElementById('activePassTitle');
const passSubText = document.getElementById('passSubText');
const cancelPassBtn = document.getElementById('cancelPassBtn');

// Dashboard Elements
const kpiTotalTime = document.getElementById('kpiTotalTime');
const kpiSessions = document.getElementById('kpiSessions');
const kpiFocusScore = document.getElementById('kpiFocusScore');
const kpiTimeSaved = document.getElementById('kpiTimeSaved');
const kpiAvoidedCount = document.getElementById('kpiAvoidedCount');
const headerScoreValue = document.getElementById('headerScoreValue');
const focusScoreValue = document.getElementById('focusScoreValue');
const focusRingFill = document.getElementById('focusRingFill');
const focusStatusPill = document.getElementById('focusStatusPill');
const focusAdviceText = document.getElementById('focusAdviceText');
const personalityBadge = document.getElementById('personalityBadge');
const behaviorInsightText = document.getElementById('behaviorInsightText');

// Emergency Override Elements
const emergencyOverrideBtn = document.getElementById('emergencyOverrideBtn');
const emergencyModal = document.getElementById('emergencyModal');
const closeEmergencyBtn = document.getElementById('closeEmergencyBtn');
const cancelEmergencyBtn = document.getElementById('cancelEmergencyBtn');
const grantEmergencyBtn = document.getElementById('grantEmergencyBtn');
const emergencyAppSelect = document.getElementById('emergencyAppSelect');
const emergencyReasonInput = document.getElementById('emergencyReasonInput');

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
const keyHintBox = document.getElementById('keyHintBox');
const keyHintMsg = document.getElementById('keyHintMsg');
const keyHintBtn = document.getElementById('keyHintBtn');
const modelSelect = document.getElementById('modelSelect');
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
  updateFocusScoreUI(SCREEN_TIME_DATA.focusScore);
  updateTimeSavedUI();
  initChat();
  setupEventListeners();
  setupSettingsModalEvents();
  setupEmergencyModalEvents();
});

function updateTimeSavedUI() {
  if (kpiTimeSaved) kpiTimeSaved.textContent = `${SCREEN_TIME_DATA.timeSavedMinutes} min`;
  if (kpiAvoidedCount) kpiAvoidedCount.textContent = `${SCREEN_TIME_DATA.avoidedSessionsCount} avoided`;
}

function recordAvoidedSession(minutesSaved = 15) {
  SCREEN_TIME_DATA.timeSavedMinutes += minutesSaved;
  SCREEN_TIME_DATA.avoidedSessionsCount += 1;
  updateTimeSavedUI();
  modifyFocusScore(+3);
}

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
    const initialGreeting = `Hey! 👋 I’m **Friday**, your AI Screen-Time Gatekeeper & Focus Coach. 
    
Before you open a distracting app, tell me what you'd like to use it for. I'll help you stay intentional and keep your study goal on track! 🎯`;
    
    appendMessage('ai', initialGreeting, {
      highlightText: "💡 Tip: Click any quick prompt below or type your reason for unlocking.",
      highlightType: "emerald"
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

  // Enter to send & input typing
  userInput.addEventListener('input', () => {
    if (clearInputBtn) {
      if (userInput.value.trim().length > 0) {
        clearInputBtn.classList.remove('hidden');
      } else {
        clearInputBtn.classList.add('hidden');
      }
    }
  });

  if (clearInputBtn) {
    clearInputBtn.addEventListener('click', () => {
      userInput.value = '';
      clearInputBtn.classList.add('hidden');
      userInput.focus();
    });
  }

  // Quick Chips
  quickChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const promptText = chip.getAttribute('data-prompt');
    if (promptText) {
      userInput.value = promptText;
      if (clearInputBtn) clearInputBtn.classList.remove('hidden');
      handleUserSendMessage();
    }
  });

  // Reset Button
  resetChatBtn.addEventListener('click', () => {
    if (confirm('Clear chat history and reset Friday’s memory?')) {
      DatabaseManager.clearChatHistory();
      initChat();
    }
  });

  // Cancel pass button
  if (cancelPassBtn) {
    cancelPassBtn.addEventListener('click', () => {
      if (conversationState.passTimer) clearInterval(conversationState.passTimer);
      updatePassUI(false);
      appendMessage('ai', '🛡️ **Focus Pass Ended:** Good job closing the app and staying mindful! Your screen time is protected.', {
        highlightText: 'Focus score maintained! ⭐',
        highlightType: 'emerald'
      });
      modifyFocusScore(+2);
    });
  }
}

// ==========================================
// 6. Settings Modal Logic
// ==========================================
let currentModalProvider = 'gemini';

function setupSettingsModalEvents() {
  openSettingsBtn.addEventListener('click', () => {
    populateSettingsForm();
    settingsModal.classList.remove('hidden');
  });

  const closeModal = () => {
    settingsModal.classList.add('hidden');
    if (keyHintBox) keyHintBox.classList.add('hidden');
  };
  closeSettingsBtn.addEventListener('click', closeModal);
  cancelSettingsBtn.addEventListener('click', closeModal);

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
  });

  toggleApiKeyVisibility.addEventListener('click', () => {
    const isPass = apiKeyInput.type === 'password';
    apiKeyInput.type = isPass ? 'text' : 'password';
    toggleApiKeyVisibility.textContent = isPass ? '🙈' : '👁️';
  });

  apiKeyInput.addEventListener('input', () => {
    const entered = apiKeyInput.value.trim();
    const settings = SettingsManager.get();
    if (currentModalProvider && currentModalProvider !== 'simulated') {
      settings.keys[currentModalProvider] = entered;
    }
    checkKeyFormatAndHint(entered, currentModalProvider);
  });

  if (keyHintBtn) {
    keyHintBtn.addEventListener('click', () => {
      const targetProvider = keyHintBtn.getAttribute('data-target-provider');
      if (targetProvider) {
        selectProviderInModal(targetProvider);
      }
    });
  }

  const providerRadios = document.querySelectorAll('input[name="aiProvider"]');
  providerRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const prevProvider = currentModalProvider;
      const newProvider = e.target.value;
      
      const settings = SettingsManager.get();
      if (prevProvider && prevProvider !== 'simulated') {
        settings.keys[prevProvider] = apiKeyInput.value.trim();
      }

      currentModalProvider = newProvider;
      onProviderChange(newProvider);
    });
  });

  testConnectionBtn.addEventListener('click', async () => {
    await runConnectionTest();
  });

  saveSettingsBtn.addEventListener('click', () => {
    const selectedProvider = document.querySelector('input[name="aiProvider"]:checked')?.value || 'simulated';
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const persona = guardPersonaSelect.value;

    const currentSettings = SettingsManager.get();
    const updatedKeys = { ...currentSettings.keys };
    if (selectedProvider !== 'simulated') {
      updatedKeys[selectedProvider] = key;
    }

    SettingsManager.save({
      provider: selectedProvider,
      keys: updatedKeys,
      apiKey: key,
      model: model,
      persona: persona
    });

    closeModal();
    appendMessage('ai', `⚙️ AI Settings updated! Friday is running on **${getProviderDisplayName(selectedProvider)}** (${model}).`, {
      highlightText: selectedProvider !== 'simulated' ? '⚡ Live AI Protection Online' : '🛡️ Running on Simulated Digital Coach',
      highlightType: selectedProvider !== 'simulated' ? 'emerald' : ''
    });
  });
}

function selectProviderInModal(provider) {
  const radio = document.querySelector(`input[name="aiProvider"][value="${provider}"]`);
  if (radio) {
    radio.checked = true;
    currentModalProvider = provider;
    onProviderChange(provider);
  }
}

function checkKeyFormatAndHint(key, selectedProvider) {
  if (!keyHintBox || !keyHintMsg || !keyHintBtn) return;

  if (!key || selectedProvider === 'simulated') {
    keyHintBox.classList.add('hidden');
    return;
  }

  const detected = detectProviderFromKey(key);

  if (detected && detected !== selectedProvider) {
    const detectedName = PROVIDER_METADATA[detected]?.name || detected;
    keyHintMsg.innerHTML = `This key looks like a <strong>${detectedName}</strong> API key.`;
    keyHintBtn.textContent = `Switch to ${detectedName}`;
    keyHintBtn.setAttribute('data-target-provider', detected);
    keyHintBox.classList.remove('hidden');
  } else {
    keyHintBox.classList.add('hidden');
  }
}

function getProviderDisplayName(provider) {
  const meta = PROVIDER_METADATA[provider];
  return meta ? meta.name : 'Simulated Demo';
}

function populateSettingsForm() {
  const current = SettingsManager.get();
  currentModalProvider = current.provider;
  
  const radio = document.querySelector(`input[name="aiProvider"][value="${current.provider}"]`);
  if (radio) radio.checked = true;

  apiKeyInput.type = 'password';
  toggleApiKeyVisibility.textContent = '👁️';
  guardPersonaSelect.value = current.persona || 'balanced';

  onProviderChange(current.provider, current.model);
  testStatusBox.className = 'test-status-box hidden';
}

function onProviderChange(provider, preferredModel = null) {
  const meta = PROVIDER_METADATA[provider] || PROVIDER_METADATA.gemini;
  const current = SettingsManager.get();

  apiKeyHelpLink.href = meta.helpUrl;
  apiKeyHelpLink.textContent = meta.helpText;
  apiKeyInput.placeholder = meta.keyPlaceholder || 'Paste your API key here...';

  if (provider === 'simulated') {
    apiKeySection.style.display = 'none';
    apiKeyInput.value = '';
    if (keyHintBox) keyHintBox.classList.add('hidden');
  } else {
    apiKeySection.style.display = 'flex';
    const providerKey = current.keys[provider] || (provider === current.provider ? current.apiKey : '');
    apiKeyInput.value = providerKey || '';
    checkKeyFormatAndHint(apiKeyInput.value.trim(), provider);
  }

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
  } else if (models.length > 0) {
    modelSelect.value = models[0].id;
  }

  testStatusBox.className = 'test-status-box hidden';
}

async function runConnectionTest() {
  const provider = document.querySelector('input[name="aiProvider"]:checked')?.value || 'simulated';
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;

  testStatusBox.className = 'test-status-box testing';
  testStatusBox.classList.remove('hidden');
  testStatusIcon.textContent = '⏳';
  testStatusText.textContent = `Testing connection to ${getProviderDisplayName(provider)}...`;

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
    testStatusText.textContent = `Please enter your ${getProviderDisplayName(provider)} API key.`;
    return;
  }

  const detected = detectProviderFromKey(apiKey);
  if (detected && detected !== provider) {
    const detectedName = PROVIDER_METADATA[detected]?.name || detected;
    testStatusBox.className = 'test-status-box error';
    testStatusIcon.textContent = '⚠️';
    testStatusText.textContent = `Key format mismatch: This key looks like a ${detectedName} key, but ${getProviderDisplayName(provider)} is selected.`;
    checkKeyFormatAndHint(apiKey, provider);
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
      testStatusText.textContent = `${result.error}`;
    }
  } catch (e) {
    testStatusBox.className = 'test-status-box error';
    testStatusIcon.textContent = '❌';
    testStatusText.textContent = `Error: ${e.message || 'Network error'}`;
  }
}

// ==========================================
// 7. Message Rendering & Decision Cards
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

  // Text content
  const textElem = document.createElement('div');
  textElem.className = 'msg-text-content';
  textElem.innerHTML = formatMarkdown(text);
  bubble.appendChild(textElem);

  // Optional Decision Card
  if (options.decision) {
    const decisionCard = createDecisionCardElement(options.decision);
    bubble.appendChild(decisionCard);
  }

  // Intent Gate ("Why are you opening it?")
  if (options.intentGate) {
    const gate = createIntentGateElement(options.intentGate);
    bubble.appendChild(gate);
  }

  // Excuse / Pattern Alert Card
  if (options.patternAlert) {
    const alertCard = createPatternAlertElement(options.patternAlert);
    bubble.appendChild(alertCard);
  }

  // Smart Delay Card
  if (options.delayCard) {
    const delayEl = createDelayCardElement(options.delayCard);
    bubble.appendChild(delayEl);
  }

  // Custom HTML block (for negotiation offers, etc.)
  if (options.customHtml) {
    const customEl = document.createElement('div');
    customEl.innerHTML = options.customHtml;
    bubble.appendChild(customEl);
  }

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

function createDecisionCardElement(decision) {
  const card = document.createElement('div');
  const dType = (decision.decision || 'LIMIT').toLowerCase();
  card.className = `decision-card decision-${dType}`;

  let badgeHtml = '';
  if (dType === 'allow') {
    badgeHtml = '<span class="decision-badge badge-allow">🟢 ALLOW</span>';
  } else if (dType === 'block') {
    badgeHtml = '<span class="decision-badge badge-block">🔴 BLOCK</span>';
  } else {
    badgeHtml = '<span class="decision-badge badge-limit">🟡 LIMIT</span>';
  }

  card.innerHTML = `
    <div class="decision-header">
      ${badgeHtml}
      <span class="classification-pill">${decision.classification || 'INTENTIONAL'}</span>
    </div>
    <div class="decision-grid">
      <div class="d-item">
        <span class="d-label">App</span>
        <span class="d-val">${decision.app || 'App'}</span>
      </div>
      <div class="d-item">
        <span class="d-label">Today's Usage</span>
        <span class="d-val">${decision.usage || '30 min'}</span>
      </div>
      <div class="d-item">
        <span class="d-label">Requested</span>
        <span class="d-val">${decision.requested || '15 min'}</span>
      </div>
    </div>
    <div class="decision-rec">
      <strong>Recommendation:</strong> ${decision.recommendation || 'Stay on task and close when done.'}
    </div>
    <div class="decision-actions">
      ${dType !== 'block' 
        ? `<button type="button" class="btn-d-action btn-d-accept" data-app="${decision.app}" data-mins="${decision.allowedMinutes || 15}">Accept ${decision.allowedMinutes || 15}m Pass</button>` 
        : ''}
      <button type="button" class="btn-d-action btn-d-alt" data-action="breathe">Take 2m Breathing Break</button>
      <button type="button" class="btn-d-action btn-d-alt" data-action="stay-focused">Stay Focused</button>
    </div>
  `;

  // Attach card button handlers
  card.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      if (target.classList.contains('btn-d-accept')) {
        const app = target.getAttribute('data-app');
        const mins = parseInt(target.getAttribute('data-mins'), 10) || 15;
        grantFocusPass(app, mins);
        appendMessage('user', `I'll take the ${mins}-minute ${app} pass!`);
        appendMessage('ai', `Pass activated for **${app}** (${mins} min). Let's keep it strictly focused! Timer running on your dashboard. ⏱️`, {
          highlightText: "Focus score protected. Close the app when the timer sounds!",
          highlightType: "emerald"
        });
      } else if (target.getAttribute('data-action') === 'breathe') {
        appendMessage('user', 'I will take a 2-minute breathing break instead.');
        appendMessage('ai', `Awesome choice! 🧘 Take 3 deep, slow breaths: Inhale for 4s... hold for 4s... exhale for 6s. Putting your phone down recharges your focus for your 3-hour study goal!`, {
          highlightText: "+2 Focus Score Bonus Earned! 🌟",
          highlightType: "emerald"
        });
        modifyFocusScore(+2);
      } else if (target.getAttribute('data-action') === 'stay-focused') {
        appendMessage('user', 'I will skip opening the app and keep studying.');
        appendMessage('ai', `Proud of you! 🏆 Resisting autopilot scrolling is how deep focus habits are built. Back to the zone!`, {
          highlightText: "+3 Focus Score Bonus! ⭐",
          highlightType: "emerald"
        });
        recordAvoidedSession(15);
      }
    });
  });

  return card;
}

/**
 * Creates an interactive "Why are you opening it?" Intent Gate
 */
function createIntentGateElement(gateData) {
  const gate = document.createElement('div');
  gate.className = 'intent-gate-box';
  
  gate.innerHTML = `
    <div class="intent-gate-header">
      🤔 <strong>Why do you need ${gateData.app || 'this app'}?</strong>
    </div>
    <div class="intent-chips-grid">
      <button class="intent-choice-btn" data-reason="college" data-app="${gateData.app}">📚 College work</button>
      <button class="intent-choice-btn" data-reason="messages" data-app="${gateData.app}">💬 Messages / Communication</button>
      <button class="intent-choice-btn" data-reason="bored" data-app="${gateData.app}">😐 Just bored</button>
      <button class="intent-choice-btn" data-reason="entertainment" data-app="${gateData.app}">🎬 Entertainment / Reels</button>
    </div>
  `;

  gate.querySelectorAll('.intent-choice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const reason = e.currentTarget.getAttribute('data-reason');
      const app = e.currentTarget.getAttribute('data-app');
      handleIntentGateChoice(app, reason);
    });
  });

  return gate;
}

function handleIntentGateChoice(app, reason) {
  if (reason === 'college' || reason === 'messages') {
    appendMessage('user', `I need ${app} for ${reason === 'college' ? 'college work' : 'messages/communication'}.`);
    appendMessage('ai', `That's a valid reason! 👍 Here's a focused **15-minute pass** for ${app}. Stay on your task—no Reels or feed scrolling!`, {
      highlightText: `✅ <strong>15-Minute Focus Pass Issued</strong> for ${app}.`,
      highlightType: 'emerald',
      decision: {
        app: app,
        usage: SCREEN_TIME_DATA[app.toLowerCase()]?.usageDisplay || '52 min',
        requested: '15 min',
        classification: 'PRODUCTIVE',
        decision: 'ALLOW',
        allowedMinutes: 15,
        recommendation: `Stay focused on ${reason}. Avoid feeds and Shorts.`
      }
    });
  } else if (reason === 'bored') {
    appendMessage('user', `I'm just bored, no specific reason.`);
    appendMessage('ai', `Honesty is the first step! 🧘 You've already spent ${SCREEN_TIME_DATA[app.toLowerCase()]?.usageDisplay || '52 min'} on ${app} today. Let's try a **2-minute breather** instead of opening it on autopilot.`, {
      highlightText: `🧘 <strong>Gatekeeper Challenge:</strong> Drink water, do 3 deep breaths, then decide.`,
      highlightType: 'amber',
      delayCard: {
        app: app,
        reason: 'Boredom detected — smart delay active',
        delaySeconds: 120
      }
    });
    modifyFocusScore(-1);
  } else {
    appendMessage('user', `I want ${app} for entertainment / reels.`);
    const appData = SCREEN_TIME_DATA[app.toLowerCase()];
    appendMessage('ai', `You've already used **${appData?.usageDisplay || '52 min'}** today and it's past your ${appData?.thresholdMinutes || 45}m threshold. 🔴 Entertainment scrolling is the #1 focus killer. Want to try a **5-minute cooling delay** first?`, {
      highlightText: `⚠️ Usage ${appData?.usageDisplay || '52 min'} exceeds ${appData?.thresholdMinutes || 45}m threshold.`,
      highlightType: 'amber',
      delayCard: {
        app: app,
        reason: 'Entertainment request exceeds threshold',
        delaySeconds: 300
      }
    });
    modifyFocusScore(-2);
  }
}

/**
 * Creates a Behavior Pattern / Excuse Alert card
 */
function createPatternAlertElement(alertData) {
  const card = document.createElement('div');
  card.className = 'pattern-alert-card';

  card.innerHTML = `
    <div class="pattern-alert-header">
      ⚠️ ${alertData.title || 'Pattern Detected'}
      <span class="pattern-alert-badge">${alertData.badge || 'Behavior Analysis'}</span>
    </div>
    <p class="pattern-alert-desc">${alertData.description}</p>
    <div class="decision-actions">
      <button type="button" class="btn-d-action btn-d-accept" data-action="accept-limit" data-mins="${alertData.suggestedMinutes || 10}" data-app="${alertData.app || 'App'}">
        ✅ Accept ${alertData.suggestedMinutes || 10}m Limit
      </button>
      <button type="button" class="btn-d-action btn-d-alt" data-action="stay-focused">🎯 Stay Focused Instead</button>
    </div>
  `;

  card.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      if (action === 'accept-limit') {
        const mins = parseInt(e.currentTarget.getAttribute('data-mins'), 10) || 10;
        const app = e.currentTarget.getAttribute('data-app');
        grantFocusPass(app, mins);
        appendMessage('user', `OK, I'll take the strict ${mins}-minute limit for ${app}.`);
        appendMessage('ai', `Timer started! ⏱️ ${mins} minutes on ${app}, then close it immediately. I'm watching out for you. 💪`, {
          highlightText: `🔒 Strict ${mins}m pass — No extensions this time.`,
          highlightType: 'emerald'
        });
      } else if (action === 'stay-focused') {
        appendMessage('user', 'You're right. I'll skip it and stay focused.');
        appendMessage('ai', `That's the move! 🏆 You broke the pattern. Your focus score just got a boost.`, {
          highlightText: "+3 Focus Score Bonus! ⭐",
          highlightType: "emerald"
        });
        recordAvoidedSession(15);
      }
    });
  });

  return card;
}

/**
 * Creates a Smart Delay Card with a live countdown timer
 */
function createDelayCardElement(delayData) {
  const card = document.createElement('div');
  card.className = 'delay-card';

  let remaining = delayData.delaySeconds || 120;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  card.innerHTML = `
    <div class="delay-header">
      ⏳ Smart Delay — Not a Block
      <span class="delay-badge">Cooling Period</span>
    </div>
    <p class="delay-desc">${delayData.reason || 'Let's wait a moment before opening.'}</p>
    <div class="delay-timer-box">
      <span class="delay-timer-num" id="delayTimerNum_${Date.now()}">${mins}:${secs < 10 ? '0' : ''}${secs}</span>
      <span class="delay-timer-label">Wait before opening ${delayData.app || 'the app'}</span>
    </div>
    <div class="decision-actions">
      <button type="button" class="btn-d-action btn-d-alt delay-still-want-btn" data-app="${delayData.app}" disabled>
        Still want it? (wait...)
      </button>
      <button type="button" class="btn-d-action btn-d-alt" data-action="stay-focused">
        🎯 Skip it, Stay Focused
      </button>
    </div>
  `;

  const timerNumEl = card.querySelector('.delay-timer-num');
  const stillWantBtn = card.querySelector('.delay-still-want-btn');

  const timerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      if (timerNumEl) timerNumEl.textContent = '0:00';
      if (stillWantBtn) {
        stillWantBtn.disabled = false;
        stillWantBtn.textContent = `✅ Open ${delayData.app} (10m pass)`;
      }
    } else {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      if (timerNumEl) timerNumEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }
  }, 1000);

  // Button handlers
  if (stillWantBtn) {
    stillWantBtn.addEventListener('click', () => {
      if (stillWantBtn.disabled) return;
      clearInterval(timerInterval);
      grantFocusPass(delayData.app, 10);
      appendMessage('user', `I still want ${delayData.app} after the delay.`);
      appendMessage('ai', `OK! You waited patiently — that shows intentionality. 👏 Here's a strict **10-minute pass** for ${delayData.app}. Close it when the timer ends!`, {
        highlightText: `⏱️ <strong>10-Minute Pass Granted</strong> after cooling delay.`,
        highlightType: 'emerald'
      });
    });
  }

  card.querySelector('[data-action="stay-focused"]')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    appendMessage('user', 'I'll skip it. Staying focused.');
    appendMessage('ai', `Amazing self-control! 🏆 The delay worked — you chose focus over impulse. That's powerful.`, {
      highlightText: "+3 Focus Score Bonus! ⭐",
      highlightType: "emerald"
    });
    recordAvoidedSession(20);
  });

  return card;
}

/**
 * Emergency Override Modal Event Setup
 */
function setupEmergencyModalEvents() {
  if (!emergencyOverrideBtn || !emergencyModal) return;

  emergencyOverrideBtn.addEventListener('click', () => {
    emergencyModal.classList.remove('hidden');
    if (emergencyReasonInput) emergencyReasonInput.value = '';
  });

  const closeEmergency = () => emergencyModal.classList.add('hidden');
  if (closeEmergencyBtn) closeEmergencyBtn.addEventListener('click', closeEmergency);
  if (cancelEmergencyBtn) cancelEmergencyBtn.addEventListener('click', closeEmergency);

  emergencyModal.addEventListener('click', (e) => {
    if (e.target === emergencyModal) closeEmergency();
  });

  if (grantEmergencyBtn) {
    grantEmergencyBtn.addEventListener('click', () => {
      const app = emergencyAppSelect?.value || 'Instagram';
      const reason = emergencyReasonInput?.value?.trim() || 'Urgent need';

      if (!reason || reason.length < 3) {
        emergencyReasonInput?.focus();
        return;
      }

      closeEmergency();

      appendMessage('user', `🚨 Emergency Override: Need ${app} urgently — "${reason}"`);
      appendMessage('ai', `🚨 **Emergency Access Granted** for **${app}** (5 minutes).\n\nReason logged: *"${reason}"*\n\nI trust you. Get it done quickly and come back! ⏱️`, {
        highlightText: `⚡ <strong>5-Minute Emergency Pass</strong> — Context-aware access granted.`,
        highlightType: 'emerald'
      });

      grantFocusPass(app, 5);
      modifyFocusScore(-1); // small penalty for override
      MemoryManager.addFact(`Used emergency override for ${app}: "${reason}"`);
    });
  }
}

function formatMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
  typingIndicator.classList.remove('hidden');
  setSendLoading(true);
  scrollToBottom();
}

function hideTypingIndicator() {
  typingIndicator.classList.add('hidden');
  setSendLoading(false);
}

function setSendLoading(isLoading) {
  if (!sendBtn) return;
  const icon = sendBtn.querySelector('.send-icon');
  const spinner = sendBtn.querySelector('.send-spinner');
  if (isLoading) {
    sendBtn.disabled = true;
    if (icon) icon.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
  } else {
    sendBtn.disabled = false;
    if (icon) icon.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
  }
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
  if (clearInputBtn) clearInputBtn.classList.add('hidden');
  userInput.focus();

  // Extract memory facts (e.g. "exam tomorrow", "project due", "studying python")
  extractMemoryFacts(rawText);

  // Render user message
  appendMessage('user', rawText);

  // Show typing indicator
  showTypingIndicator();

  const settings = SettingsManager.get();

  try {
    let responseObj;

    if (settings.provider !== 'simulated' && settings.apiKey) {
      // Call Live LLM with context
      responseObj = await callLiveAI(settings, rawText);
    } else {
      // Intelligent Simulated Coach Fallback
      await new Promise(r => setTimeout(r, 600));
      responseObj = generateSimulatedResponse(rawText);
    }

    hideTypingIndicator();

    appendMessage('ai', responseObj.text, {
      highlightText: responseObj.highlight,
      highlightType: responseObj.highlightType,
      decision: responseObj.decision,
      intentGate: responseObj.intentGate,
      patternAlert: responseObj.patternAlert,
      delayCard: responseObj.delayCard,
      customHtml: responseObj.customHtml
    });

    if (responseObj.grantPass) {
      grantFocusPass(responseObj.appName || 'Selected App', responseObj.durationMinutes || 15);
    }

  } catch (err) {
    hideTypingIndicator();
    console.error('AI Error:', err);
    // Graceful fallback to simulated response on API error
    const fallbackResponse = generateSimulatedResponse(rawText);
    appendMessage('ai', `${fallbackResponse.text}\n\n*(⚡ Switched to Smart Offline Guard — ${err.message || 'API connection notice'})*`, {
      highlightText: fallbackResponse.highlight,
      highlightType: fallbackResponse.highlightType,
      decision: fallbackResponse.decision,
      intentGate: fallbackResponse.intentGate,
      patternAlert: fallbackResponse.patternAlert,
      delayCard: fallbackResponse.delayCard,
      customHtml: fallbackResponse.customHtml
    });
  }
}

function extractMemoryFacts(text) {
  const lower = text.toLowerCase();
  if (lower.includes('exam') || lower.includes('test tomorrow') || lower.includes('finals')) {
    MemoryManager.setFlag('examMentioned', true);
    MemoryManager.addFact('User has an upcoming exam');
  }
  if (lower.includes('college') || lower.includes('assignment') || lower.includes('project')) {
    MemoryManager.addFact('Working on college assignments/projects');
  }
  if (lower.includes('python') || lower.includes('coding') || lower.includes('lecture')) {
    MemoryManager.addFact('Learning Python / lectures');
  }
}

// ==========================================
// 9. Live AI API Clients (Gemini, Groq, OpenAI)
// ==========================================
function buildSystemPrompt(persona) {
  let personaTone = "Balanced, supportive digital coach: friendly, direct, encouraging realistic limits without shaming.";
  if (persona === 'strict') {
    personaTone = "Strict Stoic Guardian: Firm against mindless dopamine, challenge excuses directly, urge deep work.";
  } else if (persona === 'coach') {
    personaTone = "Empathetic Focus Coach: Warm, encouraging reflection, asking intentional questions.";
  }

  const memory = MemoryManager.get();
  const memoryNotes = memory.facts.length > 0 ? `Known User Facts: ${memory.facts.join('; ')}` : 'No prior context';

  return `You are "Friday", a supportive and intelligent AI ScreenTime Gatekeeper & Focus Coach.
Your mission is not just passive screen-time tracking, but active behavioral coaching to break unconscious dopamine loops and protect the user's daily study goal ("Study for 3 hours", 2h 10m completed).

User Live Screen Time Stats Today:
- Total Screen Time: 4h 32m (18 unlocks)
- Instagram: 52 min (Threshold: 45 min)
- YouTube: 1h 15m (Threshold: 60 min)
- Gaming: 35 min (Threshold: 30 min)
- Chrome: 42 min (Threshold: 40 min)
- Focus Score: ${SCREEN_TIME_DATA.focusScore}/100
- Active Goal: "Study for 3 hours" (Progress: 2h 10m / 3h, 50m left)
- Behavior Pattern: "Just 5 minutes" requested 6 times this week (avg session actually 27 min).
${memoryNotes}

Psychology & Gatekeeper Coaching Rules:
1. Tone: ${personaTone} Never shame or lecture the user.
2. Keep responses punchy, concise, and conversational (1 to 3 short paragraphs max).
3. "Why are you opening it?" Gate: If user vaguely asks to open a social/entertainment app, ask them what specific purpose they need it for (e.g. college work, urgent messages, boredom, entertainment).
4. Excuse Detector: If the user says "just 5 minutes" or "quick check", point out their behavioral pattern with empathy (e.g. 'You requested 5 min 6 times this week, but averaged 27m. How about a strict 10m limit?').
5. Relapse Detector: If user reopens an app right after closing it, gently point out the subconscious reflex loop.
6. Smart Delay / Boredom: If user is bored or seeking mindless scrolling, offer a 2-minute cooling breather (water, 3 deep breaths, stretch) rather than a harsh block.
7. AI Negotiation: If user asks for excessive entertainment time (e.g., 30-40 min), negotiate a compromise (e.g., 10m now or earn 25m after finishing the remaining 50m study block).
8. Pass Tag: When you grant permission, end with "[PASS: <App>, <Mins>m]" (e.g., [PASS: YouTube, 20m]).`;
}

async function callLiveAI(settings, userMessage) {
  const { provider, apiKey, model, persona } = settings;
  const systemPrompt = buildSystemPrompt(persona);
  const recentHistory = DatabaseManager.getMessages().slice(-6);

  if (provider === 'gemini') {
    const selectedModel = (model && !model.includes('1.5') && !model.includes('2.5') && !model.includes('2.0')) ? model : 'gemini-3.7-flash';
    return await callGeminiAPI(apiKey, selectedModel, systemPrompt, recentHistory, userMessage);
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

  history.forEach(msg => {
    contents.push({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    });
  });

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const rawMsg = errorData.error?.message || `Gemini error (${response.status})`;
    throw new Error(formatAPIErrorMessage('gemini', rawMsg, response.status));
  }

  const data = await response.json();
  const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Let's stay mindful with your screen time.";
  return parseAIResponse(rawReply, userMessage);
}

// OpenAI & Groq REST API
async function callOpenAICompatibleAPI(endpoint, apiKey, model, systemPrompt, history, userMessage) {
  const isGroq = endpoint.includes('groq');
  const provider = isGroq ? 'groq' : 'openai';

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
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const rawMsg = errorData.error?.message || `API error (${response.status})`;
    throw new Error(formatAPIErrorMessage(provider, rawMsg, response.status));
  }

  const data = await response.json();
  const rawReply = data.choices?.[0]?.message?.content || "Let's stay mindful with your screen time.";
  return parseAIResponse(rawReply, userMessage);
}

function formatAPIErrorMessage(provider, rawMsg, statusCode) {
  if (provider === 'openai') {
    if (rawMsg.includes('quota') || rawMsg.includes('credits') || statusCode === 429) {
      return 'OpenAI Account Quota Exceeded. Add credits at platform.openai.com/billing or switch to Google Gemini (Free Tier).';
    }
    if (rawMsg.includes('Incorrect API key') || rawMsg.includes('invalid_api_key') || statusCode === 401) {
      return 'Incorrect OpenAI API Key. Please verify your OpenAI key (sk-...) or switch to Google Gemini.';
    }
  }
  if (provider === 'gemini') {
    if (rawMsg.includes('API_KEY_INVALID') || statusCode === 400 || statusCode === 403) {
      return 'Invalid Google Gemini API Key. Please get a free key from aistudio.google.com.';
    }
    if (rawMsg.includes('no longer available') || statusCode === 404) {
      return 'Selected Gemini model is unavailable. Switched to Gemini 3.7 Flash.';
    }
  }
  return rawMsg;
}

// Connection test utility
async function testAPIConnection(provider, apiKey, model) {
  if (provider === 'gemini') {
    const selectedModel = (model && !model.includes('1.5') && !model.includes('2.5') && !model.includes('2.0')) ? model : 'gemini-3.7-flash';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping test' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = formatAPIErrorMessage('gemini', err.error?.message || `HTTP ${res.status}`, res.status);
      return { success: false, error: msg };
    }
    return { success: true, modelName: selectedModel };
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
      const msg = formatAPIErrorMessage(provider, err.error?.message || `HTTP ${res.status}`, res.status);
      return { success: false, error: msg };
    }
    return { success: true, modelName: model };
  }
}

// Parses tags like [PASS: Instagram, 15m] and attaches Decision Card
function parseAIResponse(rawText, userMessage) {
  const passRegex = /\[PASS:\s*([^,\]]+),\s*(\d+)m?\]/i;
  const match = rawText.match(passRegex);

  let cleanText = rawText.replace(passRegex, '').trim();
  let grantPass = false;
  let appName = 'Focus App';
  let durationMinutes = 15;
  let highlight = null;
  let highlightType = '';

  const classificationData = classifyIntentAndDecision(userMessage);

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

  const decisionObj = {
    app: appName !== 'Focus App' ? appName : (classificationData.app || 'App'),
    usage: SCREEN_TIME_DATA[classificationData.appKey]?.usageDisplay || '52 min',
    requested: `${durationMinutes} min`,
    classification: classificationData.classification,
    decision: grantPass ? 'ALLOW' : classificationData.decision,
    allowedMinutes: durationMinutes,
    recommendation: classificationData.recommendation
  };

  return {
    text: cleanText,
    highlight: highlight,
    highlightType: highlightType,
    grantPass: grantPass,
    appName: appName,
    durationMinutes: durationMinutes,
    decision: decisionObj
  };
}

// ==========================================
// 10. Intelligent Intent Classification & Decision Engine
// ==========================================
function classifyIntentAndDecision(input) {
  const text = input.toLowerCase();
  let appKey = 'instagram';
  let appName = 'Instagram';

  if (text.includes('youtube') || text.includes('yt') || text.includes('video') || text.includes('lecture')) {
    appKey = 'youtube';
    appName = 'YouTube';
  } else if (text.includes('game') || text.includes('gaming') || text.includes('play')) {
    appKey = 'gaming';
    appName = 'Gaming';
  } else if (text.includes('chrome') || text.includes('browse') || text.includes('web') || text.includes('google')) {
    appKey = 'chrome';
    appName = 'Chrome';
  }

  // 1. PRODUCTIVE
  if (
    text.includes('study') ||
    text.includes('college') ||
    text.includes('lecture') ||
    text.includes('python') ||
    text.includes('assignment') ||
    text.includes('project') ||
    text.includes('research') ||
    text.includes('work') ||
    text.includes('homework') ||
    text.includes('learn')
  ) {
    return {
      appKey,
      app: appName,
      classification: 'PRODUCTIVE',
      decision: 'ALLOW',
      allowedMinutes: 20,
      recommendation: `Allow intentional study session. Avoid switching to recommendation feeds or Shorts.`
    };
  }

  // 2. NECESSARY
  if (
    text.includes('urgent') ||
    text.includes('important') ||
    text.includes('call') ||
    text.includes('message') ||
    text.includes('otp') ||
    text.includes('ticket') ||
    text.includes('doctor')
  ) {
    return {
      appKey,
      app: appName,
      classification: 'NECESSARY',
      decision: 'ALLOW',
      allowedMinutes: 10,
      recommendation: `Allow quick essential task. Lock device immediately once complete.`
    };
  }

  // 3. ENTERTAINMENT (Controlled break)
  if (
    text.includes('music') ||
    text.includes('relax') ||
    text.includes('break') ||
    text.includes('unwind') ||
    text.includes('playlist') ||
    text.includes('20 min') ||
    text.includes('10 min') ||
    text.includes('pass')
  ) {
    return {
      appKey,
      app: appName,
      classification: 'ENTERTAINMENT',
      decision: 'LIMIT',
      allowedMinutes: 15,
      recommendation: `Allow 15 minutes, then take a mindful break to protect daily focus score.`
    };
  }

  // 4. DISTRACTION (Boredom / mindless scroll)
  if (
    text.includes('bored') ||
    text.includes('scroll') ||
    text.includes('pass time') ||
    text.includes('kill time') ||
    text.includes('nothing to do') ||
    text.includes('reels') ||
    text.includes('shorts')
  ) {
    return {
      appKey,
      app: appName,
      classification: 'DISTRACTION',
      decision: 'BLOCK',
      allowedMinutes: 0,
      recommendation: `Suggest 2-minute offline breather or water break before unlocking.`
    };
  }

  // Default: Prompt for purpose or provide bounded limit
  return {
    appKey,
    app: appName,
    classification: 'ENTERTAINMENT',
    decision: 'LIMIT',
    allowedMinutes: 10,
    recommendation: `Allow 10 minutes session with active timer, then return to your study goal.`
  };
}

// ==========================================
// 11. Intelligent Simulated Digital Coach
// ==========================================
function generateSimulatedResponse(input) {
  const text = input.toLowerCase();
  const memory = MemoryManager.get();
  const classData = classifyIntentAndDecision(input);

  // 1. UNIQUE FEATURE: Excuse Detector ("Just 5 minutes", "quick 2 min", etc.)
  if (
    text.includes('5 min') ||
    text.includes('5 minute') ||
    text.includes('5m') ||
    text.includes('just 5') ||
    text.includes('only 5') ||
    text.includes('bas 5') ||
    text.includes('quick 2') ||
    text.includes('2 min') ||
    text.includes('quick check')
  ) {
    return {
      text: `I hear you saying *"just 5 minutes"*, but let's check your behavioral pattern for today. 📊\n\nWhen we open dopamine-heavy apps on low intent, algorithmic feeds extend the session automatically.`,
      highlight: `🧠 <strong>Excuse Pattern Detected:</strong> Requested "5 min" 6 times, avg session was 27m.`,
      highlightType: 'amber',
      appName: classData.app,
      patternAlert: {
        title: 'Behavioral Pattern Detected',
        badge: 'Behavior Analysis',
        description: `You requested <strong>"5 minutes" 6 times this week</strong>, but your average session lasted <strong>27 minutes</strong>. Dopamine feeds are engineered to bypass willpower.`,
        suggestedMinutes: 10,
        app: classData.app
      }
    };
  }

  // 2. UNIQUE FEATURE: Relapse Detector (Rapid Reopen / "Instagram again")
  if (
    text.includes('again') ||
    text.includes('reopen') ||
    text.includes('reopened') ||
    text.includes('closed 2') ||
    text.includes('just closed') ||
    text.includes('relapse') ||
    text.includes('second time')
  ) {
    return {
      text: `**${classData.app} again?** 😅 You just closed it 2 minutes ago! Reopening repeatedly is a subconscious dopamine loop, not a genuine need.`,
      highlight: `🔄 <strong>Relapse Cycle:</strong> 5 rapid re-opens detected in the last 15 minutes.`,
      highlightType: 'amber',
      appName: classData.app,
      delayCard: {
        app: classData.app,
        reason: 'Rapid re-open cycle detected — 2 minute cooling period active',
        delaySeconds: 120
      }
    };
  }

  // 3. UNIQUE FEATURE: AI Negotiation Mode (Negotiating down long session requests)
  if (
    text.includes('30 min') ||
    text.includes('30 minute') ||
    text.includes('40 min') ||
    text.includes('40 minute') ||
    text.includes('1 hour') ||
    text.includes('60 min') ||
    text.includes('45 min')
  ) {
    return {
      text: `A 30+ minute session right now will drain your mental energy before finishing today's targets. 🤝\n\n**Let's negotiate:** Take a **10-minute focus pass** now, or earn a full **25-minute guilt-free break** once you complete your remaining 50m study block!`,
      highlight: `🤝 <strong>Focus Compromise:</strong> 10m now OR 25m after your study block (${SCREEN_TIME_DATA.goal.display}).`,
      highlightType: 'amber',
      appName: classData.app,
      decision: {
        app: classData.app,
        usage: SCREEN_TIME_DATA[classData.appKey]?.usageDisplay || '35 min',
        requested: '30+ min',
        classification: 'ENTERTAINMENT',
        decision: 'LIMIT',
        allowedMinutes: 10,
        recommendation: 'Negotiated 30m request down to 10m intentional pass.'
      }
    };
  }

  // 4. UNIQUE FEATURE: "Why are you opening it?" Gate
  if (
    text.includes('why instagram') ||
    text.includes('why are you opening') ||
    text.includes('need instagram') ||
    text === 'open instagram' ||
    text === 'instagram' ||
    text.includes('unlock instagram') ||
    (text.includes('open') && (text.includes('app') || text.includes('social')))
  ) {
    return {
      text: `Before we unlock **${classData.app}**, let's set an explicit intention so you don't get trapped in algorithmic feeds. 🎯`,
      highlight: `📊 <strong>Today's ${classData.app} Usage:</strong> ${SCREEN_TIME_DATA[classData.appKey]?.usageDisplay || '52 min'} (Threshold: ${SCREEN_TIME_DATA[classData.appKey]?.thresholdMinutes || 45}m).`,
      highlightType: '',
      appName: classData.app,
      intentGate: {
        app: classData.app
      }
    };
  }

  // 5. UNIQUE FEATURE: Smart Delay for Boredom / Mindless Scrolling
  if (classData.classification === 'DISTRACTION' || text.includes('bored') || text.includes('scroll') || text.includes('reels') || text.includes('shorts')) {
    const usage = SCREEN_TIME_DATA[classData.appKey]?.usageDisplay || '52 min';
    return {
      text: `You've already spent **${usage}** on ${classData.app} today. 😅 Scrolling because you're bored usually turns into 40+ minutes of lost focus.\n\nInstead of a hard wall, let's take a **2-minute cooling breather** to reset your dopamine receptors.`,
      highlight: `⏳ <strong>Smart Delay:</strong> Take 3 deep breaths or drink water.`,
      highlightType: 'amber',
      appName: classData.app,
      delayCard: {
        app: classData.app,
        reason: `Boredom scrolling detected — ${usage} used today`,
        delaySeconds: 120
      }
    };
  }

  // Case: Exam memory recall
  if (memory.examMentioned && (text.includes('instagram') || text.includes('game') || text.includes('scroll'))) {
    return {
      text: `You mentioned earlier that you have an upcoming exam! 📚 If this is just passive scrolling, let's protect that study block. How about a 2-minute water stretch instead?`,
      highlight: `🎯 Active Goal: "Study for 3 hours" (${SCREEN_TIME_DATA.goal.display})`,
      highlightType: 'amber',
      grantPass: false,
      appName: classData.app,
      decision: {
        app: classData.app,
        usage: SCREEN_TIME_DATA[classData.appKey]?.usageDisplay || '52 min',
        requested: '20 min',
        classification: 'DISTRACTION',
        decision: 'BLOCK',
        allowedMinutes: 0,
        recommendation: 'Block scrolling to safeguard your exam preparation.'
      }
    };
  }

  // Case: Productive / Study / Lecture
  if (classData.classification === 'PRODUCTIVE') {
    const goalText = extractGoal(text) || 'your academic study';
    return {
      text: `That’s a productive use! 👍 You can continue with ${goalText}, but try to stay focused on the core material instead of opening Shorts or algorithmic feeds.`,
      highlight: `✅ <strong>20-Minute Focus Pass Issued</strong> for ${classData.app}.`,
      highlightType: 'emerald',
      grantPass: true,
      appName: classData.app,
      durationMinutes: 20,
      decision: {
        app: classData.app,
        usage: SCREEN_TIME_DATA[classData.appKey]?.usageDisplay || '1h 15m',
        requested: '20 min',
        classification: 'PRODUCTIVE',
        decision: 'ALLOW',
        allowedMinutes: 20,
        recommendation: `Allow study session. Keep focus on ${goalText}.`
      }
    };
  }

  // Case: Direct Screen Time Reduction Advice
  if (text.includes('reduce') || text.includes('help me') || text.includes('habit') || text.includes('profile')) {
    return {
      text: `Here is your high-leverage focus plan for today:\n1. **Intent Gate**: State your specific reason before tapping unlock.\n2. **Excuse Awareness**: Watch out for the "just 5 minutes" bias (avg session: 27m).\n3. **Finish study goal**: You have 50m remaining on your "Study for 3 hours" target! 🎯`,
      highlight: `📊 Current Total: <strong>${SCREEN_TIME_DATA.totalDisplay}</strong> today (${SCREEN_TIME_DATA.sessions} unlocks).`,
      highlightType: 'emerald',
      decision: null
    };
  }

  // Default Friendly Support
  return {
    text: `Got it! Let's be intentional with ${classData.app}. I've set up a 10-minute focus window so you get what you need without falling into endless feeds.`,
    highlight: `🎯 <strong>10-Minute Pass Ready</strong> for ${classData.app}.`,
    highlightType: 'emerald',
    grantPass: true,
    appName: classData.app,
    durationMinutes: 10,
    decision: classData
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
// 12. Focus Score & Pass Management
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
      appendMessage('ai', `⏰ <strong>Pass Expired:</strong> Your ${durationMinutes}-minute session for ${appName} is up. Please close the app and protect your focus score!`, {
        highlightText: "Mindful habit: Lock your phone now. 🔒",
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
    if (activePassTitle) activePassTitle.textContent = `${minutes}-Minute Focus Pass Active (${appName})`;
    passSubText.textContent = `Stay on task & close when done`;
    passCardText.textContent = `Focus pass active for ${appName}. Stay mindful and lock your screen once finished.`;
  } else {
    sessionStatusBadge.textContent = '🔒 Guarded Mode';
    sessionStatusBadge.classList.remove('passed');
    activePassBadge.classList.add('hidden');
    passCardText.textContent = `"Before reaching for your phone on autopilot, name the single reason for unlocking. 80% of regretful screen time begins with unintentional taps."`;
  }
}

function modifyFocusScore(delta) {
  SCREEN_TIME_DATA.focusScore = Math.max(10, Math.min(100, SCREEN_TIME_DATA.focusScore + delta));
  updateFocusScoreUI(SCREEN_TIME_DATA.focusScore);
}

function updateFocusScoreUI(score) {
  if (focusScoreValue) focusScoreValue.textContent = score;
  if (headerScoreValue) headerScoreValue.textContent = score;
  if (kpiFocusScore) kpiFocusScore.textContent = `${score}/100`;

  // Circumference for r=44 is ~276.46
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  if (focusRingFill) {
    focusRingFill.style.strokeDasharray = `${circumference}`;
    focusRingFill.style.strokeDashoffset = `${offset}`;
    if (score >= 80) {
      focusRingFill.style.stroke = '#10b981';
      if (focusStatusPill) {
        focusStatusPill.textContent = 'Excellent Control';
        focusStatusPill.style.color = '#065f46';
        focusStatusPill.style.background = '#ecfdf5';
      }
    } else if (score >= 60) {
      focusRingFill.style.stroke = '#6366f1';
      if (focusStatusPill) {
        focusStatusPill.textContent = 'Fair Control';
        focusStatusPill.style.color = '#4338ca';
        focusStatusPill.style.background = '#eef2ff';
      }
    } else {
      focusRingFill.style.stroke = '#f59e0b';
      if (focusStatusPill) {
        focusStatusPill.textContent = 'Needs Attention';
        focusStatusPill.style.color = '#92400e';
        focusStatusPill.style.background = '#fffbeb';
      }
    }
  }
}

// ==========================================
// Mobile Navigation Tab Switcher Handler
// ==========================================
function initMobileNavigation() {
  const mobileNavTabs = document.getElementById('mobileNavTabs');
  const mainContentGrid = document.getElementById('mainContentGrid');
  if (!mobileNavTabs || !mainContentGrid) return;

  // Default active tab: chat
  mainContentGrid.setAttribute('data-active-tab', 'chat');

  const tabBtns = mobileNavTabs.querySelectorAll('.mobile-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mainContentGrid.setAttribute('data-active-tab', targetTab);

      if (targetTab === 'chat') {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
          setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }, 50);
        }
      }
    });
  });

  // Switch to chat tab automatically when user clicks quick chips or submits a message
  const quickChips = document.getElementById('quickChips');
  if (quickChips) {
    quickChips.addEventListener('click', (e) => {
      if (e.target.closest('.chip')) {
        switchToChatTab();
      }
    });
  }

  const chatForm = document.getElementById('chatForm');
  if (chatForm) {
    chatForm.addEventListener('submit', () => {
      switchToChatTab();
    });
  }
}

function switchToChatTab() {
  const mainContentGrid = document.getElementById('mainContentGrid');
  const mobileNavTabs = document.getElementById('mobileNavTabs');
  if (!mainContentGrid || !mobileNavTabs) return;

  if (window.innerWidth <= 960) {
    mainContentGrid.setAttribute('data-active-tab', 'chat');
    const tabBtns = mobileNavTabs.querySelectorAll('.mobile-tab-btn');
    tabBtns.forEach(b => {
      if (b.getAttribute('data-tab') === 'chat') b.classList.add('active');
      else b.classList.remove('active');
    });
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNavigation);
} else {
  initMobileNavigation();
}


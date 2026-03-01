const TOTAL_QUESTIONS = 10;
const DEFAULT_GAMES_PER_SESSION = 5;
const MIN_GAMES_PER_SESSION = 1;
const MAX_GAMES_PER_SESSION = 20;
const MIN_FACT_VALUE = 2;
const MAX_FACT_VALUE = 19;
const DEFAULT_FACT_LOWER_BOUND = 2;
const DEFAULT_FACT_UPPER_BOUND = 10;
const AUTO_NEXT_DELAY_MS = 2000;
const FEEDBACK_SPEECH_MAX_WAIT_MS = 5000;
const STREAK_FOR_STICKER = 3;
const COMBO_FOR_BONUS_STICKER = 10;

const STICKER_CATALOG = [
  { id: "kitty_bow", src: "./assets/stickers/sanrio_kitty_bow.svg", rarity: "common" },
  { id: "bunny_ribbon", src: "./assets/stickers/sanrio_bunny_ribbon.svg", rarity: "rare" },
  { id: "puppy_cloud", src: "./assets/stickers/sanrio_puppy_cloud.svg", rarity: "ultra" },
  { id: "rilakkuma_bounce_bear", src: "./assets/stickers/rilakkuma_bounce_bear.svg", rarity: "common" },
  {
    id: "rilakkuma_blanket_burrito_bear",
    src: "./assets/stickers/rilakkuma_blanket_burrito_bear.svg",
    rarity: "common",
  },
  { id: "kawaii_frog_lily", src: "./assets/stickers/kawaii_frog_lily.svg", rarity: "common" },
  { id: "kawaii_bear_donut", src: "./assets/stickers/kawaii_bear_donut.svg", rarity: "common" },
  {
    id: "kawaii_bunny_strawberry",
    src: "./assets/stickers/kawaii_bunny_strawberry.svg",
    rarity: "common",
  },
  {
    id: "mofusand_milk_tea_splash_cat",
    src: "./assets/stickers/mofusand_milk_tea_splash_cat.svg",
    rarity: "common",
  },
  {
    id: "mofusand_scarf_puff_cat",
    src: "./assets/stickers/mofusand_scarf_puff_cat.svg",
    rarity: "common",
  },
  {
    id: "cute_bear_star_hug",
    src: "./assets/stickers/cute_bear_star_hug.svg",
    rarity: "common",
  },
  {
    id: "marine_playful_baby_shark",
    src: "./assets/stickers/marine_playful_baby_shark.svg",
    rarity: "common",
  },
  {
    id: "marine_playful_quirky_fish",
    src: "./assets/stickers/marine_playful_quirky_fish.svg",
    rarity: "common",
  },
  {
    id: "marine_playful_sailor_penguin",
    src: "./assets/stickers/marine_playful_sailor_penguin.svg",
    rarity: "common",
  },
];

const setupView = document.getElementById("setupView");
const gameView = document.getElementById("gameView");
const endGameView = document.getElementById("endGameView");
const startGameButton = document.getElementById("startGameButton");
const restartButton = document.getElementById("restartButton");
const endTitleText = document.getElementById("endTitleText");
const endSummaryText = document.getElementById("endSummaryText");
const sessionStickerBreakdown = document.getElementById("sessionStickerBreakdown");
const sessionGamesDecrementButton = document.getElementById("sessionGamesDecrementButton");
const sessionGamesIncrementButton = document.getElementById("sessionGamesIncrementButton");
const sessionGamesValueText = document.getElementById("sessionGamesValueText");
const setupStickerPreview = document.getElementById("setupStickerPreview");
const rangeLowerDecrementButton = document.getElementById("rangeLowerDecrementButton");
const rangeLowerIncrementButton = document.getElementById("rangeLowerIncrementButton");
const rangeLowerValueText = document.getElementById("rangeLowerValueText");
const rangeUpperDecrementButton = document.getElementById("rangeUpperDecrementButton");
const rangeUpperIncrementButton = document.getElementById("rangeUpperIncrementButton");
const rangeUpperValueText = document.getElementById("rangeUpperValueText");

const roundProgressText = document.getElementById("roundProgressText");
const questionText = document.getElementById("questionText");
const resultBox = document.getElementById("resultBox");
const typedAnswerForm = document.getElementById("typedAnswerForm");
const typedAnswerInput = document.getElementById("typedAnswerInput");
const correctCountText = document.getElementById("correctCountText");
const streakText = document.getElementById("streakText");
const comboText = document.getElementById("comboText");
const sessionStarCountText = document.getElementById("sessionStarCountText");
const sessionStickerCountText = document.getElementById("sessionStickerCountText");
const starTray = document.getElementById("starTray");
const stickerTray = document.getElementById("stickerTray");

function setResultBox(text, type) {
  resultBox.textContent = text;
  resultBox.className = "result-box" + (type ? " " + type : "");
}

const state = {
  phase: "setup",
  questionIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  streakCount: 0,
  comboCount: 0,
  normalStickerCount: 0,
  sessionStarCount: 0,
  sessionStickerCount: 0,
  sessionGamesPlayed: 0,
  gamesPerSession: DEFAULT_GAMES_PER_SESSION,
  activeGamesPerSession: DEFAULT_GAMES_PER_SESSION,
  factLowerBound: DEFAULT_FACT_LOWER_BOUND,
  factUpperBound: DEFAULT_FACT_UPPER_BOUND,
  activeFactLowerBound: DEFAULT_FACT_LOWER_BOUND,
  activeFactUpperBound: DEFAULT_FACT_UPPER_BOUND,
  sessionStickerTypeCounts: createEmptyStickerCountMap(),
  sessionEarnedStickerIds: [],
  sessionComplete: false,
  x: 2,
  y: 2,
  expected: 4,
  questionPool: [],
  nextQuestionTimeoutId: null,
  nextQuestionDueAtMs: 0,
  questionPromptToken: 0,
  questionPromptTimeoutId: null,
  feedbackSpeechPlaying: false,
  feedbackSpeechDeadlineMs: 0,
  lastStickerId: null,
  didStartOnce: false,
};

let sharedAudioContext = null;

startGameButton.addEventListener("click", startGame);
restartButton.addEventListener("click", onEndActionButton);
sessionGamesDecrementButton.addEventListener("click", () => updateGamesPerSession(-1));
sessionGamesIncrementButton.addEventListener("click", () => updateGamesPerSession(1));
rangeLowerDecrementButton.addEventListener("click", () => updateFactLowerBound(-1));
rangeLowerIncrementButton.addEventListener("click", () => updateFactLowerBound(1));
rangeUpperDecrementButton.addEventListener("click", () => updateFactUpperBound(-1));
rangeUpperIncrementButton.addEventListener("click", () => updateFactUpperBound(1));
typedAnswerForm.addEventListener("submit", onTypedSubmit);
typedAnswerInput.addEventListener("input", onTypedInput);
document.addEventListener("keydown", onGlobalKeyDown);

initialize();

function initialize() {
  resetSessionState({ preserveSelection: false });
  renderSetupStickerPreview();
  showSetupView();
}

function renderSetupStickerPreview() {
  if (!setupStickerPreview) {
    return;
  }
  const stickerItemsMarkup = STICKER_CATALOG.map((sticker) => {
    const stickerName = formatStickerName(sticker.id);
    return `<img class="reward-friend setup-preview-sticker" src="${sticker.src}" alt="${stickerName} sticker" loading="lazy" />`;
  }).join("");
  setupStickerPreview.innerHTML =
    `<p class="session-stepper-label setup-preview-label">Sticker Collection</p>` +
    `<div class="setup-preview-strip">${stickerItemsMarkup}</div>`;
}

function onEndActionButton() {
  if (state.sessionComplete) {
    resetSessionState();
    showSetupView();
    return;
  }
  startGame();
}

function startGame() {
  clearNextQuestionTimeout();
  stopAllSpeech();
  unlockAudio();
  if (state.sessionGamesPlayed === 0) {
    state.activeGamesPerSession = state.gamesPerSession;
  }

  if (!state.didStartOnce) {
    state.didStartOnce = true;
    speakWelcome(() => beginRound());
    return;
  }

  beginRound();
}

function beginRound() {
  const activeBounds = normalizeFactBounds(state.factLowerBound, state.factUpperBound);
  state.factLowerBound = activeBounds.lower;
  state.factUpperBound = activeBounds.upper;
  state.activeFactLowerBound = activeBounds.lower;
  state.activeFactUpperBound = activeBounds.upper;
  state.phase = "asking";
  state.questionIndex = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.streakCount = 0;
  state.comboCount = 0;
  state.normalStickerCount = 0;
  state.questionPool = buildQuestionPool(
    TOTAL_QUESTIONS,
    state.activeFactLowerBound,
    state.activeFactUpperBound
  );
  state.lastStickerId = null;
  state.nextQuestionDueAtMs = 0;
  state.questionPromptToken = 0;
  state.questionPromptTimeoutId = null;
  state.feedbackSpeechPlaying = false;
  state.feedbackSpeechDeadlineMs = 0;
  state.sessionComplete = false;

  starTray.innerHTML = "";
  stickerTray.innerHTML = "";
  typedAnswerInput.value = "";
  updateStats();

  setupView.classList.add("hidden");
  endGameView.classList.add("hidden");
  gameView.classList.remove("hidden");
  typedAnswerForm.classList.remove("hidden");

  askNextQuestion();
}

function askNextQuestion() {
  clearNextQuestionTimeout();
  if (state.questionIndex >= TOTAL_QUESTIONS) {
    endGame();
    return;
  }

  state.phase = "asking";
  let pair = state.questionPool[state.questionIndex];
  if (!pair) {
    state.questionPool = buildQuestionPool(
      TOTAL_QUESTIONS,
      state.activeFactLowerBound,
      state.activeFactUpperBound
    );
    state.questionIndex = 0;
    pair = state.questionPool[state.questionIndex];
  }
  state.questionIndex += 1;
  state.x = pair.x;
  state.y = pair.y;
  state.expected = state.x * state.y;
  state.questionPromptToken += 1;

  roundProgressText.textContent = `Question ${state.questionIndex} / ${TOTAL_QUESTIONS}`;
  questionText.textContent = `${state.x} × ${state.y} = ?`;
  setResultBox("Type your answer.", "");
  typedAnswerForm.classList.remove("hidden");
  typedAnswerInput.value = "";
  typedAnswerInput.focus();
  speakQuestionWhenReady(state.x, state.y, state.questionPromptToken);
}

function onTypedSubmit(event) {
  event.preventDefault();
  if (state.phase !== "asking") {
    return;
  }

  const raw = typedAnswerInput.value.trim();
  const parsed = parseTypedNumber(raw);
  if (parsed === null) {
    setResultBox("Please type a number.", "bad");
    return;
  }

  if (parsed === state.expected) {
    resolveCorrect();
  } else {
    resolveWrong(raw);
  }
}

function onTypedInput() {
  const digitsOnly = typedAnswerInput.value.replace(/\D/g, "").slice(0, 3);
  if (typedAnswerInput.value !== digitsOnly) {
    typedAnswerInput.value = digitsOnly;
  }
}

function onGlobalKeyDown(event) {
  const isEnter = event.key === "Enter" || event.code === "NumpadEnter";
  if (!isEnter || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
    return;
  }

  // Keep gameplay Enter behavior untouched so typed answers still submit normally.
  if (state.phase === "asking") {
    return;
  }

  if (isViewVisible(setupView)) {
    event.preventDefault();
    startGameButton.click();
    return;
  }

  if (isViewVisible(endGameView)) {
    event.preventDefault();
    restartButton.click();
  }
}

function resolveCorrect() {
  state.correctCount += 1;
  state.streakCount += 1;
  state.comboCount += 1;

  try {
    questionText.textContent = `${state.x} × ${state.y} = ${state.expected}`;
    addRewardStar();
    playBellRewardSound();

    if (state.streakCount >= STREAK_FOR_STICKER) {
      addRewardSticker();
      playRadiantRewardSound();
      state.normalStickerCount += 1;
      state.streakCount = 0;
    }

    if (state.comboCount >= COMBO_FOR_BONUS_STICKER) {
      addRewardSticker();
      playRadiantRewardSound();
      state.normalStickerCount += 1;
      state.comboCount = 0;
    }

    updateStats();

    const feedback = `Correct, ${state.x} times ${state.y} equals ${state.expected}.`;
    setResultBox(feedback, "good");
    speakFeedback(feedback);
  } catch (_error) {
    // Keep game flow progressing even if a non-critical UI/audio operation fails.
    setResultBox("Correct!", "good");
  }
  moveToAnsweredState();
}

function resolveWrong(rawInput) {
  state.wrongCount += 1;
  state.streakCount = 0;
  state.comboCount = 0;

  try {
    questionText.textContent = `${state.x} × ${state.y} = ${state.expected}`;
    addRewardCross();
    playIncorrectBuzzSound();
    updateStats();

    const heardPrefix = rawInput ? `You said ${rawInput}. ` : "";
    const feedback = `${heardPrefix}Incorrect, ${state.x} times ${state.y} equals ${state.expected}.`;
    setResultBox(feedback, "bad");
    speakFeedback(`Incorrect, ${state.x} times ${state.y} equals ${state.expected}.`);
  } catch (_error) {
    setResultBox("Incorrect.", "bad");
  }
  moveToAnsweredState();
}

function moveToAnsweredState() {
  state.phase = "answered";
  scheduleNextQuestionAdvance();
}

function endGame() {
  clearNextQuestionTimeout();
  state.phase = "ended";
  state.sessionGamesPlayed += 1;
  gameView.classList.add("hidden");
  setupView.classList.add("hidden");
  endGameView.classList.remove("hidden");

  if (state.sessionGamesPlayed >= state.activeGamesPerSession) {
    state.sessionComplete = true;
    endTitleText.textContent = "Session complete!";
    endSummaryText.textContent =
      `You completed ${state.activeGamesPerSession} games. ` +
      `Total stars: ${state.sessionStarCount}. ` +
      `Total stickers: ${state.sessionStickerCount}.`;
    renderSessionStickerBreakdown();
    restartButton.textContent = "Start Over";
    speakFinalSummary(
      `Session complete! You earned ${state.sessionStarCount} stars and ` +
        `${state.sessionStickerCount} stickers.`
    );
    return;
  }

  const endTitle = getEndTitleByScore(state.correctCount);
  const roundsLeft = state.activeGamesPerSession - state.sessionGamesPlayed;
  endTitleText.textContent = endTitle;
  endSummaryText.textContent =
    `You got ${state.correctCount} out of ${TOTAL_QUESTIONS} correct. ` +
    `You earned ${state.correctCount} stars and ${state.normalStickerCount} stickers this round. ` +
    `Total: ${state.sessionStarCount} stars and ${state.sessionStickerCount} stickers. ` +
    `${roundsLeft} game${roundsLeft === 1 ? "" : "s"} left in this session.`;
  clearSessionStickerBreakdown();
  restartButton.textContent = "Resume Game";
  speakFinalSummary(`${endTitle} ${endSummaryText.textContent}`);
}

function getEndTitleByScore(correctCount) {
  if (correctCount <= 4) {
    return "Let's practice more!";
  }
  if (correctCount <= 8) {
    return "Making progress!";
  }
  return "Great job!";
}

function showSetupView() {
  gameView.classList.add("hidden");
  endGameView.classList.add("hidden");
  setupView.classList.remove("hidden");
}

function isViewVisible(viewNode) {
  return !viewNode.classList.contains("hidden");
}

function resetSessionState({ preserveSelection = true } = {}) {
  clearNextQuestionTimeout();
  stopAllSpeech();
  const retainedGamesPerSession = preserveSelection
    ? state.gamesPerSession
    : DEFAULT_GAMES_PER_SESSION;
  const retainedFactLowerBound = preserveSelection
    ? state.factLowerBound
    : DEFAULT_FACT_LOWER_BOUND;
  const retainedFactUpperBound = preserveSelection
    ? state.factUpperBound
    : DEFAULT_FACT_UPPER_BOUND;
  const clampedGamesPerSession = clampGamesPerSession(retainedGamesPerSession);
  const normalizedFactBounds = normalizeFactBounds(retainedFactLowerBound, retainedFactUpperBound);
  state.phase = "setup";
  state.questionIndex = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.streakCount = 0;
  state.comboCount = 0;
  state.normalStickerCount = 0;
  state.sessionStarCount = 0;
  state.sessionStickerCount = 0;
  state.sessionGamesPlayed = 0;
  state.gamesPerSession = clampedGamesPerSession;
  state.activeGamesPerSession = clampedGamesPerSession;
  state.factLowerBound = normalizedFactBounds.lower;
  state.factUpperBound = normalizedFactBounds.upper;
  state.activeFactLowerBound = normalizedFactBounds.lower;
  state.activeFactUpperBound = normalizedFactBounds.upper;
  state.sessionStickerTypeCounts = createEmptyStickerCountMap();
  state.sessionEarnedStickerIds = [];
  state.questionPool = [];
  state.nextQuestionDueAtMs = 0;
  state.questionPromptToken = 0;
  state.questionPromptTimeoutId = null;
  state.feedbackSpeechPlaying = false;
  state.feedbackSpeechDeadlineMs = 0;
  state.lastStickerId = null;
  state.sessionComplete = false;
  state.didStartOnce = false;
  typedAnswerInput.value = "";
  starTray.innerHTML = "";
  stickerTray.innerHTML = "";
  restartButton.textContent = "Resume Game";
  clearSessionStickerBreakdown();
  updateSessionGamesControl();
  updateFactRangeControls();
  updateStats();
}

function clampGamesPerSession(value) {
  return Math.max(MIN_GAMES_PER_SESSION, Math.min(MAX_GAMES_PER_SESSION, value));
}

function clampFactValue(value) {
  return Math.max(MIN_FACT_VALUE, Math.min(MAX_FACT_VALUE, value));
}

function normalizeFactBounds(lowerBound, upperBound) {
  const clampedLower = clampFactValue(lowerBound);
  const clampedUpper = clampFactValue(upperBound);
  return {
    lower: Math.min(clampedLower, clampedUpper),
    upper: Math.max(clampedLower, clampedUpper),
  };
}

function updateGamesPerSession(delta) {
  const nextValue = clampGamesPerSession(state.gamesPerSession + delta);
  if (nextValue === state.gamesPerSession) {
    updateSessionGamesControl();
    return;
  }
  state.gamesPerSession = nextValue;
  updateSessionGamesControl();
}

function updateSessionGamesControl() {
  sessionGamesValueText.textContent = String(state.gamesPerSession);
  const atMin = state.gamesPerSession <= MIN_GAMES_PER_SESSION;
  const atMax = state.gamesPerSession >= MAX_GAMES_PER_SESSION;
  sessionGamesDecrementButton.disabled = atMin;
  sessionGamesIncrementButton.disabled = atMax;
  sessionGamesDecrementButton.setAttribute("aria-disabled", String(atMin));
  sessionGamesIncrementButton.setAttribute("aria-disabled", String(atMax));
}

function updateFactLowerBound(delta) {
  const nextValue = clampFactValue(state.factLowerBound + delta);
  if (nextValue === state.factLowerBound) {
    updateFactRangeControls();
    return;
  }
  state.factLowerBound = nextValue;
  if (state.factLowerBound > state.factUpperBound) {
    state.factUpperBound = state.factLowerBound;
  }
  updateFactRangeControls();
}

function updateFactUpperBound(delta) {
  const nextValue = clampFactValue(state.factUpperBound + delta);
  if (nextValue === state.factUpperBound) {
    updateFactRangeControls();
    return;
  }
  state.factUpperBound = nextValue;
  if (state.factUpperBound < state.factLowerBound) {
    state.factLowerBound = state.factUpperBound;
  }
  updateFactRangeControls();
}

function updateFactRangeControls() {
  rangeLowerValueText.textContent = String(state.factLowerBound);
  rangeUpperValueText.textContent = String(state.factUpperBound);

  const lowerAtMin = state.factLowerBound <= MIN_FACT_VALUE;
  const lowerAtMax = state.factLowerBound >= MAX_FACT_VALUE;
  const upperAtMin = state.factUpperBound <= MIN_FACT_VALUE;
  const upperAtMax = state.factUpperBound >= MAX_FACT_VALUE;

  rangeLowerDecrementButton.disabled = lowerAtMin;
  rangeLowerIncrementButton.disabled = lowerAtMax;
  rangeUpperDecrementButton.disabled = upperAtMin;
  rangeUpperIncrementButton.disabled = upperAtMax;

  rangeLowerDecrementButton.setAttribute("aria-disabled", String(lowerAtMin));
  rangeLowerIncrementButton.setAttribute("aria-disabled", String(lowerAtMax));
  rangeUpperDecrementButton.setAttribute("aria-disabled", String(upperAtMin));
  rangeUpperIncrementButton.setAttribute("aria-disabled", String(upperAtMax));
}

function updateStats() {
  correctCountText.textContent = String(state.correctCount);
  streakText.textContent = String(state.streakCount);
  comboText.textContent = String(state.comboCount);
  sessionStarCountText.textContent = String(state.sessionStarCount);
  sessionStickerCountText.textContent = String(state.sessionStickerCount);
}

function addRewardStar() {
  const node = document.createElement("span");
  node.className = "reward-star";
  node.textContent = "⭐";
  starTray.appendChild(node);
  state.sessionStarCount += 1;
}

function addRewardCross() {
  const node = document.createElement("span");
  node.className = "reward-cross";
  node.textContent = "✖";
  starTray.appendChild(node);
}

function addRewardSticker() {
  const sticker = pickStickerAvoidImmediateRepeat();
  const node = document.createElement("img");
  node.className = "reward-friend";
  node.alt = "Sticker reward";
  node.src = sticker.src;
  stickerTray.appendChild(node);
  state.sessionStickerCount += 1;
  state.sessionStickerTypeCounts[sticker.id] =
    (state.sessionStickerTypeCounts[sticker.id] || 0) + 1;
  state.sessionEarnedStickerIds.push(sticker.id);
}

function createEmptyStickerCountMap() {
  const counts = {};
  STICKER_CATALOG.forEach((sticker) => {
    counts[sticker.id] = 0;
  });
  return counts;
}

function clearSessionStickerBreakdown() {
  sessionStickerBreakdown.innerHTML = "";
  sessionStickerBreakdown.classList.add("hidden");
}

function renderSessionStickerBreakdown() {
  if (state.sessionEarnedStickerIds.length === 0) {
    clearSessionStickerBreakdown();
    return;
  }

  const stickerById = new Map(STICKER_CATALOG.map((sticker) => [sticker.id, sticker]));
  const wallMarkup = state.sessionEarnedStickerIds
    .map((stickerId) => {
      const sticker = stickerById.get(stickerId);
      if (!sticker) {
        return `<div class="session-sticker-wall-fallback" aria-hidden="true">?</div>`;
      }
      const stickerName = formatStickerName(stickerId);
      return `<img class="reward-friend session-wall-sticker" src="${sticker.src}" alt="${stickerName} sticker" loading="lazy" />`;
    })
    .join("");

  sessionStickerBreakdown.innerHTML =
    `<h3>Sticker Wall</h3>` +
    `<div class="session-sticker-wall">${wallMarkup}</div>`;
  sessionStickerBreakdown.classList.remove("hidden");
}

function formatStickerName(stickerId) {
  return stickerId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pickUniformSticker() {
  return STICKER_CATALOG[randomInt(0, STICKER_CATALOG.length - 1)];
}

function pickStickerAvoidImmediateRepeat() {
  const maxRerolls = 4;
  let picked = pickUniformSticker();
  let rerolls = 0;

  while (
    STICKER_CATALOG.length > 1 &&
    state.lastStickerId &&
    picked.id === state.lastStickerId &&
    rerolls < maxRerolls
  ) {
    picked = pickUniformSticker();
    rerolls += 1;
  }

  state.lastStickerId = picked.id;
  return picked;
}

function speakWelcome(onDone) {
  speakMessage("Welcome to Magic Multiplication.", onDone, 7000);
}

function speakQuestion(x, y, onDone) {
  speakMessage(`What is ${x} times ${y}?`, onDone, 6000);
}

function speakQuestionWhenReady(x, y, token, startedAtMs = Date.now()) {
  if (state.phase !== "asking" || token !== state.questionPromptToken) {
    return;
  }

  const synth = window.speechSynthesis;
  const maxWaitMs = 6000;
  const timedOut = Date.now() - startedAtMs >= maxWaitMs;

  if (!synth || timedOut || (!synth.speaking && !synth.pending)) {
    if (state.phase === "asking" && token === state.questionPromptToken) {
      speakQuestion(x, y);
    }
    return;
  }

  if (state.questionPromptTimeoutId) {
    window.clearTimeout(state.questionPromptTimeoutId);
  }
  state.questionPromptTimeoutId = window.setTimeout(
    () => speakQuestionWhenReady(x, y, token, startedAtMs),
    150
  );
}

function speakFeedback(text) {
  state.feedbackSpeechPlaying = true;
  state.feedbackSpeechDeadlineMs = Date.now() + FEEDBACK_SPEECH_MAX_WAIT_MS;
  speakMessage(
    text,
    () => {
      state.feedbackSpeechPlaying = false;
      state.feedbackSpeechDeadlineMs = 0;
    },
    FEEDBACK_SPEECH_MAX_WAIT_MS
  );
}

function speakFinalSummary(text) {
  speakMessage(text, null, 6500);
}

function speakMessage(text, onDone, timeoutMs = 4500) {
  if (!window.speechSynthesis) {
    if (typeof onDone === "function") {
      onDone();
    }
    return;
  }

  const synth = window.speechSynthesis;
  const maxWaitMs = Math.max(timeoutMs, 2000 + text.length * 90);

  try {
    synth.resume?.();
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.95;

    let safetyTimeoutId = null;
    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      if (safetyTimeoutId !== null) {
        window.clearTimeout(safetyTimeoutId);
      }
      if (typeof onDone === "function") {
        onDone();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    synth.speak(utterance);
    safetyTimeoutId = window.setTimeout(finish, maxWaitMs);
  } catch (_error) {
    if (typeof onDone === "function") {
      onDone();
    }
  }
}

function stopAllSpeech() {
  window.speechSynthesis?.cancel();
}

function clearNextQuestionTimeout() {
  if (state.nextQuestionTimeoutId) {
    window.clearTimeout(state.nextQuestionTimeoutId);
    state.nextQuestionTimeoutId = null;
  }
  if (state.questionPromptTimeoutId) {
    window.clearTimeout(state.questionPromptTimeoutId);
    state.questionPromptTimeoutId = null;
  }
  state.nextQuestionDueAtMs = 0;
}

function tryAutoAdvanceToNextQuestion() {
  if (state.phase !== "answered") {
    return;
  }

  const delayDone = Date.now() >= state.nextQuestionDueAtMs;
  const speechTimedOut =
    state.feedbackSpeechPlaying && Date.now() >= state.feedbackSpeechDeadlineMs;

  if (speechTimedOut) {
    state.feedbackSpeechPlaying = false;
    state.feedbackSpeechDeadlineMs = 0;
  }

  if (delayDone && !state.feedbackSpeechPlaying) {
    askNextQuestion();
    return;
  }

  state.nextQuestionTimeoutId = window.setTimeout(tryAutoAdvanceToNextQuestion, 120);
}

function scheduleNextQuestionAdvance() {
  clearNextQuestionTimeout();
  state.nextQuestionDueAtMs = Date.now() + AUTO_NEXT_DELAY_MS;
  state.nextQuestionTimeoutId = window.setTimeout(tryAutoAdvanceToNextQuestion, 120);
}

function unlockAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume().catch(() => {});
  }
}

function playBellRewardSound() {
  playRewardToneSequence([
    { frequency: 880, start: 0.0, duration: 0.14, gain: 0.34, type: "sine" },
    { frequency: 1318, start: 0.07, duration: 0.2, gain: 0.28, type: "triangle" },
  ]);
}

function playRadiantRewardSound() {
  playRewardToneSequence([
    { frequency: 660, start: 0.0, duration: 0.14, gain: 0.28, type: "sine" },
    { frequency: 990, start: 0.08, duration: 0.19, gain: 0.32, type: "triangle" },
    { frequency: 1480, start: 0.16, duration: 0.25, gain: 0.36, type: "sine" },
    { frequency: 1760, start: 0.24, duration: 0.3, gain: 0.3, type: "triangle" },
  ]);
}

function playIncorrectBuzzSound() {
  playRewardToneSequence([
    { frequency: 260, start: 0.0, duration: 0.09, gain: 0.34, type: "sawtooth" },
    { frequency: 220, start: 0.08, duration: 0.1, gain: 0.36, type: "triangle" },
    { frequency: 180, start: 0.17, duration: 0.12, gain: 0.34, type: "sawtooth" },
  ]);
}

function playRewardToneSequence(tones) {
  try {
    unlockAudio();
    if (!sharedAudioContext) {
      return;
    }

    const now = sharedAudioContext.currentTime;
    tones.forEach((tone) => {
      const osc = sharedAudioContext.createOscillator();
      const gain = sharedAudioContext.createGain();
      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.frequency, now + tone.start);

      gain.gain.setValueAtTime(0.0001, now + tone.start);
      gain.gain.exponentialRampToValueAtTime(tone.gain, now + tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.duration);

      osc.connect(gain);
      gain.connect(sharedAudioContext.destination);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.duration + 0.02);
    });
  } catch (_error) {
    // Audio is optional; ignore playback errors.
  }
}

function buildQuestionPool(count, lowerBound = DEFAULT_FACT_LOWER_BOUND, upperBound = DEFAULT_FACT_UPPER_BOUND) {
  const pairs = [];
  const normalizedBounds = normalizeFactBounds(lowerBound, upperBound);
  for (let x = normalizedBounds.lower; x <= normalizedBounds.upper; x += 1) {
    for (let y = normalizedBounds.lower; y <= normalizedBounds.upper; y += 1) {
      pairs.push({ x, y });
    }
  }
  shuffleArray(pairs);
  if (pairs.length >= count) {
    return pairs.slice(0, count);
  }

  const extendedPairs = [...pairs];
  let nextPairIndex = 0;
  while (extendedPairs.length < count) {
    extendedPairs.push(pairs[nextPairIndex % pairs.length]);
    nextPairIndex += 1;
  }
  return extendedPairs;
}

function shuffleArray(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    const temp = items[i];
    items[i] = items[j];
    items[j] = temp;
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseTypedNumber(text) {
  if (!text) {
    return null;
  }
  const parsed = Number.parseInt(text.replace(/\D/g, ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

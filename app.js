const TOTAL_QUESTIONS = 10;
const AUTO_NEXT_DELAY_MS = 2000;
const FEEDBACK_SPEECH_MAX_WAIT_MS = 5000;
const STREAK_FOR_STICKER = 3;
const COMBO_FOR_BONUS_STICKER = 10;

const STICKER_IMAGE_PATHS = [
  "./assets/stickers/sanrio_kitty_bow.svg",
  "./assets/stickers/sanrio_bunny_ribbon.svg",
  "./assets/stickers/sanrio_puppy_cloud.svg",
];

const setupView = document.getElementById("setupView");
const gameView = document.getElementById("gameView");
const endGameView = document.getElementById("endGameView");
const startGameButton = document.getElementById("startGameButton");
const restartButton = document.getElementById("restartButton");
const setupStatus = document.getElementById("setupStatus");
const endSummaryText = document.getElementById("endSummaryText");

const roundProgressText = document.getElementById("roundProgressText");
const questionText = document.getElementById("questionText");
const resultBox = document.getElementById("resultBox");
const typedAnswerForm = document.getElementById("typedAnswerForm");
const typedAnswerInput = document.getElementById("typedAnswerInput");
const correctCountText = document.getElementById("correctCountText");
const streakText = document.getElementById("streakText");
const comboText = document.getElementById("comboText");
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
  stickerIndex: 0,
  didStartOnce: false,
};

let sharedAudioContext = null;

startGameButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
typedAnswerForm.addEventListener("submit", onTypedSubmit);
typedAnswerInput.addEventListener("input", onTypedInput);

initialize();

function initialize() {
  showSetupView();
  renderSetupStatus("Tap Start to begin.");
}

function startGame() {
  clearNextQuestionTimeout();
  stopAllSpeech();
  unlockAudio();

  if (!state.didStartOnce) {
    state.didStartOnce = true;
    renderSetupStatus("Welcome!");
    speakWelcome(() => beginRound());
    return;
  }

  beginRound();
}

function beginRound() {
  state.phase = "asking";
  state.questionIndex = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.streakCount = 0;
  state.comboCount = 0;
  state.normalStickerCount = 0;
  state.questionPool = buildQuestionPool(TOTAL_QUESTIONS);
  state.stickerIndex = 0;
  state.nextQuestionDueAtMs = 0;
  state.questionPromptToken = 0;
  state.questionPromptTimeoutId = null;
  state.feedbackSpeechPlaying = false;
  state.feedbackSpeechDeadlineMs = 0;

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
    state.questionPool = buildQuestionPool(TOTAL_QUESTIONS);
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
  gameView.classList.add("hidden");
  setupView.classList.add("hidden");
  endGameView.classList.remove("hidden");

  const summary =
    `You got ${state.correctCount} out of ${TOTAL_QUESTIONS} correct. ` +
    `You earned ${state.correctCount} stars and ${state.normalStickerCount} stickers.`;
  endSummaryText.textContent = summary;
  speakFinalSummary(summary);
}

function showSetupView() {
  gameView.classList.add("hidden");
  endGameView.classList.add("hidden");
  setupView.classList.remove("hidden");
}

function updateStats() {
  correctCountText.textContent = String(state.correctCount);
  streakText.textContent = String(state.streakCount);
  comboText.textContent = String(state.comboCount);
}

function renderSetupStatus(text) {
  setupStatus.textContent = text;
}

function addRewardStar() {
  const node = document.createElement("span");
  node.className = "reward-star";
  node.textContent = "⭐";
  starTray.appendChild(node);
}

function addRewardCross() {
  const node = document.createElement("span");
  node.className = "reward-cross";
  node.textContent = "✖";
  starTray.appendChild(node);
}

function addRewardSticker() {
  const node = document.createElement("img");
  node.className = "reward-friend";
  node.alt = "Sanrio sticker reward";
  node.src = STICKER_IMAGE_PATHS[state.stickerIndex % STICKER_IMAGE_PATHS.length];
  state.stickerIndex += 1;
  stickerTray.appendChild(node);
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

function buildQuestionPool(count) {
  const pairs = [];
  for (let x = 2; x <= 10; x += 1) {
    for (let y = 2; y <= 10; y += 1) {
      pairs.push({ x, y });
    }
  }
  shuffleArray(pairs);
  return pairs.slice(0, count);
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

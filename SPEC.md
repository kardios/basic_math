# Magic Multiplication - Product Specification (Rebuild)

## 1) Product Summary

Magic Multiplication is a browser-based practice game for children to improve multiplication fluency.
The app presents one multiplication question at a time, accepts typed numeric answers, provides spoken prompts and feedback, and gives visual rewards to keep motivation high.

Target learner: early elementary students practicing multiplication facts.
Primary fact range: 2 through 10.

## 2) Goals

- Help the learner complete a short, focused practice round (10 questions).
- Reinforce correct answers with immediate positive feedback.
- Keep interaction simple enough for independent child use.
- Maintain a fun, reward-driven experience without complex setup.

## 3) Non-Goals

- No user accounts, progress history, or cloud sync.
- No adaptive difficulty algorithm in this version.
- No microphone input (typed answers only).
- No multiplayer or classroom mode.

## 4) Core Gameplay Rules

### 4.1 Round Structure

- A round consists of exactly 10 questions.
- Each question is a multiplication fact where both operands are integers from 2 to 10 inclusive.
- At question 10 completion, the round ends and an end-of-round summary is shown.

### 4.2 Question Selection and Randomization

- For each round, build a candidate pool of all operand pairs from 2 to 10.
- Shuffle the pool and use the first 10 pairs for that round.
- Questions within a round must not repeat the same operand pair.
- A new round must reshuffle and produce a fresh set/order.

### 4.3 Answer Input and Validation

- Input method is typed text only.
- Input must accept numeric digits only (`0-9`).
- Non-digit characters are not permitted in the final submitted value.
- Empty input is invalid and must show a clear prompt to enter a number.
- Submission occurs on pressing the submit button or Enter key in the input field.

### 4.4 Correctness Rules

- Correct when parsed numeric input equals `x * y`.
- Incorrect otherwise.
- After answer evaluation, show the resolved equation in the question area (`x × y = z`).
- For an incorrect non-empty typed answer, the displayed feedback may include `You said N.` before the correction.

### 4.5 Advance Timing

- After each evaluated answer, advance automatically to the next question after 2 seconds.
- No manual Next button is required.
- Voice playback must not permanently block progression.

### 4.6 End of Round

- After question 10 is evaluated, show end screen with score summary.
- End screen includes a restart button to begin a new 10-question round.

## 5) Scoring and Rewards

### 5.1 Counters

- Track:
  - Correct count
  - Wrong count
  - Streak count (consecutive correct for 3-streak sticker)
  - Combo count (consecutive correct for 10-combo sticker)

### 5.2 Reward Rules

- Each correct answer: add one star reward.
- Each incorrect answer: add one red cross marker in the star/reward area.
- On every 3 consecutive correct answers:
  - Add one regular sticker reward.
  - Reset streak count to 0.
- On every 10 consecutive correct answers:
  - Add one sticker reward.
  - Reset combo count to 0.
- Any incorrect answer resets both streak and combo to 0.

## 6) Voice Behavior (Typed + Spoken UX)

### 6.1 Speech Events

- On first start interaction, speak welcome message:
  - "Welcome to Magic Multiplication."
- For each question, speak:
  - "What is X times Y?"
- After answer evaluation:
  - Correct: "Correct, X times Y equals Z."
  - Incorrect: "Incorrect, X times Y equals Z."
- At end of round, speak summary:
  - "You got N out of 10 correct." plus earned reward counts.

### 6.2 Speech Reliability Rules

- If speech synthesis is unavailable, gameplay must still function fully.
- If a speech event errors or times out, game must continue without freezing.
- Speech should never prevent question progression beyond the defined 2-second advance behavior.

### 6.3 Sound Effects Reliability Rules

- Optional Web Audio sound effects may play for:
  - Correct answer reward
  - Sticker milestone reward
  - Incorrect answer feedback
- If sound playback is unavailable or fails, gameplay must continue without freezing.
- Sound effects must not block question progression beyond the defined 2-second advance behavior.

## 7) UI Requirements

### 7.1 Start Screen

- Display title text: "Welcome to Magic Multiplication" in the main header/hero.
- Setup panel may include a short subheading (for example, "Before You Start") plus helper text.
- Display short helper text explaining 10-question typing game.
- Provide a clear primary button: "Start Game".
- Display lightweight status text area for startup messaging.

### 7.2 Game Screen

- Show round progress as `Question X / 10`.
- Show current question prominently as `X × Y = ?`.
- Show a result/feedback box below question.
- Show numeric-only answer input and submit control.
- Show score row with:
  - Correct count
  - Streak count
  - Combo count
- Show reward section split into:
  - Stars/crosses area
  - Sticker area

### 7.3 End Screen

- Show positive completion heading.
- Show summary sentence with:
  - Correct answers out of 10
  - Star count
  - Sticker count
- Show restart button.

## 8) Edge Cases and Deterministic Behavior

- Empty answer:
  - Do not evaluate as wrong.
  - Show "Please type a number."
- Invalid characters:
  - Strip/reject non-digit characters before evaluation.
- Speech blocked or unavailable:
  - Continue silently with normal gameplay.
- Rapid repeated submissions:
  - Only accept submissions while question phase is active.
- Timing overlaps:
  - Ensure only one next-question transition is active at a time.

## 9) Acceptance Criteria (Pass/Fail)

### 9.1 Round and Progression

- Starting a round always displays `Question 1 / 10`.
- After each answered question, UI advances to the next question within approximately 2 seconds.
- Round ends after exactly 10 evaluated questions.

### 9.2 Randomization

- In a single round, no operand pair is repeated.
- Across two back-to-back rounds, question order differs in most runs due to reshuffle.

### 9.3 Input and Evaluation

- Input field does not retain letters/symbols as final answer text.
- Correct answers increment correct count and add one star.
- Incorrect answers increment wrong count and add one red cross.

### 9.4 Reward Milestones

- Every 3 consecutive correct answers yields one regular sticker and resets 3-streak counter.
- Every 10 consecutive correct answers yields one sticker and resets 10-combo counter.
- Any incorrect answer resets both streak and combo counters.

### 9.5 Voice

- Welcome, question prompts, answer feedback, and end summary are attempted via speech synthesis.
- If speech fails, app remains fully playable and progression still works.

## 10) Out of Scope (This Version)

- Fact ranges beyond 2-10.
- Difficulty levels or adaptive sequencing.
- Persistent profiles, saved scores, badges, or parental dashboards.
- Localization/multi-language UI.
- Microphone answer mode.

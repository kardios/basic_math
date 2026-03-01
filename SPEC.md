# Magic Multiplication - Product Specification (Rebuild)

## 1) Product Summary

Magic Multiplication is a browser-based practice game for children to improve multiplication fluency.
The app presents one multiplication question at a time, accepts typed numeric answers, provides spoken prompts and feedback, and gives visual rewards to keep motivation high.

Target learner: early elementary students practicing multiplication facts.
Primary fact range defaults to 2 through 10 and is configurable from 2 through 19.

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
- Each question is a multiplication fact where both operands are integers from the selected bounds (inclusive).
- At question 10 completion, the round ends and an end-of-round summary is shown.
- Rounds are grouped into a session with configurable length (`gamesPerSession`).
- Session length defaults to 5 rounds and is adjustable on the start screen from 1 to 20 rounds.

### 4.2 Question Selection and Randomization

- For each round, build a candidate pool of all operand pairs within the selected lower and upper bounds.
- Shuffle the pool and use the first 10 pairs for that round.
- If the candidate pool has at least 10 unique pairs, questions within a round must not repeat the same operand pair.
- If the candidate pool has fewer than 10 unique pairs, repeat operand pairs as needed to still produce 10 questions.
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

- After question 10 is evaluated, show end screen.
- If the session is not complete, show per-round summary and `Resume Game` to begin the next round.
- If the session is complete, show final session summary and `Start Over`.
- Starting a new session resets session progress counters and keeps the currently selected session-length value.

## 5) Scoring and Rewards

### 5.1 Counters

- Track:
  - Correct count
  - Wrong count
  - Streak count (consecutive correct for 3-streak sticker)
  - Combo count (consecutive correct for 10-combo sticker)
  - Total stars count (across the current browser session)
  - Total stickers count (across the current browser session)
  - Session games played
  - Configured games per session
  - Per-sticker-type session counts for final collection breakdown
  - Earned sticker instance list for final sticker wall rendering (duplicates included)

Session totals are in-memory only (no local storage) and reset on page refresh/reopen.

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

### 5.3 Sticker Selection Rules

- Sticker selection uses equal probability across all entries in `STICKER_CATALOG`.
- Current catalog size is 14 stickers.
- Selection source of truth is the catalog array (adding/removing entries changes draw probability automatically).
- Immediate duplicate stickers are avoided with bounded rerolls.
  - If a drawn sticker equals the previous sticker, reroll up to 4 times.
  - If still duplicated after rerolls, accept the draw.

## 6) Voice Behavior (Typed + Spoken UX)

### 6.1 Speech Events

- On first start interaction, speak welcome message:
  - "Welcome to Magic Multiplication."
- For each question, speak:
  - "What is X times Y?"
- After answer evaluation:
  - Correct: "Correct, X times Y equals Z."
  - Incorrect: "Incorrect, X times Y equals Z."
- At round/session end, speak context-appropriate summary:
  - Non-final round: "You got N out of 10 correct." plus round/session totals.
  - Final session end: "Session complete! You earned X stars and Y stickers."

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

- Display title text: "Magic Multiplication" in the main header/hero.
- Show session-length stepper labeled "Games this session".
  - Decrement (`-`) and increment (`+`) controls.
  - Default value `5`, min `1`, max `20`.
- Show multiplication range steppers:
  - `Lower bound` and `Upper bound`.
  - Decrement (`-`) and increment (`+`) controls for each.
  - Allowed values `2` through `19`.
  - Default values lower `2`, upper `10`.
  - Bounds auto-correct to keep `lower <= upper`.
- Show a compact sticker preview bar on the opening screen displaying all catalog stickers.
- Provide a clear primary button: "Start Game".

### 7.2 Game Screen

- Show round progress as `Question X / 10`.
- Show current question prominently as `X × Y = ?`.
- Show a result/feedback box below question.
- Show numeric-only answer input and submit control.
- Show score row with:
  - Correct count
  - Streak count
  - Combo count
- Show totals row with:
  - Total Stars
  - Total Stickers
- Show reward section split into:
  - Stars/crosses area
  - Sticker area

### 7.3 End Screen

- Show end-of-round heading and summary content.
- Non-final rounds:
  - Show score summary with round result and session totals.
  - Show `Resume Game` button.
- Final session end:
  - Show heading "Session complete!".
  - Show final totals for stars and stickers.
  - Show a celebratory sticker wall with every earned sticker instance (duplicates included).
  - Sticker wall tiles use the same visual size as in-game sticker rewards.
  - Show `Start Over` button.
- Final-mode sticker wall replaces the compact breakdown content in the same wrap-up container.
- Wrap-up sticker wall uses a responsive wrapping layout for full-size stickers and scrolls if needed.

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
- `Resume Game` from non-final end screen starts the next 10-question round in the same session.
- Session completes after the configured number of rounds.
- On session completion, end screen shows final summary and `Start Over`.

### 9.2 Randomization

- In a single round, no operand pair is repeated when the selected bounds provide at least 10 unique pairs.
- When selected bounds provide fewer than 10 unique pairs, repeated pairs are expected to fill the round to 10 questions.
- Across two back-to-back rounds, question order differs in most runs due to reshuffle.

### 9.3 Input and Evaluation

- Input field does not retain letters/symbols as final answer text.
- Correct answers increment correct count and add one star.
- Incorrect answers increment wrong count and add one red cross.

### 9.4 Reward Milestones

- Every 3 consecutive correct answers yields one regular sticker and resets 3-streak counter.
- Every 10 consecutive correct answers yields one sticker and resets 10-combo counter.
- Any incorrect answer resets both streak and combo counters.
- Total stars/stickers continue across rounds during the same page session.
- Total stars/stickers reset when the page is refreshed or reopened.

### 9.5 Session Length Control

- Start screen stepper initially shows `5`.
- Decrement and increment controls clamp at `1` and `20`.
- Selected session length is applied at session start.
- Completing that many rounds triggers final session summary.
- Starting a new session preserves the selected stepper value.

### 9.6 Fact Range Control

- Start screen shows lower/upper bound steppers with defaults `2` and `10`.
- Bound steppers clamp at `2` and `19`.
- Bounds auto-correct so lower never exceeds upper.
- Selected bounds are applied to both operands when generating questions.
- Selected bounds persist across rounds and new sessions until changed.

### 9.7 Sticker Draw and Wrap-Up Collection

- Sticker draw is approximately uniform across catalog entries over many draws.
- Immediate back-to-back duplicates are reduced by reroll logic.
- Final session wrap-up displays every earned sticker instance in a full-size sticker wall (duplicates included).
- Earned sticker instance tracking is reset only when a new session starts, not between rounds.

### 9.8 Voice

- Welcome, question prompts, answer feedback, and end summary are attempted via speech synthesis.
- If speech fails, app remains fully playable and progression still works.
- End-state voice check:
  - Non-final end screen speech includes `N out of 10`.
  - Final session-end speech includes `Session complete` and total stars/stickers.

## 10) Out of Scope (This Version)

- Fact ranges outside 2-19.
- Difficulty levels or adaptive sequencing.
- Persistent profiles, saved scores, badges, or parental dashboards.
- Localization/multi-language UI.
- Microphone answer mode.

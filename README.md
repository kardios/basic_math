# Magic Multiplication

A lightweight browser game for multiplication practice with round-based sessions, reward collection, and post-game review.

## How to Run

No build step is required.

- Open `index.html` in a browser, or
- Serve the folder with any static server and open the served URL.

## Gameplay Flow

1. Configure your session on the opening page:
   - `How many rounds?`
   - `Smallest number`
   - `Largest number`
2. Press `Start Game`.
3. Type answers and submit.
4. Each round has `10` questions.
5. At round end, review results and continue with `Next Game` (or `Start Over` when session is complete).

## Current UI Structure

### Opening Page

- Setup-only welcome bar: `Welcome to Magic Multiplication!`
- Collapsible: `Sticker Collection`
- Collapsible: `Game Settings` (round count + number bounds)

### In-Game Page

- Question prompt and typed answer input
- Feedback box (correct/incorrect message)
- Collapsible: `Rewards`
- Collapsible: `Game stats` showing:
  - `Game: x/y` (current round / total rounds in session)
  - `Correct: n/10`
  - `Streak`
  - `Combo`
  - `Total Stars`
  - `Total Stickers`

### Post-Game Page

- Round summary text
- Wrong-answer review (collapsible), listing missed questions and correct answers
- Session sticker wall (shown when session completes)
- `Next Game` button for non-final rounds

## Rewards and Scoring

- Correct answer:
  - Adds a star
  - Increases streak and combo
- Incorrect answer:
  - Resets streak and combo
  - Shows `You typed ...` in on-screen feedback
- Stickers:
  - Awarded on streak/combo milestones
  - Added to session totals and sticker wall

## Tech Notes

- Stack: plain HTML, CSS, and JavaScript (no framework).
- Main files:
  - `index.html`
  - `styles.css`
  - `app.js`

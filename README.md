# SpaceRep

A minimalist spaced repetition flashcard application built with **Node.js**, **SQLite**, and vanilla **HTML/CSS/JS**. 

---

## ✨ Features

- **Standard SM-2 Spaced Repetition**: Proven interval scheduling (Again, Hard, Good, Easy) that adapts to your recall speed.
- **Interval Previews on Buttons**: Shows exactly when you will see a card next (e.g. `1d`, `3d`, `7d`, `24d`) directly on each rating button.
- **Fast Keyboard Shortcuts**:
  - `[Space]` — Reveal solution
  - `[ 1 ]` — Again (Reset to 1 day)
  - `[ 2 ]` — Hard (Conservative interval increase)
  - `[ 3 ]` — Good (Standard SM-2 progression)
  - `[ 4 ]` — Easy (Bonus interval progression)
  - `[Esc]` — Return to deck list or close modals
  - `[Cmd / Ctrl + Enter]` — Quick-save cards in modal
- **Deck Management & Card Browser**:
  - Live search filter to find any card in a deck instantly.
  - Filter by all cards vs due cards.
  - Quick-entry mode ("Save & Add Another") for building decks rapidly.
- **Study Statistics & Activity Log**:
  - Track current and highest study streaks.
  - 14-day daily review activity strip.
  - Breakdown by mastery levels (Learning, Reviewing, Familiar, Mastered, Deep Memory).
- **100% Local Persistence**:
  - Data saves directly to `./data/spacerep.db` on your computer.
  - Zero cloud dependencies, zero telemetry, full offline capability.
  - 1-click JSON backup export and import.

---

# Images
<img width="923" height="927" alt="image" src="https://github.com/user-attachments/assets/199acab9-2507-412b-8238-939f400a50bd" />





---

## 🚀 Quickstart

### Prerequisites
- **Node.js** (v18, v20, v22, or higher)
- **npm**

### 1. Install dependencies
```bash
npm install
```

### 2. Start the application
```bash
npm start
```
*(Or use `npm run dev` to automatically reload on code edits).*

### 3. Open in your browser
Navigate to:
```
http://localhost:3030
```

---

## 📁 Project Structure

```
space_rep/
├── data/
│   └── spacerep.db      # Local SQLite database (created automatically)
├── db/
│   ├── database.js      # SQLite connection & schema
│   ├── sm2.js           # SM-2 scheduling algorithm & interval calculator
│   └── seed_data.js     # Starter decks (Web Dev, CS, Spanish)
├── public/
│   ├── css/
│   │   └── style.css    # Obsidian-inspired minimalist stylesheet
│   ├── js/
│   │   └── app.js       # Frontend UI logic, shortcuts, and study runner
│   └── index.html       # Clean semantic single-page layout
├── server.js            # Express API server & static file host
└── package.json
```

---

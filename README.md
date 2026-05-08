# Niro

Niro is a Chrome Extension (Manifest V3) focused on daily mental wellness.  
It combines onboarding-based personalization, mood tracking, micro wellness activities, and a to-do flow in both popup and new tab experiences.

## Features

- **Onboarding + profession profiles**  
  Users select a profession and answer profile questions from `personalityData.json`.
- **Personalized daily tasks**  
  Profession-specific tasks are loaded from `profiles/*.json`.
- **Mood check-ins**  
  Emoji-based mood tracking with streak logic and point rewards.
- **Micro wellness tools**  
  Hydration tracking, breathing exercise, and journal entries.
- **To-do management**  
  Add/edit/complete/delete tasks, synced via `chrome.storage.local`.
- **Gamified points and leagues**  
  Wellness activity progress contributes to points and league status.
- **New tab experience**  
  Mood-based wallpaper, quote display, and quick task/todo visibility.
- **Notifications**  
  Scheduled wellness notifications and hydration reminders via alarms.

## Project Structure

- `manifest.json` – Extension manifest and entry points.
- `popup.html`, `popup.js`, `popup.css` – Popup onboarding and dashboard shell.
- `dashboard.html`, `dashboard.js`, `dashboard.css` – Wellness dashboard UI and feature modules.
- `newtab.html`, `newtab.js`, `newtab.css` – Custom new tab page.
- `background.js` – Service worker, alarms, notifications, and todo messaging API.
- `utils.js` – Shared quote utility.
- `personalityData.json` – Onboarding questions and profile traits.
- `profiles/*.json` – Profession-specific task/quote datasets.
- `assets/` – Extension icons and visual assets.

## How to Run (Load in Chrome)

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project’s root folder (the folder containing `manifest.json`).
5. Open the extension popup to start onboarding.

## Usage Notes

- Complete onboarding once; data is saved locally in browser storage.
- To-do and mood data are persisted with `chrome.storage.local` / `localStorage`.
- New tab page behavior is available when this extension’s new tab override is active.

## Tech Stack

- Vanilla JavaScript
- HTML/CSS
- Chrome Extensions API (Manifest V3)

## License

No license file is currently present in this repository.

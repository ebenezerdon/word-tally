# Word Tally

Word Tally is a beautiful, production-ready word counter that provides character counts, reading time estimates, keyword density, and readability scores. It is built by [Teda.dev](https://teda.dev), the AI app builder for everyday problems.

## Features
- Word and character counts (including and excluding spaces)
- Reading time estimation
- Keyword density with stop-word filtering and minimum word length
- Readability scoring (Flesch Reading Ease and Flesch-Kincaid grade)
- Responsive, accessible UI with autosave (localStorage)
- Export keywords to CSV

## Tech Stack
- HTML5, Tailwind CSS (CDN), and jQuery 3.7.x
- Modular JavaScript with a single global namespace (window.App)
- Local storage persistence

## Structure
- index.html: marketing landing page with hero and feature highlights
- app.html: the main application interface
- styles/main.css: custom styles complementing Tailwind utilities
- scripts/helpers.js: text utilities, readability, keyword density, storage helpers
- scripts/ui.js: UI bindings, rendering, and event handling
- scripts/main.js: entry point that initializes the app
- scripts/landing.js: small enhancements for the landing page
- assets/logo.svg: app logo

## Usage
1. Open index.html to view the landing page.
2. Click Open the Counter to launch the app.
3. Paste or type your text, tweak settings, and hit Analyze (or press Ctrl+Enter).
4. Export your keyword list as CSV if needed.

## Accessibility
- Keyboard navigable
- Respect for reduced motion preferences
- WCAG-conscious colors and focus rings

## Local Development
No build step required. Open index.html or app.html in a modern browser.

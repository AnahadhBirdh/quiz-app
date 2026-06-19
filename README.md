# JS Quiz App

A timed multiple-choice quiz app built with vanilla HTML, CSS, and JavaScript — no frameworks or libraries.

## Live Demo

[ojtp.vercel.app](https://ojtp.vercel.app)

## Features

- 10 questions across JavaScript topic areas: Fundamentals, DOM, Async JS, OOP, Arrays, and Error Handling
- 15-second countdown timer per question with a visual ring indicator
- Instant feedback after each answer (correct / wrong / time's up)
- Results screen with score, percentage, and a correct / wrong / skipped breakdown
- Answer review screen showing what you picked vs. the correct answer for every question
- Play again to reset and retry

## Tech Stack

| Layer | Details |
|---|---|
| HTML | Semantic structure, three view sections toggled by JS |
| CSS | Custom properties, conic-gradient timer ring, responsive layout |
| JavaScript | Vanilla JS — DOM manipulation, event handling, `setInterval` timer, `reduce` for scoring |

## Project Structure

```
ojtp/
├── index.html   — markup and three views (quiz, results, review)
├── style.css    — all styling
└── script.js    — all logic (data → state → render → events → timer → init)
```

## JavaScript Concepts Used

This project was built strictly following a structured JavaScript course syllabus:

- DOM selection — `getElementById`, `querySelector`, `querySelectorAll`
- DOM manipulation — `createElement`, `appendChild`, `innerHTML`, `textContent`, `setAttribute`, `getAttribute`
- Styling via JS — `style` property, `classList` (`add`, `remove`, `toggle`, `contains`)
- Events — `addEventListener`, event delegation, `stopPropagation` awareness
- Timer APIs — `setInterval`, `clearInterval`
- Array methods — `forEach`, `map`, `filter`, `reduce`
- Closures — option click handlers close over `optionText`
- Destructuring — results summary unpacked from `getResultsSummary()`

## Running Locally

No build step needed. Just open `index.html` in a browser, or use VS Code Live Server.

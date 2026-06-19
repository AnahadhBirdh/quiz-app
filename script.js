// script.js
//
// One file, organized into clear sections (top to bottom):
//
//   1. DATA              - the array of quiz questions
//   2. STATE              - the quizState object + functions that change it
//   3. RENDER (quiz view) - functions that draw the question screen
//   4. LOCKING A QUESTION - shared scoring/feedback logic
//   5. EVENTS (quiz)      - click handlers for options + Next
//   6. RESULTS & REVIEW   - the other two screens, + view switching
//   7. TIMER              - setInterval-based per-question countdown
//   8. INIT               - kicks the whole app off
//
// We'll build these one section at a time, tracing the GEC/Memory
// for each as we go.


// ===================== 1. DATA =====================
// Each question stores `correctAnswer` as the actual option TEXT,
// not its index — see chat for why.

const questions = [
  {
    question: "Which keyword declares a block-scoped variable?",
    category: "Fundamentals",
    options: ["var", "let", "function", "this"],
    correctAnswer: "let"
  },
  {
    question: "What does the typeof operator return for an array?",
    category: "Fundamentals",
    options: ["\"array\"", "\"object\"", "\"list\"", "\"undefined\""],
    correctAnswer: "\"object\""
  },
  {
    question: "Which method selects the FIRST element matching a CSS selector?",
    category: "DOM",
    options: ["getElementById", "querySelector", "getElementsByClassName", "querySelectorAll"],
    correctAnswer: "querySelector"
  },
  {
    question: "What is it called when an event travels from a child element up to its ancestors?",
    category: "DOM",
    options: ["Bubbling", "Capturing", "Delegation", "Hoisting"],
    correctAnswer: "Bubbling"
  },
  {
    question: "Which part of the JS runtime holds a setTimeout callback while its timer is running?",
    category: "Async JS",
    options: ["Call Stack", "Web APIs", "Callback Queue", "Heap Memory"],
    correctAnswer: "Web APIs"
  },
  {
    question: "What does 'await' do inside an async function?",
    category: "Async JS",
    options: [
      "Stops all code everywhere",
      "Pauses that function until the Promise settles",
      "Converts the function to run synchronously",
      "Cancels the Promise"
    ],
    correctAnswer: "Pauses that function until the Promise settles"
  },
  {
    question: "What does obj.__proto__ point to?",
    category: "OOP",
    options: [
      "obj's own properties only",
      "The constructor function",
      "The prototype object obj was created from",
      "A deep copy of obj"
    ],
    correctAnswer: "The prototype object obj was created from"
  },
  {
    question: "Which method calls a function with a given 'this' value, passing arguments individually (not as an array)?",
    category: "OOP",
    options: ["bind", "call", "apply", "new"],
    correctAnswer: "call"
  },
  {
    question: "Which array method returns a brand-new array without mutating the original?",
    category: "Arrays",
    options: ["push", "splice", "map", "sort"],
    correctAnswer: "map"
  },
  {
    question: "Which block always runs, whether or not an error was thrown?",
    category: "Error Handling",
    options: ["try", "catch", "finally", "throw"],
    correctAnswer: "finally"
  }
];


// ===================== 2. STATE =====================
// quizState is the single source of truth for "where are we right now".
// userAnswers[i] is either the option text the user picked for
// questions[i], or null if they never answered (timer ran out).

const TIME_PER_QUESTION = 15; // seconds

const quizState = {
  currentIndex: 0,
  score: 0,
  userAnswers: questions.map(function() { return null; }),
  isAnswered: false,
  timeLeft: TIME_PER_QUESTION,
  timerId: null
};

// Records what the user clicked for the CURRENT question and
// updates the score if it was correct.
function recordAnswer(selectedOption) {
  const currentQuestion = questions[quizState.currentIndex];

  quizState.userAnswers[quizState.currentIndex] = selectedOption;
  quizState.isAnswered = true;

  if (selectedOption === currentQuestion.correctAnswer) {
    quizState.score++;
  }
}

// Moves state on to the next question and resets the per-question bits.
function goToNextQuestion() {
  quizState.currentIndex++;
  quizState.isAnswered = false;
  quizState.timeLeft = TIME_PER_QUESTION;
}

function isLastQuestion() {
  return quizState.currentIndex === questions.length - 1;
}

// Builds { correct, wrong, skipped } by walking userAnswers once.
// This is the reduce() you used for totals in the Expense Tracker idea —
// same pattern, different shape of accumulator.
function getResultsSummary() {
  return quizState.userAnswers.reduce((summary, answer, index) => {
    if (answer === null) {
      summary.skipped++;
    } else if (answer === questions[index].correctAnswer) {
      summary.correct++;
    } else {
      summary.wrong++;
    }
    return summary;
  }, { correct: 0, wrong: 0, skipped: 0 });
}

// Puts everything back to question 1, score 0, for "Play Again".
function resetQuiz() {
  quizState.currentIndex = 0;
  quizState.score = 0;
  quizState.userAnswers = questions.map(function() { return null; });
  quizState.isAnswered = false;
  quizState.timeLeft = TIME_PER_QUESTION;
}


// ===================== 3. RENDER =====================
// These functions READ quizState + questions and WRITE to the DOM.
// They never change quizState themselves — that's the job of the
// functions in Section 2. Keeping "what changed the data" and
// "what displays the data" separate makes the whole app easier to trace.

// Grab every element we'll touch, ONCE, while the script runs.
// Because <script src="script.js"> sits at the end of <body>, every
// one of these already exists in the DOM — none of these are null.
const questionCountEl = document.getElementById('question-count');
const scoreBadgeEl = document.getElementById('score-badge');
const timerTextEl = document.getElementById('timer-text');
const timerRingEl = document.getElementById('timer-ring');
const progressFillEl = document.getElementById('progress-fill');
const categoryPillEl = document.getElementById('category-pill');
const questionTextEl = document.getElementById('question-text');
const optionsListEl = document.getElementById('options-list');
const feedbackBannerEl = document.getElementById('feedback-banner');
const nextBtnEl = document.getElementById('next-btn');

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function renderQuestion() {
  const current = questions[quizState.currentIndex];

  questionCountEl.textContent =
    `Question ${quizState.currentIndex + 1} of ${questions.length}`;
  categoryPillEl.textContent = current.category;
  questionTextEl.textContent = current.question;

  renderOptions(current);

  // Clean slate for the new question
  feedbackBannerEl.textContent = '';
  feedbackBannerEl.className = 'feedback-banner hidden';
  optionsListEl.classList.remove('locked');
  nextBtnEl.disabled = true;
}

function renderOptions(current) {
  optionsListEl.innerHTML = '';

  current.options.forEach((optionText, index) => {
    const li = document.createElement('li');
    li.className = 'option';
    li.setAttribute('data-option', optionText);

    const letterSpan = document.createElement('span');
    letterSpan.className = 'option-letter';
    letterSpan.textContent = OPTION_LETTERS[index];

    const textSpan = document.createElement('span');
    textSpan.className = 'option-text';
    textSpan.textContent = optionText;

    li.appendChild(letterSpan);
    li.appendChild(textSpan);

    li.addEventListener('click', function() {
      if (!quizState.isAnswered) {
        lockQuestion(optionText);
      }
    });

    optionsListEl.appendChild(li);
  });
}

function renderScore() {
  scoreBadgeEl.textContent = `Score: ${quizState.score}`;
}

function renderProgress() {
  const percent = (quizState.currentIndex / questions.length) * 100;
  progressFillEl.style.width = `${percent}%`;
}

// Draws the countdown ring. conic-gradient(color A_deg, trackColor A_deg)
// paints "color" for the first A degrees of the circle and "trackColor"
// for the rest — so as timeLeft shrinks, the colored arc shrinks too.
function renderTimer() {
  timerTextEl.textContent = `${quizState.timeLeft}s`;
  const degrees = (quizState.timeLeft / TIME_PER_QUESTION) * 360;
  timerRingEl.style.background =
    `conic-gradient(var(--accent) ${degrees}deg, var(--accent-bg) ${degrees}deg)`;
}

function renderQuiz() {
  renderQuestion();
  renderScore();
  renderProgress();
  startTimer();
}


// ===================== 4. LOCKING A QUESTION =====================
// One function, used from TWO places: when the user clicks an option,
// and (soon) when the timer hits 0. Either way the question becomes
// "locked" — scored, color-coded, feedback shown, Next enabled.

function lockQuestion(selectedOption) {
  // selectedOption is the clicked option's text, or null if time ran out

  if (quizState.timerId !== null) {
    clearInterval(quizState.timerId);
    quizState.timerId = null;
  }

  recordAnswer(selectedOption);
  renderScore();

  const current = questions[quizState.currentIndex];
  const optionEls = optionsListEl.querySelectorAll('.option');

  optionEls.forEach((optionEl) => {
    const optionText = optionEl.getAttribute('data-option');

    if (optionText === current.correctAnswer) {
      optionEl.classList.add('correct');
    } else if (optionText === selectedOption) {
      optionEl.classList.add('incorrect');
    }
  });

  optionsListEl.classList.add('locked');

  if (selectedOption === current.correctAnswer) {
    feedbackBannerEl.textContent = 'Correct!';
    feedbackBannerEl.className = 'feedback-banner correct';
  } else if (selectedOption === null) {
    feedbackBannerEl.textContent =
      `Time's up! The correct answer was: ${current.correctAnswer}`;
    feedbackBannerEl.className = 'feedback-banner incorrect';
  } else {
    feedbackBannerEl.textContent =
      `Wrong! The correct answer was: ${current.correctAnswer}`;
    feedbackBannerEl.className = 'feedback-banner incorrect';
  }

  nextBtnEl.disabled = false;
}


// ===================== 5. EVENTS =====================

// Each <li> gets its own listener inside renderOptions().
// The click handler closes over `optionText` so no attribute
// lookup is needed at click time.

nextBtnEl.addEventListener('click', function () {
  if (isLastQuestion()) {
    finishQuiz();
    return;
  }
  goToNextQuestion();
  renderQuiz();
});

// ===================== 6. RESULTS & REVIEW =====================
// Two more "screens" — same idea as the quiz view: grab elements once,
// write functions that read state and fill them in.

const resultsHeadingEl = document.getElementById('results-heading');
const resultsSubtextEl = document.getElementById('results-subtext');
const scoreRingEl = document.getElementById('score-ring');
const scoreFractionEl = document.getElementById('score-fraction');
const scorePercentEl = document.getElementById('score-percent');
const statCorrectEl = document.getElementById('stat-correct');
const statWrongEl = document.getElementById('stat-wrong');
const statSkippedEl = document.getElementById('stat-skipped');
const playAgainBtnEl = document.getElementById('play-again-btn');
const reviewBtnEl = document.getElementById('review-btn');
const backBtnEl = document.getElementById('back-btn');
const reviewListEl = document.getElementById('review-list');

const VIEW_IDS = ['quiz-view', 'results-view', 'review-view'];

function showView(viewIdToShow) {
  VIEW_IDS.forEach((viewId) => {
    if (viewId === viewIdToShow) {
      document.getElementById(viewId).classList.remove('hidden');
    } else {
      document.getElementById(viewId).classList.add('hidden');
    }
  });
}

function renderResults() {
  const { correct, wrong, skipped } = getResultsSummary();
  const total = questions.length;
  const percent = Math.round((correct / total) * 100);

  scoreFractionEl.textContent = `${correct} / ${total}`;
  scorePercentEl.textContent = `${percent}%`;
  statCorrectEl.textContent = correct;
  statWrongEl.textContent = wrong;
  statSkippedEl.textContent = skipped;

  const degrees = (percent / 100) * 360;
  scoreRingEl.style.background =
    `conic-gradient(var(--accent) ${degrees}deg, var(--accent-bg) ${degrees}deg)`;

  if (percent >= 70) {
    resultsHeadingEl.textContent = 'Great Job!';
    resultsSubtextEl.textContent = "You're getting the hang of this.";
  } else if (percent >= 40) {
    resultsHeadingEl.textContent = 'Good Effort!';
    resultsSubtextEl.textContent = 'A bit more practice and you will have it.';
  } else {
    resultsHeadingEl.textContent = 'Keep Learning!';
    resultsSubtextEl.textContent = 'Review the topics and try again.';
  }
}

// Builds one card per question: what you answered vs. the correct one.
// Same "loop questions, look up quizState.userAnswers[index]" pattern
// as getResultsSummary — just building DOM instead of counting.
function renderReview() {
  reviewListEl.innerHTML = '';

  questions.forEach((question, index) => {
    const userAnswer = quizState.userAnswers[index];
    const isSkipped = userAnswer === null;
    const isCorrect = userAnswer === question.correctAnswer;

    const item = document.createElement('div');
    item.className = isSkipped
      ? 'review-item skipped'
      : (isCorrect ? 'review-item correct' : 'review-item incorrect');

    const meta = document.createElement('p');
    meta.className = 'review-meta';
    meta.textContent = `Question ${index + 1} · ${question.category}`;

    const questionLine = document.createElement('p');
    questionLine.className = 'review-question';
    questionLine.textContent = question.question;

    item.appendChild(meta);
    item.appendChild(questionLine);

    const yourAnswerRow = document.createElement('div');
    yourAnswerRow.className = 'review-answer-row';

    const yourTag = document.createElement('span');
    if (isSkipped) {
      yourTag.className = 'review-tag tag-skipped';
      yourTag.textContent = 'Skipped';
      yourAnswerRow.appendChild(yourTag);
    } else {
      yourTag.className = isCorrect ? 'review-tag tag-correct' : 'review-tag tag-incorrect';
      yourTag.textContent = isCorrect ? 'Your answer ✓' : 'Your answer ✗';

      const yourAnswerText = document.createElement('span');
      yourAnswerText.textContent = userAnswer;

      yourAnswerRow.appendChild(yourTag);
      yourAnswerRow.appendChild(yourAnswerText);
    }
    item.appendChild(yourAnswerRow);

    // Only show "correct answer" when the user got it wrong or skipped it
    if (!isCorrect) {
      const correctRow = document.createElement('div');
      correctRow.className = 'review-answer-row';

      const correctTag = document.createElement('span');
      correctTag.className = 'review-tag tag-answer';
      correctTag.textContent = 'Correct answer';

      const correctText = document.createElement('span');
      correctText.textContent = question.correctAnswer;

      correctRow.appendChild(correctTag);
      correctRow.appendChild(correctText);
      item.appendChild(correctRow);
    }

    reviewListEl.appendChild(item);
  });
}

function finishQuiz() {
  renderResults();
  showView('results-view');
}

playAgainBtnEl.addEventListener('click', function () {
  resetQuiz();
  renderQuiz();
  showView('quiz-view');
});

reviewBtnEl.addEventListener('click', function () {
  renderReview();
  showView('review-view');
});

backBtnEl.addEventListener('click', function () {
  showView('results-view');
});


// ===================== 7. TIMER =====================
// setInterval fires the callback every 1000 ms (1 second).
// When timeLeft hits 0 we clear the interval and lock the question
// with null — meaning the user ran out of time, no answer recorded.

function startTimer() {
  renderTimer();
  quizState.timerId = setInterval(function() {
    quizState.timeLeft--;
    renderTimer();
    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timerId);
      quizState.timerId = null;
      lockQuestion(null);
    }
  }, 1000);
}


// ===================== 8. INIT =====================

function init() {
  showView('quiz-view');
  renderQuiz();
}

init();

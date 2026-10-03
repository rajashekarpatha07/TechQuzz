export const HOT_TAKES = [
  {
    text: "Dark mode is the only mode",
    roastAgree: "Light mode users fear you. 🌑",
    roastDisagree: "Enjoy your daily flashbang at 2 AM. ☀️😵",
  },
  {
    text: "I push directly to main",
    roastAgree: "Bold. Reckless. Your team is praying. 🙏",
    roastDisagree: "You open a PR for a typo fix. 🧐",
  },
  {
    text: "Meetings could have been emails",
    roastAgree: "Said during a 3-hour sync. 📅",
    roastDisagree: "You love hearing your own voice on mute. 🎤",
  },
  {
    text: "I use console.log instead of a debugger",
    roastAgree: "Classic. 47 logs saying 'here'. 🪵",
    roastDisagree: "Liar. Your code has 'asdf' logged somewhere. 🤥",
  },
  {
    text: "I start projects but never finish them",
    roastAgree: "Your GitHub is a museum of ideas. 🏛️",
    roastDisagree: "Finished projects? Show the repo. 👀",
  },
  {
    text: "AI will replace programmers",
    roastAgree: "Nervous typing intensifies. 🤖😰",
    roastDisagree: "Denial is a great coping tool. 🛋️",
  },
  {
    text: "I read the documentation first",
    roastAgree: "Nobody believes you. 📚",
    roastDisagree: "You skim until you find a code block. 😎",
  },
  {
    text: "Friday deployments are fine",
    roastAgree: "See you at 3 AM on Saturday. 🚨",
    roastDisagree: "Wise. Your weekends are sacred. 🛡️",
  },
  {
    text: "I have too many browser tabs open",
    roastAgree: "Your RAM is crying. 🧠🔥",
    roastDisagree: "Suspicious. Where are your 40 Stack Overflow tabs? 🤔",
  },
  {
    text: "I rename things instead of fixing them",
    roastAgree: "Problem solved. Technically. 🪄",
    roastDisagree: "You actually refactor. Show-off. 🧹",
  },
] as const;

export const QUIZ = [
  {
    question: "What does 'git rebase' do?",
    options: [
      "Replays commits on top of another base",
      "Deletes a branch",
      "Creates a new repository",
      "Reverts the last commit",
    ],
    correct: 0,
    extra: "🌿🔁",
  },
  {
    question: "What does typeof null return in JavaScript?",
    options: ["null", "undefined", "object", "number"],
    correct: 2,
    extra: "🤨🕳️",
  },
  {
    question: "Which HTTP status code means 'Created'?",
    options: ["200", "201", "204", "301"],
    correct: 1,
    extra: "✅🌐",
  },
  {
    question: "What does the 'D' in SOLID stand for?",
    options: [
      "Dependency Inversion",
      "Data Abstraction",
      "Dynamic Dispatch",
      "Decoupled Design",
    ],
    correct: 0,
    extra: "🧱🔌",
  },
  {
    question: "What is the time complexity of accessing an array element by index?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
    correct: 2,
    extra: "⚡📍",
  },
  {
    question: "What does CSS 'z-index' control?",
    options: ["Zoom level", "Stacking order", "Animation speed", "Font size"],
    correct: 1,
    extra: "🎨🥞",
  },
  {
    question: "In SQL, which JOIN returns only rows that match in both tables?",
    options: ["LEFT JOIN", "FULL JOIN", "CROSS JOIN", "INNER JOIN"],
    correct: 3,
    extra: "🗄️🤝",
  },
  {
    question: "What does 'const' guarantee in JavaScript?",
    options: [
      "The value is deeply immutable",
      "The binding can't be reassigned",
      "Faster execution",
      "Global scope",
    ],
    correct: 1,
    extra: "🔒🧠",
  },
  {
    question: "What is Kubernetes mainly used for?",
    options: [
      "Orchestrating containers",
      "Styling components",
      "Version control",
      "Compiling code",
    ],
    correct: 0,
    extra: "☸️📦",
  },
  {
    question: "Which data structure works on the FIFO principle?",
    options: ["Stack", "Queue", "Tree", "Set"],
    correct: 1,
    extra: "🚶‍♂️🚶‍♀️",
  },
] as const;

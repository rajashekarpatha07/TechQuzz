export const HOT_TAKES = [
  {
    text: "Tabs are better than spaces",
    roastAgree: "Tab people are lazy typers. 😴",
    roastDisagree: "Space people love pressing the key 4 times. 😂",
  },
  {
    text: "Comments in code are useless",
    roastAgree: "Future you will be very confused. 🤡",
    roastDisagree: "You comment every single line. Relax. 😅",
  },
  {
    text: "I copy code from Stack Overflow",
    roastAgree: "Honest. But you don't understand it. 📋",
    roastDisagree: "Liar. We all do it. 🤥",
  },
  {
    text: "I test my code before pushing",
    roastAgree: "Sure you do. Sure. 🙄",
    roastDisagree: "At least you admit it. 🐛",
  },
  {
    text: "It works on my machine",
    roastAgree: "Then give your machine to the client. 💻",
    roastDisagree: "You trust nothing. Smart. 🐳",
  },
  {
    text: "I name my variables a, b, c",
    roastAgree: "Your teammates hate you. 😤",
    roastDisagree: "You named one 'finalFinalVersion2'. 😏",
  },
  {
    text: "I Google basic things every day",
    roastAgree: "Same. Nobody remembers syntax. 🔍",
    roastDisagree: "You are lying to yourself. 🤨",
  },
  {
    text: "I never delete old code, I just comment it out",
    roastAgree: "Your file is a code graveyard. 🪦",
    roastDisagree: "Clean, but scared of Git history. 😬",
  },
  {
    text: "I fix bugs by restarting",
    roastAgree: "IT department is proud of you. 🔄",
    roastDisagree: "You actually read error messages. Weird. 🤓",
  },
  {
    text: "I code better at night",
    roastAgree: "Sleep is not in your budget. 🦉",
    roastDisagree: "Morning person. We don't trust you. ☀️",
  },
] as const;

export const QUIZ = [
  {
    question: "What does the 'git stash' command do?",
    options: [
      "Deletes untracked files",
      "Temporarily saves uncommitted changes",
      "Merges two branches",
      "Pushes code to remote",
    ],
    correct: 1,
    extra: "📦🌿",
  },
  {
    question: "What is the result of 0.1 + 0.2 === 0.3 in JavaScript?",
    options: ["true", "false", "NaN", "Error"],
    correct: 1,
    extra: "🤯🔢",
  },
  {
    question: "Which HTTP method is typically used to update an existing resource?",
    options: ["GET", "PUT", "TRACE", "HEAD"],
    correct: 1,
    extra: "🔄🌐",
  },
  {
    question: "What does the 'S' in SOLID principles stand for?",
    options: ["Single Responsibility", "Simple Structure", "Secure Syntax", "Scalable System"],
    correct: 0,
    extra: "🧱📐",
  },
  {
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
    correct: 2,
    extra: "🔍⚡",
  },
  {
    question: "What does a 404 status code mean?",
    options: ["Server error", "Unauthorized", "Redirect", "Not found"],
    correct: 3,
    extra: "🚫🔎",
  },
  {
    question: "In SQL, which clause filters rows after GROUP BY?",
    options: ["HAVING", "WHERE", "ORDER BY", "LIMIT"],
    correct: 0,
    extra: "🗄️🧮",
  },
  {
    question: "What does 'let' do differently than 'var' in JavaScript?",
    options: ["Makes variables constant", "Is block-scoped", "Runs faster", "Allows no values"],
    correct: 1,
    extra: "📦🧠",
  },
  {
    question: "What is Docker mainly used for?",
    options: ["Writing CSS", "Managing databases", "Running apps in containers", "Testing UI"],
    correct: 2,
    extra: "🐳📦",
  },
  {
    question: "Which data structure works on the LIFO principle?",
    options: ["Queue", "Array", "Linked list", "Stack"],
    correct: 3,
    extra: "📚⬆️",
  },
] as const;

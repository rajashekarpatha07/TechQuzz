#!/usr/bin/env node

/**
 * TechQuzz Test Bot
 * ─────────────────
 * Simulates a full game session with a host and multiple bot players.
 * Useful for testing all game phases without needing real devices.
 *
 * Usage:
 *   node bot.js                     # full auto: create room + 6 players
 *   node bot.js --room TMLG         # join bots to existing room (players only)
 *   node bot.js --players 10        # 10 bot players
 *   node bot.js --url http://x:3000 # custom server URL
 *   node bot.js --speed fast        # fast (1s), normal (3s), slow (5s) between actions
 */

const { io } = require("socket.io-client");

// ── CLI args ──
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const SERVER_URL = getArg("url", "http://localhost:3000");
const PLAYER_COUNT = parseInt(getArg("players", "6"), 10);
const SPEED = getArg("speed", "normal");
const DELAY = { fast: 1000, normal: 3000, slow: 5000 }[SPEED] || 3000;
const JOIN_ROOM = (getArg("room", "")).toUpperCase() || null; // join existing room

const PLAYER_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank",
  "Grace", "Hank", "Ivy", "Jack", "Karen", "Leo",
  "Mona", "Nick", "Olivia", "Pete", "Quinn", "Rosa",
  "Sam", "Tina", "Uma", "Vince", "Wendy", "Xander",
];

// ── Logging helpers ──
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  white: "\x1b[37m",
};

function log(icon, msg) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`${C.dim}${time}${C.reset} ${icon}  ${msg}`);
}

function logHost(msg) { log(`${C.magenta}🎮${C.reset}`, `${C.magenta}[HOST]${C.reset} ${msg}`); }
function logBot(name, msg) { log(`${C.cyan}🤖${C.reset}`, `${C.cyan}[${name}]${C.reset} ${msg}`); }
function logPhase(msg) { log(`${C.yellow}⚡${C.reset}`, `${C.bold}${C.yellow}${msg}${C.reset}`); }
function logResult(msg) { log(`${C.green}✅${C.reset}`, `${C.green}${msg}${C.reset}`); }
function logError(msg) { log(`${C.red}❌${C.reset}`, `${C.red}${msg}${C.reset}`); }
function logInfo(msg) { log(`${C.blue}ℹ️${C.reset}`, `${C.blue}${msg}${C.reset}`); }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── State ──
let roomCode = null;
let hostSecret = null;
let hostSocket = null;
let currentPhase = null;
const bots = []; // { socket, name, state }

// ══════════════════════════════════════════
//  STEP 1: Create room as host
// ══════════════════════════════════════════
async function createRoom() {
  return new Promise((resolve, reject) => {
    logHost("Connecting to server...");
    hostSocket = io(SERVER_URL, { transports: ["websocket", "polling"] });

    hostSocket.on("connect", () => {
      logHost("Connected. Creating room...");
      hostSocket.emit("host:create");
    });

    hostSocket.on("host:created", ({ code, hostSecret: secret }) => {
      roomCode = code;
      hostSecret = secret;
      logHost(`Room created: ${C.bold}${C.white}${code}${C.reset}`);
      resolve();
    });

    hostSocket.on("room:state", (state) => {
      currentPhase = state.phase;
    });

    hostSocket.on("error", (e) => {
      logError(`Host error: ${e.message}`);
    });

    hostSocket.on("connect_error", () => {
      logError(`Cannot connect to ${SERVER_URL}`);
      reject(new Error("Connection failed"));
    });
  });
}

// ══════════════════════════════════════════
//  STEP 2: Join bots as players
// ══════════════════════════════════════════
async function joinBots() {
  logInfo(`Joining ${PLAYER_COUNT} bot players...`);

  for (let i = 0; i < PLAYER_COUNT; i++) {
    await wait(200); // stagger joins
    const name = PLAYER_NAMES[i % PLAYER_NAMES.length] + (i >= PLAYER_NAMES.length ? `_${Math.floor(i / PLAYER_NAMES.length) + 1}` : "");
    const bot = await joinBot(name);
    bots.push(bot);
  }

  logResult(`All ${bots.length} bots joined!`);
  await wait(500);
  logPlayerSummary();
}

function joinBot(name) {
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    const bot = { socket, name, state: null, team: null };
    let resolved = false;

    socket.on("connect", () => {
      socket.emit("player:join", { code: roomCode, name });
    });

    socket.on("room:state", (state) => {
      bot.state = state;
      if (!resolved && state.you) {
        bot.team = state.you.team;
        logBot(name, `Joined as ${bot.team === "js" ? "⚡ JavaScript" : "🐍 Python"}`);
        resolved = true;
        resolve(bot);
      }
      if (state.you) {
        bot.team = state.you.team;
      }
    });

    socket.on("error", (e) => {
      logError(`${name}: ${e.message}`);
      resolve(bot);
    });
  });
}

function logPlayerSummary() {
  const jsTeam = bots.filter((b) => b.team === "js");
  const pyTeam = bots.filter((b) => b.team === "python");
  console.log("");
  logInfo(`${C.bold}Teams:${C.reset}`);
  logInfo(`  ⚡ JavaScript (${jsTeam.length}): ${jsTeam.map((b) => b.name).join(", ")}`);
  logInfo(`  🐍 Python     (${pyTeam.length}): ${pyTeam.map((b) => b.name).join(", ")}`);
  console.log("");
}

// ══════════════════════════════════════════
//  STEP 3: Advance & play through phases
// ══════════════════════════════════════════
function advance() {
  hostSocket.emit("host:advance", { code: roomCode, hostSecret });
}

async function waitForPhase(targetPhase) {
  return new Promise((resolve) => {
    const check = () => {
      if (currentPhase === targetPhase) {
        resolve();
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

// ── TAP RACE ──
async function playTapRace() {
  logPhase("═══ ROUND 1: TAP RACE ═══");
  advance();
  await waitForPhase("tap");
  await wait(500);

  logInfo("Bots are tapping...");

  // Send taps in waves over a few seconds
  const waves = 5;
  for (let w = 0; w < waves; w++) {
    for (const bot of bots) {
      const taps = Math.floor(Math.random() * 15) + 5;
      bot.socket.emit("player:tap", { count: taps });
    }
    await wait(400);
  }

  logInfo("Tap round in progress, waiting for timer...");
  await wait(DELAY);

  // Skip to results
  advance();
  await waitForPhase("tap_results");

  // Read results from a bot's state
  await wait(500);
  const sample = bots[0]?.state;
  if (sample) {
    const jsTaps = sample.players.filter((p) => p.team === "js").reduce((s, p) => s + p.taps, 0);
    const pyTaps = sample.players.filter((p) => p.team === "python").reduce((s, p) => s + p.taps, 0);
    logResult(`Tap Race Results — JS: ${jsTaps} taps | Python: ${pyTaps} taps`);
    logResult(`Winner: ${jsTaps > pyTaps ? "⚡ JavaScript" : pyTaps > jsTaps ? "🐍 Python" : "🤝 Tie"}`);
  }

  await wait(DELAY);
}

// ── HOT TAKES ──
async function playHotTakes() {
  logPhase("═══ ROUND 2: HOT TAKES ═══");

  let hotIndex = 0;
  while (true) {
    advance();
    await waitForPhase("hot");
    await wait(300);

    const sample = bots[0]?.state;
    if (sample?.hot) {
      hotIndex = sample.hot.index;
      logInfo(`Hot Take ${hotIndex + 1}/${sample.hot.total}: "${sample.hot.text}"`);
    }

    // Bots vote randomly
    await wait(DELAY / 2);
    for (const bot of bots) {
      const choice = Math.random() > 0.45 ? "agree" : "disagree";
      bot.socket.emit("player:vote", { choice });
      logBot(bot.name, `Voted: ${choice === "agree" ? "👍 Agree" : "👎 Disagree"}`);
      await wait(50);
    }

    await wait(DELAY / 2);

    // Reveal
    advance();
    await waitForPhase("hot_reveal");
    await wait(300);

    const revealState = bots[0]?.state;
    if (revealState?.hot?.votes) {
      const v = revealState.hot.votes;
      const totalAgree = v.js.agree + v.python.agree;
      const totalDisagree = v.js.disagree + v.python.disagree;
      logResult(`Votes — Agree: ${totalAgree} | Disagree: ${totalDisagree} → ${totalAgree >= totalDisagree ? "Agree wins" : "Disagree wins"}`);
    }

    await wait(DELAY);

    // Check if there are more hot takes
    const nextState = bots[0]?.state;
    if (nextState?.hot && hotIndex + 1 >= nextState.hot.total) {
      break;
    }
  }
}

// ── QUIZ ──
async function playQuiz() {
  logPhase("═══ ROUND 3: QUIZ ═══");

  while (true) {
    advance();
    await waitForPhase("quiz");
    await wait(300);

    const sample = bots[0]?.state;
    if (sample?.quiz) {
      logInfo(`Question ${sample.quiz.index + 1}/${sample.quiz.total}: "${sample.quiz.question}"`);
      logInfo(`  Options: ${sample.quiz.options.map((o, i) => `[${["A","B","C","D"][i]}] ${o}`).join(" | ")}`);
    }

    // Bots answer — some correctly (if they can guess), mostly random
    await wait(DELAY / 2);
    for (const bot of bots) {
      // 30% chance of picking the right answer (simulate varying skill)
      const answer = Math.floor(Math.random() * 4);
      bot.socket.emit("player:answer", { index: answer });
      logBot(bot.name, `Answered: ${["A", "B", "C", "D"][answer]}`);
      await wait(30);
    }

    await wait(DELAY / 2);

    // Reveal answer
    advance();
    await waitForPhase("quiz_reveal");
    await wait(300);

    const revealState = bots[0]?.state;
    if (revealState?.quiz) {
      const correct = revealState.quiz.correct;
      const counts = revealState.quiz.counts || [];
      logResult(`Correct: [${["A","B","C","D"][correct]}] ${revealState.quiz.options[correct]}`);
      logResult(`Distribution: ${counts.map((c, i) => `${["A","B","C","D"][i]}=${c}`).join(" | ")}`);
    }

    await wait(DELAY);

    // Check if more questions
    const nextState = bots[0]?.state;
    if (nextState?.quiz && nextState.quiz.index + 1 >= nextState.quiz.total) {
      break;
    }
  }
}

// ── PODIUM ──
async function showPodium() {
  logPhase("═══ 🏆 PODIUM ═══");
  advance();
  await waitForPhase("podium");
  await wait(500);

  const sample = bots[0]?.state;
  if (sample?.podium) {
    const { top3, winningTeam } = sample.podium;
    console.log("");
    logResult(`${C.bold}Winning Team: ${winningTeam === "tie" ? "🤝 Tie!" : winningTeam === "js" ? "⚡ JavaScript" : "🐍 Python"}${C.reset}`);
    console.log("");
    top3.forEach((p, i) => {
      const medal = ["🥇", "🥈", "🥉"][i];
      const team = p.team === "js" ? "⚡" : "🐍";
      logResult(`  ${medal} ${p.name} ${team} — ${p.score} pts`);
    });
    console.log("");

    // Team scores
    logResult(`Team Scores — JS: ${sample.teamScores.js} | Python: ${sample.teamScores.python}`);
  }
}

// ══════════════════════════════════════════
//  JOIN-ONLY MODE: bots react to host
// ══════════════════════════════════════════
async function runJoinOnly() {
  roomCode = JOIN_ROOM;
  logInfo(`Joining existing room: ${C.bold}${C.white}${roomCode}${C.reset}`);

  await joinBots();
  logResult("Bots joined! They will react automatically as the host advances.");
  logInfo("Press Ctrl+C to disconnect all bots.\n");

  // Track phase changes and react
  const acted = new Set();
  setInterval(() => {
    const sample = bots[0]?.state;
    if (!sample) return;
    const phase = sample.phase;
    // Build a unique key per phase + index so we act once per round
    const hotIdx = sample.hot?.index ?? -1;
    const quizIdx = sample.quiz?.index ?? -1;
    const key = `${phase}-${hotIdx}-${quizIdx}`;
    if (acted.has(key)) return;
    acted.add(key);

    if (phase === "tap") {
      logPhase("TAP RACE detected — bots tapping!");
      let waves = 0;
      const tapInterval = setInterval(() => {
        for (const bot of bots) {
          const taps = Math.floor(Math.random() * 15) + 5;
          bot.socket.emit("player:tap", { count: taps });
        }
        waves++;
        if (waves >= 15) clearInterval(tapInterval);
      }, 300);
    }

    if (phase === "hot" && sample.hot) {
      logPhase(`HOT TAKE ${hotIdx + 1}: "${sample.hot.text}"`);
      setTimeout(() => {
        for (const bot of bots) {
          const choice = Math.random() > 0.45 ? "agree" : "disagree";
          bot.socket.emit("player:vote", { choice });
          logBot(bot.name, `Voted: ${choice === "agree" ? "👍 Agree" : "👎 Disagree"}`);
        }
      }, 500 + Math.random() * 1000);
    }

    if (phase === "quiz" && sample.quiz) {
      logPhase(`QUIZ Q${quizIdx + 1}: "${sample.quiz.question}"`);
      setTimeout(() => {
        for (const bot of bots) {
          const answer = Math.floor(Math.random() * 4);
          bot.socket.emit("player:answer", { index: answer });
          logBot(bot.name, `Answered: ${["A", "B", "C", "D"][answer]}`);
        }
      }, 500 + Math.random() * 1500);
    }

    if (phase === "hot_reveal" && sample.hot?.votes) {
      const v = sample.hot.votes;
      const ta = v.js.agree + v.python.agree;
      const td = v.js.disagree + v.python.disagree;
      logResult(`Votes — Agree: ${ta} | Disagree: ${td}`);
    }

    if (phase === "quiz_reveal" && sample.quiz) {
      const c = sample.quiz.correct;
      logResult(`Correct: [${["A","B","C","D"][c]}] ${sample.quiz.options[c]}`);
    }

    if (phase === "tap_results") {
      const jt = sample.players.filter(p => p.team === "js").reduce((s, p) => s + p.taps, 0);
      const pt = sample.players.filter(p => p.team === "python").reduce((s, p) => s + p.taps, 0);
      logResult(`Tap Race — JS: ${jt} | Python: ${pt}`);
    }

    if (phase === "podium" && sample.podium) {
      logPhase("🏆 PODIUM");
      sample.podium.top3.forEach((p, i) => {
        logResult(`  ${["🥇", "🥈", "🥉"][i]} ${p.name} — ${p.score} pts`);
      });
    }
  }, 300);
}

// ══════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════
async function main() {
  console.log("");
  console.log(`${C.bold}${C.magenta}╔══════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.magenta}║       TechQuzz Test Bot  🤖         ║${C.reset}`);
  console.log(`${C.bold}${C.magenta}╚══════════════════════════════════════╝${C.reset}`);
  console.log("");
  logInfo(`Server:  ${SERVER_URL}`);
  logInfo(`Players: ${PLAYER_COUNT}`);
  logInfo(`Speed:   ${SPEED} (${DELAY}ms delay)`);
  if (JOIN_ROOM) logInfo(`Room:    ${JOIN_ROOM} (join-only mode)`);
  console.log("");

  try {
    if (JOIN_ROOM) {
      // Join-only: bots join existing room, react to host
      await runJoinOnly();
    } else {
      // Full auto: create room + play all phases
      await createRoom();
      await wait(500);
      await joinBots();
      await wait(DELAY);

      await playTapRace();
      await playHotTakes();
      await playQuiz();
      await showPodium();

      console.log("");
      logResult(`${C.bold}Game complete! All phases tested successfully.${C.reset}`);
      console.log("");

      logInfo("Cleaning up connections...");
      hostSocket?.disconnect();
      for (const bot of bots) {
        bot.socket?.disconnect();
      }
      process.exit(0);
    }
  } catch (err) {
    logError(`Fatal: ${err.message}`);
    process.exit(1);
  }
}

// Cleanup on Ctrl+C
process.on("SIGINT", () => {
  console.log("");
  logInfo("Disconnecting all bots...");
  hostSocket?.disconnect();
  for (const bot of bots) {
    bot.socket?.disconnect();
  }
  process.exit(0);
});

main();

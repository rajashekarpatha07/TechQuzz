import { randomBytes } from "crypto";
import type { Server, Socket } from "socket.io";
import { HOT_TAKES, QUIZ } from "./content";
import {
  HOT_COUNT,
  HOT_MS,
  QUIZ_COUNT,
  QUIZ_MS,
  TAP_MS,
  type Phase,
  type PublicPlayer,
  type RoomState,
  type Team,
} from "./types";

type Player = {
  id: string;
  name: string;
  team: Team;
  score: number;
  taps: number;
  connected: boolean;
  socketId: string | null;
  vote: "agree" | "disagree" | null;
  answerIndex: number | null;
};

type Room = {
  code: string;
  hostSecret: string;
  hostSocketId: string | null;
  phase: Phase;
  players: Map<string, Player>;
  nextTeam: Team;
  endsAt: number | null;
  epoch: number;
  timer: NodeJS.Timeout | null;
  hostDisconnectTimer: NodeJS.Timeout | null;
  tapEmitTimer: NodeJS.Timeout | null;
  hotTakes: (typeof HOT_TAKES)[number][];
  quiz: (typeof QUIZ)[number][];
  hotIndex: number;
  quizIndex: number;
};

const rooms = new Map<string, Room>();
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeCode(): string {
  for (let i = 0; i < 20; i++) {
    let code = "";
    for (let j = 0; j < 4; j++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!rooms.has(code)) return code;
  }
  throw new Error("Could not allocate room code");
}

function teamScores(room: Room): { js: number; python: number } {
  const scores = { js: 0, python: 0 };
  for (const p of room.players.values()) scores[p.team] += p.score;
  return scores;
}

function publicPlayers(room: Room): PublicPlayer[] {
  return [...room.players.values()]
    .map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      score: p.score,
      taps: p.taps,
      connected: p.connected,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function serialize(room: Room, socket: Socket): RoomState {
  const isHost = socket.id === room.hostSocketId;
  const player = [...room.players.values()].find((p) => p.socketId === socket.id);
  const state: RoomState = {
    code: room.code,
    phase: room.phase,
    endsAt: room.endsAt,
    players: publicPlayers(room),
    teamScores: teamScores(room),
    isHost,
  };

  if (player) {
    state.you = {
      id: player.id,
      name: player.name,
      team: player.team,
      voted: player.vote !== null,
      answered: player.answerIndex !== null,
      vote: player.vote ?? undefined,
      answerIndex: player.answerIndex ?? undefined,
    };
  }

  if (room.phase === "hot" || room.phase === "hot_reveal") {
    const item = room.hotTakes[room.hotIndex];
    state.hot = {
      index: room.hotIndex,
      total: room.hotTakes.length,
      text: item.text,
    };
    if (room.phase === "hot_reveal") {
      state.hot.roastAgree = item.roastAgree;
      state.hot.roastDisagree = item.roastDisagree;
      const votes = {
        js: { agree: 0, disagree: 0 },
        python: { agree: 0, disagree: 0 },
      };
      for (const p of room.players.values()) {
        if (p.vote) votes[p.team][p.vote] += 1;
      }
      state.hot.votes = votes;
    }
  }

  if (room.phase === "quiz" || room.phase === "quiz_reveal") {
    const item = room.quiz[room.quizIndex];
    state.quiz = {
      index: room.quizIndex,
      total: room.quiz.length,
      question: item.question,
      options: [...item.options],
      extra: item.extra,
    };
    if (room.phase === "quiz_reveal") {
      state.quiz.correct = item.correct;
      const counts = [0, 0, 0, 0];
      for (const p of room.players.values()) {
        if (p.answerIndex !== null) counts[p.answerIndex] += 1;
      }
      state.quiz.counts = counts;
    }
  }

  if (room.phase === "podium") {
    const top3 = publicPlayers(room).slice(0, 3);
    const scores = teamScores(room);
    state.podium = {
      top3,
      winningTeam: scores.js === scores.python ? "tie" : scores.js > scores.python ? "js" : "python",
    };
  }

  return state;
}

function emitRoom(io: Server, room: Room) {
  for (const socket of io.sockets.sockets.values()) {
    const inRoom = socket.rooms.has(room.code);
    if (inRoom) socket.emit("room:state", serialize(room, socket));
  }
}

function clearTimer(room: Room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
  room.endsAt = null;
  room.epoch += 1;
}

function schedule(io: Server, room: Room, ms: number, then: () => void) {
  clearTimer(room);
  const epoch = room.epoch;
  room.endsAt = Date.now() + ms;
  room.timer = setTimeout(() => {
    if (room.epoch !== epoch) return;
    then();
    emitRoom(io, room);
  }, ms);
}

function resetItemVotes(room: Room) {
  for (const p of room.players.values()) {
    p.vote = null;
    p.answerIndex = null;
  }
}

function startTap(io: Server, room: Room) {
  room.phase = "tap";
  for (const p of room.players.values()) p.taps = 0;
  schedule(io, room, TAP_MS, () => {
    room.phase = "tap_results";
    room.endsAt = null;
  });
}

function startHot(io: Server, room: Room, index: number) {
  room.phase = "hot";
  room.hotIndex = index;
  resetItemVotes(room);
  schedule(io, room, HOT_MS, () => {
    room.phase = "hot_reveal";
    room.endsAt = null;
  });
}

function startQuiz(io: Server, room: Room, index: number) {
  room.phase = "quiz";
  room.quizIndex = index;
  resetItemVotes(room);
  schedule(io, room, QUIZ_MS, () => {
    room.phase = "quiz_reveal";
    room.endsAt = null;
  });
}

function goPodium(room: Room) {
  room.phase = "podium";
  clearTimer(room);
}

function advance(io: Server, room: Room) {
  switch (room.phase) {
    case "lobby":
      room.hotTakes = shuffle(HOT_TAKES).slice(0, HOT_COUNT);
      room.quiz = shuffle(QUIZ).slice(0, QUIZ_COUNT);
      startTap(io, room);
      break;
    case "tap":
      room.phase = "tap_results";
      clearTimer(room);
      break;
    case "tap_results":
      startHot(io, room, 0);
      break;
    case "hot":
      room.phase = "hot_reveal";
      clearTimer(room);
      break;
    case "hot_reveal":
      if (room.hotIndex + 1 < room.hotTakes.length) startHot(io, room, room.hotIndex + 1);
      else startQuiz(io, room, 0);
      break;
    case "quiz":
      room.phase = "quiz_reveal";
      clearTimer(room);
      break;
    case "quiz_reveal":
      if (room.quizIndex + 1 < room.quiz.length) startQuiz(io, room, room.quizIndex + 1);
      else goPodium(room);
      break;
    case "podium":
      break;
  }
}

function requireHost(socket: Socket, code: string, hostSecret: string): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.hostSecret !== hostSecret) {
    socket.emit("error", { message: "Host auth failed" });
    return null;
  }
  return room;
}

function destroyRoom(io: Server, room: Room) {
  clearTimer(room);
  if (room.hostDisconnectTimer) clearTimeout(room.hostDisconnectTimer);
  if (room.tapEmitTimer) clearTimeout(room.tapEmitTimer);
  io.to(room.code).emit("error", { message: "Room closed" });
  io.in(room.code).socketsLeave(room.code);
  rooms.delete(room.code);
}

export function attachGame(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("host:create", () => {
      const code = makeCode();
      const room: Room = {
        code,
        hostSecret: randomBytes(16).toString("hex"),
        hostSocketId: socket.id,
        phase: "lobby",
        players: new Map(),
        nextTeam: "js",
        endsAt: null,
        epoch: 0,
        timer: null,
        hostDisconnectTimer: null,
        tapEmitTimer: null,
        hotTakes: [],
        quiz: [],
        hotIndex: 0,
        quizIndex: 0,
      };
      rooms.set(code, room);
      void socket.join(code);
      socket.emit("host:created", { code, hostSecret: room.hostSecret });
      emitRoom(io, room);
    });

    socket.on("host:join", ({ code, hostSecret }: { code: string; hostSecret: string }) => {
      const room = requireHost(socket, code, hostSecret);
      if (!room) return;
      if (room.hostDisconnectTimer) {
        clearTimeout(room.hostDisconnectTimer);
        room.hostDisconnectTimer = null;
      }
      room.hostSocketId = socket.id;
      void socket.join(room.code);
      emitRoom(io, room);
    });

    socket.on("host:advance", ({ code, hostSecret }: { code: string; hostSecret: string }) => {
      const room = requireHost(socket, code, hostSecret);
      if (!room) return;
      advance(io, room);
      emitRoom(io, room);
    });

    socket.on("player:join", ({ code, name }: { code: string; name: string }) => {
      const room = rooms.get((code || "").toUpperCase());
      const nick = (name || "").trim().slice(0, 16);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      if (room.phase === "podium") {
        socket.emit("error", { message: "This game already ended" });
        return;
      }
      if (nick.length < 1) {
        socket.emit("error", { message: "Enter a nickname" });
        return;
      }

      const existing = [...room.players.values()].find(
        (p) => p.name.toLowerCase() === nick.toLowerCase(),
      );
      if (existing) {
        if (existing.connected && existing.socketId && existing.socketId !== socket.id) {
          socket.emit("error", { message: "That name is already in the room" });
          return;
        }
        existing.connected = true;
        existing.socketId = socket.id;
        void socket.join(room.code);
        emitRoom(io, room);
        return;
      }

      if (room.phase !== "lobby") {
        socket.emit("error", { message: "Game already started" });
        return;
      }

      const id = randomBytes(8).toString("hex");
      const team = room.nextTeam;
      room.nextTeam = team === "js" ? "python" : "js";
      room.players.set(id, {
        id,
        name: nick,
        team,
        score: 0,
        taps: 0,
        connected: true,
        socketId: socket.id,
        vote: null,
        answerIndex: null,
      });
      void socket.join(room.code);
      emitRoom(io, room);
    });

    socket.on("player:tap", ({ count }: { count?: number } = {}) => {
      const room = [...rooms.values()].find((r) => r.players && socket.rooms.has(r.code));
      if (!room || room.phase !== "tap") return;
      const player = [...room.players.values()].find((p) => p.socketId === socket.id);
      if (!player) return;
      const n = Math.min(30, Math.max(1, Math.floor(count ?? 1)));
      player.taps += n;
      player.score += n;
      if (!room.tapEmitTimer) {
        room.tapEmitTimer = setTimeout(() => {
          room.tapEmitTimer = null;
          emitRoom(io, room);
        }, 120);
      }
    });

    socket.on("player:vote", ({ choice }: { choice: "agree" | "disagree" }) => {
      const room = [...rooms.values()].find((r) => socket.rooms.has(r.code));
      if (!room || room.phase !== "hot") return;
      const player = [...room.players.values()].find((p) => p.socketId === socket.id);
      if (!player || player.vote) return;
      if (choice !== "agree" && choice !== "disagree") return;
      player.vote = choice;
      emitRoom(io, room);
    });

    socket.on("player:answer", ({ index }: { index: number }) => {
      const room = [...rooms.values()].find((r) => socket.rooms.has(r.code));
      if (!room || room.phase !== "quiz") return;
      const player = [...room.players.values()].find((p) => p.socketId === socket.id);
      if (!player || player.answerIndex !== null) return;
      const item = room.quiz[room.quizIndex];
      if (!Number.isInteger(index) || index < 0 || index >= item.options.length) return;
      player.answerIndex = index;
      if (index === item.correct) {
        const remaining = Math.max(0, (room.endsAt ?? Date.now()) - Date.now());
        player.score += 1000 + Math.floor((500 * remaining) / QUIZ_MS);
      }
      emitRoom(io, room);
    });

    socket.on("disconnect", () => {
      for (const room of rooms.values()) {
        if (room.hostSocketId === socket.id) {
          room.hostSocketId = null;
          room.hostDisconnectTimer = setTimeout(() => destroyRoom(io, room), 60_000);
          emitRoom(io, room);
        }
        for (const player of room.players.values()) {
          if (player.socketId === socket.id) {
            player.connected = false;
            player.socketId = null;
            emitRoom(io, room);
          }
        }
      }
    });
  });
}

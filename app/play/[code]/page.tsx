"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Confetti, Countdown, ErrorAlert, PrimaryButton, Section, TeamBadge } from "@/components/ui";
import { playerNameKey, useRoomState, useSocket } from "@/lib/client";
import { TEAM_LABEL, TAP_MS, HOT_MS, QUIZ_MS, type RoomState } from "@/lib/types";

const QUIZ_COLORS = [
  "bg-red-500/90 hover:bg-red-500",
  "bg-blue-500/90 hover:bg-blue-500",
  "bg-amber-500/90 text-black hover:bg-amber-500",
  "bg-emerald-500/90 hover:bg-emerald-500",
];

function PlayBody({
  state,
  onTap,
  onVote,
  onAnswer,
}: {
  state: RoomState;
  onTap: () => void;
  onVote: (choice: "agree" | "disagree") => void;
  onAnswer: (index: number) => void;
}) {
  const you = state.you;
  if (!you) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  /* ── Lobby ── */
  if (state.phase === "lobby") {
    return (
      <Section className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="animate-float">
          <TeamBadge team={you.team} size="lg" />
        </div>
        <h2 className="text-4xl font-black">
          You&apos;re in, {you.name}! 🎉
        </h2>
        <p className="text-lg text-slate-400">Waiting for the host to start…</p>
        <div className="glass rounded-2xl px-6 py-3 text-sm text-slate-400">
          <span className="relative mr-2 inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Connected to room
        </div>
      </Section>
    );
  }

  /* ── Tap Race ── */
  if (state.phase === "tap") {
    return (
      <Section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Round 1 · Tap Race
          </p>
          <Countdown endsAt={state.endsAt} totalMs={TAP_MS} />
        </div>
        <button
          type="button"
          onPointerDown={onTap}
          className="tap-btn flex h-[65dvh] w-full select-none items-center justify-center rounded-3xl text-5xl font-black text-white"
        >
          TAP! 👆
        </button>
      </Section>
    );
  }

  /* ── Tap Results ── */
  if (state.phase === "tap_results") {
    const myTaps = state.players.find((p) => p.id === you.id)?.taps ?? 0;
    return (
      <Section className="space-y-6 text-center py-10">
        <p className="text-5xl">👏</p>
        <h2 className="text-4xl font-black">Nice work!</h2>
        <div className="glass-strong inline-block rounded-2xl px-8 py-5">
          <p className="text-6xl font-black text-shimmer">{myTaps}</p>
          <p className="text-sm text-slate-400 mt-1">taps</p>
        </div>
        <p className="text-slate-400">Waiting for the host…</p>
      </Section>
    );
  }

  /* ── Hot Takes ── */
  if (state.phase === "hot" && state.hot) {
    return (
      <Section className="space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Round 2 · {state.hot.index + 1}/{state.hot.total}
        </p>
        <div className="glass-strong rounded-2xl p-5">
          <h2 className="text-2xl font-black leading-snug">🔥 {state.hot.text}</h2>
        </div>
        <div className="flex justify-center">
          <Countdown endsAt={state.endsAt} totalMs={HOT_MS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={you.voted}
            onClick={() => onVote("agree")}
            className={`vote-btn ${
              you.vote === "agree"
                ? "bg-emerald-400 text-black selected"
                : "bg-emerald-600"
            }`}
          >
            👍 Agree
          </button>
          <button
            type="button"
            disabled={you.voted}
            onClick={() => onVote("disagree")}
            className={`vote-btn ${
              you.vote === "disagree"
                ? "bg-rose-300 text-black selected"
                : "bg-rose-500"
            }`}
          >
            👎 Disagree
          </button>
        </div>
      </Section>
    );
  }

  /* ── Hot Reveal ── */
  if (state.phase === "hot_reveal" && state.hot) {
    const v = state.hot.votes;
    const totalAgree = v ? v.js.agree + v.python.agree : 0;
    const totalDisagree = v ? v.js.disagree + v.python.disagree : 0;
    const majorityIsAgree = totalAgree >= totalDisagree;
    const roast = majorityIsAgree ? state.hot.roastAgree : state.hot.roastDisagree;
    const emoji = majorityIsAgree ? "👍" : "👎";
    const color = majorityIsAgree ? "text-emerald-400" : "text-rose-400";
    const label = majorityIsAgree ? "Agree wins!" : "Disagree wins!";
    return (
      <Section className="space-y-5 text-center py-8">
        <div className="glass-strong rounded-2xl p-6 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-xl">
            {emoji} <span className={`font-bold ${color}`}>{roast}</span>
          </p>
        </div>
        <p className="text-sm text-slate-400">Waiting for the host…</p>
      </Section>
    );
  }

  /* ── Quiz ── */
  if (state.phase === "quiz" && state.quiz) {
    return (
      <Section className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Round 3 · {state.quiz.extra} {state.quiz.index + 1}/{state.quiz.total}
        </p>
        <div className="glass-strong rounded-2xl p-5">
          <h2 className="text-xl font-black leading-snug">{state.quiz.question}</h2>
        </div>
        <div className="flex justify-center">
          <Countdown endsAt={state.endsAt} totalMs={QUIZ_MS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {state.quiz.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              disabled={you.answered}
              onClick={() => onAnswer(i)}
              className={`quiz-option min-h-24 ${QUIZ_COLORS[i]} ${
                you.answerIndex === i ? "selected" : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </Section>
    );
  }

  /* ── Quiz Reveal ── */
  if (state.phase === "quiz_reveal" && state.quiz) {
    const ok = you.answerIndex === state.quiz.correct;
    return (
      <Section className="py-16 text-center space-y-4">
        <p className="text-6xl">{ok ? "🎉" : "😅"}</p>
        <h2 className={`text-4xl font-black ${ok ? "text-emerald-400" : "text-rose-400"}`}>
          {ok ? "Correct!" : "Nope!"}
        </h2>
        <p className="text-slate-400">
          Answer: <span className="font-bold text-white">{state.quiz.options[state.quiz.correct!]}</span>
        </p>
      </Section>
    );
  }

  /* ── Podium ── */
  if (state.phase === "podium" && state.podium) {
    const me = state.players.find((p) => p.id === you.id);
    const win = state.podium.winningTeam;
    return (
      <Section className="relative space-y-8 text-center py-8">
        <Confetti />
        <h2 className="text-5xl font-black text-shimmer">🏆 Game Over</h2>
        <p className="text-xl">
          {win === "tie" ? "Teams tied!" : `${TEAM_LABEL[win]} wins!`}
        </p>
        <div className="glass-strong inline-block rounded-2xl px-8 py-5">
          <p className="text-sm text-slate-400">Your score</p>
          <p className="text-4xl font-black">{me?.score ?? 0}</p>
        </div>
        <ol className="space-y-3 text-left max-w-sm mx-auto">
          {state.podium.top3.map((p, i) => (
            <li
              key={p.id}
              className="glass flex items-center justify-between rounded-2xl px-5 py-4 text-xl"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{["🥇", "🥈", "🥉"][i]}</span>
                <span className="font-bold">{p.name}</span>
                <TeamBadge team={p.team} />
              </span>
              <span className="font-black">{p.score}</span>
            </li>
          ))}
        </ol>
      </Section>
    );
  }

  return null;
}

/* ─── Play Page ─── */
export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toUpperCase();
  const [name, setName] = useState("");
  const [joinedName, setJoinedName] = useState("");
  const { socket, ready } = useSocket();
  const { state, error } = useRoomState(socket);
  const pendingTaps = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(playerNameKey(code));
    if (saved) {
      setName(saved);
      setJoinedName(saved);
    }
  }, [code]);

  useEffect(() => {
    if (!socket || !ready || !joinedName) return;
    socket.emit("player:join", { code, name: joinedName });
  }, [socket, ready, joinedName, code]);

  useEffect(() => {
    if (!socket) return;
    const id = setInterval(() => {
      if (pendingTaps.current > 0) {
        const n = pendingTaps.current;
        pendingTaps.current = 0;
        socket.emit("player:tap", { count: n });
      }
    }, 80);
    return () => clearInterval(id);
  }, [socket]);

  function join() {
    const nick = name.trim().slice(0, 16);
    if (!nick) return;
    localStorage.setItem(playerNameKey(code), nick);
    setJoinedName(nick);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") join();
  }

  /* ── Nickname entry ── */
  if (!joinedName) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
        <div className="animate-fade-in text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Joining room
          </p>
          <h1 className="mt-2 text-4xl font-black">
            {code}
          </h1>
        </div>

        <div className="animate-fade-in-delay-1 glass rounded-2xl p-6 space-y-4">
          <label htmlFor="nickname-input" className="block text-sm font-medium text-slate-400">
            Choose your nickname
          </label>
          <input
            id="nickname-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Your name"
            maxLength={16}
            autoFocus
            className="input-field w-full text-xl"
          />
          <PrimaryButton onClick={join} className="w-full">
            Enter Room
          </PrimaryButton>
        </div>

        <ErrorAlert message={error} />
      </main>
    );
  }

  /* ── In-game view ── */
  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-5 px-5 py-5">
      {/* Header */}
      <header className="flex items-center justify-between animate-fade-in">
        <p className="text-lg font-black text-shimmer">TechQuzz</p>
        {state?.you ? <TeamBadge team={state.you.team} /> : null}
      </header>

      <ErrorAlert message={error} />

      {state ? (
        <PlayBody
          state={state}
          onTap={() => {
            pendingTaps.current += 1;
          }}
          onVote={(choice) => socket?.emit("player:vote", { choice })}
          onAnswer={(index) => socket?.emit("player:answer", { index })}
        />
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3 animate-fade-in">
            <svg className="mx-auto h-8 w-8 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
            </svg>
            <p className="text-slate-400">Connecting…</p>
          </div>
        </div>
      )}
    </main>
  );
}

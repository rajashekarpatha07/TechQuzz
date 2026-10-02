"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Confetti, Countdown, ErrorAlert, PrimaryButton, Section, TeamBadge } from "@/components/ui";
import { hostSecretKey, nextLabel, useJoinUrl, useRoomState, useSocket } from "@/lib/client";
import { TEAM_LABEL, TAP_MS, HOT_MS, QUIZ_MS, type RoomState, type Team } from "@/lib/types";

/* ─── Lobby: QR code + team rosters ─── */
function HostLobby({ state, joinUrl }: { state: RoomState; joinUrl: string }) {
  const js = state.players.filter((p) => p.team === "js");
  const py = state.players.filter((p) => p.team === "python");
  return (
    <Section className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* QR panel */}
      <div className="glass-strong rounded-3xl p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Scan to join
        </p>
        <p className="mt-3 font-mono text-7xl font-black tracking-[0.2em] text-shimmer">
          {state.code}
        </p>
        {joinUrl ? (
          <div className="mt-8 inline-block rounded-2xl bg-white p-4">
            <QRCodeSVG value={joinUrl} size={200} bgColor="white" fgColor="#0f0f1a" />
          </div>
        ) : null}
        <p className="mt-4 text-sm text-slate-500 break-all">{joinUrl}</p>
      </div>

      {/* Team columns */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamColumn team="js" players={js} />
        <TeamColumn team="python" players={py} />
      </div>
    </Section>
  );
}

function TeamColumn({ team, players }: { team: Team; players: RoomState["players"] }) {
  const isJs = team === "js";
  return (
    <div
      className="glass rounded-3xl p-5"
      style={{
        borderColor: isJs ? "rgba(250, 204, 21, 0.15)" : "rgba(56, 189, 248, 0.15)",
      }}
    >
      <TeamBadge team={team} />
      <p className="mt-3 text-4xl font-black">{players.length}</p>
      <p className="text-sm text-slate-400">
        {players.length === 1 ? "player" : "players"}
      </p>
      <ul className="mt-4 space-y-1.5">
        {players.map((p) => (
          <li
            key={p.id}
            className={`flex items-center gap-2 text-lg ${p.connected ? "" : "opacity-30"}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${p.connected ? "bg-emerald-400" : "bg-slate-600"}`}
            />
            {p.name}
          </li>
        ))}
        {players.length === 0 && (
          <li className="text-sm text-slate-500 italic">Waiting for players…</li>
        )}
      </ul>
    </div>
  );
}

/* ─── Score header ─── */
function Scoreboard({ state }: { state: RoomState }) {
  return (
    <div className="flex gap-3">
      <div className="score-card team-js">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">JavaScript</p>
        <p className="text-3xl font-black score-num">{state.teamScores.js}</p>
      </div>
      <div className="score-card team-python">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Python</p>
        <p className="text-3xl font-black score-num">{state.teamScores.python}</p>
      </div>
    </div>
  );
}

/* ─── Combined vote results (single bar, no team split) ─── */
function VoteResults({ votes }: { votes: { js: { agree: number; disagree: number }; python: { agree: number; disagree: number } } }) {
  const totalAgree = votes.js.agree + votes.python.agree;
  const totalDisagree = votes.js.disagree + votes.python.disagree;
  const total = Math.max(1, totalAgree + totalDisagree);
  const agreePercent = Math.round((totalAgree / total) * 100);
  const disagreePercent = 100 - agreePercent;

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-4">
      {/* Agree / Disagree header */}
      <div className="flex justify-between text-lg font-bold">
        <span className="text-emerald-400">👍 Agree {agreePercent}%</span>
        <span className="text-rose-400">{disagreePercent}% Disagree 👎</span>
      </div>
      {/* Combined bar */}
      <div className="flex h-5 overflow-hidden rounded-full bg-black/40">
        <div
          className="progress-fill h-full bg-emerald-400"
          style={{ width: `${agreePercent}%` }}
        />
        <div
          className="progress-fill h-full bg-rose-400"
          style={{ width: `${disagreePercent}%` }}
        />
      </div>
      {/* Counts */}
      <div className="flex justify-between text-sm text-slate-400">
        <span>{totalAgree} vote{totalAgree !== 1 ? "s" : ""}</span>
        <span>{totalDisagree} vote{totalDisagree !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

/* ─── Main body for each phase ─── */
function HostBody({ state }: { state: RoomState }) {
  if (state.phase === "lobby") return null;

  /* ── Tap Race ── */
  if (state.phase === "tap" || state.phase === "tap_results") {
    const jsTaps = state.players
      .filter((p) => p.team === "js")
      .reduce((s, p) => s + p.taps, 0);
    const pyTaps = state.players
      .filter((p) => p.team === "python")
      .reduce((s, p) => s + p.taps, 0);
    return (
      <Section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Round 1
          </p>
          <h2 className="mt-2 text-5xl font-black">⚡ Tap Race</h2>
        </div>
        <div className="flex justify-center">
          <Countdown endsAt={state.endsAt} totalMs={TAP_MS} />
        </div>
        <div className="grid grid-cols-2 gap-6 text-center">
          <div className="score-card team-js rounded-3xl p-8">
            <p className="text-sm font-bold uppercase tracking-wider opacity-70">JS Taps</p>
            <p className="mt-2 text-7xl font-black score-num">{jsTaps}</p>
          </div>
          <div className="score-card team-python rounded-3xl p-8">
            <p className="text-sm font-bold uppercase tracking-wider opacity-70">Python Taps</p>
            <p className="mt-2 text-7xl font-black score-num">{pyTaps}</p>
          </div>
        </div>
        {state.phase === "tap_results" && (
          <p className="text-center text-lg text-slate-400 animate-fade-in">
            {jsTaps > pyTaps ? "⚡ JavaScript wins the tap race!" : pyTaps > jsTaps ? "🐍 Python wins the tap race!" : "🤝 It's a tie!"}
          </p>
        )}
      </Section>
    );
  }

  /* ── Hot Takes ── */
  if ((state.phase === "hot" || state.phase === "hot_reveal") && state.hot) {
    const v = state.hot.votes;
    return (
      <Section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Round 2 · Hot Take {state.hot.index + 1}/{state.hot.total}
          </p>
        </div>
        <div className="glass-strong rounded-3xl p-8 text-center">
          <h2 className="text-4xl font-black leading-tight">🔥 {state.hot.text}</h2>
        </div>
        <div className="flex justify-center">
          <Countdown endsAt={state.endsAt} totalMs={HOT_MS} />
        </div>
        {state.phase === "hot_reveal" && v ? (() => {
          const totalAgree = v.js.agree + v.python.agree;
          const totalDisagree = v.js.disagree + v.python.disagree;
          const majorityIsAgree = totalAgree >= totalDisagree;
          const roast = majorityIsAgree ? state.hot!.roastAgree : state.hot!.roastDisagree;
          const emoji = majorityIsAgree ? "👍" : "👎";
          const color = majorityIsAgree ? "text-emerald-400" : "text-rose-400";
          const label = majorityIsAgree ? "Agree wins!" : "Disagree wins!";
          return (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-strong rounded-2xl p-6 text-center space-y-3">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-2xl">
                  {emoji} <span className={`font-bold ${color}`}>{roast}</span>
                </p>
              </div>
              <VoteResults votes={v} />
            </div>
          );
        })() : (
          <p className="text-center text-xl text-slate-400 animate-float">
            📱 Vote on your phone!
          </p>
        )}
      </Section>
    );
  }

  /* ── Quiz ── */
  if ((state.phase === "quiz" || state.phase === "quiz_reveal") && state.quiz) {
    return (
      <Section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Round 3 · {state.quiz.extra} Question {state.quiz.index + 1}/{state.quiz.total}
          </p>
        </div>
        <div className="glass-strong rounded-3xl p-8 text-center">
          <h2 className="text-4xl font-black leading-tight">{state.quiz.question}</h2>
        </div>
        <div className="flex justify-center">
          <Countdown endsAt={state.endsAt} totalMs={QUIZ_MS} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {state.quiz.options.map((opt, i) => {
            const isCorrect = state.phase === "quiz_reveal" && state.quiz?.correct === i;
            const count = state.quiz?.counts?.[i] ?? 0;
            const labels = ["A", "B", "C", "D"];
            const colors = [
              "bg-red-500/80",
              "bg-blue-500/80",
              "bg-amber-500/80",
              "bg-emerald-500/80",
            ];
            return (
              <div
                key={opt}
                className={`rounded-2xl p-5 text-xl font-semibold transition-all duration-300 ${
                  isCorrect
                    ? "bg-emerald-500/30 ring-2 ring-emerald-400 scale-[1.02]"
                    : state.phase === "quiz_reveal"
                      ? "glass opacity-60"
                      : colors[i]
                }`}
              >
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 font-mono text-sm font-bold">
                  {labels[i]}
                </span>
                {opt}
                {state.phase === "quiz_reveal" && (
                  <span className="float-right font-mono text-lg opacity-70">{count}</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    );
  }

  /* ── Podium ── */
  if (state.phase === "podium" && state.podium) {
    const win = state.podium.winningTeam;
    const medals = ["🥇", "🥈", "🥉"];
    const barHeights = ["220px", "160px", "120px"];
    const barColors = [
      "linear-gradient(180deg, #facc15, #eab308)",
      "linear-gradient(180deg, #cbd5e1, #94a3b8)",
      "linear-gradient(180deg, #d97706, #b45309)",
    ];
    return (
      <Section className="relative space-y-10">
        <Confetti />
        <div className="text-center">
          <h2 className="text-6xl font-black text-shimmer">🏆 Podium</h2>
          <p className="mt-4 text-2xl">
            {win === "tie" ? (
              <span className="font-bold">It&apos;s a tie!</span>
            ) : (
              <>
                Winner: <span className="font-black">{TEAM_LABEL[win]}</span>{" "}
                <TeamBadge team={win} size="lg" />
              </>
            )}
          </p>
        </div>

        {/* Podium bars */}
        <div className="flex items-end justify-center gap-4">
          {[1, 0, 2].map((rank) => {
            const p = state.podium!.top3[rank];
            if (!p) return null;
            return (
              <div key={p.id} className="flex flex-col items-center gap-2" style={{ animationDelay: `${rank * 0.2}s` }}>
                <p className="text-4xl">{medals[rank]}</p>
                <p className="text-lg font-bold">{p.name}</p>
                <TeamBadge team={p.team} />
                <div
                  className="podium-bar w-28 flex items-end justify-center pb-3"
                  style={{
                    "--bar-height": barHeights[rank],
                    height: barHeights[rank],
                    background: barColors[rank],
                    animationDelay: `${rank * 0.2 + 0.3}s`,
                  } as React.CSSProperties}
                >
                  <span className="text-2xl font-black text-black/70">{p.score}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    );
  }

  return null;
}

/* ─── Host Page ─── */
export default function HostPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toUpperCase();
  const { socket, ready } = useSocket();
  const { state, error } = useRoomState(socket);
  const joinUrl = useJoinUrl(code);

  // BUG FIX: use undefined to distinguish "not loaded yet" from "no key"
  const [secret, setSecret] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem(hostSecretKey(code));
    setSecret(stored); // null if not found, string if found
  }, [code]);

  useEffect(() => {
    if (!socket || !ready || !secret) return;
    socket.emit("host:join", { code, hostSecret: secret });
  }, [socket, ready, secret, code]);

  // Still loading from localStorage
  if (secret === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-8">
        <div className="text-center space-y-3 animate-fade-in">
          <svg className="mx-auto h-8 w-8 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
          </svg>
          <p className="text-slate-400">Connecting…</p>
        </div>
      </main>
    );
  }

  // No host key found
  if (!secret) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-8">
        <div className="text-center space-y-4 animate-fade-in glass rounded-3xl p-10 max-w-md">
          <p className="text-5xl">🔒</p>
          <h2 className="text-2xl font-bold">No Host Key</h2>
          <p className="text-slate-400">
            No host key found on this device. Create a new room from the home page.
          </p>
          <PrimaryButton onClick={() => window.location.assign("/")}>
            Go to Home
          </PrimaryButton>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-6xl space-y-8 px-6 py-8">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-center justify-between gap-4 animate-fade-in">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Host Dashboard</p>
          <h1 className="mt-1 text-3xl font-black">
            TechQuzz <span className="text-violet-400">·</span> {code}
          </h1>
        </div>
        {state ? <Scoreboard state={state} /> : null}
        {state && state.phase !== "podium" ? (
          <PrimaryButton
            onClick={() => socket?.emit("host:advance", { code, hostSecret: secret })}
          >
            {nextLabel(state.phase)}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </PrimaryButton>
        ) : null}
      </header>

      <ErrorAlert message={error} />

      {/* ── Lobby ── */}
      {state?.phase === "lobby" ? <HostLobby state={state} joinUrl={joinUrl} /> : null}

      {/* ── Phase body ── */}
      {state ? (
        <HostBody state={state} />
      ) : (
        <div className="flex justify-center py-20">
          <div className="text-center space-y-3 animate-fade-in">
            <svg className="mx-auto h-8 w-8 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
            </svg>
            <p className="text-slate-400">Connecting to room…</p>
          </div>
        </div>
      )}
    </main>
  );
}

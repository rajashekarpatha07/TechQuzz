"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { io } from "socket.io-client";
import { hostSecretKey } from "@/lib/client";
import { ErrorAlert, PrimaryButton } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function createRoom() {
    setBusy(true);
    setError(null);
    const socket = io({ transports: ["websocket", "polling"] });
    socket.on("host:created", ({ code: roomCode, hostSecret }: { code: string; hostSecret: string }) => {
      localStorage.setItem(hostSecretKey(roomCode), hostSecret);
      socket.disconnect();
      router.push(`/host/${roomCode}`);
    });
    socket.on("connect", () => socket.emit("host:create"));
    socket.on("connect_error", () => {
      setBusy(false);
      setError("Could not reach the server. Please try again.");
      socket.disconnect();
    });
  }

  function joinRoom() {
    const next = code.trim().toUpperCase();
    if (next.length < 4) {
      setError("Enter a 4-letter room code");
      return;
    }
    router.push(`/play/${next}`);
  }

  function handleCodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") joinRoom();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-10 px-6 py-12">
      {/* ── Hero ── */}
      <div className="animate-fade-in text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
          </span>
          Live event
        </div>
        <h1 className="text-6xl font-black tracking-tight text-shimmer sm:text-7xl">
          TechQuzz
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          JavaScript vs Python — scan, tap, argue, quiz.
        </p>
      </div>

      {/* ── Create room ── */}
      <div className="animate-fade-in-delay-1">
        <PrimaryButton onClick={createRoom} disabled={busy} className="w-full text-lg py-4">
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
              </svg>
              Creating room…
            </span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Create room (host)
            </>
          )}
        </PrimaryButton>
      </div>

      {/* ── Divider ── */}
      <div className="animate-fade-in-delay-2 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-sm font-medium text-slate-500">or join with a code</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── Join panel ── */}
      <div className="animate-fade-in-delay-3 glass rounded-2xl p-6">
        <div className="flex gap-3">
          <input
            id="room-code-input"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleCodeKeyDown}
            maxLength={4}
            placeholder="K7PX"
            aria-label="Room code"
            className="input-field w-full text-center text-2xl tracking-[0.4em] uppercase font-bold"
          />
          <PrimaryButton onClick={joinRoom}>Join</PrimaryButton>
        </div>
      </div>

      <ErrorAlert message={error} />

      {/* ── Footer ── */}
      <p className="animate-fade-in-delay-3 text-center text-xs text-slate-600">
        Built for live tech events · No account needed
      </p>
    </main>
  );
}

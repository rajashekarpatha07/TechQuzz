"use client";

import { useEffect, useState, useRef } from "react";
import { TEAM_LABEL, type Team } from "@/lib/types";

/* ─── Countdown with circular progress ring ─── */
export function Countdown({ endsAt, totalMs }: { endsAt: number | null; totalMs?: number }) {
  const [left, setLeft] = useState(0);
  const total = totalMs ?? 15000;

  useEffect(() => {
    if (!endsAt) {
      setLeft(0);
      return;
    }
    const tick = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;

  const progress = Math.max(0, Math.min(1, (left * 1000) / total));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="countdown-ring inline-flex items-center justify-center" aria-label={`${left} seconds remaining`}>
      <svg width="110" height="110" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        {/* Progress ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={left <= 3 ? "#f43f5e" : "#8b5cf6"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.5s ease" }}
        />
        <text
          x="50" y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="28"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          {left}
        </text>
      </svg>
    </div>
  );
}

/* ─── Team Badge ─── */
export function TeamBadge({ team, size = "sm" }: { team: Team; size?: "sm" | "lg" }) {
  const js = team === "js";
  const classes =
    size === "lg"
      ? `rounded-full px-5 py-2 text-base font-bold ${js ? "team-js" : "team-python"}`
      : `rounded-full px-3 py-1 text-sm font-semibold ${js ? "team-js" : "team-python"}`;
  return <span className={classes}>Team {TEAM_LABEL[team]}</span>;
}

/* ─── Primary Button ─── */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Error Alert ─── */
export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="error-alert" role="alert">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}

/* ─── Confetti (fixed: actually falls!) ─── */
export function Confetti() {
  const bits = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      left: `${(i * 13 + 7) % 100}%`,
      duration: `${2.5 + (i % 5) * 0.6}s`,
      delay: `${(i % 12) * 0.15}s`,
      color: ["#facc15", "#38bdf8", "#a78bfa", "#fb7185", "#34d399", "#f472b6"][i % 6],
      width: `${6 + (i % 4) * 3}px`,
      height: `${8 + (i % 5) * 4}px`,
    })),
  ).current;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: b.left,
            animationDuration: b.duration,
            animationDelay: b.delay,
            background: b.color,
            width: b.width,
            height: b.height,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Section wrapper with fade-in ─── */
export function Section({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const delayClass =
    delay === 0
      ? "animate-fade-in"
      : delay === 1
        ? "animate-fade-in-delay-1"
        : delay === 2
          ? "animate-fade-in-delay-2"
          : "animate-fade-in-delay-3";

  return <div className={`${delayClass} ${className}`}>{children}</div>;
}

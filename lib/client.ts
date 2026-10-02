"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { RoomState } from "@/lib/types";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = io({ transports: ["websocket", "polling"] });
    setSocket(next);
    const onConnect = () => setReady(true);
    next.on("connect", onConnect);
    if (next.connected) setReady(true);
    return () => {
      next.off("connect", onConnect);
      next.disconnect();
      setSocket(null);
      setReady(false);
    };
  }, []);

  return { socket, ready };
}

export function useRoomState(socket: Socket | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    const onState = (next: RoomState) => setState(next);
    const onError = (e: { message: string }) => setError(e.message);
    socket.on("room:state", onState);
    socket.on("error", onError);
    return () => {
      socket.off("room:state", onState);
      socket.off("error", onError);
    };
  }, [socket]);

  return { state, error, setError };
}

export function hostSecretKey(code: string) {
  return `techquzz-host-${code.toUpperCase()}`;
}

export function playerNameKey(code: string) {
  return `techquzz-name-${code.toUpperCase()}`;
}

export function nextLabel(phase: RoomState["phase"] | undefined) {
  switch (phase) {
    case "lobby":
      return "Start Tap Race";
    case "tap":
      return "Skip to results";
    case "tap_results":
      return "Start Hot Takes";
    case "hot":
      return "Reveal votes";
    case "hot_reveal":
      return "Next";
    case "quiz":
      return "Reveal answer";
    case "quiz_reveal":
      return "Next";
    default:
      return "Next";
  }
}

export function useJoinUrl(code: string) {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/play/${code}`;
  }, [code]);
}

"use client";

import { useCallback, useState } from "react";
import type { Socket } from "socket.io-client";
import ChessGame from "@/components/chess/ChessGame";
import ModeMenu from "@/components/menu/ModeMenu";
import OnlineLobby from "@/components/online/OnlineLobby";

export default function Home() {
  const [mode, setMode] = useState<"menu" | "classic" | "lobby" | "online">("menu");
  const [onlineSocket, setOnlineSocket] = useState<Socket | null>(null);
  const [onlineRoomId, setOnlineRoomId] = useState("");
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<"w" | "b">("w");

  const startOnline = useCallback((socket: Socket, roomId: string, color: "w" | "b") => {
    setOnlineSocket(socket);
    setOnlineRoomId(roomId);
    setOnlinePlayerColor(color);
    setMode("online");
  }, []);

  if (mode === "classic") {
    return <ChessGame onBackToMenu={() => setMode("menu")} />;
  }

  if (mode === "online") {
    return <ChessGame onlineSocket={onlineSocket} onlineRoomId={onlineRoomId} onlinePlayerColor={onlinePlayerColor} onBackToMenu={() => { onlineSocket?.disconnect(); setOnlineSocket(null); setMode("menu"); }} />;
  }

  if (mode === "lobby") {
    return <OnlineLobby onBack={() => setMode("menu")} onGameStart={startOnline} />;
  }

  if (mode === "menu") {
    return <ModeMenu onSelectClassic={() => setMode("classic")} onSelectOnline={() => setMode("lobby")} />;
  }

  return <OnlineLobby onBack={() => setMode("menu")} onGameStart={startOnline} />;
}

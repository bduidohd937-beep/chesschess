"use client";

import { useCallback, useState } from "react";
import type { Socket } from "socket.io-client";
import ChessGame from "@/components/chess/ChessGame";
import ModeMenu from "@/components/menu/ModeMenu";
import OnlineLobby from "@/components/online/OnlineLobby";

type MenuMode = "root" | "offline" | "online";
type GameType = "classic" | "augment";

export default function Home() {
  const [menuMode, setMenuMode] = useState<MenuMode>("root");
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [onlineSocket, setOnlineSocket] = useState<Socket | null>(null);
  const [onlineRoomId, setOnlineRoomId] = useState("");
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<"w" | "b">("w");

  const startOnline = useCallback((socket: Socket, roomId: string, color: "w" | "b") => {
    setOnlineSocket(socket);
    setOnlineRoomId(roomId);
    setOnlinePlayerColor(color);
  }, []);

  const resetToRoot = () => {
    onlineSocket?.disconnect();
    setOnlineSocket(null);
    setOnlineRoomId("");
    setOnlinePlayerColor("w");
    setGameType(null);
    setMenuMode("root");
  };

  if (gameType === "classic" && menuMode === "offline") {
    return <ChessGame onBackToMenu={() => { setGameType(null); setMenuMode("offline"); }} />;
  }

  if (gameType === "classic" && menuMode === "online" && onlineSocket) {
    return (
      <ChessGame
        onlineSocket={onlineSocket}
        onlineRoomId={onlineRoomId}
        onlinePlayerColor={onlinePlayerColor}
        onBackToMenu={() => { onlineSocket.disconnect(); setOnlineSocket(null); setGameType(null); setMenuMode("online"); }}
      />
    );
  }

  if (gameType === "augment") {
    return (
      <main className="mode-menu">
        <div className="mode-hero">
          <div className="eyebrow">AUGMENT CHESS</div>
          <h1>COMING SOON</h1>
          <p>The augment battlefield is being built as a separate game experience.</p>
          <button className="online-secondary" onClick={() => { setGameType(null); }}>BACK TO MODE SELECT</button>
        </div>
      </main>
    );
  }

  if (menuMode === "online" && !gameType) {
    if (!onlineSocket) {
      return <OnlineLobby onBack={() => setMenuMode("root")} onGameStart={(socket, roomId, color) => {
        setGameType("classic");
        startOnline(socket, roomId, color);
      }} />;
    }
  }

  if (menuMode === "root") {
    return (
      <main className="mode-menu">
        <div className="menu-topline">
          <span>CHESSCHESS</span>
          <span>3D STRATEGY</span>
        </div>
        <div className="mode-hero">
          <div className="eyebrow">THE ROYAL GAME / THE AUGMENT BATTLEFIELD</div>
          <h1>CHESSCHESS</h1>
          <p>Choose your battlefield.</p>
        </div>
        <section className="mode-grid">
          <button className="mode-card featured" onClick={() => setMenuMode("offline")}>
            <div className="mode-card-top"><span className="mode-index">01</span><span className="mode-icon">♟</span></div>
            <div><span className="mode-title">OFFLINE GAME</span><span className="mode-description">Play locally against Stockfish or another player.</span></div>
            <span className="mode-action">CHOOSE MODE <b>→</b></span>
          </button>
          <button className="mode-card augment" onClick={() => setMenuMode("online")}>
            <div className="mode-card-top"><span className="mode-index">02</span><span className="mode-icon">◈</span></div>
            <div><span className="mode-title">ONLINE GAME</span><span className="mode-description">Connect with another player and choose Classic or Augment Chess.</span></div>
            <span className="mode-action">CHOOSE MODE <b>→</b></span>
          </button>
        </section>
        <div className="mode-footer"><span>OFFLINE</span><span>•</span><span>ONLINE</span><span>•</span><span>TWO GAME EXPERIENCES</span></div>
      </main>
    );
  }

  return (
    <ModeMenu
      mode={menuMode}
      onSelectClassic={() => setGameType("classic")}
      onSelectAugment={() => setGameType("augment")}
      onBack={() => setMenuMode("root")}
    />
  );
}

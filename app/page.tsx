"use client";

import { useState } from "react";
import ChessGame from "@/components/chess/ChessGame";
import ModeMenu from "@/components/menu/ModeMenu";

export default function Home() {
  const [mode, setMode] = useState<"menu" | "classic">("menu");

  if (mode === "classic") {
    return <ChessGame onBackToMenu={() => setMode("menu")} />;
  }

  return <ModeMenu onSelectClassic={() => setMode("classic")} />;
}

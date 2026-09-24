"use client";

import { useState } from "react";
import type { Socket } from "socket.io-client";
import ChessGame from "@/components/chess/ChessGame";
import {
  chooseAugment,
  createAugmentGameState,
  getAugmentDefinition,
  getCurrentSelection,
  recordPiecesLost,
  rerollCurrentSelection,
} from "./AugmentManager";
import type { AugmentGameState, AugmentId, AugmentSelection, AugmentTier } from "./types";

type Props = {
  onBackToMenu?: () => void;
  onlineSocket?: Socket | null;
  onlineRoomId?: string;
  onlinePlayerColor?: "w" | "b";
  startAugmentTiers?: AugmentTier[];
};

const TIER_LABELS = {
  silver: "SILVER",
  gold: "GOLD",
  prism: "PRISM",
  transcendent: "TRANSCENDENT",
} as const;

export default function AugmentChessGame({
  onBackToMenu,
  onlineSocket,
  onlineRoomId,
  onlinePlayerColor,
  startAugmentTiers,
}: Props) {
  const [state, setState] = useState<AugmentGameState>(() => createAugmentGameState(startAugmentTiers));
  const current = getCurrentSelection(state);
  const selecting = Boolean(current && !current.selected);

  function choose(id: AugmentId) {
    setState((previous) => chooseAugment(previous, id));
  }

  function reroll(optionIndex: number) {
    setState((previous) => rerollCurrentSelection(previous, optionIndex));
  }

  function onPieceCaptured(_color: "w" | "b") {
    if (onlineSocket) return;
    setState((previous) => recordPiecesLost(previous, 1));
  }

  return (
    <ChessGame
      onlineSocket={onlineSocket}
      onlineRoomId={onlineRoomId}
      onlinePlayerColor={onlinePlayerColor}
      onPieceCaptured={onPieceCaptured}
      onBackToMenu={onBackToMenu}
      augmentMode
      augmentState={state}
      augmentSelection={selecting ? current : null}
      onChooseAugment={choose}
      onRerollAugment={reroll}
    />
  );
}

export { TIER_LABELS };

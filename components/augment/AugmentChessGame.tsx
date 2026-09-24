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
import type { AugmentGameState, AugmentId } from "./types";

type Props = {
  onBackToMenu?: () => void;
  onlineSocket?: Socket | null;
  onlineRoomId?: string;
  onlinePlayerColor?: "w" | "b";
};

const TIER_LABELS = {
  silver: "SILVER",
  gold: "GOLD",
  prism: "PRISM",
  transcendent: "TRANSCENDENT",
} as const;

const PHASE_LABELS = {
  start: "BATTLE PREPARATION",
  losses_8: "8 PIECES LOST",
  losses_16: "16 PIECES LOST",
} as const;

export default function AugmentChessGame({
  onBackToMenu,
  onlineSocket,
  onlineRoomId,
  onlinePlayerColor,
}: Props) {
  const [state, setState] = useState<AugmentGameState>(() => createAugmentGameState());

  const current = getCurrentSelection(state);
  const selecting = Boolean(current && !current.selected);
  const phase = current?.phase ?? "start";

  function choose(id: AugmentId) {
    setState((previous) => chooseAugment(previous, id));
  }

  function reroll() {
    setState((previous) => rerollCurrentSelection(previous));
  }

  function onPieceCaptured(color: "w" | "b") {
    if (onlineSocket) return;
    setState((previous) => {
      if (previous.nextSelection === null) return previous;
      return recordPiecesLost(previous, 1);
    });
  }

  if (selecting) {
    return (
      <main className="augment-screen">
        <div className="augment-topline">
          <button className="augment-back" onClick={onBackToMenu}>← MENU</button>
          <span>CHESSCHESS / AUGMENT</span>
          <span>{state.rerollsRemaining} REROLLS</span>
        </div>

        <section className="augment-hero">
          <div className="augment-eyebrow">AUGMENT CHESS</div>
          <h1>{PHASE_LABELS[phase]}</h1>
          <p>
            {phase === "start"
              ? "Choose your first power before the battle begins."
              : "The battlefield has changed. Choose your next power."}
          </p>
        </section>

        <section className="augment-progress">
          <div className={state.selections[0]?.selected ? "augment-step done" : "augment-step active"}>
            <b>01</b><span>START</span>
          </div>
          <div className={state.selections[1]?.selected ? "augment-step done" : state.nextSelection === "losses_8" ? "augment-step active" : "augment-step"}>
            <b>02</b><span>8 LOST</span>
          </div>
          <div className={state.selections[2]?.selected ? "augment-step done" : state.nextSelection === "losses_16" ? "augment-step active" : "augment-step"}>
            <b>03</b><span>16 LOST</span>
          </div>
        </section>

        <section className="augment-options">
          {current.options.map((id) => {
            const augment = getAugmentDefinition(id);
            if (!augment) return null;

            return (
              <button
                key={id}
                className={`augment-card tier-${augment.tier}`}
                onClick={() => choose(id)}
              >
                <div className="augment-card-head">
                  <span>{TIER_LABELS[augment.tier]}</span>
                  <small>{augment.category.toUpperCase()}</small>
                </div>
                <div className="augment-symbol">
                  {augment.tier === "transcendent" ? "✦" : augment.tier === "prism" ? "◇" : augment.tier === "gold" ? "◆" : "●"}
                </div>
                <h2>{augment.name}</h2>
                <p>{augment.description}</p>
                <span className="augment-pick">SELECT AUGMENT →</span>
              </button>
            );
          })}
        </section>

        <div className="augment-bottom">
          <div>
            <span>REROLLS REMAINING</span>
            <strong>{state.rerollsRemaining}</strong>
          </div>
          <button
            className="augment-reroll"
            onClick={reroll}
            disabled={state.rerollsRemaining <= 0}
          >
            REROLL OPTIONS
          </button>
        </div>

        {state.ownedAugments.length > 0 && (
          <div className="augment-owned">
            <span>ACQUIRED</span>
            {state.ownedAugments.map((id) => {
              const augment = getAugmentDefinition(id);
              return augment ? <b key={id}>{augment.name}</b> : null;
            })}
          </div>
        )}
      </main>
    );
  }

  return (
    <ChessGame
      onlineSocket={onlineSocket}
      onlineRoomId={onlineRoomId}
      onlinePlayerColor={onlinePlayerColor}
      onPieceCaptured={onPieceCaptured}
      onBackToMenu={onBackToMenu}
      augmentMode
    />
  );
}

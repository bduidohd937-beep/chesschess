"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Socket } from "socket.io-client";
import type { AugmentGameState, AugmentId, AugmentSelection } from "@/components/augment/types";
import { getAugmentDefinition } from "@/components/augment/AugmentManager";

type PromotionPiece = "q" | "r" | "b" | "n";
type AiLevel = "beginner" | "intermediate" | "advanced";

const AI_LEVELS: Record<AiLevel, { label: string; skill: number; depth: number }> = {
  beginner: { label: "BEGINNER", skill: 2, depth: 6 },
  intermediate: { label: "INTERMEDIATE", skill: 10, depth: 10 },
  advanced: { label: "ADVANCED", skill: 20, depth: 14 },
};

const files = ["a","b","c","d","e","f","g","h"];

function squarePosition(square: Square): [number, number, number] {
  const file = files.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  return [file - 3.5, 0, rank - 3.5];
}

function pieceLabel(piece: PieceSymbol, color: Color) {
  const symbols: Record<Color, Record<PieceSymbol, string>> = {
    w: { k:"♔", q:"♕", r:"♖", b:"♗", n:"♘", p:"♙" },
    b: { k:"♚", q:"♛", r:"♜", b:"♝", n:"♞", p:"♟" },
  };
  return symbols[color][piece];
}

function Piece({ type, color, square, selected, augmentGlow, onClick, animateFrom }: {
  type: PieceSymbol;
  color: Color;
  square: Square;
  selected: boolean;
  augmentGlow?: boolean;
  onClick: () => void;
  animateFrom?: Square;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [x, , z] = squarePosition(square);
  const white = color === "w";

  const animationStart = animateFrom ? squarePosition(animateFrom) : null;
  const animationElapsed = useRef(animateFrom ? 0 : 1);
  useEffect(() => {
    animationElapsed.current = animateFrom ? 0 : 1;
    if (groupRef.current && !animateFrom) {
      groupRef.current.position.set(x, selected ? 0.18 : 0.1, z);
    }
  }, [animateFrom, x, z, selected]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!animationStart || animationElapsed.current >= 1) {
      groupRef.current.position.set(x, selected ? 0.18 : 0.1, z);
      return;
    }

    animationElapsed.current = Math.min(1, animationElapsed.current + delta / 0.22);
    const t = animationElapsed.current;
    const eased = 1 - Math.pow(1 - t, 3);

    groupRef.current.position.x = THREE.MathUtils.lerp(animationStart[0], x, eased);
    groupRef.current.position.z = THREE.MathUtils.lerp(animationStart[2], z, eased);
    groupRef.current.position.y =
      THREE.MathUtils.lerp(0.1, selected ? 0.18 : 0.1, eased) +
      Math.sin(Math.PI * eased) * 0.22;
  });

  const main = selected ? "#d9b84c" : white ? "#eee9dc" : "#171412";
  const edge = selected ? "#ffe38a" : white ? "#b9b09f" : "#050403";

  const material = {
    color: main,
    metalness: white ? 0.28 : 0.42,
    roughness: white ? 0.2 : 0.26,
  } as const;

  const accent = {
    color: edge,
    metalness: white ? 0.34 : 0.5,
    roughness: 0.18,
  } as const;

  const gold = {
    color: selected ? "#ffe28a" : "#a98232",
    metalness: 0.72,
    roughness: 0.18,
  } as const;

  return (
    <group
      ref={groupRef}
      position={[x, selected ? 0.18 : 0.1, z]}
      scale={augmentGlow ? 1.055 : selected ? 1.04 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {augmentGlow && <pointLight color="#d7a4ff" intensity={2.2} distance={2.2} />}
      {augmentGlow && <mesh raycast={() => null} position={[0, 0.16, 0]}><torusGeometry args={[0.43, 0.045, 12, 40]} /><meshBasicMaterial color="#d98cff" transparent opacity={0.9} /></mesh>}
      {/* 공통 Staunton 스타일 받침 */}
      <mesh castShadow receiveShadow position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.41, 0.48, 0.11, 48]} />
        <meshStandardMaterial {...accent} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.33, 0.39, 0.08, 48]} />
        <meshStandardMaterial {...material} />
      </mesh>

      {/* PAWN */}
      {type === "p" && (
        <>
          <mesh castShadow receiveShadow position={[0, 0.38, 0]}>
            <latheGeometry args={[[
              new THREE.Vector2(0.15, 0),
              new THREE.Vector2(0.23, 0.08),
              new THREE.Vector2(0.2, 0.17),
              new THREE.Vector2(0.13, 0.25),
              new THREE.Vector2(0.12, 0.43),
              new THREE.Vector2(0.18, 0.5),
            ], 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={[0, 0.82, 0]}>
            <sphereGeometry args={[0.22, 36, 24]} />
            <meshStandardMaterial {...accent} />
          </mesh>
        </>
      )}

      {/* ROOK */}
      {type === "r" && (
        <>
          <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
            <latheGeometry args={[[
              new THREE.Vector2(0.2, 0),
              new THREE.Vector2(0.27, 0.08),
              new THREE.Vector2(0.22, 0.2),
              new THREE.Vector2(0.27, 0.27),
              new THREE.Vector2(0.23, 0.62),
              new THREE.Vector2(0.31, 0.69),
            ], 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={[0, 0.84, 0]}>
            <cylinderGeometry args={[0.34, 0.3, 0.16, 12]} />
            <meshStandardMaterial {...accent} />
          </mesh>
          {[-0.21, 0, 0.21].map((dx) => (
            <mesh key={dx} castShadow position={[dx, 0.98, 0]}>
              <boxGeometry args={[0.13, 0.19, 0.25]} />
              <meshStandardMaterial {...material} />
            </mesh>
          ))}
          {[-0.21, 0, 0.21].map((dz) => (
            <mesh key={dz} castShadow position={[0, 0.98, dz]}>
              <boxGeometry args={[0.25, 0.19, 0.13]} />
              <meshStandardMaterial {...material} />
            </mesh>
          ))}
        </>
      )}

      {/* KNIGHT — 말 머리 실루엣을 단순화한 형태 */}
      {type === "n" && (
        <>
          <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
            <latheGeometry args={[[
              new THREE.Vector2(0.18, 0),
              new THREE.Vector2(0.29, 0.1),
              new THREE.Vector2(0.23, 0.22),
              new THREE.Vector2(0.25, 0.58),
              new THREE.Vector2(0.31, 0.66),
            ], 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={[0, 0.86, 0]} rotation={[0, 0, -0.18]}>
            <coneGeometry args={[0.28, 0.5, 6]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={[0.01, 1.08, 0.07]} rotation={[0.35, 0, -0.12]}>
            <boxGeometry args={[0.18, 0.34, 0.48]} />
            <meshStandardMaterial {...accent} />
          </mesh>
          <mesh castShadow position={[0.01, 1.23, 0.14]}>
            <coneGeometry args={[0.11, 0.23, 5]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0.045, 1.13, 0.285]}>
            <sphereGeometry args={[0.035, 16, 12]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        </>
      )}

      {/* BISHOP */}
      {type === "b" && (
        <>
          <mesh castShadow receiveShadow position={[0, 0.49, 0]}>
            <latheGeometry args={[[
              new THREE.Vector2(0.17, 0),
              new THREE.Vector2(0.28, 0.12),
              new THREE.Vector2(0.21, 0.25),
              new THREE.Vector2(0.18, 0.55),
              new THREE.Vector2(0.27, 0.7),
            ], 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.17, 28, 18]} />
            <meshStandardMaterial {...accent} />
          </mesh>
          <mesh castShadow position={[0, 0.95, 0]} rotation={[0.2, 0, 0.2]}>
            <boxGeometry args={[0.065, 0.4, 0.09]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh castShadow position={[0, 1.08, 0]}>
            <torusGeometry args={[0.16, 0.025, 10, 28]} />
            <meshStandardMaterial {...accent} />
          </mesh>
        </>
      )}

      {/* QUEEN */}
      {type === "q" && (
        <>
          <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
            <latheGeometry args={[[
              new THREE.Vector2(0.18, 0),
              new THREE.Vector2(0.3, 0.12),
              new THREE.Vector2(0.22, 0.29),
              new THREE.Vector2(0.2, 0.58),
              new THREE.Vector2(0.3, 0.72),
            ], 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={[0, 0.93, 0]}>
            <cylinderGeometry args={[0.28, 0.3, 0.14, 40]} />
            <meshStandardMaterial {...accent} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh
                key={i}
                castShadow
                position={[Math.cos(a) * 0.18, 1.09, Math.sin(a) * 0.18]}
              >
                <sphereGeometry args={[0.085, 20, 14]} />
                <meshStandardMaterial {...gold} />
              </mesh>
            );
          })}
          <mesh castShadow position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.13, 24, 18]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        </>
      )}

      {/* KING */}
      {type === "k" && (
        <>
          <mesh castShadow receiveShadow position={[0, 0.51, 0]}>
            <latheGeometry args={[[
              new THREE.Vector2(0.19, 0),
              new THREE.Vector2(0.32, 0.13),
              new THREE.Vector2(0.24, 0.31),
              new THREE.Vector2(0.22, 0.6),
              new THREE.Vector2(0.31, 0.73),
            ], 40]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={[0, 0.91, 0]}>
            <cylinderGeometry args={[0.28, 0.31, 0.16, 40]} />
            <meshStandardMaterial {...accent} />
          </mesh>
          <mesh castShadow position={[0, 1.14, 0]}>
            <boxGeometry args={[0.13, 0.45, 0.13]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh castShadow position={[0, 1.14, 0]}>
            <boxGeometry args={[0.44, 0.13, 0.13]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh castShadow position={[0, 1.38, 0]}>
            <sphereGeometry args={[0.065, 20, 14]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        </>
      )}
    </group>
  );
}
function hasAugment(state: AugmentGameState | undefined, id: AugmentId) {
  return Boolean(state?.ownedAugments.includes(id));
}

function oppositeColor(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function squareFile(square: Square) {
  return files.indexOf(square[0]);
}

function squareRank(square: Square) {
  return Number(square[1]);
}

function makeSniperCapture(game: Chess, targetSquare: Square, attackerColor: Color): Chess | null {
  const target = game.get(targetSquare);
  if (!target || target.type !== "p" || target.color === attackerColor) return null;

  const next = new Chess(game.fen());
  next.remove(targetSquare);
  const fen = next.fen().split(" ");
  fen[1] = oppositeColor(attackerColor);
  fen[3] = "-";
  fen[4] = "0";
  if (attackerColor === "b") fen[5] = String(Number(fen[5]) + 1);

  try {
    const result = new Chess(fen.join(" "));
    let kingSquare: Square | null = null;
    const board = result.board();
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board[row][col];
        if (piece?.type === "k" && piece.color === attackerColor) {
          kingSquare = `${files[col]}${8 - row}` as Square;
        }
      }
    }
    if (!kingSquare || result.isAttacked(kingSquare, oppositeColor(attackerColor))) return null;
    return result;
  } catch {
    return null;
  }
}

function makeCustomMove(game: Chess, from: Square, to: Square, promotion?: PromotionPiece) {
  const movingPiece = game.get(from);
  if (!movingPiece) return null;
  const target = game.get(to);
  if (target?.color === movingPiece.color) return null;

  const next = new Chess(game.fen());
  next.remove(from);
  if (target) next.remove(to);
  if (!next.put({ type: promotion ?? movingPiece.type, color: movingPiece.color }, to)) return null;

  const fen = next.fen().split(" ");
  fen[1] = oppositeColor(movingPiece.color);
  fen[3] = "-";
  fen[4] = "0";
  if (movingPiece.color === "b") {
    fen[5] = String(Number(fen[5]) + 1);
  }

  try {
    const result = new Chess(fen.join(" "));
    let kingSquare: Square | null = null;
    const board = result.board();
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board[row][col];
        if (piece?.type === "k" && piece.color === movingPiece.color) {
          kingSquare = `${files[col]}${8 - row}` as Square;
        }
      }
    }
    if (!kingSquare || result.isAttacked(kingSquare, oppositeColor(movingPiece.color))) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

function makePawnExplosion(game: Chess, center: Square) {
  const target = game.get(center);
  if (!target || target.type !== "p") return { game, lostColors: [] as Color[] };

  const next = new Chess(game.fen());
  const lostColors: Color[] = [];
  const file = squareFile(center);
  const rank = squareRank(center);

  for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const fileIndex = file + df;
    const targetRank = rank + dr;
    if (fileIndex < 0 || fileIndex > 7 || targetRank < 1 || targetRank > 8) continue;
    const square = `${files[fileIndex]}${targetRank}` as Square;
    const piece = next.get(square);
    if (!piece || piece.type === "k") continue;
    lostColors.push(piece.color);
    next.remove(square);
  }

  return { game: next, lostColors };
}

function Board({ game, selected, legalMoves, onSquare, lastMove, captureSquare, augmentGlowSquares }: {
  game: Chess;
  selected: Square | null;
  legalMoves: { to: Square; captured?: PieceSymbol; flags: string }[];
  onSquare: (square: Square) => void;
  lastMove: { from: Square; to: Square } | null;
  captureSquare?: Square | null;
  augmentGlowSquares?: Set<Square>;
}) {
  const pieces = useMemo(() => {
    const result: { square: Square; type: PieceSymbol; color: Color }[] = [];
    const board = game.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) result.push({ square: `${files[col]}${8-row}` as Square, type: piece.type, color: piece.color });
      }
    }
    return result;
  }, [game]);

  return (
    <group rotation={[0, 0, 0]}>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[8.9, 0.38, 8.9]} />
        <meshStandardMaterial color="#090807" roughness={0.24} metalness={0.32} />
      </mesh>
      <mesh position={[0, -0.005, 0]} receiveShadow>
        <boxGeometry args={[8.48, 0.07, 8.48]} />
        <meshStandardMaterial color="#c7b08a" roughness={0.3} metalness={0.08} />
      </mesh>
      {Array.from({ length: 64 }, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const light = (col + row) % 2 === 0;
        return (
          <mesh key={`floor-${i}`} position={[col - 3.5, 0.015, 3.5 - row]} receiveShadow>
            <boxGeometry args={[0.98, 0.025, 0.98]} />
            <meshStandardMaterial
              color={light ? "#e6d1a8" : "#51331f"}
              roughness={0.3}
              metalness={0.06}
            />
          </mesh>
        );
      })}

      {Array.from({ length: 64 }, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const square = `${files[col]}${8-row}` as Square;
        const light = (col + row) % 2 === 0;
        const isSelected = square === selected;
        const isLastMove = lastMove?.from === square || lastMove?.to === square;
        const boardPiece = game.get(square);
        const isCheckedKing =
          Boolean(boardPiece && boardPiece.type === "k" && boardPiece.color === game.turn() && game.isCheck());
        const legalMove = legalMoves.find((move) => move.to === square);
        const isLegal = Boolean(legalMove);
        // 캡처 표시는 chess.js의 실제 이동 플래그만 사용한다.
        // captured 값만 믿으면 빈 대각선 칸이 캡처처럼 표시되는 상황을 방지할 수 없다.
        const isCapture = Boolean(
          legalMove &&
          (
            legalMove.flags.includes("c") ||
            legalMove.flags.includes("e") ||
            (legalMove.flags === "a" && Boolean(boardPiece))
          )
        );
        return (
          <group key={square} position={[col - 3.5, 0, 3.5-row]}>
            <mesh receiveShadow onClick={(e) => { e.stopPropagation(); onSquare(square); }}>
              <boxGeometry args={[0.98, 0.18, 0.98]} />
              <meshStandardMaterial
                color={
                  isCheckedKing
                    ? "#9d3535"
                    : isSelected
                      ? "#c9a227"
                      : isLastMove
                        ? "#9c7b3e"
                        : light
                          ? "#e8d0a8"
                          : "#765033"
                }
                roughness={0.28}
                metalness={0.08}
              />
            </mesh>
            {isCheckedKing && (
              <mesh raycast={() => null} position={[0, 0.125, 0]}>
                <torusGeometry args={[0.34, 0.055, 12, 40]} />
                <meshBasicMaterial color="#ff5d5d" transparent opacity={0.82} />
              </mesh>
            )}
            {isSelected && (
              <mesh raycast={() => null} position={[0, 0.13, 0]}>
                <torusGeometry args={[0.4, 0.035, 12, 40]} />
                <meshBasicMaterial color="#ffe08a" transparent opacity={0.9} />
              </mesh>
            )}
            {isLegal && !isCapture && (
              <mesh raycast={() => null} position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
                <meshBasicMaterial color="#48d597" />
              </mesh>
            )}
            {isLegal && legalMove?.flags === "g" && (
              <mesh raycast={() => null} position={[0, 0.14, 0]}>
                <torusGeometry args={[0.31, 0.055, 12, 32]} />
                <meshBasicMaterial color="#ffd45a" />
              </mesh>
            )}
            {isCapture && legalMove?.flags !== "g" && (
              <mesh raycast={() => null} position={[0, 0.13, 0]}>
                <torusGeometry args={[0.29, 0.045, 12, 32]} />
                <meshBasicMaterial color="#e85b5b" />
              </mesh>
            )}
          </group>
        );
      })}

      {captureSquare && (
        <mesh
          raycast={() => null}
          position={[
            squarePosition(captureSquare)[0],
            0.16,
            squarePosition(captureSquare)[2],
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.2, 0.42, 40]} />
          <meshBasicMaterial color="#ffb24a" transparent opacity={0.8} />
        </mesh>
      )}

      {pieces.map((piece) => (
        <Piece
          key={piece.square}
          {...piece}
          selected={piece.square === selected}
          augmentGlow={augmentGlowSquares?.has(piece.square)}
          animateFrom={lastMove?.to === piece.square ? lastMove.from : undefined}
          onClick={() => onSquare(piece.square)}
        />
      ))}
    </group>
  );
}

export default function ChessGame({ onBackToMenu, onlineSocket, onlineRoomId, onlinePlayerColor, onPieceCaptured, augmentMode, augmentState, augmentSelection, onChooseAugment, onRerollAugment }: { onBackToMenu?: () => void; onlineSocket?: Socket | null; onlineRoomId?: string; onlinePlayerColor?: "w" | "b"; onPieceCaptured?: (color: "w" | "b") => void; augmentMode?: boolean; augmentState?: AugmentGameState; augmentSelection?: AugmentSelection | null; onChooseAugment?: (id: AugmentId) => void; onRerollAugment?: (optionIndex: number) => void }) {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [captureSquare, setCaptureSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [g001Uses, setG001Uses] = useState(2);
  const [s004Used, setS004Used] = useState(false);
  const [s006Boost, setS006Boost] = useState<{ w: boolean; b: boolean }>({ w: false, b: false });
  const [s005Used, setS005Used] = useState<{ w: boolean; b: boolean }>({ w: false, b: false });
  const [t001Used, setT001Used] = useState<{ w: boolean; b: boolean }>({ w: false, b: false });
  const p002AppliedRef = useRef(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiLevel, setAiLevel] = useState<AiLevel>("intermediate");
  const [aiThinking, setAiThinking] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("CONNECTED");
  const [onlineGameOver, setOnlineGameOver] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const stockfishRef = useRef<Worker | null>(null);
  const engineReadyRef = useRef(false);
  const aiSearchIdRef = useRef(0);
  const augmentSelectionRef = useRef(augmentSelection);
  augmentSelectionRef.current = augmentSelection;

  useEffect(() => {
    if (!augmentMode || !augmentState || !hasAugment(augmentState, "P002") || p002AppliedRef.current) return;
    p002AppliedRef.current = true;
    setGame((current) => {
      const next = new Chess(current.fen());
      for (const square of (["c1","f1","c8","f8"] as Square[])) {
        const bishop = next.get(square);
        if (!bishop || bishop.type !== "b") continue;
        const file = squareFile(square);
        const rank = squareRank(square);
        for (const [df, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const fi = file + df;
          const ri = rank + dr;
          if (fi < 0 || fi > 7 || ri < 1 || ri > 8) continue;
          const target = `${files[fi]}${ri}` as Square;
          if (!next.get(target)) next.put({ type: "p", color: bishop.color }, target);
        }
      }
      return next;
    });
  }, [augmentMode, augmentState]);

  useEffect(() => {
    if (onlineSocket) return;
    const worker = new Worker("/stockfish.wasm.js");
    stockfishRef.current = worker;
    worker.onmessage = (event) => {
      const line = String(event.data ?? "");
      if (line === "uciok") {
        engineReadyRef.current = true;
        setEngineReady(true);
        worker.postMessage("isready");
        return;
      }
      if (!line.startsWith("bestmove")) return;
      const match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
      const searchId = aiSearchIdRef.current;
      if (!match) {
        setAiThinking(false);
        return;
      }
      if (augmentSelectionRef.current && !augmentSelectionRef.current.selected) {
        setAiThinking(false);
        return;
      }
      const from = match[1] as Square;
      const to = match[2] as Square;
      const promotion = (match[3] as PromotionPiece | undefined) ?? undefined;
      setGame((current) => {
        if (current.turn() !== "b") return current;
        const nextGame = new Chess(current.fen());
        try {
          nextGame.move({ from, to, promotion: promotion ?? "q" });
          return nextGame;
        } catch {
          return current;
        }
      });
      const moveObject = game.moves({ square: from, verbose: true }).find((move: { to: Square; flags: string }) => move.to === to);
      const captured = Boolean(moveObject && (moveObject.flags.includes("c") || moveObject.flags.includes("e")));
      setLastMove({ from, to });
      setCaptureSquare(captured ? to : null);
      if (captured) onPieceCaptured?.("w");
      if (searchId === aiSearchIdRef.current) setAiThinking(false);
    };
    worker.postMessage("uci");
    return () => {
      aiSearchIdRef.current += 1;
      worker.terminate();
      stockfishRef.current = null;
      engineReadyRef.current = false;
      setEngineReady(false);
    };
  }, [onlineSocket]);

  useEffect(() => {
    if (onlineSocket) return;
    if (!aiEnabled || game.turn() !== "b" || game.isGameOver() || pendingPromotion || !engineReady) return;
    if (augmentSelection && !augmentSelection.selected) return;
    const worker = stockfishRef.current;
    if (!worker) return;
    const level = AI_LEVELS[aiLevel];
    const searchId = ++aiSearchIdRef.current;
    setAiThinking(true);
    worker.postMessage("stop");
    worker.postMessage("ucinewgame");
    worker.postMessage(`setoption name Skill Level value ${level.skill}`);
    worker.postMessage(`position fen ${game.fen()}`);
    worker.postMessage(`go depth ${level.depth}`);
    return () => {
      if (searchId === aiSearchIdRef.current) worker.postMessage("stop");
    };
  }, [aiEnabled, aiLevel, game, pendingPromotion, engineReady, onlineSocket, augmentSelection]);

  useEffect(() => {
    if (!onlineSocket) return;
    const onOpponentMove = ({ fen, from, to, captured }: { fen: string; from?: Square; to?: Square; captured?: boolean }) => {
      setGame(new Chess(fen));
      setSelected(null);
      setLastMove(from && to ? { from, to } : null);
      setCaptureSquare(null);
      setPendingPromotion(null);
      if (captured) onPieceCaptured?.(onlinePlayerColor === "w" ? "w" : "b");
      setOnlineGameOver(new Chess(fen).isGameOver());
    };
    const onGameReset = ({ fen }: { fen: string }) => {
      setGame(new Chess(fen));
      setSelected(null);
      setLastMove(null);
      setCaptureSquare(null);
      setPendingPromotion(null);
      setOnlineGameOver(false);
    };
    const onOpponentDisconnected = () => {
      setOnlineStatus("OPPONENT LEFT");
      setOnlineGameOver(true);
      setSelected(null);
      setPendingPromotion(null);
    };
    onlineSocket.on("opponent-move", onOpponentMove);
    onlineSocket.on("game-reset", onGameReset);
    onlineSocket.on("opponent-disconnected", onOpponentDisconnected);
    setOnlineStatus("CONNECTED");
    return () => {
      onlineSocket.off("opponent-move", onOpponentMove);
      onlineSocket.off("game-reset", onGameReset);
      onlineSocket.off("opponent-disconnected", onOpponentDisconnected);
    };
  }, [onlineSocket, onPieceCaptured, onlinePlayerColor]);

  const legalMoveObjects = useMemo(() => {
    if (!selected) return [];
    try {
      const baseMoves = game.moves({ square: selected, verbose: true });
      if (!augmentMode || !augmentState) return baseMoves;

      const piece = game.get(selected);
      if (!piece) return baseMoves;

      const extraTargets: Square[] = [];
      const fromFile = squareFile(selected);
      const fromRank = squareRank(selected);
      const direction = piece.color === "w" ? 1 : -1;

      if (piece.type === "p") {
        const forward2 = fromRank + direction * 2;
        const forward3 = fromRank + direction * 3;
        const one = `${files[fromFile]}${fromRank + direction}` as Square;
        const two = `${files[fromFile]}${forward2}` as Square;
        const three = `${files[fromFile]}${forward3}` as Square;

        if (
          hasAugment(augmentState, "S001") &&
          forward2 >= 1 && forward2 <= 8 &&
          !game.get(one) && !game.get(two)
        ) {
          extraTargets.push(two);
        }

        if (
          hasAugment(augmentState, "S004") &&
          !s004Used &&
          forward3 >= 1 && forward3 <= 8 &&
          !game.get(one) && !game.get(two) && !game.get(three) &&
          makeCustomMove(game, selected, three)
        ) {
          extraTargets.push(three);
        }

        if (
          hasAugment(augmentState, "S003") &&
          game.get(one)?.type === "p" &&
          game.get(one)?.color === piece.color &&
          forward2 >= 1 && forward2 <= 8 &&
          !game.get(two)
        ) {
          extraTargets.push(two);
        }
      }

      if (piece.type === "n" && hasAugment(augmentState, "S002")) {
        const forward = fromRank + direction;
        if (forward >= 1 && forward <= 8) {
          const target = `${files[fromFile]}${forward}` as Square;
          if (game.get(target)?.color !== piece.color) {
            extraTargets.push(target);
          }
        }
      }

      if (piece.type === "p" && hasAugment(augmentState, "S003")) {
        const forward = fromRank + direction;
        const landingRank = fromRank + direction * 2;
        const one = `${files[fromFile]}${forward}` as Square;
        const landing = `${files[fromFile]}${landingRank}` as Square;
        if (forward >= 1 && forward <= 8 && landingRank >= 1 && landingRank <= 8 && game.get(one)?.type === "p" && game.get(one)?.color === piece.color && !game.get(landing)) {
          extraTargets.push(landing);
        }
      }

      const g002KnightTargets: Square[] = [];
      if (piece.type === "n" && hasAugment(augmentState, "G002")) {
        const knightCount = game.board().flat().filter((item) => item?.type === "n" && item.color === piece.color).length;
        if (knightCount === 1) {
          for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            let fileIndex = fromFile + df;
            let rank = fromRank + dr;
            while (fileIndex >= 0 && fileIndex < 8 && rank >= 1 && rank <= 8) {
              const targetSquare = `${files[fileIndex]}${rank}` as Square;
              const target = game.get(targetSquare);
              if (target) {
                if (target.color !== piece.color) g002KnightTargets.push(targetSquare);
                break;
              }
              g002KnightTargets.push(targetSquare);
              fileIndex += df;
              rank += dr;
            }
          }
        }
      }

      const sniperTargets: Square[] = [];
      if (piece.type === "b" && hasAugment(augmentState, "G001")) {
        for (const [df, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          let fileIndex = fromFile + df;
          let rank = fromRank + dr;
          while (fileIndex >= 0 && fileIndex < 8 && rank >= 1 && rank <= 8) {
            const target = game.get(`${files[fileIndex]}${rank}` as Square);
            if (target) {
              if (target.color !== piece.color && target.type === "p") {
                sniperTargets.push(`${files[fileIndex]}${rank}` as Square);
              }
              break;
            }
            fileIndex += df;
            rank += dr;
          }
        }
      }

      const s005Active = piece.type === "n" && hasAugment(augmentState, "S005") && !s005Used[piece.color];
      const t001Active = piece.type === "p" && hasAugment(augmentState, "T001") && !t001Used[piece.color];

      const rookTargets: Square[] = [];
      const kingTargets: Square[] = [];
      if (piece.type === "k" && hasAugment(augmentState, "P005")) {
        for (const [df, dr] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]) {
          const fi = fromFile + df, ri = fromRank + dr;
          if (fi < 0 || fi > 7 || ri < 1 || ri > 8) continue;
          const target = `${files[fi]}${ri}` as Square;
          if (game.get(target)?.color !== piece.color) kingTargets.push(target);
        }
      }
      if (hasAugment(augmentState, "G005") && piece.type !== "r") {
        const rooks = game.board().flatMap((row, rowIndex) => row.map((item, colIndex) =>
          item?.type === "r" && item.color === piece.color ? `${files[colIndex]}${8-rowIndex}` as Square : null
        )).filter(Boolean) as Square[];
        const inRookRange = rooks.some((rook) => rook[0] === selected[0] || rook[1] === selected[1]);
        if (inRookRange) {
          for (const [df, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            let fi = fromFile + df;
            let ri = fromRank + dr;
            while (fi >= 0 && fi < 8 && ri >= 1 && ri <= 8) {
              const target = `${files[fi]}${ri}` as Square;
              const occupant = game.get(target);
              if (occupant) {
                if (occupant.color !== piece.color) rookTargets.push(target);
                break;
              }
              rookTargets.push(target);
              fi += df;
              ri += dr;
            }
          }
        }
      }

      if (piece.type === "k" && hasAugment(augmentState, "T005")) {
        for (const [df, dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
          let fi = fromFile + df;
          let ri = fromRank + dr;
          while (fi >= 0 && fi < 8 && ri >= 1 && ri <= 8) {
            const target = `${files[fi]}${ri}` as Square;
            const occupant = game.get(target);
            if (occupant) {
              if (occupant.color !== piece.color) kingTargets.push(target);
              break;
            }
            kingTargets.push(target);
            fi += df;
            ri += dr;
          }
        }
      }

      const s006Targets: Square[] = [];
      if (hasAugment(augmentState, "S006") && s006Boost[piece.color] && piece.type !== "n" && piece.type !== "p") {
        const directions =
          piece.type === "r"
            ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
            : piece.type === "b"
              ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
              : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [df, dr] of directions) {
          let fileIndex = fromFile + df;
          let rank = fromRank + dr;
          let lastEmpty: Square | null = null;
          while (fileIndex >= 0 && fileIndex < 8 && rank >= 1 && rank <= 8) {
            const targetSquare = `${files[fileIndex]}${rank}` as Square;
            const target = game.get(targetSquare);
            if (target) {
              if (target.color !== piece.color) lastEmpty = targetSquare;
              break;
            }
            lastEmpty = targetSquare;
            fileIndex += df;
            rank += dr;
          }
          if (lastEmpty) {
            const beyondFile = fileIndex;
            const beyondRank = rank;
            if (beyondFile >= 0 && beyondFile < 8 && beyondRank >= 1 && beyondRank <= 8) {
              const beyond = game.get(`${files[beyondFile]}${beyondRank}` as Square);
              if (!beyond) s006Targets.push(lastEmpty);
            }
          }
        }
      }

      const filteredBaseMoves = hasAugment(augmentState, "G005") && piece.type === "r" ? [] : baseMoves;
      const augmentedBaseMoves = filteredBaseMoves.map((move) => t001Active ? { ...move, flags: "t" } : s005Active ? { ...move, flags: "s" } : move);

      return [
        ...augmentedBaseMoves,
        ...extraTargets
          .filter((to, index, list) => list.indexOf(to) === index && !baseMoves.some((move) => move.to === to))
          .map((to) => ({
            color: piece.color,
            from: selected,
            to,
            piece: piece.type,
            captured: game.get(to)?.type,
            flags: "a",
            san: "",
          })),
        ...g002KnightTargets
          .filter((to) => {
            if (baseMoves.some((move) => move.to === to) || extraTargets.includes(to)) return false;
            const candidate = makeCustomMove(game, selected, to);
            return Boolean(candidate);
          })
          .map((to) => ({
            color: piece.color,
            from: selected,
            to,
            piece: piece.type,
            captured: game.get(to)?.type,
            flags: "a",
            san: "",
          })),
        ...rookTargets
          .filter((to) => !baseMoves.some((move) => move.to === to) && !extraTargets.includes(to))
          .map((to) => ({ color: piece.color, from: selected, to, piece: piece.type, captured: game.get(to)?.type, flags: "a", san: "" })),
        ...kingTargets
          .filter((to) => !baseMoves.some((move) => move.to === to) && !extraTargets.includes(to))
          .map((to) => ({ color: piece.color, from: selected, to, piece: piece.type, captured: game.get(to)?.type, flags: "a", san: "" })),
        ...s006Targets
          .filter((to) => !baseMoves.some((move) => move.to === to) && !extraTargets.includes(to) && !g002KnightTargets.includes(to) && !sniperTargets.includes(to))
          .map((to) => ({
            color: piece.color,
            from: selected,
            to,
            piece: piece.type,
            captured: game.get(to)?.type,
            flags: "a",
            san: "",
          })),
        ...sniperTargets
          .filter((to) => !baseMoves.some((move) => move.to === to) && !extraTargets.includes(to) && !g002KnightTargets.includes(to))
          .map((to) => ({
            color: piece.color,
            from: selected,
            to,
            piece: piece.type,
            captured: "p" as PieceSymbol,
            flags: "g",
            san: "",
          })),
      ];
    } catch {
      return [];
    }
  }, [game, selected, augmentMode, augmentState, s004Used, s005Used, s006Boost, g004Barrier, t002Shields]);

  const effectiveLegalMoveObjects = legalMoveObjects.filter(
    (move) => move.flags !== "g" || g001Uses > 0,
  );

  const legalMoves = effectiveLegalMoveObjects.map((move) => ({
    to: move.to,
    captured: move.captured,
    flags: move.flags,
  }));

  const moveHistory = game.history();
  const movePairs = Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, index) => ({
    number: index + 1,
    white: moveHistory[index * 2],
    black: moveHistory[index * 2 + 1],
  }));
  const turn = game.turn() === "w" ? "WHITE" : "BLACK";
  const moveNumber = Math.floor(game.history().length / 2) + 1;
  const isCheck = game.isCheck() && !game.isGameOver();
  const p005QueenGone = augmentMode && augmentState
    ? (hasAugment(augmentState, "P005") && !game.board().flat().some((item) => item?.type === "q" && item.color === (onlinePlayerColor ?? "w")))
      || (hasAugment(augmentState, "P005") && !game.board().flat().some((item) => item?.type === "q" && item.color === (onlinePlayerColor ?? "b")))
    : false;
  const g006Draw = augmentMode && augmentState
    ? hasAugment(augmentState, "G006") && !game.board().flat().some((item) => item && item.type !== "k" && item.color === (onlinePlayerColor ?? game.turn()))
    : false;
  const isGameOver = game.isGameOver() || onlineGameOver || p005QueenGone || g006Draw;
  const whitePlayerLabel = onlineSocket
    ? onlinePlayerColor === "w" ? "YOU" : "OPPONENT"
    : "PLAYER 1";
  const blackPlayerLabel = onlineSocket
    ? onlinePlayerColor === "b" ? "YOU" : "OPPONENT"
    : aiEnabled ? "STOCKFISH" : "PLAYER 2";
  const resultTitle = onlineStatus === "OPPONENT LEFT"
    ? "OPPONENT LEFT"
    : game.isCheckmate()
      ? `${game.turn() === "w" ? "BLACK" : "WHITE"} WINS`
      : game.isStalemate()
        ? "STALEMATE"
        : "DRAW";
  const resultSubtitle = onlineStatus === "OPPONENT LEFT"
    ? "The opponent disconnected from the match."
    : game.isCheckmate()
      ? "CHECKMATE"
      : game.isStalemate()
        ? "No legal moves remain."
        : "The game ended without a winner.";
  const status = game.isCheckmate()
    ? `${turn === "WHITE" ? "BLACK" : "WHITE"} CHECKMATES`
    : game.isStalemate()
      ? "STALEMATE"
      : game.isDraw()
        ? "DRAW"
        : game.isCheck()
          ? `${turn} IN CHECK`
          : `${turn} TO MOVE`;

  function handleSquare(square: Square) {
    if (augmentSelection && !augmentSelection.selected) return;
    if (aiThinking || pendingPromotion || onlineGameOver) return;
    if (onlineSocket && game.turn() !== onlinePlayerColor) return;
    const piece = game.get(square as any);

    if (selected && legalMoves.some((move) => move.to === square)) {
      const nextGame = new Chess(game.fen());
      try {
        const movingPiece = game.get(selected as any);
        const targetRank = square[1];
        if (movingPiece?.type === "p" && (targetRank === "1" || targetRank === "8")) {
          setPendingPromotion({ from: selected, to: square });
          return;
        }
        const moveObject = effectiveLegalMoveObjects.find((move) => move.to === square);
        const isSniperMove = Boolean(moveObject && moveObject.flags === "g");
        if (isSniperMove) {
          if (g001Uses <= 0) {
            setSelected(null);
            return;
          }
          const customGame = makeSniperCapture(game, square, movingPiece?.color ?? game.turn());
          if (!customGame) {
            setSelected(null);
            return;
          }
          setGame(customGame);
          setG001Uses((uses) => Math.max(0, uses - 1));
          onPieceCaptured?.(oppositeColor(movingPiece?.color ?? game.turn()));
          setLastMove({ from: selected, to: selected });
          setCaptureSquare(square);
          if (onlineSocket && onlineRoomId) onlineSocket.emit("move", { roomId: onlineRoomId, from: selected, to: square, custom: true, augment: "G001" });
          setSelected(null);
          return;
        }
        const isT001Move = Boolean(moveObject && moveObject.flags === "t");
        if (isT001Move) {
          if (!movingPiece || movingPiece.type !== "p" || !augmentState || !hasAugment(augmentState, "T001") || t001Used[movingPiece.color]) {
            setSelected(null);
            return;
          }
          const customGame = makeCustomMove(game, selected, square);
          if (!customGame) {
            setSelected(null);
            return;
          }
          const customFen = customGame.fen().split(" ");
          customFen[1] = movingPiece.color;
          const sameTurnGame = new Chess(customFen.join(" "));
          setGame(sameTurnGame);
          setLastMove({ from: selected, to: square });
          setCaptureSquare(game.get(square) ? square : null);
          setT001Used((current) => ({ ...current, [movingPiece.color]: true }));
          if (game.get(square)) onPieceCaptured?.(oppositeColor(movingPiece.color));
          setSelected(null);
          return;
        }

        const isS005Move = Boolean(moveObject && moveObject.flags === "s");
        if (isS005Move) {
          if (!movingPiece || movingPiece.type !== "n" || !augmentState || !hasAugment(augmentState, "S005") || s005Used[movingPiece.color]) {
            setSelected(null);
            return;
          }
          const customGame = makeCustomMove(game, selected, square);
          if (!customGame) {
            setSelected(null);
            return;
          }
          const customFen = customGame.fen().split(" ");
          customFen[1] = movingPiece.color;
          const sameTurnGame = new Chess(customFen.join(" "));
          setGame(sameTurnGame);
          setLastMove({ from: selected, to: square });
          setCaptureSquare(game.get(square) ? square : null);
          setS005Used((current) => ({ ...current, [movingPiece.color]: true }));
          if (onlineSocket && onlineRoomId) {
            onlineSocket.emit(
              "move",
              { roomId: onlineRoomId, from: selected, to: square, custom: true, augment: "S005" },
              (result: { ok?: boolean; error?: string }) => {
                if (!result?.ok) {
                  setGame(game);
                  setLastMove(null);
                  setCaptureSquare(null);
                  setS005Used((current) => ({ ...current, [movingPiece.color]: false }));
                  return;
                }
                if (game.get(square)) onPieceCaptured?.(oppositeColor(movingPiece.color));
              },
            );
          } else if (game.get(square)) {
            onPieceCaptured?.(oppositeColor(movingPiece.color));
          }
          setSelected(null);
          return;
        }
        const isCustomAugmentMove = Boolean(moveObject && moveObject.flags === "a");
        if (isCustomAugmentMove) {
          const deltaRank = Number(square[1]) - Number(selected[1]);
          const absFile = Math.abs(square.charCodeAt(0) - selected.charCodeAt(0));
          const absRank = Math.abs(deltaRank);
          let customAugment: AugmentId | null = null;

          if (movingPiece?.type === "p") {
            if (absRank === 3 && hasAugment(augmentState!, "S004") && !s004Used) {
              customAugment = "S004";
            } else if (
              absRank === 2 &&
              square[0] === selected[0] &&
              game.get(`${selected[0]}${Number(selected[1]) + (movingPiece.color === "w" ? 1 : -1)}` as Square)
            ) {
              customAugment = "S003";
            } else if (absRank === 2 && square[0] === selected[0]) {
              customAugment = "S001";
            }
          } else if (movingPiece?.type === "n") {
            const knightCount = game.board().flat().filter((item) => item?.type === "n" && item.color === movingPiece.color).length;
            if (absFile === 0 && absRank === 1) {
              customAugment = "S002";
            } else if (knightCount === 1 && ((absFile === 0 && absRank > 0) || (absRank === 0 && absFile > 0) || absFile === absRank)) {
              customAugment = "G002";
            }
          } else if (movingPiece?.type === "k" && hasAugment(augmentState, "P005")) {
            customAugment = "P005";
          } else if (movingPiece?.type === "k" && hasAugment(augmentState, "T005")) {
            customAugment = "T005";
          } else if (hasAugment(augmentState, "G005")) {
            customAugment = "G005";
          }

          if (!customAugment || !augmentState || !hasAugment(augmentState, customAugment)) {
            setSelected(null);
            return;
          }

          const customGame = makeCustomMove(game, selected, square);
          if (!customGame) {
            setSelected(null);
            return;
          }

          const captured = Boolean(game.get(square));
          setGame(customGame);
          setLastMove({ from: selected, to: square });
          setCaptureSquare(captured ? square : null);
          if (customAugment === "S004") setS004Used(true);

          if (onlineSocket && onlineRoomId) {
            onlineSocket.emit(
              "move",
              { roomId: onlineRoomId, from: selected, to: square, custom: true, augment: customAugment },
              (result: { ok?: boolean; error?: string }) => {
                if (!result?.ok) {
                  setGame(game);
                  setLastMove(null);
                  setCaptureSquare(null);
                  if (customAugment === "S004") setS004Used(false);
                  return;
                }
                if (captured) onPieceCaptured?.(oppositeColor(movingPiece?.color ?? game.turn()));
              },
            );
          } else if (captured) {
            onPieceCaptured?.(movingPiece?.color ?? game.turn());
          }

          setSelected(null);
          return;
        }
        nextGame.move({ from: selected, to: square });
        const captured = Boolean(moveObject && (moveObject.flags.includes("c") || moveObject.flags.includes("e")));
        let finalGame = nextGame;
        const capturedPiece = game.get(square);
        if (captured) {
          const lostColor = oppositeColor(movingPiece?.color ?? game.turn());
          onPieceCaptured?.(lostColor);
          if (hasAugment(augmentState, "S006")) {
            setS006Boost((current) => ({ ...current, [lostColor]: true }));
          }
          if (hasAugment(augmentState, "G003") && capturedPiece?.type === "p") {
            const explosion = makePawnExplosion(nextGame, square);
            finalGame = explosion.game;
            explosion.lostColors.forEach((color) => {
              onPieceCaptured?.(color);
              if (hasAugment(augmentState, "S006")) {
                setS006Boost((current) => ({ ...current, [color]: true }));
              }
            });
          }
        }
        setGame(finalGame);
        if (movingPiece?.color) {
          setT001Used((current) => ({ ...current, [movingPiece.color]: false }));
          setS005Used((current) => ({ ...current, [movingPiece.color]: false }));
          if (hasAugment(augmentState, "S006") && s006Boost[movingPiece.color]) {
            setS006Boost((current) => ({ ...current, [movingPiece.color]: false }));
          }
        }
        if (onlineSocket && onlineRoomId) onlineSocket.emit("move", { roomId: onlineRoomId, from: selected, to: square });
        setLastMove({ from: selected, to: square });
        setCaptureSquare(captured ? square : null);
        setSelected(null);
        return;
      } catch {
        setSelected(null);
        return;
      }
    }

    if (piece && piece.color === game.turn()) {
      setSelected(square);
    } else {
      setSelected(null);
    }
  }

  function promote(piece: PromotionPiece) {
    if (!pendingPromotion) return;
    const nextGame = new Chess(game.fen());
    try {
      const moveObject = effectiveLegalMoveObjects.find((move) => move.to === pendingPromotion.to);
      const captured = Boolean(moveObject && (moveObject.flags.includes("c") || moveObject.flags.includes("e")));
      const promotedGame = moveObject?.flags === "a"
        ? makeCustomMove(game, pendingPromotion.from, pendingPromotion.to, piece)
        : (() => {
            const standardGame = new Chess(game.fen());
            standardGame.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
            return standardGame;
          })();
      if (!promotedGame) {
        setPendingPromotion(null);
        setSelected(null);
        return;
      }
      setGame(promotedGame);
      if (captured) onPieceCaptured?.("w");
      if (onlineSocket && onlineRoomId) onlineSocket.emit("move", { roomId: onlineRoomId, from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      setLastMove({ from: pendingPromotion.from, to: pendingPromotion.to });
      setCaptureSquare(captured ? pendingPromotion.to : null);
      setPendingPromotion(null);
      setSelected(null);
    } catch {
      setPendingPromotion(null);
      setSelected(null);
    }
  }

  function reset() {
    if (onlineSocket && onlineRoomId) {
      onlineSocket.emit("new-game", { roomId: onlineRoomId });
    }
    aiSearchIdRef.current += 1;
    stockfishRef.current?.postMessage("stop");
    setAiThinking(false);
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
    setCaptureSquare(null);
    setPendingPromotion(null);
    setG001Uses(2);
    setS004Used(false);
    setS006Boost({ w: false, b: false });
    setT001Used({ w: false, b: false });
    setG004Barrier(null);
    setT002Shields({ w: [], b: [] });
    g004AppliedRef.current = false;
    t002AppliedRef.current = false;
    p002AppliedRef.current = false;
    setOnlineGameOver(false);
  }

  const g002Color = onlinePlayerColor ?? game.turn();
  const g002Active = Boolean(augmentMode && augmentState && hasAugment(augmentState, "G002") && game.board().flat().filter((item) => item?.type === "n" && item.color === g002Color).length === 1);
  const augmentGlowSquares = useMemo(() => {
    const result = new Set<Square>();
    if (g002Active) {
      const color = onlinePlayerColor ?? game.turn();
      const board = game.board();
      for (let row = 0; row < 8; row += 1) for (let col = 0; col < 8; col += 1) {
        const item = board[row][col];
        if (item?.type === "n" && item.color === color) result.add(String.fromCharCode(97 + col) + (8 - row) as Square);
      }
    }
    return result;
  }, [g002Active, game, onlinePlayerColor]);

  const augmentOwned = augmentState?.ownedAugments
    .map((id) => getAugmentDefinition(id))
    .filter(Boolean) ?? [];
  const g002ConditionActive = Boolean(
    augmentMode &&
    augmentState &&
    hasAugment(augmentState, "G002") &&
    game.board().flat().filter((item) => item?.type === "n" && item.color === (onlinePlayerColor ?? game.turn())).length === 1
  );
  const augmentPhase = augmentSelection?.phase ?? null;

  return (
    <main className={augmentMode ? "chess-app augment-chess-app" : "chess-app"}>
      {augmentMode ? (
        <div className="augment-gamebar">
          <button onClick={onBackToMenu}>← MENU</button>
          <div className="augment-gamebar-title">
            <span>AUGMENT CHESS</span>
            <b>{onlineSocket ? "ONLINE BATTLE" : "SOLO BATTLE"}</b>
          </div>
          <div className="augment-loss-counter">
            <span>PIECES LOST</span>
            <b>{augmentState?.piecesLost ?? 0} / 16</b>
          </div>
        </div>
      ) : null}

      <header className="chess-header">
        <div>
          <div className="eyebrow">{onlineSocket ? "ONLINE 1V1" : "3D CHESS"}</div>
          <h1>{onlineSocket ? `Room ${onlineRoomId ?? ""}` : "Classic Chess"}</h1>
        </div>
        <div className="status">
          <span className={game.turn() === "w" ? "turn-dot white" : "turn-dot black"} />
          {aiThinking ? "AI THINKING" : status}
        </div>
        <div className="header-actions"><button className="reset-button" onClick={onBackToMenu}>MENU</button><button className="reset-button" onClick={reset}>NEW GAME</button></div>
      </header>

      <section className="chess-layout">
        <div className="board-shell">
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 8.8, -9.6], fov: 40 }}>
            <color attach="background" args={["#0b0a09"]} />
            <ambientLight intensity={1.25} />
            <hemisphereLight args={["#fff7e8", "#24170e", 1.15]} />
            <directionalLight
              castShadow
              position={[4, 10, -5]}
              intensity={3.6}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.00015}
            />
            <Board
              game={game}
              selected={selected}
              legalMoves={legalMoves}
              lastMove={lastMove}
              captureSquare={captureSquare}
              augmentGlowSquares={augmentGlowSquares}
              onSquare={handleSquare}
            />
            <OrbitControls
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              minDistance={6.8}
              maxDistance={13}
              minPolarAngle={0.48}
              maxPolarAngle={1.3}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>

        <aside className="side-panel">
          <div className="panel-card">
            <div className="panel-label">{augmentMode ? "AUGMENT BATTLE" : onlineSocket ? "ONLINE MATCH" : "OPPONENT"}</div>
            {onlineSocket ? (
              <div className="game-status">
                YOU ARE {onlinePlayerColor === "w" ? "WHITE" : "BLACK"} · {onlineStatus}
              </div>
            ) : (
              <>
                <div className="ai-toggle-row">
                  <button className={`ai-choice ${aiEnabled ? "active" : ""}`} onClick={() => { setAiEnabled(true); setAiThinking(false); }}>VS AI</button>
                  <button className={`ai-choice ${!aiEnabled ? "active" : ""}`} onClick={() => { stockfishRef.current?.postMessage("stop"); setAiEnabled(false); setAiThinking(false); }}>2 PLAYER</button>
                </div>
                {aiEnabled && (
                  <div className="ai-levels">
                    {(Object.keys(AI_LEVELS) as AiLevel[]).map((level) => (
                      <button key={level} className={`ai-level ${aiLevel === level ? "active" : ""}`} onClick={() => setAiLevel(level)}>
                        {AI_LEVELS[level].label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="panel-card battle-card">
            <div className="battle-topline">
              <div className="panel-label">BATTLE INFO</div>
              <div className={isCheck ? "check-badge visible" : "check-badge"}>{isCheck ? "CHECK" : "CLEAR"}</div>
            </div>

            <div className="player-row">
              <div className={game.turn() === "w" ? "player-side active" : "player-side"}>
                <span className="player-piece white-piece">♔</span>
                <div>
                  <div className="player-color">WHITE</div>
                  <div className="player-name">{whitePlayerLabel}</div>
                </div>
              </div>
              {game.turn() === "w" && <span className="turn-badge">TURN</span>}
            </div>

            <div className="player-row">
              <div className={game.turn() === "b" ? "player-side active" : "player-side"}>
                <span className="player-piece black-piece">♚</span>
                <div>
                  <div className="player-color">BLACK</div>
                  <div className="player-name">{blackPlayerLabel}</div>
                </div>
              </div>
              {game.turn() === "b" && <span className="turn-badge">TURN</span>}
            </div>

            <div className="battle-meta">
              <div><span>MOVE</span><b>{moveNumber}</b></div>
              <div><span>STATUS</span><b>{aiThinking ? "AI THINKING" : status}</b></div>
            </div>
            {augmentMode && hasAugment(augmentState, "G001") && (
              <div className="g001-status">
                <span>G001 · SNIPER</span>
                <b>{g001Uses} / 2 USES</b>
              </div>
            )}
            <p>Click a piece, then click a highlighted square.</p>
          </div>

          <div className="panel-card">
            <div className="panel-label">RULES ENGINE</div>
            <div className="rule-row"><span>Legal moves</span><b>chess.js</b></div>
            <div className="rule-row"><span>Turn</span><b>{turn}</b></div>
            <div className="rule-row"><span>Total moves</span><b>{game.history().length}</b></div>
          </div>

          <div className="panel-card move-history-card">
            <div className="battle-topline">
              <div className="panel-label">MOVE HISTORY</div>
              <span className="move-count">{moveHistory.length} MOVES</span>
            </div>
            <div className="move-history-list">
              {movePairs.length === 0 ? (
                <div className="move-history-empty">NO MOVES YET</div>
              ) : (
                movePairs.map((move) => (
                  <div className="move-history-row" key={move.number}>
                    <span className="move-number">{move.number}.</span>
                    <span className={move.number === Math.ceil(moveHistory.length / 2) && moveHistory.length % 2 === 1 ? "move-san current" : "move-san"}>{move.white}</span>
                    <span className={move.number === Math.ceil(moveHistory.length / 2) && moveHistory.length % 2 === 0 ? "move-san current" : "move-san"}>{move.black ?? "—"}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-label">COMING NEXT</div>
            <div className="next-item">{onlineSocket ? "✓ Real-time Socket.IO" : "✓ Offline Stockfish AI"}</div>
            <div className="next-item">♟ Online 1v1 Rooms</div>
            <div className="next-item">♟ Real 3D Chess Pieces</div>
          </div>
        </aside>
      </section>

      {augmentMode && (
        <aside className="augment-hud">
          <section className="augment-hud-card augment-owned-panel">
            <div className="augment-hud-kicker">YOUR AUGMENTS</div>
            <div className="augment-owned-grid">
              {augmentOwned.length === 0 ? (
                <div className="augment-empty">NO AUGMENTS YET</div>
              ) : (
                augmentOwned.map((augment) => augment && (
                  <div key={augment.id} className={`augment-mini-card tier-${augment.tier} ${augment.id === "G002" && g002ConditionActive ? "augment-active" : ""}`}>
                    <div className="augment-mini-tier">{augment.tier.toUpperCase()}</div>
                    <div className="augment-mini-name">{augment.name}</div>
                    <div className="augment-mini-description">{augment.description}</div>
                    {augment.id === "G002" && g002ConditionActive && <div className="augment-active-label">● CONDITION MET · ACTIVE</div>}
                  </div>
                ))
              )}
            </div>
          </section>
          <section className="augment-hud-card augment-battle-panel">
            <div><span>ROUND PROGRESS</span><b>{augmentState?.piecesLost ?? 0} / 16 PIECES LOST</b></div>
            <div className="augment-progress-bar"><i style={{ width: `${Math.min(100, ((augmentState?.piecesLost ?? 0) / 16) * 100)}%` }} /></div>
            <div className="augment-hud-stats">
              <span>REROLLS <b>{augmentState?.rerollsRemaining ?? 0}</b></span>
              <span>AUGMENTS <b>{augmentOwned.length}</b></span>
            </div>
          </section>
        </aside>
      )}

      {augmentSelection && !augmentSelection.selected && (
        <div className="augment-select-overlay">
          <div className="augment-select-backdrop" />
          <div className="augment-select-panel">
            <div className="augment-select-kicker">AUGMENT CHOICE · {augmentPhase === "start" ? "BATTLE START" : augmentPhase === "losses_8" ? "8 PIECES LOST" : "16 PIECES LOST"}</div>
            <h2>CHOOSE YOUR POWER</h2>
            <p>One choice changes the rules of this battle.</p>
            <div className="augment-choice-grid">
              {augmentSelection.options.map((id, index) => {
                const augment = getAugmentDefinition(id);
                if (!augment) return null;
                return (
                  <div
                    key={id}
                    className={`augment-choice-card tier-${augment.tier}`}
                    onClick={() => onChooseAugment?.(id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") onChooseAugment?.(id);
                    }}
                  >
                    <div className="augment-choice-tier">{augment.tier === "transcendent" ? "✦ TRANSCENDENT" : `${augment.tier.toUpperCase()} · ${augment.category.toUpperCase()}`}</div>
                    <h3>{augment.name}</h3>
                    <p>{augment.description}</p>
                    <div className="augment-choice-actions">
                      <span>SELECT →</span>
                      <button
                        type="button"
                        className="augment-card-reroll"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRerollAugment?.(index);
                        }}
                        disabled={(augmentState?.rerollsRemaining ?? 0) <= 0}
                      >
                        ↻ REROLL THIS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="augment-reroll-row">
              <span>SHARED REROLLS REMAINING <b>{augmentState?.rerollsRemaining ?? 0}</b></span>
              <span>REROLL A CARD TO KEEP THE OTHER TWO</span>
            </div>
          </div>
        </div>
      )}

      {isGameOver && !pendingPromotion && (
        <div className="game-result-overlay">
          <div className="game-result-card">
            <div className="game-result-kicker">{onlineSocket ? "ONLINE MATCH" : "GAME OVER"}</div>
            <div className="game-result-title">{resultTitle}</div>
            <div className="game-result-subtitle">{resultSubtitle}</div>
            <div className="game-result-actions">
              <button className="game-result-primary" onClick={reset}>NEW GAME</button>
              <button className="game-result-secondary" onClick={onBackToMenu}>MENU</button>
            </div>
          </div>
        </div>
      )}

      {pendingPromotion && (
        <div className="promotion-overlay">
          <div className="promotion-card">
            <div className="panel-label">PROMOTE PAWN</div>
            <div className="promotion-title">Choose a piece</div>
            <div className="promotion-options">
              {([["q", "QUEEN", "♕"], ["r", "ROOK", "♖"], ["b", "BISHOP", "♗"], ["n", "KNIGHT", "♘"]] as const).map(([piece, label, symbol]) => (
                <button key={piece} className="promotion-option" onClick={() => promote(piece)}>
                  <span>{symbol}</span>
                  <b>{label}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

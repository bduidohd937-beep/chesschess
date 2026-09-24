"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Color, type PieceSymbol } from "chess.js";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

type Square = string;
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

function Piece({ type, color, square, selected, onClick, animateFrom }: {
  type: PieceSymbol;
  color: Color;
  square: Square;
  selected: boolean;
  onClick: () => void;
  animateFrom?: Square;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [x, , z] = squarePosition(square);
  const white = color === "w";

  const animationStart = animateFrom ? squarePosition(animateFrom) : null;
  const animationElapsed = useRef(animateFrom ? 0 : 1);
  useFrame((_, delta) => {
    if (!groupRef.current || !animationStart || animationElapsed.current >= 1) return;
    animationElapsed.current = Math.min(1, animationElapsed.current + delta / 0.22);
    const t = animationElapsed.current;
    const eased = 1 - Math.pow(1 - t, 3);
    groupRef.current.position.x = THREE.MathUtils.lerp(animationStart[0], x, eased);
    groupRef.current.position.z = THREE.MathUtils.lerp(animationStart[2], z, eased);
    groupRef.current.position.y = (selected ? 0.18 : 0.1) + Math.sin(Math.PI * eased) * 0.22;
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
      scale={selected ? 1.04 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
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
function Board({ game, selected, legalMoves, onSquare, lastMove, captureSquare }: {
  game: Chess;
  selected: Square | null;
  legalMoves: { to: Square; captured?: PieceSymbol; flags: string }[];
  onSquare: (square: Square) => void;
  lastMove: { from: Square; to: Square } | null;
  captureSquare?: Square | null;
}) {
  const pieces = useMemo(() => {
    const result: { square:string; type:PieceSymbol; color:Color }[] = [];
    const board = game.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) result.push({ square: `${files[col]}${8-row}`, type:piece.type, color:piece.color });
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
        const square = `${files[col]}${8-row}`;
        const light = (col + row) % 2 === 0;
        const isSelected = square === selected;
        const isLastMove = lastMove?.from === square || lastMove?.to === square;
        const boardPiece = game.get(square as any);
        const isCheckedKing =
          Boolean(boardPiece && boardPiece.type === "k" && boardPiece.color === game.turn() && game.isCheck());
        const legalMove = legalMoves.find((move) => move.to === square);
        const isLegal = Boolean(legalMove);
        // 캡처 표시는 chess.js의 실제 이동 플래그만 사용한다.
        // captured 값만 믿으면 빈 대각선 칸이 캡처처럼 표시되는 상황을 방지할 수 없다.
        const isCapture = Boolean(
          legalMove && (legalMove.flags.includes("c") || legalMove.flags.includes("e"))
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
              <mesh position={[0, 0.125, 0]}>
                <torusGeometry args={[0.34, 0.055, 12, 40]} />
                <meshBasicMaterial color="#ff5d5d" transparent opacity={0.82} />
              </mesh>
            )}
            {isSelected && (
              <mesh position={[0, 0.13, 0]}>
                <torusGeometry args={[0.4, 0.035, 12, 40]} />
                <meshBasicMaterial color="#ffe08a" transparent opacity={0.9} />
              </mesh>
            )}
            {isLegal && !isCapture && (
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
                <meshBasicMaterial color="#48d597" />
              </mesh>
            )}
            {isCapture && (
              <mesh position={[0, 0.13, 0]}>
                <torusGeometry args={[0.29, 0.045, 12, 32]} />
                <meshBasicMaterial color="#e85b5b" />
              </mesh>
            )}
          </group>
        );
      })}

      {captureSquare && (
        <mesh
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
          animateFrom={lastMove?.to === piece.square ? lastMove.from : undefined}
          onClick={() => onSquare(piece.square)}
        />
      ))}
    </group>
  );
}

export default function ChessGame({ onBackToMenu }: { onBackToMenu?: () => void }) {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [captureSquare, setCaptureSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiLevel, setAiLevel] = useState<AiLevel>("intermediate");
  const [aiThinking, setAiThinking] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const stockfishRef = useRef<Worker | null>(null);
  const engineReadyRef = useRef(false);
  const aiSearchIdRef = useRef(0);

  useEffect(() => {
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
      const from = match[1] as Square;
      const to = match[2] as Square;
      const promotion = (match[3] as PromotionPiece | undefined) ?? undefined;
      setGame((current) => {
        if (current.turn() !== "b") return current;
        const nextGame = new Chess(current.fen());
        try {
          nextGame.move({ from, to, promotion: promotion ?? "q" });
          setLastMove({ from, to });
          const moveObject = current.moves({ square: from, verbose: true }).find((move) => move.to === to);
          setCaptureSquare(Boolean(moveObject && (moveObject.flags.includes("c") || moveObject.flags.includes("e"))) ? to : null);
          return nextGame;
        } catch {
          return current;
        }
      });
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
  }, []);

  useEffect(() => {
    if (!aiEnabled || game.turn() !== "b" || game.isGameOver() || pendingPromotion || !engineReady) return;
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
  }, [aiEnabled, aiLevel, game, pendingPromotion, engineReady]);

  const legalMoveObjects = useMemo(() => {
    if (!selected) return [];
    try {
      return game.moves({ square: selected, verbose: true });
    } catch {
      return [];
    }
  }, [game, selected]);

  const legalMoves = legalMoveObjects.map((move) => ({
    to: move.to,
    captured: move.captured,
    flags: move.flags,
  }));

  const turn = game.turn() === "w" ? "WHITE" : "BLACK";
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
    if (aiThinking || pendingPromotion) return;
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
        nextGame.move({ from: selected, to: square });
        const moveObject = legalMoveObjects.find((move) => move.to === square);
        const captured = Boolean(moveObject && (moveObject.flags.includes("c") || moveObject.flags.includes("e")));
        setGame(nextGame);
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
      nextGame.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      const moveObject = legalMoveObjects.find((move) => move.to === pendingPromotion.to);
      const captured = Boolean(moveObject && (moveObject.flags.includes("c") || moveObject.flags.includes("e")));
      setGame(nextGame);
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
    aiSearchIdRef.current += 1;
    stockfishRef.current?.postMessage("stop");
    setAiThinking(false);
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
    setCaptureSquare(null);
    setPendingPromotion(null);
  }

  return (
    <main className="chess-app">
      <header className="chess-header">
        <div>
          <div className="eyebrow">3D CHESS</div>
          <h1>Classic Chess</h1>
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
            <Environment preset="studio" />
            <Board
              game={game}
              selected={selected}
              legalMoves={legalMoves}
              lastMove={lastMove}
              captureSquare={captureSquare}
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
            <div className="panel-label">OPPONENT</div>
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
          </div>

          <div className="panel-card">
            <div className="panel-label">GAME</div>
            <div className="game-status">{aiThinking ? "AI THINKING" : status}</div>
            <p>Click a piece, then click a highlighted square.</p>
          </div>

          <div className="panel-card">
            <div className="panel-label">RULES ENGINE</div>
            <div className="rule-row"><span>Legal moves</span><b>chess.js</b></div>
            <div className="rule-row"><span>Turn</span><b>{turn}</b></div>
            <div className="rule-row"><span>Moves</span><b>{game.history().length}</b></div>
          </div>

          <div className="panel-card">
            <div className="panel-label">COMING NEXT</div>
            <div className="next-item">✓ Offline Stockfish AI</div>
            <div className="next-item">♟ Online 1v1 Rooms</div>
            <div className="next-item">♟ Real 3D Chess Pieces</div>
          </div>
        </aside>
      </section>
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

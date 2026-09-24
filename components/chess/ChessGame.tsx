"use client";

import { useMemo, useState } from "react";
import { Chess, type Color, type PieceSymbol } from "chess.js";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

type Square = string;

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

function Piece({ type, color, square, selected, onClick }: {
  type: PieceSymbol;
  color: Color;
  square: Square;
  selected: boolean;
  onClick: () => void;
}) {
  const [x, , z] = squarePosition(square);
  const white = color === "w";
  const main = selected ? "#d7b65d" : white ? "#f4efe2" : "#211d1a";
  const edge = selected ? "#f0d477" : white ? "#d9d0bf" : "#0e0c0b";
  const material = { color: main, metalness: 0.1, roughness: 0.22 } as const;
  const accent = { color: edge, metalness: 0.16, roughness: 0.2 } as const;

  return (
    <group position={[x, selected ? 0.18 : 0.1, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.36, 0.43, 0.16, 40]} />
        <meshStandardMaterial {...accent} />
      </mesh>

      {type === "p" && <>
        <mesh castShadow position={[0, 0.42, 0]}>
          <latheGeometry args={[[
            new THREE.Vector2(0.18, 0),
            new THREE.Vector2(0.25, 0.12),
            new THREE.Vector2(0.2, 0.28),
            new THREE.Vector2(0.14, 0.52),
            new THREE.Vector2(0.22, 0.58),
          ], 32]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 0.86, 0]}>
          <sphereGeometry args={[0.21, 32, 20]} />
          <meshStandardMaterial {...material} />
        </mesh>
      </>}

      {type === "r" && <>
        <mesh castShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.25, 0.31, 0.62, 32]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.35, 0.29, 0.18, 12]} />
          <meshStandardMaterial {...accent} />
        </mesh>
        {[-0.2, 0, 0.2].map((dx) => (
          <mesh key={dx} castShadow position={[dx, 0.98, 0]}>
            <boxGeometry args={[0.11, 0.2, 0.25]} />
            <meshStandardMaterial {...material} />
          </mesh>
        ))}
      </>}

      {type === "n" && <>
        <mesh castShadow position={[0, 0.43, 0]}>
          <cylinderGeometry args={[0.25, 0.34, 0.56, 20]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 0.82, 0]} rotation={[0, 0, -0.18]}>
          <coneGeometry args={[0.28, 0.48, 6]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 0.91, 0.02]}>
          <torusGeometry args={[0.16, 0.035, 10, 20, Math.PI * 1.35]} />
          <meshStandardMaterial {...accent} />
        </mesh>
        <mesh castShadow position={[0.02, 0.98, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.48]} />
          <meshStandardMaterial {...accent} />
        </mesh>
      </>}

      {type === "b" && <>
        <mesh castShadow position={[0, 0.48, 0]}>
          <coneGeometry args={[0.31, 0.76, 24]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 0.91, 0]}>
          <sphereGeometry args={[0.18, 28, 18]} />
          <meshStandardMaterial {...accent} />
        </mesh>
        <mesh castShadow position={[0, 0.93, 0]} rotation={[0.2, 0, 0.2]}>
          <boxGeometry args={[0.07, 0.34, 0.08]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 1.02, 0]}>
          <torusGeometry args={[0.18, 0.025, 8, 24]} />
          <meshStandardMaterial {...accent} />
        </mesh>
      </>}

      {type === "q" && <>
        <mesh castShadow position={[0, 0.48, 0]}>
          <latheGeometry args={[[
            new THREE.Vector2(0.18, 0),
            new THREE.Vector2(0.3, 0.18),
            new THREE.Vector2(0.24, 0.5),
            new THREE.Vector2(0.3, 0.7),
          ], 32]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 0.91, 0]}>
          <cylinderGeometry args={[0.23, 0.27, 0.16, 32]} />
          <meshStandardMaterial {...accent} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a) => (
          <mesh key={a} castShadow position={[Math.cos(a) * 0.18, 1.08, Math.sin(a) * 0.18]}>
            <sphereGeometry args={[0.09, 16, 12]} />
            <meshStandardMaterial {...material} />
          </mesh>
        ))}
        <mesh castShadow position={[0, 1.08, 0]}>
          <sphereGeometry args={[0.13, 20, 16]} />
          <meshStandardMaterial {...material} />
        </mesh>
      </>}

      {type === "k" && <>
        <mesh castShadow position={[0, 0.5, 0]}>
          <latheGeometry args={[[
            new THREE.Vector2(0.2, 0),
            new THREE.Vector2(0.32, 0.18),
            new THREE.Vector2(0.25, 0.52),
            new THREE.Vector2(0.31, 0.7),
          ], 32]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.26, 0.29, 0.2, 32]} />
          <meshStandardMaterial {...accent} />
        </mesh>
        <mesh castShadow position={[0, 1.04, 0]}>
          <boxGeometry args={[0.14, 0.46, 0.14]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 1.04, 0]}>
          <boxGeometry args={[0.46, 0.14, 0.14]} />
          <meshStandardMaterial {...material} />
        </mesh>
        <mesh castShadow position={[0, 1.29, 0]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial {...accent} />
        </mesh>
      </>}
    </group>
  );
}

function Board({ game, selected, legalMoves, onSquare }: {
  game: Chess;
  selected: Square | null;
  legalMoves: string[];
  onSquare: (square: Square) => void;
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
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <boxGeometry args={[8.7, 0.3, 8.7]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.32} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[8.45, 0.04, 8.45]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.4} />
      </mesh>
      {Array.from({ length: 64 }, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const light = (col + row) % 2 === 0;
        return (
          <mesh key={`floor-${i}`} position={[col - 3.5, 0.015, 3.5 - row]} receiveShadow>
            <boxGeometry args={[0.98, 0.025, 0.98]} />
            <meshStandardMaterial color={light ? "#f2f2f2" : "#171717"} roughness={0.42} />
          </mesh>
        );
      })}

      {Array.from({ length: 64 }, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const square = `${files[col]}${8-row}`;
        const light = (col + row) % 2 === 0;
        const isSelected = square === selected;
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
              <meshStandardMaterial color={isSelected ? "#c9a227" : light ? "#e8d0a8" : "#765033"} roughness={0.45} />
            </mesh>
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

      {pieces.map((piece) => (
        <Piece key={piece.square} {...piece} selected={piece.square === selected} onClick={() => onSquare(piece.square)} />
      ))}
    </group>
  );
}

export default function ChessGame({ onBackToMenu }: { onBackToMenu?: () => void }) {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);

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
    const piece = game.get(square as any);

    if (selected && legalMoves.some((move) => move.to === square)) {
      const nextGame = new Chess(game.fen());
      try {
        nextGame.move({
          from: selected,
          to: square,
          promotion: "q",
        });
        setGame(nextGame);
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

  function reset() {
    setGame(new Chess());
    setSelected(null);
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
          {status}
        </div>
        <div className="header-actions"><button className="reset-button" onClick={onBackToMenu}>MENU</button><button className="reset-button" onClick={reset}>NEW GAME</button></div>
      </header>

      <section className="chess-layout">
        <div className="board-shell">
          <Canvas shadows camera={{ position: [0, 7.8, -8.2], fov: 42 }}>
            <color attach="background" args={["#10100f"]} />
            <ambientLight intensity={1.7} />
            <directionalLight castShadow position={[4, 9, 5]} intensity={3.2} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <Environment preset="studio" />
            <Board game={game} selected={selected} legalMoves={legalMoves} onSquare={handleSquare} />
            <OrbitControls enablePan={false} minDistance={6} maxDistance={13} minPolarAngle={0.45} maxPolarAngle={1.35} />
          </Canvas>
        </div>

        <aside className="side-panel">
          <div className="panel-card">
            <div className="panel-label">GAME</div>
            <div className="game-status">{status}</div>
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
            <div className="next-item">♟ Offline Stockfish AI</div>
            <div className="next-item">♟ Online 1v1 Rooms</div>
            <div className="next-item">♟ Real 3D Chess Pieces</div>
          </div>
        </aside>
      </section>
    </main>
  );
}

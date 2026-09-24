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

  return (
    <group position={[x, 0.1, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.16, 40]} />
        <meshStandardMaterial color={edge} metalness={0.18} roughness={0.24} />
      </mesh>

      {type === "p" && <>
        <mesh castShadow position={[0, 0.42, 0]}>
          <latheGeometry args={[[
            new THREE.Vector2(0.17, 0),
            new THREE.Vector2(0.23, 0.12),
            new THREE.Vector2(0.19, 0.25),
            new THREE.Vector2(0.15, 0.48),
            new THREE.Vector2(0.22, 0.54),
          ], 32]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.88, 0]}>
          <sphereGeometry args={[0.2, 32, 20]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
      </>}

      {type === "r" && <>
        <mesh castShadow position={[0, 0.43, 0]}>
          <cylinderGeometry args={[0.22, 0.29, 0.55, 32]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.31, 0.27, 0.16, 12]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        {[-0.18, 0, 0.18].map((x) => <mesh key={x} castShadow position={[x, 0.95, 0]}>
          <boxGeometry args={[0.1, 0.18, 0.24]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>)}
      </>}

      {type === "b" && <>
        <mesh castShadow position={[0, 0.48, 0]}>
          <coneGeometry args={[0.29, 0.72, 32]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.17, 28, 18]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.89, 0.13]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.045, 0.28, 0.06]} />
          <meshStandardMaterial color={edge} />
        </mesh>
      </>}

      {type === "n" && <>
        <mesh castShadow position={[0, 0.53, 0]} rotation={[0, 0, -0.12]}>
          <capsuleGeometry args={[0.23, 0.55, 8, 20]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[0.08, 0.9, 0.02]} rotation={[0, 0, -0.18]}>
          <coneGeometry args={[0.19, 0.42, 4]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
      </>}

      {type === "q" && <>
        <mesh castShadow position={[0, 0.5, 0]}>
          <latheGeometry args={[[
            new THREE.Vector2(0.18, 0),
            new THREE.Vector2(0.28, 0.18),
            new THREE.Vector2(0.22, 0.55),
            new THREE.Vector2(0.29, 0.68),
          ], 32]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 1.0, 0]}>
          <sphereGeometry args={[0.24, 28, 18]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((a) => <mesh key={a} castShadow position={[Math.cos(a)*0.17, 0.91, Math.sin(a)*0.17]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>)}
      </>}

      {type === "k" && <>
        <mesh castShadow position={[0, 0.5, 0]}>
          <latheGeometry args={[[
            new THREE.Vector2(0.19, 0),
            new THREE.Vector2(0.3, 0.18),
            new THREE.Vector2(0.24, 0.52),
            new THREE.Vector2(0.3, 0.67),
          ], 32]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.96, 0]}>
          <boxGeometry args={[0.14, 0.42, 0.14]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.96, 0]}>
          <boxGeometry args={[0.42, 0.14, 0.14]} />
          <meshStandardMaterial color={main} metalness={0.08} roughness={0.2} />
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
        const isLegal = legalMoves.includes(square);
        return (
          <group key={square} position={[col - 3.5, 0, 3.5-row]}>
            <mesh receiveShadow onClick={(e) => { e.stopPropagation(); onSquare(square); }}>
              <boxGeometry args={[0.98, 0.18, 0.98]} />
              <meshStandardMaterial color={isSelected ? "#c9a227" : light ? "#e8d0a8" : "#765033"} roughness={0.45} />
            </mesh>
            {isLegal && (
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
                <meshBasicMaterial color="#48d597" />
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

export default function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);

  const legalMoves = useMemo(() => {
    if (!selected) return [];
    try {
      return game.moves({ square: selected, verbose: true }).map((move) => move.to);
    } catch {
      return [];
    }
  }, [game, selected]);

  const turn = game.turn() === "w" ? "WHITE" : "BLACK";
  const status = game.isCheckmate()
    ? `${turn === "WHITE" ? "BLACK" : "WHITE"} CHECKMATES`
    : game.isDraw()
      ? "DRAW"
      : game.isCheck()
        ? `${turn} IN CHECK`
        : `${turn} TO MOVE`;

  function handleSquare(square: Square) {
    const piece = game.get(square as any);

    if (selected && legalMoves.includes(square)) {
      try {
        game.move({ from: selected, to: square, promotion: "q" });
        setGame(new Chess(game.fen()));
        setSelected(null);
        return;
      } catch {}
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
        <button className="reset-button" onClick={reset}>NEW GAME</button>
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

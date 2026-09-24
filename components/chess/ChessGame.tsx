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
  return [file - 3.5, 0, 3.5 - rank];
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
  const isWhite = color === "w";

  return (
    <group position={[x, 0.12, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 0.18, 32]} />
        <meshStandardMaterial color={selected ? "#d7b65d" : isWhite ? "#eee8d5" : "#26221f"} metalness={0.18} roughness={0.28} />
      </mesh>
      <mesh castShadow position={[0, 0.48, 0]}>
        <cylinderGeometry args={type === "p" ? [0.17,0.25,0.5,24] : [0.22,0.29,0.62,24]} />
        <meshStandardMaterial color={selected ? "#d7b65d" : isWhite ? "#f7f1df" : "#171412"} metalness={0.12} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.82, 0]}>
        <sphereGeometry args={[type === "p" ? 0.18 : 0.24, 24, 16]} />
        <meshStandardMaterial color={selected ? "#d7b65d" : isWhite ? "#f7f1df" : "#171412"} metalness={0.12} roughness={0.3} />
      </mesh>
      <sprite position={[0, 1.18, 0]} scale={[0.7,0.7,0.7]}>
        <spriteMaterial transparent opacity={0.95} color={isWhite ? "#ffffff" : "#d9d0c5"} />
      </sprite>
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
        <meshStandardMaterial color="#3b2417" roughness={0.32} metalness={0.08} />
      </mesh>

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
          <Canvas shadows camera={{ position: [0, 7.8, 8.2], fov: 42 }}>
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

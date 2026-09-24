"use client";

type ModeMenuProps = {
  onSelectClassic: () => void;
  onSelectOnline: () => void;
};

export default function ModeMenu({ onSelectClassic, onSelectOnline }: ModeMenuProps) {
  return (
    <main className="mode-menu">
      <div className="menu-topline">
        <span>CHESSCHESS</span>
        <span>3D STRATEGY / 01</span>
      </div>

      <div className="mode-hero">
        <div className="eyebrow">THE ROYAL GAME</div>
        <h1>CHESS</h1>
        <p>Classic rules. Three-dimensional battlefield.</p>
      </div>

      <section className="mode-grid">
        <button className="mode-card featured" onClick={onSelectClassic}>
          <div className="mode-card-top">
            <span className="mode-index">01</span>
            <span className="mode-icon">♟</span>
          </div>
          <div>
            <span className="mode-title">CLASSIC CHESS</span>
            <span className="mode-description">Play against Stockfish or another player on the 3D board.</span>
          </div>
          <span className="mode-action">ENTER BOARD <b>→</b></span>
        </button>

        <button className="mode-card augment" onClick={onSelectOnline}>
          <div className="mode-card-top">
            <span className="mode-index">02</span>
            <span className="mode-icon">✦</span>
          </div>
          <div>
            <span className="mode-title">ONLINE 1V1</span>
            <span className="mode-description">Create a private room and battle another player in real time.</span>
          </div>
          <span className="mode-action">FIND OPPONENT <b>→</b></span>
        </button>
      </section>

      <div className="mode-footer">
        <span>3D BOARD</span>
        <span>•</span>
        <span>CHESS.JS RULES</span>
        <span>•</span>
        <span>REAL-TIME PLAY</span>
      </div>
    </main>
  );
}

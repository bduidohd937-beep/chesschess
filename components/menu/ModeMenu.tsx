"use client";

type GameTypeMenuProps = {
  mode: "offline" | "online";
  onSelectClassic: () => void;
  onSelectAugment: () => void;
  onBack: () => void;
};

export default function ModeMenu({ mode, onSelectClassic, onSelectAugment, onBack }: GameTypeMenuProps) {
  const online = mode === "online";

  return (
    <main className="mode-menu">
      <div className="menu-topline">
        <button className="menu-back" onClick={onBack}>← BACK</button>
        <span>CHESSCHESS</span>
        <span>{online ? "ONLINE GAME" : "OFFLINE GAME"}</span>
      </div>

      <div className="mode-hero">
        <div className="eyebrow">{online ? "PLAYER VS PLAYER" : "LOCAL PLAY"}</div>
        <h1>{online ? "ONLINE" : "OFFLINE"}</h1>
        <p>Choose how you want to play chess.</p>
      </div>

      <section className="mode-grid">
        <button className="mode-card featured" onClick={onSelectClassic}>
          <div className="mode-card-top">
            <span className="mode-index">01</span>
            <span className="mode-icon">♟</span>
          </div>
          <div>
            <span className="mode-title">CLASSIC CHESS</span>
            <span className="mode-description">
              Traditional chess rules with the clean 3D board experience.
            </span>
          </div>
          <span className="mode-action">PLAY CLASSIC <b>→</b></span>
        </button>

        <button className="mode-card augment" onClick={onSelectAugment}>
          <div className="mode-card-top">
            <span className="mode-index">02</span>
            <span className="mode-icon">✦</span>
          </div>
          <div>
            <span className="mode-title">AUGMENT CHESS</span>
            <span className="mode-description">
              Chess rebuilt around powerful augments, unique effects, and a different battle experience.
            </span>
          </div>
          <span className="mode-action">ENTER AUGMENTS <b>→</b></span>
        </button>
      </section>

      <div className="mode-footer">
        <span>{online ? "ONLINE 1V1" : "LOCAL / AI"}</span>
        <span>•</span>
        <span>CLASSIC</span>
        <span>•</span>
        <span>AUGMENTS</span>
      </div>
    </main>
  );
}

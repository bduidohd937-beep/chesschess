"use client";

type ModeMenuProps = {
  onSelectClassic: () => void;
  onSelectOnline: () => void;
};

export default function ModeMenu({ onSelectClassic, onSelectOnline }: ModeMenuProps) {
  return (
    <main className="mode-menu">
      <div className="mode-hero">
        <div className="eyebrow">3D CHESS</div>
        <h1>CHESS</h1>
        <p>Classic rules. New strategies.</p>
      </div>

      <section className="mode-grid">
        <button className="mode-card featured" onClick={onSelectClassic}>
          <span className="mode-icon">♟</span>
          <span className="mode-title">CLASSIC CHESS</span>
          <span className="mode-description">Traditional chess with a 3D board.</span>
          <span className="mode-action">PLAY CLASSIC</span>
        </button>

        <button className="mode-card augment" onClick={onSelectOnline}>
          <span className="mode-icon">✦</span>
          <span className="mode-title">ONLINE 1V1</span>
          <span className="mode-description">Create a room and play real-time with a friend.</span>
          <span className="mode-action">PLAY ONLINE</span>
        </button>
      </section>

      <div className="mode-footer">
        <span>3D BOARD</span>
        <span>•</span>
        <span>STRATEGY</span>
        <span>•</span>
        <span>AUGMENTS</span>
      </div>
    </main>
  );
}

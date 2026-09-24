"use client";

type ModeMenuProps = {
  onSelectClassic: () => void;
};

export default function ModeMenu({ onSelectClassic }: ModeMenuProps) {
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

        <button className="mode-card augment" onClick={() => {}}>
          <span className="mode-icon">✦</span>
          <span className="mode-title">AUGMENT CHESS</span>
          <span className="mode-description">Chess rebuilt around augments and strategy.</span>
          <span className="mode-action">COMING SOON</span>
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

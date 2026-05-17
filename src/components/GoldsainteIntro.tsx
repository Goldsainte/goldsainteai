import { useEffect, useState } from "react";

// Goldsainte wordmark — transparent PNG embedded as base64
const WORDMARK_B64 = "data:image/png;base64,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";

/**
 * GoldsainteIntro
 * Plays the luxury brand intro then calls onComplete().
 */
export default function GoldsainteIntro({ onComplete }: { onComplete?: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 3400);
    const doneTimer = setTimeout(() => onComplete?.(), 4500);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400&display=swap');

    .gs-root { position: fixed; inset: 0; z-index: 9999; overflow: hidden; background: #1B3A2D; }
    .gs-black { position: absolute; inset: 0; background: #000; animation: gs-black-out 1.0s ease-out 0.1s forwards; z-index: 2; }
    @keyframes gs-black-out { to { opacity: 0; pointer-events: none; } }

    .gs-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 3; transition: opacity 0.25s ease; }
    .gs-root.exiting .gs-center { opacity: 0; }

    .gs-wordmark { width: clamp(260px, 52vw, 700px); opacity: 0; transform: translateY(16px) scale(0.97); animation: gs-word-in 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.65s forwards; }
    @keyframes gs-word-in { to { opacity: 1; transform: translateY(0) scale(1); } }

    .gs-line-wrap { width: clamp(140px, 26vw, 280px); height: 1px; margin: 28px auto 22px; position: relative; opacity: 0; animation: gs-appear 0.01s linear 1.55s forwards; }
    @keyframes gs-appear { to { opacity: 1; } }

    .gs-line { position: absolute; top: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(to right, transparent 0%, rgba(201,169,110,0.5) 15%, #C9A96E 35%, #E8D5A3 50%, #C9A96E 65%, rgba(201,169,110,0.5) 85%, transparent 100%); transform: scaleX(0); transform-origin: left; animation: gs-line-draw 1.1s cubic-bezier(0.4, 0, 0.2, 1) 1.55s forwards; }
    @keyframes gs-line-draw { to { transform: scaleX(1); } }

    .gs-diamond { position: absolute; top: 50%; left: 50%; width: 5px; height: 5px; background: #E8D5A3; transform: translate(-50%, -50%) rotate(45deg) scale(0); animation: gs-diamond-in 0.35s ease-out 2.5s forwards; }
    @keyframes gs-diamond-in { to { transform: translate(-50%, -50%) rotate(45deg) scale(1); } }

    .gs-tagline { font-family: 'Montserrat', sans-serif; font-weight: 200; font-size: clamp(0.45rem, 1.1vw, 0.65rem); letter-spacing: 0.6em; color: rgba(201, 169, 110, 0.75); text-transform: uppercase; opacity: 0; padding-right: 0.6em; animation: gs-tag-in 1.0s ease-out 2.4s forwards; }
    @keyframes gs-tag-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    .gs-curtain-top, .gs-curtain-bot { position: absolute; left: 0; width: 100%; height: 50%; background: #1B3A2D; transition: transform 1.05s cubic-bezier(0.76, 0, 0.24, 1); will-change: transform; z-index: 10; }
    .gs-curtain-top { top: 0; transform: translateY(0); }
    .gs-curtain-bot { bottom: 0; transform: translateY(0); }
    .gs-root.exiting .gs-curtain-top { transform: translateY(-100%); }
    .gs-root.exiting .gs-curtain-bot { transform: translateY(100%); }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className={`gs-root${exiting ? " exiting" : ""}`} aria-hidden="true">
        <div className="gs-black" />
        <div className="gs-center">
          <img src={WORDMARK_B64} alt="Goldsainte" className="gs-wordmark" />
          <div className="gs-line-wrap">
            <div className="gs-line" />
            <div className="gs-diamond" />
          </div>
          <div className="gs-tagline">Discover. Create. Explore.</div>
        </div>
        <div className="gs-curtain-top" />
        <div className="gs-curtain-bot" />
      </div>
    </>
  );
}
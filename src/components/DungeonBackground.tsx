import { useEffect, useRef } from "react";

interface Props {
  /** rank-glow color as hex like "#5b3fcf" */
  glow: string;
}

const RUNE_GLYPHS = [
  "DEAᚠH","MAY", "CPU", "ᛞ", "iset'com", "2027", "MAᛉ", "AMIᛏNE", "WᚷN",
  "龍", "魂", "H影", "闇", "封", "陣", "凶", "魔","MAY",
];

/**
 * Layered Solo Leveling dungeon-gate background:
 *   L1 — radial space gradient (CSS)
 *   L2 — concentric pulsing gate rings (CSS)
 *   L3 — floating magic runes (CSS)
 *   L4 — mana particle canvas (Canvas 2D)
 * Rank color drives all glows via the --rank-glow CSS variable.
 */
export default function DungeonBackground({ glow }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef(glow);
  useEffect(() => {
    glowRef.current = glow;
  }, [glow]);

  // --- canvas mana particles ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#1e6fc8", "#5b3fcf", "#9d00ff"];
    type P = {
      x: number;
      y: number;
      r: number;
      vy: number;
      drift: number;
      phase: number;
      color: string;
      base: number;
    };
    const particles: P[] = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 1.6,
      vy: 0.15 + Math.random() * 0.45,
      drift: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      base: 0.3 + Math.random() * 0.7,
    }));

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        p.y -= p.vy;
        p.x += Math.sin(t * 0.6 + p.phase) * p.drift * 0.4;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        const flicker = p.base * (0.65 + 0.35 * Math.sin(t * 3 + p.phase * 2));
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = Math.max(0, Math.min(1, flicker));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // 14 floating runes – stable positions/delays
  const runes = Array.from({ length: 14 }).map((_, i) => {
    const glyph = RUNE_GLYPHS[i % RUNE_GLYPHS.length];
    const left = (i * 67) % 100;
    const top = (i * 41 + 20) % 90;
    const duration = 7 + ((i * 13) % 5);
    const delay = (i * 0.7) % 6;
    const rot = ((i * 37) % 30) - 15;
    const size = 22 + ((i * 11) % 24);
    return { glyph, left, top, duration, delay, rot, size, key: i };
  });

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* L1 deep space base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, #0a0a1a 0%, #050508 60%, #000000 100%)",
        }}
      />

      {/* L2 dungeon gate – 3 concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="dg-gate dg-gate-1" />
        <div className="dg-gate dg-gate-2" />
        <div className="dg-gate dg-gate-3" />
      </div>

      {/* L3 floating runes */}
      <div className="absolute inset-0">
        {runes.map((r) => (
          <span
            key={r.key}
            className="dg-rune font-display"
            style={{
              left: `${r.left}%`,
              top: `${r.top}%`,
              fontSize: r.size,
              animationDuration: `${r.duration}s`,
              animationDelay: `-${r.delay}s`,
              ["--rune-rot" as never]: `${r.rot}deg`,
            } as React.CSSProperties}
          >
            {r.glyph}
          </span>
        ))}
      </div>

      {/* L4 mana particles canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}


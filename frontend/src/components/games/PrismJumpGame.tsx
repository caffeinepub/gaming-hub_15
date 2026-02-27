import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 800;
const CANVAS_H = 450;
const BALL_R = 14;
const TUNNEL_H = 120;
const GRAVITY = 0.35;
const JUMP_FORCE = -9;

interface Segment {
  x: number;
  topY: number;
  color: string;
  hasGem: boolean;
  gemCollected: boolean;
}

const COLORS = ['#22d3ee', '#a855f7', '#4ade80', '#f43f5e', '#facc15'];

export default function PrismJumpGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    gems: 0,
    speed: 4,
    ball: { x: 150, y: CANVAS_H / 2, vy: 0 },
    segments: [] as Segment[],
    frameCount: 0,
    highScore: 0,
    colorIndex: 0,
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef<number>(0);

  const initSegments = useCallback(() => {
    const segs: Segment[] = [];
    for (let i = 0; i < 15; i++) {
      const topY = CANVAS_H / 2 - TUNNEL_H / 2 + (Math.random() - 0.5) * 60;
      segs.push({
        x: i * 80,
        topY: Math.max(40, Math.min(CANVAS_H - TUNNEL_H - 40, topY)),
        color: COLORS[i % COLORS.length],
        hasGem: Math.random() < 0.3,
        gemCollected: false,
      });
    }
    return segs;
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.score = 0;
    s.gems = 0;
    s.speed = 4;
    s.ball = { x: 150, y: CANVAS_H / 2, vy: 0 };
    s.segments = initSegments();
    s.frameCount = 0;
    setGameState('running');
    setDisplayScore(0);
  }, [initSegments]);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.running && !s.gameOver) {
      s.ball.vy = JUMP_FORCE;
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!stateRef.current.running || stateRef.current.gameOver) startGame();
        else jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startGame, jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw tunnel segments
      for (let i = 0; i < s.segments.length; i++) {
        const seg = s.segments[i];
        const nextSeg = s.segments[i + 1] || seg;
        const segW = 82;

        // Top wall
        const grad = ctx.createLinearGradient(seg.x, 0, seg.x + segW, 0);
        grad.addColorStop(0, seg.color + '99');
        grad.addColorStop(1, nextSeg.color + '99');
        ctx.fillStyle = grad;
        ctx.fillRect(seg.x, 0, segW, seg.topY);

        // Bottom wall
        ctx.fillStyle = grad;
        ctx.fillRect(seg.x, seg.topY + TUNNEL_H, segW, CANVAS_H - seg.topY - TUNNEL_H);

        // Neon edge lines
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.topY);
        ctx.lineTo(seg.x + segW, nextSeg.topY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.topY + TUNNEL_H);
        ctx.lineTo(seg.x + segW, nextSeg.topY + TUNNEL_H);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Gem
        if (seg.hasGem && !seg.gemCollected) {
          const gx = seg.x + 40;
          const gy = seg.topY + TUNNEL_H / 2;
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(gx, gy - 8);
          ctx.lineTo(gx + 6, gy);
          ctx.lineTo(gx, gy + 8);
          ctx.lineTo(gx - 6, gy);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Ball
      const b = s.ball;
      const ballColor = COLORS[Math.floor(s.frameCount / 10) % COLORS.length];
      ctx.shadowColor = ballColor;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = ballColor;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.fillText(`${Math.floor(s.score)}`, 20, 30);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.fillText(`💎 ${s.gems}`, 20, 55);
      ctx.shadowBlur = 0;
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;

      s.frameCount++;
      s.score += s.speed * 0.04;
      s.speed = 4 + Math.floor(s.score / 100) * 0.3;

      // Ball physics
      s.ball.vy += GRAVITY;
      s.ball.y += s.ball.vy;

      // Scroll segments
      for (const seg of s.segments) seg.x -= s.speed;

      // Remove off-screen, add new
      if (s.segments[0].x < -100) {
        s.segments.shift();
        const last = s.segments[s.segments.length - 1];
        const newTopY = last.topY + (Math.random() - 0.5) * 50;
        s.segments.push({
          x: last.x + 80,
          topY: Math.max(40, Math.min(CANVAS_H - TUNNEL_H - 40, newTopY)),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          hasGem: Math.random() < 0.25,
          gemCollected: false,
        });
      }

      // Collision with tunnel walls
      const b = s.ball;
      const segIdx = s.segments.findIndex(seg => seg.x <= b.x && seg.x + 80 > b.x);
      if (segIdx >= 0) {
        const seg = s.segments[segIdx];
        // Gem collection
        if (seg.hasGem && !seg.gemCollected) {
          const gx = seg.x + 40;
          const gy = seg.topY + TUNNEL_H / 2;
          if (Math.hypot(b.x - gx, b.y - gy) < BALL_R + 10) {
            seg.gemCollected = true;
            s.gems++;
          }
        }
        // Wall collision
        if (b.y - BALL_R < seg.topY || b.y + BALL_R > seg.topY + TUNNEL_H) {
          s.gameOver = true;
          s.running = false;
          if (s.score > s.highScore) s.highScore = s.score;
          setGameState('over');
          setDisplayScore(Math.floor(s.score));
        }
      }

      // Out of bounds
      if (b.y < 0 || b.y > CANVAS_H) {
        s.gameOver = true;
        s.running = false;
        if (s.score > s.highScore) s.highScore = s.score;
        setGameState('over');
        setDisplayScore(Math.floor(s.score));
      }

      setDisplayScore(Math.floor(s.score));
    };

    const loop = () => {
      update();
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="border border-cyan-500/30 rounded-lg"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(34,211,238,0.3)' }}
          onClick={() => {
            if (gameState === 'idle' || gameState === 'over') startGame();
            else jump();
          }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-3xl text-cyan-400 mb-2" style={{ textShadow: '0 0 20px #22d3ee' }}>PRISM JUMP</h2>
            <p className="font-rajdhani text-cyan-300 text-lg mb-6">Navigate the neon tunnel</p>
            <button onClick={startGame} className="font-arcade text-sm bg-cyan-700 hover:bg-cyan-600 text-white px-6 py-3 rounded border border-cyan-400 transition-all">PRESS SPACE / CLICK</button>
            <p className="mt-4 font-rajdhani text-cyan-300/60 text-sm">SPACE / Click — Jump</p>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>CRASHED!</h2>
            <p className="font-arcade text-cyan-300 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-yellow-400 text-sm mb-1">GEMS: {stateRef.current.gems}</p>
            <p className="font-arcade text-white/50 text-xs mb-6">BEST: {Math.floor(stateRef.current.highScore)}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-cyan-700 hover:bg-cyan-600 text-white px-6 py-3 rounded border border-cyan-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-cyan-400/60 text-sm">SPACE / Click to jump through the tunnel</p>
    </div>
  );
}

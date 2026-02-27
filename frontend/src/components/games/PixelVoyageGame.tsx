import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 480;
const CANVAS_H = 640;
const BIRD_X = 100;
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const PIPE_W = 60;
const PIPE_GAP = 160;
const PIPE_SPEED = 3;

interface Pipe {
  x: number;
  topH: number;
  scored: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
}

export default function PixelVoyageGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    highScore: 0,
    bird: { y: CANVAS_H / 2, vy: 0, angle: 0 },
    pipes: [] as Pipe[],
    particles: [] as Particle[],
    frameCount: 0,
    bgStars: Array.from({ length: 60 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    })),
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef<number>(0);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.running && !s.gameOver) {
      s.bird.vy = JUMP_FORCE;
      // Wing particles
      for (let i = 0; i < 5; i++) {
        s.particles.push({ x: BIRD_X, y: s.bird.y, vx: -2 - Math.random() * 2, vy: (Math.random() - 0.5) * 3, life: 1, color: '#4ade80' });
      }
    }
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.score = 0;
    s.bird = { y: CANVAS_H / 2, vy: 0, angle: 0 };
    s.pipes = [{ x: CANVAS_W + 100, topH: 100 + Math.random() * (CANVAS_H - PIPE_GAP - 200), scored: false }];
    s.particles = [];
    s.frameCount = 0;
    setGameState('running');
    setDisplayScore(0);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!stateRef.current.running || stateRef.current.gameOver) startGame();
        else flap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startGame, flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#050520');
      skyGrad.addColorStop(1, '#0a1040');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      for (const star of s.bgStars) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + star.size * 0.3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pipes
      for (const pipe of s.pipes) {
        // Top pipe
        const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
        topGrad.addColorStop(0, '#166534');
        topGrad.addColorStop(0.5, '#4ade80');
        topGrad.addColorStop(1, '#166534');
        ctx.fillStyle = topGrad;
        ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
        ctx.fillRect(pipe.x - 5, pipe.topH - 20, PIPE_W + 10, 20);

        // Bottom pipe
        const botY = pipe.topH + PIPE_GAP;
        ctx.fillStyle = topGrad;
        ctx.fillRect(pipe.x, botY, PIPE_W, CANVAS_H - botY);
        ctx.fillRect(pipe.x - 5, botY, PIPE_W + 10, 20);

        // Neon edge
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 10;
        ctx.strokeRect(pipe.x, 0, PIPE_W, pipe.topH);
        ctx.strokeRect(pipe.x, botY, PIPE_W, CANVAS_H - botY);
        ctx.shadowBlur = 0;
      }

      // Particles
      for (const pt of s.particles) {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Bird
      const b = s.bird;
      ctx.save();
      ctx.translate(BIRD_X, b.y);
      ctx.rotate(Math.min(Math.max(b.vy * 0.05, -0.5), 0.8));
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 20;
      // Body
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wing
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(-5, 4, 12, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(8, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(9, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(16, -2);
      ctx.lineTo(24, 0);
      ctx.lineTo(16, 4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Score
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 28px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.score}`, CANVAS_W / 2, 60);
      ctx.textAlign = 'left';
      ctx.shadowBlur = 0;
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;
      s.frameCount++;

      // Stars scroll
      for (const star of s.bgStars) {
        star.x -= star.speed;
        if (star.x < 0) { star.x = CANVAS_W; star.y = Math.random() * CANVAS_H; }
      }

      // Bird physics
      s.bird.vy += GRAVITY;
      s.bird.y += s.bird.vy;

      // Pipes
      for (const pipe of s.pipes) pipe.x -= PIPE_SPEED;
      s.pipes = s.pipes.filter(p => p.x > -PIPE_W - 10);
      if (s.pipes.length === 0 || s.pipes[s.pipes.length - 1].x < CANVAS_W - 220) {
        s.pipes.push({ x: CANVAS_W, topH: 80 + Math.random() * (CANVAS_H - PIPE_GAP - 160), scored: false });
      }

      // Score
      for (const pipe of s.pipes) {
        if (!pipe.scored && pipe.x + PIPE_W < BIRD_X) {
          pipe.scored = true;
          s.score++;
          setDisplayScore(s.score);
        }
      }

      // Particles
      for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.06; }
      s.particles = s.particles.filter(pt => pt.life > 0);

      // Collision
      const birdR = 12;
      if (s.bird.y - birdR < 0 || s.bird.y + birdR > CANVAS_H) {
        s.gameOver = true; s.running = false;
        if (s.score > s.highScore) s.highScore = s.score;
        setGameState('over');
        return;
      }
      for (const pipe of s.pipes) {
        if (BIRD_X + birdR > pipe.x + 4 && BIRD_X - birdR < pipe.x + PIPE_W - 4) {
          if (s.bird.y - birdR < pipe.topH || s.bird.y + birdR > pipe.topH + PIPE_GAP) {
            s.gameOver = true; s.running = false;
            if (s.score > s.highScore) s.highScore = s.score;
            setGameState('over');
            return;
          }
        }
      }
    };

    const loop = () => { update(); draw(); animRef.current = requestAnimationFrame(loop); };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-green-500/30 rounded-lg"
          style={{ maxWidth: '100%', maxHeight: '70vh', boxShadow: '0 0 30px rgba(74,222,128,0.3)' }}
          onClick={() => { if (!stateRef.current.running || stateRef.current.gameOver) startGame(); else flap(); }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-2xl text-green-400 mb-2" style={{ textShadow: '0 0 20px #4ade80' }}>PIXEL VOYAGE</h2>
            <p className="font-rajdhani text-green-300 text-lg mb-6">Fly through the neon sky</p>
            <button onClick={startGame} className="font-arcade text-sm bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded border border-green-400 transition-all">TAP TO FLY</button>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>CRASHED!</h2>
            <p className="font-arcade text-green-400 text-xl mb-1">{displayScore}</p>
            <p className="font-arcade text-yellow-400 text-sm mb-6">BEST: {stateRef.current.highScore}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded border border-green-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-green-400/60 text-sm">SPACE / Click to flap</p>
    </div>
  );
}

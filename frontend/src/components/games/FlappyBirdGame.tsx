import { useEffect, useRef, useState, useCallback } from 'react';

const W = 400;
const H = 500;
const BIRD_X = 80;
const BIRD_R = 16;
const GRAVITY = 0.4;
const FLAP_FORCE = -8;
const PIPE_W = 52;
const PIPE_GAP = 140;
const PIPE_SPEED = 3;

type Pipe = { x: number; gapY: number; scored: boolean };

function makePipe(): Pipe {
  return { x: W + 60, gapY: 120 + Math.random() * (H - 280), scored: false };
}

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    bird: { y: H / 2, vy: 0 },
    pipes: [] as Pipe[],
    score: 0,
    highScore: 0,
    gameOver: false,
    started: false,
    frameCount: 0,
  });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#050520');
    grad.addColorStop(1, '#0a0a30');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 173 + s.frameCount * 0.2) % W, (i * 97) % (H * 0.6), 1.5, 1.5);
    }

    // Ground
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(0, H - 40, W, 3);

    // Pipes
    s.pipes.forEach(p => {
      // Top pipe
      ctx.shadowColor = '#c542f5';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#c542f5';
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY - PIPE_GAP / 2);
      ctx.fillRect(p.x - 4, p.gapY - PIPE_GAP / 2 - 20, PIPE_W + 8, 20);
      // Bottom pipe
      ctx.fillRect(p.x, p.gapY + PIPE_GAP / 2, PIPE_W, H - (p.gapY + PIPE_GAP / 2));
      ctx.fillRect(p.x - 4, p.gapY + PIPE_GAP / 2, PIPE_W + 8, 20);
      ctx.shadowBlur = 0;
    });

    // Bird
    const by = s.bird.y;
    const angle = Math.min(Math.max(s.bird.vy * 3, -30), 60) * (Math.PI / 180);
    ctx.save();
    ctx.translate(BIRD_X, by);
    ctx.rotate(angle);
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R, BIRD_R * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing
    ctx.fillStyle = '#0080aa';
    ctx.beginPath();
    ctx.ellipse(-4, 4, 10, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#f5e642';
    ctx.beginPath();
    ctx.moveTo(BIRD_R, -2);
    ctx.lineTo(BIRD_R + 10, 0);
    ctx.lineTo(BIRD_R, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.fillText(`${s.score}`, W / 2, 50);
    ctx.shadowBlur = 0;
    ctx.font = '12px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`BEST: ${s.highScore}`, W / 2, 70);
    ctx.textAlign = 'left';
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;
    if (!s.started) {
      s.started = true;
      setStarted(true);
    }
    s.bird.vy = FLAP_FORCE;
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;
    if (!s.started) { draw(); rafRef.current = requestAnimationFrame(loop); return; }

    s.frameCount++;
    s.bird.vy += GRAVITY;
    s.bird.y += s.bird.vy;

    // Spawn pipes
    if (s.frameCount % 90 === 0) s.pipes.push(makePipe());

    // Move pipes
    s.pipes.forEach(p => { p.x -= PIPE_SPEED; });
    s.pipes = s.pipes.filter(p => p.x > -PIPE_W - 10);

    // Score
    s.pipes.forEach(p => {
      if (!p.scored && p.x + PIPE_W < BIRD_X) {
        p.scored = true;
        s.score++;
        setScore(s.score);
        if (s.score > s.highScore) { s.highScore = s.score; setHighScore(s.score); }
      }
    });

    // Collision
    const by = s.bird.y;
    if (by - BIRD_R < 0 || by + BIRD_R > H - 40) {
      s.gameOver = true;
      setGameOver(true);
      draw();
      return;
    }
    for (const p of s.pipes) {
      if (
        BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W &&
        (by - BIRD_R < p.gapY - PIPE_GAP / 2 || by + BIRD_R > p.gapY + PIPE_GAP / 2)
      ) {
        s.gameOver = true;
        setGameOver(true);
        draw();
        return;
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.bird = { y: H / 2, vy: 0 };
    s.pipes = [];
    s.score = 0;
    s.gameOver = false;
    s.started = false;
    s.frameCount = 0;
    setScore(0); setGameOver(false); setStarted(false);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flap]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="font-orbitron text-xs text-foreground/50">SPACE / CLICK to flap</div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="border border-neon-cyan/30 rounded cursor-pointer"
          style={{ boxShadow: '0 0 20px rgba(0,245,255,0.15)' }}
          onClick={flap}
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded gap-4">
            <div className="font-arcade text-lg neon-text-pink">GAME OVER</div>
            <div className="font-orbitron text-sm text-foreground/70">Score: <span className="neon-text-cyan">{score}</span></div>
            <div className="font-orbitron text-sm text-foreground/50">Best: <span className="neon-text-green">{highScore}</span></div>
            <button onClick={startGame} className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan rounded hover:bg-neon-cyan/20 transition-all" style={{ boxShadow: '0 0 10px rgba(0,245,255,0.3)' }}>
              PLAY AGAIN
            </button>
          </div>
        )}
        {!started && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded gap-4 pointer-events-none">
            <div className="font-arcade text-sm neon-text-cyan text-center leading-8">FLAPPY<br/>BIRD</div>
            <div className="font-orbitron text-xs text-foreground/60">Press SPACE or click to start</div>
          </div>
        )}
      </div>
    </div>
  );
}

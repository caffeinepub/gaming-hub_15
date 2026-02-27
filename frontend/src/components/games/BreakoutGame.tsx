import { useEffect, useRef, useState, useCallback } from 'react';

const W = 480;
const H = 520;
const PADDLE_W = 80;
const PADDLE_H = 12;
const BALL_R = 8;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_W = 44;
const BRICK_H = 18;
const BRICK_PAD = 4;
const BRICK_TOP = 50;

const BRICK_COLORS = ['#ff2d78','#ff8c00','#f5e642','#39ff14','#00f5ff','#c542f5'];

type Brick = { x: number; y: number; hp: number; color: string; alive: boolean };

function makeBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: c * (BRICK_W + BRICK_PAD) + BRICK_PAD,
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        hp: BRICK_ROWS - r,
        color: BRICK_COLORS[r],
        alive: true,
      });
    }
  }
  return bricks;
}

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    paddle: { x: W / 2 - PADDLE_W / 2 },
    ball: { x: W / 2, y: H - 80, vx: 3, vy: -4 },
    bricks: makeBricks(),
    lives: 3,
    score: 0,
    gameOver: false,
    won: false,
    started: false,
    keys: { left: false, right: false },
  });
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Bricks
    s.bricks.forEach(b => {
      if (!b.alive) return;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
      ctx.shadowBlur = 0;
      if (b.hp > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(b.x, b.y, BRICK_W, 3);
      }
    });

    // Paddle
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(s.paddle.x, H - 30, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;

    // Ball
    ctx.shadowColor = '#f5e642';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#f5e642';
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Lives dots
    for (let i = 0; i < s.lives; i++) {
      ctx.fillStyle = '#ff2d78';
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(12 + i * 20, 20, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.score}`, W - 10, 25);
    ctx.textAlign = 'left';
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || s.won || !s.started) return;

    // Paddle movement
    if (s.keys.left) s.paddle.x = Math.max(0, s.paddle.x - 6);
    if (s.keys.right) s.paddle.x = Math.min(W - PADDLE_W, s.paddle.x + 6);

    // Ball movement
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    // Wall bounce
    if (s.ball.x - BALL_R < 0) { s.ball.x = BALL_R; s.ball.vx = Math.abs(s.ball.vx); }
    if (s.ball.x + BALL_R > W) { s.ball.x = W - BALL_R; s.ball.vx = -Math.abs(s.ball.vx); }
    if (s.ball.y - BALL_R < 0) { s.ball.y = BALL_R; s.ball.vy = Math.abs(s.ball.vy); }

    // Paddle collision
    if (
      s.ball.y + BALL_R >= H - 30 &&
      s.ball.y + BALL_R <= H - 30 + PADDLE_H &&
      s.ball.x >= s.paddle.x &&
      s.ball.x <= s.paddle.x + PADDLE_W
    ) {
      const rel = (s.ball.x - (s.paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
      const angle = rel * 60 * (Math.PI / 180);
      const speed = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2);
      s.ball.vx = speed * Math.sin(angle);
      s.ball.vy = -Math.abs(speed * Math.cos(angle));
    }

    // Ball lost
    if (s.ball.y - BALL_R > H) {
      s.lives -= 1;
      setLives(s.lives);
      if (s.lives <= 0) {
        s.gameOver = true;
        setGameOver(true);
        draw();
        return;
      }
      s.ball = { x: W / 2, y: H - 80, vx: 3, vy: -4 };
    }

    // Brick collision
    for (const b of s.bricks) {
      if (!b.alive) continue;
      if (
        s.ball.x + BALL_R > b.x && s.ball.x - BALL_R < b.x + BRICK_W &&
        s.ball.y + BALL_R > b.y && s.ball.y - BALL_R < b.y + BRICK_H
      ) {
        b.hp -= 1;
        if (b.hp <= 0) { b.alive = false; s.score += 10; setScore(s.score); }
        // Determine bounce direction
        const overlapLeft = s.ball.x + BALL_R - b.x;
        const overlapRight = b.x + BRICK_W - (s.ball.x - BALL_R);
        const overlapTop = s.ball.y + BALL_R - b.y;
        const overlapBottom = b.y + BRICK_H - (s.ball.y - BALL_R);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        if (minOverlap === overlapTop || minOverlap === overlapBottom) s.ball.vy *= -1;
        else s.ball.vx *= -1;
        break;
      }
    }

    // Win check
    if (s.bricks.every(b => !b.alive)) {
      s.won = true;
      setWon(true);
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.paddle = { x: W / 2 - PADDLE_W / 2 };
    s.ball = { x: W / 2, y: H - 80, vx: 3, vy: -4 };
    s.bricks = makeBricks();
    s.lives = 3;
    s.score = 0;
    s.gameOver = false;
    s.won = false;
    s.started = true;
    setLives(3); setScore(0); setGameOver(false); setWon(false); setStarted(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  useEffect(() => {
    if (started && !gameOver && !won) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [started, gameOver, won, loop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stateRef.current.keys.left = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); stateRef.current.keys.right = true; }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = false;
    };
    const move = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      stateRef.current.paddle.x = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2));
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    canvasRef.current?.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center gap-8 font-orbitron text-sm">
        <div className="flex items-center gap-2"><span className="text-foreground/50">SCORE</span><span className="neon-text-green font-bold text-lg">{score}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">LIVES</span><span className="neon-text-pink font-bold text-lg">{lives}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">CONTROLS</span><span className="text-foreground/70 text-xs">← → / MOUSE</span></div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-neon-pink/30 rounded" style={{ boxShadow: '0 0 20px rgba(255,45,120,0.15)' }} />
        {(!started || gameOver || won) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded gap-4">
            {won && <div className="font-arcade text-lg neon-text-green">YOU WIN!</div>}
            {gameOver && <div className="font-arcade text-lg neon-text-pink">GAME OVER</div>}
            {!started && !gameOver && !won && <div className="font-arcade text-base neon-text-cyan text-center leading-8">BREAKOUT</div>}
            {(gameOver || won) && <div className="font-orbitron text-sm text-foreground/70">Score: <span className="neon-text-green">{score}</span></div>}
            <div className="font-orbitron text-xs text-foreground/50 text-center">Move mouse or ← → to control paddle</div>
            <button onClick={startGame} className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-pink/50 bg-neon-pink/10 text-neon-pink rounded hover:bg-neon-pink/20 transition-all" style={{ boxShadow: '0 0 10px rgba(255,45,120,0.3)' }}>
              {gameOver || won ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

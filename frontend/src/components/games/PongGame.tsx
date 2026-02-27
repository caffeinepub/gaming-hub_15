import { useEffect, useRef, useState, useCallback } from 'react';

const W = 600;
const H = 400;
const PADDLE_W = 12;
const PADDLE_H = 70;
const BALL_SIZE = 12;
const PADDLE_SPEED = 6;
const WIN_SCORE = 7;

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    p1: { y: H / 2 - PADDLE_H / 2, score: 0 },
    p2: { y: H / 2 - PADDLE_H / 2, score: 0 },
    ball: { x: W / 2, y: H / 2, vx: 4, vy: 3 },
    gameOver: false,
    winner: 0,
    started: false,
    keys: { w: false, s: false, up: false, down: false },
  });
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(0);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    // Center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.font = 'bold 48px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,245,255,0.3)';
    ctx.fillText(`${s.p1.score}`, W / 4, 70);
    ctx.fillText(`${s.p2.score}`, (3 * W) / 4, 70);

    // Paddles
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(20, s.p1.y, PADDLE_W, PADDLE_H);
    ctx.fillRect(W - 20 - PADDLE_W, s.p2.y, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;

    // Ball
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff2d78';
    ctx.fillRect(s.ball.x - BALL_SIZE / 2, s.ball.y - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE);
    ctx.shadowBlur = 0;

    // Labels
    ctx.font = '11px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'left';
    ctx.fillText('W/S', 22, H - 10);
    ctx.textAlign = 'right';
    ctx.fillText('↑/↓', W - 22, H - 10);
    ctx.textAlign = 'left';
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || !s.started) return;

    // Paddle movement
    if (s.keys.w) s.p1.y = Math.max(0, s.p1.y - PADDLE_SPEED);
    if (s.keys.s) s.p1.y = Math.min(H - PADDLE_H, s.p1.y + PADDLE_SPEED);
    if (s.keys.up) s.p2.y = Math.max(0, s.p2.y - PADDLE_SPEED);
    if (s.keys.down) s.p2.y = Math.min(H - PADDLE_H, s.p2.y + PADDLE_SPEED);

    // Ball movement
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    // Top/bottom bounce
    if (s.ball.y - BALL_SIZE / 2 <= 0) { s.ball.y = BALL_SIZE / 2; s.ball.vy = Math.abs(s.ball.vy); }
    if (s.ball.y + BALL_SIZE / 2 >= H) { s.ball.y = H - BALL_SIZE / 2; s.ball.vy = -Math.abs(s.ball.vy); }

    // Paddle 1 collision
    if (
      s.ball.x - BALL_SIZE / 2 <= 20 + PADDLE_W &&
      s.ball.x - BALL_SIZE / 2 >= 20 &&
      s.ball.y >= s.p1.y && s.ball.y <= s.p1.y + PADDLE_H
    ) {
      s.ball.vx = Math.abs(s.ball.vx) * 1.05;
      const rel = (s.ball.y - (s.p1.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      s.ball.vy = rel * 6;
    }

    // Paddle 2 collision
    if (
      s.ball.x + BALL_SIZE / 2 >= W - 20 - PADDLE_W &&
      s.ball.x + BALL_SIZE / 2 <= W - 20 &&
      s.ball.y >= s.p2.y && s.ball.y <= s.p2.y + PADDLE_H
    ) {
      s.ball.vx = -Math.abs(s.ball.vx) * 1.05;
      const rel = (s.ball.y - (s.p2.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      s.ball.vy = rel * 6;
    }

    // Clamp ball speed
    const speed = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2);
    if (speed > 12) { s.ball.vx = (s.ball.vx / speed) * 12; s.ball.vy = (s.ball.vy / speed) * 12; }

    // Score
    if (s.ball.x < 0) {
      s.p2.score++;
      setP2Score(s.p2.score);
      if (s.p2.score >= WIN_SCORE) { s.gameOver = true; s.winner = 2; setGameOver(true); setWinner(2); draw(); return; }
      s.ball = { x: W / 2, y: H / 2, vx: -4, vy: (Math.random() - 0.5) * 6 };
    }
    if (s.ball.x > W) {
      s.p1.score++;
      setP1Score(s.p1.score);
      if (s.p1.score >= WIN_SCORE) { s.gameOver = true; s.winner = 1; setGameOver(true); setWinner(1); draw(); return; }
      s.ball = { x: W / 2, y: H / 2, vx: 4, vy: (Math.random() - 0.5) * 6 };
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.p1 = { y: H / 2 - PADDLE_H / 2, score: 0 };
    s.p2 = { y: H / 2 - PADDLE_H / 2, score: 0 };
    s.ball = { x: W / 2, y: H / 2, vx: 4, vy: 3 };
    s.gameOver = false;
    s.winner = 0;
    s.started = true;
    setP1Score(0); setP2Score(0); setGameOver(false); setWinner(0); setStarted(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => { draw(); return () => cancelAnimationFrame(rafRef.current); }, [draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') stateRef.current.keys.w = true;
      if (e.key === 's' || e.key === 'S') stateRef.current.keys.s = true;
      if (e.key === 'ArrowUp') { e.preventDefault(); stateRef.current.keys.up = true; }
      if (e.key === 'ArrowDown') { e.preventDefault(); stateRef.current.keys.down = true; }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') stateRef.current.keys.w = false;
      if (e.key === 's' || e.key === 'S') stateRef.current.keys.s = false;
      if (e.key === 'ArrowUp') stateRef.current.keys.up = false;
      if (e.key === 'ArrowDown') stateRef.current.keys.down = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center gap-12 font-orbitron text-sm">
        <div className="flex items-center gap-2"><span className="text-foreground/50">P1</span><span className="neon-text-cyan font-bold text-2xl">{p1Score}</span></div>
        <div className="text-foreground/30 text-xs">FIRST TO {WIN_SCORE}</div>
        <div className="flex items-center gap-2"><span className="neon-text-cyan font-bold text-2xl">{p2Score}</span><span className="text-foreground/50">P2</span></div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-neon-cyan/30 rounded" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.15)' }} />
        {(!started || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded gap-4">
            {gameOver && <div className="font-arcade text-lg neon-text-yellow">PLAYER {winner} WINS!</div>}
            {!started && !gameOver && <div className="font-arcade text-base neon-text-cyan text-center leading-8">PONG</div>}
            <div className="font-orbitron text-xs text-foreground/50 text-center">P1: W/S keys  |  P2: ↑/↓ keys</div>
            <button onClick={startGame} className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan rounded hover:bg-neon-cyan/20 transition-all" style={{ boxShadow: '0 0 10px rgba(0,245,255,0.3)' }}>
              {gameOver ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';

const W = 600;
const H = 400;
const GRAVITY = 0.5;
const JUMP_FORCE = -11;
const PLAYER_W = 24;
const PLAYER_H = 32;
const SCROLL_THRESHOLD = W * 0.4;

type Platform = { x: number; y: number; w: number; h: number };
type Coin = { x: number; y: number; collected: boolean };
type Enemy = { x: number; y: number; vx: number; dir: number; patrolLeft: number; patrolRight: number };

const PLATFORMS: Platform[] = [
  { x: 0, y: 340, w: 300, h: 20 },
  { x: 350, y: 300, w: 150, h: 20 },
  { x: 550, y: 260, w: 120, h: 20 },
  { x: 720, y: 220, w: 180, h: 20 },
  { x: 950, y: 280, w: 150, h: 20 },
  { x: 1150, y: 240, w: 200, h: 20 },
  { x: 1400, y: 200, w: 150, h: 20 },
  { x: 1600, y: 260, w: 200, h: 20 },
  { x: 1850, y: 220, w: 150, h: 20 },
  { x: 2050, y: 340, w: 400, h: 20 },
];

const COINS_DATA: Coin[] = [
  { x: 380, y: 270, collected: false },
  { x: 580, y: 230, collected: false },
  { x: 750, y: 190, collected: false },
  { x: 800, y: 190, collected: false },
  { x: 980, y: 250, collected: false },
  { x: 1180, y: 210, collected: false },
  { x: 1230, y: 210, collected: false },
  { x: 1430, y: 170, collected: false },
  { x: 1630, y: 230, collected: false },
  { x: 1880, y: 190, collected: false },
  { x: 2100, y: 310, collected: false },
  { x: 2150, y: 310, collected: false },
  { x: 2200, y: 310, collected: false },
];

const ENEMIES_DATA: Enemy[] = [
  { x: 360, y: 272, vx: 1.5, dir: 1, patrolLeft: 355, patrolRight: 490 },
  { x: 960, y: 252, vx: 1.5, dir: 1, patrolLeft: 955, patrolRight: 1090 },
  { x: 1160, y: 212, vx: 1.5, dir: 1, patrolLeft: 1155, patrolRight: 1340 },
  { x: 2060, y: 312, vx: 1.5, dir: 1, patrolLeft: 2055, patrolRight: 2440 },
];

const GOAL_X = 2380;
const GOAL_Y = 280;

export default function PlatformerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: { x: 50, y: 280, vx: 0, vy: 0, onGround: false, facing: 1 },
    coins: COINS_DATA.map(c => ({ ...c })),
    enemies: ENEMIES_DATA.map(e => ({ ...e })),
    cameraX: 0,
    score: 0,
    lives: 3,
    gameOver: false,
    won: false,
    started: false,
    keys: { left: false, right: false, jump: false },
    jumpPressed: false,
  });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    const cam = s.cameraX;

    ctx.fillStyle = '#050520';
    ctx.fillRect(0, 0, W, H);

    // Background stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 50; i++) {
      ctx.fillRect(((i * 173 - cam * 0.2) % (W + 100) + W + 100) % (W + 100) - 50, (i * 97) % H, 1.5, 1.5);
    }

    ctx.save();
    ctx.translate(-cam, 0);

    // Platforms
    PLATFORMS.forEach(p => {
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.shadowBlur = 0;
    });

    // Goal flag
    ctx.shadowColor = '#f5e642';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f5e642';
    ctx.fillRect(GOAL_X, GOAL_Y - 60, 4, 60);
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(GOAL_X + 4, GOAL_Y - 60, 24, 16);
    ctx.shadowBlur = 0;

    // Coins
    s.coins.forEach(c => {
      if (c.collected) return;
      ctx.shadowColor = '#f5e642';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f5e642';
      ctx.beginPath();
      ctx.arc(c.x + 8, c.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Enemies
    s.enemies.forEach(e => {
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff2d78';
      ctx.fillRect(e.x, e.y, 28, 28);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(e.x + 5, e.y + 6, 6, 6);
      ctx.fillRect(e.x + 17, e.y + 6, 6, 6);
      ctx.shadowBlur = 0;
    });

    // Player
    const p = s.player;
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(p.x, p.y, PLAYER_W, PLAYER_H);
    // Eyes
    ctx.fillStyle = '#0a0a0a';
    const eyeX = p.facing > 0 ? p.x + 14 : p.x + 4;
    ctx.fillRect(eyeX, p.y + 8, 5, 5);
    ctx.shadowBlur = 0;

    ctx.restore();

    // HUD
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${s.score}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`LIVES: ${s.lives}`, W - 10, 25);
    ctx.textAlign = 'left';
  }, []);

  const resetPlayer = useCallback(() => {
    stateRef.current.player = { x: 50, y: 280, vx: 0, vy: 0, onGround: false, facing: 1 };
    stateRef.current.cameraX = 0;
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || s.won || !s.started) return;
    frameRef.current++;

    const p = s.player;

    // Input
    if (s.keys.left) { p.vx = -4; p.facing = -1; }
    else if (s.keys.right) { p.vx = 4; p.facing = 1; }
    else p.vx *= 0.8;

    if (s.keys.jump && p.onGround && !s.jumpPressed) {
      p.vy = JUMP_FORCE;
      s.jumpPressed = true;
    }
    if (!s.keys.jump) s.jumpPressed = false;

    // Physics
    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.onGround = false;

    // Platform collision
    PLATFORMS.forEach(pl => {
      if (
        p.x + PLAYER_W > pl.x && p.x < pl.x + pl.w &&
        p.y + PLAYER_H > pl.y && p.y + PLAYER_H < pl.y + pl.h + 10 &&
        p.vy >= 0
      ) {
        p.y = pl.y - PLAYER_H;
        p.vy = 0;
        p.onGround = true;
      }
    });

    // Bounds
    if (p.x < 0) p.x = 0;
    if (p.y > H + 50) {
      s.lives -= 1;
      setLives(s.lives);
      if (s.lives <= 0) { s.gameOver = true; setGameOver(true); draw(); return; }
      resetPlayer();
    }

    // Camera
    const targetCam = p.x - SCROLL_THRESHOLD;
    s.cameraX = Math.max(0, targetCam);

    // Coins
    s.coins.forEach(c => {
      if (c.collected) return;
      if (p.x + PLAYER_W > c.x && p.x < c.x + 16 && p.y + PLAYER_H > c.y && p.y < c.y + 16) {
        c.collected = true;
        s.score += 10;
        setScore(s.score);
      }
    });

    // Enemies
    s.enemies.forEach(e => {
      e.x += e.vx * e.dir;
      if (e.x <= e.patrolLeft || e.x >= e.patrolRight) e.dir *= -1;
      // Collision with player
      if (p.x + PLAYER_W > e.x && p.x < e.x + 28 && p.y + PLAYER_H > e.y && p.y < e.y + 28) {
        // Stomp from above
        if (p.vy > 0 && p.y + PLAYER_H < e.y + 14) {
          e.x = -1000; // remove
          p.vy = -7;
          s.score += 50;
          setScore(s.score);
        } else {
          s.lives -= 1;
          setLives(s.lives);
          if (s.lives <= 0) { s.gameOver = true; setGameOver(true); draw(); return; }
          resetPlayer();
        }
      }
    });

    // Goal
    if (p.x + PLAYER_W > GOAL_X && p.x < GOAL_X + 28 && p.y + PLAYER_H > GOAL_Y - 60 && p.y < GOAL_Y) {
      s.won = true;
      setWon(true);
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, resetPlayer]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.coins = COINS_DATA.map(c => ({ ...c }));
    s.enemies = ENEMIES_DATA.map(e => ({ ...e }));
    s.score = 0;
    s.lives = 3;
    s.gameOver = false;
    s.won = false;
    s.started = true;
    resetPlayer();
    setScore(0); setLives(3); setGameOver(false); setWon(false); setStarted(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, resetPlayer]);

  useEffect(() => { draw(); return () => cancelAnimationFrame(rafRef.current); }, [draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); stateRef.current.keys.left = true; }
      if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); stateRef.current.keys.right = true; }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') { e.preventDefault(); stateRef.current.keys.jump = true; }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') stateRef.current.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') stateRef.current.keys.jump = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center gap-8 font-orbitron text-sm">
        <div className="flex items-center gap-2"><span className="text-foreground/50">SCORE</span><span className="neon-text-yellow font-bold text-lg">{score}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">LIVES</span><span className="neon-text-pink font-bold text-lg">{lives}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">CONTROLS</span><span className="text-foreground/70 text-xs">← → / WASD + SPACE/↑</span></div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-neon-green/30 rounded" style={{ boxShadow: '0 0 20px rgba(57,255,20,0.15)' }} />
        {(!started || gameOver || won) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded gap-4">
            {won && <div className="font-arcade text-lg neon-text-green">YOU WIN!</div>}
            {gameOver && <div className="font-arcade text-lg neon-text-pink">GAME OVER</div>}
            {!started && !gameOver && !won && <div className="font-arcade text-sm neon-text-cyan text-center leading-8">PLATFORMER</div>}
            {(gameOver || won) && <div className="font-orbitron text-sm text-foreground/70">Score: <span className="neon-text-yellow">{score}</span></div>}
            <div className="font-orbitron text-xs text-foreground/50 text-center">← → Move  Space/↑ Jump  Stomp enemies!</div>
            <button onClick={startGame} className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-green/50 bg-neon-green/10 text-neon-green rounded hover:bg-neon-green/20 transition-all" style={{ boxShadow: '0 0 10px rgba(57,255,20,0.3)' }}>
              {gameOver || won ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

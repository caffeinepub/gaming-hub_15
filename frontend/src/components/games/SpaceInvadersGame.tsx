import { useEffect, useRef, useState, useCallback } from 'react';

const W = 480;
const H = 520;
const ALIEN_ROWS = 4;
const ALIEN_COLS = 10;
const ALIEN_W = 36;
const ALIEN_H = 28;
const ALIEN_PAD_X = 8;
const ALIEN_PAD_Y = 12;
const PLAYER_W = 40;
const PLAYER_H = 20;
const BULLET_W = 3;
const BULLET_H = 12;

type Bullet = { x: number; y: number; vy: number };
type Alien = { x: number; y: number; alive: boolean; row: number };

function makeAliens(): Alien[] {
  const aliens: Alien[] = [];
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        x: 30 + c * (ALIEN_W + ALIEN_PAD_X),
        y: 60 + r * (ALIEN_H + ALIEN_PAD_Y),
        alive: true,
        row: r,
      });
    }
  }
  return aliens;
}

const ALIEN_COLORS = ['#ff2d78', '#ff8c00', '#f5e642', '#39ff14'];

export default function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: { x: W / 2 - PLAYER_W / 2 },
    bullets: [] as Bullet[],
    aliens: makeAliens(),
    alienDir: 1,
    alienSpeed: 0.5,
    alienTick: 0,
    lives: 3,
    score: 0,
    wave: 1,
    gameOver: false,
    started: false,
    keys: { left: false, right: false, fire: false },
    lastFire: 0,
    animFrame: 0,
  });
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
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

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + 50) % W);
      const sy = ((i * 97 + 30) % H);
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Aliens
    s.aliens.forEach(a => {
      if (!a.alive) return;
      const color = ALIEN_COLORS[a.row % ALIEN_COLORS.length];
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      // Body
      ctx.fillRect(a.x + 8, a.y + 4, ALIEN_W - 16, ALIEN_H - 8);
      // Legs
      const legAnim = s.animFrame % 2;
      if (legAnim === 0) {
        ctx.fillRect(a.x + 2, a.y + ALIEN_H - 8, 8, 8);
        ctx.fillRect(a.x + ALIEN_W - 10, a.y + ALIEN_H - 8, 8, 8);
      } else {
        ctx.fillRect(a.x + 6, a.y + ALIEN_H - 8, 8, 8);
        ctx.fillRect(a.x + ALIEN_W - 14, a.y + ALIEN_H - 8, 8, 8);
      }
      // Eyes
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(a.x + 10, a.y + 8, 5, 5);
      ctx.fillRect(a.x + ALIEN_W - 15, a.y + 8, 5, 5);
      ctx.shadowBlur = 0;
    });

    // Player
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00f5ff';
    const px = s.player.x;
    const py = H - 40;
    ctx.fillRect(px + 15, py - 10, 10, 10);
    ctx.fillRect(px, py, PLAYER_W, PLAYER_H);
    ctx.shadowBlur = 0;

    // Bullets
    s.bullets.forEach(b => {
      const isPlayer = b.vy < 0;
      ctx.shadowColor = isPlayer ? '#39ff14' : '#ff2d78';
      ctx.shadowBlur = 10;
      ctx.fillStyle = isPlayer ? '#39ff14' : '#ff2d78';
      ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H);
      ctx.shadowBlur = 0;
    });

    // HUD
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${s.score}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`WAVE: ${s.wave}`, W - 10, 25);
    ctx.textAlign = 'center';
    for (let i = 0; i < s.lives; i++) {
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(W / 2 - 30 + i * 25, 12, 18, 12);
      ctx.shadowBlur = 0;
    }
    ctx.textAlign = 'left';
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || !s.started) return;

    s.animFrame++;

    // Player movement
    if (s.keys.left) s.player.x = Math.max(0, s.player.x - 5);
    if (s.keys.right) s.player.x = Math.min(W - PLAYER_W, s.player.x + 5);

    // Fire
    const now = Date.now();
    if (s.keys.fire && now - s.lastFire > 400) {
      s.bullets.push({ x: s.player.x + PLAYER_W / 2, y: H - 50, vy: -8 });
      s.lastFire = now;
    }

    // Enemy fire
    if (Math.random() < 0.01) {
      const alive = s.aliens.filter(a => a.alive);
      if (alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        s.bullets.push({ x: shooter.x + ALIEN_W / 2, y: shooter.y + ALIEN_H, vy: 4 });
      }
    }

    // Move bullets
    s.bullets = s.bullets.filter(b => b.y > -20 && b.y < H + 20);
    s.bullets.forEach(b => { b.y += b.vy; });

    // Move aliens
    s.alienTick++;
    if (s.alienTick >= 30) {
      s.alienTick = 0;
      let hitEdge = false;
      s.aliens.forEach(a => {
        if (!a.alive) return;
        a.x += s.alienDir * s.alienSpeed * 30;
        if (a.x <= 0 || a.x + ALIEN_W >= W) hitEdge = true;
      });
      if (hitEdge) {
        s.alienDir *= -1;
        s.aliens.forEach(a => { if (a.alive) a.y += 15; });
      }
    }

    // Bullet-alien collision
    for (const b of s.bullets) {
      if (b.vy >= 0) continue;
      for (const a of s.aliens) {
        if (!a.alive) continue;
        if (b.x > a.x && b.x < a.x + ALIEN_W && b.y > a.y && b.y < a.y + ALIEN_H) {
          a.alive = false;
          b.y = -100;
          s.score += 10 * (ALIEN_ROWS - a.row);
          setScore(s.score);
        }
      }
    }

    // Enemy bullet hits player
    for (const b of s.bullets) {
      if (b.vy <= 0) continue;
      const px = s.player.x;
      const py = H - 40;
      if (b.x > px && b.x < px + PLAYER_W && b.y > py - 10 && b.y < py + PLAYER_H) {
        b.y = H + 100;
        s.lives -= 1;
        setLives(s.lives);
        if (s.lives <= 0) { s.gameOver = true; setGameOver(true); draw(); return; }
      }
    }

    // Aliens reach bottom
    if (s.aliens.some(a => a.alive && a.y + ALIEN_H >= H - 50)) {
      s.gameOver = true;
      setGameOver(true);
      draw();
      return;
    }

    // Wave clear
    if (s.aliens.every(a => !a.alive)) {
      s.wave += 1;
      setWave(s.wave);
      s.aliens = makeAliens();
      s.alienSpeed = Math.min(3, 0.5 + s.wave * 0.3);
      s.bullets = [];
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.player = { x: W / 2 - PLAYER_W / 2 };
    s.bullets = [];
    s.aliens = makeAliens();
    s.alienDir = 1;
    s.alienSpeed = 0.5;
    s.alienTick = 0;
    s.lives = 3;
    s.score = 0;
    s.wave = 1;
    s.gameOver = false;
    s.started = true;
    s.lastFire = 0;
    s.animFrame = 0;
    setLives(3); setScore(0); setWave(1); setGameOver(false); setStarted(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => { draw(); return () => cancelAnimationFrame(rafRef.current); }, [draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stateRef.current.keys.left = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); stateRef.current.keys.right = true; }
      if (e.key === ' ') { e.preventDefault(); stateRef.current.keys.fire = true; }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = false;
      if (e.key === ' ') stateRef.current.keys.fire = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center gap-8 font-orbitron text-sm">
        <div className="flex items-center gap-2"><span className="text-foreground/50">SCORE</span><span className="neon-text-green font-bold text-lg">{score}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">WAVE</span><span className="neon-text-cyan font-bold text-lg">{wave}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">LIVES</span><span className="neon-text-pink font-bold text-lg">{lives}</span></div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-neon-green/30 rounded" style={{ boxShadow: '0 0 20px rgba(57,255,20,0.15)' }} />
        {(!started || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded gap-4">
            {gameOver && <div className="font-arcade text-lg neon-text-pink">GAME OVER</div>}
            {!started && !gameOver && <div className="font-arcade text-sm neon-text-green text-center leading-8">SPACE<br/>INVADERS</div>}
            {gameOver && <div className="font-orbitron text-sm text-foreground/70">Score: <span className="neon-text-green">{score}</span></div>}
            <div className="font-orbitron text-xs text-foreground/50 text-center">← → Move  Space Shoot</div>
            <button onClick={startGame} className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-green/50 bg-neon-green/10 text-neon-green rounded hover:bg-neon-green/20 transition-all" style={{ boxShadow: '0 0 10px rgba(57,255,20,0.3)' }}>
              {gameOver ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

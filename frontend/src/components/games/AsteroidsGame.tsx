import { useEffect, useRef, useState, useCallback } from 'react';

const W = 600;
const H = 500;

type Vec2 = { x: number; y: number };
type Asteroid = { pos: Vec2; vel: Vec2; size: number; angle: number; spin: number; verts: Vec2[] };
type Bullet = { pos: Vec2; vel: Vec2; life: number };
type Ship = { pos: Vec2; vel: Vec2; angle: number; invincible: number };

function randomVerts(size: number): Vec2[] {
  const n = 8 + Math.floor(Math.random() * 4);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = size * (0.7 + Math.random() * 0.3);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
}

function makeAsteroid(size: number, pos?: Vec2): Asteroid {
  const angle = Math.random() * Math.PI * 2;
  const speed = (1.5 + Math.random() * 1.5) * (3 / size);
  return {
    pos: pos || { x: Math.random() * W, y: Math.random() * H },
    vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
    size,
    angle: 0,
    spin: (Math.random() - 0.5) * 0.04,
    verts: randomVerts(size),
  };
}

function wrap(v: Vec2) {
  if (v.x < 0) v.x += W;
  if (v.x > W) v.x -= W;
  if (v.y < 0) v.y += H;
  if (v.y > H) v.y -= H;
}

function dist(a: Vec2, b: Vec2) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    ship: { pos: { x: W / 2, y: H / 2 }, vel: { x: 0, y: 0 }, angle: -Math.PI / 2, invincible: 0 } as Ship,
    asteroids: [] as Asteroid[],
    bullets: [] as Bullet[],
    lives: 3,
    score: 0,
    wave: 1,
    gameOver: false,
    started: false,
    keys: { left: false, right: false, up: false, fire: false },
    lastFire: 0,
  });
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number>(0);

  const spawnWave = useCallback((waveNum: number) => {
    const count = 3 + waveNum;
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < count; i++) {
      let pos: Vec2;
      do { pos = { x: Math.random() * W, y: Math.random() * H }; }
      while (dist(pos, stateRef.current.ship.pos) < 120);
      asteroids.push(makeAsteroid(40, pos));
    }
    stateRef.current.asteroids = asteroids;
  }, []);

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
    for (let i = 0; i < 80; i++) {
      ctx.fillRect((i * 173) % W, (i * 97) % H, 1.5, 1.5);
    }

    // Asteroids
    s.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.pos.x, a.pos.y);
      ctx.rotate(a.angle);
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ff2d78';
      ctx.lineWidth = 2;
      ctx.beginPath();
      a.verts.forEach((v, i) => { if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y); });
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Bullets
    s.bullets.forEach(b => {
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Ship
    if (!s.gameOver && (s.ship.invincible <= 0 || Math.floor(Date.now() / 100) % 2 === 0)) {
      ctx.save();
      ctx.translate(s.ship.pos.x, s.ship.pos.y);
      ctx.rotate(s.ship.angle);
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-14, -12);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-14, 12);
      ctx.closePath();
      ctx.stroke();
      // Thrust
      if (s.keys.up) {
        ctx.strokeStyle = '#ff8c00';
        ctx.shadowColor = '#ff8c00';
        ctx.beginPath();
        ctx.moveTo(-8, -5);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-8, 5);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // HUD
    ctx.fillStyle = '#00f5ff';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${s.score}`, 10, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`WAVE: ${s.wave}`, W - 10, 25);
    ctx.textAlign = 'center';
    for (let i = 0; i < s.lives; i++) {
      ctx.save();
      ctx.translate(W / 2 - 30 + i * 25, 18);
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-3, 0); ctx.lineTo(-6, 5); ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || !s.started) return;

    const ship = s.ship;
    const TURN = 0.06;
    const THRUST = 0.2;
    const FRICTION = 0.99;

    if (s.keys.left) ship.angle -= TURN;
    if (s.keys.right) ship.angle += TURN;
    if (s.keys.up) {
      ship.vel.x += Math.cos(ship.angle) * THRUST;
      ship.vel.y += Math.sin(ship.angle) * THRUST;
    }
    ship.vel.x *= FRICTION;
    ship.vel.y *= FRICTION;
    ship.pos.x += ship.vel.x;
    ship.pos.y += ship.vel.y;
    wrap(ship.pos);
    if (ship.invincible > 0) ship.invincible--;

    // Fire
    const now = Date.now();
    if (s.keys.fire && now - s.lastFire > 250) {
      s.bullets.push({
        pos: { x: ship.pos.x + Math.cos(ship.angle) * 22, y: ship.pos.y + Math.sin(ship.angle) * 22 },
        vel: { x: Math.cos(ship.angle) * 9 + ship.vel.x, y: Math.sin(ship.angle) * 9 + ship.vel.y },
        life: 60,
      });
      s.lastFire = now;
    }

    // Move bullets
    s.bullets.forEach(b => { b.pos.x += b.vel.x; b.pos.y += b.vel.y; wrap(b.pos); b.life--; });
    s.bullets = s.bullets.filter(b => b.life > 0);

    // Move asteroids
    s.asteroids.forEach(a => { a.pos.x += a.vel.x; a.pos.y += a.vel.y; wrap(a.pos); a.angle += a.spin; });

    // Bullet-asteroid collision
    const newAsteroids: Asteroid[] = [];
    for (const a of s.asteroids) {
      let hit = false;
      for (const b of s.bullets) {
        if (dist(b.pos, a.pos) < a.size * 0.8) {
          hit = true;
          b.life = 0;
          const pts = a.size > 30 ? 20 : a.size > 15 ? 50 : 100;
          s.score += pts;
          setScore(s.score);
          if (a.size > 15) {
            newAsteroids.push(makeAsteroid(a.size / 2, { ...a.pos }));
            newAsteroids.push(makeAsteroid(a.size / 2, { ...a.pos }));
          }
          break;
        }
      }
      if (!hit) newAsteroids.push(a);
    }
    s.asteroids = newAsteroids;
    s.bullets = s.bullets.filter(b => b.life > 0);

    // Ship-asteroid collision
    if (ship.invincible <= 0) {
      for (const a of s.asteroids) {
        if (dist(ship.pos, a.pos) < a.size * 0.7 + 12) {
          s.lives -= 1;
          setLives(s.lives);
          ship.invincible = 120;
          ship.vel = { x: 0, y: 0 };
          ship.pos = { x: W / 2, y: H / 2 };
          if (s.lives <= 0) { s.gameOver = true; setGameOver(true); draw(); return; }
          break;
        }
      }
    }

    // Wave clear
    if (s.asteroids.length === 0) {
      s.wave++;
      setWave(s.wave);
      spawnWave(s.wave);
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, spawnWave]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.ship = { pos: { x: W / 2, y: H / 2 }, vel: { x: 0, y: 0 }, angle: -Math.PI / 2, invincible: 0 };
    s.bullets = [];
    s.lives = 3;
    s.score = 0;
    s.wave = 1;
    s.gameOver = false;
    s.started = true;
    s.lastFire = 0;
    setLives(3); setScore(0); setWave(1); setGameOver(false); setStarted(true);
    spawnWave(1);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, spawnWave]);

  useEffect(() => { draw(); return () => cancelAnimationFrame(rafRef.current); }, [draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stateRef.current.keys.left = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); stateRef.current.keys.right = true; }
      if (e.key === 'ArrowUp') { e.preventDefault(); stateRef.current.keys.up = true; }
      if (e.key === ' ') { e.preventDefault(); stateRef.current.keys.fire = true; }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight') stateRef.current.keys.right = false;
      if (e.key === 'ArrowUp') stateRef.current.keys.up = false;
      if (e.key === ' ') stateRef.current.keys.fire = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex items-center gap-8 font-orbitron text-sm">
        <div className="flex items-center gap-2"><span className="text-foreground/50">SCORE</span><span className="neon-text-cyan font-bold text-lg">{score}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">WAVE</span><span className="neon-text-green font-bold text-lg">{wave}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">LIVES</span><span className="neon-text-pink font-bold text-lg">{lives}</span></div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-neon-cyan/30 rounded" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.15)' }} />
        {(!started || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded gap-4">
            {gameOver && <div className="font-arcade text-lg neon-text-pink">GAME OVER</div>}
            {!started && !gameOver && <div className="font-arcade text-sm neon-text-cyan text-center leading-8">ASTEROIDS</div>}
            {gameOver && <div className="font-orbitron text-sm text-foreground/70">Score: <span className="neon-text-cyan">{score}</span></div>}
            <div className="font-orbitron text-xs text-foreground/50 text-center">← → Rotate  ↑ Thrust  Space Shoot</div>
            <button onClick={startGame} className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan rounded hover:bg-neon-cyan/20 transition-all" style={{ boxShadow: '0 0 10px rgba(0,245,255,0.3)' }}>
              {gameOver ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

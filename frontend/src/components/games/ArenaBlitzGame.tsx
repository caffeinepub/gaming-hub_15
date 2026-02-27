import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 700;
const CANVAS_H = 500;
const PLAYER_SPEED = 4;
const PLAYER_R = 18;
const BULLET_SPEED = 8;
const ARENA_PADDING = 40;

interface Enemy {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  r: number;
  color: string;
  shootTimer: number;
  type: 'chaser' | 'shooter' | 'bouncer';
}

interface Bullet {
  x: number; y: number; vx: number; vy: number; fromPlayer: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
}

let enemyId = 0;

export default function ArenaBlitzGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    round: 1,
    player: { x: CANVAS_W / 2, y: CANVAS_H / 2, hp: 5, maxHp: 5, shootTimer: 0, iframes: 0 },
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    frameCount: 0,
    highScore: 0,
    keys: new Set<string>(),
    mouseX: CANVAS_W / 2,
    mouseY: CANVAS_H / 2,
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayRound, setDisplayRound] = useState(1);
  const animRef = useRef<number>(0);
  const canvasRef2 = canvasRef;

  const spawnRound = useCallback((round: number) => {
    const s = stateRef.current;
    const count = 3 + round * 2;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 200 + Math.random() * 100;
      const type = round > 2 && Math.random() < 0.3 ? 'shooter' : round > 1 && Math.random() < 0.3 ? 'bouncer' : 'chaser';
      s.enemies.push({
        id: enemyId++,
        x: CANVAS_W / 2 + Math.cos(angle) * dist,
        y: CANVAS_H / 2 + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        hp: type === 'shooter' ? 3 : 2,
        maxHp: type === 'shooter' ? 3 : 2,
        r: type === 'shooter' ? 16 : 14,
        color: type === 'shooter' ? '#f43f5e' : type === 'bouncer' ? '#22d3ee' : '#a855f7',
        shootTimer: 60 + Math.random() * 60,
        type,
      });
    }
  }, []);

  const addParticles = useCallback((x: number, y: number, color: string, n = 8) => {
    const s = stateRef.current;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 5;
      s.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
    }
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.score = 0;
    s.round = 1;
    s.player = { x: CANVAS_W / 2, y: CANVAS_H / 2, hp: 5, maxHp: 5, shootTimer: 0, iframes: 0 };
    s.enemies = [];
    s.bullets = [];
    s.particles = [];
    s.frameCount = 0;
    spawnRound(1);
    setGameState('running');
    setDisplayScore(0);
    setDisplayRound(1);
  }, [spawnRound]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      stateRef.current.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
      if ((e.code === 'Enter') && (!stateRef.current.running || stateRef.current.gameOver)) startGame();
    };
    const handleKeyUp = (e: KeyboardEvent) => stateRef.current.keys.delete(e.code);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); };
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef2.current;
    if (!canvas) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      stateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
      stateRef.current.mouseY = (e.clientY - rect.top) * scaleY;
    };
    const handleClick = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) { startGame(); return; }
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      if (s.player.shootTimer <= 0) {
        const dx = mx - s.player.x;
        const dy = my - s.player.y;
        const dist = Math.hypot(dx, dy);
        s.bullets.push({ x: s.player.x, y: s.player.y, vx: (dx / dist) * BULLET_SPEED, vy: (dy / dist) * BULLET_SPEED, fromPlayer: true });
        s.player.shootTimer = 15;
      }
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    return () => { canvas.removeEventListener('mousemove', handleMouseMove); canvas.removeEventListener('click', handleClick); };
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Arena border
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 15;
      ctx.strokeRect(ARENA_PADDING, ARENA_PADDING, CANVAS_W - ARENA_PADDING * 2, CANVAS_H - ARENA_PADDING * 2);
      ctx.shadowBlur = 0;

      // Grid
      ctx.strokeStyle = 'rgba(251,146,60,0.05)';
      ctx.lineWidth = 1;
      for (let x = ARENA_PADDING; x < CANVAS_W - ARENA_PADDING; x += 40) { ctx.beginPath(); ctx.moveTo(x, ARENA_PADDING); ctx.lineTo(x, CANVAS_H - ARENA_PADDING); ctx.stroke(); }
      for (let y = ARENA_PADDING; y < CANVAS_H - ARENA_PADDING; y += 40) { ctx.beginPath(); ctx.moveTo(ARENA_PADDING, y); ctx.lineTo(CANVAS_W - ARENA_PADDING, y); ctx.stroke(); }

      // Particles
      for (const pt of s.particles) {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Enemies
      for (const e of s.enemies) {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = e.color;
        if (e.type === 'shooter') {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? e.r : e.r * 0.5;
            if (i === 0) ctx.moveTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
            else ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else if (e.type === 'bouncer') {
          ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
        } else {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
        }
        // HP
        if (e.maxHp > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2, 4);
          ctx.fillStyle = e.color;
          ctx.fillRect(e.x - e.r, e.y - e.r - 8, (e.hp / e.maxHp) * e.r * 2, 4);
        }
        ctx.shadowBlur = 0;
      }

      // Bullets
      for (const b of s.bullets) {
        ctx.shadowColor = b.fromPlayer ? '#fb923c' : '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.fillStyle = b.fromPlayer ? '#fb923c' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player
      const p = s.player;
      const alpha = p.iframes > 0 ? (Math.floor(p.iframes / 4) % 2 === 0 ? 0.3 : 1) : 1;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_R * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Aim line
      const dx = s.mouseX - p.x;
      const dy = s.mouseY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        ctx.strokeStyle = 'rgba(251,146,60,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (dx / dist) * 60, p.y + (dy / dist) * 60);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // HP
      for (let i = 0; i < p.maxHp; i++) {
        ctx.fillStyle = i < p.hp ? '#fb923c' : '#333';
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = i < p.hp ? 5 : 0;
        ctx.beginPath();
        ctx.arc(20 + i * 22, CANVAS_H - 20, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = '#fb923c';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.fillText(`SCORE: ${s.score}`, 20, 30);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.fillText(`ROUND: ${s.round}`, CANVAS_W - 180, 30);
      ctx.shadowBlur = 0;
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;
      s.frameCount++;

      const p = s.player;
      if (s.keys.has('ArrowLeft') || s.keys.has('KeyA')) p.x = Math.max(ARENA_PADDING + PLAYER_R, p.x - PLAYER_SPEED);
      if (s.keys.has('ArrowRight') || s.keys.has('KeyD')) p.x = Math.min(CANVAS_W - ARENA_PADDING - PLAYER_R, p.x + PLAYER_SPEED);
      if (s.keys.has('ArrowUp') || s.keys.has('KeyW')) p.y = Math.max(ARENA_PADDING + PLAYER_R, p.y - PLAYER_SPEED);
      if (s.keys.has('ArrowDown') || s.keys.has('KeyS')) p.y = Math.min(CANVAS_H - ARENA_PADDING - PLAYER_R, p.y + PLAYER_SPEED);

      if (p.shootTimer > 0) p.shootTimer--;
      if (p.iframes > 0) p.iframes--;

      // Enemy AI
      for (const e of s.enemies) {
        if (e.type === 'chaser') {
          const dx = p.x - e.x; const dy = p.y - e.y;
          const dist = Math.hypot(dx, dy);
          e.vx = (dx / dist) * 1.5;
          e.vy = (dy / dist) * 1.5;
        } else if (e.type === 'bouncer') {
          if (e.vx === 0 && e.vy === 0) { e.vx = (Math.random() - 0.5) * 4; e.vy = (Math.random() - 0.5) * 4; }
          if (e.x < ARENA_PADDING + e.r || e.x > CANVAS_W - ARENA_PADDING - e.r) e.vx *= -1;
          if (e.y < ARENA_PADDING + e.r || e.y > CANVAS_H - ARENA_PADDING - e.r) e.vy *= -1;
        } else if (e.type === 'shooter') {
          e.shootTimer--;
          if (e.shootTimer <= 0) {
            const dx = p.x - e.x; const dy = p.y - e.y;
            const dist = Math.hypot(dx, dy);
            s.bullets.push({ x: e.x, y: e.y, vx: (dx / dist) * 4, vy: (dy / dist) * 4, fromPlayer: false });
            e.shootTimer = 80 + Math.random() * 40;
          }
          // Slow drift
          const dx = p.x - e.x; const dy = p.y - e.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 150) { e.vx = (dx / dist) * 0.8; e.vy = (dy / dist) * 0.8; }
          else { e.vx *= 0.95; e.vy *= 0.95; }
        }
        e.x += e.vx; e.y += e.vy;
        e.x = Math.max(ARENA_PADDING + e.r, Math.min(CANVAS_W - ARENA_PADDING - e.r, e.x));
        e.y = Math.max(ARENA_PADDING + e.r, Math.min(CANVAS_H - ARENA_PADDING - e.r, e.y));
      }

      // Bullets
      for (const b of s.bullets) { b.x += b.vx; b.y += b.vy; }
      s.bullets = s.bullets.filter(b => b.x > 0 && b.x < CANVAS_W && b.y > 0 && b.y < CANVAS_H);

      // Bullet-enemy
      const deadEnemies = new Set<number>();
      const deadBullets = new Set<number>();
      for (let bi = 0; bi < s.bullets.length; bi++) {
        const b = s.bullets[bi];
        if (!b.fromPlayer) continue;
        for (const e of s.enemies) {
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 5) {
            deadBullets.add(bi);
            e.hp--;
            addParticles(e.x, e.y, e.color, 5);
            if (e.hp <= 0) { deadEnemies.add(e.id); s.score += 10; addParticles(e.x, e.y, e.color, 15); }
            break;
          }
        }
      }
      s.bullets = s.bullets.filter((_, i) => !deadBullets.has(i));
      s.enemies = s.enemies.filter(e => !deadEnemies.has(e.id));

      // Enemy-player collision
      if (p.iframes <= 0) {
        for (const e of s.enemies) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + PLAYER_R) {
            p.hp--;
            p.iframes = 60;
            addParticles(p.x, p.y, '#fb923c', 10);
            break;
          }
        }
        for (const b of s.bullets) {
          if (!b.fromPlayer && Math.hypot(b.x - p.x, b.y - p.y) < PLAYER_R + 5) {
            p.hp--;
            p.iframes = 60;
            addParticles(p.x, p.y, '#fb923c', 8);
            b.vx = 0; b.vy = 0; b.x = -100;
          }
        }
      }

      // Particles
      for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04; }
      s.particles = s.particles.filter(pt => pt.life > 0);

      // Round clear
      if (s.enemies.length === 0) {
        s.round++;
        spawnRound(s.round);
        setDisplayRound(s.round);
        p.hp = Math.min(p.maxHp, p.hp + 1);
      }

      // Game over
      if (p.hp <= 0) {
        s.gameOver = true; s.running = false;
        if (s.score > s.highScore) s.highScore = s.score;
        setGameState('over');
      }

      setDisplayScore(s.score);
    };

    const loop = () => { update(); draw(); animRef.current = requestAnimationFrame(loop); };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [addParticles, spawnRound]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-orange-500/30 rounded-lg cursor-crosshair"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(251,146,60,0.3)' }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-3xl text-orange-400 mb-2" style={{ textShadow: '0 0 20px #fb923c' }}>ARENA BLITZ</h2>
            <p className="font-rajdhani text-orange-300 text-lg mb-6">Survive the arena</p>
            <button onClick={startGame} className="font-arcade text-sm bg-orange-700 hover:bg-orange-600 text-white px-6 py-3 rounded border border-orange-400 transition-all">START GAME</button>
            <div className="mt-4 font-rajdhani text-orange-300/60 text-sm text-center">
              <p>WASD/Arrows — Move</p>
              <p>Click — Shoot toward cursor</p>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>DEFEATED!</h2>
            <p className="font-arcade text-orange-400 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-yellow-400 text-sm mb-1">ROUND: {displayRound}</p>
            <p className="font-arcade text-white/50 text-xs mb-6">BEST: {stateRef.current.highScore}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-orange-700 hover:bg-orange-600 text-white px-6 py-3 rounded border border-orange-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-orange-400/60 text-sm">WASD to move • Click to shoot toward cursor</p>
    </div>
  );
}

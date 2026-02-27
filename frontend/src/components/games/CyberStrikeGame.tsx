import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 800;
const CANVAS_H = 500;

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  size: number;
  color: string;
  type: 'basic' | 'fast' | 'tank';
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
}

let eid = 0;

export default function CyberStrikeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    wave: 1,
    player: { x: CANVAS_W / 2, y: CANVAS_H - 80, hp: 5, maxHp: 5, shootCooldown: 0 },
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    frameCount: 0,
    enemiesLeft: 0,
    highScore: 0,
    keys: new Set<string>(),
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayWave, setDisplayWave] = useState(1);
  const animRef = useRef<number>(0);

  const spawnWave = useCallback((wave: number) => {
    const s = stateRef.current;
    const count = 5 + wave * 3;
    s.enemiesLeft = count;
    for (let i = 0; i < count; i++) {
      const type = wave > 3 && Math.random() < 0.2 ? 'tank' : wave > 1 && Math.random() < 0.3 ? 'fast' : 'basic';
      const hp = type === 'tank' ? 5 : type === 'fast' ? 1 : 2;
      s.enemies.push({
        id: eid++,
        x: 60 + Math.random() * (CANVAS_W - 120),
        y: -30 - i * 40,
        vx: (Math.random() - 0.5) * (type === 'fast' ? 3 : 1.5),
        vy: type === 'fast' ? 2.5 : 1.2,
        hp, maxHp: hp,
        size: type === 'tank' ? 28 : type === 'fast' ? 14 : 20,
        color: type === 'tank' ? '#f43f5e' : type === 'fast' ? '#22d3ee' : '#a855f7',
        type,
      });
    }
  }, []);

  const addParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      s.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color, size: 3 + Math.random() * 4 });
    }
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.score = 0;
    s.wave = 1;
    s.player = { x: CANVAS_W / 2, y: CANVAS_H - 80, hp: 5, maxHp: 5, shootCooldown: 0 };
    s.enemies = [];
    s.bullets = [];
    s.particles = [];
    s.frameCount = 0;
    spawnWave(1);
    setGameState('running');
    setDisplayScore(0);
    setDisplayWave(1);
  }, [spawnWave]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      stateRef.current.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
      if ((e.code === 'Enter' || e.code === 'Space') && (stateRef.current.gameOver || !stateRef.current.running)) {
        startGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => stateRef.current.keys.delete(e.code);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid
      ctx.strokeStyle = 'rgba(244,63,94,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
      for (let y = 0; y < CANVAS_H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

      // Particles
      for (const pt of s.particles) {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Enemies
      for (const e of s.enemies) {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = e.color;
        if (e.type === 'tank') {
          ctx.fillRect(e.x - e.size, e.y - e.size, e.size * 2, e.size * 2);
        } else if (e.type === 'fast') {
          ctx.beginPath();
          ctx.moveTo(e.x, e.y - e.size);
          ctx.lineTo(e.x + e.size, e.y + e.size);
          ctx.lineTo(e.x - e.size, e.y + e.size);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
        }
        // HP bar
        if (e.maxHp > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(e.x - e.size, e.y - e.size - 8, e.size * 2, 4);
          ctx.fillStyle = e.color;
          ctx.fillRect(e.x - e.size, e.y - e.size - 8, (e.hp / e.maxHp) * e.size * 2, 4);
        }
        ctx.shadowBlur = 0;
      }

      // Bullets
      for (const b of s.bullets) {
        ctx.shadowColor = b.fromPlayer ? '#4ade80' : '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.fillStyle = b.fromPlayer ? '#4ade80' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player ship
      const p = s.player;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 25);
      ctx.lineTo(p.x + 18, p.y + 15);
      ctx.lineTo(p.x + 8, p.y + 8);
      ctx.lineTo(p.x, p.y + 12);
      ctx.lineTo(p.x - 8, p.y + 8);
      ctx.lineTo(p.x - 18, p.y + 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // HP bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(20, CANVAS_H - 30, 150, 12);
      for (let i = 0; i < p.maxHp; i++) {
        ctx.fillStyle = i < p.hp ? '#4ade80' : '#333';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = i < p.hp ? 5 : 0;
        ctx.fillRect(22 + i * 28, CANVAS_H - 28, 24, 8);
      }
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.fillText(`SCORE: ${s.score}`, 20, 30);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.fillText(`WAVE: ${s.wave}`, CANVAS_W - 160, 30);
      ctx.shadowBlur = 0;
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;
      s.frameCount++;

      const speed = 4;
      const p = s.player;
      if (s.keys.has('ArrowLeft') || s.keys.has('KeyA')) p.x = Math.max(20, p.x - speed);
      if (s.keys.has('ArrowRight') || s.keys.has('KeyD')) p.x = Math.min(CANVAS_W - 20, p.x + speed);
      if (s.keys.has('ArrowUp') || s.keys.has('KeyW')) p.y = Math.max(20, p.y - speed);
      if (s.keys.has('ArrowDown') || s.keys.has('KeyS')) p.y = Math.min(CANVAS_H - 20, p.y + speed);

      // Auto-shoot
      p.shootCooldown--;
      if (p.shootCooldown <= 0) {
        s.bullets.push({ x: p.x, y: p.y - 25, vx: 0, vy: -10, fromPlayer: true });
        p.shootCooldown = 12;
      }

      // Enemy shoot
      if (s.frameCount % 60 === 0 && s.enemies.length > 0) {
        const shooter = s.enemies[Math.floor(Math.random() * s.enemies.length)];
        const dx = p.x - shooter.x;
        const dy = p.y - shooter.y;
        const dist = Math.hypot(dx, dy);
        s.bullets.push({ x: shooter.x, y: shooter.y, vx: (dx / dist) * 4, vy: (dy / dist) * 4, fromPlayer: false });
      }

      // Move bullets
      s.bullets = s.bullets.filter(b => b.x > 0 && b.x < CANVAS_W && b.y > 0 && b.y < CANVAS_H);
      for (const b of s.bullets) { b.x += b.vx; b.y += b.vy; }

      // Move enemies
      for (const e of s.enemies) {
        e.x += e.vx;
        e.y += e.vy;
        if (e.x < e.size || e.x > CANVAS_W - e.size) e.vx *= -1;
        if (e.y > CANVAS_H + 50) {
          // Enemy escaped — damage player
          p.hp--;
          addParticles(p.x, p.y, '#f43f5e');
          e.y = -50;
        }
      }

      // Bullet-enemy collision
      const toRemoveBullets = new Set<number>();
      const toRemoveEnemies = new Set<number>();
      for (let bi = 0; bi < s.bullets.length; bi++) {
        const b = s.bullets[bi];
        if (!b.fromPlayer) continue;
        for (const e of s.enemies) {
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + 4) {
            toRemoveBullets.add(bi);
            e.hp--;
            addParticles(e.x, e.y, e.color, 6);
            if (e.hp <= 0) {
              toRemoveEnemies.add(e.id);
              s.score += e.type === 'tank' ? 30 : e.type === 'fast' ? 20 : 10;
              addParticles(e.x, e.y, e.color, 15);
            }
            break;
          }
        }
      }
      s.bullets = s.bullets.filter((_, i) => !toRemoveBullets.has(i));
      s.enemies = s.enemies.filter(e => !toRemoveEnemies.has(e.id));

      // Enemy-player collision
      for (const b of s.bullets) {
        if (!b.fromPlayer && Math.hypot(b.x - p.x, b.y - p.y) < 20) {
          p.hp--;
          addParticles(p.x, p.y, '#f43f5e');
          b.vy = 0; b.vx = 0; b.y = -100;
        }
      }

      // Particles
      for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04; }
      s.particles = s.particles.filter(pt => pt.life > 0);

      // Wave clear
      if (s.enemies.length === 0) {
        s.wave++;
        spawnWave(s.wave);
        setDisplayWave(s.wave);
      }

      // Game over
      if (p.hp <= 0) {
        s.gameOver = true;
        s.running = false;
        if (s.score > s.highScore) s.highScore = s.score;
        setGameState('over');
      }

      setDisplayScore(s.score);
    };

    const loop = () => { update(); draw(); animRef.current = requestAnimationFrame(loop); };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [addParticles, spawnWave]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-red-500/30 rounded-lg"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(244,63,94,0.3)' }}
          onClick={() => { if (!stateRef.current.running || stateRef.current.gameOver) startGame(); }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-3xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>CYBER STRIKE</h2>
            <p className="font-rajdhani text-red-300 text-lg mb-6">Survive the cyber onslaught</p>
            <button onClick={startGame} className="font-arcade text-sm bg-red-700 hover:bg-red-600 text-white px-6 py-3 rounded border border-red-400 transition-all">START GAME</button>
            <div className="mt-4 font-rajdhani text-red-300/60 text-sm text-center">
              <p>WASD / Arrows — Move</p>
              <p>Auto-fire enabled</p>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>GAME OVER</h2>
            <p className="font-arcade text-green-400 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-yellow-400 text-sm mb-1">WAVE: {displayWave}</p>
            <p className="font-arcade text-white/50 text-xs mb-6">BEST: {stateRef.current.highScore}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-red-700 hover:bg-red-600 text-white px-6 py-3 rounded border border-red-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-red-400/60 text-sm">WASD/Arrows to move • Auto-fire • Survive the waves!</p>
    </div>
  );
}

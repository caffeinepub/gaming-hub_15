import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 700;
const CANVAS_H = 500;
const PLAYER_SPEED = 5;
const PLAYER_R = 16;

interface Obstacle {
  id: number;
  x: number; y: number;
  type: 'asteroid' | 'laser' | 'mine';
  vx: number; vy: number;
  r: number;
  color: string;
  angle: number;
  spin: number;
  beat: number; // which beat this spawns on
}

interface Star {
  x: number; y: number; speed: number; size: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
}

let oid = 0;

export default function StellarAssaultGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    combo: 0,
    level: 1,
    player: { x: CANVAS_W / 2, y: CANVAS_H - 80, iframes: 0, hp: 3 },
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    stars: [] as Star[],
    frameCount: 0,
    beatFrame: 0,
    bpm: 120,
    highScore: 0,
    keys: new Set<string>(),
    lastBeat: 0,
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [beatPulse, setBeatPulse] = useState(false);
  const animRef = useRef<number>(0);

  const addParticles = useCallback((x: number, y: number, color: string, n = 8) => {
    const s = stateRef.current;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 6;
      s.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
    }
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.score = 0;
    s.combo = 0;
    s.level = 1;
    s.player = { x: CANVAS_W / 2, y: CANVAS_H - 80, iframes: 0, hp: 3 };
    s.obstacles = [];
    s.particles = [];
    s.stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      speed: 1 + Math.random() * 3,
      size: Math.random() * 2 + 0.5,
    }));
    s.frameCount = 0;
    s.beatFrame = 0;
    s.lastBeat = 0;
    setGameState('running');
    setDisplayScore(0);
    setDisplayCombo(0);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      stateRef.current.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.code === 'Enter' && (!stateRef.current.running || stateRef.current.gameOver)) startGame();
    };
    const handleKeyUp = (e: KeyboardEvent) => stateRef.current.keys.delete(e.code);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); };
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#020208';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      for (const star of s.stars) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + star.size * 0.2})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Beat pulse ring
      const beatAge = s.frameCount - s.lastBeat;
      if (beatAge < 20) {
        const alpha = 1 - beatAge / 20;
        const radius = beatAge * 15;
        ctx.strokeStyle = `rgba(250,204,21,${alpha * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(CANVAS_W / 2, CANVAS_H / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

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

      // Obstacles
      for (const obs of s.obstacles) {
        ctx.save();
        ctx.translate(obs.x, obs.y);
        ctx.rotate(obs.angle);
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = obs.color;
        if (obs.type === 'asteroid') {
          ctx.beginPath();
          for (let i = 0; i < 7; i++) {
            const a = (Math.PI * 2 * i) / 7;
            const r = obs.r * (0.7 + Math.sin(i * 2.3) * 0.3);
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'laser') {
          ctx.fillRect(-obs.r * 3, -4, obs.r * 6, 8);
        } else {
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (Math.PI * 2 * i) / 4 + Math.PI / 4;
            if (i === 0) ctx.moveTo(Math.cos(a) * obs.r, Math.sin(a) * obs.r);
            else ctx.lineTo(Math.cos(a) * obs.r, Math.sin(a) * obs.r);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Player ship
      const p = s.player;
      const alpha = p.iframes > 0 ? (Math.floor(p.iframes / 4) % 2 === 0 ? 0.3 : 1) : 1;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 20);
      ctx.lineTo(p.x + 15, p.y + 12);
      ctx.lineTo(p.x + 6, p.y + 6);
      ctx.lineTo(p.x, p.y + 10);
      ctx.lineTo(p.x - 6, p.y + 6);
      ctx.lineTo(p.x - 15, p.y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // HP
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < p.hp ? '#f43f5e' : '#333';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = i < p.hp ? 6 : 0;
        ctx.beginPath();
        ctx.arc(20 + i * 24, CANVAS_H - 20, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${s.score}`, 20, 30);
      if (s.combo > 1) {
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.fillText(`x${s.combo} COMBO!`, CANVAS_W / 2 - 60, 30);
      }
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.textAlign = 'right';
      ctx.fillText(`LVL ${s.level}`, CANVAS_W - 20, 30);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;
      s.frameCount++;

      // Beat timing (120 BPM = 30 frames at 60fps)
      const framesPerBeat = Math.max(15, 30 - s.level * 2);
      if (s.frameCount % framesPerBeat === 0) {
        s.lastBeat = s.frameCount;
        s.beatFrame++;
        setBeatPulse(p => !p);

        // Spawn on beat
        const spawnCount = 1 + Math.floor(s.level / 3);
        for (let i = 0; i < spawnCount; i++) {
          const type: 'asteroid' | 'laser' | 'mine' =
            s.level > 4 && Math.random() < 0.2 ? 'mine' :
            s.level > 2 && Math.random() < 0.3 ? 'laser' : 'asteroid';
          const side = Math.floor(Math.random() * 4);
          let x = 0, y = 0, vx = 0, vy = 0;
          if (side === 0) { x = Math.random() * CANVAS_W; y = -30; vx = (Math.random() - 0.5) * 2; vy = 2 + Math.random() * 2; }
          else if (side === 1) { x = CANVAS_W + 30; y = Math.random() * CANVAS_H; vx = -(2 + Math.random() * 2); vy = (Math.random() - 0.5) * 2; }
          else if (side === 2) { x = Math.random() * CANVAS_W; y = CANVAS_H + 30; vx = (Math.random() - 0.5) * 2; vy = -(2 + Math.random() * 2); }
          else { x = -30; y = Math.random() * CANVAS_H; vx = 2 + Math.random() * 2; vy = (Math.random() - 0.5) * 2; }

          s.obstacles.push({
            id: oid++, x, y, type, vx, vy,
            r: type === 'asteroid' ? 18 + Math.random() * 12 : type === 'laser' ? 20 : 14,
            color: type === 'asteroid' ? '#a855f7' : type === 'laser' ? '#f43f5e' : '#22d3ee',
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.1,
            beat: s.beatFrame,
          });
        }
      }

      // Player movement
      const p = s.player;
      if (s.keys.has('ArrowLeft') || s.keys.has('KeyA')) p.x = Math.max(PLAYER_R, p.x - PLAYER_SPEED);
      if (s.keys.has('ArrowRight') || s.keys.has('KeyD')) p.x = Math.min(CANVAS_W - PLAYER_R, p.x + PLAYER_SPEED);
      if (s.keys.has('ArrowUp') || s.keys.has('KeyW')) p.y = Math.max(PLAYER_R, p.y - PLAYER_SPEED);
      if (s.keys.has('ArrowDown') || s.keys.has('KeyS')) p.y = Math.min(CANVAS_H - PLAYER_R, p.y + PLAYER_SPEED);
      if (p.iframes > 0) p.iframes--;

      // Move obstacles
      for (const obs of s.obstacles) {
        obs.x += obs.vx;
        obs.y += obs.vy;
        obs.angle += obs.spin;
      }
      s.obstacles = s.obstacles.filter(o => o.x > -100 && o.x < CANVAS_W + 100 && o.y > -100 && o.y < CANVAS_H + 100);

      // Score for surviving beats
      if (s.frameCount % framesPerBeat === 0) {
        s.score += 10 * (1 + Math.floor(s.level / 2));
        s.combo++;
        setDisplayCombo(s.combo);
        setDisplayScore(s.score);
      }

      // Level up
      if (s.score > s.level * 500) {
        s.level++;
        s.combo = 0;
      }

      // Collision
      if (p.iframes <= 0) {
        for (const obs of s.obstacles) {
          const hitR = obs.type === 'laser' ? obs.r * 2 : obs.r;
          if (Math.hypot(obs.x - p.x, obs.y - p.y) < hitR + PLAYER_R - 4) {
            p.hp--;
            p.iframes = 90;
            s.combo = 0;
            setDisplayCombo(0);
            addParticles(p.x, p.y, '#facc15', 12);
            obs.x = -200;
            if (p.hp <= 0) {
              s.gameOver = true; s.running = false;
              if (s.score > s.highScore) s.highScore = s.score;
              setGameState('over');
              return;
            }
            break;
          }
        }
      }

      // Stars
      for (const star of s.stars) {
        star.y += star.speed;
        if (star.y > CANVAS_H) { star.y = 0; star.x = Math.random() * CANVAS_W; }
      }

      // Particles
      for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04; }
      s.particles = s.particles.filter(pt => pt.life > 0);
    };

    const loop = () => { update(); draw(); animRef.current = requestAnimationFrame(loop); };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [addParticles]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-yellow-500/30 rounded-lg"
          style={{ maxWidth: '100%', boxShadow: `0 0 30px rgba(250,204,21,${beatPulse ? 0.4 : 0.2})`, transition: 'box-shadow 0.1s' }}
          onClick={() => { if (!stateRef.current.running || stateRef.current.gameOver) startGame(); }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-2xl text-yellow-400 mb-2" style={{ textShadow: '0 0 20px #facc15' }}>STELLAR ASSAULT</h2>
            <p className="font-rajdhani text-yellow-300 text-lg mb-6">Dodge obstacles to the beat!</p>
            <button onClick={startGame} className="font-arcade text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-6 py-3 rounded border border-yellow-400 transition-all">LAUNCH!</button>
            <div className="mt-4 font-rajdhani text-yellow-300/60 text-sm text-center">
              <p>WASD / Arrows — Move ship</p>
              <p>Survive the rhythm onslaught</p>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>DESTROYED!</h2>
            <p className="font-arcade text-yellow-400 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-purple-400 text-sm mb-1">COMBO: x{displayCombo}</p>
            <p className="font-arcade text-white/50 text-xs mb-6">BEST: {stateRef.current.highScore}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-6 py-3 rounded border border-yellow-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-yellow-400/60 text-sm">WASD/Arrows to dodge • Survive the beat!</p>
    </div>
  );
}

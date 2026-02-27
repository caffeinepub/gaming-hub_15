import { useEffect, useRef, useState, useCallback } from 'react';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'low' | 'high' | 'gap';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const CANVAS_W = 800;
const CANVAS_H = 400;
const GROUND_Y = 320;
const PLAYER_W = 40;
const PLAYER_H = 50;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;

export default function ShadowRunGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    speed: 5,
    player: { x: 100, y: GROUND_Y - PLAYER_H, vy: 0, onGround: true, ducking: false },
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    frameCount: 0,
    bgOffset: 0,
    highScore: 0,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const animRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const spawnObstacle = useCallback(() => {
    const s = stateRef.current;
    const type = Math.random() < 0.6 ? 'low' : 'high';
    if (type === 'low') {
      s.obstacles.push({ x: CANVAS_W + 20, y: GROUND_Y - 50, width: 30, height: 50, type: 'low' });
    } else {
      s.obstacles.push({ x: CANVAS_W + 20, y: GROUND_Y - 120, width: 20, height: 60, type: 'high' });
    }
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    const s = stateRef.current;
    for (let i = 0; i < 8; i++) {
      s.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 1,
        color,
      });
    }
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.score = 0;
    s.speed = 5;
    s.player = { x: 100, y: GROUND_Y - PLAYER_H, vy: 0, onGround: true, ducking: false };
    s.obstacles = [];
    s.particles = [];
    s.frameCount = 0;
    s.bgOffset = 0;
    setGameState('running');
    setDisplayScore(0);
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.player.onGround && s.running) {
      s.player.vy = JUMP_FORCE;
      s.player.onGround = false;
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (stateRef.current.gameOver || !stateRef.current.running) {
          startGame();
        } else {
          jump();
        }
      }
      if (e.code === 'ArrowDown') {
        stateRef.current.player.ducking = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
      if (e.code === 'ArrowDown') {
        stateRef.current.player.ducking = false;
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startGame, jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid lines
      ctx.strokeStyle = 'rgba(168,85,247,0.08)';
      ctx.lineWidth = 1;
      for (let x = (s.bgOffset % 80); x < CANVAS_W; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y < CANVAS_H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }

      // Ground
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_W, GROUND_Y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Player
      const p = s.player;
      const ph = p.ducking ? PLAYER_H * 0.6 : PLAYER_H;
      const py = p.ducking ? GROUND_Y - ph : p.y;

      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      // Body
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(p.x, py, PLAYER_W, ph);
      // Inner glow
      ctx.fillStyle = 'rgba(168,85,247,0.4)';
      ctx.fillRect(p.x + 5, py + 5, PLAYER_W - 10, ph - 10);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 5;
      ctx.fillRect(p.x + 8, py + 10, 8, 8);
      ctx.fillRect(p.x + 24, py + 10, 8, 8);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(p.x + 10, py + 12, 4, 4);
      ctx.fillRect(p.x + 26, py + 12, 4, 4);
      ctx.shadowBlur = 0;

      // Obstacles
      for (const obs of s.obstacles) {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = 'rgba(244,63,94,0.3)';
        ctx.fillRect(obs.x + 3, obs.y + 3, obs.width - 6, obs.height - 6);
        ctx.shadowBlur = 0;
      }

      // Particles
      for (const pt of s.particles) {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.fillText(`SCORE: ${Math.floor(s.score)}`, 20, 30);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.fillText(`BEST: ${Math.floor(s.highScore)}`, 20, 55);
      ctx.shadowBlur = 0;

      // Speed indicator
      const speedPct = Math.min((s.speed - 5) / 10, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(CANVAS_W - 120, 15, 100, 10);
      ctx.fillStyle = `hsl(${120 - speedPct * 120}, 100%, 60%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 5;
      ctx.fillRect(CANVAS_W - 120, 15, speedPct * 100, 10);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('SPEED', CANVAS_W - 120, 40);
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;

      s.frameCount++;
      s.bgOffset -= s.speed * 0.5;
      s.score += s.speed * 0.05;
      s.speed = 5 + Math.floor(s.score / 200) * 0.5;

      // Player physics
      const p = s.player;
      p.vy += GRAVITY;
      p.y += p.vy;
      if (p.y >= GROUND_Y - PLAYER_H) {
        p.y = GROUND_Y - PLAYER_H;
        p.vy = 0;
        p.onGround = true;
      }

      // Spawn obstacles
      const spawnInterval = Math.max(60, 120 - Math.floor(s.score / 100) * 5);
      if (s.frameCount % spawnInterval === 0) spawnObstacle();

      // Move obstacles
      s.obstacles = s.obstacles.filter(o => o.x > -100);
      for (const obs of s.obstacles) {
        obs.x -= s.speed;
      }

      // Collision
      const ph = p.ducking ? PLAYER_H * 0.6 : PLAYER_H;
      const py = p.ducking ? GROUND_Y - ph : p.y;
      for (const obs of s.obstacles) {
        if (
          p.x + PLAYER_W - 5 > obs.x + 3 &&
          p.x + 5 < obs.x + obs.width - 3 &&
          py + ph - 5 > obs.y + 3 &&
          py + 5 < obs.y + obs.height - 3
        ) {
          spawnParticles(p.x + PLAYER_W / 2, py + ph / 2, '#f43f5e');
          s.gameOver = true;
          s.running = false;
          if (s.score > s.highScore) s.highScore = s.score;
          setGameState('over');
          setDisplayScore(Math.floor(s.score));
          return;
        }
      }

      // Particles
      for (const pt of s.particles) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.2;
        pt.life -= 0.05;
      }
      s.particles = s.particles.filter(pt => pt.life > 0);

      setDisplayScore(Math.floor(s.score));
    };

    const loop = () => {
      update();
      draw();
      animRef.current = requestAnimationFrame(loop);
    };

    // Initial draw
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [spawnObstacle, spawnParticles]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="border border-purple-500/30 rounded-lg"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }}
          onClick={() => {
            if (gameState === 'idle' || gameState === 'over') startGame();
            else jump();
          }}
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h2 className="font-arcade text-3xl text-purple-400 mb-2" style={{ textShadow: '0 0 20px #a855f7' }}>SHADOW RUN</h2>
            <p className="font-rajdhani text-purple-300 text-lg mb-6">Endless neon runner</p>
            <button onClick={startGame} className="font-arcade text-sm bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded border border-purple-400 transition-all" style={{ boxShadow: '0 0 15px rgba(168,85,247,0.5)' }}>
              PRESS SPACE / CLICK
            </button>
            <div className="mt-6 text-center font-rajdhani text-purple-300/70 text-sm">
              <p>SPACE / ↑ — Jump</p>
              <p>↓ — Duck</p>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>GAME OVER</h2>
            <p className="font-arcade text-purple-300 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-yellow-400 text-sm mb-6">BEST: {Math.floor(stateRef.current.highScore)}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded border border-purple-400 transition-all" style={{ boxShadow: '0 0 15px rgba(168,85,247,0.5)' }}>
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-purple-400/60 text-sm">SPACE/↑ to jump • ↓ to duck • Click to play</p>
    </div>
  );
}

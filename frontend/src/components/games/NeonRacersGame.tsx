import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 800;
const CANVAS_H = 500;
const CAR_W = 28;
const CAR_H = 48;

interface TrackSegment {
  x: number;
  width: number;
  curve: number;
}

interface AICar {
  lane: number;
  y: number;
  speed: number;
  color: string;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
}

export default function NeonRacersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    won: false,
    player: { lane: 2, y: CANVAS_H - 100, speed: 0, targetLane: 2, laneX: 0 },
    aiCars: [] as AICar[],
    particles: [] as Particle[],
    trackOffset: 0,
    score: 0,
    distance: 0,
    lap: 1,
    totalDistance: 3000,
    speed: 3,
    highScore: 0,
    keys: new Set<string>(),
    frameCount: 0,
    overtakes: 0,
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over' | 'won'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const animRef = useRef<number>(0);

  const LANES = 5;
  const LANE_W = CANVAS_W / LANES;

  const getLaneX = useCallback((lane: number) => LANE_W * lane + LANE_W / 2, [LANE_W]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.won = false;
    s.player = { lane: 2, y: CANVAS_H - 100, speed: 0, targetLane: 2, laneX: getLaneX(2) };
    s.aiCars = [
      { lane: 0, y: CANVAS_H - 200, speed: 2.5, color: '#f43f5e' },
      { lane: 1, y: CANVAS_H - 300, speed: 2.8, color: '#a855f7' },
      { lane: 3, y: CANVAS_H - 250, speed: 2.6, color: '#22d3ee' },
      { lane: 4, y: CANVAS_H - 180, speed: 2.4, color: '#4ade80' },
    ];
    s.particles = [];
    s.trackOffset = 0;
    s.score = 0;
    s.distance = 0;
    s.lap = 1;
    s.speed = 3;
    s.frameCount = 0;
    s.overtakes = 0;
    setGameState('running');
    setDisplayScore(0);
    setDisplaySpeed(0);
  }, [getLaneX]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      stateRef.current.keys.add(e.code);
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      if (e.code === 'Enter' && (!stateRef.current.running || stateRef.current.gameOver || stateRef.current.won)) startGame();
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
      // Road background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Road surface
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Lane lines (scrolling)
      for (let lane = 1; lane < LANES; lane++) {
        const lx = lane * LANE_W;
        ctx.strokeStyle = lane === Math.floor(LANES / 2) ? 'rgba(250,204,21,0.6)' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = lane === Math.floor(LANES / 2) ? 3 : 1;
        ctx.setLineDash([40, 30]);
        ctx.lineDashOffset = -s.trackOffset % 70;
        ctx.shadowColor = lane === Math.floor(LANES / 2) ? '#facc15' : 'transparent';
        ctx.shadowBlur = lane === Math.floor(LANES / 2) ? 5 : 0;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, CANVAS_H);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Road edges
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, CANVAS_H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CANVAS_W, 0); ctx.lineTo(CANVAS_W, CANVAS_H); ctx.stroke();
      ctx.shadowBlur = 0;

      // Particles
      for (const pt of s.particles) {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // AI cars
      for (const ai of s.aiCars) {
        const ax = getLaneX(ai.lane);
        ctx.shadowColor = ai.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = ai.color;
        ctx.fillRect(ax - CAR_W / 2, ai.y - CAR_H / 2, CAR_W, CAR_H);
        // Windshield
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(ax - CAR_W / 2 + 4, ai.y - CAR_H / 2 + 6, CAR_W - 8, 14);
        // Headlights
        ctx.fillStyle = '#fff';
        ctx.fillRect(ax - CAR_W / 2 + 2, ai.y + CAR_H / 2 - 8, 6, 4);
        ctx.fillRect(ax + CAR_W / 2 - 8, ai.y + CAR_H / 2 - 8, 6, 4);
        ctx.shadowBlur = 0;
      }

      // Player car
      const p = s.player;
      const px = p.laneX;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - CAR_W / 2, p.y - CAR_H / 2, CAR_W, CAR_H);
      // Windshield
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(px - CAR_W / 2 + 4, p.y - CAR_H / 2 + 6, CAR_W - 8, 14);
      // Taillights
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.fillRect(px - CAR_W / 2 + 2, p.y - CAR_H / 2 + 2, 6, 4);
      ctx.fillRect(px + CAR_W / 2 - 8, p.y - CAR_H / 2 + 2, 6, 4);
      ctx.shadowBlur = 0;

      // Progress bar
      const progress = Math.min(s.distance / s.totalDistance, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(CANVAS_W - 30, 60, 16, CANVAS_H - 120);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 5;
      const barH = (CANVAS_H - 120) * progress;
      ctx.fillRect(CANVAS_W - 30, 60 + (CANVAS_H - 120) - barH, 16, barH);
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${s.score}`, 20, 30);
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.fillText(`${Math.floor(s.speed * 40)} KM/H`, 20, 55);
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.textAlign = 'right';
      ctx.fillText(`OVERTAKES: ${s.overtakes}`, CANVAS_W - 50, 30);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver || s.won) return;
      s.frameCount++;

      // Speed control
      if (s.keys.has('ArrowUp') || s.keys.has('KeyW')) s.speed = Math.min(8, s.speed + 0.05);
      else if (s.keys.has('ArrowDown') || s.keys.has('KeyS')) s.speed = Math.max(1, s.speed - 0.1);
      else s.speed = Math.max(3, s.speed - 0.02);

      // Lane change
      if ((s.keys.has('ArrowLeft') || s.keys.has('KeyA')) && s.player.targetLane > 0) {
        if (s.player.laneX <= getLaneX(s.player.targetLane) + 1) {
          s.player.targetLane = Math.max(0, s.player.targetLane - 1);
        }
      }
      if ((s.keys.has('ArrowRight') || s.keys.has('KeyD')) && s.player.targetLane < LANES - 1) {
        if (s.player.laneX >= getLaneX(s.player.targetLane) - 1) {
          s.player.targetLane = Math.min(LANES - 1, s.player.targetLane + 1);
        }
      }

      // Smooth lane transition
      const targetX = getLaneX(s.player.targetLane);
      s.player.laneX += (targetX - s.player.laneX) * 0.15;

      // Track scroll
      s.trackOffset += s.speed * 2;
      s.distance += s.speed * 0.1;
      s.score = Math.floor(s.distance * 10) + s.overtakes * 50;
      setDisplayScore(s.score);
      setDisplaySpeed(Math.floor(s.speed * 40));

      // Move AI cars
      for (const ai of s.aiCars) {
        ai.y += s.speed - ai.speed;
        // Exhaust particles
        if (s.frameCount % 3 === 0) {
          s.particles.push({ x: getLaneX(ai.lane) + (Math.random() - 0.5) * 10, y: ai.y - CAR_H / 2, vx: (Math.random() - 0.5) * 1, vy: -s.speed * 0.5, life: 1, color: ai.color });
        }
        // Wrap around
        if (ai.y > CANVAS_H + 100) {
          ai.y = -100 - Math.random() * 200;
          ai.lane = Math.floor(Math.random() * LANES);
          ai.speed = 2 + Math.random() * 1.5;
        }
        if (ai.y < -150) {
          ai.y = CANVAS_H + 100;
        }
      }

      // Player exhaust
      if (s.frameCount % 2 === 0) {
        s.particles.push({ x: s.player.laneX + (Math.random() - 0.5) * 8, y: s.player.y - CAR_H / 2, vx: (Math.random() - 0.5) * 1, vy: -s.speed * 0.3, life: 1, color: '#facc15' });
      }

      // Collision detection
      for (const ai of s.aiCars) {
        const ax = getLaneX(ai.lane);
        if (
          Math.abs(s.player.laneX - ax) < CAR_W - 4 &&
          Math.abs(s.player.y - ai.y) < CAR_H - 4
        ) {
          s.gameOver = true; s.running = false;
          if (s.score > s.highScore) s.highScore = s.score;
          setGameState('over');
          return;
        }
        // Overtake detection
        if (ai.y > s.player.y + CAR_H && ai.y < s.player.y + CAR_H + 10) {
          s.overtakes++;
        }
      }

      // Particles
      for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04; }
      s.particles = s.particles.filter(pt => pt.life > 0);

      // Win condition
      if (s.distance >= s.totalDistance) {
        s.won = true; s.running = false;
        if (s.score > s.highScore) s.highScore = s.score;
        setGameState('won');
      }
    };

    const loop = () => { update(); draw(); animRef.current = requestAnimationFrame(loop); };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [getLaneX]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-yellow-500/30 rounded-lg"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(250,204,21,0.3)' }}
          onClick={() => { if (!stateRef.current.running || stateRef.current.gameOver || stateRef.current.won) startGame(); }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-3xl text-yellow-400 mb-2" style={{ textShadow: '0 0 20px #facc15' }}>NEON RACERS</h2>
            <p className="font-rajdhani text-yellow-300 text-lg mb-6">Race to the finish line!</p>
            <button onClick={startGame} className="font-arcade text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-6 py-3 rounded border border-yellow-400 transition-all">START RACE!</button>
            <div className="mt-4 font-rajdhani text-yellow-300/60 text-sm text-center">
              <p>← → / A D — Change lanes</p>
              <p>↑ / W — Accelerate  ↓ / S — Brake</p>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>CRASHED!</h2>
            <p className="font-arcade text-yellow-400 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-cyan-400 text-sm mb-1">SPEED: {displaySpeed} KM/H</p>
            <p className="font-arcade text-white/50 text-xs mb-6">BEST: {stateRef.current.highScore}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-6 py-3 rounded border border-yellow-400 transition-all">RACE AGAIN</button>
          </div>
        )}
        {gameState === 'won' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-yellow-400 mb-2" style={{ textShadow: '0 0 20px #facc15' }}>FINISH!</h2>
            <p className="font-arcade text-green-400 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-cyan-400 text-sm mb-6">OVERTAKES: {stateRef.current.overtakes}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-6 py-3 rounded border border-yellow-400 transition-all">RACE AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-yellow-400/60 text-sm">← → change lanes • ↑ accelerate • ↓ brake • Avoid other cars!</p>
    </div>
  );
}

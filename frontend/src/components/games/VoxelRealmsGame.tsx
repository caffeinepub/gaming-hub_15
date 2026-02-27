import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 700;
const CANVAS_H = 500;
const GRID_COLS = 20;
const GRID_ROWS = 15;
const CELL_W = CANVAS_W / GRID_COLS;
const CELL_H = (CANVAS_H - 80) / GRID_ROWS;

type TileType = 'empty' | 'grass' | 'stone' | 'wood' | 'tower' | 'base';

interface Tile {
  type: TileType;
  hp?: number;
}

interface Enemy {
  id: number;
  x: number; y: number;
  pathIdx: number;
  hp: number; maxHp: number;
  speed: number;
  color: string;
  reward: number;
}

interface Projectile {
  x: number; y: number;
  tx: number; ty: number;
  speed: number;
  color: string;
  damage: number;
  enemyId: number;
}

interface Tower {
  col: number; row: number;
  range: number;
  damage: number;
  cooldown: number;
  maxCooldown: number;
  color: string;
}

const TILE_COLORS: Record<TileType, string> = {
  empty: '#0a0a1a',
  grass: '#1a3a1a',
  stone: '#2a2a3a',
  wood: '#3a2a1a',
  tower: '#1a1a4a',
  base: '#3a1a1a',
};

// Simple path: left to right across middle rows
const PATH: [number, number][] = [
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [4, 5], [5, 5], [6, 5], [7, 5],
  [7, 9], [8, 9], [9, 9], [10, 9], [10, 5], [11, 5], [12, 5], [13, 5],
  [13, 10], [14, 10], [15, 10], [16, 10], [16, 7], [17, 7], [18, 7], [19, 7],
];

let eid3 = 0;

export default function VoxelRealmsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    won: false,
    gold: 100,
    lives: 20,
    wave: 0,
    score: 0,
    tiles: [] as Tile[][],
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    frameCount: 0,
    waveTimer: 0,
    selectedTool: 'tower' as 'tower' | 'wall',
    highScore: 0,
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over' | 'won'>('idle');
  const [displayGold, setDisplayGold] = useState(100);
  const [displayLives, setDisplayLives] = useState(20);
  const [displayWave, setDisplayWave] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'tower' | 'wall'>('tower');
  const animRef = useRef<number>(0);

  const initTiles = useCallback((): Tile[][] => {
    const tiles: Tile[][] = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => ({ type: 'empty' as TileType }))
    );
    // Mark path
    for (const [col, row] of PATH) {
      if (row < GRID_ROWS && col < GRID_COLS) tiles[row][col] = { type: 'grass' };
    }
    // Base
    tiles[7][19] = { type: 'base' };
    return tiles;
  }, []);

  const spawnWave = useCallback((wave: number) => {
    const s = stateRef.current;
    const count = 5 + wave * 3;
    for (let i = 0; i < count; i++) {
      const isBoss = wave > 3 && i === 0;
      s.enemies.push({
        id: eid3++,
        x: -i * 40,
        y: 7 * CELL_H + CELL_H / 2 + 40,
        pathIdx: 0,
        hp: isBoss ? 20 + wave * 5 : 5 + wave * 2,
        maxHp: isBoss ? 20 + wave * 5 : 5 + wave * 2,
        speed: isBoss ? 0.5 : 0.8 + Math.random() * 0.4,
        color: isBoss ? '#f43f5e' : wave > 2 ? '#a855f7' : '#22d3ee',
        reward: isBoss ? 30 : 10,
      });
    }
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.won = false;
    s.gold = 100;
    s.lives = 20;
    s.wave = 0;
    s.score = 0;
    s.tiles = initTiles();
    s.towers = [];
    s.enemies = [];
    s.projectiles = [];
    s.frameCount = 0;
    s.waveTimer = 120;
    setGameState('running');
    setDisplayGold(100);
    setDisplayLives(20);
    setDisplayWave(0);
  }, [initTiles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) { startGame(); return; }
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
      const my = (e.clientY - rect.top) * (CANVAS_H / rect.height) - 40;
      const col = Math.floor(mx / CELL_W);
      const row = Math.floor(my / CELL_H);
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;

      const tile = s.tiles[row][col];
      const isPath = PATH.some(([pc, pr]) => pc === col && pr === row);
      if (isPath || tile.type === 'base') return;

      if (s.selectedTool === 'tower' && s.gold >= 50 && tile.type === 'empty') {
        s.tiles[row][col] = { type: 'tower' };
        s.towers.push({ col, row, range: 3, damage: 2, cooldown: 0, maxCooldown: 40, color: '#facc15' });
        s.gold -= 50;
        setDisplayGold(s.gold);
      } else if (s.selectedTool === 'wall' && s.gold >= 20 && tile.type === 'empty') {
        s.tiles[row][col] = { type: 'stone', hp: 5 };
        s.gold -= 20;
        setDisplayGold(s.gold);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Top HUD bar
      ctx.fillStyle = '#0a0a20';
      ctx.fillRect(0, 0, CANVAS_W, 40);
      ctx.strokeStyle = '#22d3ee33';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(CANVAS_W, 40); ctx.stroke();

      // HUD text
      ctx.font = 'bold 11px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#facc15'; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 6;
      ctx.fillText(`💰 ${s.gold}`, 10, 26);
      ctx.fillStyle = '#f43f5e'; ctx.shadowColor = '#f43f5e';
      ctx.fillText(`❤ ${s.lives}`, 130, 26);
      ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee';
      ctx.fillText(`WAVE ${s.wave}`, 260, 26);
      ctx.fillStyle = '#4ade80'; ctx.shadowColor = '#4ade80';
      ctx.fillText(`SCORE: ${s.score}`, 420, 26);
      ctx.shadowBlur = 0;

      // Grid
      ctx.save();
      ctx.translate(0, 40);
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const tile = s.tiles[r][c];
          ctx.fillStyle = TILE_COLORS[tile.type];
          ctx.fillRect(c * CELL_W, r * CELL_H, CELL_W - 1, CELL_H - 1);

          if (tile.type === 'tower') {
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#facc15';
            ctx.fillRect(c * CELL_W + 4, r * CELL_H + 4, CELL_W - 9, CELL_H - 9);
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(c * CELL_W + 10, r * CELL_H + 10, CELL_W - 21, CELL_H - 21);
            ctx.shadowBlur = 0;
          } else if (tile.type === 'stone') {
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(c * CELL_W + 3, r * CELL_H + 3, CELL_W - 7, CELL_H - 7);
          } else if (tile.type === 'base') {
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(c * CELL_W + 2, r * CELL_H + 2, CELL_W - 5, CELL_H - 5);
            ctx.shadowBlur = 0;
          } else if (tile.type === 'grass') {
            ctx.fillStyle = '#22c55e33';
            ctx.fillRect(c * CELL_W, r * CELL_H, CELL_W - 1, CELL_H - 1);
          }
        }
      }

      // Projectiles
      for (const proj of s.projectiles) {
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y - 40, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Enemies
      for (const e of s.enemies) {
        if (e.x < -30) continue;
        const ex = e.x;
        const ey = e.y - 40;
        const r = e.maxHp > 15 ? 14 : 10;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(ex - r, ey - r - 6, r * 2, 4);
        ctx.fillStyle = e.color;
        ctx.fillRect(ex - r, ey - r - 6, (e.hp / e.maxHp) * r * 2, 4);
      }

      ctx.restore();
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver || s.won) return;
      s.frameCount++;

      // Wave timer
      if (s.enemies.length === 0) {
        s.waveTimer--;
        if (s.waveTimer <= 0) {
          s.wave++;
          setDisplayWave(s.wave);
          spawnWave(s.wave);
          s.waveTimer = 180;
          if (s.wave > 8) { s.won = true; s.running = false; setGameState('won'); return; }
        }
      }

      // Move enemies along path
      for (const e of s.enemies) {
        if (e.x < 0) { e.x += e.speed * 2; continue; }
        if (e.pathIdx >= PATH.length) {
          // Reached base
          s.lives--;
          setDisplayLives(s.lives);
          e.pathIdx = PATH.length + 1;
          if (s.lives <= 0) { s.gameOver = true; s.running = false; if (s.score > s.highScore) s.highScore = s.score; setGameState('over'); return; }
          continue;
        }
        const [tc, tr] = PATH[e.pathIdx];
        const tx = tc * CELL_W + CELL_W / 2;
        const ty = tr * CELL_H + CELL_H / 2 + 40;
        const dx = tx - e.x; const dy = ty - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist < e.speed + 1) {
          e.pathIdx++;
        } else {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
      }
      s.enemies = s.enemies.filter(e => e.pathIdx <= PATH.length);

      // Tower shooting
      for (const tower of s.towers) {
        tower.cooldown--;
        if (tower.cooldown > 0) continue;
        const tx = tower.col * CELL_W + CELL_W / 2;
        const ty = tower.row * CELL_H + CELL_H / 2 + 40;
        let closest: Enemy | null = null;
        let closestDist = Infinity;
        for (const e of s.enemies) {
          if (e.x < 0) continue;
          const d = Math.hypot(e.x - tx, e.y - ty);
          if (d < tower.range * CELL_W && d < closestDist) { closestDist = d; closest = e; }
        }
        if (closest) {
          s.projectiles.push({ x: tx, y: ty, tx: closest.x, ty: closest.y, speed: 6, color: tower.color, damage: tower.damage, enemyId: closest.id });
          tower.cooldown = tower.maxCooldown;
        }
      }

      // Move projectiles
      for (const proj of s.projectiles) {
        const dx = proj.tx - proj.x; const dy = proj.ty - proj.y;
        const dist = Math.hypot(dx, dy);
        if (dist < proj.speed + 2) {
          // Hit
          const target = s.enemies.find(e => e.id === proj.enemyId);
          if (target) {
            target.hp -= proj.damage;
            if (target.hp <= 0) {
              s.gold += target.reward;
              s.score += target.reward;
              setDisplayGold(s.gold);
              target.hp = -1;
            }
          }
          proj.x = -100;
        } else {
          proj.x += (dx / dist) * proj.speed;
          proj.y += (dy / dist) * proj.speed;
        }
      }
      s.projectiles = s.projectiles.filter(p => p.x > -50);
      s.enemies = s.enemies.filter(e => e.hp > 0);
    };

    const loop = () => { update(); draw(); animRef.current = requestAnimationFrame(loop); };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [spawnWave]);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-green-500/30 rounded-lg cursor-pointer"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(74,222,128,0.2)' }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-3xl text-green-400 mb-2" style={{ textShadow: '0 0 20px #4ade80' }}>VOXEL REALMS</h2>
            <p className="font-rajdhani text-green-300 text-lg mb-6">Tower defense — protect your base!</p>
            <button onClick={startGame} className="font-arcade text-sm bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded border border-green-400 transition-all">START GAME</button>
            <div className="mt-4 font-rajdhani text-green-300/60 text-sm text-center">
              <p>Click grid — Place tower (50💰) or wall (20💰)</p>
              <p>Survive 8 waves to win!</p>
            </div>
          </div>
        )}
        {(gameState === 'over' || gameState === 'won') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl mb-2" style={{ color: gameState === 'won' ? '#4ade80' : '#f43f5e', textShadow: `0 0 20px ${gameState === 'won' ? '#4ade80' : '#f43f5e'}` }}>
              {gameState === 'won' ? 'VICTORY!' : 'BASE DESTROYED!'}
            </h2>
            <p className="font-arcade text-yellow-400 text-sm mb-1">SCORE: {stateRef.current.score}</p>
            <p className="font-arcade text-cyan-400 text-sm mb-6">WAVE: {displayWave}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded border border-green-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { setSelectedTool('tower'); stateRef.current.selectedTool = 'tower'; }}
          className={`font-arcade text-xs px-4 py-2 rounded border transition-all ${selectedTool === 'tower' ? 'border-yellow-400 text-yellow-400 bg-yellow-900/30' : 'border-gray-600 text-gray-400'}`}
        >
          🏰 TOWER (50💰)
        </button>
        <button
          onClick={() => { setSelectedTool('wall'); stateRef.current.selectedTool = 'wall'; }}
          className={`font-arcade text-xs px-4 py-2 rounded border transition-all ${selectedTool === 'wall' ? 'border-gray-400 text-gray-300 bg-gray-800/50' : 'border-gray-600 text-gray-400'}`}
        >
          🧱 WALL (20💰)
        </button>
      </div>
      <p className="font-rajdhani text-green-400/60 text-sm">Click empty tiles to build • Enemies follow the green path</p>
    </div>
  );
}

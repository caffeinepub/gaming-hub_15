import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 700;
const CANVAS_H = 500;
const PLAYER_SPEED = 3.5;
const PLAYER_R = 16;

interface Enemy {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  r: number;
  color: string;
  type: 'goblin' | 'orc' | 'mage';
  shootTimer: number;
}

interface Rune {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  power: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
}

interface Pickup {
  x: number; y: number;
  type: 'mana' | 'health';
}

let eid2 = 0;

const RUNE_COLORS = ['#a855f7', '#22d3ee', '#f43f5e', '#4ade80', '#facc15'];

export default function RuneQuestGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    score: 0,
    level: 1,
    player: { x: CANVAS_W / 2, y: CANVAS_H / 2, hp: 6, maxHp: 6, mana: 5, maxMana: 5, iframes: 0, castTimer: 0 },
    enemies: [] as Enemy[],
    runes: [] as Rune[],
    particles: [] as Particle[],
    pickups: [] as Pickup[],
    frameCount: 0,
    highScore: 0,
    keys: new Set<string>(),
    mouseX: CANVAS_W / 2,
    mouseY: CANVAS_H / 2,
    selectedRune: 0,
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [selectedRune, setSelectedRune] = useState(0);
  const animRef = useRef<number>(0);

  const spawnLevel = useCallback((level: number) => {
    const s = stateRef.current;
    const count = 4 + level * 2;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 180 + Math.random() * 80;
      const type: 'goblin' | 'orc' | 'mage' = level > 2 && Math.random() < 0.25 ? 'mage' : level > 1 && Math.random() < 0.3 ? 'orc' : 'goblin';
      s.enemies.push({
        id: eid2++,
        x: CANVAS_W / 2 + Math.cos(angle) * dist,
        y: CANVAS_H / 2 + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        hp: type === 'orc' ? 4 : 2,
        maxHp: type === 'orc' ? 4 : 2,
        r: type === 'orc' ? 20 : 14,
        color: type === 'orc' ? '#4ade80' : type === 'mage' ? '#a855f7' : '#f43f5e',
        type,
        shootTimer: 80 + Math.random() * 60,
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
    s.level = 1;
    s.player = { x: CANVAS_W / 2, y: CANVAS_H / 2, hp: 6, maxHp: 6, mana: 5, maxMana: 5, iframes: 0, castTimer: 0 };
    s.enemies = [];
    s.runes = [];
    s.particles = [];
    s.pickups = [];
    s.frameCount = 0;
    spawnLevel(1);
    setGameState('running');
    setDisplayScore(0);
    setDisplayLevel(1);
  }, [spawnLevel]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      stateRef.current.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
      if (e.code === 'Digit1') { stateRef.current.selectedRune = 0; setSelectedRune(0); }
      if (e.code === 'Digit2') { stateRef.current.selectedRune = 1; setSelectedRune(1); }
      if (e.code === 'Digit3') { stateRef.current.selectedRune = 2; setSelectedRune(2); }
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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
      stateRef.current.mouseY = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    };

    const handleClick = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) { startGame(); return; }
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
      const my = (e.clientY - rect.top) * (CANVAS_H / rect.height);
      if (s.player.mana > 0 && s.player.castTimer <= 0) {
        const dx = mx - s.player.x;
        const dy = my - s.player.y;
        const dist = Math.hypot(dx, dy);
        const color = RUNE_COLORS[s.selectedRune % RUNE_COLORS.length];
        s.runes.push({
          x: s.player.x, y: s.player.y,
          vx: (dx / dist) * 9,
          vy: (dy / dist) * 9,
          life: 1,
          color,
          power: s.selectedRune === 1 ? 2 : s.selectedRune === 2 ? 3 : 1,
        });
        s.player.mana--;
        s.player.castTimer = 10;
        addParticles(s.player.x, s.player.y, color, 5);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [startGame, addParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Mystical grid
      ctx.strokeStyle = 'rgba(168,85,247,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
      for (let y = 0; y < CANVAS_H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

      // Arena circle
      ctx.strokeStyle = 'rgba(168,85,247,0.3)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 220, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pickups
      for (const pk of s.pickups) {
        ctx.shadowColor = pk.type === 'mana' ? '#a855f7' : '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = pk.type === 'mana' ? '#a855f7' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(pk.x, pk.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pk.type === 'mana' ? 'M' : 'H', pk.x, pk.y + 4);
        ctx.shadowBlur = 0;
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

      // Runes
      for (const r of s.runes) {
        ctx.globalAlpha = r.life;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6 + r.power * 2, 0, Math.PI * 2);
        ctx.fill();
        // Rune symbol
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦', r.x, r.y + 4);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Enemies
      for (const e of s.enemies) {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = e.color;
        if (e.type === 'orc') {
          ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
        } else if (e.type === 'mage') {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            if (i === 0) ctx.moveTo(e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r);
            else ctx.lineTo(e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
        }
        // HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2, 4);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - e.r, e.y - e.r - 8, (e.hp / e.maxHp) * e.r * 2, 4);
        ctx.shadowBlur = 0;
      }

      // Player
      const p = s.player;
      const alpha = p.iframes > 0 ? (Math.floor(p.iframes / 4) % 2 === 0 ? 0.3 : 1) : 1;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 25;
      // Outer ring
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_R + 4, 0, Math.PI * 2);
      ctx.stroke();
      // Body
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦', p.x, p.y + 5);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Aim line
      const dx = s.mouseX - p.x;
      const dy = s.mouseY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        const runeColor = RUNE_COLORS[s.selectedRune % RUNE_COLORS.length];
        ctx.strokeStyle = `${runeColor}55`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (dx / dist) * 80, p.y + (dy / dist) * 80);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // HUD - HP
      for (let i = 0; i < p.maxHp; i++) {
        ctx.fillStyle = i < p.hp ? '#f43f5e' : '#333';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = i < p.hp ? 5 : 0;
        ctx.beginPath();
        ctx.arc(20 + i * 20, CANVAS_H - 20, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      // HUD - Mana
      for (let i = 0; i < p.maxMana; i++) {
        ctx.fillStyle = i < p.mana ? '#a855f7' : '#333';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = i < p.mana ? 5 : 0;
        ctx.fillRect(20 + i * 20, CANVAS_H - 40, 14, 14);
      }
      ctx.shadowBlur = 0;

      // HUD text
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${s.score}`, 20, 30);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.fillText(`LVL: ${s.level}`, CANVAS_W - 150, 30);
      ctx.shadowBlur = 0;

      // Rune selector
      const runeNames = ['FIRE', 'ICE', 'VOID'];
      for (let i = 0; i < 3; i++) {
        const rx = CANVAS_W / 2 - 80 + i * 80;
        const ry = CANVAS_H - 30;
        const isSelected = s.selectedRune === i;
        ctx.fillStyle = isSelected ? RUNE_COLORS[i] : '#333';
        ctx.shadowColor = RUNE_COLORS[i];
        ctx.shadowBlur = isSelected ? 10 : 0;
        ctx.fillRect(rx - 25, ry - 15, 50, 20);
        ctx.fillStyle = isSelected ? '#fff' : '#888';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}:${runeNames[i]}`, rx, ry - 1);
        ctx.shadowBlur = 0;
      }
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;
      s.frameCount++;

      const p = s.player;
      if (s.keys.has('ArrowLeft') || s.keys.has('KeyA')) p.x = Math.max(PLAYER_R, p.x - PLAYER_SPEED);
      if (s.keys.has('ArrowRight') || s.keys.has('KeyD')) p.x = Math.min(CANVAS_W - PLAYER_R, p.x + PLAYER_SPEED);
      if (s.keys.has('ArrowUp') || s.keys.has('KeyW')) p.y = Math.max(PLAYER_R, p.y - PLAYER_SPEED);
      if (s.keys.has('ArrowDown') || s.keys.has('KeyS')) p.y = Math.min(CANVAS_H - PLAYER_R, p.y + PLAYER_SPEED);

      if (p.castTimer > 0) p.castTimer--;
      if (p.iframes > 0) p.iframes--;

      // Mana regen
      if (s.frameCount % 90 === 0 && p.mana < p.maxMana) p.mana++;

      // Move runes
      for (const r of s.runes) {
        r.x += r.vx; r.y += r.vy;
        r.life -= 0.015;
      }
      s.runes = s.runes.filter(r => r.life > 0 && r.x > 0 && r.x < CANVAS_W && r.y > 0 && r.y < CANVAS_H);

      // Enemy AI
      for (const e of s.enemies) {
        const dx = p.x - e.x; const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (e.type === 'mage') {
          e.shootTimer--;
          if (e.shootTimer <= 0 && dist < 250) {
            s.runes.push({ x: e.x, y: e.y, vx: (dx / dist) * 4, vy: (dy / dist) * 4, life: 1, color: '#ff6b6b', power: 1 });
            e.shootTimer = 100;
          }
          if (dist > 120) { e.vx = (dx / dist) * 1.2; e.vy = (dy / dist) * 1.2; }
          else { e.vx *= 0.9; e.vy *= 0.9; }
        } else {
          e.vx = (dx / dist) * (e.type === 'orc' ? 1.2 : 1.8);
          e.vy = (dy / dist) * (e.type === 'orc' ? 1.2 : 1.8);
        }
        e.x += e.vx; e.y += e.vy;
        e.x = Math.max(e.r, Math.min(CANVAS_W - e.r, e.x));
        e.y = Math.max(e.r, Math.min(CANVAS_H - e.r, e.y));
      }

      // Rune-enemy collision (player runes only)
      const deadRunes = new Set<number>();
      const deadEnemies = new Set<number>();
      for (let ri = 0; ri < s.runes.length; ri++) {
        const r = s.runes[ri];
        // Only player runes (not red)
        if (r.color === '#ff6b6b') continue;
        for (const e of s.enemies) {
          if (Math.hypot(r.x - e.x, r.y - e.y) < e.r + 6 + r.power * 2) {
            deadRunes.add(ri);
            e.hp -= r.power;
            addParticles(e.x, e.y, e.color, 6);
            if (e.hp <= 0) {
              deadEnemies.add(e.id);
              s.score += e.type === 'orc' ? 20 : e.type === 'mage' ? 30 : 10;
              addParticles(e.x, e.y, e.color, 15);
              // Chance to drop pickup
              if (Math.random() < 0.3) {
                s.pickups.push({ x: e.x, y: e.y, type: Math.random() < 0.5 ? 'mana' : 'health' });
              }
            }
            break;
          }
        }
      }
      s.runes = s.runes.filter((_, i) => !deadRunes.has(i));
      s.enemies = s.enemies.filter(e => !deadEnemies.has(e.id));

      // Enemy rune hits player
      if (p.iframes <= 0) {
        for (const r of s.runes) {
          if (r.color === '#ff6b6b' && Math.hypot(r.x - p.x, r.y - p.y) < PLAYER_R + 6) {
            p.hp--;
            p.iframes = 60;
            addParticles(p.x, p.y, '#f43f5e', 8);
            r.life = 0;
          }
        }
        // Enemy melee
        for (const e of s.enemies) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + PLAYER_R) {
            p.hp--;
            p.iframes = 60;
            addParticles(p.x, p.y, '#f43f5e', 8);
            break;
          }
        }
      }

      // Pickups
      for (const pk of s.pickups) {
        if (Math.hypot(pk.x - p.x, pk.y - p.y) < PLAYER_R + 10) {
          if (pk.type === 'mana') p.mana = Math.min(p.maxMana, p.mana + 2);
          else p.hp = Math.min(p.maxHp, p.hp + 1);
          pk.x = -100;
        }
      }
      s.pickups = s.pickups.filter(pk => pk.x > -50);

      // Particles
      for (const pt of s.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.04; }
      s.particles = s.particles.filter(pt => pt.life > 0);

      // Level clear
      if (s.enemies.length === 0) {
        s.level++;
        spawnLevel(s.level);
        p.mana = p.maxMana;
        setDisplayLevel(s.level);
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
  }, [addParticles, spawnLevel]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-purple-500/30 rounded-lg cursor-crosshair"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-3xl text-purple-400 mb-2" style={{ textShadow: '0 0 20px #a855f7' }}>RUNE QUEST</h2>
            <p className="font-rajdhani text-purple-300 text-lg mb-6">Cast runes to defeat your foes</p>
            <button onClick={startGame} className="font-arcade text-sm bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded border border-purple-400 transition-all">START QUEST</button>
            <div className="mt-4 font-rajdhani text-purple-300/60 text-sm text-center">
              <p>WASD/Arrows — Move</p>
              <p>Click — Cast rune toward cursor</p>
              <p>1/2/3 — Switch rune type</p>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl text-red-400 mb-2" style={{ textShadow: '0 0 20px #f43f5e' }}>FALLEN!</h2>
            <p className="font-arcade text-purple-400 text-sm mb-1">SCORE: {displayScore}</p>
            <p className="font-arcade text-yellow-400 text-sm mb-1">LEVEL: {displayLevel}</p>
            <p className="font-arcade text-white/50 text-xs mb-6">BEST: {stateRef.current.highScore}</p>
            <button onClick={startGame} className="font-arcade text-sm bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded border border-purple-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-purple-400/60 text-sm">WASD to move • Click to cast runes • 1/2/3 switch rune</p>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 700;
const CANVAS_H = 450;
const FIELD_TOP = 60;
const FIELD_BOTTOM = CANVAS_H - 40;
const FIELD_LEFT = 30;
const FIELD_RIGHT = CANVAS_W - 30;
const GOAL_W = 12;
const GOAL_H = 100;
const PLAYER_R = 14;
const BALL_R = 10;
const PLAYER_SPEED = 4;
const AI_SPEED = 3;

export default function NeonKickGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    running: false,
    gameOver: false,
    player: { x: 150, y: CANVAS_H / 2, vx: 0, vy: 0 },
    ai: { x: CANVAS_W - 150, y: CANVAS_H / 2, vx: 0, vy: 0 },
    ball: { x: CANVAS_W / 2, y: CANVAS_H / 2, vx: 3, vy: 1.5 },
    scoreP: 0,
    scoreAI: 0,
    frameCount: 0,
    keys: new Set<string>(),
    goalFlash: 0,
    goalFlashTeam: 0,
    highScore: 0,
  });
  const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
  const [scoreP, setScoreP] = useState(0);
  const [scoreAI, setScoreAI] = useState(0);
  const animRef = useRef<number>(0);
  const WIN_SCORE = 5;

  const resetBall = useCallback((dir: number) => {
    const s = stateRef.current;
    s.ball = { x: CANVAS_W / 2, y: CANVAS_H / 2, vx: dir * 3, vy: (Math.random() - 0.5) * 3 };
    s.player = { x: 150, y: CANVAS_H / 2, vx: 0, vy: 0 };
    s.ai = { x: CANVAS_W - 150, y: CANVAS_H / 2, vx: 0, vy: 0 };
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.gameOver = false;
    s.scoreP = 0;
    s.scoreAI = 0;
    s.frameCount = 0;
    s.goalFlash = 0;
    resetBall(1);
    setGameState('running');
    setScoreP(0);
    setScoreAI(0);
  }, [resetBall]);

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
      // Field
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Field lines
      ctx.strokeStyle = 'rgba(74,222,128,0.3)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 5;
      // Border
      ctx.strokeRect(FIELD_LEFT, FIELD_TOP, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - FIELD_TOP);
      // Center line
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, FIELD_TOP);
      ctx.lineTo(CANVAS_W / 2, FIELD_BOTTOM);
      ctx.stroke();
      // Center circle
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Goals
      const goalY = CANVAS_H / 2 - GOAL_H / 2;
      // Left goal (player)
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.strokeRect(FIELD_LEFT - GOAL_W, goalY, GOAL_W, GOAL_H);
      // Right goal (AI)
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.strokeRect(FIELD_RIGHT, goalY, GOAL_W, GOAL_H);
      ctx.shadowBlur = 0;

      // Goal flash
      if (s.goalFlash > 0) {
        ctx.fillStyle = s.goalFlashTeam === 1 ? 'rgba(34,211,238,0.15)' : 'rgba(244,63,94,0.15)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        s.goalFlash--;
      }

      // Player
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P', s.player.x, s.player.y + 4);
      ctx.shadowBlur = 0;

      // AI
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(s.ai.x, s.ai.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('A', s.ai.x, s.ai.y + 4);
      ctx.shadowBlur = 0;

      // Ball
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Score
      ctx.font = 'bold 32px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.fillText(`${s.scoreP}`, CANVAS_W / 2 - 60, 40);
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.fillText(`${s.scoreAI}`, CANVAS_W / 2 + 60, 40);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.shadowBlur = 0;
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(':', CANVAS_W / 2, 40);

      // Controls hint
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillText('WASD/ARROWS', CANVAS_W / 2, CANVAS_H - 10);
    };

    const update = () => {
      const s = stateRef.current;
      if (!s.running || s.gameOver) return;
      s.frameCount++;

      // Player movement
      const p = s.player;
      if (s.keys.has('ArrowLeft') || s.keys.has('KeyA')) p.x = Math.max(FIELD_LEFT + PLAYER_R, p.x - PLAYER_SPEED);
      if (s.keys.has('ArrowRight') || s.keys.has('KeyD')) p.x = Math.min(CANVAS_W / 2 - PLAYER_R, p.x + PLAYER_SPEED);
      if (s.keys.has('ArrowUp') || s.keys.has('KeyW')) p.y = Math.max(FIELD_TOP + PLAYER_R, p.y - PLAYER_SPEED);
      if (s.keys.has('ArrowDown') || s.keys.has('KeyS')) p.y = Math.min(FIELD_BOTTOM - PLAYER_R, p.y + PLAYER_SPEED);

      // AI movement
      const ai = s.ai;
      const ball = s.ball;
      const aiDx = ball.x - ai.x; const aiDy = ball.y - ai.y;
      const aiDist = Math.hypot(aiDx, aiDy);
      if (aiDist > 5) {
        ai.x += (aiDx / aiDist) * AI_SPEED;
        ai.y += (aiDy / aiDist) * AI_SPEED;
      }
      ai.x = Math.max(CANVAS_W / 2 + PLAYER_R, Math.min(FIELD_RIGHT - PLAYER_R, ai.x));
      ai.y = Math.max(FIELD_TOP + PLAYER_R, Math.min(FIELD_BOTTOM - PLAYER_R, ai.y));

      // Ball physics
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.y - BALL_R < FIELD_TOP) { ball.y = FIELD_TOP + BALL_R; ball.vy = Math.abs(ball.vy); }
      if (ball.y + BALL_R > FIELD_BOTTOM) { ball.y = FIELD_BOTTOM - BALL_R; ball.vy = -Math.abs(ball.vy); }

      // Player-ball collision
      const pdx = ball.x - p.x; const pdy = ball.y - p.y;
      if (Math.hypot(pdx, pdy) < PLAYER_R + BALL_R) {
        const dist = Math.hypot(pdx, pdy);
        ball.vx = (pdx / dist) * 7;
        ball.vy = (pdy / dist) * 7;
      }

      // AI-ball collision
      const adx = ball.x - ai.x; const ady = ball.y - ai.y;
      if (Math.hypot(adx, ady) < PLAYER_R + BALL_R) {
        const dist = Math.hypot(adx, ady);
        ball.vx = (adx / dist) * 7;
        ball.vy = (ady / dist) * 7;
      }

      // Friction
      ball.vx *= 0.99;
      ball.vy *= 0.99;
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 12) { ball.vx = (ball.vx / speed) * 12; ball.vy = (ball.vy / speed) * 12; }

      // Goals
      const goalY = CANVAS_H / 2 - GOAL_H / 2;
      // Left goal (AI scores)
      if (ball.x - BALL_R < FIELD_LEFT - GOAL_W + 5 && ball.y > goalY && ball.y < goalY + GOAL_H) {
        s.scoreAI++;
        setScoreAI(s.scoreAI);
        s.goalFlash = 30; s.goalFlashTeam = 2;
        if (s.scoreAI >= WIN_SCORE) { s.gameOver = true; s.running = false; setGameState('over'); return; }
        resetBall(-1);
      }
      // Right goal (player scores)
      if (ball.x + BALL_R > FIELD_RIGHT + GOAL_W - 5 && ball.y > goalY && ball.y < goalY + GOAL_H) {
        s.scoreP++;
        setScoreP(s.scoreP);
        s.goalFlash = 30; s.goalFlashTeam = 1;
        if (s.scoreP >= WIN_SCORE) { s.gameOver = true; s.running = false; setGameState('over'); return; }
        resetBall(1);
      }

      // Keep ball in field (sides)
      if (ball.x - BALL_R < FIELD_LEFT) { ball.x = FIELD_LEFT + BALL_R; ball.vx = Math.abs(ball.vx); }
      if (ball.x + BALL_R > FIELD_RIGHT) { ball.x = FIELD_RIGHT - BALL_R; ball.vx = -Math.abs(ball.vx); }
    };

    const loop = () => { update(); draw(); animRef.current = requestAnimationFrame(loop); };
    draw();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [resetBall]);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="border border-yellow-500/30 rounded-lg"
          style={{ maxWidth: '100%', boxShadow: '0 0 30px rgba(250,204,21,0.2)' }}
          onClick={() => { if (!stateRef.current.running || stateRef.current.gameOver) startGame(); }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
            <h2 className="font-arcade text-3xl text-yellow-400 mb-2" style={{ textShadow: '0 0 20px #facc15' }}>NEON KICK</h2>
            <p className="font-rajdhani text-yellow-300 text-lg mb-6">First to {WIN_SCORE} goals wins!</p>
            <button onClick={startGame} className="font-arcade text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-6 py-3 rounded border border-yellow-400 transition-all">KICK OFF!</button>
            <div className="mt-4 font-rajdhani text-yellow-300/60 text-sm text-center">
              <p>WASD / Arrows — Move player</p>
              <p>Run into the ball to kick it</p>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="font-arcade text-2xl mb-2" style={{ color: scoreP >= WIN_SCORE ? '#22d3ee' : '#f43f5e', textShadow: `0 0 20px ${scoreP >= WIN_SCORE ? '#22d3ee' : '#f43f5e'}` }}>
              {scoreP >= WIN_SCORE ? 'YOU WIN!' : 'AI WINS!'}
            </h2>
            <p className="font-arcade text-yellow-400 text-sm mb-1">{scoreP} — {scoreAI}</p>
            <button onClick={startGame} className="mt-4 font-arcade text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-6 py-3 rounded border border-yellow-400 transition-all">PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="font-rajdhani text-yellow-400/60 text-sm">WASD/Arrows to move • Run into ball to kick</p>
    </div>
  );
}

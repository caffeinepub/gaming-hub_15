import { useEffect, useRef, useState, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

function randomFood(snake: Point[]): Point {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
    food: { x: 15, y: 10 },
    score: 0,
    gameOver: false,
    started: false,
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = 'rgba(136,255,136,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Food
    const fx = s.food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = s.food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff2d78';
    ctx.beginPath();
    ctx.arc(fx, fy, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    s.snake.forEach((seg, i) => {
      const x = seg.x * CELL_SIZE;
      const y = seg.y * CELL_SIZE;
      const isHead = i === 0;
      ctx.shadowColor = isHead ? '#39ff14' : '#39ff14';
      ctx.shadowBlur = isHead ? 20 : 8;
      ctx.fillStyle = isHead ? '#39ff14' : `rgba(57,255,20,${0.9 - i * 0.03})`;
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      if (isHead) {
        ctx.fillStyle = '#0a0a0a';
        const eyeOffset = 5;
        if (s.direction === 'RIGHT' || s.direction === 'LEFT') {
          const ex = s.direction === 'RIGHT' ? x + CELL_SIZE - 7 : x + 5;
          ctx.fillRect(ex, y + 4, 3, 3);
          ctx.fillRect(ex, y + CELL_SIZE - 7, 3, 3);
        } else {
          const ey = s.direction === 'DOWN' ? y + CELL_SIZE - 7 : y + 5;
          ctx.fillRect(x + 4, ey, 3, 3);
          ctx.fillRect(x + CELL_SIZE - 7, ey, 3, 3);
        }
        void eyeOffset;
      }
    });
    ctx.shadowBlur = 0;
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || !s.started) return;

    s.direction = s.nextDirection;
    const head = s.snake[0];
    const newHead: Point = { x: head.x, y: head.y };

    if (s.direction === 'UP') newHead.y -= 1;
    else if (s.direction === 'DOWN') newHead.y += 1;
    else if (s.direction === 'LEFT') newHead.x -= 1;
    else newHead.x += 1;

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      s.gameOver = true;
      setGameOver(true);
      return;
    }

    // Self collision
    if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      s.gameOver = true;
      setGameOver(true);
      return;
    }

    const ateFood = newHead.x === s.food.x && newHead.y === s.food.y;
    s.snake = [newHead, ...s.snake];
    if (ateFood) {
      s.score += 10;
      setScore(s.score);
      s.food = randomFood(s.snake);
    } else {
      s.snake.pop();
    }

    draw();
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 10, y: 10 }];
    s.direction = 'RIGHT';
    s.nextDirection = 'RIGHT';
    s.food = { x: 15, y: 10 };
    s.score = 0;
    s.gameOver = false;
    s.started = true;
    setScore(0);
    setGameOver(false);
    setStarted(true);
    draw();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (started && !gameOver) {
      intervalRef.current = setInterval(tick, INITIAL_SPEED);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, gameOver, tick]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
        if (dir !== opposites[s.direction]) {
          s.nextDirection = dir;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      {/* Score bar */}
      <div className="flex items-center gap-8 font-orbitron text-sm">
        <div className="flex items-center gap-2">
          <span className="text-foreground/50">SCORE</span>
          <span className="neon-text-green font-bold text-lg">{score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground/50">CONTROLS</span>
          <span className="text-foreground/70 text-xs">WASD / ARROWS</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border border-neon-green/30 rounded"
          style={{ boxShadow: '0 0 20px rgba(57,255,20,0.2)' }}
        />

        {/* Overlay */}
        {(!started || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded gap-4">
            {gameOver && (
              <>
                <div className="font-arcade text-xl neon-text-pink">GAME OVER</div>
                <div className="font-orbitron text-sm text-foreground/70">Score: <span className="neon-text-green">{score}</span></div>
              </>
            )}
            {!started && !gameOver && (
              <div className="font-arcade text-base neon-text-green text-center leading-8">SNAKE</div>
            )}
            <button
              onClick={startGame}
              className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-green/50 bg-neon-green/10 text-neon-green rounded hover:bg-neon-green/20 transition-all"
              style={{ boxShadow: '0 0 10px rgba(57,255,20,0.3)' }}
            >
              {gameOver ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
      </div>

      <p className="font-rajdhani text-sm text-foreground/40">Eat the pink dots to grow. Avoid walls and yourself!</p>
    </div>
  );
}

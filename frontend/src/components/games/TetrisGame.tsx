import { useEffect, useRef, useState, useCallback } from 'react';

const COLS = 10;
const ROWS = 20;
const CELL = 28;
const W = COLS * CELL;
const H = ROWS * CELL;

const TETROMINOES = [
  { shape: [[1,1,1,1]], color: '#00f5ff' },           // I - cyan
  { shape: [[1,1],[1,1]], color: '#f5e642' },          // O - yellow
  { shape: [[0,1,0],[1,1,1]], color: '#c542f5' },      // T - purple
  { shape: [[0,1,1],[1,1,0]], color: '#39ff14' },      // S - green
  { shape: [[1,1,0],[0,1,1]], color: '#ff2d78' },      // Z - pink
  { shape: [[1,0,0],[1,1,1]], color: '#ff8c00' },      // J - orange
  { shape: [[0,0,1],[1,1,1]], color: '#00bfff' },      // L - blue
];

type Board = (string | null)[][];
type Piece = { shape: number[][]; color: string; x: number; y: number };

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece(): Piece {
  const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  return { shape: t.shape, color: t.color, x: Math.floor(COLS / 2) - Math.floor(t.shape[0].length / 2), y: 0 };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function isValid(board: Board, piece: Piece, dx = 0, dy = 0, shape = piece.shape): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function placePiece(board: Board, piece: Piece): Board {
  const nb = board.map(r => [...r]);
  piece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        const ny = piece.y + r;
        const nx = piece.x + c;
        if (ny >= 0) nb[ny][nx] = piece.color;
      }
    });
  });
  return nb;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const nb = board.filter(row => row.some(c => !c));
  const cleared = ROWS - nb.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...empty, ...nb], cleared };
}

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>(emptyBoard());
  const pieceRef = useRef<Piece>(randomPiece());
  const nextPieceRef = useRef<Piece>(randomPiece());
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
    }

    // Board cells
    boardRef.current.forEach((row, r) => {
      row.forEach((color, c) => {
        if (color) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = color;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 4);
        }
      });
    });

    // Ghost piece
    const piece = pieceRef.current;
    let ghostY = piece.y;
    while (isValid(boardRef.current, piece, 0, ghostY - piece.y + 1)) ghostY++;
    if (ghostY !== piece.y) {
      piece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            ctx.fillStyle = `${piece.color}33`;
            ctx.strokeStyle = `${piece.color}66`;
            ctx.lineWidth = 1;
            ctx.fillRect((piece.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
            ctx.strokeRect((piece.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
          }
        });
      });
    }

    // Active piece
    piece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell && piece.y + r >= 0) {
          ctx.shadowColor = piece.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = piece.color;
          ctx.fillRect((piece.x + c) * CELL + 1, (piece.y + r) * CELL + 1, CELL - 2, CELL - 2);
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect((piece.x + c) * CELL + 1, (piece.y + r) * CELL + 1, CELL - 2, 4);
        }
      });
    });
  }, []);

  const drawNext = useCallback(() => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 120, 80);
    const np = nextPieceRef.current;
    const offX = Math.floor((4 - np.shape[0].length) / 2);
    const offY = Math.floor((3 - np.shape.length) / 2);
    np.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          ctx.shadowColor = np.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = np.color;
          ctx.fillRect((offX + c) * 24 + 12, (offY + r) * 24 + 8, 22, 22);
          ctx.shadowBlur = 0;
        }
      });
    });
  }, []);

  const tick = useCallback(() => {
    if (gameOverRef.current || !startedRef.current) return;
    const piece = pieceRef.current;
    if (isValid(boardRef.current, piece, 0, 1)) {
      pieceRef.current = { ...piece, y: piece.y + 1 };
    } else {
      const newBoard = placePiece(boardRef.current, piece);
      const { board: clearedBoard, cleared } = clearLines(newBoard);
      boardRef.current = clearedBoard;
      const pts = [0, 100, 300, 500, 800][cleared] || 0;
      scoreRef.current += pts * levelRef.current;
      linesRef.current += cleared;
      levelRef.current = Math.floor(linesRef.current / 10) + 1;
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);

      const next = nextPieceRef.current;
      if (!isValid(boardRef.current, next)) {
        gameOverRef.current = true;
        setGameOver(true);
        return;
      }
      pieceRef.current = next;
      nextPieceRef.current = randomPiece();
      drawNext();
    }
    drawBoard();
  }, [drawBoard, drawNext]);

  const startGame = useCallback(() => {
    boardRef.current = emptyBoard();
    pieceRef.current = randomPiece();
    nextPieceRef.current = randomPiece();
    gameOverRef.current = false;
    startedRef.current = true;
    scoreRef.current = 0;
    levelRef.current = 1;
    linesRef.current = 0;
    setScore(0); setLevel(1); setLines(0); setGameOver(false); setStarted(true);
    drawBoard(); drawNext();
  }, [drawBoard, drawNext]);

  useEffect(() => {
    drawBoard(); drawNext();
  }, [drawBoard, drawNext]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (started && !gameOver) {
      const speed = Math.max(100, 600 - (level - 1) * 50);
      intervalRef.current = setInterval(tick, speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started, gameOver, level, tick]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!startedRef.current || gameOverRef.current) return;
      const piece = pieceRef.current;
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (isValid(boardRef.current, piece, -1, 0)) { pieceRef.current = { ...piece, x: piece.x - 1 }; drawBoard(); } }
      else if (e.key === 'ArrowRight') { e.preventDefault(); if (isValid(boardRef.current, piece, 1, 0)) { pieceRef.current = { ...piece, x: piece.x + 1 }; drawBoard(); } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (isValid(boardRef.current, piece, 0, 1)) { pieceRef.current = { ...piece, y: piece.y + 1 }; drawBoard(); } }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const rotated = rotate(piece.shape);
        if (isValid(boardRef.current, piece, 0, 0, rotated)) { pieceRef.current = { ...piece, shape: rotated }; drawBoard(); }
      } else if (e.key === ' ') {
        e.preventDefault();
        let dy = 0;
        while (isValid(boardRef.current, piece, 0, dy + 1)) dy++;
        pieceRef.current = { ...piece, y: piece.y + dy };
        tick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawBoard, tick]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      <div className="flex gap-8 items-start">
        {/* Canvas */}
        <div className="relative">
          <canvas ref={canvasRef} width={W} height={H} className="border border-neon-cyan/30 rounded" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.15)' }} />
          {(!started || gameOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded gap-4">
              {gameOver && <div className="font-arcade text-lg neon-text-pink">GAME OVER</div>}
              {!started && !gameOver && <div className="font-arcade text-base neon-text-cyan text-center leading-8">TETRIS</div>}
              <div className="font-orbitron text-xs text-foreground/60 text-center">↑ Rotate  ← → Move  ↓ Soft Drop  Space Hard Drop</div>
              <button onClick={startGame} className="mt-2 px-6 py-3 font-orbitron font-bold text-sm border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan rounded hover:bg-neon-cyan/20 transition-all" style={{ boxShadow: '0 0 10px rgba(0,245,255,0.3)' }}>
                {gameOver ? 'PLAY AGAIN' : 'START GAME'}
              </button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4 min-w-[120px]">
          <div className="border border-neon-cyan/20 rounded p-3 bg-card/50">
            <div className="font-orbitron text-xs text-foreground/50 mb-1">NEXT</div>
            <canvas ref={nextCanvasRef} width={120} height={80} className="rounded" />
          </div>
          <div className="border border-neon-cyan/20 rounded p-3 bg-card/50">
            <div className="font-orbitron text-xs text-foreground/50 mb-1">SCORE</div>
            <div className="font-orbitron font-bold text-lg neon-text-cyan">{score}</div>
          </div>
          <div className="border border-neon-cyan/20 rounded p-3 bg-card/50">
            <div className="font-orbitron text-xs text-foreground/50 mb-1">LEVEL</div>
            <div className="font-orbitron font-bold text-lg neon-text-green">{level}</div>
          </div>
          <div className="border border-neon-cyan/20 rounded p-3 bg-card/50">
            <div className="font-orbitron text-xs text-foreground/50 mb-1">LINES</div>
            <div className="font-orbitron font-bold text-lg text-foreground/80">{lines}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

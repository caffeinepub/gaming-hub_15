import { useState, useCallback, useEffect } from 'react';

const GRID_SIZE = 8;
type UnitType = 'soldier' | 'tank' | 'sniper';
type Team = 'player' | 'enemy';

interface Unit {
  id: number;
  type: UnitType;
  team: Team;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  moved: boolean;
  attacked: boolean;
}

interface Cell {
  unit: Unit | null;
}

const UNIT_STATS: Record<UnitType, { hp: number; attack: number; range: number; color: string; symbol: string }> = {
  soldier: { hp: 3, attack: 1, range: 1, color: '#22d3ee', symbol: '⚔' },
  tank: { hp: 6, attack: 2, range: 1, color: '#4ade80', symbol: '🛡' },
  sniper: { hp: 2, attack: 3, range: 3, color: '#facc15', symbol: '🎯' },
};

let uid = 0;

function createUnit(type: UnitType, team: Team): Unit {
  const stats = UNIT_STATS[type];
  return { id: uid++, type, team, hp: stats.hp, maxHp: stats.hp, attack: stats.attack, range: stats.range, moved: false, attacked: false };
}

function initGrid(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ unit: null }))
  );
  // Player units
  grid[7][0].unit = createUnit('tank', 'player');
  grid[7][2].unit = createUnit('soldier', 'player');
  grid[7][4].unit = createUnit('soldier', 'player');
  grid[7][6].unit = createUnit('sniper', 'player');
  grid[6][1].unit = createUnit('soldier', 'player');
  grid[6][5].unit = createUnit('sniper', 'player');
  // Enemy units
  grid[0][1].unit = createUnit('tank', 'enemy');
  grid[0][3].unit = createUnit('soldier', 'enemy');
  grid[0][5].unit = createUnit('soldier', 'enemy');
  grid[0][7].unit = createUnit('sniper', 'enemy');
  grid[1][2].unit = createUnit('soldier', 'enemy');
  grid[1][6].unit = createUnit('sniper', 'enemy');
  return grid;
}

export default function GridWarsGame() {
  const [grid, setGrid] = useState<Cell[][]>(initGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<Team>('player');
  const [phase, setPhase] = useState<'move' | 'attack'>('move');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [log, setLog] = useState<string[]>(['Your turn! Select a unit.']);
  const [score, setScore] = useState(0);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 5));
  }, []);

  const getValidMoves = useCallback((grid: Cell[][], row: number, col: number): [number, number][] => {
    const unit = grid[row][col].unit;
    if (!unit) return [];
    const moves: [number, number][] = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = row + dr; const nc = col + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !grid[nr][nc].unit) {
        moves.push([nr, nc]);
      }
    }
    return moves;
  }, []);

  const getValidAttacks = useCallback((grid: Cell[][], row: number, col: number): [number, number][] => {
    const unit = grid[row][col].unit;
    if (!unit) return [];
    const attacks: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const target = grid[r][c].unit;
        if (target && target.team !== unit.team) {
          const dist = Math.abs(r - row) + Math.abs(c - col);
          if (dist <= unit.range) attacks.push([r, c]);
        }
      }
    }
    return attacks;
  }, []);

  const endPlayerTurn = useCallback((currentGrid: Cell[][]) => {
    // Reset player units
    const newGrid = currentGrid.map(row => row.map(cell => ({
      ...cell,
      unit: cell.unit ? { ...cell.unit, moved: false, attacked: false } : null,
    })));

    // Enemy AI
    const enemyUnits: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (newGrid[r][c].unit?.team === 'enemy') enemyUnits.push([r, c]);

    for (const [er, ec] of enemyUnits) {
      const unit = newGrid[er][ec].unit;
      if (!unit) continue;

      // Try attack first
      const attacks = getValidAttacks(newGrid, er, ec);
      if (attacks.length > 0) {
        const [tr, tc] = attacks[Math.floor(Math.random() * attacks.length)];
        const target = newGrid[tr][tc].unit!;
        target.hp -= unit.attack;
        if (target.hp <= 0) newGrid[tr][tc].unit = null;
        continue;
      }

      // Move toward nearest player
      const moves = getValidMoves(newGrid, er, ec);
      if (moves.length > 0) {
        let bestMove = moves[0];
        let bestDist = Infinity;
        for (const [mr, mc] of moves) {
          for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
              if (newGrid[r][c].unit?.team === 'player') {
                const d = Math.abs(mr - r) + Math.abs(mc - c);
                if (d < bestDist) { bestDist = d; bestMove = [mr, mc]; }
              }
        }
        newGrid[bestMove[0]][bestMove[1]].unit = { ...unit };
        newGrid[er][ec].unit = null;
      }
    }

    // Check win/lose
    let playerCount = 0; let enemyCount = 0;
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c].unit?.team === 'player') playerCount++;
        if (newGrid[r][c].unit?.team === 'enemy') enemyCount++;
      }

    if (enemyCount === 0) { setGameState('won'); }
    else if (playerCount === 0) { setGameState('lost'); }

    setGrid(newGrid);
    setTurn('player');
    setPhase('move');
    setSelected(null);
    addLog('Enemy turn done. Your move!');
  }, [getValidAttacks, getValidMoves, addLog]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState !== 'playing' || turn !== 'player') return;
    const unit = grid[row][col].unit;

    if (selected) {
      const [sr, sc] = selected;
      const selUnit = grid[sr][sc].unit;
      if (!selUnit) { setSelected(null); return; }

      if (phase === 'move') {
        const moves = getValidMoves(grid, sr, sc);
        const isValidMove = moves.some(([r, c]) => r === row && c === col);
        if (isValidMove && !selUnit.moved) {
          const newGrid = grid.map(r => r.map(c => ({ ...c, unit: c.unit ? { ...c.unit } : null })));
          newGrid[row][col].unit = { ...selUnit, moved: true };
          newGrid[sr][sc].unit = null;
          setGrid(newGrid);
          setSelected([row, col]);
          setPhase('attack');
          addLog(`${selUnit.type} moved. Now select attack target or click elsewhere.`);
          return;
        }
        // Switch to attack phase if clicking same unit
        if (row === sr && col === sc) { setPhase('attack'); return; }
      }

      if (phase === 'attack') {
        const attacks = getValidAttacks(grid, sr, sc);
        const isValidAttack = attacks.some(([r, c]) => r === row && c === col);
        if (isValidAttack && !selUnit.attacked) {
          const newGrid = grid.map(r => r.map(c => ({ ...c, unit: c.unit ? { ...c.unit } : null })));
          const target = newGrid[row][col].unit!;
          target.hp -= selUnit.attack;
          if (target.hp <= 0) { newGrid[row][col].unit = null; setScore(s => s + 10); addLog(`Enemy ${target.type} destroyed! +10`); }
          else addLog(`Hit ${target.type} for ${selUnit.attack} dmg!`);
          newGrid[sr][sc].unit = { ...selUnit, attacked: true };
          setGrid(newGrid);
          setSelected(null);
          setPhase('move');
          return;
        }
      }

      // Select different unit
      if (unit?.team === 'player') {
        setSelected([row, col]);
        setPhase('move');
        addLog(`Selected ${unit.type}`);
        return;
      }
      setSelected(null);
      setPhase('move');
    } else {
      if (unit?.team === 'player') {
        setSelected([row, col]);
        addLog(`Selected ${unit.type} — click to move or attack`);
      }
    }
  }, [grid, selected, phase, turn, gameState, getValidMoves, getValidAttacks, addLog]);

  const endTurn = useCallback(() => {
    if (turn !== 'player') return;
    endPlayerTurn(grid);
  }, [turn, grid, endPlayerTurn]);

  const restart = useCallback(() => {
    setGrid(initGrid());
    setSelected(null);
    setTurn('player');
    setPhase('move');
    setGameState('playing');
    setLog(['Your turn! Select a unit.']);
    setScore(0);
  }, []);

  const validMoves = selected ? getValidMoves(grid, selected[0], selected[1]) : [];
  const validAttacks = selected ? getValidAttacks(grid, selected[0], selected[1]) : [];

  return (
    <div className="flex flex-col items-center gap-4 select-none p-4">
      <div className="flex items-center gap-6 mb-2">
        <span className="font-arcade text-cyan-400 text-sm" style={{ textShadow: '0 0 8px #22d3ee' }}>GRID WARS</span>
        <span className="font-arcade text-yellow-400 text-xs">SCORE: {score}</span>
        <span className={`font-arcade text-xs ${turn === 'player' ? 'text-cyan-400' : 'text-red-400'}`}>
          {turn === 'player' ? '⚡ YOUR TURN' : '⏳ ENEMY'}
        </span>
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="border-2 border-cyan-500/40 rounded-lg overflow-hidden" style={{ boxShadow: '0 0 20px rgba(34,211,238,0.2)' }}>
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => {
                const isSelected = selected?.[0] === r && selected?.[1] === c;
                const isValidMove = phase === 'move' && validMoves.some(([mr, mc]) => mr === r && mc === c);
                const isValidAttack = phase === 'attack' && validAttacks.some(([ar, ac]) => ar === r && ac === c);
                const unit = cell.unit;
                const stats = unit ? UNIT_STATS[unit.type] : null;

                return (
                  <div
                    key={c}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-14 h-14 border border-cyan-900/40 flex flex-col items-center justify-center cursor-pointer transition-all relative
                      ${isSelected ? 'bg-cyan-500/30 border-cyan-400' : ''}
                      ${isValidMove ? 'bg-green-500/20 border-green-400/60' : ''}
                      ${isValidAttack ? 'bg-red-500/20 border-red-400/60' : ''}
                      ${!isSelected && !isValidMove && !isValidAttack ? 'bg-slate-900/50 hover:bg-slate-800/50' : ''}
                    `}
                    style={{
                      boxShadow: isSelected ? '0 0 10px rgba(34,211,238,0.5)' : isValidAttack ? '0 0 8px rgba(244,63,94,0.4)' : undefined,
                    }}
                  >
                    {unit && (
                      <>
                        <span className="text-lg leading-none">{stats?.symbol}</span>
                        <div className="w-8 h-1 bg-gray-700 rounded mt-1">
                          <div
                            className="h-full rounded transition-all"
                            style={{
                              width: `${(unit.hp / unit.maxHp) * 100}%`,
                              backgroundColor: unit.team === 'player' ? '#22d3ee' : '#f43f5e',
                              boxShadow: `0 0 4px ${unit.team === 'player' ? '#22d3ee' : '#f43f5e'}`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-arcade" style={{ color: unit.team === 'player' ? '#22d3ee' : '#f43f5e', fontSize: '6px' }}>
                          {unit.team === 'player' ? 'P' : 'E'}
                        </span>
                      </>
                    )}
                    {isValidMove && !unit && <div className="w-3 h-3 rounded-full bg-green-400/60 animate-pulse" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-3 w-48">
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-lg p-3">
            <p className="font-arcade text-cyan-400 text-xs mb-2">LEGEND</p>
            {Object.entries(UNIT_STATS).map(([type, stats]) => (
              <div key={type} className="flex items-center gap-2 mb-1">
                <span className="text-sm">{stats.symbol}</span>
                <div>
                  <p className="font-rajdhani text-xs" style={{ color: stats.color }}>{type.toUpperCase()}</p>
                  <p className="font-rajdhani text-xs text-gray-400">HP:{stats.hp} ATK:{stats.attack} RNG:{stats.range}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-lg p-3 flex-1">
            <p className="font-arcade text-cyan-400 text-xs mb-2">LOG</p>
            {log.map((msg, i) => (
              <p key={i} className="font-rajdhani text-xs text-gray-300 mb-1 opacity-" style={{ opacity: 1 - i * 0.2 }}>{msg}</p>
            ))}
          </div>

          <button
            onClick={endTurn}
            disabled={turn !== 'player'}
            className="font-arcade text-xs bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white py-2 px-3 rounded border border-cyan-400 transition-all"
            style={{ boxShadow: '0 0 10px rgba(34,211,238,0.3)' }}
          >
            END TURN
          </button>
        </div>
      </div>

      {/* Phase indicator */}
      {selected && (
        <div className="flex gap-3">
          <span className={`font-arcade text-xs px-3 py-1 rounded border ${phase === 'move' ? 'border-green-400 text-green-400 bg-green-900/30' : 'border-gray-600 text-gray-500'}`}>MOVE</span>
          <span className={`font-arcade text-xs px-3 py-1 rounded border ${phase === 'attack' ? 'border-red-400 text-red-400 bg-red-900/30' : 'border-gray-600 text-gray-500'}`}>ATTACK</span>
        </div>
      )}

      {/* Game over overlay */}
      {gameState !== 'playing' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl p-8 text-center" style={{ boxShadow: '0 0 40px rgba(34,211,238,0.4)' }}>
            <h2 className="font-arcade text-2xl mb-2" style={{ color: gameState === 'won' ? '#4ade80' : '#f43f5e', textShadow: `0 0 20px ${gameState === 'won' ? '#4ade80' : '#f43f5e'}` }}>
              {gameState === 'won' ? 'VICTORY!' : 'DEFEATED!'}
            </h2>
            <p className="font-arcade text-yellow-400 text-sm mb-6">SCORE: {score}</p>
            <button onClick={restart} className="font-arcade text-sm bg-cyan-700 hover:bg-cyan-600 text-white px-6 py-3 rounded border border-cyan-400 transition-all">
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

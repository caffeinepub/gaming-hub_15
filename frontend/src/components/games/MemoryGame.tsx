import { useState, useEffect, useCallback } from 'react';

const SYMBOLS = ['⚡', '🔥', '💎', '🌙', '⭐', '🎯', '🚀', '🎮'];
const COLORS = ['#ff2d78', '#ff8c00', '#00f5ff', '#c542f5', '#39ff14', '#f5e642', '#ff6b6b', '#00bfff'];

type Card = { id: number; symbol: string; color: string; flipped: boolean; matched: boolean };

function makeCards(): Card[] {
  const cards: Card[] = [];
  SYMBOLS.forEach((sym, i) => {
    cards.push({ id: i * 2, symbol: sym, color: COLORS[i], flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, symbol: sym, color: COLORS[i], flipped: false, matched: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(makeCards());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive || won) return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, won]);

  const handleClick = useCallback((idx: number) => {
    if (locked || cards[idx].flipped || cards[idx].matched) return;
    if (!timerActive) setTimerActive(true);

    const newCards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, idx];
    setCards(newCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      if (newCards[a].symbol === newCards[b].symbol) {
        const matched = newCards.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c);
        setTimeout(() => {
          setCards(matched);
          setFlipped([]);
          setLocked(false);
          if (matched.every(c => c.matched)) setWon(true);
        }, 400);
      } else {
        setTimeout(() => {
          setCards(newCards.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c));
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  }, [cards, flipped, locked, timerActive]);

  const restart = useCallback(() => {
    setCards(makeCards());
    setFlipped([]);
    setMoves(0);
    setWon(false);
    setLocked(false);
    setTime(0);
    setTimerActive(false);
  }, []);

  const matched = cards.filter(c => c.matched).length / 2;

  return (
    <div className="flex flex-col items-center gap-4 p-4 select-none">
      {/* Stats */}
      <div className="flex items-center gap-8 font-orbitron text-sm">
        <div className="flex items-center gap-2"><span className="text-foreground/50">MOVES</span><span className="neon-text-cyan font-bold text-lg">{moves}</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">PAIRS</span><span className="neon-text-green font-bold text-lg">{matched}/8</span></div>
        <div className="flex items-center gap-2"><span className="text-foreground/50">TIME</span><span className="neon-text-yellow font-bold text-lg">{time}s</span></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => handleClick(idx)}
            className="relative w-16 h-20 rounded-lg border transition-all duration-300 font-arcade text-2xl"
            style={{
              borderColor: card.matched ? card.color : card.flipped ? card.color : 'rgba(255,255,255,0.15)',
              background: card.matched
                ? `${card.color}22`
                : card.flipped
                ? `${card.color}15`
                : 'rgba(20,20,40,0.8)',
              boxShadow: card.matched
                ? `0 0 12px ${card.color}66, 0 0 24px ${card.color}33`
                : card.flipped
                ? `0 0 8px ${card.color}44`
                : 'none',
              transform: card.flipped || card.matched ? 'scale(1.05)' : 'scale(1)',
              cursor: card.matched ? 'default' : 'pointer',
            }}
          >
            {(card.flipped || card.matched) ? (
              <span style={{ color: card.color, filter: `drop-shadow(0 0 6px ${card.color})` }}>
                {card.symbol}
              </span>
            ) : (
              <span className="text-foreground/20 text-lg">?</span>
            )}
          </button>
        ))}
      </div>

      {/* Win overlay */}
      {won && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-50 gap-6">
          <div className="font-arcade text-2xl neon-text-green">YOU WIN!</div>
          <div className="font-orbitron text-sm text-foreground/70 text-center">
            <div>Moves: <span className="neon-text-cyan">{moves}</span></div>
            <div>Time: <span className="neon-text-yellow">{time}s</span></div>
          </div>
          <button onClick={restart} className="px-8 py-4 font-orbitron font-bold text-sm border border-neon-green/50 bg-neon-green/10 text-neon-green rounded hover:bg-neon-green/20 transition-all" style={{ boxShadow: '0 0 15px rgba(57,255,20,0.4)' }}>
            PLAY AGAIN
          </button>
        </div>
      )}

      <button onClick={restart} className="px-4 py-2 font-orbitron text-xs border border-border/50 text-foreground/50 rounded hover:border-neon-pink/40 hover:text-neon-pink transition-all">
        RESTART
      </button>
    </div>
  );
}

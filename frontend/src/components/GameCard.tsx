import { useNavigate } from '@tanstack/react-router';
import { Play, Zap } from 'lucide-react';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailPath: string;
  genre: string;
  accentColor: 'green' | 'pink' | 'yellow' | 'cyan';
  delay?: number;
}

const accentStyles = {
  green: {
    border: 'hover:border-neon-green/60',
    glow: 'hover:shadow-neon-green',
    badge: 'bg-neon-green/10 text-neon-green border-neon-green/30',
    button: 'bg-neon-green/10 hover:bg-neon-green/20 text-neon-green border-neon-green/40 hover:border-neon-green/80 hover:shadow-neon-green',
    icon: 'text-neon-green',
    overlay: 'from-neon-green/20',
  },
  pink: {
    border: 'hover:border-neon-pink/60',
    glow: 'hover:shadow-neon-pink',
    badge: 'bg-neon-pink/10 text-neon-pink border-neon-pink/30',
    button: 'bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink border-neon-pink/40 hover:border-neon-pink/80 hover:shadow-neon-pink',
    icon: 'text-neon-pink',
    overlay: 'from-neon-pink/20',
  },
  yellow: {
    border: 'hover:border-neon-yellow/60',
    glow: 'hover:shadow-neon-yellow',
    badge: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30',
    button: 'bg-neon-yellow/10 hover:bg-neon-yellow/20 text-neon-yellow border-neon-yellow/40 hover:border-neon-yellow/80 hover:shadow-neon-yellow',
    icon: 'text-neon-yellow',
    overlay: 'from-neon-yellow/20',
  },
  cyan: {
    border: 'hover:border-neon-cyan/60',
    glow: 'hover:shadow-neon-cyan',
    badge: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
    button: 'bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 hover:border-neon-cyan/80 hover:shadow-neon-cyan',
    icon: 'text-neon-cyan',
    overlay: 'from-neon-cyan/20',
  },
};

export default function GameCard({ id, title, description, thumbnailPath, genre, accentColor, delay = 0 }: GameCardProps) {
  const navigate = useNavigate();
  const styles = accentStyles[accentColor];

  return (
    <div
      className={`group relative flex flex-col rounded-lg border border-border/50 bg-card overflow-hidden cursor-pointer transition-all duration-300 ${styles.border} ${styles.glow} hover:-translate-y-1 hover:shadow-card-hover animate-slide-in-up`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => navigate({ to: '/play/$gameId', params: { gameId: id } })}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video">
        <img
          src={thumbnailPath}
          alt={`${title} thumbnail`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t ${styles.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center backdrop-blur-sm bg-background/40 ${styles.border.replace('hover:', '')}`}
            style={{ borderColor: 'currentColor' }}>
            <Play size={24} className={`${styles.icon} ml-1`} fill="currentColor" />
          </div>
        </div>
        {/* Genre badge */}
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-orbitron font-bold border ${styles.badge}`}>
          {genre}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-orbitron font-bold text-lg text-foreground group-hover:text-neon-green transition-colors duration-200 leading-tight">
            {title}
          </h3>
          <p className="mt-1.5 text-sm font-rajdhani text-foreground/60 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Play button */}
        <button
          className={`mt-auto w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded border font-orbitron font-bold text-sm transition-all duration-200 ${styles.button}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: '/play/$gameId', params: { gameId: id } });
          }}
        >
          <Zap size={14} />
          PLAY NOW
        </button>
      </div>
    </div>
  );
}

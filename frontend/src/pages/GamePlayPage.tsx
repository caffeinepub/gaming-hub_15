import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Maximize2 } from 'lucide-react';

const gameData: Record<string, { title: string; url: string; color: string; description: string }> = {
  'subway-surfers': {
    title: 'Subway Surfers',
    url: 'https://poki.com/en/g/subway-surfers',
    color: 'neon-green',
    description: 'Endless runner — dodge trains and collect coins!',
  },
  'slope': {
    title: 'Slope',
    url: 'https://slope-game.github.io',
    color: 'neon-cyan',
    description: 'Guide a ball down an endless neon slope!',
  },
  '1v1lol': {
    title: '1v1.lol',
    url: 'https://1v1.lol',
    color: 'neon-pink',
    description: 'Build and battle in this intense 1v1 arena!',
  },
  'flappy-bird': {
    title: 'Flappy Bird',
    url: 'https://flappybird.io',
    color: 'neon-yellow',
    description: 'Tap to fly through the pipes!',
  },
  'fortnite': {
    title: 'Fortnite',
    url: 'https://www.xbox.com/en-US/play/games/fortnite/BT5P2X999VH2',
    color: 'neon-cyan',
    description: 'Drop in and be the last one standing!',
  },
  'brawl-stars': {
    title: 'Brawl Stars',
    url: 'https://brawlstars.com',
    color: 'neon-pink',
    description: 'Fast-paced 3v3 multiplayer brawls!',
  },
  'clash-of-clans': {
    title: 'Clash of Clans',
    url: 'https://clashofclans.com',
    color: 'neon-yellow',
    description: 'Build your village and lead your clan to glory!',
  },
  'minecraft': {
    title: 'Minecraft',
    url: 'https://classic.minecraft.net',
    color: 'neon-green',
    description: 'Mine, craft, and build anything you imagine!',
  },
  'fifa-26': {
    title: 'FIFA 26',
    url: 'https://www.ea.com/games/ea-sports-fc/fc-26',
    color: 'neon-cyan',
    description: 'Experience the beautiful game like never before!',
  },
  'geometry-dash': {
    title: 'Geometry Dash',
    url: 'https://geometrydash.io',
    color: 'neon-pink',
    description: 'Jump and fly through rhythm-based danger!',
  },
  'roblox': {
    title: 'Roblox',
    url: 'https://www.roblox.com/games',
    color: 'neon-yellow',
    description: 'Dive into millions of player-created worlds!',
  },
};

const colorStyles: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  'neon-green': {
    text: 'text-neon-green',
    border: 'border-neon-green/40',
    bg: 'bg-neon-green/10',
    glow: '0 0 15px oklch(0.88 0.28 142 / 0.3)',
  },
  'neon-cyan': {
    text: 'text-neon-cyan',
    border: 'border-neon-cyan/40',
    bg: 'bg-neon-cyan/10',
    glow: '0 0 15px oklch(0.82 0.2 200 / 0.3)',
  },
  'neon-pink': {
    text: 'text-neon-pink',
    border: 'border-neon-pink/40',
    bg: 'bg-neon-pink/10',
    glow: '0 0 15px oklch(0.72 0.28 330 / 0.3)',
  },
  'neon-yellow': {
    text: 'text-neon-yellow',
    border: 'border-neon-yellow/40',
    bg: 'bg-neon-yellow/10',
    glow: '0 0 15px oklch(0.92 0.22 100 / 0.3)',
  },
};

export default function GamePlayPage() {
  const { gameId } = useParams({ from: '/play/$gameId' });
  const navigate = useNavigate();

  const game = gameData[gameId];

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="font-arcade text-2xl neon-text-pink">GAME NOT FOUND</div>
        <p className="font-rajdhani text-lg text-foreground/60">The game you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 px-6 py-3 rounded border border-neon-green/40 bg-neon-green/10 text-neon-green font-orbitron font-bold text-sm hover:bg-neon-green/20 transition-all duration-200"
        >
          <ArrowLeft size={16} />
          BACK TO HOME
        </button>
      </div>
    );
  }

  const styles = colorStyles[game.color];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Game toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-border/50 bg-background/50 text-foreground/70 hover:text-neon-green hover:border-neon-green/40 font-orbitron font-bold text-xs transition-all duration-200"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">BACK</span>
          </button>

          <div className="h-5 w-px bg-border/50" />

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${styles.bg} border ${styles.border} animate-pulse`} />
            <span className={`font-orbitron font-bold text-sm ${styles.text}`}>{game.title}</span>
            <span className="hidden sm:inline font-rajdhani text-sm text-foreground/40">— {game.description}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border/50 bg-background/50 text-foreground/50 hover:text-foreground/80 font-orbitron text-xs transition-all duration-200"
            title="Open in new tab"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">OPEN TAB</span>
          </a>
          <button
            onClick={() => {
              const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
              iframe?.requestFullscreen?.();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border ${styles.border} ${styles.bg} ${styles.text} font-orbitron text-xs transition-all duration-200 hover:opacity-80`}
            title="Fullscreen"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">FULLSCREEN</span>
          </button>
        </div>
      </div>

      {/* iframe container */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Neon border glow */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ boxShadow: `inset 0 0 30px ${styles.glow}` }}
        />
        <iframe
          id="game-iframe"
          src={game.url}
          title={game.title}
          className="w-full h-full border-0"
          allow="fullscreen; autoplay; encrypted-media; gamepad"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-top-navigation"
        />
      </div>
    </div>
  );
}

import GameCard from './GameCard';

const GAMES = [
  {
    id: 'shadow-run',
    title: 'Shadow Run',
    description: 'Sprint through neon-lit shadows, dodge obstacles, and collect power-ups in this endless runner.',
    genre: 'Runner',
    thumbnailPath: '/assets/generated/game-cover-shadow-run.dim_400x300.png',
    accentColor: 'green' as const,
  },
  {
    id: 'prism-jump',
    title: 'Prism Jump',
    description: 'Navigate a glowing ball through prismatic tunnels at breakneck speed.',
    genre: 'Arcade',
    thumbnailPath: '/assets/generated/game-cover-prism-jump.dim_400x300.png',
    accentColor: 'cyan' as const,
  },
  {
    id: 'cyber-strike',
    title: 'Cyber Strike',
    description: 'Engage in tactical cyber warfare with precision shooting and strategic movement.',
    genre: 'Shooter',
    thumbnailPath: '/assets/generated/game-cover-cyber-strike.dim_400x300.png',
    accentColor: 'pink' as const,
  },
  {
    id: 'pixel-voyage',
    title: 'Pixel Voyage',
    description: 'Pilot your pixel ship through treacherous skies, avoiding obstacles in this addictive flyer.',
    genre: 'Arcade',
    thumbnailPath: '/assets/generated/game-cover-pixel-voyage.dim_400x300.png',
    accentColor: 'green' as const,
  },
  {
    id: 'arena-blitz',
    title: 'Arena Blitz',
    description: 'Dominate the arena in fast-paced combat. Defeat waves of enemies to claim victory.',
    genre: 'Action',
    thumbnailPath: '/assets/generated/game-cover-arena-blitz.dim_400x300.png',
    accentColor: 'pink' as const,
  },
  {
    id: 'grid-wars',
    title: 'Grid Wars',
    description: 'Command your units on a neon grid battlefield in this strategic warfare game.',
    genre: 'Strategy',
    thumbnailPath: '/assets/generated/game-cover-grid-wars.dim_400x300.png',
    accentColor: 'cyan' as const,
  },
  {
    id: 'rune-quest',
    title: 'Rune Quest',
    description: 'Harness ancient rune magic to defeat enemies and solve mystical puzzles.',
    genre: 'RPG',
    thumbnailPath: '/assets/generated/game-cover-rune-quest.dim_400x300.png',
    accentColor: 'yellow' as const,
  },
  {
    id: 'voxel-realms',
    title: 'Voxel Realms',
    description: 'Build, explore, and defend your voxel kingdom against waves of invaders.',
    genre: 'Builder',
    thumbnailPath: '/assets/generated/game-cover-voxel-realms.dim_400x300.png',
    accentColor: 'green' as const,
  },
  {
    id: 'neon-kick',
    title: 'Neon Kick',
    description: 'Score goals in this electrifying neon soccer game with physics-based gameplay.',
    genre: 'Sports',
    thumbnailPath: '/assets/generated/game-cover-neon-kick.dim_400x300.png',
    accentColor: 'yellow' as const,
  },
  {
    id: 'stellar-assault',
    title: 'Stellar Assault',
    description: 'Blast through asteroid fields and enemy fleets in this rhythm-based space shooter.',
    genre: 'Shooter',
    thumbnailPath: '/assets/generated/game-cover-stellar-assault.dim_400x300.png',
    accentColor: 'pink' as const,
  },
  {
    id: 'neon-racers',
    title: 'Neon Racers',
    description: 'Race at hypersonic speeds through neon circuits in this adrenaline-fueled racer.',
    genre: 'Racing',
    thumbnailPath: '/assets/generated/game-cover-neon-racers.dim_400x300.png',
    accentColor: 'yellow' as const,
  },
];

export default function GameLibrary() {
  return (
    <section id="games" className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 mb-4">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="font-orbitron text-xs font-bold text-neon-green tracking-widest">GAME LIBRARY</span>
          </div>
          <h2 className="font-orbitron font-black text-3xl sm:text-4xl text-foreground">
            CHOOSE YOUR{' '}
            <span className="neon-text-pink">GAME</span>
          </h2>
          <p className="mt-3 font-rajdhani text-lg text-foreground/50 max-w-xl mx-auto">
            All games run natively — no downloads, no plugins, no iframes.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {GAMES.map((game, index) => (
            <GameCard key={game.id} {...game} delay={index * 60} />
          ))}
        </div>
      </div>
    </section>
  );
}

import GameCard from './GameCard';

const games = [
  {
    id: 'subway-surfers',
    title: 'Subway Surfers',
    description: 'Dash through the subway, dodge trains, and collect coins in this endless runner sensation. How far can you go?',
    thumbnailPath: '/assets/generated/subway-surfers-thumb.dim_400x250.png',
    genre: 'RUNNER',
    accentColor: 'green' as const,
  },
  {
    id: 'slope',
    title: 'Slope',
    description: 'Guide a ball down an endless neon slope at breakneck speed. Dodge obstacles and survive as long as possible!',
    thumbnailPath: '/assets/generated/slope-thumb.dim_400x250.png',
    genre: 'ARCADE',
    accentColor: 'cyan' as const,
  },
  {
    id: '1v1lol',
    title: '1v1.lol',
    description: 'Build, shoot, and outplay your opponent in this intense 1v1 battle arena. Master building mechanics to dominate!',
    thumbnailPath: '/assets/generated/1v1lol-thumb.dim_400x250.png',
    genre: 'BATTLE',
    accentColor: 'pink' as const,
  },
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    description: 'Tap to keep your bird airborne and navigate through the pipes. Simple to learn, impossible to master!',
    thumbnailPath: '/assets/generated/flappy-bird-thumb.dim_400x250.png',
    genre: 'CASUAL',
    accentColor: 'yellow' as const,
  },
  {
    id: 'fortnite',
    title: 'Fortnite',
    description: 'Drop into the island, build your way to victory, and be the last one standing in this iconic battle royale!',
    thumbnailPath: '/assets/generated/fortnite-thumb.dim_400x225.png',
    genre: 'BATTLE ROYALE',
    accentColor: 'cyan' as const,
  },
  {
    id: 'brawl-stars',
    title: 'Brawl Stars',
    description: 'Fast-paced 3v3 multiplayer brawls! Collect and upgrade unique brawlers, unlock new abilities, and dominate the arena.',
    thumbnailPath: '/assets/generated/brawlstars-thumb.dim_400x225.png',
    genre: 'MOBA',
    accentColor: 'pink' as const,
  },
  {
    id: 'clash-of-clans',
    title: 'Clash of Clans',
    description: 'Build your village, raise a clan, and compete in epic clan wars. Train troops and lead your clan to glory!',
    thumbnailPath: '/assets/generated/clashofclans-thumb.dim_400x225.png',
    genre: 'STRATEGY',
    accentColor: 'yellow' as const,
  },
  {
    id: 'minecraft',
    title: 'Minecraft',
    description: 'Mine, craft, and build anything you can imagine in this legendary sandbox world. Survival or creative — your choice!',
    thumbnailPath: '/assets/generated/minecraft-thumb.dim_400x225.png',
    genre: 'SANDBOX',
    accentColor: 'green' as const,
  },
  {
    id: 'fifa-26',
    title: 'FIFA 26',
    description: 'Experience the beautiful game like never before. Play with your favorite clubs and stars in the ultimate football sim!',
    thumbnailPath: '/assets/generated/fifa26-thumb.dim_400x225.png',
    genre: 'SPORTS',
    accentColor: 'cyan' as const,
  },
  {
    id: 'geometry-dash',
    title: 'Geometry Dash',
    description: 'Jump and fly your way through danger in this rhythm-based action platformer. Can you beat every level?',
    thumbnailPath: '/assets/generated/geometrydash-thumb.dim_400x225.png',
    genre: 'RHYTHM',
    accentColor: 'pink' as const,
  },
];

export default function GameLibrary() {
  return (
    <section id="games" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
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
            Pick a game and start playing instantly — no downloads, no installs.
          </p>
        </div>

        {/* Game grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              {...game}
              delay={index * 80}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

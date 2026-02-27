import { useNavigate } from '@tanstack/react-router';
import { Zap, ChevronDown } from 'lucide-react';
import GameLibrary from '../components/GameLibrary';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        {/* Scanlines */}
        <div className="absolute inset-0 scanlines" />

        {/* Radial glow effects */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, oklch(0.88 0.28 142 / 0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, oklch(0.72 0.28 330 / 0.05) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="animate-float">
            <img
              src="/assets/generated/arcade-hub-logo.dim_256x256.png"
              alt="Arcade Hub"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
              style={{ filter: 'drop-shadow(0 0 20px oklch(0.88 0.28 142 / 0.6))' }}
            />
          </div>

          {/* Title */}
          <div>
            <h1 className="font-arcade text-3xl sm:text-5xl lg:text-6xl leading-tight">
              <span className="neon-text-green animate-pulse-neon block">ARCADE</span>
              <span className="neon-text-pink block mt-2">HUB</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="font-orbitron text-base sm:text-xl font-semibold text-foreground/70 max-w-2xl tracking-wide">
            YOUR ULTIMATE{' '}
            <span className="neon-text-yellow">GAMING</span>{' '}
            DESTINATION
          </p>

          <p className="font-rajdhani text-lg text-foreground/50 max-w-lg">
            Play your favorite browser games instantly. No downloads, no sign-ups — just pure gaming fun.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded font-orbitron font-bold text-sm tracking-wider border border-neon-green/60 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 hover:border-neon-green transition-all duration-200"
              style={{ boxShadow: '0 0 15px oklch(0.88 0.28 142 / 0.2)' }}
            >
              <Zap size={16} />
              PLAY NOW
            </button>
            <button
              onClick={() => navigate({ to: '/play/$gameId', params: { gameId: 'subway-surfers' } })}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded font-orbitron font-bold text-sm tracking-wider border border-neon-pink/40 bg-neon-pink/5 text-neon-pink hover:bg-neon-pink/15 hover:border-neon-pink/70 transition-all duration-200"
            >
              FEATURED GAME
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-4 pt-4 border-t border-border/30 w-full max-w-sm justify-center">
            {[
              { value: '4', label: 'GAMES' },
              { value: '0', label: 'DOWNLOADS' },
              { value: '∞', label: 'FUN' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-arcade text-xl neon-text-green">{stat.value}</div>
                <div className="font-orbitron text-xs text-foreground/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-foreground/30 hover:text-neon-green transition-colors duration-200 animate-bounce"
        >
          <span className="font-orbitron text-xs">SCROLL</span>
          <ChevronDown size={20} />
        </button>
      </section>

      {/* Game Library */}
      <GameLibrary />

      {/* Bottom CTA banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-lg border border-neon-green/20 bg-card overflow-hidden p-8 sm:p-12 text-center"
            style={{ boxShadow: '0 0 40px oklch(0.88 0.28 142 / 0.05)' }}
          >
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="relative z-10">
              <h2 className="font-arcade text-xl sm:text-2xl neon-text-green mb-4">
                READY TO PLAY?
              </h2>
              <p className="font-rajdhani text-lg text-foreground/60 mb-6 max-w-md mx-auto">
                Jump into any game instantly. All games run directly in your browser — no installation needed.
              </p>
              <button
                onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded font-orbitron font-bold text-sm tracking-wider border border-neon-green/60 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 hover:border-neon-green transition-all duration-200"
                style={{ boxShadow: '0 0 15px oklch(0.88 0.28 142 / 0.2)' }}
              >
                <Zap size={16} />
                BROWSE GAMES
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

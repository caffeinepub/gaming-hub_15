import { Link, useNavigate } from '@tanstack/react-router';
import { Gamepad2, Home, Grid3X3 } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neon-green/20 bg-background/90 backdrop-blur-md"
      style={{ boxShadow: '0 1px 0 oklch(0.88 0.28 142 / 0.2), 0 4px 20px oklch(0 0 0 / 0.5)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex-shrink-0">
              <img
                src="/assets/generated/arcade-hub-logo.dim_256x256.png"
                alt="Arcade Hub Logo"
                className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-200"
                style={{ filter: 'drop-shadow(0 0 8px oklch(0.88 0.28 142 / 0.7))' }}
              />
            </div>
            <span
              className="font-arcade text-sm neon-text-green hidden sm:block"
              style={{ letterSpacing: '0.05em' }}
            >
              ARCADE HUB
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-orbitron font-semibold text-foreground/70 hover:text-neon-green transition-colors duration-200 hover:bg-neon-green/5"
            >
              <Home size={16} />
              <span className="hidden sm:inline">HOME</span>
            </Link>
            <button
              onClick={() => {
                navigate({ to: '/' });
                setTimeout(() => {
                  document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-orbitron font-semibold text-foreground/70 hover:text-neon-pink transition-colors duration-200 hover:bg-neon-pink/5"
            >
              <Grid3X3 size={16} />
              <span className="hidden sm:inline">GAMES</span>
            </button>
            <div className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded border border-neon-green/30 bg-neon-green/5">
              <Gamepad2 size={16} className="text-neon-green" />
              <span className="font-orbitron text-xs font-bold text-neon-green">11 GAMES</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

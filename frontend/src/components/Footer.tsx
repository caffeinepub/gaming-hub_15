import { Heart, Gamepad2 } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'arcade-hub');

  return (
    <footer className="border-t border-neon-green/10 bg-background/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-4">
          {/* Logo row */}
          <div className="flex items-center gap-3">
            <Gamepad2 size={20} className="text-neon-green" style={{ filter: 'drop-shadow(0 0 6px oklch(0.88 0.28 142 / 0.7))' }} />
            <span className="font-arcade text-xs neon-text-green">ARCADE HUB</span>
          </div>

          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-neon-green/30 to-transparent" />

          {/* Games list */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-orbitron text-foreground/40 max-w-2xl">
            <span>Subway Surfers</span>
            <span className="text-neon-green/30">•</span>
            <span>Slope</span>
            <span className="text-neon-green/30">•</span>
            <span>1v1.lol</span>
            <span className="text-neon-green/30">•</span>
            <span>Flappy Bird</span>
            <span className="text-neon-green/30">•</span>
            <span>Fortnite</span>
            <span className="text-neon-green/30">•</span>
            <span>Brawl Stars</span>
            <span className="text-neon-green/30">•</span>
            <span>Clash of Clans</span>
            <span className="text-neon-green/30">•</span>
            <span>Minecraft</span>
            <span className="text-neon-green/30">•</span>
            <span>FIFA 26</span>
            <span className="text-neon-green/30">•</span>
            <span>Geometry Dash</span>
            <span className="text-neon-green/30">•</span>
            <span>Roblox</span>
          </div>

          {/* Attribution */}
          <p className="text-xs text-foreground/30 font-rajdhani flex items-center gap-1.5">
            © {year} Arcade Hub · Built with{' '}
            <Heart size={12} className="text-neon-pink inline" style={{ filter: 'drop-shadow(0 0 4px oklch(0.72 0.28 330 / 0.8))' }} />
            {' '}using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan hover:text-neon-green transition-colors duration-200 underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
